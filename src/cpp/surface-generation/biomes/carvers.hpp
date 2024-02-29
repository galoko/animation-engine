#pragma once

#define _USE_MATH_DEFINES

#include <bitset>
#include <functional>
#include <math.h>
#include <memory>
#include <set>
#include <vector>

#include "aquifer.hpp"
#include "biome-manager.hpp"
#include "blocks.hpp"
#include "chunk-generator.fwd.hpp"
#include "chunks.fwd.hpp"
#include "features.hpp"
#include "noise-chunk.fwd.hpp"
#include "pos.hpp"
#include "providers.hpp"
#include "vertical-anchor.hpp"
#include "world-generation-context.hpp"

using namespace std;

namespace GenerationStep {
    enum Carving {
        AIR,
        LIQUID
    };

    enum Decoration {
        RAW_GENERATION,
        LAKES,
        LOCAL_MODIFICATIONS,
        UNDERGROUND_STRUCTURES,
        SURFACE_STRUCTURES,
        STRONGHOLDS,
        UNDERGROUND_ORES,
        UNDERGROUND_DECORATION,
        FLUID_SPRINGS,
        VEGETAL_DECORATION,
        TOP_LAYER_MODIFICATION
    };
}; // namespace GenerationStep

class CarvingContext : public WorldGenerationContext {
private:
    shared_ptr<ChunkGenerator> generator;
    shared_ptr<NoiseChunk> noiseChunk;

public:
    CarvingContext(shared_ptr<ChunkGenerator> chunkGenerator, const LevelHeightAccessor &heightAccessor,
                   shared_ptr<NoiseChunk> noiseChunk);
    Blocks topMaterial(shared_ptr<BiomeManager> biomeManager, shared_ptr<ChunkAccess> chunk, BlockPos blockPos,
                       bool useWaterHeight) const;
};

class CarvingMask {
private:
    int32_t minY;
    vector<bool> mask;

public:
    CarvingMask(int32_t height, int32_t minY) : minY(minY), mask(256 * height) {
    }

private:
    int32_t getIndex(int32_t x, int32_t y, int32_t z) {
        return (x & 15) | ((z & 15) << 4) | ((y - this->minY) << 8);
    }

public:
    void set(int32_t x, int32_t y, int32_t z) {
        this->mask[this->getIndex(x, y, z)] = true;
    }

    bool get(int32_t x, int32_t y, int32_t z) {
        return this->mask[this->getIndex(x, y, z)];
    }

    vector<BlockPos> stream(ChunkPos chunkPos) {
        vector<BlockPos> result;
        for (int32_t coord = 0; coord < this->mask.size(); coord++) {
            int32_t x = coord & 15;
            int32_t y = coord >> 4 & 15;
            int32_t z = coord >> 8;
            BlockPos blockPos = chunkPos.getBlockAt(x, z + this->minY, y);
            result.push_back(blockPos);
        }
        return result;
    }
};

// carver config

class CarverConfiguration : public ProbabilityFeatureConfiguration {
public:
    shared_ptr<HeightProvider> y;
    shared_ptr<FloatProvider> yScale;
    shared_ptr<VerticalAnchor> lavaLevel;

    CarverConfiguration(float probability, shared_ptr<HeightProvider> y, shared_ptr<FloatProvider> yScale,
                        shared_ptr<VerticalAnchor> lavaLevel)
        : ProbabilityFeatureConfiguration(probability), y(y), yScale(yScale), lavaLevel(lavaLevel) {
    }
};

class CaveCarverConfiguration : public CarverConfiguration {
public:
    shared_ptr<FloatProvider> horizontalRadiusMultiplier;
    shared_ptr<FloatProvider> verticalRadiusMultiplier;
    shared_ptr<FloatProvider> floorLevel;

    CaveCarverConfiguration(float probability, shared_ptr<HeightProvider> y, shared_ptr<FloatProvider> yScale,
                            shared_ptr<VerticalAnchor> lavaLevel, shared_ptr<FloatProvider> horizontalRadiusMultiplier,
                            shared_ptr<FloatProvider> verticalRadiusMultiplier, shared_ptr<FloatProvider> floorLevel)
        : CarverConfiguration(probability, y, yScale, lavaLevel),
          horizontalRadiusMultiplier(horizontalRadiusMultiplier), verticalRadiusMultiplier(verticalRadiusMultiplier),
          floorLevel(floorLevel) {
    }

