#pragma once

#include "biomes.hpp"
#include "climate.hpp"

#include <functional>
#include <set>
#include <vector>

using namespace std;

class BiomeResolver {
public:
    virtual Biomes getNoiseBiome(int32_t x, int32_t y, int32_t z, Climate::Sampler *sampler) = 0;
};

class PlacedFeature {};

class BiomeSource : public BiomeResolver {
private:
    class StepFeatureData {
        StepFeatureData(vector<PlacedFeature *> *features, function<int32_t(PlacedFeature)> indexMapping);
    };

public:
    set<Biomes> *possibleBiomes;
    vector<BiomeSource::StepFeatureData *> *featuresPerStep;

    BiomeSource(vector<function<Biomes(void)>> *biomes);
    BiomeSource(vector<Biomes> *biomes);

    virtual BiomeSource *withSeed(int64_t seed) = 0;
    virtual Biomes getNoiseBiome(int32_t x, int32_t y, int32_t z, Climate::Sampler *sampler) = 0;
};

class MultiNoiseBiomeSource : public BiomeSource {
public:
    class Preset;

    class PresetInstance {
    public:
        MultiNoiseBiomeSource::Preset *preset;

        PresetInstance(MultiNoiseBiomeSource::Preset *preset);

        MultiNoiseBiomeSource *biomeSource();
    };

    class Preset {
    public:
        static MultiNoiseBiomeSource::Preset *OVERWORLD;
        static MultiNoiseBiomeSource::Preset *NETHER;
        string name;

    private:
        function<Climate::ParameterList<function<Biomes(void)>> *(void)> parameterSource;

    public:
        Preset(string name, function<Climate::ParameterList<function<Biomes(void)>> *(void)> parameterSource);

        MultiNoiseBiomeSource *biomeSource(MultiNoiseBiomeSource::PresetInstance *presetInstance,
                                           bool usePresetInstance);
        MultiNoiseBiomeSource *biomeSource(bool usePresetInstance);
        MultiNoiseBiomeSource *biomeSource();
    };

private:
    static vector<function<Biomes(void)>> *getBiomes(Climate::ParameterList<function<Biomes(void)>> *parameters);

    Climate::ParameterList<function<Biomes(void)>> *parameters;
    MultiNoiseBiomeSource::PresetInstance *preset;

    MultiNoiseBiomeSource(Climate::ParameterList<function<Biomes(void)>> *parameters);
    MultiNoiseBiomeSource(Climate::ParameterList<function<Biomes(void)>> *parameters,
                          MultiNoiseBiomeSource::PresetInstance *preset);

public:
    BiomeSource *withSeed(int64_t seed) override;

    bool stable(MultiNoiseBiomeSource::Preset *preset);

    Biomes getNoiseBiome(int32_t x, int32_t y, int32_t z, Climate::Sampler *sampler) override;
    Biomes getNoiseBiome(Climate::TargetPoint *targetPoint);
};