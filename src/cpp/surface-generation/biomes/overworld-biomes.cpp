#include "overworld-biomes.hpp"

shared_ptr<Music> OverworldBiomes::NORMAL_MUSIC = nullptr;

PerlinSimplexNoise Biome::TEMPERATURE_NOISE =
    PerlinSimplexNoise(make_shared<WorldgenRandom>(make_unique<LegacyRandomSource>(1234L)), {0});
PerlinSimplexNoise Biome::FROZEN_TEMPERATURE_NOISE =
    PerlinSimplexNoise(make_shared<WorldgenRandom>(make_unique<LegacyRandomSource>(3456L)), {-2, -1, 0});
PerlinSimplexNoise Biome::BIOME_INFO_NOISE =
    PerlinSimplexNoise(make_shared<WorldgenRandom>(make_unique<LegacyRandomSource>(2345L)), {0});

int32_t GrassColorModifier_NONE(double x, double z, int32_t srcColor) {
    return srcColor;
}

int32_t GrassColorModifier_DARK_FOREST(double x, double z, int32_t srcColor) {
    return ((srcColor & 16711422) + 2634762) >> 1;
}

int32_t GrassColorModifier_SWAMP(double x, double z, int32_t srcColor) {
    double biomeInfo = Biome::BIOME_INFO_NOISE.getValue(x * 0.0225, z * 0.0225, false);
    return biomeInfo < -0.1 ? 5011004 : 6975545;
}

TemperatureModifier Biome::TemperatureModifier_NONE = [](BlockPos blockPos, float temperature) -> float {
    return temperature;
};
TemperatureModifier Biome::TemperatureModifier_FROZEN = [](BlockPos blockPos, float temperature) -> float {
    double noiseFrozenTemperature = Biome::FROZEN_TEMPERATURE_NOISE.getValue((double)blockPos.getX() * 0.05,
                                                                             (double)blockPos.getZ() * 0.05, false) *
                                    7.0;
    double noiseBiomeInfo =
        Biome::BIOME_INFO_NOISE.getValue((double)blockPos.getX() * 0.2, (double)blockPos.getZ() * 0.2, false);
    double sum = noiseFrozenTemperature + noiseBiomeInfo;
    if (sum < 0.3) {
        double smallBiomeInfo =
            Biome::BIOME_INFO_NOISE.getValue((double)blockPos.getX() * 0.09, (double)blockPos.getZ() * 0.09, false);
        if (smallBiomeInfo < 0.8) {
            return 0.2F;
        }
    }

    return temperature;
};

// Biomes

map<Biomes, shared_ptr<Biome>> BiomeInstances::biomes;

shared_ptr<Biome> BiomeInstances::THE_VOID;
shared_ptr<Biome> BiomeInstances::PLAINS;

