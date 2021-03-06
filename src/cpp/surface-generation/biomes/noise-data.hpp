#pragma once

#include <memory>
#include <string>

#include "noise/normal-noise.hpp"
#include "random.hpp"

using namespace std;

enum class Noises
{
    TEMPERATURE = 1,
    VEGETATION,
    CONTINENTALNESS,
    EROSION,
    TEMPERATURE_LARGE,
    VEGETATION_LARGE,
    CONTINENTALNESS_LARGE,
    EROSION_LARGE,
    RIDGE,
    SHIFT,
    AQUIFER_BARRIER,
    AQUIFER_FLUID_LEVEL_FLOODEDNESS,
    AQUIFER_LAVA,
    AQUIFER_FLUID_LEVEL_SPREAD,
    PILLAR,
    PILLAR_RARENESS,
    PILLAR_THICKNESS,
    SPAGHETTI_2,
    SPAGHETTI_2D_ELEVATION,
    SPAGHETTI_2D_MODULATOR,
    SPAGHETTI_2D_THICKNESS,
    SPAGHETTI_3D_1,
    SPAGHETTI_3D_2,
    SPAGHETTI_3D_RARITY,
    SPAGHETTI_3D_THICKNESS,
    SPAGHETTI_ROUGHNESS,
    SPAGHETTI_ROUGHNESS_MODULATOR,
    CAVE_ENTRANCE,
    CAVE_LAYER,
    CAVE_CHEESE,
    ORE_VEININESS,
    ORE_VEIN_A,
    ORE_VEIN_B,
    ORE_GAP,
    NOODLE,
    NOODLE_THICKNESS,
    NOODLE_RIDGE_A,
    NOODLE_RIDGE_B,
    JAGGED,
    SURFACE,
    SURFACE_SECONDARY,
    CLAY_BANDS_OFFSET,
    BADLANDS_PILLAR,
    BADLANDS_PILLAR_ROOF,
    BADLANDS_SURFACE,
    ICEBERG_PILLAR,
    ICEBERG_PILLAR_ROOF,
    ICEBERG_SURFACE,
    SWAMP,
    CALCITE,
    GRAVEL,
    POWDER_SNOW,
    PACKED_ICE,
    ICE,
    SOUL_SAND_LAYER,
    GRAVEL_LAYER,
    PATCH,
    NETHERRACK,
    NETHER_WART,
    NETHER_STATE_SELECTOR,

    FIRST = TEMPERATURE,
    LAST = NETHER_STATE_SELECTOR
};

const char *getNoiseName(Noises noise);

NormalNoise::NoiseParameters const &getNoiseParameters(Noises noise);

NormalNoise Noises_instantiate(shared_ptr<PositionalRandomFactory> random, Noises noise);

void Noises_finalize();