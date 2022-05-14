import { Biomes } from "./biomes"
import { Blocks } from "./blocks"
import { Noises } from "./noise-data"

class Context {
    //
}

export type SurfaceRule = (x: number, y: number, z: number) => Blocks | null

export type RuleSource = (ctx: Context) => SurfaceRule

function makeStateRule(p_194811_: Blocks): RuleSource {
    //return SurfaceRules.state(p_194811_.defaultBlockState());
}

export class VerticalAnchor {
    public static absolute(p_158923_: number): VerticalAnchor {}

    public static aboveBottom(p_158931_: number): VerticalAnchor {}

    public static belowTop(p_158936_: number): VerticalAnchor {}

    public static bottom(): VerticalAnchor {}

    public static top(): VerticalAnchor {}
}

enum CaveSurface {
    CEILING,
    FLOOR,
}

export class SurfaceRules {
    public static yBlockCheck(anchor: VerticalAnchor, p_189402_: number): ConditionSource {}
    public static yStartCheck(anchor: VerticalAnchor, p_189402_: number): ConditionSource {}

    public static waterBlockCheck(
        offset: number,
        surfaceDepthMultiplier: number
    ): ConditionSource {}
    public static waterStartCheck(
        offset: number,
        surfaceDepthMultiplier: number
    ): ConditionSource {}

    public static hole(): ConditionSource {}
    public static abovePreliminarySurface(): ConditionSource {}
    public static temperature(): ConditionSource {}
    public static steep(): ConditionSource {}

    public static isBiome(...biomes: Biomes[]): ConditionSource {}

    public static ifTrue(cond: ConditionSource, p_189396_: RuleSource): RuleSource {}

    public static stoneDepthCheck(
        p_189386_: number,
        p_189387_: boolean,
        p_189388_: boolean,
        p_189389_: CaveSurface
    ): ConditionSource {}

    public static readonly ON_FLOOR = SurfaceRules.stoneDepthCheck(
        0,
        false,
        false,
        CaveSurface.FLOOR
    )
    public static readonly UNDER_FLOOR = SurfaceRules.stoneDepthCheck(
        0,
        true,
        false,
        CaveSurface.FLOOR
    )
    public static readonly ON_CEILING = SurfaceRules.stoneDepthCheck(
        0,
        false,
        false,
        CaveSurface.CEILING
    )
    public static readonly UNDER_CEILING = SurfaceRules.stoneDepthCheck(
        0,
        true,
        false,
        CaveSurface.CEILING
    )

    static sequence(...rules: RuleSource[]): RuleSource {}

    public static noiseCondition(
        noise: Noises,
        minNoiseValue: number,
        maxNoiseValue = Number.MAX_VALUE
    ): ConditionSource {}

    static not(cond: ConditionSource): ConditionSource {}

    public static bandlands(): RuleSource {}

    public static verticalGradient(
        p_189404_: string,
        p_189405_: VerticalAnchor,
        p_189406_: VerticalAnchor
    ): ConditionSource {}

    public static surfaceNoiseAbove(p_194809_: number): ConditionSource {}
}

export type Condition = () => boolean
export type ConditionSource = (ctx: Context) => Condition

const AIR = makeStateRule(Blocks.AIR)
const BEDROCK = makeStateRule(Blocks.BEDROCK)
const WHITE_TERRACOTTA = makeStateRule(Blocks.WHITE_TERRACOTTA)
const ORANGE_TERRACOTTA = makeStateRule(Blocks.ORANGE_TERRACOTTA)
const TERRACOTTA = makeStateRule(Blocks.TERRACOTTA)
const RED_SAND = makeStateRule(Blocks.RED_SAND)
const RED_SANDSTONE = makeStateRule(Blocks.RED_SANDSTONE)
const STONE = makeStateRule(Blocks.STONE)
const DEEPSLATE = makeStateRule(Blocks.DEEPSLATE)
const DIRT = makeStateRule(Blocks.DIRT)
const PODZOL = makeStateRule(Blocks.PODZOL)
const COARSE_DIRT = makeStateRule(Blocks.COARSE_DIRT)
const MYCELIUM = makeStateRule(Blocks.MYCELIUM)
const GRASS_BLOCK = makeStateRule(Blocks.GRASS_BLOCK)
const CALCITE = makeStateRule(Blocks.CALCITE)
const GRAVEL = makeStateRule(Blocks.GRAVEL)
const SAND = makeStateRule(Blocks.SAND)
const SANDSTONE = makeStateRule(Blocks.SANDSTONE)
const PACKED_ICE = makeStateRule(Blocks.PACKED_ICE)
const SNOW_BLOCK = makeStateRule(Blocks.SNOW_BLOCK)
const POWDER_SNOW = makeStateRule(Blocks.POWDER_SNOW)
const ICE = makeStateRule(Blocks.ICE)
const WATER = makeStateRule(Blocks.WATER)

