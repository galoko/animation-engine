#include "aquifer.hpp"
#include "noise-chunk.hpp"

constexpr int32_t SURFACE_SAMPLING_OFFSETS_IN_CHUNKS[][2] = {
    {-2, -1}, {-1, -1}, {0, -1}, {1, -1}, {-3, 0}, {-2, 0}, {-1, 0}, {0, 0}, {1, 0}, {-2, 1}, {-1, 1}, {0, 1}, {1, 1}};

Aquifer::FluidStatus *NoiseBasedAquifer::computeFluid(int32_t x, int32_t y, int32_t z) {
    Aquifer::FluidStatus *fluidStatus = this->globalFluidPicker->computeFluid(x, y, z);
    int32_t minSurfaceY = INT_MAX;
    int32_t maxY = y + 12;
    int32_t minY = y - 12;
    bool haveFluidAtMaxSurfaceYinPlace = false;

    for (const int32_t(&offset)[2] : SURFACE_SAMPLING_OFFSETS_IN_CHUNKS) {
        int32_t shiftedX = x + SectionPos::sectionToBlockCoord(offset[0]);
        int32_t shiftedZ = z + SectionPos::sectionToBlockCoord(offset[1]);
        int32_t surfaceY = this->noiseChunk->preliminarySurfaceLevel(shiftedX, shiftedZ);
        int32_t maxSurfaceY = surfaceY + 8;
        bool isOffsetInPlace = offset[0] == 0 && offset[1] == 0;
        if (isOffsetInPlace && minY > maxSurfaceY) {
            return fluidStatus;
        }

        bool isMaxSurfaceYinYRange = maxY > maxSurfaceY;
        if (isMaxSurfaceYinYRange || isOffsetInPlace) {
            Aquifer::FluidStatus *fluidStatus = this->globalFluidPicker->computeFluid(shiftedX, maxSurfaceY, shiftedZ);
            if (fluidStatus->at(maxSurfaceY) != Blocks::AIR) {
                if (isOffsetInPlace) {
                    haveFluidAtMaxSurfaceYinPlace = true;
                }

                if (isMaxSurfaceYinYRange) {
                    return fluidStatus;
                }
            }
        }

        minSurfaceY = min(minSurfaceY, surfaceY);
    }

    int32_t distanceBetweenMinSurfaceYandYPlus8 = minSurfaceY + 8 - y;
    double t = haveFluidAtMaxSurfaceYinPlace
                   ? Mth::clampedMap((double)distanceBetweenMinSurfaceYandYPlus8, 0.0, 64.0, 1.0, 0.0)
                   : 0.0;
    double floodedness =
        Mth::clamp(this->fluidLevelFloodednessNoise->getValue((double)x, (double)y * 0.67, (double)z), -1.0, 1.0);
    double minFloodedness = Mth::map(t, 1.0, 0.0, -0.3, 0.8);
    if (floodedness > minFloodedness) {
        return fluidStatus;
    } else {
        double someFloodedness = Mth::map(t, 1.0, 0.0, -0.8, 0.4);
        if (floodedness <= someFloodedness) {
            return new Aquifer::FluidStatus(DimensionType::WAY_BELOW_MIN_Y, fluidStatus->fluidType);
        } else {
            int32_t scaledX = Mth::floorDiv(x, 16);
            int32_t scaledY = Mth::floorDiv(y, 40);
            int32_t scaledZ = Mth::floorDiv(z, 16);
            int32_t fluidBaseY = scaledY * 40 + 20;
            double fluidLevelSpread =
                this->fluidLevelSpreadNoise->getValue((double)scaledX, (double)scaledY / 1.4, (double)scaledZ) * 10.0;
            int32_t quantizedFluidLevelSpread = Mth::quantize(fluidLevelSpread, 3);
            int32_t fluidY = fluidBaseY + quantizedFluidLevelSpread;
            int32_t fluidLevel = min(minSurfaceY, fluidY);
            BlockState blockstate = this->getFluidType(x, y, z, fluidStatus, fluidY);
            return new Aquifer::FluidStatus(fluidLevel, blockstate);
        }
    }
}