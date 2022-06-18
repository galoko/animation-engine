import { BiomeResolver } from "./biome-source"
import {
    Blender,
    ChunkPos,
    NoiseChunk,
    NoiseGeneratorSettings,
    NoiseSampler,
    QuartPos,
} from "./chunk-generator"
import { BlockPos, SectionPos } from "./pos"
import * as Climate from "./climate"
import { ChunkStatus, EMPTY } from "./chunk-status"
import { Biomes } from "./biomes"
import * as Mth from "./mth"
import { Blocks } from "./blocks"
import { Supplier } from "./consumer"
import { NoiseFiller } from "./noise/blended-noise"
import { FluidPicker } from "./aquifer"

// chunk access

export class LevelHeightAccessor {
    getHeight(): number {
        return 384
    }

    getMinBuildHeight(): number {
        return -64
    }

    getMaxBuildHeight(): number {
        return this.getMinBuildHeight() + this.getHeight()
    }

    getSectionsCount(): number {
        return this.getMaxSection() - this.getMinSection()
    }

    getMinSection(): number {
        return SectionPos.blockToSectionCoord(this.getMinBuildHeight())
    }

    getMaxSection(): number {
        return SectionPos.blockToSectionCoord(this.getMaxBuildHeight() - 1) + 1
    }

    isOutsideBuildHeight(y: number): boolean
    isOutsideBuildHeight(pos: BlockPos): boolean
    isOutsideBuildHeight(y: number | BlockPos): boolean {
        if (typeof y === "number") {
            return y < this.getMinBuildHeight() || y >= this.getMaxBuildHeight()
        } else {
            const pos = y
            return this.isOutsideBuildHeight(pos.y)
        }
    }

    getSectionIndex(coord: number): number {
        return this.getSectionIndexFromSectionY(SectionPos.blockToSectionCoord(coord))
    }

    getSectionIndexFromSectionY(y: number): number {
        return y - this.getMinSection()
    }

    getSectionYFromSectionIndex(sectionIndex: number): number {
        return sectionIndex + this.getMinSection()
    }
}
export class LevelChunkSection {
    public static readonly SECTION_WIDTH = 16
    public static readonly SECTION_HEIGHT = 16
    public static readonly SECTION_SIZE = 4096
    public static readonly BIOME_CONTAINER_BITS = 2
    public static readonly STATES_CONTAINER_BITS = 4

    public static readonly BIOME_CONTAINER_SIZE = 1 << LevelChunkSection.BIOME_CONTAINER_BITS
    public static readonly STATES_CONTAINER_SIZE = 1 << LevelChunkSection.STATES_CONTAINER_BITS

    private readonly bottomBlockY: number
    private readonly biomes: Biomes[]
    private readonly states: Blocks[]

    constructor(y: number) {
        this.bottomBlockY = LevelChunkSection.getBottomBlockY(y)

        const biomesSize = 1 << LevelChunkSection.BIOME_CONTAINER_BITS
        this.biomes = new Array(biomesSize * biomesSize * biomesSize) as Biomes[]
        this.biomes.fill(Biomes.PLAINS)

        const statesSize = 1 << LevelChunkSection.STATES_CONTAINER_BITS
        this.states = new Array(statesSize * statesSize * statesSize) as Blocks[]
        this.states.fill(Blocks.AIR)
    }

    static getBottomBlockY(y: number): number {
        return y << 4
    }

    private static getBlockStateIndex(x: number, y: number, z: number): number {
        return (
            z * LevelChunkSection.STATES_CONTAINER_BITS * LevelChunkSection.STATES_CONTAINER_BITS +
            y * LevelChunkSection.STATES_CONTAINER_BITS +
            x
        )
    }

    private static getBiomesIndex(x: number, y: number, z: number): number {
        return (
            z * LevelChunkSection.BIOME_CONTAINER_SIZE * LevelChunkSection.BIOME_CONTAINER_SIZE +
            y * LevelChunkSection.BIOME_CONTAINER_SIZE +
            x
        )
    }

    getBlockState(x: number, y: number, z: number): Blocks {
        const index = LevelChunkSection.getBlockStateIndex(x, y, z)
        return this.states[index]
    }

