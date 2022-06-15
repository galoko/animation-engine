import { BiomeResolver, BiomeSource } from "./biome-source"
import { Biomes } from "./biomes"
import { Blocks } from "./blocks"
import { TargetPoint } from "./climate"
import * as Climate from "./climate"
import { RuleSource, SurfaceRuleData } from "./surface-rules"
import { TerrainShaper } from "./terrain-shaper"
import {
    Algorithm,
    Algorithm_newInstance,
    PositionalRandomFactory,
    toResourceLocation,
} from "./random"
import { BlendedNoise, NoiseFiller } from "./noise/blended-noise"
import { NoiseParameters, NormalNoise } from "./noise/normal-noise"
import { Noises_instantiate, Noises } from "./noise-data"
import * as Mth from "./mth"
import { Aquifer, FluidPicker } from "./aquifer"
import { Supplier } from "./consumer"

export class BlockPos {
    constructor(readonly x: number, readonly y: number, readonly z: number) {}
}

export abstract class SectionPos {
    public static blockToSectionCoord(coord: number): number {
        return coord >> 4
    }

    public static sectionToBlockCoord(coord: number, coord2?: number): number {
        return (coord << 4) + (coord2 ?? 0)
    }
}

export class ChunkPos {
    readonly x: number
    readonly z: number

    constructor(x: number, y: number)
    constructor(pos: BlockPos)
    constructor(l: bigint)
    constructor(x: number | BlockPos | bigint, z?: number) {
        if (typeof x === "bigint") {
            const coord = x
            this.x = Mth.toInt(coord)
            this.z = Mth.toInt(coord >> 32n)
        } else if (typeof x === "number") {
            this.x = x
            this.z = z!
        } else {
            const pos = x
            this.x = SectionPos.blockToSectionCoord(pos.x)
            this.z = SectionPos.blockToSectionCoord(pos.z)
        }
    }

    toLong(): bigint {
        return ChunkPos.asLong(this.x, this.z)
    }

    static asLong(pos: BlockPos): bigint
    static asLong(x: number, z: number): bigint
    static asLong(x: number | BlockPos, z?: number): bigint {
        if (typeof x === "number") {
            return (Mth.toLong(x) & 4294967295n) | ((Mth.toLong(z!) & 4294967295n) << 32n)
        } else {
            const pos = x
            return ChunkPos.asLong(
                SectionPos.blockToSectionCoord(pos.x),
                SectionPos.blockToSectionCoord(pos.z)
            )
        }
    }

    static getX(coord: bigint): number {
        return Mth.toInt(coord & 4294967295n)
    }

    static getZ(coord: bigint): number {
        return Mth.toInt(Mth.unsignedShift64(coord, 32n) & 4294967295n)
    }

    getMiddleBlockX(): number {
        return this.getBlockX(8)
    }

    getMiddleBlockZ(): number {
        return this.getBlockZ(8)
    }

    getMinBlockX(): number {
        return SectionPos.sectionToBlockCoord(this.x)
    }

    getMinBlockZ(): number {
        return SectionPos.sectionToBlockCoord(this.z)
    }

    getMaxBlockX(): number {
        return this.getBlockX(15)
    }

    getMaxBlockZ(): number {
        return this.getBlockZ(15)
    }

    getRegionX(): number {
        return this.x >> 5
    }

    getRegionZ(): number {
        return this.z >> 5
    }

    getRegionLocalX(): number {
        return this.x & 31
    }

    getRegionLocalZ(): number {
        return this.z & 31
    }

    getBlockAt(x: number, y: number, z: number): BlockPos {
        return new BlockPos(this.getBlockX(x), y, this.getBlockZ(z))
    }

    getBlockX(x: number): number {
        return SectionPos.sectionToBlockCoord(this.x, x)
    }

    getBlockZ(z: number): number {
        return SectionPos.sectionToBlockCoord(this.z, z)
    }

    getMiddleBlockPosition(y: number): BlockPos {
        return new BlockPos(this.getMiddleBlockX(), y, this.getMiddleBlockZ())
    }

    getWorldPosition(): BlockPos {
        return new BlockPos(this.getMinBlockX(), 0, this.getMinBlockZ())
    }
}

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