    CaveCarverConfiguration(float probability, shared_ptr<HeightProvider> y, shared_ptr<FloatProvider> yScale,
                            shared_ptr<VerticalAnchor> lavaLevel, bool unused,
                            shared_ptr<FloatProvider> horizontalRadiusMultiplier,
                            shared_ptr<FloatProvider> verticalRadiusMultiplier, shared_ptr<FloatProvider> floorLevel)
        : CaveCarverConfiguration(probability, y, yScale, lavaLevel, horizontalRadiusMultiplier,
                                  verticalRadiusMultiplier, floorLevel) {
    }

    CaveCarverConfiguration(shared_ptr<CarverConfiguration> config,
                            shared_ptr<FloatProvider> horizontalRadiusMultiplier,
                            shared_ptr<FloatProvider> verticalRadiusMultiplier, shared_ptr<FloatProvider> floorLevel)
        : CaveCarverConfiguration(config->probability, config->y, config->yScale, config->lavaLevel,
                                  horizontalRadiusMultiplier, verticalRadiusMultiplier, floorLevel) {
    }
};

class CanyonCarverConfiguration : public CarverConfiguration {
public:
    class CanyonShapeConfiguration {
    public:
        shared_ptr<FloatProvider> distanceFactor;
        shared_ptr<FloatProvider> thickness;
        int32_t widthSmoothness;
        shared_ptr<FloatProvider> horizontalRadiusFactor;
        float verticalRadiusDefaultFactor;
        float verticalRadiusCenterFactor;

        CanyonShapeConfiguration(shared_ptr<FloatProvider> distanceFactor, shared_ptr<FloatProvider> thickness,
                                 int32_t widthSmoothness, shared_ptr<FloatProvider> horizontalRadiusFactor,
                                 float verticalRadiusDefaultFactor, float verticalRadiusCenterFactor)
            : distanceFactor(distanceFactor), thickness(thickness), widthSmoothness(widthSmoothness),
              horizontalRadiusFactor(horizontalRadiusFactor), verticalRadiusDefaultFactor(verticalRadiusDefaultFactor),
              verticalRadiusCenterFactor(verticalRadiusCenterFactor) {
        }
    };
    shared_ptr<FloatProvider> verticalRotation;
    shared_ptr<CanyonCarverConfiguration::CanyonShapeConfiguration> shape;

    CanyonCarverConfiguration(float probability, shared_ptr<HeightProvider> y, shared_ptr<FloatProvider> yScale,
                              shared_ptr<VerticalAnchor> lavaLevel, shared_ptr<FloatProvider> verticalRotation,
                              shared_ptr<CanyonCarverConfiguration::CanyonShapeConfiguration> shape)
        : CarverConfiguration(probability, y, yScale, lavaLevel), verticalRotation(verticalRotation), shape(shape) {
    }

    CanyonCarverConfiguration(shared_ptr<CarverConfiguration> config, shared_ptr<FloatProvider> verticalRotation,
                              shared_ptr<CanyonCarverConfiguration::CanyonShapeConfiguration> shape)
        : CanyonCarverConfiguration(config->probability, config->y, config->yScale, config->lavaLevel, verticalRotation,
                                    shape) {
    }
};

class ConfiguredWorldCarver;
class CarvingContext;

// carvers

using CarveSkipChecker = std::function<bool(CarvingContext &, double, double, double, int32_t)>;

