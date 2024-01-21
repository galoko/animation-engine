#pragma once

#include <cmath>
#include <stdexcept>

#include "biome-manager.hpp"
#include "biomes.hpp"
#include "chunk-generator.hpp"
#include "chunk-status.hpp"

using namespace std;

class WorldGenRegion : public NoiseBiomeSource, public enable_shared_from_this<WorldGenRegion> {
private:
    weak_ptr<ChunkGenerator> generator;
    vector<shared_ptr<ChunkAccess>> cache;
    ChunkPos firstPos;
    ChunkPos lastPos;
    int32_t size;

public:
    shared_ptr<BiomeManager> biomeManager;

    WorldGenRegion(shared_ptr<ChunkGenerator> generator, vector<shared_ptr<ChunkAccess>> &cache);
    void init(int64_t seed);

    shared_ptr<ChunkAccess> getChunk(int32_t x, int32_t z, const ChunkStatus &status, bool ensureNonNull);
    bool hasChunk(int x, int z);
    Biomes getNoiseBiome(int x, int y, int z);
    Biomes getUncachedNoiseBiome(int32_t x, int32_t y, int32_t z);
};