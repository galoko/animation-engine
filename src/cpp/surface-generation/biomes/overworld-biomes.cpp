#include "overworld-biomes.hpp"

shared_ptr<Music> OverworldBiomes::NORMAL_MUSIC = nullptr;

PerlinSimplexNoise Biome::TEMPERATURE_NOISE =
    PerlinSimplexNoise(make_shared<WorldgenRandom>(make_unique<LegacyRandomSource>(1234L)), {0});
PerlinSimplexNoise Biome::FROZEN_TEMPERATURE_NOISE =
    PerlinSimplexNoise(make_shared<WorldgenRandom>(make_unique<LegacyRandomSource>(3456L)), {-2, -1, 0});
PerlinSimplexNoise Biome::BIOME_INFO_NOISE =
    PerlinSimplexNoise(make_shared<WorldgenRandom>(make_unique<LegacyRandomSource>(2345L)), {0});

int GrassColorModifier_NONE(double x, double z, int srcColor) {
    return srcColor;
}

int GrassColorModifier_DARK_FOREST(double x, double z, int srcColor) {
    return ((srcColor & 16711422) + 2634762) >> 1;
}

int GrassColorModifier_SWAMP(double x, double z, int srcColor) {
    double biomeInfo = Biome::BIOME_INFO_NOISE.getValue(x * 0.0225, z * 0.0225, false);
    return biomeInfo < -0.1 ? 5011004 : 6975545;
}