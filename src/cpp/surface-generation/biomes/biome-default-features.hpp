#pragma once

#include "biome-generation-settings.hpp"
#include "carvers.hpp"
#include "mob-spawner-settings.hpp"

class BiomeDefaultFeatures {
public:
    static void addDefaultCarversAndLakes(BiomeGenerationSettings::Builder &settingsBuilder) {
        settingsBuilder.addCarver(GenerationStep::Carving::AIR, Carvers::CAVE);
        settingsBuilder.addCarver(GenerationStep::Carving::AIR, Carvers::CAVE_EXTRA_UNDERGROUND);
        settingsBuilder.addCarver(GenerationStep::Carving::AIR, Carvers::CANYON);
        /*
        settingsBuilder.addFeature(GenerationStep::Decoration::LAKES, MiscOverworldPlacements::LAKE_LAVA_UNDERGROUND);
        settingsBuilder.addFeature(GenerationStep::Decoration::LAKES, MiscOverworldPlacements::LAKE_LAVA_SURFACE);
        */
    }

    static void addDefaultMonsterRoom(BiomeGenerationSettings::Builder &settingsBuilder) {
        /*
        settingsBuilder.addFeature(GenerationStep::Decoration::UNDERGROUND_STRUCTURES, CavePlacements::MONSTER_ROOM);
        settingsBuilder.addFeature(GenerationStep::Decoration::UNDERGROUND_STRUCTURES,
                                   CavePlacements::MONSTER_ROOM_DEEP);
        */
    }

    static void addDefaultUndergroundVariety(BiomeGenerationSettings::Builder &settingsBuilder) {
        /*
        settingsBuilder.addFeature(GenerationStep::Decoration::UNDERGROUND_ORES, OrePlacements::ORE_DIRT);
        settingsBuilder.addFeature(GenerationStep::Decoration::UNDERGROUND_ORES, OrePlacements::ORE_GRAVEL);
        settingsBuilder.addFeature(GenerationStep::Decoration::UNDERGROUND_ORES, OrePlacements::ORE_GRANITE_UPPER);
        settingsBuilder.addFeature(GenerationStep::Decoration::UNDERGROUND_ORES, OrePlacements::ORE_GRANITE_LOWER);
        settingsBuilder.addFeature(GenerationStep::Decoration::UNDERGROUND_ORES, OrePlacements::ORE_DIORITE_UPPER);
        settingsBuilder.addFeature(GenerationStep::Decoration::UNDERGROUND_ORES, OrePlacements::ORE_DIORITE_LOWER);
        settingsBuilder.addFeature(GenerationStep::Decoration::UNDERGROUND_ORES, OrePlacements::ORE_ANDESITE_UPPER);
        settingsBuilder.addFeature(GenerationStep::Decoration::UNDERGROUND_ORES, OrePlacements::ORE_ANDESITE_LOWER);
        settingsBuilder.addFeature(GenerationStep::Decoration::UNDERGROUND_ORES, OrePlacements::ORE_TUFF);
        settingsBuilder.addFeature(GenerationStep::Decoration::VEGETAL_DECORATION, CavePlacements::GLOW_LICHEN);
        */
    }

    static void addDripstone(BiomeGenerationSettings::Builder &settingsBuilder) {
        /*
        settingsBuilder.addFeature(GenerationStep::Decoration::LOCAL_MODIFICATIONS, CavePlacements::LARGE_DRIPSTONE);
        settingsBuilder.addFeature(GenerationStep::Decoration::UNDERGROUND_DECORATION,
                                   CavePlacements::DRIPSTONE_CLUSTER);
        settingsBuilder.addFeature(GenerationStep::Decoration::UNDERGROUND_DECORATION,
                                   CavePlacements::POINTED_DRIPSTONE);
        */
    }

    static void addDefaultOres(BiomeGenerationSettings::Builder &settingsBuilder) {
        addDefaultOres(settingsBuilder, false);
    }

