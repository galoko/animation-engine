#include <vector>

#include "noise-data.hpp"

#include "noise/normal-noise.hpp"

using namespace std;

const char *NOISE_NAMES[] = {
    nullptr,
    "temperature",
    "vegetation",
    "continentalness",
    "erosion",
    "temperature_large",
    "vegetation_large",
    "continentalness_large",
    "erosion_large",
    "ridge",
    "offset",
    "aquifer_barrier",
    "aquifer_fluid_level_floodedness",
    "aquifer_lava",
    "aquifer_fluid_level_spread",
    "pillar",
    "pillar_rareness",
    "pillar_thickness",
    "spaghetti_2",
    "spaghetti_2d_elevation",
    "spaghetti_2d_modulator",
    "spaghetti_2d_thickness",
    "spaghetti_3d_1",
    "spaghetti_3d_2",
    "spaghetti_3d_rarity",
    "spaghetti_3d_thickness",
    "spaghetti_roughness",
    "spaghetti_roughness_modulator",
    "cave_entrance",
    "cave_layer",
    "cave_cheese",
    "ore_veininess",
    "ore_vein_a",
    "ore_vein_b",
    "ore_gap",
    "noodle",
    "noodle_thickness",
    "noodle_ridge_a",
    "noodle_ridge_b",
    "jagged",
    "surface",
    "surface_secondary",
    "clay_bands_offset",
    "badlands_pillar",
    "badlands_pillar_roof",
    "badlands_surface",
    "iceberg_pillar",
    "iceberg_pillar_roof",
    "iceberg_surface",
    "surface_swamp",
    "calcite",
    "gravel",
    "powder_snow",
    "packed_ice",
    "ice",
    "soul_sand_layer",
    "gravel_layer",
    "patch",
    "netherrack",
    "nether_wart",
    "nether_state_selector",
};

NormalNoise::NoiseParameters NOISE_PARAMETERS[(int32_t)Noises::LAST + 1];

void registerNoise(Noises noise, int32_t firstOctave, double firstAmplitude, vector<double> amplitudes = {}) {
    NOISE_PARAMETERS[(int32_t)noise] = NormalNoise::NoiseParameters(firstOctave, firstAmplitude, amplitudes);
};

void registerBiomeNoises(int32_t octaveOffset, Noises temperature, Noises vegetation, Noises continentalness,
                         Noises erosion) {
    registerNoise(temperature, -10 + octaveOffset, 1.5, {0.0, 1.0, 0.0, 0.0, 0.0});
    registerNoise(vegetation, -8 + octaveOffset, 1.0, {1.0, 0.0, 0.0, 0.0, 0.0});
    registerNoise(continentalness, -9 + octaveOffset, 1.0, {1.0, 2.0, 2.0, 2.0, 1.0, 1.0, 1.0, 1.0});
    registerNoise(erosion, -9 + octaveOffset, 1.0, {1.0, 0.0, 1.0, 1.0});
};

