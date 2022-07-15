#include "worldgen-settings.hpp"

NoiseBasedChunkGenerator *WorldGenSettings::makeDefaultOverworld(int64_t seed) {
    return makeDefaultOverworld(seed, true);
}

NoiseBasedChunkGenerator *WorldGenSettings::makeDefaultOverworld(int64_t settings, bool usePreset) {
    return makeOverworld(settings, NoiseGeneratorSettings::OVERWORLD, usePreset);
}

NoiseBasedChunkGenerator *WorldGenSettings::makeOverworld(int64_t seed, NoiseGeneratorSettings *settings) {
    return makeOverworld(seed, settings, true);
}

NoiseBasedChunkGenerator *WorldGenSettings::makeOverworld(int64_t seed, NoiseGeneratorSettings *settings,
                                                          bool usePreset) {
    return new NoiseBasedChunkGenerator(MultiNoiseBiomeSource::Preset::OVERWORLD->biomeSource(usePreset), seed,
                                        [settings]() -> NoiseGeneratorSettings * { return settings; });
}
