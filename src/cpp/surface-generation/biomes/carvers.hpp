#pragma once

#include <bitset>
#include <functional>
#include <memory>
#include <set>
#include <vector>

#include "aquifer.hpp"
#include "biome-manager.hpp"
#include "blocks.hpp"
#include "chunk-generator.fwd.hpp"
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
        int widthSmoothness;
        shared_ptr<FloatProvider> horizontalRadiusFactor;
        float verticalRadiusDefaultFactor;
        float verticalRadiusCenterFactor;

        CanyonShapeConfiguration(shared_ptr<FloatProvider> distanceFactor, shared_ptr<FloatProvider> thickness,
                                 int widthSmoothness, shared_ptr<FloatProvider> horizontalRadiusFactor,
                                 float verticalRadiusDefaultFactor, float verticalRadiusCenterFactor)
            : widthSmoothness(widthSmoothness), horizontalRadiusFactor(horizontalRadiusFactor),
              verticalRadiusDefaultFactor(verticalRadiusDefaultFactor),
              verticalRadiusCenterFactor(verticalRadiusCenterFactor), distanceFactor(distanceFactor),
              thickness(thickness) {
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
};

class CaveWorldCarver : public WorldCarver {
    //
};

class CanyonWorldCarver : public WorldCarver {
    //
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