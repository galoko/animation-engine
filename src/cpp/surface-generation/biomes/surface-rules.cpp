#include "surface-rules.hpp"
#include "chunk-generator.hpp"

#include <algorithm>

WorldGenerationContext::WorldGenerationContext(shared_ptr<ChunkGenerator> chunkGenerator,
                                               const LevelHeightAccessor &heightAccessor) {
    this->minY = std::max(heightAccessor.getMinBuildHeight(), chunkGenerator->getMinY());
    this->height = std::min(heightAccessor.getHeight(), chunkGenerator->getGenDepth());
}

int32_t WorldGenerationContext::getMinGenY() const {
    return this->minY;
}

int32_t WorldGenerationContext::getGenDepth() const {
    return this->height;
}

shared_ptr<VerticalAnchor> VerticalAnchor::BOTTOM = VerticalAnchor::aboveBottom(0);
shared_ptr<VerticalAnchor> VerticalAnchor::TOP = VerticalAnchor::belowTop(0);

shared_ptr<SurfaceRules::Hole> SurfaceRules::Hole::INSTANCE = make_shared<SurfaceRules::Hole>();
shared_ptr<SurfaceRules::Steep> SurfaceRules::Steep::INSTANCE = make_shared<SurfaceRules::Steep>();

class AbsoluteVerticalAnchor : public VerticalAnchor {
public:
    AbsoluteVerticalAnchor(int32_t value) : VerticalAnchor(value) {
    }

    virtual ~AbsoluteVerticalAnchor() {
    }

    int32_t resolveY(const WorldGenerationContext &ctx) {
        return this->value;
    }
};

class AboveBottomVerticalAnchor : public VerticalAnchor {
public:
    AboveBottomVerticalAnchor(int32_t value)
        : VerticalAnchor(value){

          };

    virtual ~AboveBottomVerticalAnchor() {
    }

    int32_t resolveY(const WorldGenerationContext &ctx) {
        return ctx.getMinGenY() + this->value;
    }
};

class BelowTopVerticalAnchor : public VerticalAnchor {
public:
    BelowTopVerticalAnchor(int32_t value)
        : VerticalAnchor(value){

          };

    virtual ~BelowTopVerticalAnchor() {
    }

    int32_t resolveY(const WorldGenerationContext &ctx) {
        return ctx.getGenDepth() - 1 + ctx.getMinGenY() - this->value;
    }
};

shared_ptr<VerticalAnchor> makeAbsolute(int32_t value) {
    return make_shared<AbsoluteVerticalAnchor>(value);
}

shared_ptr<VerticalAnchor> makeAboveBottom(int32_t value) {
    return make_shared<AboveBottomVerticalAnchor>(value);
}

shared_ptr<VerticalAnchor> makeBelowTop(int32_t value) {
    return make_shared<BelowTopVerticalAnchor>(value);
}

// SurfaceRuleData

shared_ptr<SurfaceRules::RuleSource> makeStateRule(Blocks block) {
    return SurfaceRules::state(block);
}

