#pragma once

#include <functional>

#include "../../utils/memory-debug.hpp"
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
    static const int32_t WAY_BELOW_MIN_Y = (uint32_t)MIN_Y << 4;
};

class FluidStatus {
public:
    int32_t fluidLevel;
    BlockState fluidType;

    FluidStatus();
    FluidStatus(int32_t fluidLevel, BlockState fluidType);

    bool isNull() const;
    BlockState at(int32_t y) const;
};

namespace {
    constexpr double NoiseBasedAquifer_similarity(int32_t distanceSq0, int32_t distanceSq1) {
        return 1.0 - (double)Mth::c_abs(distanceSq1 - distanceSq0) / 25.0;
    }
} // namespace

class SimpleFluidPicker {
private:
    int32_t seaLevel;
    FluidStatus lava;
    FluidStatus defaultFluid;

public:
    SimpleFluidPicker(int32_t seaLevel, FluidStatus const& lava, FluidStatus const& defaultFluid);

    FluidStatus computeFluid(int32_t x, int32_t y, int32_t z);
};

class Aquifer {
public:
    typedef FluidStatus FluidStatus;

    static unique_ptr<Aquifer> create(shared_ptr<NoiseChunk> noiseChunk, ChunkPos const& chunkPos,
        NormalNoise const& barrierNoise, NormalNoise const& fluidLevelFloodednessNoise,
        NormalNoise const& fluidLevelSpreadNoise, NormalNoise const& lavaNoise,
        shared_ptr<PositionalRandomFactory> positionalRandomFactory, int32_t y,
        int32_t height, shared_ptr<SimpleFluidPicker> globalFluidPicker);
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

    weak_ptr<NoiseChunk> noiseChunk;
    NormalNoise const &barrierNoise;
    NormalNoise const &fluidLevelFloodednessNoise;
    NormalNoise const &fluidLevelSpreadNoise;
    NormalNoise const &lavaNoise;
    shared_ptr<PositionalRandomFactory> positionalRandomFactory;
    unique_ptr<Aquifer::FluidStatus[]> aquiferCache;
    unique_ptr<int64_t[]> aquiferLocationCache;
    shared_ptr<SimpleFluidPicker> globalFluidPicker;
    bool _shouldScheduleFluidUpdate;
    int32_t minGridX;
    int32_t minGridY;
    int32_t minGridZ;
    int32_t gridSizeX;
    int32_t gridSizeZ;

public:
    Aquifer(shared_ptr<NoiseChunk> noiseChunk, ChunkPos const &chunkPos, NormalNoise const &barrierNoise,
                      NormalNoise const &fluidLevelFloodednessNoise, NormalNoise const &fluidLevelSpreadNoise,
                      NormalNoise const &lavaNoise, shared_ptr<PositionalRandomFactory> positionalRandomFactory,
                      int32_t y, int32_t height, shared_ptr<SimpleFluidPicker> globalFluidPicker);
    virtual ~Aquifer() {
        objectFreed("Aquifer");
    }
private:
    int32_t getIndex(int32_t x, int32_t y, int32_t z);

public:
    BlockState computeSubstance(int32_t x, int32_t y, int32_t z, double baseNoise, double clampedBaseNoise);
    bool shouldScheduleFluidUpdate();

private:
    static constexpr inline double similarity(int32_t distanceSq0, int32_t distanceSq1) {
        return NoiseBasedAquifer_similarity(distanceSq0, distanceSq1);
    }

private:
    double calculatePressure(int32_t x, int32_t y, int32_t z, double &savedBarrierNoise,
                             Aquifer::FluidStatus const &fluidStart, Aquifer::FluidStatus const &fluidEnd);
    int32_t gridX(int32_t x);
    int32_t gridY(int32_t y);
    int32_t gridZ(int32_t z);

    Aquifer::FluidStatus getAquiferStatus(int64_t coord);

public:
    Aquifer::FluidStatus computeFluid(int32_t x, int32_t y, int32_t z);

private:
    BlockState getFluidType(int32_t x, int32_t y, int32_t z, Aquifer::FluidStatus const &fluidStatus, int32_t fluidY);
};