export class ChunkAccess {
    constructor(
        readonly chunkPos: ChunkPos,
        private readonly levelHeightAccessor: LevelHeightAccessor
    ) {
        //
    }

    public fillBiomesFromNoise(resolver: BiomeResolver, sampler: Climate.Sampler): void {
        throw new Error("TODO")
    }

    public getPos(): ChunkPos {
        return this.chunkPos
    }

    getMinBuildHeight(): number {
        return this.levelHeightAccessor.getMinBuildHeight()
    }

    getMaxBuildHeight(): number {
        return this.levelHeightAccessor.getMaxBuildHeight()
    }
}

// generator

class WorldGenRegion {}

export interface NoiseBiomeSource {
    getNoiseBiome(x: number, y: number, z: number): Biomes
}

export abstract class ChunkGenerator implements NoiseBiomeSource {
    constructor(private readonly biomeSource: BiomeSource) {
        //
    }

    public abstract climateSampler(): Climate.Sampler

    getNoiseBiome(x: number, y: number, z: number): Biomes {
        return this.biomeSource.getNoiseBiome(x, y, z, this.climateSampler())
    }

    public abstract buildSurface(region: WorldGenRegion, access: ChunkAccess): void

    public abstract withSeed(seed: bigint): ChunkGenerator

    public createBiomes(chunk: ChunkAccess): ChunkAccess {
        chunk.fillBiomesFromNoise(this.biomeSource, this.climateSampler())
        return chunk
    }
}

export class NoiseSamplingSettings {
    constructor(
        readonly xzScale: number,
        readonly yScale: number,
        readonly xzFactor: number,
        readonly yFactor: number
    ) {}
}

export class NoiseSlider {
    constructor(readonly target: number, readonly size: number, readonly offset: number) {}

    public applySlide(y: number, cellY: number): number {
        if (this.size <= 0) {
            return y
        } else {
            const t = (cellY - this.offset) / this.size
            return Mth.clampedLerp(this.target, y, t)
        }
    }
}

export abstract class QuartPos {
    public static readonly BITS = 2
    public static readonly SIZE = 4
    public static readonly MASK = 3
    private static readonly SECTION_TO_QUARTS_BITS = 2

    private constructor() {
        //
    }

    public static fromBlock(coord: number): number {
        return coord >> QuartPos.BITS
    }

    public static quartLocal(coord: number): number {
        return coord & QuartPos.MASK
    }

    public static toBlock(coord: number): number {
        return coord << QuartPos.BITS
    }

    public static fromSection(coord: number): number {
        return coord << QuartPos.SECTION_TO_QUARTS_BITS
    }

    public static toSection(coord): number {
        return coord >> QuartPos.SECTION_TO_QUARTS_BITS
    }
}

export class NoiseSettings {
    constructor(
        readonly minY: number,
        readonly height: number,
        readonly noiseSamplingSettings: NoiseSamplingSettings,
        readonly topSlideSettings: NoiseSlider,
        readonly bottomSlideSettings: NoiseSlider,
        readonly noiseSizeHorizontal: number,
        readonly noiseSizeVertical: number,
        readonly islandNoiseOverride: boolean,
        readonly isAmplified: boolean,
        readonly largeBiomes: boolean,
        readonly terrainShaper: TerrainShaper
    ) {}

    get cellHeight(): number {
        return QuartPos.toBlock(this.noiseSizeVertical)
    }

    get cellWidth(): number {
        return QuartPos.toBlock(this.noiseSizeHorizontal)
    }

    get cellCountY(): number {
        return Math.trunc(this.height / this.cellHeight)
    }

    get minCellY(): number {
        return Mth.intFloorDiv(this.minY, this.cellHeight)
    }
}

export class NoiseGeneratorSettings {
    static readonly OVERWORLD = NoiseGeneratorSettings.overworld(false, false)

    constructor(
        readonly noiseSettings: NoiseSettings,
        readonly defaultBlock: Blocks,
        readonly defaultFluid: Blocks,
        readonly surfaceRule: RuleSource,
        readonly seaLevel: number,
        readonly disableMobGeneration: boolean,
        readonly aquifersEnabled: boolean,
        readonly noiseCavesEnabled: boolean,
        readonly oreVeinsEnabled: boolean,
        readonly noodleCavesEnabled: boolean,
        readonly useLegacyRandom: boolean
    ) {}