shared_ptr<SurfaceRules::RuleSource> SurfaceRulesData::AIR = makeStateRule(Blocks::AIR);
shared_ptr<SurfaceRules::RuleSource> SurfaceRulesData::BEDROCK = makeStateRule(Blocks::BEDROCK);
shared_ptr<SurfaceRules::RuleSource> SurfaceRulesData::WHITE_TERRACOTTA = makeStateRule(Blocks::WHITE_TERRACOTTA);
shared_ptr<SurfaceRules::RuleSource> SurfaceRulesData::ORANGE_TERRACOTTA = makeStateRule(Blocks::ORANGE_TERRACOTTA);
shared_ptr<SurfaceRules::RuleSource> SurfaceRulesData::TERRACOTTA = makeStateRule(Blocks::TERRACOTTA);
shared_ptr<SurfaceRules::RuleSource> SurfaceRulesData::RED_SAND = makeStateRule(Blocks::RED_SAND);
shared_ptr<SurfaceRules::RuleSource> SurfaceRulesData::RED_SANDSTONE = makeStateRule(Blocks::RED_SANDSTONE);
shared_ptr<SurfaceRules::RuleSource> SurfaceRulesData::STONE = makeStateRule(Blocks::STONE);
shared_ptr<SurfaceRules::RuleSource> SurfaceRulesData::DEEPSLATE = makeStateRule(Blocks::DEEPSLATE);
shared_ptr<SurfaceRules::RuleSource> SurfaceRulesData::DIRT = makeStateRule(Blocks::DIRT);
shared_ptr<SurfaceRules::RuleSource> SurfaceRulesData::PODZOL = makeStateRule(Blocks::PODZOL);
shared_ptr<SurfaceRules::RuleSource> SurfaceRulesData::COARSE_DIRT = makeStateRule(Blocks::COARSE_DIRT);
shared_ptr<SurfaceRules::RuleSource> SurfaceRulesData::MYCELIUM = makeStateRule(Blocks::MYCELIUM);
shared_ptr<SurfaceRules::RuleSource> SurfaceRulesData::GRASS_BLOCK = makeStateRule(Blocks::GRASS_BLOCK);
shared_ptr<SurfaceRules::RuleSource> SurfaceRulesData::CALCITE = makeStateRule(Blocks::CALCITE);
shared_ptr<SurfaceRules::RuleSource> SurfaceRulesData::GRAVEL = makeStateRule(Blocks::GRAVEL);
shared_ptr<SurfaceRules::RuleSource> SurfaceRulesData::SAND = makeStateRule(Blocks::SAND);
shared_ptr<SurfaceRules::RuleSource> SurfaceRulesData::SANDSTONE = makeStateRule(Blocks::SANDSTONE);
shared_ptr<SurfaceRules::RuleSource> SurfaceRulesData::PACKED_ICE = makeStateRule(Blocks::PACKED_ICE);
shared_ptr<SurfaceRules::RuleSource> SurfaceRulesData::SNOW_BLOCK = makeStateRule(Blocks::SNOW_BLOCK);
shared_ptr<SurfaceRules::RuleSource> SurfaceRulesData::POWDER_SNOW = makeStateRule(Blocks::POWDER_SNOW);
shared_ptr<SurfaceRules::RuleSource> SurfaceRulesData::ICE = makeStateRule(Blocks::ICE);
shared_ptr<SurfaceRules::RuleSource> SurfaceRulesData::WATER = makeStateRule(Blocks::WATER);
shared_ptr<SurfaceRules::RuleSource> SurfaceRulesData::LAVA = makeStateRule(Blocks::LAVA);
shared_ptr<SurfaceRules::RuleSource> SurfaceRulesData::NETHERRACK = makeStateRule(Blocks::NETHERRACK);
shared_ptr<SurfaceRules::RuleSource> SurfaceRulesData::SOUL_SAND = makeStateRule(Blocks::SOUL_SAND);
shared_ptr<SurfaceRules::RuleSource> SurfaceRulesData::SOUL_SOIL = makeStateRule(Blocks::SOUL_SOIL);
shared_ptr<SurfaceRules::RuleSource> SurfaceRulesData::BASALT = makeStateRule(Blocks::BASALT);
shared_ptr<SurfaceRules::RuleSource> SurfaceRulesData::BLACKSTONE = makeStateRule(Blocks::BLACKSTONE);
shared_ptr<SurfaceRules::RuleSource> SurfaceRulesData::WARPED_WART_BLOCK = makeStateRule(Blocks::WARPED_WART_BLOCK);
shared_ptr<SurfaceRules::RuleSource> SurfaceRulesData::WARPED_NYLIUM = makeStateRule(Blocks::WARPED_NYLIUM);
shared_ptr<SurfaceRules::RuleSource> SurfaceRulesData::NETHER_WART_BLOCK = makeStateRule(Blocks::NETHER_WART_BLOCK);
shared_ptr<SurfaceRules::RuleSource> SurfaceRulesData::CRIMSON_NYLIUM = makeStateRule(Blocks::CRIMSON_NYLIUM);
shared_ptr<SurfaceRules::RuleSource> SurfaceRulesData::ENDSTONE = makeStateRule(Blocks::END_STONE);

shared_ptr<SurfaceRules::ConditionSource> SurfaceRules::ON_FLOOR =
    SurfaceRules::stoneDepthCheck(0, false, false, CaveSurface::FLOOR);
shared_ptr<SurfaceRules::ConditionSource> UNDER_FLOOR =
    SurfaceRules::stoneDepthCheck(0, true, false, CaveSurface::FLOOR);
shared_ptr<SurfaceRules::ConditionSource> ON_CEILING =
    SurfaceRules::stoneDepthCheck(0, false, false, CaveSurface::CEILING);
shared_ptr<SurfaceRules::ConditionSource> UNDER_CEILING =
    SurfaceRules::stoneDepthCheck(0, true, false, CaveSurface::CEILING);

