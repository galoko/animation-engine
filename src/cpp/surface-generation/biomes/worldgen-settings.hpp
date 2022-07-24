#pragma once

#include <memory>

#include "chunk-generator.hpp"

using namespace std;

class WorldGenSettings {
public:
    static unique_ptr<NoiseBasedChunkGenerator> makeDefaultOverworld(int64_t seed);
    static unique_ptr<NoiseBasedChunkGenerator> makeDefaultOverworld(int64_t settings, bool usePreset);
    static unique_ptr<NoiseBasedChunkGenerator> makeOverworld(int64_t seed, NoiseGeneratorSettings const &settings);
    static unique_ptr<NoiseBasedChunkGenerator> makeOverworld(int64_t seed, NoiseGeneratorSettings const &settings,
                                                              bool usePreset);
};