    static void addDefaultOres(BiomeGenerationSettings::Builder &settingsBuilder, bool largeCopper) {
        /*
        settingsBuilder.addFeature(GenerationStep::Decoration::UNDERGROUND_ORES, OrePlacements::ORE_COAL_UPPER);
        settingsBuilder.addFeature(GenerationStep::Decoration::UNDERGROUND_ORES, OrePlacements::ORE_COAL_LOWER);
        settingsBuilder.addFeature(GenerationStep::Decoration::UNDERGROUND_ORES, OrePlacements::ORE_IRON_UPPER);
        settingsBuilder.addFeature(GenerationStep::Decoration::UNDERGROUND_ORES, OrePlacements::ORE_IRON_MIDDLE);
        settingsBuilder.addFeature(GenerationStep::Decoration::UNDERGROUND_ORES, OrePlacements::ORE_IRON_SMALL);
        settingsBuilder.addFeature(GenerationStep::Decoration::UNDERGROUND_ORES, OrePlacements::ORE_GOLD);
        settingsBuilder.addFeature(GenerationStep::Decoration::UNDERGROUND_ORES, OrePlacements::ORE_GOLD_LOWER);
        settingsBuilder.addFeature(GenerationStep::Decoration::UNDERGROUND_ORES, OrePlacements::ORE_REDSTONE);
        settingsBuilder.addFeature(GenerationStep::Decoration::UNDERGROUND_ORES, OrePlacements::ORE_REDSTONE_LOWER);
        settingsBuilder.addFeature(GenerationStep::Decoration::UNDERGROUND_ORES, OrePlacements::ORE_DIAMOND);
        settingsBuilder.addFeature(GenerationStep::Decoration::UNDERGROUND_ORES, OrePlacements::ORE_DIAMOND_LARGE);
        settingsBuilder.addFeature(GenerationStep::Decoration::UNDERGROUND_ORES, OrePlacements::ORE_DIAMOND_BURIED);
        settingsBuilder.addFeature(GenerationStep::Decoration::UNDERGROUND_ORES, OrePlacements::ORE_LAPIS);
        settingsBuilder.addFeature(GenerationStep::Decoration::UNDERGROUND_ORES, OrePlacements::ORE_LAPIS_BURIED);
        settingsBuilder.addFeature(GenerationStep::Decoration::UNDERGROUND_ORES,
                                   largeCopper ? OrePlacements::ORE_COPPER_LARGE : OrePlacements::ORE_COPPER);
        settingsBuilder.addFeature(GenerationStep::Decoration::UNDERGROUND_ORES, CavePlacements::UNDERWATER_MAGMA);
        */
    }

    static void addExtraGold(BiomeGenerationSettings::Builder &settingsBuilder) {
        /*
        settingsBuilder.addFeature(GenerationStep::Decoration::UNDERGROUND_ORES, OrePlacements::ORE_GOLD_EXTRA);
        */
    }

    static void addExtraEmeralds(BiomeGenerationSettings::Builder &settingsBuilder) {
        /*
        settingsBuilder.addFeature(GenerationStep::Decoration::UNDERGROUND_ORES, OrePlacements::ORE_EMERALD);
        */
    }

    static void addInfestedStone(BiomeGenerationSettings::Builder &settingsBuilder) {
        /*
        settingsBuilder.addFeature(GenerationStep::Decoration::UNDERGROUND_DECORATION, OrePlacements::ORE_INFESTED);
        */
    }

    static void addDefaultSoftDisks(BiomeGenerationSettings::Builder &settingsBuilder) {
        /*
        settingsBuilder.addFeature(GenerationStep::Decoration::UNDERGROUND_ORES, MiscOverworldPlacements::DISK_SAND);
        settingsBuilder.addFeature(GenerationStep::Decoration::UNDERGROUND_ORES, MiscOverworldPlacements::DISK_CLAY);
        settingsBuilder.addFeature(GenerationStep::Decoration::UNDERGROUND_ORES, MiscOverworldPlacements::DISK_GRAVEL);
        */
    }

    static void addSwampClayDisk(BiomeGenerationSettings::Builder &settingsBuilder) {
        /*
        settingsBuilder.addFeature(GenerationStep::Decoration::UNDERGROUND_ORES, MiscOverworldPlacements::DISK_CLAY);
        */
    }

    static void addMossyStoneBlock(BiomeGenerationSettings::Builder &settingsBuilder) {
        /*
        settingsBuilder.addFeature(GenerationStep::Decoration::LOCAL_MODIFICATIONS,
                                   MiscOverworldPlacements::FOREST_ROCK);
        */
    }

    static void addFerns(BiomeGenerationSettings::Builder &settingsBuilder) {
        /*
        settingsBuilder.addFeature(GenerationStep::Decoration::VEGETAL_DECORATION,
                                   VegetationPlacements::PATCH_LARGE_FERN);
        */
    }

    static void addRareBerryBushes(BiomeGenerationSettings::Builder &settingsBuilder) {
        /*
        settingsBuilder.addFeature(GenerationStep::Decoration::VEGETAL_DECORATION,
                                   VegetationPlacements::PATCH_BERRY_RARE);
        */
    }

    static void addCommonBerryBushes(BiomeGenerationSettings::Builder &settingsBuilder) {
        /*
        settingsBuilder.addFeature(GenerationStep::Decoration::VEGETAL_DECORATION,
                                   VegetationPlacements::PATCH_BERRY_COMMON);
        */
    }

    static void addLightBambooVegetation(BiomeGenerationSettings::Builder &settingsBuilder) {
        /*
        settingsBuilder.addFeature(GenerationStep::Decoration::VEGETAL_DECORATION, VegetationPlacements::BAMBOO_LIGHT);
        */
    }

    static void addBambooVegetation(BiomeGenerationSettings::Builder &settingsBuilder) {
        /*
        settingsBuilder.addFeature(GenerationStep::Decoration::VEGETAL_DECORATION, VegetationPlacements::BAMBOO);
        settingsBuilder.addFeature(GenerationStep::Decoration::VEGETAL_DECORATION,
                                   VegetationPlacements::BAMBOO_VEGETATION);
        */
    }

    static void addTaigaTrees(BiomeGenerationSettings::Builder &settingsBuilder) {
        /*
        settingsBuilder.addFeature(GenerationStep::Decoration::VEGETAL_DECORATION, VegetationPlacements::TREES_TAIGA);
        */
    }