    private static overworld(isAmplified: boolean, isLargeBiomes: boolean) {
        return new NoiseGeneratorSettings(
            new NoiseSettings(
                -64,
                384,
                new NoiseSamplingSettings(1, 1, 80, 160),
                new NoiseSlider(-0.078125, 2, isAmplified ? 0 : 8),
                new NoiseSlider(isAmplified ? 0.4 : 0.1171875, 3, 0),
                1,
                2,
                false,
                isAmplified,
                isLargeBiomes,
                TerrainShaper.overworld(isAmplified)
            ),
            Blocks.STONE,
            Blocks.WATER,
            SurfaceRuleData.overworld(),
            63,
            false,
            true,
            true,
            true,
            true,
            false
        )
    }

    get randomSource(): Algorithm {
        return this.useLegacyRandom ? Algorithm.LEGACY : Algorithm.XOROSHIRO
    }
}

class NoiseInterpolator implements Sampler {
    private slice0: number[][]
    private slice1: number[][]
    private noise000: number
    private noise001: number
    private noise100: number
    private noise101: number
    private noise010: number
    private noise011: number
    private noise110: number
    private noise111: number
    private valueXZ00: number
    private valueXZ10: number
    private valueXZ01: number
    private valueXZ11: number
    private valueZ0: number
    private valueZ1: number
    private value: number

    constructor(
        private readonly noiseChunk: NoiseChunk,
        private readonly noiseFiller: NoiseFiller
    ) {
        this.slice0 = this.allocateSlice(this.noiseChunk.cellCountY, this.noiseChunk.cellCountXZ)
        this.slice1 = this.allocateSlice(this.noiseChunk.cellCountY, this.noiseChunk.cellCountXZ)
        this.noiseChunk.interpolators.push(this)
    }

    private allocateSlice(cellCountY: number, cellCountXZ: number): number[][] {
        const sliceWidth = cellCountXZ + 1
        const sliceHeight = cellCountY + 1

        const slice = new Array(sliceWidth) as number[][]

        for (let k = 0; k < sliceWidth; ++k) {
            slice[k] = new Array(sliceHeight) as number[]
        }

        return slice
    }

    initializeForFirstCellX(): void {
        this.fillSlice(this.slice0, this.noiseChunk.firstCellX)
    }

    advanceCellX(cellOffsetX: number): void {
        this.fillSlice(this.slice1, this.noiseChunk.firstCellX + cellOffsetX + 1)
    }

    private fillSlice(slice: number[][], cellX: number): void {
        const cellWidth = this.noiseChunk.noiseSettings.cellWidth
        const cellHeight = this.noiseChunk.noiseSettings.cellHeight

        for (let offsetZ = 0; offsetZ < this.noiseChunk.cellCountXZ + 1; ++offsetZ) {
            const cellZ = this.noiseChunk.firstCellZ + offsetZ

            for (let offsetY = 0; offsetY < this.noiseChunk.cellCountY + 1; ++offsetY) {
                const cellY = offsetY + this.noiseChunk.cellNoiseMinY
                const y = cellY * cellHeight
                const noise = this.noiseFiller.calculateNoise(
                    cellX * cellWidth,
                    y,
                    cellZ * cellWidth
                )
                slice[offsetZ][offsetY] = noise
            }
        }
    }

    selectCellYZ(cellY: number, cellZ: number): void {
        this.noise000 = this.slice0[cellZ][cellY]
        this.noise001 = this.slice0[cellZ + 1][cellY]
        this.noise100 = this.slice1[cellZ][cellY]
        this.noise101 = this.slice1[cellZ + 1][cellY]
        this.noise010 = this.slice0[cellZ][cellY + 1]
        this.noise011 = this.slice0[cellZ + 1][cellY + 1]
        this.noise110 = this.slice1[cellZ][cellY + 1]
        this.noise111 = this.slice1[cellZ + 1][cellY + 1]
    }

    updateForY(t: number): void {
        this.valueXZ00 = Mth.lerp(t, this.noise000, this.noise010)
        this.valueXZ10 = Mth.lerp(t, this.noise100, this.noise110)
        this.valueXZ01 = Mth.lerp(t, this.noise001, this.noise011)
        this.valueXZ11 = Mth.lerp(t, this.noise101, this.noise111)
    }

