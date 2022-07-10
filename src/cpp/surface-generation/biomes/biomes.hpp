#pragma once

#include <inttypes.h>
#include <string>

using namespace std;

enum class Biomes
{
    NULL_BIOME = 0,
    THE_VOID = 1,
    PLAINS,
    SUNFLOWER_PLAINS,
    SNOWY_PLAINS,
    ICE_SPIKES,
    DESERT,
    SWAMP,
    FOREST,
    FLOWER_FOREST,
    BIRCH_FOREST,
    DARK_FOREST,
    OLD_GROWTH_BIRCH_FOREST,
    OLD_GROWTH_PINE_TAIGA,
    OLD_GROWTH_SPRUCE_TAIGA,
    TAIGA,
    SNOWY_TAIGA,
    SAVANNA,
    SAVANNA_PLATEAU,
    WINDSWEPT_HILLS,
    WINDSWEPT_GRAVELLY_HILLS,
    WINDSWEPT_FOREST,
    WINDSWEPT_SAVANNA,
    JUNGLE,
    SPARSE_JUNGLE,
    BAMBOO_JUNGLE,
    BADLANDS,
    ERODED_BADLANDS,
    WOODED_BADLANDS,
    MEADOW,
    GROVE,
    SNOWY_SLOPES,
    FROZEN_PEAKS,
    JAGGED_PEAKS,
    STONY_PEAKS,
    RIVER,
    FROZEN_RIVER,
    BEACH,
    SNOWY_BEACH,
    STONY_SHORE,
    WARM_OCEAN,
    LUKEWARM_OCEAN,
    DEEP_LUKEWARM_OCEAN,
    OCEAN,
    DEEP_OCEAN,
    COLD_OCEAN,
    DEEP_COLD_OCEAN,
    FROZEN_OCEAN,
    DEEP_FROZEN_OCEAN,
    MUSHROOM_FIELDS,
    DRIPSTONE_CAVES,
    LUSH_CAVES,
    NETHER_WASTES,
    WARPED_FOREST,
    CRIMSON_FOREST,
    SOUL_SAND_VALLEY,
    BASALT_DELTAS,
    THE_END,
    END_HIGHLANDS,
    END_MIDLANDS,
    SMALL_END_ISLANDS,
    END_BARRENS,
};

const char *BIOME_NAMES[] = {
    nullptr,
    "the_void",
    "plains",
    "sunflower_plains",
    "snowy_plains",
    "ice_spikes",
    "desert",
    "swamp",
    "forest",
    "flower_forest",
    "birch_forest",
    "dark_forest",
    "old_growth_birch_forest",
    "old_growth_pine_taiga",
    "old_growth_spruce_taiga",
    "taiga",
    "snowy_taiga",
    "savanna",
    "savanna_plateau",
    "windswept_hills",
    "windswept_gravelly_hills",
    "windswept_forest",
    "windswept_savanna",
    "jungle",
    "sparse_jungle",
    "bamboo_jungle",
    "badlands",
    "eroded_badlands",
    "wooded_badlands",
    "meadow",
    "grove",
    "snowy_slopes",
    "frozen_peaks",
    "jagged_peaks",
    "stony_peaks",
    "river",
    "frozen_river",
    "beach",
    "snowy_beach",
    "stony_shore",
    "warm_ocean",
    "lukewarm_ocean",
    "deep_lukewarm_ocean",
    "ocean",
    "deep_ocean",
    "cold_ocean",
    "deep_cold_ocean",
    "frozen_ocean",
    "deep_frozen_ocean",
    "mushroom_fields",
    "dripstone_caves",
    "lush_caves",
    "nether_wastes",
    "warped_forest",
    "crimson_forest",
    "soul_sand_valley",
    "basalt_deltas",
    "the_end",
    "end_highlands",
    "end_midlands",
    "small_end_islands",
    "end_barrens",
};

string getBiomeName(Biomes biome) {
    return BIOME_NAMES[(int32_t)biome];
}