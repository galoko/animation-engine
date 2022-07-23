#include "worldgen-settings.hpp"

NoiseBasedChunkGenerator *WorldGenSettings::makeDefaultOverworld(int64_t seed) {
    return makeDefaultOverworld(seed, true);
}

NoiseBasedChunkGenerator *WorldGenSettings::makeDefaultOverworld(int64_t seed, bool usePreset) {
    return makeOverworld(seed, NoiseGeneratorSettings::OVERWORLD, usePreset);
}

NoiseBasedChunkGenerator *WorldGenSettings::makeOverworld(int64_t seed, NoiseGeneratorSettings const &settings) {
    return makeOverworld(seed, settings, true);
}

NoiseBasedChunkGenerator *WorldGenSettings::makeOverworld(int64_t seed, NoiseGeneratorSettings const &settings,
                                                          bool usePreset) {
    return new NoiseBasedChunkGenerator(MultiNoiseBiomeSource::Preset::OVERWORLD->biomeSource(usePreset), seed,
                                        settings);
}
