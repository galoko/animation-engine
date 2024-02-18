#include "surface-rules.hpp"
#include "chunk-generator.hpp"

#include <algorithm>

// SurfaceRuleData

shared_ptr<SurfaceRules::RuleSource> makeStateRule(Blocks block) {
    return SurfaceRules::state(block);
}

shared_ptr<SurfaceRules::RuleSource> SurfaceRulesData::AIR;
shared_ptr<SurfaceRules::RuleSource> SurfaceRulesData::BEDROCK;
shared_ptr<SurfaceRules::RuleSource> SurfaceRulesData::WHITE_TERRACOTTA;
shared_ptr<SurfaceRules::RuleSource> SurfaceRulesData::ORANGE_TERRACOTTA;
shared_ptr<SurfaceRules::RuleSource> SurfaceRulesData::TERRACOTTA;
shared_ptr<SurfaceRules::RuleSource> SurfaceRulesData::RED_SAND;
shared_ptr<SurfaceRules::RuleSource> SurfaceRulesData::RED_SANDSTONE;
shared_ptr<SurfaceRules::RuleSource> SurfaceRulesData::STONE;
shared_ptr<SurfaceRules::RuleSource> SurfaceRulesData::DEEPSLATE;
shared_ptr<SurfaceRules::RuleSource> SurfaceRulesData::DIRT;
shared_ptr<SurfaceRules::RuleSource> SurfaceRulesData::PODZOL;
shared_ptr<SurfaceRules::RuleSource> SurfaceRulesData::COARSE_DIRT;
shared_ptr<SurfaceRules::RuleSource> SurfaceRulesData::MYCELIUM;
shared_ptr<SurfaceRules::RuleSource> SurfaceRulesData::GRASS_BLOCK;
shared_ptr<SurfaceRules::RuleSource> SurfaceRulesData::CALCITE;
shared_ptr<SurfaceRules::RuleSource> SurfaceRulesData::GRAVEL;
shared_ptr<SurfaceRules::RuleSource> SurfaceRulesData::SAND;
shared_ptr<SurfaceRules::RuleSource> SurfaceRulesData::SANDSTONE;
shared_ptr<SurfaceRules::RuleSource> SurfaceRulesData::PACKED_ICE;
shared_ptr<SurfaceRules::RuleSource> SurfaceRulesData::SNOW_BLOCK;
shared_ptr<SurfaceRules::RuleSource> SurfaceRulesData::POWDER_SNOW;
shared_ptr<SurfaceRules::RuleSource> SurfaceRulesData::ICE;
shared_ptr<SurfaceRules::RuleSource> SurfaceRulesData::WATER;
shared_ptr<SurfaceRules::RuleSource> SurfaceRulesData::LAVA;
shared_ptr<SurfaceRules::RuleSource> SurfaceRulesData::NETHERRACK;
shared_ptr<SurfaceRules::RuleSource> SurfaceRulesData::SOUL_SAND;
shared_ptr<SurfaceRules::RuleSource> SurfaceRulesData::SOUL_SOIL;
shared_ptr<SurfaceRules::RuleSource> SurfaceRulesData::BASALT;
shared_ptr<SurfaceRules::RuleSource> SurfaceRulesData::BLACKSTONE;
shared_ptr<SurfaceRules::RuleSource> SurfaceRulesData::WARPED_WART_BLOCK;
shared_ptr<SurfaceRules::RuleSource> SurfaceRulesData::WARPED_NYLIUM;
shared_ptr<SurfaceRules::RuleSource> SurfaceRulesData::NETHER_WART_BLOCK;
shared_ptr<SurfaceRules::RuleSource> SurfaceRulesData::CRIMSON_NYLIUM;
shared_ptr<SurfaceRules::RuleSource> SurfaceRulesData::ENDSTONE;

