#include "biome-source.hpp"
#include "../../utils/memory-debug.hpp"
#include "biomes.hpp"
#include "climate.hpp"
#include "overworld-biome-builder.hpp"

using namespace std;

// BiomeSource

BiomeSource::StepFeatureData::StepFeatureData(vector<PlacedFeature> features,
                                              function<int32_t(PlacedFeature)> indexMapping){};

// BiomeSource

BiomeSource::BiomeSource(vector<Biomes> const &biomes) {
    this->possibleBiomes = set<Biomes>(make_move_iterator(biomes.begin()), make_move_iterator(biomes.end()));
    // this->featuresPerStep = this->buildFeaturesPerStep(biomes, true);
    objectCreated("BiomeSource");
}

// Preset

MultiNoiseBiomeSource::Preset::Preset() : name("") {
}

MultiNoiseBiomeSource::Preset::Preset(string name, function<Climate::ParameterList<Biomes>(void)> parameterSource)
    : name(name), parameterSource(parameterSource) {
}

bool MultiNoiseBiomeSource::Preset::isNull() const {
    return this->name != "";
}

unique_ptr<MultiNoiseBiomeSource> MultiNoiseBiomeSource::Preset::biomeSource(
    MultiNoiseBiomeSource::PresetInstance const presetInstance, bool usePresetInstance) const {
    Climate::ParameterList<Biomes> parameterlist = this->parameterSource();
    return make_unique<MultiNoiseBiomeSource>(parameterlist, usePresetInstance ? presetInstance : MultiNoiseBiomeSource::PresetInstance::NULL_PRESET_INSTANCE);
}

unique_ptr<MultiNoiseBiomeSource> MultiNoiseBiomeSource::Preset::biomeSource(bool usePresetInstance) const {
    return this->biomeSource(MultiNoiseBiomeSource::PresetInstance(this), usePresetInstance);
}

unique_ptr<MultiNoiseBiomeSource> MultiNoiseBiomeSource::Preset::biomeSource() const {
    return this->biomeSource(true);
}

MultiNoiseBiomeSource::Preset MultiNoiseBiomeSource::Preset::NULL_PRESET = MultiNoiseBiomeSource::Preset();

MultiNoiseBiomeSource::Preset MultiNoiseBiomeSource::Preset::OVERWORLD =
    MultiNoiseBiomeSource::Preset("overworld", []() -> Climate::ParameterList<Biomes> {
        vector<pair<Climate::ParameterPoint, Biomes>> builder = vector<pair<Climate::ParameterPoint, Biomes>>();

        OverworldBiomeBuilder().addBiomes(builder);
        return Climate::ParameterList<Biomes>(builder);
    });

MultiNoiseBiomeSource::Preset MultiNoiseBiomeSource::Preset::NETHER =
    MultiNoiseBiomeSource::Preset("nether", []() -> Climate::ParameterList<Biomes> {
        return Climate::ParameterList<Biomes>(
            {pair(Climate::parameters(0.0F, 0.0F, 0.0F, 0.0F, 0.0F, 0.0F, 0.0F), Biomes::NETHER_WASTES),
             pair(Climate::parameters(0.0F, -0.5F, 0.0F, 0.0F, 0.0F, 0.0F, 0.0F), Biomes::SOUL_SAND_VALLEY),
             pair(Climate::parameters(0.4F, 0.0F, 0.0F, 0.0F, 0.0F, 0.0F, 0.0F), Biomes::CRIMSON_FOREST),
             pair(Climate::parameters(0.0F, 0.5F, 0.0F, 0.0F, 0.0F, 0.0F, 0.375F), Biomes::WARPED_FOREST),
             pair(Climate::parameters(-0.5F, 0.0F, 0.0F, 0.0F, 0.0F, 0.0F, 0.175F), Biomes::BASALT_DELTAS)});
    });

void MultiNoiseBiomeSource::Preset::finalize() {
    MultiNoiseBiomeSource::Preset::NULL_PRESET.~Preset();
    MultiNoiseBiomeSource::Preset::OVERWORLD.~Preset();
    MultiNoiseBiomeSource::Preset::NETHER.~Preset();
}

// PresetInstance

MultiNoiseBiomeSource::PresetInstance::PresetInstance(MultiNoiseBiomeSource::Preset const *preset) : preset(preset) {
}

unique_ptr<MultiNoiseBiomeSource> MultiNoiseBiomeSource::PresetInstance::biomeSource() const {
    return this->preset->biomeSource(*this, true);
}

bool MultiNoiseBiomeSource::PresetInstance::isNull() const {
    return this->preset != &MultiNoiseBiomeSource::Preset::NULL_PRESET;
}

MultiNoiseBiomeSource::PresetInstance MultiNoiseBiomeSource::PresetInstance::NULL_PRESET_INSTANCE =
    MultiNoiseBiomeSource::PresetInstance(&MultiNoiseBiomeSource::Preset::NULL_PRESET);

// MultiNoiseBiomeSource

vector<Biomes> MultiNoiseBiomeSource::getBiomes(Climate::ParameterList<Biomes> const &parameters) {
    vector<Biomes> biomes = vector<Biomes>();
    for (const pair<Climate::ParameterPoint, Biomes> &pair : parameters.values) {
        biomes.push_back(pair.second);
    }

    return biomes;
}

MultiNoiseBiomeSource::MultiNoiseBiomeSource(Climate::ParameterList<Biomes> const &parameters)
    : MultiNoiseBiomeSource(parameters, PresetInstance::NULL_PRESET_INSTANCE) {
}

MultiNoiseBiomeSource::MultiNoiseBiomeSource(Climate::ParameterList<Biomes> const &parameters,
                                             MultiNoiseBiomeSource::PresetInstance const preset)
    : BiomeSource(getBiomes(parameters)), parameters(parameters), preset(preset) {
}

shared_ptr<BiomeSource> MultiNoiseBiomeSource::withSeed(int64_t seed) {
    return this->shared_from_this();
}

bool MultiNoiseBiomeSource::stable(MultiNoiseBiomeSource::Preset const &preset) const {
    return !this->preset.isNull() && this->preset.preset == &preset;
}

Biomes MultiNoiseBiomeSource::getNoiseBiome(int32_t x, int32_t y, int32_t z,
                                            shared_ptr<Climate::Sampler> sampler) const {
    return this->getNoiseBiome(sampler->sample(x, y, z));
}

Biomes MultiNoiseBiomeSource::getNoiseBiome(Climate::TargetPoint const &targetPoint) const {
    return this->parameters.findValueBruteForce(targetPoint, Biomes::THE_VOID);
}