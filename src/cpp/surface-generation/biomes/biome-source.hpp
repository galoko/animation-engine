#pragma once

#include "../../utils/memory-debug.hpp"
#include "biomes.hpp"
#include "climate.hpp"

#include <functional>
#include <memory>
#include <set>
#include <vector>

using namespace std;

class BiomeResolver {
public:
    virtual Biomes getNoiseBiome(int32_t x, int32_t y, int32_t z, shared_ptr<Climate::Sampler> sampler) = 0;

    virtual ~BiomeResolver() {
    }
};

class PlacedFeature {};

class BiomeSource : public BiomeResolver {
private:
    class StepFeatureData {
        StepFeatureData(vector<PlacedFeature> features, function<int32_t(PlacedFeature)> indexMapping);
    };

public:
    set<Biomes> possibleBiomes;
    vector<BiomeSource::StepFeatureData> featuresPerStep;

    BiomeSource(vector<Biomes> const &biomes);

    virtual ~BiomeSource() {
        objectFreed("BiomeSource");
    }

    virtual shared_ptr<BiomeSource> withSeed(int64_t seed) = 0;
    virtual Biomes getNoiseBiome(int32_t x, int32_t y, int32_t z, shared_ptr<Climate::Sampler> sampler) = 0;
};

class MultiNoiseBiomeSource : public BiomeSource, public enable_shared_from_this<MultiNoiseBiomeSource> {
public:
    class Preset;

    class PresetInstance {
    public:
        static MultiNoiseBiomeSource::PresetInstance NULL_PRESET_INSTANCE;

        MultiNoiseBiomeSource::Preset const *preset;

        PresetInstance(MultiNoiseBiomeSource::Preset const *preset);

        unique_ptr<MultiNoiseBiomeSource> biomeSource() const;

        bool isNull() const;
    };

    class Preset {
    public:
        static MultiNoiseBiomeSource::Preset NULL_PRESET;
        static MultiNoiseBiomeSource::Preset OVERWORLD;
        static MultiNoiseBiomeSource::Preset NETHER;
        string name;

    private:
        function<Climate::ParameterList(void)> parameterSource;

    public:
        Preset();
        Preset(string name, function<Climate::ParameterList(void)> parameterSource);

        bool isNull() const;

        unique_ptr<MultiNoiseBiomeSource> biomeSource(MultiNoiseBiomeSource::PresetInstance const presetInstance,
                                                      bool usePresetInstance) const;
        unique_ptr<MultiNoiseBiomeSource> biomeSource(bool usePresetInstance) const;
        unique_ptr<MultiNoiseBiomeSource> biomeSource() const;

        static void finalize();
    };

private:
    static vector<Biomes> getBiomes(Climate::ParameterList const &parameters);

    Climate::ParameterList parameters;
    MultiNoiseBiomeSource::PresetInstance const preset;

public:
    MultiNoiseBiomeSource(Climate::ParameterList const &parameters);
    MultiNoiseBiomeSource(Climate::ParameterList const &parameters, MultiNoiseBiomeSource::PresetInstance const preset);

    shared_ptr<BiomeSource> withSeed(int64_t seed) override;

    bool stable(MultiNoiseBiomeSource::Preset const &preset) const;

    Biomes getNoiseBiome(int32_t x, int32_t y, int32_t z, shared_ptr<Climate::Sampler> sampler) override;
    Biomes getNoiseBiome(Climate::TargetPoint const &targetPoint);
};