    updateForX(t: number): void {
        this.valueZ0 = Mth.lerp(t, this.valueXZ00, this.valueXZ10)
        this.valueZ1 = Mth.lerp(t, this.valueXZ01, this.valueXZ11)
    }

    updateForZ(t: number): void {
        this.value = Mth.lerp(t, this.valueZ0, this.valueZ1)
    }

    sample(): number {
        return this.value
    }

    swapSlices(): void {
        const temp = this.slice0
        this.slice0 = this.slice1
        this.slice1 = temp
    }
}

class FlatNoiseData {
    constructor(
        readonly shiftedX: number,
        readonly shiftedZ: number,
        readonly continentalness: number,
        readonly weirdness: number,
        readonly erosion: number,
        readonly terrainInfo: TerrainInfo
    ) {}
}

export interface Sampler {
    sample(): number
}

function computeIfAbsent<K, T>(map: Map<K, T>, key: K, mappingFunction: (key: K) => T): T {
    let value = map.get(key)
    if (value === undefined) {
        value = mappingFunction(key)
        map.set(key, value)
    }
    return value
}

export class NoiseChunk {
    readonly noiseSettings: NoiseSettings

    readonly firstCellX: number
    readonly firstCellZ: number
    private readonly firstNoiseX: number
    private readonly firstNoiseZ: number
    readonly interpolators: NoiseInterpolator[]
    private readonly _noiseData: FlatNoiseData[][]
    private readonly _preliminarySurfaceLevel = new Map<bigint, number>()

    readonly aquifer: Aquifer
    private readonly baseNoise: BlockStateFiller
    readonly blender: Blender

    static forChunk(
        chunkAccess: ChunkAccess,
        sampler: NoiseSampler,
        filler: Supplier<NoiseFiller>,
        generatorSettings: NoiseGeneratorSettings,
        fluidPicker: FluidPicker,
        blender: Blender
    ): NoiseChunk {
        const chunkPos = chunkAccess.getPos()
        const noiseSettings = generatorSettings.noiseSettings
        const minY = Math.max(noiseSettings.minY, chunkAccess.getMinBuildHeight())
        const maxY = Math.min(
            noiseSettings.minY + noiseSettings.height,
            chunkAccess.getMaxBuildHeight()
        )
        const cellMinY = Mth.intFloorDiv(minY, noiseSettings.cellHeight)
        const cellCountY = Mth.intFloorDiv(maxY - minY, noiseSettings.cellHeight)
        return new NoiseChunk(
            Math.trunc(16 / noiseSettings.cellWidth),
            cellCountY,
            cellMinY,
            sampler,
            chunkPos.getMinBlockX(),
            chunkPos.getMinBlockZ(),
            filler(),
            generatorSettings,
            fluidPicker,
            blender
        )
    }

    static forColumn(
        startX: number,
        startZ: number,
        cellNoiseMinY: number,
        cellCountY: number,
        sampler: NoiseSampler,
        noiseSettings: NoiseGeneratorSettings,
        fluidPicker: FluidPicker
    ): NoiseChunk {
        return new NoiseChunk(
            1,
            cellCountY,
            cellNoiseMinY,
            sampler,
            startX,
            startZ,
            {
                calculateNoise: () => 0,
            },
            noiseSettings,
            fluidPicker,
            Blender.empty()
        )
    }

