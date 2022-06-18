import { BiomeManager } from "./biome-source"
import { Biomes } from "./biomes"
import { Blender, ChunkGenerator, ChunkPos, NoiseBiomeSource, QuartPos } from "./chunk-generator"
import { ChunkAccess } from "./chunks"
import { ServerLevel, WorldGenRegion } from "./level"
import * as Climate from "./climate"

export enum HeightmapTypes {
    WORLD_SURFACE_WG = "WORLD_SURFACE_WG",
    WORLD_SURFACE = "WORLD_SURFACE",
    OCEAN_FLOOR_WG = "OCEAN_FLOOR_WG",
    OCEAN_FLOOR = "OCEAN_FLOOR",
    MOTION_BLOCKING = "MOTION_BLOCKING",
    MOTION_BLOCKING_NO_LEAVES = "MOTION_BLOCKING_NO_LEAVES",
}

type GenerationTask = (
    chunkStatus: ChunkStatus,
    level: ServerLevel,
    generator: ChunkGenerator,
    converter: (chunkAccess: ChunkAccess) => ChunkAccess,
    cache: ChunkAccess[],
    chunkAccess: ChunkAccess
) => ChunkAccess

type LoadingTask = (
    chunkStatus: ChunkStatus,
    level: ServerLevel,
    chunkAccess: ChunkAccess
) => ChunkAccess

const PASSTHROUGH_LOAD_TASK = (
    chunkStatus: ChunkStatus,
    level: ServerLevel,
    chunkAccess: ChunkAccess
) => chunkAccess

export class ChunkStatus {
    parent: ChunkStatus
    index: number

    constructor(
        private readonly name: string,
        parent: ChunkStatus | null,
        private readonly range: number,
        private readonly heightmapsAfter: HeightmapTypes[],
        private readonly generationTask: GenerationTask,
        private readonly loadingTask: LoadingTask
    ) {
        this.parent = parent == null ? this : parent
        this.index = parent == null ? 0 : parent.index + 1
    }

    isOrAfter(otherStatus: ChunkStatus): boolean {
        return this.index >= otherStatus.index
    }
}

const PRE_FEATURES = [HeightmapTypes.OCEAN_FLOOR_WG, HeightmapTypes.WORLD_SURFACE_WG]
const POST_FEATURES = [
    HeightmapTypes.OCEAN_FLOOR,
    HeightmapTypes.WORLD_SURFACE,
    HeightmapTypes.MOTION_BLOCKING,
    HeightmapTypes.MOTION_BLOCKING_NO_LEAVES,
]

export const EMPTY = registerSimple(
    "empty",
    null,
    -1,
    PRE_FEATURES,
    (
        chunkStatus: ChunkStatus,
        level: ServerLevel,
        generator: ChunkGenerator,
        converter: (chunkAccess: ChunkAccess) => ChunkAccess,
        cache: ChunkAccess[],
        chunkAccess: ChunkAccess
    ) => chunkAccess
)

export const STRUCTURE_STARTS = register(
    "structure_starts",
    EMPTY,
    0,
    PRE_FEATURES,
    (
        chunkStatus: ChunkStatus,
        level: ServerLevel,
        generator: ChunkGenerator,
        converter: (chunkAccess: ChunkAccess) => ChunkAccess,
        cache: ChunkAccess[],
        chunkAccess: ChunkAccess
    ) => chunkAccess
)

export const STRUCTURE_REFERENCES = registerSimple(
    "structure_references",
    STRUCTURE_STARTS,
    8,
    PRE_FEATURES,
    (
        chunkStatus: ChunkStatus,
        level: ServerLevel,
        generator: ChunkGenerator,
        converter: (chunkAccess: ChunkAccess) => ChunkAccess,
        cache: ChunkAccess[],
        chunkAccess: ChunkAccess
    ) => chunkAccess
)

export const BIOMES = register(
    "biomes",
    STRUCTURE_REFERENCES,
    8,
    PRE_FEATURES,
    (
        chunkStatus: ChunkStatus,
        level: ServerLevel,
        generator: ChunkGenerator,
        converter: (chunkAccess: ChunkAccess) => ChunkAccess,
        cache: ChunkAccess[],
        chunkAccess: ChunkAccess
    ) => {
        return generator.createBiomes(Blender.empty(), chunkAccess)
    }
)

function registerSimple(
    name: string,
    chunkStatus: ChunkStatus | null,
    range: number,
    heightmapsAfter: HeightmapTypes[],
    generationTask: GenerationTask
): ChunkStatus {
    return register(name, chunkStatus, range, heightmapsAfter, generationTask)
}

function register(
    name: string,
    chunkStatus: ChunkStatus | null,
    range: number,
    heightmapsAfter: HeightmapTypes[],
    generationTask: GenerationTask,
    loadingTask: LoadingTask = PASSTHROUGH_LOAD_TASK
): ChunkStatus {
    return new ChunkStatus(name, chunkStatus, range, heightmapsAfter, generationTask, loadingTask)
}
