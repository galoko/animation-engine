#include "chunk-generator.hpp"

Blender *Blender::EMPTY = new Blender();

NoiseGeneratorSettings *NoiseGeneratorSettings::OVERWORLD = NoiseGeneratorSettings::overworld(false, false);
NoiseGeneratorSettings *NoiseGeneratorSettings::LARGE_BIOMES = NoiseGeneratorSettings::overworld(false, true);
NoiseGeneratorSettings *NoiseGeneratorSettings::AMPLIFIED = NoiseGeneratorSettings::overworld(true, false);
NoiseGeneratorSettings *NoiseGeneratorSettings::NETHER = NoiseGeneratorSettings::nether();
NoiseGeneratorSettings *NoiseGeneratorSettings::END = NoiseGeneratorSettings::end();
NoiseGeneratorSettings *NoiseGeneratorSettings::CAVES = NoiseGeneratorSettings::caves();
NoiseGeneratorSettings *NoiseGeneratorSettings::FLOATING_ISLANDS = NoiseGeneratorSettings::floatingIslands();