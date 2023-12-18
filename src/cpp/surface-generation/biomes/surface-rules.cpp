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
    shared_ptr<SurfaceRules::ConditionSource> isAboveWater = SurfaceRules::waterBlockCheck(-1, 0);
    shared_ptr<SurfaceRules::ConditionSource> isDeepEnoughUnderWater = SurfaceRules::waterStartCheck(-6, -1);

    shared_ptr<SurfaceRules::RuleSource> grassOrDirt =
        SurfaceRules::sequence({SurfaceRules::ifTrue(isAboveWater, GRASS_BLOCK), DIRT});
    shared_ptr<SurfaceRules::RuleSource> sandOrSandStone =
        SurfaceRules::sequence({SurfaceRules::ifTrue(SurfaceRules::ON_CEILING, SANDSTONE), SAND});
    shared_ptr<SurfaceRules::RuleSource> stoneOrGravel =
        SurfaceRules::sequence({SurfaceRules::ifTrue(SurfaceRules::ON_CEILING, STONE), GRAVEL});

    shared_ptr<SurfaceRules::ConditionSource> isWarmOrBeach =
        SurfaceRules::isBiome({Biomes::WARM_OCEAN, Biomes::DESERT, Biomes::BEACH});

    shared_ptr<SurfaceRules::RuleSource> sandOrSandstoneOnWarmOrBeach =
        SurfaceRules::ifTrue(isWarmOrBeach, sandOrSandStone);
    shared_ptr<SurfaceRules::RuleSource> dirtOrSandOrDirt = SurfaceRules::sequence(
        {SurfaceRules::ifTrue(SurfaceRules::isBiome({Biomes::GROVE}), DIRT), sandOrSandstoneOnWarmOrBeach, DIRT});
    shared_ptr<SurfaceRules::RuleSource> sandOrGrassOrDirt =
        SurfaceRules::sequence({sandOrSandstoneOnWarmOrBeach, grassOrDirt});

    shared_ptr<SurfaceRules::RuleSource> aboveAndBelowWater = SurfaceRules::sequence(
        {SurfaceRules::ifTrue(SurfaceRules::ON_FLOOR, SurfaceRules::ifTrue(isAboveWater, sandOrGrassOrDirt)),
         SurfaceRules::ifTrue(
             isDeepEnoughUnderWater,
             SurfaceRules::sequence(
                 {SurfaceRules::ifTrue(SurfaceRules::UNDER_FLOOR, dirtOrSandOrDirt),
                  SurfaceRules::ifTrue(isWarmOrBeach, SurfaceRules::ifTrue(SurfaceRules::stoneDepthCheck(
                                                                               0, true, true, CaveSurface::FLOOR),
                                                                           SANDSTONE))})),
         SurfaceRules::ifTrue(
             SurfaceRules::ON_FLOOR,
             SurfaceRules::sequence({SurfaceRules::ifTrue(SurfaceRules::isBiome({Biomes::WARM_OCEAN}), sandOrSandStone),
                                     stoneOrGravel}))});

    shared_ptr<SurfaceRules::RuleSource> aboveAndBelowWaterWithPreliminary =
        SurfaceRules::ifTrue(SurfaceRules::abovePreliminarySurface(), aboveAndBelowWater);

    return SurfaceRules::sequence(
        {SurfaceRules::ifTrue(
             SurfaceRules::verticalGradient("bedrock_floor", VerticalAnchor::bottom(), VerticalAnchor::aboveBottom(5)),
             BEDROCK),
         aboveAndBelowWaterWithPreliminary});
}

const shared_ptr<SurfaceRules::RuleSource> SurfaceRulesData::nether() {
    return nullptr;
}

const shared_ptr<SurfaceRules::RuleSource> SurfaceRulesData::end() {
    return nullptr;
}
