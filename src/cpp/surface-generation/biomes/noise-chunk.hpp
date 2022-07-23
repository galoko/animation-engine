#pragma once

#include "aquifer.hpp"
#include "chunk-generator.fwd.hpp"
#include "chunks.hpp"
#include "mth.hpp"
#include "noise-chunk.fwd.hpp"

#include <map>

using namespace std;

class Sampler {
public:
    virtual double sample() = 0;
};

class ConstantSampler : public Sampler {
private:
    double value;

public:
    ConstantSampler(double value);

    double sample() override;
};

class NoiseChunk;
class NoiseInterpolator;

class NoiseChunk {
public:
    typedef Sampler Sampler;
    typedef NoiseInterpolator NoiseInterpolator;
    typedef InterpolatableNoise InterpolatableNoise;
    typedef NoiseFiller NoiseFiller;
    typedef BlockStateFiller BlockStateFiller;

public:
    int32_t cellCountXZ;
    int32_t cellCountY;
    int32_t cellNoiseMinY;
    int32_t firstCellX;
    int32_t firstCellZ;
    int32_t firstNoiseX;
    int32_t firstNoiseZ;

    vector<NoiseChunk::NoiseInterpolator *> interpolators;
    NoiseSettings const &noiseSettings;

    std::map<int64_t, int32_t> _preliminarySurfaceLevel = std::map<int64_t, int32_t>();

private:
    NoiseSampler *sampler;

    vector<vector<FlatNoiseData>> _noiseData;
    Aquifer *_aquifer;
    NoiseChunk::BlockStateFiller baseNoise;
    NoiseChunk::BlockStateFiller oreVeins;
    Blender const &blender;

public:
    static NoiseChunk *forChunk(ChunkAccess *chunkAccess, NoiseSampler *sampler,
                                function<NoiseChunk::NoiseFiller(void)> filler,
                                NoiseGeneratorSettings const &generatorSettings, Aquifer::FluidPicker *fluidPicker,
                                Blender const &blender);

    static NoiseChunk *forColumn(int32_t startX, int32_t startZ, int32_t cellNoiseMinY, int32_t cellCountY,
                                 NoiseSampler *sampler, NoiseGeneratorSettings const &noiseSettings,
                                 Aquifer::FluidPicker *fluidPicker);

private:
    NoiseChunk(int32_t cellCountXZ, int32_t cellCountY, int32_t cellNoiseMinY, NoiseSampler *sampler, int32_t startX,
               int32_t startZ, NoiseChunk::NoiseFiller filler, NoiseGeneratorSettings const &noiseSettings,
               Aquifer::FluidPicker *fluidPicker, Blender const &blender);

public:
    FlatNoiseData const &noiseData(int32_t x, int32_t z);

    int32_t preliminarySurfaceLevel(int32_t x, int32_t z);

private:
    int32_t computePreliminarySurfaceLevel(int64_t loc);

public:
    NoiseChunk::NoiseInterpolator *createNoiseInterpolator(NoiseChunk::NoiseFiller filler);

    Blender const &getBlender();

    void initializeForFirstCellX();
    void advanceCellX(int32_t cellX);
    void selectCellYZ(int32_t cellY, int32_t cellZ);
    void updateForY(double t);
    void updateForX(double t);
    void updateForZ(double t);
    void swapSlices();

    Aquifer *aquifer();

    BlockState updateNoiseAndGenerateBaseState(int32_t x, int32_t y, int32_t z);
    BlockState oreVeinify(int32_t x, int32_t y, int32_t z);
};

class NoiseInterpolator : public Sampler {
private:
    NoiseChunk *noiseChunk;
    double *slice0;
    double *slice1;
    NoiseFiller noiseFiller;
    double noise000;
    double noise001;
    double noise100;
    double noise101;
    double noise010;
    double noise011;
    double noise110;
    double noise111;
    double valueXZ00;
    double valueXZ10;
    double valueXZ01;
    double valueXZ11;
    double valueZ0;
    double valueZ1;
    double value;

public:
    NoiseInterpolator(NoiseChunk *noiseChunk, NoiseFiller filler);

private:
    double *allocateSlice(int32_t cellCountY, int32_t cellCountXZ);
    int32_t getSliceIndex(int32_t cellZ, int32_t cellY);

public:
    void initializeForFirstCellX();
    void advanceCellX(int32_t cellX);

private:
    void fillSlice(double *slice, int32_t cellX);

public:
    void selectCellYZ(int32_t cellY, int32_t cellZ);
    void updateForY(double t);
    void updateForX(double t);
    void updateForZ(double t);

public:
    double sample() override;

    void swapSlices();
};