    static void addGroveTrees(BiomeGenerationSettings::Builder &settingsBuilder) {
        /*
        settingsBuilder.addFeature(GenerationStep::Decoration::VEGETAL_DECORATION, VegetationPlacements::TREES_GROVE);
        */
    }

    static void addWaterTrees(BiomeGenerationSettings::Builder &settingsBuilder) {
        /*
        settingsBuilder.addFeature(GenerationStep::Decoration::VEGETAL_DECORATION, VegetationPlacements::TREES_WATER);
        */
    }

    static void addBirchTrees(BiomeGenerationSettings::Builder &settingsBuilder) {
        /*
        settingsBuilder.addFeature(GenerationStep::Decoration::VEGETAL_DECORATION, VegetationPlacements::TREES_BIRCH);
        */
    }

    static void addOtherBirchTrees(BiomeGenerationSettings::Builder &settingsBuilder) {
        /*
        settingsBuilder.addFeature(GenerationStep::Decoration::VEGETAL_DECORATION,
                                   VegetationPlacements::TREES_BIRCH_AND_OAK);
        */
    }

    static void addTallBirchTrees(BiomeGenerationSettings::Builder &settingsBuilder) {
        /*
        settingsBuilder.addFeature(GenerationStep::Decoration::VEGETAL_DECORATION, VegetationPlacements::BIRCH_TALL);
        */
    }

    static void addSavannaTrees(BiomeGenerationSettings::Builder &settingsBuilder) {
        /*
        settingsBuilder.addFeature(GenerationStep::Decoration::VEGETAL_DECORATION, VegetationPlacements::TREES_SAVANNA);
        */
    }

    static void addShatteredSavannaTrees(BiomeGenerationSettings::Builder &settingsBuilder) {
        /*
        settingsBuilder.addFeature(GenerationStep::Decoration::VEGETAL_DECORATION,
                                   VegetationPlacements::TREES_WINDSWEPT_SAVANNA);
        */
    }

    static void addLushCavesVegetationFeatures(BiomeGenerationSettings::Builder &settingsBuilder) {
        /*
        settingsBuilder.addFeature(GenerationStep::Decoration::VEGETAL_DECORATION,
                                   CavePlacements::LUSH_CAVES_CEILING_VEGETATION);
        settingsBuilder.addFeature(GenerationStep::Decoration::VEGETAL_DECORATION, CavePlacements::CAVE_VINES);
        settingsBuilder.addFeature(GenerationStep::Decoration::VEGETAL_DECORATION, CavePlacements::LUSH_CAVES_CLAY);
        settingsBuilder.addFeature(GenerationStep::Decoration::VEGETAL_DECORATION,
                                   CavePlacements::LUSH_CAVES_VEGETATION);
        settingsBuilder.addFeature(GenerationStep::Decoration::VEGETAL_DECORATION, CavePlacements::ROOTED_AZALEA_TREE);
        settingsBuilder.addFeature(GenerationStep::Decoration::VEGETAL_DECORATION, CavePlacements::SPORE_BLOSSOM);
        settingsBuilder.addFeature(GenerationStep::Decoration::VEGETAL_DECORATION, CavePlacements::CLASSIC_VINES);
        */
    }

    static void addLushCavesSpecialOres(BiomeGenerationSettings::Builder &settingsBuilder) {
        /*
        settingsBuilder.addFeature(GenerationStep::Decoration::UNDERGROUND_ORES, OrePlacements::ORE_CLAY);
        */
    }

    static void addMountainTrees(BiomeGenerationSettings::Builder &settingsBuilder) {
        /*
        settingsBuilder.addFeature(GenerationStep::Decoration::VEGETAL_DECORATION,
                                   VegetationPlacements::TREES_WINDSWEPT_HILLS);
        */
    }

    static void addMountainForestTrees(BiomeGenerationSettings::Builder &settingsBuilder) {
        /*
        settingsBuilder.addFeature(GenerationStep::Decoration::VEGETAL_DECORATION,
                                   VegetationPlacements::TREES_WINDSWEPT_FOREST);
        */
    }

    static void addJungleTrees(BiomeGenerationSettings::Builder &settingsBuilder) {
        /*
        settingsBuilder.addFeature(GenerationStep::Decoration::VEGETAL_DECORATION, VegetationPlacements::TREES_JUNGLE);
        */
    }

    static void addSparseJungleTrees(BiomeGenerationSettings::Builder &settingsBuilder) {
        /*
        settingsBuilder.addFeature(GenerationStep::Decoration::VEGETAL_DECORATION,
                                   VegetationPlacements::TREES_SPARSE_JUNGLE);
        */
    }

    static void addBadlandsTrees(BiomeGenerationSettings::Builder &settingsBuilder) {
        /*
        settingsBuilder.addFeature(GenerationStep::Decoration::VEGETAL_DECORATION,
                                   VegetationPlacements::TREES_BADLANDS);
        */
    }

    static void addSnowyTrees(BiomeGenerationSettings::Builder &settingsBuilder) {
        /*
        settingsBuilder.addFeature(GenerationStep::Decoration::VEGETAL_DECORATION, VegetationPlacements::TREES_SNOWY);
        */
    }

