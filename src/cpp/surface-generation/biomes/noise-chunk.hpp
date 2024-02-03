#pragma once

#include "aquifer.hpp"
#include "chunk-generator.fwd.hpp"
#include "chunks.hpp"
#include "mth.hpp"
#include "noise-chunk.fwd.hpp"

#include <map>
#include <memory>

using namespace std;

class Sampler {
public:
    virtual double sample() = 0;
    virtual ~Sampler() {
        objectFreed("Sampler");
    }
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

class NoiseChunk : public enable_shared_from_this<NoiseChunk> {
public:
    typedef Sampler Sampler;
    typedef NoiseInterpolator NoiseInterpolator;
    typedef InterpolatableNoise InterpolatableNoise;
    typedef NoiseFiller NoiseFiller;
    typedef BlockStateFiller BlockStateFiller;

    int32_t cellCountXZ;
    int32_t cellCountY;
    int32_t cellNoiseMinY;
    int32_t firstCellX;
    int32_t firstCellZ;
    int32_t firstNoiseX;
    int32_t firstNoiseZ;

    vector<shared_ptr<NoiseChunk::NoiseInterpolator>> interpolators;
    NoiseSettings const &noiseSettings;

    std::map<int64_t, int32_t> _preliminarySurfaceLevel = std::map<int64_t, int32_t>();

private:
    shared_ptr<NoiseSampler> sampler;

    vector<vector<FlatNoiseData>> _noiseData;
    shared_ptr<Aquifer> _aquifer;
    NoiseChunk::BlockStateFiller baseNoise;
    NoiseChunk::BlockStateFiller oreVeins;
    Blender const &blender;

public:
    static shared_ptr<NoiseChunk> forChunk(shared_ptr<ChunkAccess> chunkAccess, shared_ptr<NoiseSampler> sampler,
                                           function<NoiseChunk::NoiseFiller(void)> filler,
                                           NoiseGeneratorSettings const &generatorSettings,
                                           shared_ptr<SimpleFluidPicker> fluidPicker, Blender const &blender);

    static shared_ptr<NoiseChunk> forColumn(int32_t startX, int32_t startZ, int32_t cellNoiseMinY, int32_t cellCountY,
                                            shared_ptr<NoiseSampler> sampler,
                                            NoiseGeneratorSettings const &noiseSettings,
                                            shared_ptr<SimpleFluidPicker> fluidPicker);

    NoiseChunk(int32_t cellCountXZ, int32_t cellCountY, int32_t cellNoiseMinY, shared_ptr<NoiseSampler> sampler,
               int32_t startX, int32_t startZ, NoiseChunk::NoiseFiller filler,
               NoiseGeneratorSettings const &noiseSettings, shared_ptr<SimpleFluidPicker> fluidPicker,
               Blender const &blender);
    shared_ptr<NoiseChunk> afterConstructor(int32_t cellCountXZ, int32_t cellCountY, int32_t cellNoiseMinY,
                                            shared_ptr<NoiseSampler> sampler, int32_t startX, int32_t startZ,
                                            NoiseChunk::NoiseFiller filler, NoiseGeneratorSettings const &noiseSettings,
                                            shared_ptr<SimpleFluidPicker> fluidPicker, Blender const &blender);

    virtual ~NoiseChunk();

public:
    FlatNoiseData const &noiseData(int32_t x, int32_t z);

    int32_t preliminarySurfaceLevel(int32_t x, int32_t z);

private:
    int32_t computePreliminarySurfaceLevel(int64_t loc);

public:
    shared_ptr<NoiseChunk::NoiseInterpolator> createNoiseInterpolator(NoiseChunk::NoiseFiller filler);

    Blender const &getBlender();

    void initializeForFirstCellX();
    void advanceCellX(int32_t cellX);
    void selectCellYZ(int32_t cellY, int32_t cellZ);
    void updateForY(double t);
    void updateForX(double t);
    void updateForZ(double t);
    void swapSlices();

    shared_ptr<Aquifer> aquifer();

    BlockState updateNoiseAndGenerateBaseState(int32_t x, int32_t y, int32_t z);
    BlockState oreVeinify(int32_t x, int32_t y, int32_t z);
};

class NoiseInterpolator : public Sampler, public enable_shared_from_this<NoiseInterpolator> {
private:
    weak_ptr<NoiseChunk> noiseChunk;
    shared_ptr<double[]> slice0;
    shared_ptr<double[]> slice1;
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
    NoiseInterpolator(shared_ptr<NoiseChunk> noiseChunk, NoiseFiller filler);

    virtual ~NoiseInterpolator() {
    }

private:
    unique_ptr<double[]> allocateSlice(int32_t cellCountY, int32_t cellCountXZ);
    int32_t getSliceIndex(int32_t cellZ, int32_t cellY);

public:
    void initializeForFirstCellX();
    void advanceCellX(int32_t cellX);

private:
    void fillSlice(shared_ptr<double[]> slice, int32_t cellX);

public:
    void selectCellYZ(int32_t cellY, int32_t cellZ);
    void updateForY(double t);
    void updateForX(double t);
    void updateForZ(double t);

public:
    double sample() override;

    void swapSlices();
};