    setBlockState(x: number, y: number, z: number, block: Blocks): Blocks {
        const index = LevelChunkSection.getBlockStateIndex(x, y, z)
        const prevBlock = this.states[index]
        this.states[index] = block
        return prevBlock
    }

    getNoiseBiome(x: number, y: number, z: number): Biomes {
        const index = LevelChunkSection.getBiomesIndex(x, y, z)
        return this.biomes[index]
    }

    fillBiomesFromNoise(
        resolver: BiomeResolver,
        sampler: Climate.Sampler,
        offsetX: number,
        offsetZ: number
    ): void {
        const offsetY = QuartPos.fromBlock(this.bottomBlockY)

        for (let x = 0; x < 4; ++x) {
            for (let y = 0; y < 4; ++y) {
                for (let z = 0; z < 4; ++z) {
                    const index = LevelChunkSection.getBiomesIndex(x, y, z)

                    this.biomes[index] = resolver.getNoiseBiome(
                        offsetX + x,
                        offsetY + y,
                        offsetZ + z,
                        sampler
                    )
                }
            }
        }
    }
}

export abstract class ChunkAccess extends LevelHeightAccessor {
    private readonly sections: LevelChunkSection[]
    private noiseChunk: NoiseChunk

    constructor(
        readonly chunkPos: ChunkPos,
        private readonly levelHeightAccessor: LevelHeightAccessor
    ) {
        super()
        this.sections = new Array(levelHeightAccessor.getSectionsCount()) as LevelChunkSection[]

        ChunkAccess.replaceMissingSections(levelHeightAccessor, this.sections)
    }

    private static replaceMissingSections(
        heightAccessor: LevelHeightAccessor,
        section: LevelChunkSection[]
    ): void {
        for (let i = 0; i < section.length; ++i) {
            if (section[i] == null) {
                section[i] = new LevelChunkSection(heightAccessor.getSectionYFromSectionIndex(i))
            }
        }
    }

    getNoiseBiome(x: number, y: number, z: number): Biomes {
        const minY = QuartPos.fromBlock(this.getMinBuildHeight())
        const maxY = minY + QuartPos.fromBlock(this.getHeight()) - 1
        const clampedY = Mth.clamp(y, minY, maxY)
        const sectionIndex = this.getSectionIndex(QuartPos.toBlock(clampedY))
        return this.sections[sectionIndex].getNoiseBiome(x & 3, clampedY & 3, z & 3)
    }

    abstract getStatus(): ChunkStatus

    fillBiomesFromNoise(resolver: BiomeResolver, sampler: Climate.Sampler): void {
        const chunkpos = this.getPos()
        const x = QuartPos.fromBlock(chunkpos.getMinBlockX())
        const z = QuartPos.fromBlock(chunkpos.getMinBlockZ())
        const heightAccessor = this.getHeightAccessorForGeneration()

        for (let y = heightAccessor.getMinSection(); y < heightAccessor.getMaxSection(); ++y) {
            const section = this.getSection(this.getSectionIndexFromSectionY(y))
            section.fillBiomesFromNoise(resolver, sampler, x, z)
        }
    }

    getSections() {
        return this.sections
    }

    getSection(sectionIndex: number): LevelChunkSection {
        return this.getSections()[sectionIndex]
    }

    getPos(): ChunkPos {
        return this.chunkPos
    }

    getMinBuildHeight(): number {
        return this.levelHeightAccessor.getMinBuildHeight()
    }

    getMaxBuildHeight(): number {
        return this.levelHeightAccessor.getMaxBuildHeight()
    }

    getHeight(): number {
        return this.levelHeightAccessor.getHeight()
    }

    public getHeightAccessorForGeneration(): LevelHeightAccessor {
        return this
    }

    getOrCreateNoiseChunk(
        sampler: NoiseSampler,
        filler: Supplier<NoiseFiller>,
        settings: NoiseGeneratorSettings,
        fluidPicker: FluidPicker,
        blender: Blender
    ): NoiseChunk {
        if (this.noiseChunk == null) {
            this.noiseChunk = NoiseChunk.forChunk(
                this,
                sampler,
                filler,
                settings,
                fluidPicker,
                blender
            )
        }

        return this.noiseChunk
    }
}

export class ProtoChunk extends ChunkAccess {
    private status = EMPTY

    getStatus(): ChunkStatus {
        return this.status
    }
}