void SurfaceRulesData::initialize() {
    VerticalAnchor::initialize();

    SurfaceRulesData::AIR = makeStateRule(Blocks::AIR);
    SurfaceRulesData::BEDROCK = makeStateRule(Blocks::BEDROCK);
    SurfaceRulesData::WHITE_TERRACOTTA = makeStateRule(Blocks::WHITE_TERRACOTTA);
    SurfaceRulesData::ORANGE_TERRACOTTA = makeStateRule(Blocks::ORANGE_TERRACOTTA);
    SurfaceRulesData::TERRACOTTA = makeStateRule(Blocks::TERRACOTTA);
    SurfaceRulesData::RED_SAND = makeStateRule(Blocks::RED_SAND);
    SurfaceRulesData::RED_SANDSTONE = makeStateRule(Blocks::RED_SANDSTONE);
    SurfaceRulesData::STONE = makeStateRule(Blocks::STONE);
    SurfaceRulesData::DEEPSLATE = makeStateRule(Blocks::DEEPSLATE);
    SurfaceRulesData::DIRT = makeStateRule(Blocks::DIRT);
    SurfaceRulesData::PODZOL = makeStateRule(Blocks::PODZOL);
    SurfaceRulesData::COARSE_DIRT = makeStateRule(Blocks::COARSE_DIRT);
    SurfaceRulesData::MYCELIUM = makeStateRule(Blocks::MYCELIUM);
    SurfaceRulesData::GRASS_BLOCK = makeStateRule(Blocks::GRASS_BLOCK);
    SurfaceRulesData::CALCITE = makeStateRule(Blocks::CALCITE);
    SurfaceRulesData::GRAVEL = makeStateRule(Blocks::GRAVEL);
    SurfaceRulesData::SAND = makeStateRule(Blocks::SAND);
    SurfaceRulesData::SANDSTONE = makeStateRule(Blocks::SANDSTONE);
    SurfaceRulesData::PACKED_ICE = makeStateRule(Blocks::PACKED_ICE);
    SurfaceRulesData::SNOW_BLOCK = makeStateRule(Blocks::SNOW_BLOCK);
    SurfaceRulesData::POWDER_SNOW = makeStateRule(Blocks::POWDER_SNOW);
    SurfaceRulesData::ICE = makeStateRule(Blocks::ICE);
    SurfaceRulesData::WATER = makeStateRule(Blocks::WATER);
    SurfaceRulesData::LAVA = makeStateRule(Blocks::LAVA);
    SurfaceRulesData::NETHERRACK = makeStateRule(Blocks::NETHERRACK);
    SurfaceRulesData::SOUL_SAND = makeStateRule(Blocks::SOUL_SAND);
    SurfaceRulesData::SOUL_SOIL = makeStateRule(Blocks::SOUL_SOIL);
    SurfaceRulesData::BASALT = makeStateRule(Blocks::BASALT);
    SurfaceRulesData::BLACKSTONE = makeStateRule(Blocks::BLACKSTONE);
    SurfaceRulesData::WARPED_WART_BLOCK = makeStateRule(Blocks::WARPED_WART_BLOCK);
    SurfaceRulesData::WARPED_NYLIUM = makeStateRule(Blocks::WARPED_NYLIUM);
    SurfaceRulesData::NETHER_WART_BLOCK = makeStateRule(Blocks::NETHER_WART_BLOCK);
    SurfaceRulesData::CRIMSON_NYLIUM = makeStateRule(Blocks::CRIMSON_NYLIUM);
    SurfaceRulesData::ENDSTONE = makeStateRule(Blocks::END_STONE);
}

