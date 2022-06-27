import { BiomeResolver, BiomeSource } from "./biome-source"
import { Biomes } from "./biomes"
import { Blocks } from "./blocks"
import { Climate } from "./climate"
import { SurfaceRules } from "./surface-rules"
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
import { Mth } from "./mth"
import { Aquifer, FluidPicker, FluidStatus } from "./aquifer"
import { Supplier } from "./consumer"
import { BlockPos, SectionPos } from "./pos"
import { SurfaceSystem } from "./surface-system"
import { ChunkAccess } from "./chunks"
import { Heightmap } from "./heightmap"

export class ChunkPos {
    readonly x: number
    readonly z: number

    constructor(x: number, z: number)
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
            return (
                (Mth.toLong(x) & 4294967295n) |
                Mth.signedShiftLeft64(Mth.toLong(z!) & 4294967295n, 32n)
            )
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

// generator

class WorldGenRegion {}

export interface NoiseBiomeSource {
    getNoiseBiome(x: number, y: number, z: number): Biomes
}

export abstract class ChunkGenerator implements NoiseBiomeSource {
    constructor(readonly biomeSource: BiomeSource) {
        //
    }

    abstract climateSampler(): Climate.Sampler

    getNoiseBiome(x: number, y: number, z: number): Biomes {
        return this.biomeSource.getNoiseBiome(x, y, z, this.climateSampler())
    }

    abstract buildSurface(region: WorldGenRegion, access: ChunkAccess): void

    abstract withSeed(seed: bigint): ChunkGenerator

    createBiomes(blender: Blender, chunk: ChunkAccess): ChunkAccess {
        chunk.fillBiomesFromNoise(this.biomeSource, this.climateSampler())
        return chunk
    }

    abstract fillFromNoise(blender: Blender, chunkAccess: ChunkAccess): ChunkAccess

    abstract getMinY(): number
    abstract getGenDepth(): number
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