    static void addJungleGrass(BiomeGenerationSettings::Builder &settingsBuilder) {
        /*
        settingsBuilder.addFeature(GenerationStep::Decoration::VEGETAL_DECORATION,
                                   VegetationPlacements::PATCH_GRASS_JUNGLE);
        */
    }

    static void addSavannaGrass(BiomeGenerationSettings::Builder &settingsBuilder) {
        /*
        settingsBuilder.addFeature(GenerationStep::Decoration::VEGETAL_DECORATION,
                                   VegetationPlacements::PATCH_TALL_GRASS);
        */
    }

    static void addShatteredSavannaGrass(BiomeGenerationSettings::Builder &settingsBuilder) {
        /*
        settingsBuilder.addFeature(GenerationStep::Decoration::VEGETAL_DECORATION,
                                   VegetationPlacements::PATCH_GRASS_NORMAL);
        */
    }

    static void addSavannaExtraGrass(BiomeGenerationSettings::Builder &settingsBuilder) {
        /*
        settingsBuilder.addFeature(GenerationStep::Decoration::VEGETAL_DECORATION,
                                   VegetationPlacements::PATCH_GRASS_SAVANNA);
        */
    }

    static void addBadlandGrass(BiomeGenerationSettings::Builder &settingsBuilder) {
        /*
        settingsBuilder.addFeature(GenerationStep::Decoration::VEGETAL_DECORATION,
                                   VegetationPlacements::PATCH_GRASS_BADLANDS);
        settingsBuilder.addFeature(GenerationStep::Decoration::VEGETAL_DECORATION,
                                   VegetationPlacements::PATCH_DEAD_BUSH_BADLANDS);
        */
    }

    static void addForestFlowers(BiomeGenerationSettings::Builder &settingsBuilder) {
        /*
        settingsBuilder.addFeature(GenerationStep::Decoration::VEGETAL_DECORATION,
                                   VegetationPlacements::FOREST_FLOWERS);
        */
    }

    static void addForestGrass(BiomeGenerationSettings::Builder &settingsBuilder) {
        /*
        settingsBuilder.addFeature(GenerationStep::Decoration::VEGETAL_DECORATION,
                                   VegetationPlacements::PATCH_GRASS_FOREST);
        */
    }

    static void addSwampVegetation(BiomeGenerationSettings::Builder &settingsBuilder) {
        /*
        settingsBuilder.addFeature(GenerationStep::Decoration::VEGETAL_DECORATION, VegetationPlacements::TREES_SWAMP);
        settingsBuilder.addFeature(GenerationStep::Decoration::VEGETAL_DECORATION, VegetationPlacements::FLOWER_SWAMP);
        settingsBuilder.addFeature(GenerationStep::Decoration::VEGETAL_DECORATION,
                                   VegetationPlacements::PATCH_GRASS_NORMAL);
        settingsBuilder.addFeature(GenerationStep::Decoration::VEGETAL_DECORATION,
                                   VegetationPlacements::PATCH_DEAD_BUSH);
        settingsBuilder.addFeature(GenerationStep::Decoration::VEGETAL_DECORATION,
                                   VegetationPlacements::PATCH_WATERLILY);
        settingsBuilder.addFeature(GenerationStep::Decoration::VEGETAL_DECORATION,
                                   VegetationPlacements::BROWN_MUSHROOM_SWAMP);
        settingsBuilder.addFeature(GenerationStep::Decoration::VEGETAL_DECORATION,
                                   VegetationPlacements::RED_MUSHROOM_SWAMP);
        */
    }

    static void addMushroomFieldVegetation(BiomeGenerationSettings::Builder &settingsBuilder) {
        /*
        settingsBuilder.addFeature(GenerationStep::Decoration::VEGETAL_DECORATION,
                                   VegetationPlacements::MUSHROOM_ISLAND_VEGETATION);
        settingsBuilder.addFeature(GenerationStep::Decoration::VEGETAL_DECORATION,
                                   VegetationPlacements::BROWN_MUSHROOM_TAIGA);
        settingsBuilder.addFeature(GenerationStep::Decoration::VEGETAL_DECORATION,
                                   VegetationPlacements::RED_MUSHROOM_TAIGA);
        */
    }

    static void addPlainVegetation(BiomeGenerationSettings::Builder &settingsBuilder) {
        /*
        settingsBuilder.addFeature(GenerationStep::Decoration::VEGETAL_DECORATION, VegetationPlacements::TREES_PLAINS);
        settingsBuilder.addFeature(GenerationStep::Decoration::VEGETAL_DECORATION, VegetationPlacements::FLOWER_PLAINS);
        settingsBuilder.addFeature(GenerationStep::Decoration::VEGETAL_DECORATION,
                                   VegetationPlacements::PATCH_GRASS_PLAIN);
        */
    }

    static void addDesertVegetation(BiomeGenerationSettings::Builder &settingsBuilder) {
        /*
        settingsBuilder.addFeature(GenerationStep::Decoration::VEGETAL_DECORATION,
                                   VegetationPlacements::PATCH_DEAD_BUSH_2);
        */
    }