void Noises_initialize() {
    registerBiomeNoises(0, Noises::TEMPERATURE, Noises::VEGETATION, Noises::CONTINENTALNESS, Noises::EROSION);
    registerBiomeNoises(-2, Noises::TEMPERATURE_LARGE, Noises::VEGETATION_LARGE, Noises::CONTINENTALNESS_LARGE,
                        Noises::EROSION_LARGE);
    registerNoise(Noises::RIDGE, -7, 1.0, {2.0, 1.0, 0.0, 0.0, 0.0});
    registerNoise(Noises::SHIFT, -3, 1.0, {1.0, 1.0, 0.0});
    registerNoise(Noises::AQUIFER_BARRIER, -3, 1.0);
    registerNoise(Noises::AQUIFER_FLUID_LEVEL_FLOODEDNESS, -7, 1.0);
    registerNoise(Noises::AQUIFER_LAVA, -1, 1.0);
    registerNoise(Noises::AQUIFER_FLUID_LEVEL_SPREAD, -5, 1.0);
    registerNoise(Noises::PILLAR, -7, 1.0, {1.0});
    registerNoise(Noises::PILLAR_RARENESS, -8, 1.0);
    registerNoise(Noises::PILLAR_THICKNESS, -8, 1.0);
    registerNoise(Noises::SPAGHETTI_2, -7, 1.0);
    registerNoise(Noises::SPAGHETTI_2D_ELEVATION, -8, 1.0);
    registerNoise(Noises::SPAGHETTI_2D_MODULATOR, -11, 1.0);
    registerNoise(Noises::SPAGHETTI_2D_THICKNESS, -11, 1.0);
    registerNoise(Noises::SPAGHETTI_3D_1, -7, 1.0);
    registerNoise(Noises::SPAGHETTI_3D_2, -7, 1.0);
    registerNoise(Noises::SPAGHETTI_3D_RARITY, -11, 1.0);
    registerNoise(Noises::SPAGHETTI_3D_THICKNESS, -8, 1.0);
    registerNoise(Noises::SPAGHETTI_ROUGHNESS, -5, 1.0);
    registerNoise(Noises::SPAGHETTI_ROUGHNESS_MODULATOR, -8, 1.0);
    registerNoise(Noises::CAVE_ENTRANCE, -7, 0.4, {0.5, 1.0});
    registerNoise(Noises::CAVE_LAYER, -8, 1.0);
    registerNoise(Noises::CAVE_CHEESE, -8, 0.5, {1.0, 2.0, 1.0, 2.0, 1.0, 0.0, 2.0, 0.0});
    registerNoise(Noises::ORE_VEININESS, -8, 1.0);
    registerNoise(Noises::ORE_VEIN_A, -7, 1.0);
    registerNoise(Noises::ORE_VEIN_B, -7, 1.0);
    registerNoise(Noises::ORE_GAP, -5, 1.0);
    registerNoise(Noises::NOODLE, -8, 1.0);
    registerNoise(Noises::NOODLE_THICKNESS, -8, 1.0);
    registerNoise(Noises::NOODLE_RIDGE_A, -7, 1.0);
    registerNoise(Noises::NOODLE_RIDGE_B, -7, 1.0);
    registerNoise(Noises::JAGGED, -16, 1.0,
                  {1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0});
    registerNoise(Noises::SURFACE, -6, 1.0, {1.0, 1.0});
    registerNoise(Noises::SURFACE_SECONDARY, -6, 1.0, {1.0, 1.0});
    registerNoise(Noises::CLAY_BANDS_OFFSET, -8, 1.0);
    registerNoise(Noises::BADLANDS_PILLAR, -2, 1.0, {1.0, 1.0, 1.0});
    registerNoise(Noises::BADLANDS_PILLAR_ROOF, -8, 1.0);
    registerNoise(Noises::BADLANDS_SURFACE, -6, 1.0, {1.0, 1.0});
    registerNoise(Noises::ICEBERG_PILLAR, -6, 1.0, {1.0, 1.0, 1.0});
    registerNoise(Noises::ICEBERG_PILLAR_ROOF, -3, 1.0);
    registerNoise(Noises::ICEBERG_SURFACE, -6, 1.0, {1.0, 1.0});
    registerNoise(Noises::SWAMP, -2, 1.0);
    registerNoise(Noises::CALCITE, -9, 1.0, {1.0, 1.0, 1.0});
    registerNoise(Noises::GRAVEL, -8, 1.0, {1.0, 1.0, 1.0});
    registerNoise(Noises::POWDER_SNOW, -6, 1.0, {1.0, 1.0, 1.0});
    registerNoise(Noises::PACKED_ICE, -7, 1.0, {1.0, 1.0, 1.0});
    registerNoise(Noises::ICE, -4, 1.0, {1.0, 1.0, 1.0});
    registerNoise(Noises::SOUL_SAND_LAYER, -8, 1.0, {1.0, 1.0, 1.0, 0.0, 0.0, 0.0, 0.0, 0.013333333333333334});
    registerNoise(Noises::GRAVEL_LAYER, -8, 1.0, {1.0, 1.0, 1.0, 0.0, 0.0, 0.0, 0.0, 0.013333333333333334});
    registerNoise(Noises::PATCH, -5, 1.0, {0.0, 0.0, 0.0, 0.0, 0.013333333333333334});
    registerNoise(Noises::NETHERRACK, -3, 1.0, {0.0, 0.0, 0.35});
    registerNoise(Noises::NETHER_WART, -3, 1.0, {0.0, 0.0, 0.9});
    registerNoise(Noises::NETHER_STATE_SELECTOR, -4, 1.0);
};

const char *getNoiseName(Noises noise) {
    return NOISE_NAMES[(int32_t)noise];
}

NormalNoise::NoiseParameters const &getNoiseParameters(Noises noise) {
    return NOISE_PARAMETERS[(int32_t)noise];
}

NormalNoise Noises_instantiate(shared_ptr<PositionalRandomFactory> random, Noises noise) {
    return NormalNoise::create(random->fromHashOfResourceLocation(getNoiseName(noise)), getNoiseParameters(noise));
}

void Noises_finalize() {
    for (int32_t noise = (int32_t)Noises::FIRST; noise <= (int32_t)Noises::LAST; noise++) {
        NOISE_PARAMETERS[noise].~NoiseParameters();
    }
}