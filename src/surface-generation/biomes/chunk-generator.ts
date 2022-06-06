import { BiomeResolver, BiomeSource } from "./biome-source"
import { Biomes } from "./biomes"
import { Blocks } from "./blocks"
import { Sampler, TargetPoint } from "./climate"
import { RuleSource, SurfaceRuleData } from "./surface-rules"
import { TerrainShaper } from "./terrain-shaper"
import { Algorithm, Algorithm_newInstance, PositionalRandomFactory } from "./random"
import { SimplexNoise } from "./noise/simplex-noise"
import { BlendedNoise, NoiseFiller } from "./noise/blended-noise"
import { NoiseParameters, NormalNoise } from "./noise/normal-noise"
import { Noises_instantiate, Noises } from "./noise-data"
import * as Mth from "./mth"

export class ChunkPos {
    constructor(readonly x, readonly y) {}
}

// chunk access

export class ChunkAccess {
    constructor(readonly chunkPos: ChunkPos) {
        //
    }

    public fillBiomesFromNoise(resolver: BiomeResolver, sampler: Sampler): void {
        throw new Error("TODO")
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

    public abstract climateSampler(): Sampler

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
        return this.height / this.cellHeight
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
    constructor(p_188848_: NoiseFiller) {
        //
    }
    sample(x: number, y: number, z: number): TargetPoint {
        throw new Error("Method not implemented.")
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

class NoiseChunk {
    readonly blender: Blender

    createNoiseInterpolator(filler: NoiseFiller): NoiseInterpolator {
        return new NoiseInterpolator(filler)
    }

    noiseData(p_188752_: number, p_188753_: number): FlatNoiseData {
        //
    }
}

export type InterpolatableNoise = (chunk: NoiseChunk) => Sampler

class Blender {
    //
}

class TerrainInfo {
    //
}

export class NoiseSampler {
    private readonly amplified: boolean
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

    constructor(
        private readonly noiseSettings: NoiseSettings,
        private readonly isNoiseCavesEnabled: boolean,
        seed: bigint,
        algorithm: Algorithm
    ) {
        this.amplified = noiseSettings.isAmplified

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
                positionalrandomfactory.fromHashOf(Noises.SHIFT),
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
        const isNoiseCavesDisabled = !this.isNoiseCavesEnabled
        return this.calculateBaseNoise(
            x,
            y,
            z,
            terrainInfo,
            blended,
            isNoiseCavesDisabled,
            true,
            blender
        )
    }

    private calculateBaseNoise(
        x: number,
        y: number,
        z: number,
        terrainInfo: TerrainInfo,
        blended: number,
        isNoiseCavesDisabled: boolean,
        useJagged: boolean,
        blender: Blender
    ): number {
        const jagged = useJagged ? this.sampleJaggedNoise(terrainInfo.jaggedness, x, z) : 0
        const density = (this.computeBaseDensity(y, terrainInfo) + jagged) * terrainInfo.factor()
        const height = density * (density > 0.0 ? 4 : 1)

        const blendedHeight = height + blended

        const someHeight = blendedHeight
        const spaghettiHeight = 64
        const pillars = -64

        let finalHeight = Math.max(Math.min(someHeight, spaghettiHeight), pillars)
        finalHeight = this.applySlide(finalHeight, y / this.noiseSettings.cellHeight)
        finalHeight = blender.blendDensity(x, y, z, finalHeight)

        return Mth.clamp(finalHeight, -64, 64)
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

        this.sampler = new NoiseSampler(
            noiseSettings,
            settings.noiseCavesEnabled,
            seed,
            settings.randomSource
        )
    }

    climateSampler(): Sampler {
        return this.sampler
    }
}
