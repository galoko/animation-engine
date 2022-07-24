#include "worldgen-settings.hpp"

unique_ptr<NoiseBasedChunkGenerator> WorldGenSettings::makeDefaultOverworld(int64_t seed) {
    return makeDefaultOverworld(seed, true);
}

unique_ptr<NoiseBasedChunkGenerator> WorldGenSettings::makeDefaultOverworld(int64_t seed, bool usePreset) {
    return makeOverworld(seed, NoiseGeneratorSettings::OVERWORLD, usePreset);
}

unique_ptr<NoiseBasedChunkGenerator> WorldGenSettings::makeOverworld(int64_t seed,
                                                                     NoiseGeneratorSettings const &settings) {
    return makeOverworld(seed, settings, true);
}

unique_ptr<NoiseBasedChunkGenerator> WorldGenSettings::makeOverworld(int64_t seed,
                                                                     NoiseGeneratorSettings const &settings,
                                                                     bool usePreset) {
    return make_unique<NoiseBasedChunkGenerator>(MultiNoiseBiomeSource::Preset::OVERWORLD.biomeSource(usePreset), seed,
                                                 settings);
}
