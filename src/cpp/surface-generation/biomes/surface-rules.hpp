#pragma once

#include <limits>
#include <vector>

#include "noise-chunk.hpp"

using namespace std;

class WorldGenerationContext {
private:
    int32_t minY, height;

public:
    WorldGenerationContext(shared_ptr<ChunkGenerator> chunkGenerator, const LevelHeightAccessor &heightAccessor);
    int32_t getMinGenY() const;
    int32_t getGenDepth() const;
};

class VerticalAnchor;

shared_ptr<VerticalAnchor> makeAbsolute(int32_t value);
shared_ptr<VerticalAnchor> makeAboveBottom(int32_t value);
shared_ptr<VerticalAnchor> makeBelowTop(int32_t value);

class VerticalAnchor {
private:
    static shared_ptr<VerticalAnchor> BOTTOM;
    static shared_ptr<VerticalAnchor> TOP;

protected:
    int32_t value;

    VerticalAnchor(int32_t value) : value(value) {
    }

public:
    virtual int32_t resolveY(const WorldGenerationContext &ctx) = 0;

    static shared_ptr<VerticalAnchor> absolute(int32_t value) {
        return makeAbsolute(value);
    }

    static shared_ptr<VerticalAnchor> aboveBottom(int32_t value) {
        return makeAboveBottom(value);
    }

    static shared_ptr<VerticalAnchor> belowTop(int32_t value) {
        return makeBelowTop(value);
    }

    static shared_ptr<VerticalAnchor> bottom() {
        return BOTTOM;
    }

    static shared_ptr<VerticalAnchor> top() {
        return TOP;
    }
};

enum CaveSurface {
    CEILING = 1,
    FLOOR = -1,
};

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

    // Hole

    class HoleCondition : public LazyXZCondition {
    public:
        HoleCondition(shared_ptr<Context> ctx) : LazyXZCondition(ctx) {
        }

    protected:
        virtual bool compute() {
            return this->context->surfaceDepth <= 0;
        }
    };

    class Hole : public ConditionSource {
    public:
        static shared_ptr<Hole> INSTANCE;

        virtual shared_ptr<Condition> apply(shared_ptr<Context> ctx) {
            return ctx->hole;
        }
    };

    // Steep

    class SteepMaterialCondition : public LazyXZCondition {
    public:
        SteepMaterialCondition(shared_ptr<Context> ctx) : LazyXZCondition(ctx) {
        }

    protected:
        virtual bool compute() {
            int32_t chunkX = this->context->blockX & 15;
            int32_t chunkZ = this->context->blockZ & 15;
            int32_t chunkBeforeZ = std::max(chunkZ - 1, 0);
            int32_t chunkAfterZ = std::min(chunkZ + 1, 15);
            shared_ptr<ChunkAccess> chunkAccess = this->context->chunk;
            int32_t heightBeforeZ = chunkAccess->getHeight(HeightmapTypes::WORLD_SURFACE_WG, chunkX, chunkBeforeZ);
            int32_t heightAfterZ = chunkAccess->getHeight(HeightmapTypes::WORLD_SURFACE_WG, chunkX, chunkAfterZ);
            if (heightAfterZ >= heightBeforeZ + 4) {
                return true;
            } else {
                int32_t chunkBeforeX = std::max(chunkX - 1, 0);
                int32_t chunkAfterX = std::min(chunkX + 1, 15);
                int32_t heightBeforeX = chunkAccess->getHeight(HeightmapTypes::WORLD_SURFACE_WG, chunkBeforeX, chunkZ);
                int32_t heightAfterX = chunkAccess->getHeight(HeightmapTypes::WORLD_SURFACE_WG, chunkAfterX, chunkZ);
                return heightBeforeX >= heightAfterX + 4;
            }
        }
    };

    class Steep : public ConditionSource {
    public:
        static shared_ptr<Steep> INSTANCE;

        virtual shared_ptr<Condition> apply(shared_ptr<Context> ctx) {
            return ctx->steep;
        }
    };

    // Block state rule

    class StateRule : public SurfaceRule {
    public:
        Blocks state;

        StateRule(Blocks state) : state(state) {
        }

        virtual BlockState tryApply(int x, int y, int z) {
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
        TestRule(shared_ptr<Condition> condition, shared_ptr<SurfaceRule> followup) {
        }

        virtual BlockState tryApply(int x, int y, int z) {
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

        virtual BlockState tryApply(int x, int y, int z) {
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

        shared_ptr<Condition> hole = make_shared<HoleCondition>(this->shared_from_this());
        shared_ptr<Condition> steep = make_shared<SteepMaterialCondition>(this->shared_from_this());
    };

    // consts

    static shared_ptr<ConditionSource> ON_FLOOR;
    static shared_ptr<ConditionSource> UNDER_FLOOR;
    static shared_ptr<ConditionSource> ON_CEILING;
    static shared_ptr<ConditionSource> UNDER_CEILING;

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

    static shared_ptr<ConditionSource> hole() {
        return SurfaceRules::Hole::INSTANCE;
    }

    static shared_ptr<ConditionSource> steep() {
        return SurfaceRules::Steep::INSTANCE;
    }

    static shared_ptr<RuleSource> state(Blocks block) {
        return make_shared<BlockRuleSource>(block);
    }

    static shared_ptr<RuleSource> ifTrue(shared_ptr<ConditionSource> cond, shared_ptr<RuleSource> p_189396_) {
        return make_shared<TestRuleSource>(cond, p_189396_);
    }

    static shared_ptr<ConditionSource> isBiome(const vector<Biomes> biomes) {
        // TODO not implemented
        return nullptr;
    }

    static shared_ptr<ConditionSource> stoneDepthCheck(int offset, bool addSurfaceDepth, bool addSurfaceSecondaryDepth,
                                                       CaveSurface surfaceType) {
        // TODO not implemented
        return nullptr;
    }

    static shared_ptr<ConditionSource> noiseCondition(Noises p_189410_, double p_189411_) {
        // TODO not implemented
        return nullptr;
    }

    static shared_ptr<ConditionSource> noiseCondition(Noises p_189413_, double p_189414_, double p_189415_) {
        // TODO not implemented
        return nullptr;
    }

    static shared_ptr<ConditionSource> _not(shared_ptr<ConditionSource> p_189413_) {
        // TODO not implemented
        return nullptr;
    }

    static shared_ptr<RuleSource> bandlands() {
        // TODO not implemented
        return nullptr;
    }

    static shared_ptr<ConditionSource> temperature() {
        // TODO not implemented
        return nullptr;
    }

    static shared_ptr<ConditionSource> surfaceNoiseAbove(double p_194809_) {
        // TODO not implemented
        return nullptr;
    }

    static shared_ptr<SurfaceRules::ConditionSource> verticalGradient(string p_189404_,
                                                                      shared_ptr<VerticalAnchor> p_189405_,
                                                                      shared_ptr<VerticalAnchor> p_189406_) {
        // TODO not implemented
        return nullptr;
    }

    static shared_ptr<SurfaceRules::ConditionSource> abovePreliminarySurface() {
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
    static const shared_ptr<SurfaceRules::RuleSource> overworld();
    static const shared_ptr<SurfaceRules::RuleSource> nether();
    static const shared_ptr<SurfaceRules::RuleSource> end();
};