#pragma once

#include <limits>
#include <stdexcept>
#include <vector>

#include "../../utils/memory-debug.hpp"
#include "biome-manager.hpp"
#include "noise-chunk.hpp"
#include "noise-data.hpp"
#include "vertical-anchor.hpp"
#include "world-generation-context.hpp"

using namespace std;

enum CaveSurface {
    CEILING = 1,
    FLOOR = -1,
};

class SurfaceSystem;

class SurfaceRules {
public:
    static shared_ptr<VerticalAnchor> makeAbsolute(int32_t value);
    static shared_ptr<VerticalAnchor> makeAboveBottom(int32_t value);
    static shared_ptr<VerticalAnchor> makeBelowTop(int32_t value);

    class Context;

    class SurfaceRule {
    public:
        virtual BlockState tryApply(int32_t x, int32_t y, int32_t z) = 0;

        virtual ~SurfaceRule() {
        }
    };

    class RuleSource {
    public:
        virtual shared_ptr<SurfaceRule> apply(shared_ptr<Context> ctx) = 0;

        virtual ~RuleSource() {
        }
    };

    class Condition {
    public:
        virtual bool test() = 0;

        virtual ~Condition() {
        }
    };

    class LazyCondition : public Condition {
    protected:
        shared_ptr<Context> context;

        void init() {
            this->lastUpdate = this->getContextLastUpdate() - 1L;
        }

    private:
        int64_t lastUpdate;
        bool result;

    public:
        LazyCondition(shared_ptr<Context> ctx) : context(ctx) {
        }

        bool test() {
            int64_t i = this->getContextLastUpdate();
            if (i == this->lastUpdate) {
                return this->result;
            } else {
                this->lastUpdate = i;
                this->result = this->compute();
                return this->result;
            }
        }

    protected:
        virtual int64_t getContextLastUpdate() = 0;

        virtual bool compute() = 0;
    };

    class LazyYCondition : public LazyCondition {
    public:
        LazyYCondition(shared_ptr<Context> ctx) : LazyCondition(ctx) {
            this->init();
        }

    protected:
        int64_t getContextLastUpdate() {
            return this->context->lastUpdateY;
        }
    };

    class LazyXZCondition : public LazyCondition {
    public:
        LazyXZCondition(shared_ptr<Context> ctx) : LazyCondition(ctx) {
            this->init();
        }

    protected:
        int64_t getContextLastUpdate() {
            return this->context->lastUpdateXZ;
        }
    };

    class ConditionSource {
    public:
        virtual shared_ptr<Condition> apply(shared_ptr<Context> ctx) = 0;

        virtual ~ConditionSource() {
        }
    };

    // Y condition

    class YConditionSource;

    class YCondition : public LazyYCondition {
    private:
        shared_ptr<YConditionSource> conditionSource;

    public:
        YCondition(shared_ptr<Context> ctx, shared_ptr<YConditionSource> conditionSource)
            : LazyYCondition(ctx), conditionSource(conditionSource) {
        }

        virtual ~YCondition() {
        }

    protected:
        virtual bool compute() {
            int32_t y = this->context->blockY;
            if (this->conditionSource->addStoneDepth) {
                y += this->context->stoneDepthAbove;
            }

            int32_t yToCheck = this->conditionSource->anchor->resolveY(this->context->context) +
                               this->context->surfaceDepth * this->conditionSource->surfaceDepthMultiplier;

            return y >= yToCheck;
        }
    };

    class YConditionSource : public ConditionSource, public enable_shared_from_this<YConditionSource> {
    public:
        shared_ptr<VerticalAnchor> anchor;
        int32_t surfaceDepthMultiplier;
        bool addStoneDepth;

        YConditionSource(shared_ptr<VerticalAnchor> anchor, int32_t surfaceDepthMultiplier, bool addStoneDepth)
            : ConditionSource(), anchor(anchor), surfaceDepthMultiplier(surfaceDepthMultiplier),
              addStoneDepth(addStoneDepth) {
        }

        virtual shared_ptr<Condition> apply(shared_ptr<Context> ctx) {
            return make_shared<YCondition>(ctx, this->shared_from_this());
        }
    };

    // Water condition

    class WaterConditionSource;

