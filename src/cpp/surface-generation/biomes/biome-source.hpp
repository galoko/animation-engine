#pragma once

#include "../../utils/memory-debug.hpp"
#include "biomes.hpp"
#include "climate.hpp"

#include <functional>
#include <memory>
#include <set>
#include <vector>

using namespace std;

class PlacedFeature {};

class BiomeSource : public enable_shared_from_this<BiomeSource> {
private:
    class StepFeatureData {
        StepFeatureData(vector<PlacedFeature> features, function<int32_t(PlacedFeature)> indexMapping);
    };
public:
    set<Biomes> possibleBiomes;
    vector<StepFeatureData> featuresPerStep;

    class Preset;

    class PresetInstance {
    public:
        static BiomeSource::PresetInstance NULL_PRESET_INSTANCE;

        BiomeSource::Preset const *preset;

        PresetInstance(BiomeSource::Preset const *preset);

        unique_ptr<BiomeSource> biomeSource() const;

        bool isNull() const;
    };

    class Preset {
    public:
        static BiomeSource::Preset NULL_PRESET;
        static BiomeSource::Preset OVERWORLD;
        static BiomeSource::Preset NETHER;
        string name;

    private:
        function<Climate::ParameterList(void)> parameterSource;

    public:
        Preset();
        Preset(string name, function<Climate::ParameterList(void)> parameterSource);

        bool isNull() const;

        unique_ptr<BiomeSource> biomeSource(BiomeSource::PresetInstance const presetInstance,
                                                      bool usePresetInstance) const;
        unique_ptr<BiomeSource> biomeSource(bool usePresetInstance) const;
        unique_ptr<BiomeSource> biomeSource() const;

        static void finalize();
    };

private:
    static set<Biomes> getBiomes(Climate::ParameterList const &parameters);

    Climate::ParameterList parameters;
    BiomeSource::PresetInstance const preset;

public:
    BiomeSource(Climate::ParameterList const &parameters);
    BiomeSource(Climate::ParameterList const &parameters, BiomeSource::PresetInstance const preset);

    shared_ptr<BiomeSource> withSeed(int64_t seed);

    bool stable(BiomeSource::Preset const &preset) const;

    Biomes getNoiseBiome(int32_t x, int32_t y, int32_t z, shared_ptr<Climate::Sampler> sampler);
    Biomes getNoiseBiome(Climate::TargetPoint const &targetPoint);
};