const shared_ptr<SurfaceRules::RuleSource> SurfaceRulesData::overworld() {
    return nullptr;
}

const shared_ptr<SurfaceRules::RuleSource> SurfaceRulesData::overworldLike(bool abovePreliminarySurfaceCheck,
                                                                           bool haveBedrockRoof,
                                                                           bool haveBedrockFloor) {
    shared_ptr<SurfaceRules::ConditionSource> surfacerules$conditionsource =
        SurfaceRules::yBlockCheck(VerticalAnchor::absolute(97), 2);
    shared_ptr<SurfaceRules::ConditionSource> surfacerules$conditionsource1 =
        SurfaceRules::yBlockCheck(VerticalAnchor::absolute(256), 0);
    shared_ptr<SurfaceRules::ConditionSource> surfacerules$conditionsource2 =
        SurfaceRules::yStartCheck(VerticalAnchor::absolute(63), -1);
    shared_ptr<SurfaceRules::ConditionSource> surfacerules$conditionsource3 =
        SurfaceRules::yStartCheck(VerticalAnchor::absolute(74), 1);
    shared_ptr<SurfaceRules::ConditionSource> surfacerules$conditionsource4 =
        SurfaceRules::yBlockCheck(VerticalAnchor::absolute(62), 0);
    shared_ptr<SurfaceRules::ConditionSource> surfacerules$conditionsource5 =
        SurfaceRules::yBlockCheck(VerticalAnchor::absolute(63), 0);
    shared_ptr<SurfaceRules::ConditionSource> surfacerules$conditionsource6 = SurfaceRules::waterBlockCheck(-1, 0);
    shared_ptr<SurfaceRules::ConditionSource> isWater = SurfaceRules::waterBlockCheck(0, 0);
    shared_ptr<SurfaceRules::ConditionSource> surfacerules$conditionsource8 = SurfaceRules::waterStartCheck(-6, -1);
    shared_ptr<SurfaceRules::ConditionSource> isHole = SurfaceRules::hole();
    shared_ptr<SurfaceRules::ConditionSource> isFrozenOcean =
        SurfaceRules::isBiome({Biomes::FROZEN_OCEAN, Biomes::DEEP_FROZEN_OCEAN});
    shared_ptr<SurfaceRules::ConditionSource> isSteep = SurfaceRules::steep();
    shared_ptr<SurfaceRules::RuleSource> surfacerules$rulesource =
        SurfaceRules::sequence({SurfaceRules::ifTrue(surfacerules$conditionsource6, GRASS_BLOCK), DIRT});
    shared_ptr<SurfaceRules::RuleSource> surfacerules$rulesource1 =
        SurfaceRules::sequence({SurfaceRules::ifTrue(SurfaceRules::ON_CEILING, SANDSTONE), SAND});
    shared_ptr<SurfaceRules::RuleSource> surfacerules$rulesource2 =
        SurfaceRules::sequence({SurfaceRules::ifTrue(SurfaceRules::ON_CEILING, STONE), GRAVEL});
    shared_ptr<SurfaceRules::ConditionSource> surfacerules$conditionsource12 =
        SurfaceRules::isBiome({Biomes::WARM_OCEAN, Biomes::DESERT, Biomes::BEACH, Biomes::SNOWY_BEACH});
    shared_ptr<SurfaceRules::RuleSource> surfacerules$rulesource3 = SurfaceRules::sequence(
        {SurfaceRules::ifTrue(
             SurfaceRules::isBiome({Biomes::STONY_PEAKS}),
             SurfaceRules::sequence(
                 {SurfaceRules::ifTrue(SurfaceRules::noiseCondition(Noises::CALCITE, -0.0125, 0.0125), CALCITE),
                  STONE})),
         SurfaceRules::ifTrue(
             SurfaceRules::isBiome({Biomes::STONY_SHORE}),
             SurfaceRules::sequence({SurfaceRules::ifTrue(SurfaceRules::noiseCondition(Noises::GRAVEL, -0.05, 0.05),
                                                          surfacerules$rulesource2),
                                     STONE})),
         SurfaceRules::ifTrue(SurfaceRules::isBiome({Biomes::WINDSWEPT_HILLS}),
                              SurfaceRules::ifTrue(SurfaceRules::surfaceNoiseAbove(1.0), STONE)),
         SurfaceRules::ifTrue(surfacerules$conditionsource12, surfacerules$rulesource1),
         SurfaceRules::ifTrue(SurfaceRules::isBiome({Biomes::DRIPSTONE_CAVES}), STONE)});
    shared_ptr<SurfaceRules::RuleSource> surfacerules$rulesource4 =
        SurfaceRules::ifTrue(SurfaceRules::noiseCondition(Noises::POWDER_SNOW, 0.45, 0.58), POWDER_SNOW);
    shared_ptr<SurfaceRules::RuleSource> surfacerules$rulesource5 =
        SurfaceRules::ifTrue(SurfaceRules::noiseCondition(Noises::POWDER_SNOW, 0.35, 0.6), POWDER_SNOW);
    shared_ptr<SurfaceRules::RuleSource> surfacerules$rulesource6 = SurfaceRules::sequence(
        {SurfaceRules::ifTrue(
             SurfaceRules::isBiome({Biomes::FROZEN_PEAKS}),
             SurfaceRules::sequence(
                 {SurfaceRules::ifTrue(isSteep, PACKED_ICE),
                  SurfaceRules::ifTrue(SurfaceRules::noiseCondition(Noises::PACKED_ICE, -0.5, 0.2), PACKED_ICE),
                  SurfaceRules::ifTrue(SurfaceRules::noiseCondition(Noises::ICE, -0.0625, 0.025), ICE), SNOW_BLOCK})),
         SurfaceRules::ifTrue(
             SurfaceRules::isBiome({Biomes::SNOWY_SLOPES}),
             SurfaceRules::sequence({SurfaceRules::ifTrue(isSteep, STONE), surfacerules$rulesource4, SNOW_BLOCK})),
         SurfaceRules::ifTrue(SurfaceRules::isBiome({Biomes::JAGGED_PEAKS}), STONE),
         SurfaceRules::ifTrue(SurfaceRules::isBiome({Biomes::GROVE}),
                              SurfaceRules::sequence({surfacerules$rulesource4, DIRT})),
         surfacerules$rulesource3,
         SurfaceRules::ifTrue(SurfaceRules::isBiome({Biomes::WINDSWEPT_SAVANNA}),
                              SurfaceRules::ifTrue(SurfaceRules::surfaceNoiseAbove(1.75), STONE)),
         SurfaceRules::ifTrue(
             SurfaceRules::isBiome({Biomes::WINDSWEPT_GRAVELLY_HILLS}),
             SurfaceRules::sequence(
                 {SurfaceRules::ifTrue(SurfaceRules::surfaceNoiseAbove(2.0), surfacerules$rulesource2),
                  SurfaceRules::ifTrue(SurfaceRules::surfaceNoiseAbove(1.0), STONE),
                  SurfaceRules::ifTrue(SurfaceRules::surfaceNoiseAbove(-1.0), DIRT), surfacerules$rulesource2})),
         DIRT});
    shared_ptr<SurfaceRules::RuleSource> surfacerules$rulesource7 = SurfaceRules::sequence(
        {SurfaceRules::ifTrue(
             SurfaceRules::isBiome({Biomes::FROZEN_PEAKS}),
             SurfaceRules::sequence(
                 {SurfaceRules::ifTrue(isSteep, PACKED_ICE),
                  SurfaceRules::ifTrue(SurfaceRules::noiseCondition(Noises::PACKED_ICE, 0.0, 0.2), PACKED_ICE),
                  SurfaceRules::ifTrue(SurfaceRules::noiseCondition(Noises::ICE, 0.0, 0.025), ICE), SNOW_BLOCK})),
         SurfaceRules::ifTrue(
             SurfaceRules::isBiome({Biomes::SNOWY_SLOPES}),
             SurfaceRules::sequence({SurfaceRules::ifTrue(isSteep, STONE), surfacerules$rulesource5, SNOW_BLOCK})),
         SurfaceRules::ifTrue(SurfaceRules::isBiome({Biomes::JAGGED_PEAKS}),
                              SurfaceRules::sequence({SurfaceRules::ifTrue(isSteep, STONE), SNOW_BLOCK})),
         SurfaceRules::ifTrue(SurfaceRules::isBiome({Biomes::GROVE}),
                              SurfaceRules::sequence({surfacerules$rulesource5, SNOW_BLOCK})),
         surfacerules$rulesource3,
         SurfaceRules::ifTrue(
             SurfaceRules::isBiome({Biomes::WINDSWEPT_SAVANNA}),
             SurfaceRules::sequence({SurfaceRules::ifTrue(SurfaceRules::surfaceNoiseAbove(1.75), STONE),
                                     SurfaceRules::ifTrue(SurfaceRules::surfaceNoiseAbove(-0.5), COARSE_DIRT)})),
         SurfaceRules::ifTrue(SurfaceRules::isBiome({Biomes::WINDSWEPT_GRAVELLY_HILLS}),
                              SurfaceRules::sequence(
                                  {SurfaceRules::ifTrue(SurfaceRules::surfaceNoiseAbove(2.0), surfacerules$rulesource2),
                                   SurfaceRules::ifTrue(SurfaceRules::surfaceNoiseAbove(1.0), STONE),
                                   SurfaceRules::ifTrue(SurfaceRules::surfaceNoiseAbove(-1.0), surfacerules$rulesource),
                                   surfacerules$rulesource2})),
         SurfaceRules::ifTrue(
             SurfaceRules::isBiome({Biomes::OLD_GROWTH_PINE_TAIGA, Biomes::OLD_GROWTH_SPRUCE_TAIGA}),
             SurfaceRules::sequence({SurfaceRules::ifTrue(SurfaceRules::surfaceNoiseAbove(1.75), COARSE_DIRT),
                                     SurfaceRules::ifTrue(SurfaceRules::surfaceNoiseAbove(-0.95), PODZOL)})),
         SurfaceRules::ifTrue(SurfaceRules::isBiome({Biomes::ICE_SPIKES}), SNOW_BLOCK),
         SurfaceRules::ifTrue(SurfaceRules::isBiome({Biomes::MUSHROOM_FIELDS}), MYCELIUM), surfacerules$rulesource});
    shared_ptr<SurfaceRules::ConditionSource> surfacerules$conditionsource13 =
        SurfaceRules::noiseCondition(Noises::SURFACE, -0.909, -0.5454);
    shared_ptr<SurfaceRules::ConditionSource> surfacerules$conditionsource14 =
        SurfaceRules::noiseCondition(Noises::SURFACE, -0.1818, 0.1818);
    shared_ptr<SurfaceRules::ConditionSource> surfacerules$conditionsource15 =
        SurfaceRules::noiseCondition(Noises::SURFACE, 0.5454, 0.909);
    shared_ptr<SurfaceRules::RuleSource> surfacerules$rulesource8 = SurfaceRules::sequence(
        {SurfaceRules::ifTrue(
             SurfaceRules::ON_FLOOR,
             SurfaceRules::sequence(
                 {SurfaceRules::ifTrue(
                      SurfaceRules::isBiome({Biomes::WOODED_BADLANDS}),
                      SurfaceRules::ifTrue(
                          surfacerules$conditionsource,
                          SurfaceRules::sequence({SurfaceRules::ifTrue(surfacerules$conditionsource13, COARSE_DIRT),
                                                  SurfaceRules::ifTrue(surfacerules$conditionsource14, COARSE_DIRT),
                                                  SurfaceRules::ifTrue(surfacerules$conditionsource15, COARSE_DIRT),
                                                  surfacerules$rulesource}))),
                  SurfaceRules::ifTrue(
                      SurfaceRules::isBiome({Biomes::SWAMP}),
                      SurfaceRules::ifTrue(
                          surfacerules$conditionsource4,
                          SurfaceRules::ifTrue(
                              SurfaceRules::_not(surfacerules$conditionsource5),
                              SurfaceRules::ifTrue(SurfaceRules::noiseCondition(Noises::SWAMP, 0.0), WATER))))})),
         SurfaceRules::ifTrue(
             SurfaceRules::isBiome({Biomes::BADLANDS, Biomes::ERODED_BADLANDS, Biomes::WOODED_BADLANDS}),
             SurfaceRules::sequence(
                 {SurfaceRules::ifTrue(
                      SurfaceRules::ON_FLOOR,
                      SurfaceRules::sequence(
                          {SurfaceRules::ifTrue(surfacerules$conditionsource1, ORANGE_TERRACOTTA),
                           SurfaceRules::ifTrue(
                               surfacerules$conditionsource3,
                               SurfaceRules::sequence({SurfaceRules::ifTrue(surfacerules$conditionsource13, TERRACOTTA),
                                                       SurfaceRules::ifTrue(surfacerules$conditionsource14, TERRACOTTA),
                                                       SurfaceRules::ifTrue(surfacerules$conditionsource15, TERRACOTTA),
                                                       SurfaceRules::bandlands()})),
                           SurfaceRules::ifTrue(
                               surfacerules$conditionsource6,
                               SurfaceRules::sequence(
                                   {SurfaceRules::ifTrue(SurfaceRules::ON_CEILING, RED_SANDSTONE), RED_SAND})),
                           SurfaceRules::ifTrue(SurfaceRules::_not(isHole), ORANGE_TERRACOTTA),
                           SurfaceRules::ifTrue(surfacerules$conditionsource8, WHITE_TERRACOTTA),
                           surfacerules$rulesource2})),
                  SurfaceRules::ifTrue(
                      surfacerules$conditionsource2,
                      SurfaceRules::sequence(
                          {SurfaceRules::ifTrue(surfacerules$conditionsource5,
                                                SurfaceRules::ifTrue(SurfaceRules::_not(surfacerules$conditionsource3),
                                                                     ORANGE_TERRACOTTA)),
                           SurfaceRules::bandlands()})),
                  SurfaceRules::ifTrue(SurfaceRules::UNDER_FLOOR,
                                       SurfaceRules::ifTrue(surfacerules$conditionsource8, WHITE_TERRACOTTA))})),
         SurfaceRules::ifTrue(
             SurfaceRules::ON_FLOOR,
             SurfaceRules::ifTrue(
                 surfacerules$conditionsource6,
                 SurfaceRules::sequence(
                     {SurfaceRules::ifTrue(
                          isFrozenOcean,
                          SurfaceRules::ifTrue(
                              isHole,
                              SurfaceRules::sequence({SurfaceRules::ifTrue(isWater, AIR),
                                                      SurfaceRules::ifTrue(SurfaceRules::temperature(), ICE), WATER}))),
                      surfacerules$rulesource7}))),
         SurfaceRules::ifTrue(
             surfacerules$conditionsource8,
             SurfaceRules::sequence(
                 {SurfaceRules::ifTrue(SurfaceRules::ON_FLOOR,
                                       SurfaceRules::ifTrue(isFrozenOcean, SurfaceRules::ifTrue(isHole, WATER))),
                  SurfaceRules::ifTrue(SurfaceRules::UNDER_FLOOR, surfacerules$rulesource6),
                  SurfaceRules::ifTrue(
                      surfacerules$conditionsource12,
                      SurfaceRules::ifTrue(SurfaceRules::stoneDepthCheck(0, true, true, CaveSurface::FLOOR),
                                           SANDSTONE))})),
         SurfaceRules::ifTrue(
             SurfaceRules::ON_FLOOR,
             SurfaceRules::sequence(
                 {SurfaceRules::ifTrue(SurfaceRules::isBiome({Biomes::FROZEN_PEAKS, Biomes::JAGGED_PEAKS}), STONE),
                  SurfaceRules::ifTrue(
                      SurfaceRules::isBiome({Biomes::WARM_OCEAN, Biomes::LUKEWARM_OCEAN, Biomes::DEEP_LUKEWARM_OCEAN}),
                      surfacerules$rulesource1),
                  surfacerules$rulesource2}))});
    vector<shared_ptr<SurfaceRules::RuleSource>> builder;
    if (haveBedrockRoof) {
        builder.push_back(SurfaceRules::ifTrue(SurfaceRules::_not(SurfaceRules::verticalGradient(
                                                   "bedrock_roof", VerticalAnchor::belowTop(5), VerticalAnchor::top())),
                                               BEDROCK));
    }

    if (haveBedrockFloor) {
        builder.push_back(SurfaceRules::ifTrue(
            SurfaceRules::verticalGradient("bedrock_floor", VerticalAnchor::bottom(), VerticalAnchor::aboveBottom(5)),
            BEDROCK));
    }

    shared_ptr<SurfaceRules::RuleSource> surfacerules$rulesource9 =
        SurfaceRules::ifTrue(SurfaceRules::abovePreliminarySurface(), surfacerules$rulesource8);
    builder.push_back(abovePreliminarySurfaceCheck ? surfacerules$rulesource9 : surfacerules$rulesource8);
    builder.push_back(SurfaceRules::ifTrue(
        SurfaceRules::verticalGradient("deepslate", VerticalAnchor::absolute(0), VerticalAnchor::absolute(8)),
        DEEPSLATE));

    return SurfaceRules::sequence(builder);
}

const shared_ptr<SurfaceRules::RuleSource> SurfaceRulesData::nether() {
    return nullptr;
}

const shared_ptr<SurfaceRules::RuleSource> SurfaceRulesData::end() {
    return nullptr;
}
