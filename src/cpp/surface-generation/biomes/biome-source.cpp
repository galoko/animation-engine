#include "biome-source.hpp"
#include "biomes.hpp"
#include "climate.hpp"
#include "overworld-biome-builder.hpp"

using namespace std;

// BiomeSource

BiomeSource::StepFeatureData::StepFeatureData(vector<PlacedFeature *> *features,
                                              function<int32_t(PlacedFeature)> indexMapping){};

// BiomeSource

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

MultiNoiseBiomeSource::Preset::Preset(string name, function<Climate::ParameterList<Biomes> *(void)> parameterSource)
    : name(name), parameterSource(parameterSource) {
}

MultiNoiseBiomeSource *MultiNoiseBiomeSource::Preset::biomeSource(MultiNoiseBiomeSource::PresetInstance *presetInstance,
                                                                  bool usePresetInstance) {
    Climate::ParameterList<Biomes> *parameterlist = this->parameterSource();
    return new MultiNoiseBiomeSource(parameterlist, usePresetInstance ? presetInstance : nullptr);
}

MultiNoiseBiomeSource *MultiNoiseBiomeSource::Preset::biomeSource(bool usePresetInstance) {
    return this->biomeSource(new MultiNoiseBiomeSource::PresetInstance(this), usePresetInstance);
}

MultiNoiseBiomeSource *MultiNoiseBiomeSource::Preset::biomeSource() {
    return this->biomeSource(true);
}

MultiNoiseBiomeSource::Preset *MultiNoiseBiomeSource::Preset::OVERWORLD =
    new MultiNoiseBiomeSource::Preset("overworld", []() -> Climate::ParameterList<Biomes> * {
        vector<pair<Climate::ParameterPoint *, Biomes>> *builder =
            new vector<pair<Climate::ParameterPoint *, Biomes>>();

        OverworldBiomeBuilder().addBiomes([builder](pair<Climate::ParameterPoint *, Biomes> *biomePair) -> void {
            Biomes biome = biomePair->second;
            builder->push_back(pair(biomePair->first, biome));
        });
        return new Climate::ParameterList<Biomes>(builder);
    });

MultiNoiseBiomeSource::Preset *MultiNoiseBiomeSource::Preset::NETHER =
    new MultiNoiseBiomeSource::Preset("nether", []() -> Climate::ParameterList<Biomes> * {
        return new Climate::ParameterList<Biomes>(new vector<pair<Climate::ParameterPoint *, Biomes>>(
            {pair(Climate::parameters(0.0F, 0.0F, 0.0F, 0.0F, 0.0F, 0.0F, 0.0F), Biomes::NETHER_WASTES),
             pair(Climate::parameters(0.0F, -0.5F, 0.0F, 0.0F, 0.0F, 0.0F, 0.0F), Biomes::SOUL_SAND_VALLEY),
             pair(Climate::parameters(0.4F, 0.0F, 0.0F, 0.0F, 0.0F, 0.0F, 0.0F), Biomes::CRIMSON_FOREST),
             pair(Climate::parameters(0.0F, 0.5F, 0.0F, 0.0F, 0.0F, 0.0F, 0.375F), Biomes::WARPED_FOREST),
             pair(Climate::parameters(-0.5F, 0.0F, 0.0F, 0.0F, 0.0F, 0.0F, 0.175F), Biomes::BASALT_DELTAS)}));
    });

// MultiNoiseBiomeSource

vector<Biomes> *MultiNoiseBiomeSource::getBiomes(Climate::ParameterList<Biomes> *parameters) {
    vector<Biomes> *biomes = new vector<Biomes>();
    for (pair<Climate::ParameterPoint *, Biomes> &pair : *parameters->values) {
        biomes->push_back(pair.second);
    }

    return biomes;
}

MultiNoiseBiomeSource::MultiNoiseBiomeSource(Climate::ParameterList<Biomes> *parameters)
    : MultiNoiseBiomeSource(parameters, nullptr) {
}

MultiNoiseBiomeSource::MultiNoiseBiomeSource(Climate::ParameterList<Biomes> *parameters,
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
    return this->parameters->findValueBruteForce(targetPoint, Biomes::THE_VOID);
}