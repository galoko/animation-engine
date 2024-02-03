#include "biome-source.hpp"
#include "../../utils/memory-debug.hpp"
#include "biomes.hpp"
#include "climate.hpp"
#include "overworld-biome-builder.hpp"

using namespace std;

// BiomeSource

BiomeSource::StepFeatureData::StepFeatureData(vector<PlacedFeature> features,
                                              function<int32_t(PlacedFeature)> indexMapping){};

// Preset

BiomeSource::Preset::Preset() : name("") {
}

BiomeSource::Preset::Preset(string name, function<Climate::ParameterList(void)> parameterSource)
    : name(name), parameterSource(parameterSource) {
}

bool BiomeSource::Preset::isNull() const {
    return this->name != "";
}

unique_ptr<BiomeSource> BiomeSource::Preset::biomeSource(BiomeSource::PresetInstance const presetInstance,
                                                         bool usePresetInstance) const {
    Climate::ParameterList parameterlist = this->parameterSource();
    return make_unique<BiomeSource>(
        parameterlist, usePresetInstance ? presetInstance : BiomeSource::PresetInstance::NULL_PRESET_INSTANCE);
}

unique_ptr<BiomeSource> BiomeSource::Preset::biomeSource(bool usePresetInstance) const {
    return this->biomeSource(BiomeSource::PresetInstance(this), usePresetInstance);
}

unique_ptr<BiomeSource> BiomeSource::Preset::biomeSource() const {
    return this->biomeSource(true);
}

BiomeSource::Preset BiomeSource::Preset::NULL_PRESET = BiomeSource::Preset();

BiomeSource::Preset BiomeSource::Preset::OVERWORLD = BiomeSource::Preset("overworld", []() -> Climate::ParameterList {
    vector<pair<Climate::ParameterPoint, Biomes>> builder = vector<pair<Climate::ParameterPoint, Biomes>>();

    OverworldBiomeBuilder().addBiomes(builder);
    return Climate::ParameterList(builder);
});

BiomeSource::Preset BiomeSource::Preset::NETHER = BiomeSource::Preset("nether", []() -> Climate::ParameterList {
    return Climate::ParameterList(
        {pair(Climate::parameters(0.0F, 0.0F, 0.0F, 0.0F, 0.0F, 0.0F, 0.0F), Biomes::NETHER_WASTES),
         pair(Climate::parameters(0.0F, -0.5F, 0.0F, 0.0F, 0.0F, 0.0F, 0.0F), Biomes::SOUL_SAND_VALLEY),
         pair(Climate::parameters(0.4F, 0.0F, 0.0F, 0.0F, 0.0F, 0.0F, 0.0F), Biomes::CRIMSON_FOREST),
         pair(Climate::parameters(0.0F, 0.5F, 0.0F, 0.0F, 0.0F, 0.0F, 0.375F), Biomes::WARPED_FOREST),
         pair(Climate::parameters(-0.5F, 0.0F, 0.0F, 0.0F, 0.0F, 0.0F, 0.175F), Biomes::BASALT_DELTAS)});
});

void BiomeSource::Preset::finalize() {
    BiomeSource::Preset::NULL_PRESET = BiomeSource::Preset();
    BiomeSource::Preset::OVERWORLD = BiomeSource::Preset();
    BiomeSource::Preset::NETHER = BiomeSource::Preset();
}

// PresetInstance

BiomeSource::PresetInstance::PresetInstance(BiomeSource::Preset const *preset) : preset(preset) {
}

unique_ptr<BiomeSource> BiomeSource::PresetInstance::biomeSource() const {
    return this->preset->biomeSource(*this, true);
}

bool BiomeSource::PresetInstance::isNull() const {
    return this->preset != &BiomeSource::Preset::NULL_PRESET;
}

BiomeSource::PresetInstance BiomeSource::PresetInstance::NULL_PRESET_INSTANCE =
    BiomeSource::PresetInstance(&BiomeSource::Preset::NULL_PRESET);

// BiomeSource

set<Biomes> BiomeSource::getBiomes(Climate::ParameterList const &parameters) {
    set<Biomes> biomes;
    for (const pair<Climate::ParameterPoint, Biomes> &pair : parameters.values) {
        biomes.emplace(pair.second);
    }

    return biomes;
}

BiomeSource::BiomeSource(Climate::ParameterList const &parameters)
    : BiomeSource(parameters, PresetInstance::NULL_PRESET_INSTANCE) {
}

BiomeSource::BiomeSource(Climate::ParameterList const &parameters, BiomeSource::PresetInstance const preset)
    : possibleBiomes(this->getBiomes(parameters)), parameters(parameters), preset(preset) {
    // this->featuresPerStep = this->buildFeaturesPerStep(biomes, true);
}

shared_ptr<BiomeSource> BiomeSource::withSeed(int64_t seed) {
    return this->shared_from_this();
}

bool BiomeSource::stable(BiomeSource::Preset const &preset) const {
    return !this->preset.isNull() && this->preset.preset == &preset;
}

Biomes BiomeSource::getNoiseBiome(int32_t x, int32_t y, int32_t z, shared_ptr<Climate::Sampler> sampler) {
    return this->getNoiseBiome(sampler->sample(x, y, z));
}

Biomes BiomeSource::getNoiseBiome(Climate::TargetPoint const &targetPoint) {
    return this->parameters.findValue(targetPoint, Biomes::THE_VOID);
}