import { Blender, ChunkGenerator } from "./chunk-generator"
import { ChunkAccess } from "./chunks"
import { ServerLevel } from "./level"
import * as Heightmap from "./heightmap"

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
        private readonly heightmapsAfter: Heightmap.Types[],
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

const PRE_FEATURES = [Heightmap.Types.OCEAN_FLOOR_WG, Heightmap.Types.WORLD_SURFACE_WG]
const POST_FEATURES = [
    Heightmap.Types.OCEAN_FLOOR,
    Heightmap.Types.WORLD_SURFACE,
    Heightmap.Types.MOTION_BLOCKING,
    Heightmap.Types.MOTION_BLOCKING_NO_LEAVES,
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
        if (chunkAccess.getStatus().isOrAfter(chunkStatus)) {
            return chunkAccess
        } else {
            return generator.createBiomes(Blender.empty(), chunkAccess)
        }
    }
)

export const NOISE = register(
    "noise",
    BIOMES,
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
        if (chunkAccess.getStatus().isOrAfter(chunkStatus)) {
            return chunkAccess
        } else {
            return generator.fillFromNoise(Blender.empty(), chunkAccess)
        }
    }
)

function registerSimple(
    name: string,
    chunkStatus: ChunkStatus | null,
    range: number,
    heightmapsAfter: Heightmap.Types[],
    generationTask: GenerationTask
): ChunkStatus {
    return register(name, chunkStatus, range, heightmapsAfter, generationTask)
}

function register(
    name: string,
    chunkStatus: ChunkStatus | null,
    range: number,
    heightmapsAfter: Heightmap.Types[],
    generationTask: GenerationTask,
    loadingTask: LoadingTask = PASSTHROUGH_LOAD_TASK
): ChunkStatus {
    return new ChunkStatus(name, chunkStatus, range, heightmapsAfter, generationTask, loadingTask)
}
