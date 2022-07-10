#pragma once

#include <functional>

#include "blocks.hpp"
#include "noise-chunk.fwd.hpp"
#include "noise/normal-noise.hpp"
#include "pos.hpp"
#include "random.hpp"

using namespace std;

class DimensionType {
public:
    static const int32_t BITS_FOR_Y = BlockPos::PACKED_Y_LENGTH;
    static const int32_t MIN_HEIGHT = 16;
    static const int32_t Y_SIZE = (1 << BITS_FOR_Y) - 32;
    static const int32_t MAX_Y = (Y_SIZE >> 1) - 1;
    static const int32_t MIN_Y = MAX_Y - Y_SIZE + 1;
    static const int32_t WAY_ABOVE_MAX_Y = MAX_Y << 4;
    static const int32_t WAY_BELOW_MIN_Y = MIN_Y << 4;
};

class FluidStatus {
public:
    int32_t fluidLevel;
    BlockState fluidType;

    FluidStatus(int32_t fluidLevel, BlockState fluidType) {
        this->fluidLevel = fluidLevel;
        this->fluidType = fluidType;
    }

    BlockState at(int32_t y) {
        return y < this->fluidLevel ? this->fluidType : Blocks::AIR;
    }
};

class FluidPicker {
public:
    virtual FluidStatus *computeFluid(int32_t x, int32_t y, int32_t z) = 0;
};

class Aquifer {
public:
    typedef FluidStatus FluidStatus;
    typedef FluidPicker FluidPicker;

    static Aquifer *create(NoiseChunk *noiseChunk, ChunkPos *chunkPos, NormalNoise *barrierNoise,
                           NormalNoise *fluidLevelFloodednessNoise, NormalNoise *fluidLevelSpreadNoise,
                           NormalNoise *lavaNoise, PositionalRandomFactory *positionalRandomFactory, int32_t y,
                           int32_t height, Aquifer::FluidPicker *globalFluidPicker);

    static Aquifer *createDisabled(Aquifer::FluidPicker *globalFluidPicker);

    virtual BlockState computeSubstance(int32_t x, int32_t y, int32_t z, double baseNoise, double clampedBaseNoise) = 0;

    virtual bool shouldScheduleFluidUpdate() = 0;
};

class DisabledAquifer : public Aquifer {
private:
    FluidPicker *globalFluidPicker;

public:
    DisabledAquifer(FluidPicker *globalFluidPicker) {
        this->globalFluidPicker = globalFluidPicker;
    }

    BlockState computeSubstance(int32_t x, int32_t y, int32_t z, double baseNoise, double clampedBaseNoise) override {
        return clampedBaseNoise > 0.0 ? Blocks::NULL_BLOCK : this->globalFluidPicker->computeFluid(x, y, z)->at(y);
    }

    bool shouldScheduleFluidUpdate() override {
        return false;
    }
};

Aquifer *Aquifer::createDisabled(Aquifer::FluidPicker *globalFluidPicker) {
    return new DisabledAquifer(globalFluidPicker);
}

template <class T, std::enable_if_t<std::is_arithmetic_v<T>>...> constexpr auto _abs(T const &x) noexcept {
    return x < 0 ? -x : x;
}

constexpr double NoiseBasedAquifer_similarity(int32_t distanceSq0, int32_t distanceSq1) {
    return 1.0 - (double)_abs(distanceSq1 - distanceSq0) / 25.0;
}

class NoiseBasedAquifer : public Aquifer, public Aquifer::FluidPicker {
private:
    static const int32_t X_RANGE = 10;
    static const int32_t Y_RANGE = 9;
    static const int32_t Z_RANGE = 10;
    static const int32_t X_SEPARATION = 6;
    static const int32_t Y_SEPARATION = 3;
    static const int32_t Z_SEPARATION = 6;
    static const int32_t X_SPACING = 16;
    static const int32_t Y_SPACING = 12;
    static const int32_t Z_SPACING = 16;
    static const int32_t MAX_REASONABLE_DISTANCE_TO_AQUIFER_CENTER = 11;
    static constexpr double FLOWING_UPDATE_SIMULARITY = NoiseBasedAquifer_similarity(Mth::square(10), Mth::square(12));