export class SurfaceRuleData {
    public static overworld(): RuleSource {
        return SurfaceRuleData.overworldLike(true, false, true)
    }

    public static overworldLike(
        p_198381_: boolean,
        haveBedrockRoof: boolean,
        haveBedrockFloor: boolean
    ): RuleSource {
        const surfacerules$conditionsource = SurfaceRules.yBlockCheck(
            VerticalAnchor.absolute(97),
            2
        )
        const surfacerules$conditionsource1 = SurfaceRules.yBlockCheck(
            VerticalAnchor.absolute(256),
            0
        )
        const surfacerules$conditionsource2 = SurfaceRules.yStartCheck(
            VerticalAnchor.absolute(63),
            -1
        )
        const surfacerules$conditionsource3 = SurfaceRules.yStartCheck(
            VerticalAnchor.absolute(74),
            1
        )
        const surfacerules$conditionsource4 = SurfaceRules.yBlockCheck(
            VerticalAnchor.absolute(62),
            0
        )
        const surfacerules$conditionsource5 = SurfaceRules.yBlockCheck(
            VerticalAnchor.absolute(63),
            0
        )
        const surfacerules$conditionsource6 = SurfaceRules.waterBlockCheck(-1, 0)
        const isWater = SurfaceRules.waterBlockCheck(0, 0)
        const surfacerules$conditionsource8 = SurfaceRules.waterStartCheck(-6, -1)
        const isHole = SurfaceRules.hole()
        const isFrozenOcean = SurfaceRules.isBiome(Biomes.FROZEN_OCEAN, Biomes.DEEP_FROZEN_OCEAN)
        const isSteep = SurfaceRules.steep()
        const surfacerules$rulesource = SurfaceRules.sequence(
            SurfaceRules.ifTrue(surfacerules$conditionsource6, GRASS_BLOCK),
            DIRT
        )
        const surfacerules$rulesource1 = SurfaceRules.sequence(
            SurfaceRules.ifTrue(SurfaceRules.ON_CEILING, SANDSTONE),
            SAND
        )
        const surfacerules$rulesource2 = SurfaceRules.sequence(
            SurfaceRules.ifTrue(SurfaceRules.ON_CEILING, STONE),
            GRAVEL
        )
        const surfacerules$conditionsource12 = SurfaceRules.isBiome(
            Biomes.WARM_OCEAN,
            Biomes.DESERT,
            Biomes.BEACH,
            Biomes.SNOWY_BEACH
        )
        const surfacerules$rulesource3 = SurfaceRules.sequence(
            SurfaceRules.ifTrue(
                SurfaceRules.isBiome(Biomes.STONY_PEAKS),
                SurfaceRules.sequence(
                    SurfaceRules.ifTrue(
                        SurfaceRules.noiseCondition(Noises.CALCITE, -0.0125, 0.0125),
                        CALCITE
                    ),
                    STONE
                )
            ),
            SurfaceRules.ifTrue(
                SurfaceRules.isBiome(Biomes.STONY_SHORE),
                SurfaceRules.sequence(
                    SurfaceRules.ifTrue(
                        SurfaceRules.noiseCondition(Noises.GRAVEL, -0.05, 0.05),
                        surfacerules$rulesource2
                    ),
                    STONE
                )
            ),
            SurfaceRules.ifTrue(
                SurfaceRules.isBiome(Biomes.WINDSWEPT_HILLS),
                SurfaceRules.ifTrue(SurfaceRules.surfaceNoiseAbove(1.0), STONE)
            ),
            SurfaceRules.ifTrue(surfacerules$conditionsource12, surfacerules$rulesource1),
            SurfaceRules.ifTrue(SurfaceRules.isBiome(Biomes.DRIPSTONE_CAVES), STONE)
        )
        const surfacerules$rulesource4 = SurfaceRules.ifTrue(
            SurfaceRules.noiseCondition(Noises.POWDER_SNOW, 0.45, 0.58),
            POWDER_SNOW
        )
        const surfacerules$rulesource5 = SurfaceRules.ifTrue(
            SurfaceRules.noiseCondition(Noises.POWDER_SNOW, 0.35, 0.6),
            POWDER_SNOW
        )
        const surfacerules$rulesource6 = SurfaceRules.sequence(
            SurfaceRules.ifTrue(
                SurfaceRules.isBiome(Biomes.FROZEN_PEAKS),
                SurfaceRules.sequence(
                    SurfaceRules.ifTrue(isSteep, PACKED_ICE),
                    SurfaceRules.ifTrue(
                        SurfaceRules.noiseCondition(Noises.PACKED_ICE, -0.5, 0.2),
                        PACKED_ICE
                    ),
                    SurfaceRules.ifTrue(
                        SurfaceRules.noiseCondition(Noises.ICE, -0.0625, 0.025),
                        ICE
                    ),
                    SNOW_BLOCK
                )
            ),
            SurfaceRules.ifTrue(
                SurfaceRules.isBiome(Biomes.SNOWY_SLOPES),
                SurfaceRules.sequence(
                    SurfaceRules.ifTrue(isSteep, STONE),
                    surfacerules$rulesource4,
                    SNOW_BLOCK
                )
            ),
            SurfaceRules.ifTrue(SurfaceRules.isBiome(Biomes.JAGGED_PEAKS), STONE),
            SurfaceRules.ifTrue(
                SurfaceRules.isBiome(Biomes.GROVE),
                SurfaceRules.sequence(surfacerules$rulesource4, DIRT)
            ),
            surfacerules$rulesource3,
            SurfaceRules.ifTrue(
                SurfaceRules.isBiome(Biomes.WINDSWEPT_SAVANNA),
                SurfaceRules.ifTrue(SurfaceRules.surfaceNoiseAbove(1.75), STONE)
            ),
            SurfaceRules.ifTrue(
                SurfaceRules.isBiome(Biomes.WINDSWEPT_GRAVELLY_HILLS),
                SurfaceRules.sequence(
                    SurfaceRules.ifTrue(
                        SurfaceRules.surfaceNoiseAbove(2.0),
                        surfacerules$rulesource2
                    ),
                    SurfaceRules.ifTrue(SurfaceRules.surfaceNoiseAbove(1.0), STONE),
                    SurfaceRules.ifTrue(SurfaceRules.surfaceNoiseAbove(-1.0), DIRT),
                    surfacerules$rulesource2
                )
            ),
            DIRT
        )
        const surfacerules$rulesource7 = SurfaceRules.sequence(
            SurfaceRules.ifTrue(
                SurfaceRules.isBiome(Biomes.FROZEN_PEAKS),
                SurfaceRules.sequence(
                    SurfaceRules.ifTrue(isSteep, PACKED_ICE),
                    SurfaceRules.ifTrue(
                        SurfaceRules.noiseCondition(Noises.PACKED_ICE, 0.0, 0.2),
                        PACKED_ICE
                    ),
                    SurfaceRules.ifTrue(SurfaceRules.noiseCondition(Noises.ICE, 0.0, 0.025), ICE),
                    SNOW_BLOCK
                )
            ),
            SurfaceRules.ifTrue(
                SurfaceRules.isBiome(Biomes.SNOWY_SLOPES),
                SurfaceRules.sequence(
                    SurfaceRules.ifTrue(isSteep, STONE),
                    surfacerules$rulesource5,
                    SNOW_BLOCK
                )
            ),
            SurfaceRules.ifTrue(
                SurfaceRules.isBiome(Biomes.JAGGED_PEAKS),
                SurfaceRules.sequence(SurfaceRules.ifTrue(isSteep, STONE), SNOW_BLOCK)
            ),
            SurfaceRules.ifTrue(
                SurfaceRules.isBiome(Biomes.GROVE),
                SurfaceRules.sequence(surfacerules$rulesource5, SNOW_BLOCK)
            ),
            surfacerules$rulesource3,
            SurfaceRules.ifTrue(
                SurfaceRules.isBiome(Biomes.WINDSWEPT_SAVANNA),
                SurfaceRules.sequence(
                    SurfaceRules.ifTrue(SurfaceRules.surfaceNoiseAbove(1.75), STONE),
                    SurfaceRules.ifTrue(SurfaceRules.surfaceNoiseAbove(-0.5), COARSE_DIRT)
                )
            ),
            SurfaceRules.ifTrue(
                SurfaceRules.isBiome(Biomes.WINDSWEPT_GRAVELLY_HILLS),
                SurfaceRules.sequence(
                    SurfaceRules.ifTrue(
                        SurfaceRules.surfaceNoiseAbove(2.0),
                        surfacerules$rulesource2
                    ),
                    SurfaceRules.ifTrue(SurfaceRules.surfaceNoiseAbove(1.0), STONE),
                    SurfaceRules.ifTrue(
                        SurfaceRules.surfaceNoiseAbove(-1.0),
                        surfacerules$rulesource
                    ),
                    surfacerules$rulesource2
                )
            ),
            SurfaceRules.ifTrue(
                SurfaceRules.isBiome(Biomes.OLD_GROWTH_PINE_TAIGA, Biomes.OLD_GROWTH_SPRUCE_TAIGA),
                SurfaceRules.sequence(
                    SurfaceRules.ifTrue(SurfaceRules.surfaceNoiseAbove(1.75), COARSE_DIRT),
                    SurfaceRules.ifTrue(SurfaceRules.surfaceNoiseAbove(-0.95), PODZOL)
                )
            ),
            SurfaceRules.ifTrue(SurfaceRules.isBiome(Biomes.ICE_SPIKES), SNOW_BLOCK),
            SurfaceRules.ifTrue(SurfaceRules.isBiome(Biomes.MUSHROOM_FIELDS), MYCELIUM),
            surfacerules$rulesource
        )
        const surfacerules$conditionsource13 = SurfaceRules.noiseCondition(
            Noises.SURFACE,
            -0.909,
            -0.5454
        )
        const surfacerules$conditionsource14 = SurfaceRules.noiseCondition(
            Noises.SURFACE,
            -0.1818,
            0.1818
        )
        const surfacerules$conditionsource15 = SurfaceRules.noiseCondition(
            Noises.SURFACE,
            0.5454,
            0.909
        )
        const surfacerules$rulesource8 = SurfaceRules.sequence(
            SurfaceRules.ifTrue(
                SurfaceRules.ON_FLOOR,
                SurfaceRules.sequence(
                    SurfaceRules.ifTrue(
                        SurfaceRules.isBiome(Biomes.WOODED_BADLANDS),
                        SurfaceRules.ifTrue(
                            surfacerules$conditionsource,
                            SurfaceRules.sequence(
                                SurfaceRules.ifTrue(surfacerules$conditionsource13, COARSE_DIRT),
                                SurfaceRules.ifTrue(surfacerules$conditionsource14, COARSE_DIRT),
                                SurfaceRules.ifTrue(surfacerules$conditionsource15, COARSE_DIRT),
                                surfacerules$rulesource
                            )
                        )
                    ),
                    SurfaceRules.ifTrue(
                        SurfaceRules.isBiome(Biomes.SWAMP),
                        SurfaceRules.ifTrue(
                            surfacerules$conditionsource4,
                            SurfaceRules.ifTrue(
                                SurfaceRules.not(surfacerules$conditionsource5),
                                SurfaceRules.ifTrue(
                                    SurfaceRules.noiseCondition(Noises.SWAMP, 0.0),
                                    WATER
                                )
                            )
                        )
                    )
                )
            ),
            SurfaceRules.ifTrue(
                SurfaceRules.isBiome(
                    Biomes.BADLANDS,
                    Biomes.ERODED_BADLANDS,
                    Biomes.WOODED_BADLANDS
                ),
                SurfaceRules.sequence(
                    SurfaceRules.ifTrue(
                        SurfaceRules.ON_FLOOR,
                        SurfaceRules.sequence(
                            SurfaceRules.ifTrue(surfacerules$conditionsource1, ORANGE_TERRACOTTA),
                            SurfaceRules.ifTrue(
                                surfacerules$conditionsource3,
                                SurfaceRules.sequence(
                                    SurfaceRules.ifTrue(surfacerules$conditionsource13, TERRACOTTA),
                                    SurfaceRules.ifTrue(surfacerules$conditionsource14, TERRACOTTA),
                                    SurfaceRules.ifTrue(surfacerules$conditionsource15, TERRACOTTA),
                                    SurfaceRules.bandlands()
                                )
                            ),
                            SurfaceRules.ifTrue(
                                surfacerules$conditionsource6,
                                SurfaceRules.sequence(
                                    SurfaceRules.ifTrue(SurfaceRules.ON_CEILING, RED_SANDSTONE),
                                    RED_SAND
                                )
                            ),
                            SurfaceRules.ifTrue(SurfaceRules.not(isHole), ORANGE_TERRACOTTA),
                            SurfaceRules.ifTrue(surfacerules$conditionsource8, WHITE_TERRACOTTA),
                            surfacerules$rulesource2
                        )
                    ),
                    SurfaceRules.ifTrue(
                        surfacerules$conditionsource2,
                        SurfaceRules.sequence(
                            SurfaceRules.ifTrue(
                                surfacerules$conditionsource5,
                                SurfaceRules.ifTrue(
                                    SurfaceRules.not(surfacerules$conditionsource3),
                                    ORANGE_TERRACOTTA
                                )
                            ),
                            SurfaceRules.bandlands()
                        )
                    ),
                    SurfaceRules.ifTrue(
                        SurfaceRules.UNDER_FLOOR,
                        SurfaceRules.ifTrue(surfacerules$conditionsource8, WHITE_TERRACOTTA)
                    )
                )
            ),
            SurfaceRules.ifTrue(
                SurfaceRules.ON_FLOOR,
                SurfaceRules.ifTrue(
                    surfacerules$conditionsource6,
                    SurfaceRules.sequence(
                        SurfaceRules.ifTrue(
                            isFrozenOcean,
                            SurfaceRules.ifTrue(
                                isHole,
                                SurfaceRules.sequence(
                                    SurfaceRules.ifTrue(isWater, AIR),
                                    SurfaceRules.ifTrue(SurfaceRules.temperature(), ICE),
                                    WATER
                                )
                            )
                        ),
                        surfacerules$rulesource7
                    )
                )
            ),
            SurfaceRules.ifTrue(
                surfacerules$conditionsource8,
                SurfaceRules.sequence(
                    SurfaceRules.ifTrue(
                        SurfaceRules.ON_FLOOR,
                        SurfaceRules.ifTrue(isFrozenOcean, SurfaceRules.ifTrue(isHole, WATER))
                    ),
                    SurfaceRules.ifTrue(SurfaceRules.UNDER_FLOOR, surfacerules$rulesource6),
                    SurfaceRules.ifTrue(
                        surfacerules$conditionsource12,
                        SurfaceRules.ifTrue(
                            SurfaceRules.stoneDepthCheck(0, true, true, CaveSurface.FLOOR),
                            SANDSTONE
                        )
                    )
                )
            ),
            SurfaceRules.ifTrue(
                SurfaceRules.ON_FLOOR,
                SurfaceRules.sequence(
                    SurfaceRules.ifTrue(
                        SurfaceRules.isBiome(Biomes.FROZEN_PEAKS, Biomes.JAGGED_PEAKS),
                        STONE
                    ),
                    SurfaceRules.ifTrue(
                        SurfaceRules.isBiome(
                            Biomes.WARM_OCEAN,
                            Biomes.LUKEWARM_OCEAN,
                            Biomes.DEEP_LUKEWARM_OCEAN
                        ),
                        surfacerules$rulesource1
                    ),
                    surfacerules$rulesource2
                )
            )
        )
        const builder = [] as RuleSource[]
        if (haveBedrockRoof) {
            builder.push(
                SurfaceRules.ifTrue(
                    SurfaceRules.not(
                        SurfaceRules.verticalGradient(
                            "bedrock_roof",
                            VerticalAnchor.belowTop(5),
                            VerticalAnchor.top()
                        )
                    ),
                    BEDROCK
                )
            )
        }

        if (haveBedrockFloor) {
            builder.push(
                SurfaceRules.ifTrue(
                    SurfaceRules.verticalGradient(
                        "bedrock_floor",
                        VerticalAnchor.bottom(),
                        VerticalAnchor.aboveBottom(5)
                    ),
                    BEDROCK
                )
            )
        }

        const surfacerules$rulesource9 = SurfaceRules.ifTrue(
            SurfaceRules.abovePreliminarySurface(),
            surfacerules$rulesource8
        )
        builder.push(p_198381_ ? surfacerules$rulesource9 : surfacerules$rulesource8)
        builder.push(
            SurfaceRules.ifTrue(
                SurfaceRules.verticalGradient(
                    "deepslate",
                    VerticalAnchor.absolute(0),
                    VerticalAnchor.absolute(8)
                ),
                DEEPSLATE
            )
        )
        return SurfaceRules.sequence(...builder)
    }
}
