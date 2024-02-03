#include "worldgen-settings.hpp"

shared_ptr<ChunkGenerator> WorldGenSettings::makeDefaultOverworld(int64_t seed) {
    return makeDefaultOverworld(seed, true);
}

shared_ptr<ChunkGenerator> WorldGenSettings::makeDefaultOverworld(int64_t seed, bool usePreset) {
    return makeOverworld(seed, NoiseGeneratorSettings::OVERWORLD, usePreset);
}

shared_ptr<ChunkGenerator> WorldGenSettings::makeOverworld(int64_t seed,
                                                                     NoiseGeneratorSettings const &settings) {
    return makeOverworld(seed, settings, true);
}

shared_ptr<ChunkGenerator> WorldGenSettings::makeOverworld(int64_t seed,
                                                                     NoiseGeneratorSettings const &settings,
                                                                     bool usePreset) {
    return make_shared<ChunkGenerator>(
        BiomeSource::Preset::OVERWORLD.biomeSource(usePreset), seed, settings);;
}