class WorldCarver : public enable_shared_from_this<WorldCarver> {
protected:
    set<Blocks> replaceableBlocks = {Blocks::WATER,
                                     Blocks::STONE,
                                     Blocks::GRANITE,
                                     Blocks::DIORITE,
                                     Blocks::ANDESITE,
                                     Blocks::DIRT,
                                     Blocks::COARSE_DIRT,
                                     Blocks::PODZOL,
                                     Blocks::GRASS_BLOCK,
                                     Blocks::TERRACOTTA,
                                     Blocks::WHITE_TERRACOTTA,
                                     Blocks::ORANGE_TERRACOTTA,
                                     Blocks::MAGENTA_TERRACOTTA,
                                     Blocks::LIGHT_BLUE_TERRACOTTA,
                                     Blocks::YELLOW_TERRACOTTA,
                                     Blocks::LIME_TERRACOTTA,
                                     Blocks::PINK_TERRACOTTA,
                                     Blocks::GRAY_TERRACOTTA,
                                     Blocks::LIGHT_GRAY_TERRACOTTA,
                                     Blocks::CYAN_TERRACOTTA,
                                     Blocks::PURPLE_TERRACOTTA,
                                     Blocks::BLUE_TERRACOTTA,
                                     Blocks::BROWN_TERRACOTTA,
                                     Blocks::GREEN_TERRACOTTA,
                                     Blocks::RED_TERRACOTTA,
                                     Blocks::BLACK_TERRACOTTA,
                                     Blocks::SANDSTONE,
                                     Blocks::RED_SANDSTONE,
                                     Blocks::MYCELIUM,
                                     Blocks::SNOW,
                                     Blocks::PACKED_ICE,
                                     Blocks::DEEPSLATE,
                                     Blocks::CALCITE,
                                     Blocks::SAND,
                                     Blocks::RED_SAND,
                                     Blocks::GRAVEL,
                                     Blocks::TUFF,
                                     Blocks::GRANITE,
                                     Blocks::IRON_ORE,
                                     Blocks::DEEPSLATE_IRON_ORE,
                                     Blocks::RAW_IRON_BLOCK,
                                     Blocks::COPPER_ORE,
                                     Blocks::DEEPSLATE_COPPER_ORE,
                                     Blocks::RAW_COPPER_BLOCK};

public:
    static shared_ptr<WorldCarver> CAVE;
    static shared_ptr<WorldCarver> CANYON;

    static void init();
    static void free();

    shared_ptr<ConfiguredWorldCarver> configured(shared_ptr<CarverConfiguration> config) {
        return make_shared<ConfiguredWorldCarver>(this->shared_from_this(), config);
    }

    int32_t getRange() {
        return 4;
    }

private:
    BlockState getCarveState(CarvingContext &context, shared_ptr<CarverConfiguration> config, BlockPos blockPos,
                             shared_ptr<Aquifer> aquifer);

protected:
    bool canReplaceBlock(BlockState blockState) {
        return this->replaceableBlocks.contains(blockState);
    }

    bool carveEllipsoid(CarvingContext &context, shared_ptr<CarverConfiguration> config, shared_ptr<ChunkAccess> chunk,
                        shared_ptr<BiomeManager> biomeManager, shared_ptr<Aquifer> aquifer, double ellipseX,
                        double ellipseY, double ellipseZ, double range, double heightRange,
                        shared_ptr<CarvingMask> mask, CarveSkipChecker checker);
    bool carveBlock(CarvingContext &context, shared_ptr<CarverConfiguration> config, shared_ptr<ChunkAccess> chunk,
                    shared_ptr<BiomeManager> biomeManager, shared_ptr<CarvingMask> mask,
                    MutableBlockPos blockPosToCarve, shared_ptr<Aquifer> aquifer, bool *carvedGrass);

    static bool canReach(ChunkPos chunkPos, double ellipseX, double ellipseZ, int32_t ellipseY, int32_t maxY,
                         float thickness) {
        double middleX = (double)chunkPos.getMiddleBlockX();
        double middleZ = (double)chunkPos.getMiddleBlockZ();

        double x = ellipseX - middleX;
        double z = ellipseZ - middleZ;

        double y = (double)(maxY - ellipseY);
        double maxDistanceSq = (double)(thickness + 2.0F + 16.0F);

        return x * x + z * z - y * y <= maxDistanceSq * maxDistanceSq;
    }

public:
    virtual bool carve(CarvingContext &context, shared_ptr<CarverConfiguration> config, shared_ptr<ChunkAccess> chunk,
                       shared_ptr<BiomeManager> biomeManager, shared_ptr<Random> random, shared_ptr<Aquifer> aquifer,
                       ChunkPos startChunkPos, shared_ptr<CarvingMask> mask) = 0;
    virtual bool isStartChunk(shared_ptr<CarverConfiguration> config, shared_ptr<Random> random) = 0;

    virtual ~WorldCarver() {
        //
    }
};

class CaveWorldCarver : public WorldCarver {
public:
    virtual bool isStartChunk(shared_ptr<CarverConfiguration> config, shared_ptr<Random> random) {
        return random->nextFloat() <= config->probability;
    }