    NoiseChunk *noiseChunk;
    NormalNoise *barrierNoise;
    NormalNoise *fluidLevelFloodednessNoise;
    NormalNoise *fluidLevelSpreadNoise;
    NormalNoise *lavaNoise;
    PositionalRandomFactory *positionalRandomFactory;
    Aquifer::FluidStatus **aquiferCache;
    int64_t *aquiferLocationCache;
    Aquifer::FluidPicker *globalFluidPicker;
    bool _shouldScheduleFluidUpdate;
    int32_t minGridX;
    int32_t minGridY;
    int32_t minGridZ;
    int32_t gridSizeX;
    int32_t gridSizeZ;

public:
    NoiseBasedAquifer(NoiseChunk *noiseChunk, ChunkPos *chunkPos, NormalNoise *barrierNoise,
                      NormalNoise *fluidLevelFloodednessNoise, NormalNoise *fluidLevelSpreadNoise,
                      NormalNoise *lavaNoise, PositionalRandomFactory *positionalRandomFactory, int32_t y,
                      int32_t height, Aquifer::FluidPicker *globalFluidPicker) {
        this->noiseChunk = noiseChunk;
        this->barrierNoise = barrierNoise;
        this->fluidLevelFloodednessNoise = fluidLevelFloodednessNoise;
        this->fluidLevelSpreadNoise = fluidLevelSpreadNoise;
        this->lavaNoise = lavaNoise;
        this->positionalRandomFactory = positionalRandomFactory;
        this->globalFluidPicker = globalFluidPicker;

        this->minGridX = this->gridX(chunkPos->getMinBlockX()) - 1;
        this->minGridY = this->gridY(y) - 1;
        this->minGridZ = this->gridZ(chunkPos->getMinBlockZ()) - 1;

        int32_t maxGridX = this->gridX(chunkPos->getMaxBlockX()) + 1;
        int32_t maxGridY = this->gridY(y + height) + 1;
        int32_t maxGridZ = this->gridZ(chunkPos->getMaxBlockZ()) + 1;

        this->gridSizeX = maxGridX - this->minGridX + 1;
        int32_t gridSizeY = maxGridY - this->minGridY + 1;
        this->gridSizeZ = maxGridZ - this->minGridZ + 1;

        int32_t gridSize = this->gridSizeX * gridSizeY * this->gridSizeZ;

        this->aquiferCache = new Aquifer::FluidStatus *[gridSize]();
        this->aquiferLocationCache = new int64_t[gridSize];
        fill_n(this->aquiferLocationCache, gridSize, LLONG_MAX);
    }

private:
    int32_t getIndex(int32_t x, int32_t y, int32_t z) {
        int32_t gridX = x - this->minGridX;
        int32_t gridY = y - this->minGridY;
        int32_t gridZ = z - this->minGridZ;
        return (gridY * this->gridSizeZ + gridZ) * this->gridSizeX + gridX;
    }