void SurfaceRulesData::finalize() {
    SurfaceRulesData::AIR = nullptr;
    SurfaceRulesData::BEDROCK = nullptr;
    SurfaceRulesData::WHITE_TERRACOTTA = nullptr;
    SurfaceRulesData::ORANGE_TERRACOTTA = nullptr;
    SurfaceRulesData::TERRACOTTA = nullptr;
    SurfaceRulesData::RED_SAND = nullptr;
    SurfaceRulesData::RED_SANDSTONE = nullptr;
    SurfaceRulesData::STONE = nullptr;
    SurfaceRulesData::DEEPSLATE = nullptr;
    SurfaceRulesData::DIRT = nullptr;
    SurfaceRulesData::PODZOL = nullptr;
    SurfaceRulesData::COARSE_DIRT = nullptr;
    SurfaceRulesData::MYCELIUM = nullptr;
    SurfaceRulesData::GRASS_BLOCK = nullptr;
    SurfaceRulesData::CALCITE = nullptr;
    SurfaceRulesData::GRAVEL = nullptr;
    SurfaceRulesData::SAND = nullptr;
    SurfaceRulesData::SANDSTONE = nullptr;
    SurfaceRulesData::PACKED_ICE = nullptr;
    SurfaceRulesData::SNOW_BLOCK = nullptr;
    SurfaceRulesData::POWDER_SNOW = nullptr;
    SurfaceRulesData::ICE = nullptr;
    SurfaceRulesData::WATER = nullptr;
    SurfaceRulesData::LAVA = nullptr;
    SurfaceRulesData::NETHERRACK = nullptr;
    SurfaceRulesData::SOUL_SAND = nullptr;
    SurfaceRulesData::SOUL_SOIL = nullptr;
    SurfaceRulesData::BASALT = nullptr;
    SurfaceRulesData::BLACKSTONE = nullptr;
    SurfaceRulesData::WARPED_WART_BLOCK = nullptr;
    SurfaceRulesData::WARPED_NYLIUM = nullptr;
    SurfaceRulesData::NETHER_WART_BLOCK = nullptr;
    SurfaceRulesData::CRIMSON_NYLIUM = nullptr;
    SurfaceRulesData::ENDSTONE = nullptr;

    VerticalAnchor::finalize();
}

shared_ptr<SurfaceRules::ConditionSource> SurfaceRules::ON_FLOOR;
shared_ptr<SurfaceRules::ConditionSource> SurfaceRules::UNDER_FLOOR;
shared_ptr<SurfaceRules::ConditionSource> SurfaceRules::ON_CEILING;
shared_ptr<SurfaceRules::ConditionSource> SurfaceRules::UNDER_CEILING;
shared_ptr<SurfaceRules::AbovePreliminarySurface> SurfaceRules::AbovePreliminarySurface::INSTANCE;

void SurfaceRules::initialize() {
    SurfaceRules::ON_FLOOR = SurfaceRules::stoneDepthCheck(0, false, false, CaveSurface::FLOOR);
    SurfaceRules::UNDER_FLOOR = SurfaceRules::stoneDepthCheck(0, true, false, CaveSurface::FLOOR);
    SurfaceRules::ON_CEILING = SurfaceRules::stoneDepthCheck(0, false, false, CaveSurface::CEILING);
    SurfaceRules::UNDER_CEILING = SurfaceRules::stoneDepthCheck(0, true, false, CaveSurface::CEILING);

    SurfaceRules::AbovePreliminarySurface::INSTANCE = make_shared<SurfaceRules::AbovePreliminarySurface>();
}

void SurfaceRules::finalize() {
    SurfaceRules::ON_FLOOR = nullptr;
    SurfaceRules::UNDER_FLOOR = nullptr;
    SurfaceRules::ON_CEILING = nullptr;
    SurfaceRules::UNDER_CEILING = nullptr;

    SurfaceRules::AbovePreliminarySurface::INSTANCE = nullptr;
}

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

    return SurfaceRules::sequence({/*SurfaceRules::ifTrue(
                                    SurfaceRules::verticalGradient("bedrock_floor", VerticalAnchor::bottom(),
                                    VerticalAnchor::aboveBottom(5)), BEDROCK),*/
                                   aboveAndBelowWaterWithPreliminary});
}

const shared_ptr<SurfaceRules::RuleSource> SurfaceRulesData::nether() {
    return nullptr;
}