void BiomeInstances::init() {
    THE_VOID = registerBiome(Biomes::THE_VOID, OverworldBiomes::theVoid());
    PLAINS = registerBiome(Biomes::PLAINS, OverworldBiomes::plains(false, false, false));

    registerBiome(Biomes::SUNFLOWER_PLAINS, OverworldBiomes::plains(true, false, false));
    registerBiome(Biomes::SNOWY_PLAINS, OverworldBiomes::plains(false, true, false));
    registerBiome(Biomes::ICE_SPIKES, OverworldBiomes::plains(false, true, true));
    registerBiome(Biomes::DESERT, OverworldBiomes::desert());
    registerBiome(Biomes::SWAMP, OverworldBiomes::swamp());
    registerBiome(Biomes::FOREST, OverworldBiomes::forest(false, false, false));
    registerBiome(Biomes::FLOWER_FOREST, OverworldBiomes::forest(false, false, true));
    registerBiome(Biomes::BIRCH_FOREST, OverworldBiomes::forest(true, false, false));
    registerBiome(Biomes::DARK_FOREST, OverworldBiomes::darkForest());
    registerBiome(Biomes::OLD_GROWTH_BIRCH_FOREST, OverworldBiomes::forest(true, true, false));
    registerBiome(Biomes::OLD_GROWTH_PINE_TAIGA, OverworldBiomes::oldGrowthTaiga(false));
    registerBiome(Biomes::OLD_GROWTH_SPRUCE_TAIGA, OverworldBiomes::oldGrowthTaiga(true));
    registerBiome(Biomes::TAIGA, OverworldBiomes::taiga(false));
    registerBiome(Biomes::SNOWY_TAIGA, OverworldBiomes::taiga(true));
    registerBiome(Biomes::SAVANNA, OverworldBiomes::savanna(false, false));
    registerBiome(Biomes::SAVANNA_PLATEAU, OverworldBiomes::savanna(false, true));
    registerBiome(Biomes::WINDSWEPT_HILLS, OverworldBiomes::windsweptHills(false));
    registerBiome(Biomes::WINDSWEPT_GRAVELLY_HILLS, OverworldBiomes::windsweptHills(false));
    registerBiome(Biomes::WINDSWEPT_FOREST, OverworldBiomes::windsweptHills(true));
    registerBiome(Biomes::WINDSWEPT_SAVANNA, OverworldBiomes::savanna(true, false));
    registerBiome(Biomes::JUNGLE, OverworldBiomes::jungle());
    registerBiome(Biomes::SPARSE_JUNGLE, OverworldBiomes::sparseJungle());
    registerBiome(Biomes::BAMBOO_JUNGLE, OverworldBiomes::bambooJungle());
    registerBiome(Biomes::BADLANDS, OverworldBiomes::badlands(false));
    registerBiome(Biomes::ERODED_BADLANDS, OverworldBiomes::badlands(false));
    registerBiome(Biomes::WOODED_BADLANDS, OverworldBiomes::badlands(true));
    registerBiome(Biomes::MEADOW, OverworldBiomes::meadow());
    registerBiome(Biomes::GROVE, OverworldBiomes::grove());
    registerBiome(Biomes::SNOWY_SLOPES, OverworldBiomes::snowySlopes());
    registerBiome(Biomes::FROZEN_PEAKS, OverworldBiomes::frozenPeaks());
    registerBiome(Biomes::JAGGED_PEAKS, OverworldBiomes::jaggedPeaks());
    registerBiome(Biomes::STONY_PEAKS, OverworldBiomes::stonyPeaks());
    registerBiome(Biomes::RIVER, OverworldBiomes::river(false));
    registerBiome(Biomes::FROZEN_RIVER, OverworldBiomes::river(true));
    registerBiome(Biomes::BEACH, OverworldBiomes::beach(false, false));
    registerBiome(Biomes::SNOWY_BEACH, OverworldBiomes::beach(true, false));
    registerBiome(Biomes::STONY_SHORE, OverworldBiomes::beach(false, true));
    registerBiome(Biomes::WARM_OCEAN, OverworldBiomes::warmOcean());
    registerBiome(Biomes::LUKEWARM_OCEAN, OverworldBiomes::lukeWarmOcean(false));
    registerBiome(Biomes::DEEP_LUKEWARM_OCEAN, OverworldBiomes::lukeWarmOcean(true));
    registerBiome(Biomes::OCEAN, OverworldBiomes::ocean(false));
    registerBiome(Biomes::DEEP_OCEAN, OverworldBiomes::ocean(true));
    registerBiome(Biomes::COLD_OCEAN, OverworldBiomes::coldOcean(false));
    registerBiome(Biomes::DEEP_COLD_OCEAN, OverworldBiomes::coldOcean(true));
    registerBiome(Biomes::FROZEN_OCEAN, OverworldBiomes::frozenOcean(false));
    registerBiome(Biomes::DEEP_FROZEN_OCEAN, OverworldBiomes::frozenOcean(true));
    registerBiome(Biomes::MUSHROOM_FIELDS, OverworldBiomes::mushroomFields());
    registerBiome(Biomes::DRIPSTONE_CAVES, OverworldBiomes::dripstoneCaves());
    registerBiome(Biomes::LUSH_CAVES, OverworldBiomes::lushCaves());

    /*
    registerBiome(Biomes::NETHER_WASTES, NetherBiomes.netherWastes());
    registerBiome(Biomes::WARPED_FOREST, NetherBiomes.warpedForest());
    registerBiome(Biomes::CRIMSON_FOREST, NetherBiomes.crimsonForest());
    registerBiome(Biomes::SOUL_SAND_VALLEY, NetherBiomes.soulSandValley());
    registerBiome(Biomes::BASALT_DELTAS, NetherBiomes.basaltDeltas());
    */

    /*
    registerBiome(Biomes::THE_END, EndBiomes.theEnd());
    registerBiome(Biomes::END_HIGHLANDS, EndBiomes.endHighlands());
    registerBiome(Biomes::END_MIDLANDS, EndBiomes.endMidlands());
    registerBiome(Biomes::SMALL_END_ISLANDS, EndBiomes.smallEndIslands());
    registerBiome(Biomes::END_BARRENS, EndBiomes.endBarrens());
    */
}

void BiomeInstances::free() {
    biomes.clear();

    THE_VOID = nullptr;
    PLAINS = nullptr;
}