    BlockState computeSubstance(int32_t x, int32_t y, int32_t z, double baseNoise, double clampedBaseNoise) override {
        if (baseNoise <= -64.0) {
            return this->globalFluidPicker->computeFluid(x, y, z)->at(y);
        } else {
            if (clampedBaseNoise <= 0.0) {
                Aquifer::FluidStatus *fluidStatus = this->globalFluidPicker->computeFluid(x, y, z);
                double clampedMaxPressureMulBySim;
                BlockState blockState;
                bool shouldScheduleFluidUpdate;
                if (fluidStatus->at(y) == Blocks::LAVA) {
                    blockState = Blocks::LAVA;
                    clampedMaxPressureMulBySim = 0.0;
                    shouldScheduleFluidUpdate = false;
                } else {
                    int32_t someX = Mth::floorDiv(x - 5, 16);
                    int32_t someY = Mth::floorDiv(y + 1, 12);
                    int32_t someZ = Mth::floorDiv(z - 5, 16);
                    int32_t minDistanceSq0 = INT_MAX;
                    int32_t minDistanceSq1 = INT_MAX;
                    int32_t minDistanceSq2 = INT_MAX;
                    int64_t minLocation0 = 0LL;
                    int64_t minLocation1 = 0LL;
                    int64_t minLocation2 = 0LL;

                    for (int32_t xOffset = 0; xOffset <= 1; ++xOffset) {
                        for (int32_t yOffset = -1; yOffset <= 1; ++yOffset) {
                            for (int32_t zOffset = 0; zOffset <= 1; ++zOffset) {
                                int32_t currentX = someX + xOffset;
                                int32_t currentY = someY + yOffset;
                                int32_t currentZ = someZ + zOffset;
                                int32_t gridIndex = this->getIndex(currentX, currentY, currentZ);
                                int64_t cachedLocation = this->aquiferLocationCache[gridIndex];
                                int64_t location;
                                if (cachedLocation != LLONG_MAX) {
                                    location = cachedLocation;
                                } else {
                                    RandomSource *randomsource =
                                        this->positionalRandomFactory->at(currentX, currentY, currentZ);
                                    location = BlockPos::asLong(currentX * 16 + randomsource->nextInt(10),
                                                                currentY * 12 + randomsource->nextInt(9),
                                                                currentZ * 16 + randomsource->nextInt(10));
                                    this->aquiferLocationCache[gridIndex] = location;
                                }

                                int32_t dx = BlockPos::getX(location) - x;
                                int32_t dy = BlockPos::getY(location) - y;
                                int32_t dz = BlockPos::getZ(location) - z;
                                int32_t distanceSq = dx * dx + dy * dy + dz * dz;
                                if (minDistanceSq0 >= distanceSq) {
                                    minLocation2 = minLocation1;
                                    minLocation1 = minLocation0;
                                    minLocation0 = location;
                                    minDistanceSq2 = minDistanceSq1;
                                    minDistanceSq1 = minDistanceSq0;
                                    minDistanceSq0 = distanceSq;
                                } else if (minDistanceSq1 >= distanceSq) {
                                    minLocation2 = minLocation1;
                                    minLocation1 = location;
                                    minDistanceSq2 = minDistanceSq1;
                                    minDistanceSq1 = distanceSq;
                                } else if (minDistanceSq2 >= distanceSq) {
                                    minLocation2 = location;
                                    minDistanceSq2 = distanceSq;
                                }
                            }
                        }
                    }

                    Aquifer::FluidStatus *minFluidStatus0 = this->getAquiferStatus(minLocation0);
                    Aquifer::FluidStatus *minFluidStatus1 = this->getAquiferStatus(minLocation1);
                    Aquifer::FluidStatus *minFluidStatus2 = this->getAquiferStatus(minLocation2);
                    double sim01 = similarity(minDistanceSq0, minDistanceSq1);
                    double sim02 = similarity(minDistanceSq0, minDistanceSq2);
                    double sim03 = similarity(minDistanceSq1, minDistanceSq2);
                    shouldScheduleFluidUpdate = sim01 >= FLOWING_UPDATE_SIMULARITY;
                    if (minFluidStatus0->at(y) == Blocks::WATER &&
                        this->globalFluidPicker->computeFluid(x, y - 1, z)->at(y - 1) == Blocks::LAVA) {
                        clampedMaxPressureMulBySim = 1.0;
                    } else if (sim01 > -1.0) {
                        double barrierNoise = NAN;
                        double pressure01 =
                            this->calculatePressure(x, y, z, barrierNoise, minFluidStatus0, minFluidStatus1);
                        double pressure02 =
                            this->calculatePressure(x, y, z, barrierNoise, minFluidStatus0, minFluidStatus2);
                        double pressure12 =
                            this->calculatePressure(x, y, z, barrierNoise, minFluidStatus1, minFluidStatus2);
                        double clampedSim01 = max(0.0, sim01);
                        double clampedSim02 = max(0.0, sim02);
                        double clampedSim12 = max(0.0, sim03);
                        double maxPressureMulBySim =
                            2.0 * clampedSim01 *
                            max(pressure01, max(pressure02 * clampedSim02, pressure12 * clampedSim12));
                        clampedMaxPressureMulBySim = max(0.0, maxPressureMulBySim);
                    } else {
                        clampedMaxPressureMulBySim = 0.0;
                    }

                    blockState = minFluidStatus0->at(y);
                }

                if (clampedBaseNoise + clampedMaxPressureMulBySim <= 0.0) {
                    this->_shouldScheduleFluidUpdate = shouldScheduleFluidUpdate;
                    return blockState;
                }
            }

            this->_shouldScheduleFluidUpdate = false;
            return Blocks::NULL_BLOCK;
        }
    }

public:
    bool shouldScheduleFluidUpdate() override {
        return this->_shouldScheduleFluidUpdate;
    }

private:
    static double similarity(int32_t distanceSq0, int32_t distanceSq1) {
        return NoiseBasedAquifer_similarity(distanceSq0, distanceSq1);
    }

private:
    double calculatePressure(int32_t x, int32_t y, int32_t z, double &savedBarrierNoise,
                             Aquifer::FluidStatus *fluidStart, Aquifer::FluidStatus *fluidEnd) {
        BlockState startBlock = fluidStart->at(y);
        BlockState endBlock = fluidEnd->at(y);
        if ((startBlock != Blocks::LAVA || endBlock != Blocks::WATER) &&
            (startBlock != Blocks::WATER || endBlock != Blocks::LAVA)) {
            int32_t fluidDistance = abs(fluidStart->fluidLevel - fluidEnd->fluidLevel);
            if (fluidDistance == 0) {
                return 0.0;
            } else {
                double fluidMiddleLevel = 0.5 * (double)(fluidStart->fluidLevel + fluidEnd->fluidLevel);
                double distanceAboveFluidMiddleLevel = (double)y + 0.5 - fluidMiddleLevel;
                double halfFluidDistance = (double)fluidDistance / 2.0;
                double distanceToFluidEdge = halfFluidDistance - abs(distanceAboveFluidMiddleLevel);
                double pressure;
                // above middle level
                if (distanceAboveFluidMiddleLevel > 0.0) {
                    double shiftedDistanceToFluidEdge = 0.0 + distanceToFluidEdge;
                    // before the edge
                    if (shiftedDistanceToFluidEdge > 0.0) {
                        pressure = shiftedDistanceToFluidEdge / 1.5;
                    } else {
                        // past the edge
                        pressure = shiftedDistanceToFluidEdge / 2.5;
                    }
                } else {
                    // below middle level
                    double shiftedDistanceToFluidEdge = 3.0 + distanceToFluidEdge;
                    // before the edge
                    if (shiftedDistanceToFluidEdge > 0.0) {
                        pressure = shiftedDistanceToFluidEdge / 3.0;
                    } else {
                        // past the edge
                        pressure = shiftedDistanceToFluidEdge / 10.0;
                    }
                }

                if (!(pressure < -2.0) && !(pressure > 2.0)) {
                    double currentBarrierNoise = savedBarrierNoise;
                    if (isnan(currentBarrierNoise)) {
                        double barrierNoise = this->barrierNoise->getValue((double)x, (double)y * 0.5, (double)z);
                        savedBarrierNoise = barrierNoise;
                        return barrierNoise + pressure;
                    } else {
                        return currentBarrierNoise + pressure;
                    }
                } else {
                    return pressure;
                }
            }
        } else {
            return 1.0;
        }
    }