    private constructor(
        readonly cellCountXZ: number,
        readonly cellCountY: number,
        readonly cellNoiseMinY: number,
        private readonly sampler: NoiseSampler,
        startX: number,
        startZ: number,
        filler: NoiseFiller,
        noiseSettings: NoiseGeneratorSettings,
        fluidPicker: FluidPicker,
        blender: Blender
    ) {
        this.noiseSettings = noiseSettings.noiseSettings
        this.cellCountXZ = cellCountXZ
        this.cellCountY = cellCountY
        this.cellNoiseMinY = cellNoiseMinY
        this.sampler = sampler
        const cellWidth = this.noiseSettings.cellWidth
        this.firstCellX = Mth.floorDiv(startX, cellWidth)
        this.firstCellZ = Mth.floorDiv(startZ, cellWidth)
        this.interpolators = []
        this.firstNoiseX = QuartPos.fromBlock(startX)
        this.firstNoiseZ = QuartPos.fromBlock(startZ)
        const countXZ = QuartPos.fromBlock(cellCountXZ * cellWidth)
        this._noiseData = new Array(countXZ + 1) as FlatNoiseData[][]
        this.blender = blender

        for (let offsetX = 0; offsetX <= countXZ; ++offsetX) {
            const x = this.firstNoiseX + offsetX
            this._noiseData[offsetX] = new Array(countXZ + 1) as FlatNoiseData[]

            for (let offsetZ = 0; offsetZ <= countXZ; ++offsetZ) {
                const z = this.firstNoiseZ + offsetZ
                this._noiseData[offsetX][offsetZ] = sampler.noiseData(x, z, blender)
            }
        }

        this.aquifer = sampler.createAquifer(
            this,
            startX,
            startZ,
            cellNoiseMinY,
            cellCountY,
            fluidPicker,
            noiseSettings.aquifersEnabled
        )
        this.baseNoise = sampler.makeBaseNoiseFiller(this, filler)
    }

    noiseData(x: number, z: number): FlatNoiseData {
        return this._noiseData[x - this.firstNoiseX][z - this.firstNoiseZ]
    }

    preliminarySurfaceLevel(x: number, z: number): number {
        return computeIfAbsent(
            this._preliminarySurfaceLevel,
            ChunkPos.asLong(QuartPos.fromBlock(x), QuartPos.fromBlock(z)),
            linearCoord => this.computePreliminarySurfaceLevel(linearCoord)
        )
    }

    private computePreliminarySurfaceLevel(linearCoord: bigint): number {
        const x = ChunkPos.getX(linearCoord)
        const z = ChunkPos.getZ(linearCoord)
        const baseX = x - this.firstNoiseX
        const baseZ = z - this.firstNoiseZ
        const noiseSize = this._noiseData.length
        let terraininfo: TerrainInfo
        if (baseX >= 0 && baseZ >= 0 && baseX < noiseSize && baseZ < noiseSize) {
            terraininfo = this.noiseData[baseX][baseZ].terrainInfo()
        } else {
            terraininfo = this.sampler.noiseData(x, z, this.blender).terrainInfo
        }

        return this.sampler.getPreliminarySurfaceLevel(
            QuartPos.toBlock(x),
            QuartPos.toBlock(z),
            terraininfo
        )
    }

    createNoiseInterpolator(filler: NoiseFiller): NoiseInterpolator {
        return new NoiseInterpolator(this, filler)
    }

    initializeForFirstCellX(): void {
        for (const interpolator of this.interpolators) {
            interpolator.initializeForFirstCellX()
        }
    }

    advanceCellX(cellOffsetX: number): void {
        for (const interpolator of this.interpolators) {
            interpolator.advanceCellX(cellOffsetX)
        }
    }

    selectCellYZ(cellY: number, cellZ: number): void {
        for (const interpolator of this.interpolators) {
            interpolator.selectCellYZ(cellY, cellZ)
        }
    }

    updateForY(t: number): void {
        for (const interpolator of this.interpolators) {
            interpolator.updateForY(t)
        }
    }

    updateForX(t: number) {
        for (const interpolator of this.interpolators) {
            interpolator.updateForX(t)
        }
    }

    updateForZ(t: number) {
        for (const interpolator of this.interpolators) {
            interpolator.updateForZ(t)
        }
    }

    swapSlices(): void {
        for (const interpolator of this.interpolators) {
            interpolator.swapSlices()
        }
    }

    updateNoiseAndGenerateBaseState(x: number, y: number, z: number): Blocks | null {
        return this.baseNoise(x, y, z)
    }
}

export type InterpolatableNoise = (chunk: NoiseChunk) => Sampler

// always empty
class Blender {
    private static EMPTY = new Blender()

    public blendOffsetAndFactor(x: number, y: number, terrainInfo: TerrainInfo): TerrainInfo {
        return terrainInfo
    }

    public blendDensity(x: number, y: number, z: number, density: number): number {
        return density
    }