    class WaterCondition : public LazyYCondition {
    private:
        shared_ptr<WaterConditionSource> conditionSource;

    public:
        WaterCondition(shared_ptr<Context> ctx, shared_ptr<WaterConditionSource> conditionSource)
            : LazyYCondition(ctx), conditionSource(conditionSource) {
        }

    protected:
        virtual bool compute() {
            if (this->context->waterHeight == numeric_limits<int32_t>::lowest()) {
                return true;
            }

            int32_t y = this->context->blockY;
            if (this->conditionSource->addStoneDepth) {
                y += this->context->stoneDepthAbove;
            }

            int32_t yToCheck = this->context->waterHeight +
                               this->context->surfaceDepth * this->conditionSource->surfaceDepthMultiplier +
                               this->conditionSource->offset;

            return y >= yToCheck;
        }
    };

    class WaterConditionSource : public ConditionSource, public enable_shared_from_this<WaterConditionSource> {
    public:
        int32_t offset, surfaceDepthMultiplier;
        bool addStoneDepth;

        WaterConditionSource(int32_t offset, int32_t surfaceDepthMultiplier, bool addStoneDepth)
            : ConditionSource(), offset(offset), surfaceDepthMultiplier(surfaceDepthMultiplier),
              addStoneDepth(addStoneDepth) {
        }

        virtual shared_ptr<Condition> apply(shared_ptr<Context> ctx) {
            return make_shared<WaterCondition>(ctx, this->shared_from_this());
        }
    };

    class StoneDepthCheck;

    class StoneDepthCondition : public LazyYCondition {
    private:
        shared_ptr<StoneDepthCheck> conditionSource;
        bool isCeiling;

    public:
        StoneDepthCondition(shared_ptr<Context> ctx, shared_ptr<StoneDepthCheck> conditionSource, bool isCeiling)
            : LazyYCondition(ctx), conditionSource(conditionSource), isCeiling(isCeiling) {
        }

    protected:
        virtual bool compute() {
            return (isCeiling ? this->context->stoneDepthBelow : this->context->stoneDepthAbove) <=
                   1 + this->conditionSource->offset +
                       (this->conditionSource->addSurfaceDepth ? this->context->surfaceDepth : 0) +
                       (this->conditionSource->addSurfaceSecondaryDepth ? this->context->getSurfaceSecondaryDepth()
                                                                        : 0);
        }
    };

    class StoneDepthCheck : public ConditionSource, public enable_shared_from_this<StoneDepthCheck> {
    public:
        int32_t offset;
        bool addSurfaceDepth;
        bool addSurfaceSecondaryDepth;
        CaveSurface surfaceType;

        StoneDepthCheck(int32_t offset, bool addSurfaceDepth, bool addSurfaceSecondaryDepth, CaveSurface surfaceType)
            : offset(offset), addSurfaceDepth(addSurfaceDepth), addSurfaceSecondaryDepth(addSurfaceSecondaryDepth),
              surfaceType(surfaceType) {
        }

        virtual shared_ptr<Condition> apply(shared_ptr<Context> ctx) {
            bool isCeiling = this->surfaceType == CaveSurface::CEILING;

            return make_shared<StoneDepthCondition>(ctx, this->shared_from_this(), isCeiling);
        }
    };

    class BiomeConditionSource;

    class BiomeCondition : public LazyYCondition {
    private:
        shared_ptr<BiomeConditionSource> conditionSource;

    public:
        BiomeCondition(shared_ptr<Context> ctx, shared_ptr<BiomeConditionSource> conditionSource)
            : LazyYCondition(ctx), conditionSource(conditionSource) {
            //
        }

    protected:
        bool compute() {
            return this->conditionSource->biomes.contains(this->context->biome());
        }
    };

    class BiomeConditionSource : public ConditionSource, public enable_shared_from_this<BiomeConditionSource> {
    public:
        const set<Biomes> biomes;

        BiomeConditionSource(const vector<Biomes> biomes) : biomes(biomes.begin(), biomes.end()) {
        }

        virtual shared_ptr<Condition> apply(shared_ptr<Context> ctx) {
            return make_shared<BiomeCondition>(ctx, this->shared_from_this());
        }
    };