    int32_t gridX(int32_t x) {
        return Mth::floorDiv(x, NoiseBasedAquifer::X_SPACING);
    }

    int32_t gridY(int32_t y) {
        return Mth::floorDiv(y, NoiseBasedAquifer::Y_SPACING);
    }

    int32_t gridZ(int32_t z) {
        return Mth::floorDiv(z, NoiseBasedAquifer::Z_SPACING);
    }

    Aquifer::FluidStatus *getAquiferStatus(int64_t coord) {
        int32_t x = BlockPos::getX(coord);
        int32_t y = BlockPos::getY(coord);
        int32_t z = BlockPos::getZ(coord);
        int32_t gridX = this->gridX(x);
        int32_t gridY = this->gridY(y);
        int32_t gridZ = this->gridZ(z);
        int32_t gridIndex = this->getIndex(gridX, gridY, gridZ);
        Aquifer::FluidStatus *fluidStatus = this->aquiferCache[gridIndex];
        if (fluidStatus != nullptr) {
            return fluidStatus;
        } else {
            Aquifer::FluidStatus *fluidStatus = this->computeFluid(x, y, z);
            this->aquiferCache[gridIndex] = fluidStatus;
            return fluidStatus;
        }
    }

public:
    Aquifer::FluidStatus *computeFluid(int32_t x, int32_t y, int32_t z) override;

private:
    BlockState getFluidType(int32_t x, int32_t y, int32_t z, Aquifer::FluidStatus *fluidStatus, int32_t fluidY) {
        if (fluidY <= -10) {
            int32_t scaledX = Mth::floorDiv(x, 64);
            int32_t scaledY = Mth::floorDiv(y, 40);
            int32_t scaledZ = Mth::floorDiv(z, 64);
            double lavaNoise = this->lavaNoise->getValue((double)scaledX, (double)scaledY, (double)scaledZ);
            if (abs(lavaNoise) > 0.3) {
                return Blocks::LAVA;
            }
        }

        return fluidStatus->fluidType;
    }
};

Aquifer *Aquifer::create(NoiseChunk *noiseChunk, ChunkPos *chunkPos, NormalNoise *barrierNoise,
                         NormalNoise *fluidLevelFloodednessNoise, NormalNoise *fluidLevelSpreadNoise,
                         NormalNoise *lavaNoise, PositionalRandomFactory *positionalRandomFactory, int32_t y,
                         int32_t height, Aquifer::FluidPicker *globalFluidPicker) {
    return new NoiseBasedAquifer(noiseChunk, chunkPos, barrierNoise, fluidLevelFloodednessNoise, fluidLevelSpreadNoise,
                                 lavaNoise, positionalRandomFactory, y, height, globalFluidPicker);
}