    virtual bool carve(CarvingContext &context, shared_ptr<CarverConfiguration> config, shared_ptr<ChunkAccess> chunk,
                       shared_ptr<BiomeManager> biomeManager, shared_ptr<Random> random, shared_ptr<Aquifer> aquifer,
                       ChunkPos startChunkPos, shared_ptr<CarvingMask> mask);

protected:
    int32_t getCaveBound() {
        return 15;
    }

    float getThickness(shared_ptr<Random> random) {
        float thickness = random->nextFloat() * 2.0F + random->nextFloat();
        if (random->nextInt(10) == 0) {
            thickness *= random->nextFloat() * random->nextFloat() * 3.0F + 1.0F;
        }

        return thickness; // 12 max
    }

    double getYScale() {
        return 1.0;
    }

    void createRoom(CarvingContext &context, shared_ptr<CaveCarverConfiguration> config, shared_ptr<ChunkAccess> chunk,
                    shared_ptr<BiomeManager> biomeManager, shared_ptr<Aquifer> aquifer, double ellipseX,
                    double ellipseY, double ellipseZ, float rangeMul, double yScale, shared_ptr<CarvingMask> mask,
                    CarveSkipChecker checker);

    void createTunnel(CarvingContext &context, shared_ptr<CaveCarverConfiguration> config,
                      shared_ptr<ChunkAccess> chunk, shared_ptr<BiomeManager> biomeManager, int64_t seed,
                      shared_ptr<Aquifer> aquifer, double ellipseX, double ellipseY, double ellipseZ,
                      double horizontalRadiusMultiplier, double verticalRadiusMultiplier, float thickness,
                      float horizontalRotation, float verticalRotation, int32_t yFrom, int32_t yTo, double yScale,
                      shared_ptr<CarvingMask> mask, CarveSkipChecker checker);

private:
    static bool shouldSkip(double normalizedX, double normalizedY, double normalizedZ, double floorLevel) {
        if (normalizedY <= floorLevel) {
            return true;
        } else {
            return normalizedX * normalizedX + normalizedY * normalizedY + normalizedZ * normalizedZ >= 1.0;
        }
    }
};

class CanyonWorldCarver : public WorldCarver {
public:
    virtual bool isStartChunk(CanyonCarverConfiguration p_159023_, Random p_159024_) {
        return p_159024_.nextFloat() <= p_159023_.probability;
    }

    virtual bool carve(CarvingContext &context, shared_ptr<CanyonCarverConfiguration> config,
                       shared_ptr<ChunkAccess> chunk, shared_ptr<BiomeManager> biomeManager, shared_ptr<Random> random,
                       shared_ptr<Aquifer> aquifer, ChunkPos startChunkPos, shared_ptr<CarvingMask> mask) {
        int diameter = (this->getRange() * 2 - 1) * 16;

        double blockX = (double)startChunkPos.getBlockX(random->nextInt(16));
        int blockY = config->y->sample(random, context);
        double blockZ = (double)startChunkPos.getBlockZ(random->nextInt(16));

        float horizontalRotation = random->nextFloat() * ((float)M_PI * 2.0F);
        float verticalRotation = config->verticalRotation->sample(random);
        double yScale = (double)config->yScale->sample(random);
        float thickness = config->shape->thickness->sample(random);

        int yFrom = 0;
        int yTo = (int)((float)diameter * config->shape->distanceFactor->sample(random));

        this->doCarve(context, config, chunk, biomeManager, random->nextLong(), aquifer, blockX, (double)blockY, blockZ,
                      thickness, horizontalRotation, verticalRotation, yFrom, yTo, yScale, mask);
        return true;
    }

private:
    void doCarve(CarvingContext context, shared_ptr<CanyonCarverConfiguration> config, shared_ptr<ChunkAccess> chunk,
                 shared_ptr<BiomeManager> biomeManager, long seed, shared_ptr<Aquifer> aquifer, double blockX,
                 double blockY, double blockZ, float thickness, float horizontalRotation, float verticalRotation,
                 int yFrom, int yTo, double yScale, shared_ptr<CarvingMask> mask) {
        shared_ptr<Random> random = make_shared<Random>(seed);
        vector<float> widthFactors = this->initWidthFactors(context, config, random);
        CarveSkipChecker checker = [this, &widthFactors](CarvingContext &_context, double x, double _y, double z,
                                                         int32_t floorLevel) -> bool {
            return this->shouldSkip(_context, widthFactors, x, _y, z, floorLevel);
        };

        float horizontalAngleIncrement = 0.0F;
        float verticalAngleIncrement = 0.0F;
        for (int y = yFrom; y < yTo; ++y) {
            double horizontalRadius = 1.5 + (double)(Mth::sin((float)y * (float)M_PI / (float)yTo) * thickness);
            double verticalRadius = horizontalRadius * yScale;

            horizontalRadius *= (double)config->shape->horizontalRadiusFactor->sample(random);
            verticalRadius = this->updateVerticalRadius(config, random, verticalRadius, (float)yTo, (float)y);

            float verticalCos = Mth::cos(verticalRotation);
            float verticalSin = Mth::sin(verticalRotation);

            blockX += (double)(Mth::cos(horizontalRotation) * verticalCos);
            blockY += (double)verticalSin;
            blockZ += (double)(Mth::sin(horizontalRotation) * verticalCos);

            verticalRotation *= 0.7F;
            verticalRotation += verticalAngleIncrement * 0.05F;
            horizontalRotation += horizontalAngleIncrement * 0.05F;

            verticalAngleIncrement *= 0.8F;
            horizontalAngleIncrement *= 0.5F;

            verticalAngleIncrement += (random->nextFloat() - random->nextFloat()) * random->nextFloat() * 2.0F;
            horizontalAngleIncrement += (random->nextFloat() - random->nextFloat()) * random->nextFloat() * 4.0F;

            if (random->nextInt(4) != 0) {
                if (!canReach(chunk->getPos(), blockX, blockZ, y, yTo, thickness)) {
                    return;
                }

                this->carveEllipsoid(context, config, chunk, biomeManager, aquifer, blockX, blockY, blockZ,
                                     horizontalRadius, verticalRadius, mask, checker);
            }
        }
    }