    public getBiomeResolver(resolver: BiomeResolver): BiomeResolver {
        return resolver
    }

    static empty(): Blender {
        return Blender.EMPTY
    }
}

class TerrainInfo {
    constructor(readonly offset: number, readonly factor: number, readonly jaggedness: number) {}
}

type BlockStateFiller = (x: number, y: number, z: number) => Blocks | null

export class NoiseSampler implements Climate.Sampler {
    private readonly baseNoise: InterpolatableNoise

    private readonly blendedNoise: BlendedNoise
    private readonly temperatureNoise: NormalNoise
    private readonly humidityNoise: NormalNoise
    private readonly continentalnessNoise: NormalNoise
    private readonly erosionNoise: NormalNoise
    private readonly weirdnessNoise: NormalNoise
    private readonly offsetNoise: NormalNoise
    private readonly jaggedNoise: NormalNoise

    // water
    private readonly aquiferPositionalRandomFactory: PositionalRandomFactory
    private readonly barrierNoise: NormalNoise
    private readonly fluidLevelFloodednessNoise: NormalNoise
    private readonly fluidLevelSpreadNoise: NormalNoise
    private readonly lavaNoise: NormalNoise

    constructor(private readonly noiseSettings: NoiseSettings, seed: bigint, algorithm: Algorithm) {
        this.baseNoise = noiseChunk =>
            noiseChunk.createNoiseInterpolator({
                calculateNoise: (x: number, y: number, z: number) => {
                    return this.calculateBaseNoise2(
                        x,
                        y,
                        z,
                        noiseChunk.noiseData(QuartPos.fromBlock(x), QuartPos.fromBlock(z))
                            .terrainInfo,
                        noiseChunk.blender
                    )
                },
            })

        const largeBiomes = noiseSettings.largeBiomes
        const positionalrandomfactory = Algorithm_newInstance(algorithm, seed).forkPositional()
        if (algorithm != Algorithm.LEGACY) {
            this.blendedNoise = BlendedNoise.create(
                positionalrandomfactory.fromHashOf("terrain"),
                noiseSettings.noiseSamplingSettings,
                noiseSettings.cellWidth,
                noiseSettings.cellHeight
            )
            this.temperatureNoise = Noises_instantiate(
                positionalrandomfactory,
                largeBiomes ? Noises.TEMPERATURE_LARGE : Noises.TEMPERATURE
            )
            this.humidityNoise = Noises_instantiate(
                positionalrandomfactory,
                largeBiomes ? Noises.VEGETATION_LARGE : Noises.VEGETATION
            )
            this.offsetNoise = Noises_instantiate(positionalrandomfactory, Noises.SHIFT)
        } else {
            this.blendedNoise = BlendedNoise.create(
                Algorithm_newInstance(algorithm, seed),
                noiseSettings.noiseSamplingSettings,
                noiseSettings.cellWidth,
                noiseSettings.cellHeight
            )
            this.temperatureNoise = NormalNoise.createLegacyNetherBiome(
                Algorithm_newInstance(algorithm, seed),
                new NoiseParameters(-7, 1.0, 1.0)
            )
            this.humidityNoise = NormalNoise.createLegacyNetherBiome(
                Algorithm_newInstance(algorithm, seed + 1n),
                new NoiseParameters(-7, 1.0, 1.0)
            )
            this.offsetNoise = NormalNoise.create2(
                positionalrandomfactory.fromHashOf(toResourceLocation(Noises.SHIFT)),
                new NoiseParameters(0, 0.0)
            )
        }

        this.aquiferPositionalRandomFactory = positionalrandomfactory
            .fromHashOf("aquifer")
            .forkPositional()
        this.barrierNoise = Noises_instantiate(positionalrandomfactory, Noises.AQUIFER_BARRIER)
        this.fluidLevelFloodednessNoise = Noises_instantiate(
            positionalrandomfactory,
            Noises.AQUIFER_FLUID_LEVEL_FLOODEDNESS
        )
        this.lavaNoise = Noises_instantiate(positionalrandomfactory, Noises.AQUIFER_LAVA)
        this.fluidLevelSpreadNoise = Noises_instantiate(
            positionalrandomfactory,
            Noises.AQUIFER_FLUID_LEVEL_SPREAD
        )
        this.continentalnessNoise = Noises_instantiate(
            positionalrandomfactory,
            largeBiomes ? Noises.CONTINENTALNESS_LARGE : Noises.CONTINENTALNESS
        )
        this.erosionNoise = Noises_instantiate(
            positionalrandomfactory,
            largeBiomes ? Noises.EROSION_LARGE : Noises.EROSION
        )
        this.weirdnessNoise = Noises_instantiate(positionalrandomfactory, Noises.RIDGE)
        this.jaggedNoise = Noises_instantiate(positionalrandomfactory, Noises.JAGGED)
    }

