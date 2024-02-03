#pragma once

#include "../../utils/hash_sha256.h"
#include "../../utils/memory-debug.hpp"
#include "biomes.hpp"
#include "pos.hpp"
#include "random.hpp"
#include <array>
#include <cstdint>
#include <limits>

using namespace std;

class WorldGenRegion;

class BiomeManager {
private:
    static const int32_t ZOOM_BITS = 2;
    static const int32_t ZOOM = 4;
    static const int32_t ZOOM_MASK = 3;

    weak_ptr<WorldGenRegion> noiseBiomeSource;
    int64_t biomeZoomSeed;

public:
    static const int32_t CHUNK_CENTER_QUART = QuartPos::fromBlock(8);

    BiomeManager(shared_ptr<WorldGenRegion> noiseBiomeSource, int64_t biomeZoomSeed);

    ~BiomeManager();

    static int64_t obfuscateSeed(int64_t seed);

    // what's going on here?
    Biomes getBiome(BlockPos blockPos);

    Biomes getNoiseBiomeAtPosition(double x, double y, double z);
    Biomes getNoiseBiomeAtPosition(BlockPos blockPos);
    Biomes getNoiseBiomeAtQuart(int32_t x, int32_t y, int32_t z);

    static double getFiddledDistance(int64_t seed, int32_t x, int32_t y, int32_t z, double xt, double yt, double zt);
private:
    static double getFiddle(int64_t value);
};