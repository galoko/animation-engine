import { BiomeManager } from "./biome-source"
import { Biomes } from "./biomes"
import { ChunkGenerator, ChunkPos, NoiseBiomeSource, QuartPos } from "./chunk-generator"
import { ChunkStatus } from "./chunk-status"
import { ChunkAccess } from "./chunks"

abstract class LevelReader {
    abstract getChunk(
        x: number,
        z: number,
        status: ChunkStatus,
        ensureNonNull: boolean
    ): ChunkAccess | null

    getNoiseBiome(x: number, y: number, z: number): Biomes {
        const chunkAccess = this.getChunk(
            QuartPos.toSection(x),
            QuartPos.toSection(z),
            ChunkStatus.BIOMES,
            false
        )
        return chunkAccess != null
            ? chunkAccess.getNoiseBiome(x, y, z)
            : this.getUncachedNoiseBiome(x, y, z)
    }

    abstract getUncachedNoiseBiome(x: number, y: number, z: number): Biomes
}

export class WorldGenRegion extends LevelReader implements NoiseBiomeSource {
    private readonly center: ChunkAccess
    private readonly size: number
    private readonly seed: bigint
    private readonly firstPos: ChunkPos
    private readonly lastPos: ChunkPos
    private readonly biomeManager: BiomeManager

    constructor(
        private readonly level: ServerLevel,
        private readonly cache: ChunkAccess[],
        private readonly generatingStatus: ChunkStatus,
        private readonly writeRadiusCutoff: number
    ) {
        super()
        const size = Math.floor(Math.sqrt(cache.length))
        if (size * size != cache.length) {
            throw new Error("Cache size is not a square.")
        } else {
            this.center = cache[Math.trunc(cache.length / 2)]
            this.size = size
            this.seed = level.seed
            this.biomeManager = new BiomeManager(this, BiomeManager.obfuscateSeed(this.seed))
            this.firstPos = cache[0].getPos()
            this.lastPos = cache[cache.length - 1].getPos()
        }
    }

    getChunk(
        x: number,
        z: number,
        status: ChunkStatus,
        ensureNonNull: boolean
    ): ChunkAccess | null {
        let chunkAccess: ChunkAccess | null
        if (this.hasChunk(x, z)) {
            const shiftedX = x - this.firstPos.x
            const shiftedZ = z - this.firstPos.z
            chunkAccess = this.cache[shiftedX + shiftedZ * this.size]
            if (chunkAccess.getStatus().isOrAfter(status)) {
                return chunkAccess
            }
        } else {
            chunkAccess = null
        }

        if (!ensureNonNull) {
            return null
        } else {
            throw new Error("")
        }
    }

    hasChunk(x: number, z: number): boolean {
        return (
            x >= this.firstPos.x &&
            x <= this.lastPos.x &&
            z >= this.firstPos.z &&
            z <= this.lastPos.z
        )
    }

    getUncachedNoiseBiome(x: number, y: number, z: number): Biomes {
        return this.level.getUncachedNoiseBiome(x, y, z)
    }
}

export class Level extends LevelReader implements NoiseBiomeSource {
    biomeMananager: BiomeManager

    constructor(generator: ChunkGenerator, readonly seed: bigint) {
        super()
        this.biomeMananager = new BiomeManager(generator, seed)
    }

    getChunk(
        x: number,
        z: number,
        status: ChunkStatus,
        ensureNonNull: boolean
    ): ChunkAccess | null {
        throw new Error("Method not implemented.")
    }

    getUncachedNoiseBiome(x: number, y: number, z: number): Biomes {
        throw new Error("Method not implemented.")
    }
}

export class ServerLevel extends Level {}