    static void addGiantTaigaVegetation(BiomeGenerationSettings::Builder &settingsBuilder) {
        /*
        settingsBuilder.addFeature(GenerationStep::Decoration::VEGETAL_DECORATION,
                                   VegetationPlacements::PATCH_GRASS_TAIGA);
        settingsBuilder.addFeature(GenerationStep::Decoration::VEGETAL_DECORATION,
                                   VegetationPlacements::PATCH_DEAD_BUSH);
        settingsBuilder.addFeature(GenerationStep::Decoration::VEGETAL_DECORATION,
                                   VegetationPlacements::BROWN_MUSHROOM_OLD_GROWTH);
        settingsBuilder.addFeature(GenerationStep::Decoration::VEGETAL_DECORATION,
                                   VegetationPlacements::RED_MUSHROOM_OLD_GROWTH);
        */
    }

    static void addDefaultFlowers(BiomeGenerationSettings::Builder &settingsBuilder) {
        /*
        settingsBuilder.addFeature(GenerationStep::Decoration::VEGETAL_DECORATION,
                                   VegetationPlacements::FLOWER_DEFAULT);
        */
    }

    static void addMeadowVegetation(BiomeGenerationSettings::Builder &settingsBuilder) {
        /*
        settingsBuilder.addFeature(GenerationStep::Decoration::VEGETAL_DECORATION,
                                   VegetationPlacements::PATCH_GRASS_PLAIN);
        settingsBuilder.addFeature(GenerationStep::Decoration::VEGETAL_DECORATION, VegetationPlacements::FLOWER_MEADOW);
        settingsBuilder.addFeature(GenerationStep::Decoration::VEGETAL_DECORATION, VegetationPlacements::TREES_MEADOW);
        */
    }

    static void addWarmFlowers(BiomeGenerationSettings::Builder &settingsBuilder) {
        /*
        settingsBuilder.addFeature(GenerationStep::Decoration::VEGETAL_DECORATION, VegetationPlacements::FLOWER_WARM);
        */
    }

    static void addDefaultGrass(BiomeGenerationSettings::Builder &settingsBuilder) {
        /*
        settingsBuilder.addFeature(GenerationStep::Decoration::VEGETAL_DECORATION,
                                   VegetationPlacements::PATCH_GRASS_BADLANDS);
        */
    }

    static void addTaigaGrass(BiomeGenerationSettings::Builder &settingsBuilder) {
        /*
        settingsBuilder.addFeature(GenerationStep::Decoration::VEGETAL_DECORATION,
                                   VegetationPlacements::PATCH_GRASS_TAIGA_2);
        settingsBuilder.addFeature(GenerationStep::Decoration::VEGETAL_DECORATION,
                                   VegetationPlacements::BROWN_MUSHROOM_TAIGA);
        settingsBuilder.addFeature(GenerationStep::Decoration::VEGETAL_DECORATION,
                                   VegetationPlacements::RED_MUSHROOM_TAIGA);
        */
    }

    static void addPlainGrass(BiomeGenerationSettings::Builder &settingsBuilder) {
        /*
        settingsBuilder.addFeature(GenerationStep::Decoration::VEGETAL_DECORATION,
                                   VegetationPlacements::PATCH_TALL_GRASS_2);
        */
    }

    static void addDefaultMushrooms(BiomeGenerationSettings::Builder &settingsBuilder) {
        /*
        settingsBuilder.addFeature(GenerationStep::Decoration::VEGETAL_DECORATION,
                                   VegetationPlacements::BROWN_MUSHROOM_NORMAL);
        settingsBuilder.addFeature(GenerationStep::Decoration::VEGETAL_DECORATION,
                                   VegetationPlacements::RED_MUSHROOM_NORMAL);
        */
    }

    static void addDefaultExtraVegetation(BiomeGenerationSettings::Builder &settingsBuilder) {
        /*
        settingsBuilder.addFeature(GenerationStep::Decoration::VEGETAL_DECORATION,
                                   VegetationPlacements::PATCH_SUGAR_CANE);
        settingsBuilder.addFeature(GenerationStep::Decoration::VEGETAL_DECORATION, VegetationPlacements::PATCH_PUMPKIN);
        */
    }

    static void addBadlandExtraVegetation(BiomeGenerationSettings::Builder &settingsBuilder) {
        /*
        settingsBuilder.addFeature(GenerationStep::Decoration::VEGETAL_DECORATION,
                                   VegetationPlacements::PATCH_SUGAR_CANE_BADLANDS);
        settingsBuilder.addFeature(GenerationStep::Decoration::VEGETAL_DECORATION, VegetationPlacements::PATCH_PUMPKIN);
        settingsBuilder.addFeature(GenerationStep::Decoration::VEGETAL_DECORATION,
                                   VegetationPlacements::PATCH_CACTUS_DECORATED);
        */
    }

    static void addJungleMelons(BiomeGenerationSettings::Builder &settingsBuilder) {
        /*
        settingsBuilder.addFeature(GenerationStep::Decoration::VEGETAL_DECORATION, VegetationPlacements::PATCH_MELON);
        */
    }

    static void addSparseJungleMelons(BiomeGenerationSettings::Builder &settingsBuilder) {
        /*
        settingsBuilder.addFeature(GenerationStep::Decoration::VEGETAL_DECORATION,
                                   VegetationPlacements::PATCH_MELON_SPARSE);
        */
    }

