import { NoiseParameters, NormalNoise } from "./noise/normal-noise"
import { PositionalRandomFactory } from "./random"

export enum Noises {
    TEMPERATURE = "temperature",
    VEGETATION = "vegetation",
    CONTINENTALNESS = "continentalness",
    EROSION = "erosion",
    TEMPERATURE_LARGE = "temperature_large",
    VEGETATION_LARGE = "vegetation_large",
    CONTINENTALNESS_LARGE = "continentalness_large",
    EROSION_LARGE = "erosion_large",
    RIDGE = "ridge",
    SHIFT = "offset",
    AQUIFER_BARRIER = "aquifer_barrier",
    AQUIFER_FLUID_LEVEL_FLOODEDNESS = "aquifer_fluid_level_floodedness",
    AQUIFER_LAVA = "aquifer_lava",
    AQUIFER_FLUID_LEVEL_SPREAD = "aquifer_fluid_level_spread",
    PILLAR = "pillar",
    PILLAR_RARENESS = "pillar_rareness",
    PILLAR_THICKNESS = "pillar_thickness",
    SPAGHETTI_2 = "spaghetti_2",
    SPAGHETTI_2D_ELEVATION = "spaghetti_2d_elevation",
    SPAGHETTI_2D_MODULATOR = "spaghetti_2d_modulator",
    SPAGHETTI_2D_THICKNESS = "spaghetti_2d_thickness",
    SPAGHETTI_3D_1 = "spaghetti_3d_1",
    SPAGHETTI_3D_2 = "spaghetti_3d_2",
    SPAGHETTI_3D_RARITY = "spaghetti_3d_rarity",
    SPAGHETTI_3D_THICKNESS = "spaghetti_3d_thickness",
    SPAGHETTI_ROUGHNESS = "spaghetti_roughness",
    SPAGHETTI_ROUGHNESS_MODULATOR = "spaghetti_roughness_modulator",
    CAVE_ENTRANCE = "cave_entrance",
    CAVE_LAYER = "cave_layer",
    CAVE_CHEESE = "cave_cheese",
    ORE_VEININESS = "ore_veininess",
    ORE_VEIN_A = "ore_vein_a",
    ORE_VEIN_B = "ore_vein_b",
    ORE_GAP = "ore_gap",
    NOODLE = "noodle",
    NOODLE_THICKNESS = "noodle_thickness",
    NOODLE_RIDGE_A = "noodle_ridge_a",
    NOODLE_RIDGE_B = "noodle_ridge_b",
    JAGGED = "jagged",
    SURFACE = "surface",
    SURFACE_SECONDARY = "surface_secondary",
    CLAY_BANDS_OFFSET = "clay_bands_offset",
    BADLANDS_PILLAR = "badlands_pillar",
    BADLANDS_PILLAR_ROOF = "badlands_pillar_roof",
    BADLANDS_SURFACE = "badlands_surface",
    ICEBERG_PILLAR = "iceberg_pillar",
    ICEBERG_PILLAR_ROOF = "iceberg_pillar_roof",
    ICEBERG_SURFACE = "iceberg_surface",
    SWAMP = "surface_swamp",
    CALCITE = "calcite",
    GRAVEL = "gravel",
    POWDER_SNOW = "powder_snow",
    PACKED_ICE = "packed_ice",
    ICE = "ice",
    SOUL_SAND_LAYER = "soul_sand_layer",
    GRAVEL_LAYER = "gravel_layer",
    PATCH = "patch",
    NETHERRACK = "netherrack",
    NETHER_WART = "nether_wart",
    NETHER_STATE_SELECTOR = "nether_state_selector",
}

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
export const NOISES: {
    [key in Noises]: NoiseParameters
} = {}

