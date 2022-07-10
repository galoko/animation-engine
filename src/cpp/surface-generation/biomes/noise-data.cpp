#include <vector>

#include "noise-data.hpp"

#include "noise/normal-noise.hpp"

using namespace std;

void registerNoise(Noises noise, int32_t firstOctave, double firstAmplitude, vector<double> amplitudes = {}) {
    NormalNoise::NoiseParameters *parameters =
        new NormalNoise::NoiseParameters(firstOctave, firstAmplitude, amplitudes);
    NOISE_PARAMETERS[(int32_t)noise] = parameters;
};

void registerBiomeNoises(int32_t octaveOffset, Noises temperature, Noises vegetation, Noises continentalness,
                         Noises erosion) {
    registerNoise(temperature, -10 + octaveOffset, 1.5, {0.0, 1.0, 0.0, 0.0, 0.0});
    registerNoise(vegetation, -8 + octaveOffset, 1.0, {1.0, 0.0, 0.0, 0.0, 0.0});
    registerNoise(continentalness, -9 + octaveOffset, 1.0, {1.0, 2.0, 2.0, 2.0, 1.0, 1.0, 1.0, 1.0});
    registerNoise(erosion, -9 + octaveOffset, 1.0, {1.0, 0.0, 1.0, 1.0});
};

int32_t registerNoises() {
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

    return 0;
};

int32_t dummy = registerNoises();