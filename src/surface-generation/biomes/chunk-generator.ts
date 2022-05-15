import { BiomeSource } from "./biome-source"
import { Biomes } from "./biomes"
import { Blocks } from "./blocks"
import { Sampler } from "./climate"
import { RuleSource, SurfaceRuleData } from "./surface-rules"
import { TerrainShaper } from "./terrain-shaper"

export class ChunkPos {
    constructor(readonly x, readonly y) {}
}

// chunk access

export class ChunkAccess {
    constructor(readonly chunkPos: ChunkPos) {
        //
    }
}

// generator

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
}

export class NoiseSampler {
    //
}

export class NoiseBasedChunkGenerator extends ChunkGenerator {
    constructor() {
        this.sampler = new NoiseSampler(
            noisesettings,
            noisegeneratorsettings.isNoiseCavesEnabled(),
            p_188617_,
            p_188614_,
            noisegeneratorsettings.getRandomSource()
        )
    }

    climateSampler(): Sampler {
        return this.sampler
    }
}