    static void addJungleVines(BiomeGenerationSettings::Builder &settingsBuilder) {
        /*
        settingsBuilder.addFeature(GenerationStep::Decoration::VEGETAL_DECORATION, VegetationPlacements::VINES);
        */
    }

    static void addDesertExtraVegetation(BiomeGenerationSettings::Builder &settingsBuilder) {
        /*
        settingsBuilder.addFeature(GenerationStep::Decoration::VEGETAL_DECORATION,
                                   VegetationPlacements::PATCH_SUGAR_CANE_DESERT);
        settingsBuilder.addFeature(GenerationStep::Decoration::VEGETAL_DECORATION, VegetationPlacements::PATCH_PUMPKIN);
        settingsBuilder.addFeature(GenerationStep::Decoration::VEGETAL_DECORATION,
                                   VegetationPlacements::PATCH_CACTUS_DESERT);
        */
    }

    static void addSwampExtraVegetation(BiomeGenerationSettings::Builder &settingsBuilder) {
        /*
        settingsBuilder.addFeature(GenerationStep::Decoration::VEGETAL_DECORATION,
                                   VegetationPlacements::PATCH_SUGAR_CANE_SWAMP);
        settingsBuilder.addFeature(GenerationStep::Decoration::VEGETAL_DECORATION, VegetationPlacements::PATCH_PUMPKIN);
        */
    }

    static void addDesertExtraDecoration(BiomeGenerationSettings::Builder &settingsBuilder) {
        /*
        settingsBuilder.addFeature(GenerationStep::Decoration::SURFACE_STRUCTURES,
                                   MiscOverworldPlacements::DESERT_WELL);
        */
    }

    static void addFossilDecoration(BiomeGenerationSettings::Builder &settingsBuilder) {
        /*
        settingsBuilder.addFeature(GenerationStep::Decoration::UNDERGROUND_STRUCTURES, CavePlacements::FOSSIL_UPPER);
        settingsBuilder.addFeature(GenerationStep::Decoration::UNDERGROUND_STRUCTURES, CavePlacements::FOSSIL_LOWER);
        */
    }

    static void addColdOceanExtraVegetation(BiomeGenerationSettings::Builder &settingsBuilder) {
        /*
        settingsBuilder.addFeature(GenerationStep::Decoration::VEGETAL_DECORATION, AquaticPlacements::KELP_COLD);
        */
    }

    static void addDefaultSeagrass(BiomeGenerationSettings::Builder &settingsBuilder) {
        /*
        settingsBuilder.addFeature(GenerationStep::Decoration::VEGETAL_DECORATION, AquaticPlacements::SEAGRASS_SIMPLE);
        */
    }

    static void addLukeWarmKelp(BiomeGenerationSettings::Builder &settingsBuilder) {
        /*
        settingsBuilder.addFeature(GenerationStep::Decoration::VEGETAL_DECORATION, AquaticPlacements::KELP_WARM);
        */
    }

    static void addDefaultSprings(BiomeGenerationSettings::Builder &settingsBuilder) {
        /*
        settingsBuilder.addFeature(GenerationStep::Decoration::FLUID_SPRINGS, MiscOverworldPlacements::SPRING_WATER);
        settingsBuilder.addFeature(GenerationStep::Decoration::FLUID_SPRINGS, MiscOverworldPlacements::SPRING_LAVA);
        */
    }

    static void addFrozenSprings(BiomeGenerationSettings::Builder &settingsBuilder) {
        /*
        settingsBuilder.addFeature(GenerationStep::Decoration::FLUID_SPRINGS,
                                   MiscOverworldPlacements::SPRING_LAVA_FROZEN);
        */
    }

    static void addIcebergs(BiomeGenerationSettings::Builder &settingsBuilder) {
        /*
        settingsBuilder.addFeature(GenerationStep::Decoration::LOCAL_MODIFICATIONS,
                                   MiscOverworldPlacements::ICEBERG_PACKED);
        settingsBuilder.addFeature(GenerationStep::Decoration::LOCAL_MODIFICATIONS,
                                   MiscOverworldPlacements::ICEBERG_BLUE);
        */
    }

    static void addBlueIce(BiomeGenerationSettings::Builder &settingsBuilder) {
        /*
        settingsBuilder.addFeature(GenerationStep::Decoration::SURFACE_STRUCTURES, MiscOverworldPlacements::BLUE_ICE);
        */
    }

    static void addSurfaceFreezing(BiomeGenerationSettings::Builder &settingsBuilder) {
        /*
        settingsBuilder.addFeature(GenerationStep::Decoration::TOP_LAYER_MODIFICATION,
                                   MiscOverworldPlacements::FREEZE_TOP_LAYER);
        */
    }

    static void addNetherDefaultOres(BiomeGenerationSettings::Builder &settingsBuilder) {
        /*
        settingsBuilder.addFeature(GenerationStep::Decoration::UNDERGROUND_DECORATION,
                                   OrePlacements::ORE_GRAVEL_NETHER);
        settingsBuilder.addFeature(GenerationStep::Decoration::UNDERGROUND_DECORATION, OrePlacements::ORE_BLACKSTONE);
        settingsBuilder.addFeature(GenerationStep::Decoration::UNDERGROUND_DECORATION, OrePlacements::ORE_GOLD_NETHER);
        settingsBuilder.addFeature(GenerationStep::Decoration::UNDERGROUND_DECORATION,
                                   OrePlacements::ORE_QUARTZ_NETHER);
        addAncientDebris(settingsBuilder);
        */
    }