function registerNoises() {
    registerBiomeNoises(
        0,
        Noises.TEMPERATURE,
        Noises.VEGETATION,
        Noises.CONTINENTALNESS,
        Noises.EROSION
    )
    registerBiomeNoises(
        -2,
        Noises.TEMPERATURE_LARGE,
        Noises.VEGETATION_LARGE,
        Noises.CONTINENTALNESS_LARGE,
        Noises.EROSION_LARGE
    )
    register(Noises.RIDGE, -7, 1.0, 2.0, 1.0, 0.0, 0.0, 0.0)
    register(Noises.SHIFT, -3, 1.0, 1.0, 1.0, 0.0)
    register(Noises.AQUIFER_BARRIER, -3, 1.0)
    register(Noises.AQUIFER_FLUID_LEVEL_FLOODEDNESS, -7, 1.0)
    register(Noises.AQUIFER_LAVA, -1, 1.0)
    register(Noises.AQUIFER_FLUID_LEVEL_SPREAD, -5, 1.0)
    register(Noises.PILLAR, -7, 1.0, 1.0)
    register(Noises.PILLAR_RARENESS, -8, 1.0)
    register(Noises.PILLAR_THICKNESS, -8, 1.0)
    register(Noises.SPAGHETTI_2, -7, 1.0)
    register(Noises.SPAGHETTI_2D_ELEVATION, -8, 1.0)
    register(Noises.SPAGHETTI_2D_MODULATOR, -11, 1.0)
    register(Noises.SPAGHETTI_2D_THICKNESS, -11, 1.0)
    register(Noises.SPAGHETTI_3D_1, -7, 1.0)
    register(Noises.SPAGHETTI_3D_2, -7, 1.0)
    register(Noises.SPAGHETTI_3D_RARITY, -11, 1.0)
    register(Noises.SPAGHETTI_3D_THICKNESS, -8, 1.0)
    register(Noises.SPAGHETTI_ROUGHNESS, -5, 1.0)
    register(Noises.SPAGHETTI_ROUGHNESS_MODULATOR, -8, 1.0)
    register(Noises.CAVE_ENTRANCE, -7, 0.4, 0.5, 1.0)
    register(Noises.CAVE_LAYER, -8, 1.0)
    register(Noises.CAVE_CHEESE, -8, 0.5, 1.0, 2.0, 1.0, 2.0, 1.0, 0.0, 2.0, 0.0)
    register(Noises.ORE_VEININESS, -8, 1.0)
    register(Noises.ORE_VEIN_A, -7, 1.0)
    register(Noises.ORE_VEIN_B, -7, 1.0)
    register(Noises.ORE_GAP, -5, 1.0)
    register(Noises.NOODLE, -8, 1.0)
    register(Noises.NOODLE_THICKNESS, -8, 1.0)
    register(Noises.NOODLE_RIDGE_A, -7, 1.0)
    register(Noises.NOODLE_RIDGE_B, -7, 1.0)
    register(
        Noises.JAGGED,
        -16,
        1.0,
        1.0,
        1.0,
        1.0,
        1.0,
        1.0,
        1.0,
        1.0,
        1.0,
        1.0,
        1.0,
        1.0,
        1.0,
        1.0,
        1.0,
        1.0
    )
    register(Noises.SURFACE, -6, 1.0, 1.0, 1.0)
    register(Noises.SURFACE_SECONDARY, -6, 1.0, 1.0, 1.0)
    register(Noises.CLAY_BANDS_OFFSET, -8, 1.0)
    register(Noises.BADLANDS_PILLAR, -2, 1.0, 1.0, 1.0, 1.0)
    register(Noises.BADLANDS_PILLAR_ROOF, -8, 1.0)
    register(Noises.BADLANDS_SURFACE, -6, 1.0, 1.0, 1.0)
    register(Noises.ICEBERG_PILLAR, -6, 1.0, 1.0, 1.0, 1.0)
    register(Noises.ICEBERG_PILLAR_ROOF, -3, 1.0)
    register(Noises.ICEBERG_SURFACE, -6, 1.0, 1.0, 1.0)
    register(Noises.SWAMP, -2, 1.0)
    register(Noises.CALCITE, -9, 1.0, 1.0, 1.0, 1.0)
    register(Noises.GRAVEL, -8, 1.0, 1.0, 1.0, 1.0)
    register(Noises.POWDER_SNOW, -6, 1.0, 1.0, 1.0, 1.0)
    register(Noises.PACKED_ICE, -7, 1.0, 1.0, 1.0, 1.0)
    register(Noises.ICE, -4, 1.0, 1.0, 1.0, 1.0)
    register(
        Noises.SOUL_SAND_LAYER,
        -8,
        1.0,
        1.0,
        1.0,
        1.0,
        0.0,
        0.0,
        0.0,
        0.0,
        0.013333333333333334
    )
    register(Noises.GRAVEL_LAYER, -8, 1.0, 1.0, 1.0, 1.0, 0.0, 0.0, 0.0, 0.0, 0.013333333333333334)
    register(Noises.PATCH, -5, 1.0, 0.0, 0.0, 0.0, 0.0, 0.013333333333333334)
    register(Noises.NETHERRACK, -3, 1.0, 0.0, 0.0, 0.35)
    register(Noises.NETHER_WART, -3, 1.0, 0.0, 0.0, 0.9)
    register(Noises.NETHER_STATE_SELECTOR, -4, 1.0)
}

function registerBiomeNoises(
    octaveOffset: number,
    temperature: Noises,
    vegetation: Noises,
    continentalness: Noises,
    erosion: Noises
) {
    register(temperature, -10 + octaveOffset, 1.5, 0.0, 1.0, 0.0, 0.0, 0.0)
    register(vegetation, -8 + octaveOffset, 1.0, 1.0, 0.0, 0.0, 0.0, 0.0)
    register(continentalness, -9 + octaveOffset, 1.0, 1.0, 2.0, 2.0, 2.0, 1.0, 1.0, 1.0, 1.0)
    register(erosion, -9 + octaveOffset, 1.0, 1.0, 0.0, 1.0, 1.0)
}

function register(
    noise: Noises,
    firstOctave: number,
    firstAmplitude: number,
    ...amplitudes: number[]
) {
    NOISES[noise] = new NoiseParameters(firstOctave, firstAmplitude, ...amplitudes)
}

registerNoises()

export function Noises_instantiate(random: PositionalRandomFactory, noise: Noises): NormalNoise {
    return NormalNoise.create(random.fromHashOf(noise), Noises[noise])
}