    class AbovePreliminarySurfaceCondition : public SurfaceRules::Condition {
    private:
        shared_ptr<Context> ctx;

    public:
        AbovePreliminarySurfaceCondition(shared_ptr<Context> ctx) : ctx(ctx) {
        }

        virtual bool test() {
            return this->ctx->blockY >= this->ctx->getMinSurfaceLevel();
        }
    };

    class AbovePreliminarySurface : public ConditionSource {
    public:
        static shared_ptr<AbovePreliminarySurface> INSTANCE;

        shared_ptr<SurfaceRules::Condition> apply(shared_ptr<Context> ctx) {
            return ctx->abovePreliminarySurface;
        }
    };

    // Block state rule

    class StateRule : public SurfaceRule {
    public:
        Blocks state;

        StateRule(Blocks state) : state(state) {
        }

        virtual BlockState tryApply(int32_t x, int32_t y, int32_t z) {
            return this->state;
        }
    };

    class BlockRuleSource : public RuleSource {
    private:
        shared_ptr<StateRule> rule;

    public:
        BlockRuleSource(BlockState block) {
            this->rule = make_shared<StateRule>(block);
        }

        virtual shared_ptr<SurfaceRule> apply(shared_ptr<Context> ctx) {
            return this->rule;
        }
    };

    // Test

    class TestRule : public SurfaceRule {
    private:
        shared_ptr<Condition> condition;
        shared_ptr<SurfaceRule> followup;

    public:
        TestRule(shared_ptr<Condition> condition, shared_ptr<SurfaceRule> followup)
            : condition(condition), followup(followup) {
        }

        virtual BlockState tryApply(int32_t x, int32_t y, int32_t z) {
            return !this->condition->test() ? Blocks::NULL_BLOCK : this->followup->tryApply(x, y, z);
        }
    };

    class TestRuleSource : public RuleSource {
    private:
        shared_ptr<ConditionSource> ifTrue;
        shared_ptr<RuleSource> thenRun;

    public:
        TestRuleSource(shared_ptr<ConditionSource> ifTrue, shared_ptr<RuleSource> thenRun)
            : ifTrue(ifTrue), thenRun(thenRun) {
        }

        shared_ptr<SurfaceRule> apply(shared_ptr<Context> ctx) {
            return make_shared<TestRule>(this->ifTrue->apply(ctx), this->thenRun->apply(ctx));
        }
    };

    // Rules

    // tries all rules, first one that gives off a block - breaks the loop
    // so it's sorta like OR condition
    class SequenceRule : public SurfaceRule {
        vector<shared_ptr<SurfaceRule>> rules;

    public:
        SequenceRule(const vector<shared_ptr<SurfaceRule>> &rules) : rules(rules) {
        }

        virtual BlockState tryApply(int32_t x, int32_t y, int32_t z) {
            for (shared_ptr<SurfaceRule> surfaceRule : this->rules) {
                BlockState blockstate = surfaceRule->tryApply(x, y, z);
                if (blockstate != Blocks::NULL_BLOCK) {
                    return blockstate;
                }
            }

            return Blocks::NULL_BLOCK;
        }
    };

    class SequenceRuleSource : public RuleSource {
    private:
        vector<shared_ptr<RuleSource>> sequence;

    public:
        SequenceRuleSource(const vector<shared_ptr<RuleSource>> &sequence) : sequence(sequence) {
        }

        shared_ptr<SurfaceRule> apply(shared_ptr<Context> ctx) {
            if (this->sequence.size() == 1) {
                return this->sequence[0]->apply(ctx);
            } else {
                vector<shared_ptr<SurfaceRule>> builder;

                for (shared_ptr<RuleSource> ruleSource : this->sequence) {
                    builder.push_back(ruleSource->apply(ctx));
                }

                return make_shared<SequenceRule>(builder);
            }
        }
    };

    // Context
    class Context : public enable_shared_from_this<Context> {
    private:
        const static int32_t HOW_FAR_BELOW_PRELIMINARY_SURFACE_LEVEL_TO_BUILD_SURFACE = 8;
        const static int32_t SURFACE_CELL_BITS = 4;
        const static int32_t SURFACE_CELL_SIZE = 16;
        const static int32_t SURFACE_CELL_MASK = 15;