    vector<float> initWidthFactors(CarvingContext &context, shared_ptr<CanyonCarverConfiguration> config,
                                   shared_ptr<Random> random) {
        int depth = context.getGenDepth();
        vector<float> widthFactors(depth);

        float factor = 1.0F;
        for (int y = 0; y < depth; ++y) {
            if (y == 0 || random->nextInt(config->shape->widthSmoothness) == 0) {
                factor = 1.0F + random->nextFloat() * random->nextFloat();
            }

            widthFactors[y] = factor * factor;
        }

        return widthFactors;
    }

private:
    double updateVerticalRadius(shared_ptr<CanyonCarverConfiguration> config, shared_ptr<Random> random, double range,
                                float yTo, float y) {
        float normalizedVerticalRadius = 1.0F - std::abs(0.5F - y / yTo) * 2.0F;
        float normalizedVerticalRadiusWithFactors =
            config->shape->verticalRadiusDefaultFactor +
            config->shape->verticalRadiusCenterFactor * normalizedVerticalRadius;
        return (double)normalizedVerticalRadiusWithFactors * range * (double)Rnd::randomBetween(random, 0.75F, 1.0F);
    }

    bool shouldSkip(CarvingContext context, vector<float> &widthFactors, double x, double y, double z, int floorLevel) {
        int minY = floorLevel - context.getMinGenY();
        return (x * x + z * z) * (double)widthFactors[minY - 1] + y * y / 6.0 >= 1.0;
    }
};

// Configured

class ConfiguredWorldCarver {
private:
    shared_ptr<WorldCarver> worldCarver;
    shared_ptr<CarverConfiguration> config;

public:
    ConfiguredWorldCarver(shared_ptr<WorldCarver> carver, shared_ptr<CarverConfiguration> config)
        : worldCarver(carver), config(config) {
    }

    bool isStartChunk(shared_ptr<Random> random) {
        return this->worldCarver->isStartChunk(this->config, random);
    }

    bool carve(CarvingContext context, shared_ptr<ChunkAccess> chunk, shared_ptr<BiomeManager> biomeManager,
               shared_ptr<Random> random, shared_ptr<Aquifer> aquifer, ChunkPos neighbourChunkPos,
               shared_ptr<CarvingMask> mask) {
        return this->worldCarver->carve(context, this->config, chunk, biomeManager, random, aquifer, neighbourChunkPos,
                                        mask);
    }
};

// Carvers

class Carvers {
public:
    static shared_ptr<ConfiguredWorldCarver> CAVE;
    static shared_ptr<ConfiguredWorldCarver> CAVE_EXTRA_UNDERGROUND;
    static shared_ptr<ConfiguredWorldCarver> CANYON;

    static void init();
    static void free();
};