    private calculateBaseNoise2(
        x: number,
        y: number,
        z: number,
        terrainInfo: TerrainInfo,
        blender: Blender
    ): number {
        const blended = this.blendedNoise.calculateNoise(x, y, z)
        return this.calculateBaseNoise(x, y, z, terrainInfo, blended, true, blender)
    }

    private calculateBaseNoise(
        x: number,
        y: number,
        z: number,
        terrainInfo: TerrainInfo,
        blended: number,
        useJagged: boolean,
        blender: Blender
    ): number {
        const jagged = useJagged ? this.sampleJaggedNoise(terrainInfo.jaggedness, x, z) : 0
        const density = (this.computeBaseDensity(y, terrainInfo) + jagged) * terrainInfo.factor
        const height = density * (density > 0.0 ? 4 : 1)

        const blendedHeight = height + blended

        const someHeight = blendedHeight
        const spaghettiHeight = 64
        const pillars = -64

        let finalHeight = Math.max(Math.min(someHeight, spaghettiHeight), pillars)
        finalHeight = this.applySlide(finalHeight, Math.trunc(y / this.noiseSettings.cellHeight))
        finalHeight = blender.blendDensity(x, y, z, finalHeight)

        return Mth.clamp(finalHeight, -64, 64)
    }

    private sampleJaggedNoise(jaggedness: number, x: number, z: number): number {
        if (jaggedness === 0.0) {
            return 0.0
        } else {
            const jagged = this.jaggedNoise.getValue(x * 1500, 0, z * 1500)
            return jagged > 0 ? jaggedness * jagged : (jaggedness / 2) * jagged
        }
    }

    private computeBaseDensity(y: number, terrainInfo: TerrainInfo): number {
        const normalizedY = 1 - y / 128
        return normalizedY + terrainInfo.offset
    }

    private applySlide(height: number, cellY: number): number {
        const baseCellY = cellY - this.noiseSettings.minCellY
        height = this.noiseSettings.topSlideSettings.applySlide(
            height,
            this.noiseSettings.cellCountY - baseCellY
        )
        return this.noiseSettings.bottomSlideSettings.applySlide(height, baseCellY)
    }

    makeBaseNoiseFiller(chunk: NoiseChunk, filler: NoiseFiller): BlockStateFiller {
        const baseNoiseSampler = this.baseNoise(chunk)
        return (x, y, z) => {
            const baseNoise = baseNoiseSampler.sample()
            let clampedBaseNoise = Mth.clamp(baseNoise * 0.64, -1, 1)
            clampedBaseNoise =
                clampedBaseNoise / 2 - (clampedBaseNoise * clampedBaseNoise * clampedBaseNoise) / 24

            clampedBaseNoise += filler.calculateNoise(x, y, z)

            return chunk.aquifer.computeSubstance(x, y, z, baseNoise, clampedBaseNoise)
        }
    }

    getPreliminarySurfaceLevel(x: number, z: number, terrainInfo: TerrainInfo): number {
        for (
            let cellY = this.noiseSettings.minCellY + this.noiseSettings.cellCountY;
            cellY >= this.noiseSettings.minCellY;
            --cellY
        ) {
            const y = cellY * this.noiseSettings.cellHeight
            const baseNoise = this.calculateBaseNoise(
                x,
                y,
                z,
                terrainInfo,
                -0.703125,
                false,
                Blender.empty()
            )
            if (baseNoise > 0.390625) {
                return y
            }
        }

        return 2 ** 31 - 1
    }