        bool isBiomeValueCached = false;
        Biomes biomeCachedValue = Biomes::NULL_BIOME;
        MutableBlockPos pos;

    public:
        int64_t lastUpdateY = -9223372036854775807L;
        int64_t lastUpdateXZ = -9223372036854775807L;

        int32_t blockY;
        int32_t waterHeight;
        int32_t stoneDepthBelow;
        int32_t stoneDepthAbove;

        int32_t blockX;
        int32_t blockZ;
        int32_t surfaceDepth;

        WorldGenerationContext context;

        shared_ptr<ChunkAccess> chunk;
        shared_ptr<NoiseChunk> noiseChunk;

        shared_ptr<SurfaceSystem> system;
        shared_ptr<BiomeManager> biomeManager;

        int64_t lastSurfaceDepth2Update = this->lastUpdateXZ - 1L;
        int32_t surfaceSecondaryDepth;

        int64_t lastMinSurfaceLevelUpdate = this->lastUpdateXZ - 1L;
        int32_t minSurfaceLevel;

        int64_t lastPreliminarySurfaceCellOrigin = std::numeric_limits<int64_t>::max();
        int32_t preliminarySurfaceCache[4];

        shared_ptr<SurfaceRules::Condition> abovePreliminarySurface;

        Context(shared_ptr<SurfaceSystem> system, shared_ptr<ChunkAccess> chunk, shared_ptr<NoiseChunk> noiseChunk,
                shared_ptr<BiomeManager> biomeManager, WorldGenerationContext context)
            : context(context), chunk(chunk), noiseChunk(noiseChunk), system(system), biomeManager(biomeManager) {
            objectCreated("Context");
        }

        ~Context() {
            objectFreed("Context");
        }

        void init() {
            this->abovePreliminarySurface =
                make_shared<SurfaceRules::AbovePreliminarySurfaceCondition>(this->shared_from_this());
        }

        void free() {
            this->abovePreliminarySurface = nullptr;
        }

        void updateXZ(int32_t x, int32_t z);
        void updateY(int32_t stoneDepthAbove, int32_t stoneDepthBelow, int32_t waterHeight, int32_t blockX,
                     int32_t blockY, int32_t blockZ);

        int32_t getSurfaceSecondaryDepth();

        Biomes biome();

        int32_t getMinSurfaceLevel();
    };

    // consts

    static shared_ptr<ConditionSource> ON_FLOOR;
    static shared_ptr<ConditionSource> UNDER_FLOOR;
    static shared_ptr<ConditionSource> ON_CEILING;
    static shared_ptr<ConditionSource> UNDER_CEILING;

    static void initialize();
    static void finalize();

    // constructor helpers

    static shared_ptr<ConditionSource> yBlockCheck(shared_ptr<VerticalAnchor> anchor, int32_t surfaceDepthMultiplier) {
        return make_shared<YConditionSource>(anchor, surfaceDepthMultiplier, false);
    }

    static shared_ptr<ConditionSource> yStartCheck(shared_ptr<VerticalAnchor> anchor, int32_t surfaceDepthMultiplier) {
        return make_shared<YConditionSource>(anchor, surfaceDepthMultiplier, true);
    }

    static shared_ptr<ConditionSource> waterBlockCheck(int32_t offset, int32_t surfaceDepthMultiplier) {
        return make_shared<WaterConditionSource>(offset, surfaceDepthMultiplier, false);
    }

    static shared_ptr<ConditionSource> waterStartCheck(int32_t offset, int32_t surfaceDepthMultiplier) {
        return make_shared<WaterConditionSource>(offset, surfaceDepthMultiplier, true);
    }

    static shared_ptr<RuleSource> state(Blocks block) {
        return make_shared<BlockRuleSource>(block);
    }

    static shared_ptr<RuleSource> ifTrue(shared_ptr<ConditionSource> cond, shared_ptr<RuleSource> thenRun) {
        return make_shared<TestRuleSource>(cond, thenRun);
    }

