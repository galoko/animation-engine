/* eslint-disable @typescript-eslint/no-namespace */

import { Blocks } from "./blocks"
import { ChunkAccess } from "./chunks"
import { Mth } from "./mth"
import { MutableBlockPos } from "./pos"

class TypeDescription {
    constructor(
        readonly type: Heightmap.Types,
        readonly usage: Heightmap.Usage,
        readonly isOpaque: Mth.Predicate<Blocks>
    ) {}
}

export class Heightmap {
    private readonly isOpaque: Mth.Predicate<Blocks>
    private readonly data: number[]

    constructor(private readonly chunk: ChunkAccess, type: Heightmap.Types) {
        this.isOpaque = getTypeDesc(type).isOpaque
        this.chunk = chunk
        this.data = new Array(256) as number[]
    }

    static primeHeightmaps(chunkAccess: ChunkAccess, types: Heightmap.Types[]): void {
        const heightmaps = [] as Heightmap[]
        const maxY = chunkAccess.getHighestSectionPosition() + 16
        const pos = new MutableBlockPos()

        for (let x = 0; x < 16; ++x) {
            for (let z = 0; z < 16; ++z) {
                let objectlistIndex = 0
                heightmaps.length = 0
                for (const type of types) {
                    heightmaps.push(chunkAccess.getOrCreateHeightmapUnprimed(type))
                }

                for (let y = maxY - 1; y >= chunkAccess.getMinBuildHeight(); --y) {
                    pos.set(x, y, z)
                    const blockState = chunkAccess.getBlockState(pos)
                    // we found non-air block
                    if (blockState !== Blocks.AIR) {
                        // trying to set height for all heightmaps
                        while (objectlistIndex < heightmaps.length) {
                            const heightmap = heightmaps[objectlistIndex]
                            if (heightmap.isOpaque(blockState)) {
                                heightmap.setHeight(x, z, y + 1)

                                heightmaps.splice(objectlistIndex, 1)
                            } else {
                                objectlistIndex++
                            }
                        }

                        // we have resolved all heightmaps for this xz
                        if (heightmaps.length === 0) {
                            break
                        }

                        // start over
                        objectlistIndex = 0
                    }
                }
            }
        }
    }
}

export namespace Heightmap {
    export const NOT_AIR: Mth.Predicate<Blocks> = block => block !== Blocks.AIR
    // TODO
    export const MATERIAL_MOTION_BLOCKING: Mth.Predicate<Blocks> = block => block !== Blocks.AIR

    export enum Usage {
        WORLDGEN,
        LIVE_WORLD,
        CLIENT,
    }

    export enum Types {
        WORLD_SURFACE_WG = "WORLD_SURFACE_WG",
        WORLD_SURFACE = "WORLD_SURFACE",
        OCEAN_FLOOR_WG = "OCEAN_FLOOR_WG",
        OCEAN_FLOOR = "OCEAN_FLOOR",
        MOTION_BLOCKING = "MOTION_BLOCKING",
        MOTION_BLOCKING_NO_LEAVES = "MOTION_BLOCKING_NO_LEAVES",
    }
}

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
const BLOCK_TYPE_TO_TYPES: {
    [key in Heightmap.Types]: TypeDescription
} = {}

BLOCK_TYPE_TO_TYPES[Heightmap.Types.WORLD_SURFACE_WG] = new TypeDescription(
    Heightmap.Types.WORLD_SURFACE_WG,
    Heightmap.Usage.WORLDGEN,
    Heightmap.NOT_AIR
)

BLOCK_TYPE_TO_TYPES[Heightmap.Types.WORLD_SURFACE] = new TypeDescription(
    Heightmap.Types.WORLD_SURFACE,
    Heightmap.Usage.CLIENT,
    Heightmap.NOT_AIR
)
BLOCK_TYPE_TO_TYPES[Heightmap.Types.OCEAN_FLOOR_WG] = new TypeDescription(
    Heightmap.Types.OCEAN_FLOOR_WG,
    Heightmap.Usage.WORLDGEN,
    Heightmap.MATERIAL_MOTION_BLOCKING
)
BLOCK_TYPE_TO_TYPES[Heightmap.Types.OCEAN_FLOOR] = new TypeDescription(
    Heightmap.Types.OCEAN_FLOOR,
    Heightmap.Usage.LIVE_WORLD,
    Heightmap.MATERIAL_MOTION_BLOCKING
)
BLOCK_TYPE_TO_TYPES[Heightmap.Types.MOTION_BLOCKING] = new TypeDescription(
    Heightmap.Types.MOTION_BLOCKING,
    Heightmap.Usage.CLIENT,
    Heightmap.NOT_AIR
)
BLOCK_TYPE_TO_TYPES[Heightmap.Types.MOTION_BLOCKING_NO_LEAVES] = new TypeDescription(
    Heightmap.Types.MOTION_BLOCKING_NO_LEAVES,
    Heightmap.Usage.LIVE_WORLD,
    Heightmap.NOT_AIR
)

function getTypeDesc(type: Heightmap.Types): TypeDescription {
    return BLOCK_TYPE_TO_TYPES[type]
}