    createAquifer(
        noiseChunk: NoiseChunk,
        x: number,
        y: number,
        cellX: number,
        cellY: number,
        picker: FluidPicker,
        enabled: boolean
    ): Aquifer {
        if (!enabled) {
            return Aquifer.createDisabled(picker)
        } else {
            const sectionX = SectionPos.blockToSectionCoord(x)
            const sectionY = SectionPos.blockToSectionCoord(y)
            return Aquifer.create(
                noiseChunk,
                new ChunkPos(sectionX, sectionY),
                this.barrierNoise,
                this.fluidLevelFloodednessNoise,
                this.fluidLevelSpreadNoise,
                this.lavaNoise,
                this.aquiferPositionalRandomFactory,
                cellX * this.noiseSettings.cellHeight,
                cellY * this.noiseSettings.cellHeight,
                picker
            )
        }
    }

    noiseData(x: number, z: number, blender: Blender): FlatNoiseData {
        const shiftedX = x + this.getOffset(x, 0, z)
        const shiftedZ = z + this.getOffset(z, x, 0)
        const continentalness = this.getContinentalness(shiftedX, 0, shiftedZ)
        const weirdness = this.getWeirdness(shiftedX, 0, shiftedZ)
        const erosion = this.getErosion(shiftedX, 0, shiftedZ)
        const terrainInfo = this.terrainInfo(
            QuartPos.toBlock(x),
            QuartPos.toBlock(z),
            continentalness,
            weirdness,
            erosion,
            blender
        )
        return new FlatNoiseData(
            shiftedX,
            shiftedZ,
            continentalness,
            weirdness,
            erosion,
            terrainInfo
        )
    }

    sample(x: number, y: number, z: number): TargetPoint {
        return this.target(x, y, z, this.noiseData(x, z, Blender.empty()))
    }

    target(x: number, y: number, z: number, flatData: FlatNoiseData): TargetPoint {
        const shiftedX = flatData.shiftedX
        const shiftedY = y + this.getOffset(y, z, x)
        const d2 = flatData.shiftedZ
        const d3 = this.computeBaseDensity(QuartPos.toBlock(y), flatData.terrainInfo)
        return Climate.target(
            this.getTemperature(shiftedX, shiftedY, d2),
            this.getHumidity(shiftedX, shiftedY, d2),
            flatData.continentalness,
            flatData.erosion,
            d3,
            flatData.weirdness
        )
    }

    terrainInfo(
        x: number,
        y: number,
        continents: number,
        weirdness: number,
        erosion: number,
        blender: Blender
    ): TerrainInfo {
        const terrainShaper = this.noiseSettings.terrainShaper
        const point = terrainShaper.makePoint(continents, erosion, weirdness)
        const offset = terrainShaper.offset(point)
        const factor = terrainShaper.factor(point)
        const jaggedness = terrainShaper.jaggedness(point)
        const terrainInfo = new TerrainInfo(offset, factor, jaggedness)
        return blender.blendOffsetAndFactor(x, y, terrainInfo)
    }

    getOffset(x: number, y: number, z: number): number {
        return this.offsetNoise.getValue(x, y, z) * 4
    }

    private getTemperature(x: number, y: number, z: number): number {
        return this.temperatureNoise.getValue(x, 0, z)
    }

    private getHumidity(x: number, y: number, z: number): number {
        return this.humidityNoise.getValue(x, 0, z)
    }

    public getContinentalness(x: number, y: number, z: number): number {
        return this.continentalnessNoise.getValue(x, y, z)
    }

    public getErosion(x: number, y: number, z: number): number {
        return this.erosionNoise.getValue(x, y, z)
    }

    public getWeirdness(x: number, y: number, z: number): number {
        return this.weirdnessNoise.getValue(x, y, z)
    }
}

export class NoiseBasedChunkGenerator extends ChunkGenerator {
    private readonly defaultBlock: Blocks
    private readonly sampler: NoiseSampler

    constructor(
        biomeSource: BiomeSource,
        private readonly seed: bigint,
        private readonly settings: NoiseGeneratorSettings
    ) {
        super(biomeSource)

        this.defaultBlock = settings.defaultBlock

        const noiseSettings = settings.noiseSettings

        this.sampler = new NoiseSampler(noiseSettings, seed, settings.randomSource)
    }

    climateSampler(): Climate.Sampler {
        return this.sampler
    }
}