    static shared_ptr<ConditionSource> stoneDepthCheck(int32_t offset, bool addSurfaceDepth,
                                                       bool addSurfaceSecondaryDepth, CaveSurface surfaceType) {
        return make_shared<StoneDepthCheck>(offset, addSurfaceDepth, addSurfaceSecondaryDepth, surfaceType);
    }

    static shared_ptr<ConditionSource> isBiome(const vector<Biomes> biomes) {
        return make_shared<BiomeConditionSource>(biomes);
    }

    static shared_ptr<SurfaceRules::ConditionSource> abovePreliminarySurface() {
        return SurfaceRules::AbovePreliminarySurface::INSTANCE;
    }

    static shared_ptr<SurfaceRules::ConditionSource> verticalGradient(string name, shared_ptr<VerticalAnchor> p_189405_,
                                                                      shared_ptr<VerticalAnchor> p_189406_) {
        // TODO not implemented
        return nullptr;
    }

    static shared_ptr<RuleSource> sequence(const vector<shared_ptr<RuleSource>> &rules) {
        if (rules.size() == 0) {
            throw std::invalid_argument("Need at least 1 rule for a sequence");
        } else {
            return make_shared<SequenceRuleSource>(rules);
        }
    }
};

// TODO
class SurfaceRulesData {
    static shared_ptr<SurfaceRules::RuleSource> AIR;
    static shared_ptr<SurfaceRules::RuleSource> BEDROCK;
    static shared_ptr<SurfaceRules::RuleSource> WHITE_TERRACOTTA;
    static shared_ptr<SurfaceRules::RuleSource> ORANGE_TERRACOTTA;
    static shared_ptr<SurfaceRules::RuleSource> TERRACOTTA;
    static shared_ptr<SurfaceRules::RuleSource> RED_SAND;
    static shared_ptr<SurfaceRules::RuleSource> RED_SANDSTONE;
    static shared_ptr<SurfaceRules::RuleSource> STONE;
    static shared_ptr<SurfaceRules::RuleSource> DEEPSLATE;
    static shared_ptr<SurfaceRules::RuleSource> DIRT;
    static shared_ptr<SurfaceRules::RuleSource> PODZOL;
    static shared_ptr<SurfaceRules::RuleSource> COARSE_DIRT;
    static shared_ptr<SurfaceRules::RuleSource> MYCELIUM;
    static shared_ptr<SurfaceRules::RuleSource> GRASS_BLOCK;
    static shared_ptr<SurfaceRules::RuleSource> CALCITE;
    static shared_ptr<SurfaceRules::RuleSource> GRAVEL;
    static shared_ptr<SurfaceRules::RuleSource> SAND;
    static shared_ptr<SurfaceRules::RuleSource> SANDSTONE;
    static shared_ptr<SurfaceRules::RuleSource> PACKED_ICE;
    static shared_ptr<SurfaceRules::RuleSource> SNOW_BLOCK;
    static shared_ptr<SurfaceRules::RuleSource> POWDER_SNOW;
    static shared_ptr<SurfaceRules::RuleSource> ICE;
    static shared_ptr<SurfaceRules::RuleSource> WATER;
    static shared_ptr<SurfaceRules::RuleSource> LAVA;
    static shared_ptr<SurfaceRules::RuleSource> NETHERRACK;
    static shared_ptr<SurfaceRules::RuleSource> SOUL_SAND;
    static shared_ptr<SurfaceRules::RuleSource> SOUL_SOIL;
    static shared_ptr<SurfaceRules::RuleSource> BASALT;
    static shared_ptr<SurfaceRules::RuleSource> BLACKSTONE;
    static shared_ptr<SurfaceRules::RuleSource> WARPED_WART_BLOCK;
    static shared_ptr<SurfaceRules::RuleSource> WARPED_NYLIUM;
    static shared_ptr<SurfaceRules::RuleSource> NETHER_WART_BLOCK;
    static shared_ptr<SurfaceRules::RuleSource> CRIMSON_NYLIUM;
    static shared_ptr<SurfaceRules::RuleSource> ENDSTONE;

public:
    static void initialize();
    static void finalize();

    static const shared_ptr<SurfaceRules::RuleSource> overworld();
    static const shared_ptr<SurfaceRules::RuleSource> nether();
    static const shared_ptr<SurfaceRules::RuleSource> end();
};