    static void addAncientDebris(BiomeGenerationSettings::Builder &settingsBuilder) {
        /*
        settingsBuilder.addFeature(GenerationStep::Decoration::UNDERGROUND_DECORATION,
                                   OrePlacements::ORE_ANCIENT_DEBRIS_LARGE);
        settingsBuilder.addFeature(GenerationStep::Decoration::UNDERGROUND_DECORATION,
                                   OrePlacements::ORE_ANCIENT_DEBRIS_SMALL);
        */
    }

    static void addDefaultCrystalFormations(BiomeGenerationSettings::Builder &settingsBuilder) {
        /*
        settingsBuilder.addFeature(GenerationStep::Decoration::LOCAL_MODIFICATIONS, CavePlacements::AMETHYST_GEODE);
        */
    }

    static void farmAnimals(MobSpawnSettings::Builder &mobSpawnerBuilder) {
        /*
        mobSpawnerBuilder.addSpawn(MobCategory::CREATURE,
                                 make_shared<MobSpawnSettings::SpawnerData>(EntityType::SHEEP, 12, 4, 4));
        mobSpawnerBuilder.addSpawn(MobCategory::CREATURE,
                                 make_shared<MobSpawnSettings::SpawnerData>(EntityType::PIG, 10, 4, 4));
        mobSpawnerBuilder.addSpawn(MobCategory::CREATURE,
                                 make_shared<MobSpawnSettings::SpawnerData>(EntityType::CHICKEN, 10, 4, 4));
        mobSpawnerBuilder.addSpawn(MobCategory::CREATURE,
                                 make_shared<MobSpawnSettings::SpawnerData>(EntityType::COW, 8, 4, 4));
        */
    }

    static void caveSpawns(MobSpawnSettings::Builder &mobSpawnerBuilder) {
        /*
        mobSpawnerBuilder.addSpawn(MobCategory::AMBIENT,
                                 make_shared<MobSpawnSettings::SpawnerData>(EntityType::BAT, 10, 8, 8));
        mobSpawnerBuilder.addSpawn(MobCategory::UNDERGROUND_WATER_CREATURE,
                                 make_shared<MobSpawnSettings::SpawnerData>(EntityType::GLOW_SQUID, 10, 4, 6));
        */
    }

    static void commonSpawns(MobSpawnSettings::Builder &mobSpawnerBuilder) {
        caveSpawns(mobSpawnerBuilder);
        monsters(mobSpawnerBuilder, 95, 5, 100, false);
    }

    static void oceanSpawns(MobSpawnSettings::Builder &mobSpawnerBuilder, int32_t squidWeight, int32_t squidMaxCount,
                            int32_t codWeight) {
        /*
        mobSpawnerBuilder.addSpawn(MobCategory::WATER_CREATURE, make_shared<MobSpawnSettings::SpawnerData>(
                                                                  EntityType::SQUID, squidWeight, 1, squidMaxCount));
        mobSpawnerBuilder.addSpawn(MobCategory::WATER_AMBIENT,
                                 make_shared<MobSpawnSettings::SpawnerData>(EntityType::COD, codWeight, 3, 6));
        commonSpawns(mobSpawnerBuilder);
        mobSpawnerBuilder.addSpawn(MobCategory::MONSTER,
                                 make_shared<MobSpawnSettings::SpawnerData>(EntityType::DROWNED, 5, 1, 1));
        */
    }

    static void warmOceanSpawns(MobSpawnSettings::Builder &mobSpawnerBuilder, int32_t squidWeight,
                                int32_t squidMinCount) {
        /*
        mobSpawnerBuilder.addSpawn(MobCategory::WATER_CREATURE, make_shared<MobSpawnSettings::SpawnerData>(
                                                                  EntityType::SQUID, squidWeight, squidMinCount, 4));
        mobSpawnerBuilder.addSpawn(MobCategory::WATER_AMBIENT,
                                 make_shared<MobSpawnSettings::SpawnerData>(EntityType::TROPICAL_FISH, 25, 8, 8));
        mobSpawnerBuilder.addSpawn(MobCategory::WATER_CREATURE,
                                 make_shared<MobSpawnSettings::SpawnerData>(EntityType::DOLPHIN, 2, 1, 2));
        mobSpawnerBuilder.addSpawn(MobCategory::MONSTER,
                                 make_shared<MobSpawnSettings::SpawnerData>(EntityType::DROWNED, 5, 1, 1));
        */
        commonSpawns(mobSpawnerBuilder);
    }

    static void plainsSpawns(MobSpawnSettings::Builder &mobSpawnerBuilder) {
        farmAnimals(mobSpawnerBuilder);
        /*
        mobSpawnerBuilder.addSpawn(MobCategory::CREATURE,
                                 make_shared<MobSpawnSettings::SpawnerData>(EntityType::HORSE, 5, 2, 6));
        mobSpawnerBuilder.addSpawn(MobCategory::CREATURE,
                                 make_shared<MobSpawnSettings::SpawnerData>(EntityType::DONKEY, 1, 1, 3));
        */
        commonSpawns(mobSpawnerBuilder);
    }

