#pragma once

#include <bitset>
#include <functional>
#include <memory>
#include <vector>


#include "biome-manager.hpp"
#include "blocks.hpp"
#include "chunk-generator.fwd.hpp"
#include "noise-chunk.fwd.hpp"
#include "pos.hpp"
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
                       bool useWaterHeight);
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