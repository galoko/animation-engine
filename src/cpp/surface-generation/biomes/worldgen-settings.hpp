#pragma once

#include "chunk-generator.hpp"

class WorldGenSettings {
public:
    static NoiseBasedChunkGenerator *makeDefaultOverworld(int64_t seed);
    static NoiseBasedChunkGenerator *makeDefaultOverworld(int64_t settings, bool usePreset);
    static NoiseBasedChunkGenerator *makeOverworld(int64_t seed, NoiseGeneratorSettings const &settings);
    static NoiseBasedChunkGenerator *makeOverworld(int64_t seed, NoiseGeneratorSettings const &settings,
                                                   bool usePreset);
};