    static void snowySpawns(MobSpawnSettings::Builder &mobSpawnerBuilder) {
        /*
        mobSpawnerBuilder.addSpawn(MobCategory::CREATURE,
                                 make_shared<MobSpawnSettings::SpawnerData>(EntityType::RABBIT, 10, 2, 3));
        mobSpawnerBuilder.addSpawn(MobCategory::CREATURE,
                                 make_shared<MobSpawnSettings::SpawnerData>(EntityType::POLAR_BEAR, 1, 1, 2));
        caveSpawns(mobSpawnerBuilder);
        monsters(mobSpawnerBuilder, 95, 5, 20, false);
        mobSpawnerBuilder.addSpawn(MobCategory::MONSTER,
                                 make_shared<MobSpawnSettings::SpawnerData>(EntityType::STRAY, 80, 4, 4));
        */
    }

    static void desertSpawns(MobSpawnSettings::Builder &mobSpawnerBuilder) {
        /*
        mobSpawnerBuilder.addSpawn(MobCategory::CREATURE,
                                 make_shared<MobSpawnSettings::SpawnerData>(EntityType::RABBIT, 4, 2, 3));
        caveSpawns(mobSpawnerBuilder);
        monsters(mobSpawnerBuilder, 19, 1, 100, false);
        mobSpawnerBuilder.addSpawn(MobCategory::MONSTER,
                                 make_shared<MobSpawnSettings::SpawnerData>(EntityType::HUSK, 80, 4, 4));
        */
    }

    static void dripstoneCavesSpawns(MobSpawnSettings::Builder &mobSpawnerBuilder) {
        /*
        caveSpawns(mobSpawnerBuilder);
        monsters(mobSpawnerBuilder, 95, 5, 100, false);
        mobSpawnerBuilder.addSpawn(MobCategory::MONSTER,
                                 make_shared<MobSpawnSettings::SpawnerData>(EntityType::DROWNED, 95, 4, 4));
        */
    }

    static void monsters(MobSpawnSettings::Builder &mobSpawnerBuilder, int32_t zombieWeight,
                         int32_t zombieVillagerWeight, int32_t skeletonWeight, bool water) {
        /*
        mobSpawnerBuilder.addSpawn(MobCategory::MONSTER,
                                 make_shared<MobSpawnSettings::SpawnerData>(EntityType::SPIDER, 100, 4, 4));
        mobSpawnerBuilder.addSpawn(MobCategory::MONSTER,
                                 make_shared<MobSpawnSettings::SpawnerData>(
                                     water ? EntityType::DROWNED : EntityType::ZOMBIE, zombieWeight, 4, 4));
        mobSpawnerBuilder.addSpawn(MobCategory::MONSTER, make_shared<MobSpawnSettings::SpawnerData>(
                                                           EntityType::ZOMBIE_VILLAGER, zombieVillagerWeight, 1, 1));
        mobSpawnerBuilder.addSpawn(MobCategory::MONSTER, make_shared<MobSpawnSettings::SpawnerData>(
                                                           EntityType::SKELETON, skeletonWeight, 4, 4));
        mobSpawnerBuilder.addSpawn(MobCategory::MONSTER,
                                 make_shared<MobSpawnSettings::SpawnerData>(EntityType::CREEPER, 100, 4, 4));
        mobSpawnerBuilder.addSpawn(MobCategory::MONSTER,
                                 make_shared<MobSpawnSettings::SpawnerData>(EntityType::SLIME, 100, 4, 4));
        mobSpawnerBuilder.addSpawn(MobCategory::MONSTER,
                                 make_shared<MobSpawnSettings::SpawnerData>(EntityType::ENDERMAN, 10, 1, 4));
        mobSpawnerBuilder.addSpawn(MobCategory::MONSTER,
                                 make_shared<MobSpawnSettings::SpawnerData>(EntityType::WITCH, 5, 1, 1));
        */
    }

    static void mooshroomSpawns(MobSpawnSettings::Builder &mobSpawnerBuilder) {
        /*
        mobSpawnerBuilder.addSpawn(MobCategory::CREATURE,
                                 make_shared<MobSpawnSettings::SpawnerData>(EntityType::MOOSHROOM, 8, 4, 8));
        caveSpawns(mobSpawnerBuilder);
        */
    }

    static void baseJungleSpawns(MobSpawnSettings::Builder &mobSpawnerBuilder) {
        /*
        farmAnimals(mobSpawnerBuilder);
        mobSpawnerBuilder.addSpawn(MobCategory::CREATURE,
                                 make_shared<MobSpawnSettings::SpawnerData>(EntityType::CHICKEN, 10, 4, 4));
        commonSpawns(mobSpawnerBuilder);
        */
    }

    static void endSpawns(MobSpawnSettings::Builder &mobSpawnerBuilder) {
        /*
        mobSpawnerBuilder.addSpawn(MobCategory::MONSTER,
                                 make_shared<MobSpawnSettings::SpawnerData>(EntityType::ENDERMAN, 10, 4, 4));
        */
    }
};