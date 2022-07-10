#pragma once

#include "chunk-generator.hpp"

class WorldGenSettings {
public:
    static NoiseBasedChunkGenerator *makeDefaultOverworld(int64_t seed) {
        return makeDefaultOverworld(seed, true);
    }

    static NoiseBasedChunkGenerator *makeDefaultOverworld(int64_t settings, bool usePreset) {
        return makeOverworld(settings, NoiseGeneratorSettings::OVERWORLD, usePreset);
    }

    static NoiseBasedChunkGenerator *makeOverworld(int64_t seed, NoiseGeneratorSettings *settings) {
        return makeOverworld(seed, settings, true);
    }

    static NoiseBasedChunkGenerator *makeOverworld(int64_t seed, NoiseGeneratorSettings *settings, bool usePreset) {
        return new NoiseBasedChunkGenerator(MultiNoiseBiomeSource::Preset::OVERWORLD->biomeSource(usePreset), seed,
                                            [settings]() -> NoiseGeneratorSettings * { return settings; });
    }
};