const shared_ptr<SurfaceRules::RuleSource> SurfaceRulesData::end() {
    return nullptr;
}

// Context

void SurfaceRules::Context::updateXZ(int32_t x, int32_t z) {
    ++this->lastUpdateXZ;
    ++this->lastUpdateY;
    this->blockX = x;
    this->blockZ = z;
    this->surfaceDepth = this->system->getSurfaceDepth(x, z);
}

void SurfaceRules::Context::updateY(int32_t stoneDepthAbove, int32_t stoneDepthBelow, int32_t waterHeight,
                                    int32_t blockX, int32_t blockY, int32_t blockZ) {
    ++this->lastUpdateY;

    this->pos.set(blockX, blockY, blockZ);
    this->isBiomeValueCached = false;

    this->blockY = blockY;
    // first water above this block
    this->waterHeight = waterHeight;
    // amount of stone below this block
    this->stoneDepthBelow = stoneDepthBelow;
    // amount of air above the block
    this->stoneDepthAbove = stoneDepthAbove;
}

int32_t SurfaceRules::Context::getSurfaceSecondaryDepth() {
    if (this->lastSurfaceDepth2Update != this->lastUpdateXZ) {
        this->lastSurfaceDepth2Update = this->lastUpdateXZ;
        this->surfaceSecondaryDepth = this->system->getSurfaceSecondaryDepth(this->blockX, this->blockZ);
    }

    return this->surfaceSecondaryDepth;
}

Biomes SurfaceRules::Context::biome() {
    if (!this->isBiomeValueCached) {
        this->biomeCachedValue = this->biomeManager->getBiome(this->pos);
        this->isBiomeValueCached = true;
    }
    return this->biomeCachedValue;
}

static int32_t blockCoordToSurfaceCell(int32_t coord) {
    return coord >> 4;
}

static int32_t surfaceCellToBlockCoord(int32_t coord) {
    return coord << 4;
}

int32_t SurfaceRules::Context::getMinSurfaceLevel() {
    if (this->lastMinSurfaceLevelUpdate != this->lastUpdateXZ) {
        this->lastMinSurfaceLevelUpdate = this->lastUpdateXZ;
        int32_t cellX = blockCoordToSurfaceCell(this->blockX);
        int32_t cellZ = blockCoordToSurfaceCell(this->blockZ);
        int64_t chunkPos = ChunkPos::asLong(cellX, cellZ);
        if (this->lastPreliminarySurfaceCellOrigin != chunkPos) {
            this->lastPreliminarySurfaceCellOrigin = chunkPos;
            this->preliminarySurfaceCache[0] = this->noiseChunk->preliminarySurfaceLevel(
                surfaceCellToBlockCoord(cellX), surfaceCellToBlockCoord(cellZ));
            this->preliminarySurfaceCache[1] = this->noiseChunk->preliminarySurfaceLevel(
                surfaceCellToBlockCoord(cellX + 1), surfaceCellToBlockCoord(cellZ));
            this->preliminarySurfaceCache[2] = this->noiseChunk->preliminarySurfaceLevel(
                surfaceCellToBlockCoord(cellX), surfaceCellToBlockCoord(cellZ + 1));
            this->preliminarySurfaceCache[3] = this->noiseChunk->preliminarySurfaceLevel(
                surfaceCellToBlockCoord(cellX + 1), surfaceCellToBlockCoord(cellZ + 1));
        }

        int32_t height = Mth::floor(
            Mth::lerp2((double)((float)(this->blockX & 15) / 16.0F), (double)((float)(this->blockZ & 15) / 16.0F),
                       (double)this->preliminarySurfaceCache[0], (double)this->preliminarySurfaceCache[1],
                       (double)this->preliminarySurfaceCache[2], (double)this->preliminarySurfaceCache[3]));
        this->minSurfaceLevel = height + this->surfaceDepth - 8;
    }

    return this->minSurfaceLevel;
}