    public static toSection(coord: number): number {
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
        readonly surfaceRule: SurfaceRules.RuleSource,
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
            SurfaceRules.SurfaceRuleData.overworld(),
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
    private noise000 = 0
    private noise001 = 0
    private noise100 = 0
    private noise101 = 0
    private noise010 = 0
    private noise011 = 0
    private noise110 = 0
    private noise111 = 0
    private valueXZ00 = 0
    private valueXZ10 = 0
    private valueXZ01 = 0
    private valueXZ11 = 0
    private valueZ0 = 0
    private valueZ1 = 0
    private value = 0

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
        return Mth.computeIfAbsent(
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
            terraininfo = this._noiseData[baseX][baseZ].terrainInfo
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
export class Blender {
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
                positionalrandomfactory.fromHashOf(toResourceLocation("terrain")),
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
            .fromHashOf(toResourceLocation("aquifer"))
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

    sample(x: number, y: number, z: number): Climate.TargetPoint {
        return this.target(x, y, z, this.noiseData(x, z, Blender.empty()))
    }

    target(x: number, y: number, z: number, flatData: FlatNoiseData): Climate.TargetPoint {
        const shiftedX = flatData.shiftedX
        const shiftedY = y + this.getOffset(y, z, x)
        const shiftedZ = flatData.shiftedZ
        const baseDensity = this.computeBaseDensity(QuartPos.toBlock(y), flatData.terrainInfo)
        return Climate.target(
            this.getTemperature(shiftedX, shiftedY, shiftedZ),
            this.getHumidity(shiftedX, shiftedY, shiftedZ),
            flatData.continentalness,
            flatData.erosion,
            baseDensity,
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

interface WorldGenMaterialRule {
    apply(noiseChunk: NoiseChunk, x: number, y: number, z: number): Blocks | null
}
class MaterialRuleList implements WorldGenMaterialRule {
    constructor(private readonly materialRuleList: WorldGenMaterialRule[]) {}

    apply(noiseChunk: NoiseChunk, x: number, y: number, z: number): Blocks | null {
        for (const worldgenmaterialrule of this.materialRuleList) {
            const blockState = worldgenmaterialrule.apply(noiseChunk, x, y, z)
            if (blockState != null) {
                return blockState
            }
        }

        return null
    }
}

class BelowZeroRetrogen {
    static getBiomeResolver(resolver: BiomeResolver, chunkAccess: ChunkAccess): BiomeResolver {
        return resolver
    }
}

class Beardifier {
    constructor(private readonly chunkAccess: ChunkAccess) {
        //
    }

    calculateNoise(x: number, y: number, z: number): number {
        return 0
    }
}

export class NoiseBasedChunkGenerator extends ChunkGenerator {
    private readonly defaultBlock: Blocks
    private readonly sampler: NoiseSampler
    private readonly surfaceSystem: SurfaceSystem
    private readonly materialRule: WorldGenMaterialRule
    private readonly globalFluidPicker: FluidPicker

    constructor(
        biomeSource: BiomeSource,
        private readonly seed: bigint,
        private readonly settings: NoiseGeneratorSettings
    ) {
        super(biomeSource)

        this.defaultBlock = settings.defaultBlock

        const noiseSettings = settings.noiseSettings

        this.sampler = new NoiseSampler(noiseSettings, seed, settings.randomSource)

        this.materialRule = new MaterialRuleList([
            {
                apply: (noiseChunk: NoiseChunk, x: number, y: number, z: number) =>
                    noiseChunk.updateNoiseAndGenerateBaseState(x, y, z),
            },
        ])
        const lava = new FluidStatus(-54, Blocks.LAVA)
        const seaLevel = settings.seaLevel
        const defaultFluid = new FluidStatus(seaLevel, settings.defaultFluid)
        const air = new FluidStatus(noiseSettings.minY - 1, Blocks.AIR)
        this.globalFluidPicker = {
            computeFluid: (x: number, y: number): FluidStatus => {
                return y < Math.min(-54, seaLevel) ? lava : defaultFluid
            },
        }
        this.surfaceSystem = new SurfaceSystem(
            this.defaultBlock,
            seaLevel,
            seed,
            settings.randomSource
        )
    }

    withSeed(seed: bigint): ChunkGenerator {
        return new NoiseBasedChunkGenerator(this.biomeSource.withSeed(seed), seed, this.settings)
    }

    climateSampler(): Climate.Sampler {
        return this.sampler
    }

    createBiomes(blender: Blender, chunkAccess: ChunkAccess): ChunkAccess {
        const noiseChunk = chunkAccess.getOrCreateNoiseChunk(
            this.sampler,
            () => new Beardifier(chunkAccess),
            this.settings,
            this.globalFluidPicker,
            blender
        )
        const biomeResolver = BelowZeroRetrogen.getBiomeResolver(
            blender.getBiomeResolver(this.biomeSource),
            chunkAccess
        )
        chunkAccess.fillBiomesFromNoise(biomeResolver, {
            sample: (x: number, y: number, z: number): Climate.TargetPoint => {
                return this.sampler.target(x, y, z, noiseChunk.noiseData(x, z))
            },
        })

        return chunkAccess
    }

    fillFromNoise(blender: Blender, chunkAccess: ChunkAccess): ChunkAccess {
        const noiseSettings = this.settings.noiseSettings
        const heightAccessor = chunkAccess.getHeightAccessorForGeneration()

        const minY = Math.max(noiseSettings.minY, heightAccessor.getMinBuildHeight())
        const maxY = Math.min(
            noiseSettings.minY + noiseSettings.height,
            heightAccessor.getMaxBuildHeight()
        )
        const minCellY = Mth.intFloorDiv(minY, noiseSettings.cellHeight)
        const cellCount = Mth.intFloorDiv(maxY - minY, noiseSettings.cellHeight)
        if (cellCount <= 0) {
            return chunkAccess
        } else {
            /*
            const sectionMaxY = chunkAccess.getSectionIndex(
                cellCount * noisesettings.cellHeight - 1 + minY
            )
            const sectionMinY = chunkAccess.getSectionIndex(minY)
            const set = new Set<LevelChunkSection>()

            for (let sectionY = sectionMaxY; sectionY >= sectionMinY; --sectionY) {
                const levelchunksection = chunkAccess.getSection(sectionY)
                set.add(levelchunksection)
            }
            */

            return this.doFill(blender, chunkAccess, minCellY, cellCount)
        }
    }

    private doFill(
        blender: Blender,
        chunkAccess: ChunkAccess,
        minCellY: number,
        cellCount: number
    ): ChunkAccess {
        const settings = this.settings
        const noiseChunk = chunkAccess.getOrCreateNoiseChunk(
            this.sampler,
            () => new Beardifier(chunkAccess),
            settings,
            this.globalFluidPicker,
            blender
        )
        const oceanFloorHeightMap = chunkAccess.getOrCreateHeightmapUnprimed(
            Heightmap.Types.OCEAN_FLOOR_WG
        )
        const worldSurfaceHeightMap = chunkAccess.getOrCreateHeightmapUnprimed(
            Heightmap.Types.WORLD_SURFACE_WG
        )
        const chunkpos = chunkAccess.getPos()
        const x = chunkpos.getMinBlockX()
        const z = chunkpos.getMinBlockZ()
        // const aquifer = noisechunk.aquifer
        noiseChunk.initializeForFirstCellX()
        // const blockpos$mutableblockpos = new MutableBlockPos()
        const noisesettings = settings.noiseSettings
        const cellWidth = noisesettings.cellWidth
        const cellHeight = noisesettings.cellHeight
        const cellCountX = 16 / cellWidth
        const cellCountZ = 16 / cellWidth

        for (let cellX = 0; cellX < cellCountX; ++cellX) {
            noiseChunk.advanceCellX(cellX)

            for (let cellZ = 0; cellZ < cellCountZ; ++cellZ) {
                let levelchunksection = chunkAccess.getSection(chunkAccess.getSectionsCount() - 1)

                for (let cellY = cellCount - 1; cellY >= 0; --cellY) {
                    noiseChunk.selectCellYZ(cellY, cellZ)

                    for (let yOffset = cellHeight - 1; yOffset >= 0; --yOffset) {
                        const currentY = (minCellY + cellY) * cellHeight + yOffset
                        const yForSection = currentY & 15
                        const sectionIndex = chunkAccess.getSectionIndex(currentY)
                        if (
                            chunkAccess.getSectionIndex(levelchunksection.bottomBlockY) !=
                            sectionIndex
                        ) {
                            levelchunksection = chunkAccess.getSection(sectionIndex)
                        }

                        const yt = yOffset / cellHeight
                        noiseChunk.updateForY(yt)

                        for (let xOffset = 0; xOffset < cellWidth; ++xOffset) {
                            const currentX = x + cellX * cellWidth + xOffset
                            const xForSection = currentX & 15
                            const xt = xOffset / cellWidth
                            noiseChunk.updateForX(xt)

                            for (let zOffset = 0; zOffset < cellWidth; ++zOffset) {
                                const currentZ = z + cellZ * cellWidth + zOffset
                                const zForSection = currentZ & 15
                                const zt = zOffset / cellWidth
                                noiseChunk.updateForZ(zt)

                                let blockstate = this.materialRule.apply(
                                    noiseChunk,
                                    currentX,
                                    currentY,
                                    currentZ
                                )
                                if (blockstate == null) {
                                    blockstate = this.defaultBlock
                                }

                                if (blockstate != Blocks.AIR) {
                                    /*
                                    if (
                                        blockstate.getLightEmission() != 0 &&
                                        chunkAccess instanceof ProtoChunk
                                    ) {
                                        blockpos$mutableblockpos.set(k3, k2, j4)
                                        chunkAccess.addLight(blockpos$mutableblockpos)
                                    }
                                    */

                                    levelchunksection.setBlockState(
                                        xForSection,
                                        yForSection,
                                        zForSection,
                                        blockstate
                                    )
                                    oceanFloorHeightMap.update(
                                        xForSection,
                                        currentY,
                                        zForSection,
                                        blockstate
                                    )
                                    worldSurfaceHeightMap.update(
                                        xForSection,
                                        currentY,
                                        zForSection,
                                        blockstate
                                    )

                                    /*
                                    if (
                                        aquifer.shouldScheduleFluidUpdate() &&
                                        !blockstate.getFluidState().isEmpty()
                                    ) {
                                        blockpos$mutableblockpos.set(k3, k2, j4)
                                        chunkAccess.markPosForPostprocessing(
                                            blockpos$mutableblockpos
                                        )
                                    }
                                    */
                                }
                            }
                        }
                    }
                }
            }

            noiseChunk.swapSlices()
        }

        return chunkAccess
    }

    getGenDepth(): number {
        return this.settings.noiseSettings.height
    }

    getSeaLevel(): number {
        return this.settings.seaLevel
    }

    getMinY(): number {
        return this.settings.noiseSettings.minY
    }
}
