#include "biome-source.hpp"
#include "biomes.hpp"
#include "climate.hpp"
#include "overworld-biome-builder.hpp"

using namespace std;

// BiomeSource

BiomeSource::StepFeatureData::StepFeatureData(vector<PlacedFeature *> *features,
                                              function<int32_t(PlacedFeature)> indexMapping){};

// BiomeSource

BiomeSource::BiomeSource(vector<function<Biomes(void)>> *biomes) {
    this->possibleBiomes = new set<Biomes>();
    for (function<Biomes(void)> &biomeSupplier : *biomes) {
        this->possibleBiomes->insert(biomeSupplier());
    }
    // this->featuresPerStep = this->buildFeaturesPerStep(biomes, true);
}

BiomeSource::BiomeSource(vector<Biomes> *biomes) {
    this->possibleBiomes = new set<Biomes>(make_move_iterator(biomes->begin()), make_move_iterator(biomes->end()));
    // this->featuresPerStep = this->buildFeaturesPerStep(biomes, true);
}

// PresetInstance

MultiNoiseBiomeSource::PresetInstance::PresetInstance(MultiNoiseBiomeSource::Preset *preset) : preset(preset) {
}

MultiNoiseBiomeSource *MultiNoiseBiomeSource::PresetInstance::biomeSource() {
    return this->preset->biomeSource(this, true);
}

// Preset

MultiNoiseBiomeSource::Preset::Preset(string name,
                                      function<Climate::ParameterList<function<Biomes(void)>> *(void)> parameterSource)
    : name(name), parameterSource(parameterSource) {
}

MultiNoiseBiomeSource *MultiNoiseBiomeSource::Preset::biomeSource(MultiNoiseBiomeSource::PresetInstance *presetInstance,
                                                                  bool usePresetInstance) {
    Climate::ParameterList<function<Biomes(void)>> *parameterlist = this->parameterSource();
    return new MultiNoiseBiomeSource(parameterlist, usePresetInstance ? presetInstance : nullptr);
}

MultiNoiseBiomeSource *MultiNoiseBiomeSource::Preset::biomeSource(bool usePresetInstance) {
    return this->biomeSource(new MultiNoiseBiomeSource::PresetInstance(this), usePresetInstance);
}

MultiNoiseBiomeSource *MultiNoiseBiomeSource::Preset::biomeSource() {
    return this->biomeSource(true);
}

MultiNoiseBiomeSource::Preset *MultiNoiseBiomeSource::Preset::OVERWORLD =
    new MultiNoiseBiomeSource::Preset("overworld", []() -> Climate::ParameterList<function<Biomes(void)>> * {
        vector<pair<Climate::ParameterPoint *, function<Biomes(void)>>> *builder =
            new vector<pair<Climate::ParameterPoint *, function<Biomes(void)>>>();

        OverworldBiomeBuilder().addBiomes([builder](pair<Climate::ParameterPoint *, Biomes> *biomePair) -> void {
            Biomes biome = biomePair->second;
            builder->push_back(pair(biomePair->first, [biome]() -> Biomes { return biome; }));
        });
        return new Climate::ParameterList<function<Biomes(void)>>(builder);
    });

MultiNoiseBiomeSource::Preset *MultiNoiseBiomeSource::Preset::NETHER =
    new MultiNoiseBiomeSource::Preset("nether", []() -> Climate::ParameterList<function<Biomes(void)>> * {
        return new Climate::ParameterList<function<Biomes(void)>>(
            new vector<pair<Climate::ParameterPoint *, function<Biomes(void)>>>(
                {pair(Climate::parameters(0.0F, 0.0F, 0.0F, 0.0F, 0.0F, 0.0F, 0.0F),
                      []() -> Biomes { return Biomes::NETHER_WASTES; }),
                 pair(Climate::parameters(0.0F, -0.5F, 0.0F, 0.0F, 0.0F, 0.0F, 0.0F),
                      []() -> Biomes { return Biomes::SOUL_SAND_VALLEY; }),
                 pair(Climate::parameters(0.4F, 0.0F, 0.0F, 0.0F, 0.0F, 0.0F, 0.0F),
                      []() -> Biomes { return Biomes::CRIMSON_FOREST; }),
                 pair(Climate::parameters(0.0F, 0.5F, 0.0F, 0.0F, 0.0F, 0.0F, 0.375F),
                      []() -> Biomes { return Biomes::WARPED_FOREST; }),
                 pair(Climate::parameters(-0.5F, 0.0F, 0.0F, 0.0F, 0.0F, 0.0F, 0.175F),
                      []() -> Biomes { return Biomes::BASALT_DELTAS; })}));
    });

// MultiNoiseBiomeSource

vector<function<Biomes(void)>> *MultiNoiseBiomeSource::getBiomes(
    Climate::ParameterList<function<Biomes(void)>> *parameters) {
    vector<function<Biomes(void)>> *biomes = new vector<function<Biomes(void)>>();
    for (pair<Climate::ParameterPoint *, function<Biomes(void)>> &pair : *parameters->values) {
        biomes->push_back(pair.second);
    }

    return biomes;
}

MultiNoiseBiomeSource::MultiNoiseBiomeSource(Climate::ParameterList<function<Biomes(void)>> *parameters)
    : MultiNoiseBiomeSource(parameters, nullptr) {
}

MultiNoiseBiomeSource::MultiNoiseBiomeSource(Climate::ParameterList<function<Biomes(void)>> *parameters,
                                             MultiNoiseBiomeSource::PresetInstance *preset)
    : BiomeSource(getBiomes(parameters)), parameters(parameters), preset(preset) {
}

BiomeSource *MultiNoiseBiomeSource::withSeed(int64_t seed) {
    return this;
}

bool MultiNoiseBiomeSource::stable(MultiNoiseBiomeSource::Preset *preset) {
    return this->preset != nullptr && this->preset->preset == preset;
}

Biomes MultiNoiseBiomeSource::getNoiseBiome(int32_t x, int32_t y, int32_t z, Climate::Sampler *sampler) {
    return this->getNoiseBiome(sampler->sample(x, y, z));
}

Biomes MultiNoiseBiomeSource::getNoiseBiome(Climate::TargetPoint *targetPoint) {
    return this->parameters->findValueBruteForce(targetPoint, []() -> Biomes { return Biomes::THE_VOID; })();
}