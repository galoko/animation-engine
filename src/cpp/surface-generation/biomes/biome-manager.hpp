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

class NoiseBiomeSource {
public:
    virtual Biomes getNoiseBiome(int32_t x, int32_t y, int32_t z) = 0;
    virtual ~NoiseBiomeSource() {
        objectFreed("NoiseBiomeSource");
    }
};

class BiomeManager {
private:
    static const int32_t ZOOM_BITS = 2;
    static const int32_t ZOOM = 4;
    static const int32_t ZOOM_MASK = 3;

    weak_ptr<NoiseBiomeSource> noiseBiomeSource;
    int64_t biomeZoomSeed;

public:
    static const int32_t CHUNK_CENTER_QUART = QuartPos::fromBlock(8);

    BiomeManager(shared_ptr<NoiseBiomeSource> noiseBiomeSource, int64_t biomeZoomSeed)
        : noiseBiomeSource(noiseBiomeSource), biomeZoomSeed(biomeZoomSeed) {
        objectCreated("BiomeManager");
    }

    ~BiomeManager() {
        objectFreed("BiomeManager");
    }

    static int64_t obfuscateSeed(int64_t seed) {
        hash_sha256 hash;
        hash.sha256_init();
        hash.sha256_update((const uint8_t *)&seed, sizeof(seed));
        sha256_type hash_result = hash.sha256_final();

        int64_t obfuscatedSeed;
        memcpy(&obfuscatedSeed, hash_result.data(), sizeof(obfuscatedSeed));

        return obfuscatedSeed;
    }

    // what's going on here?
    Biomes getBiome(BlockPos blockPos) {
        int32_t blockCenterX = blockPos.getX() - BiomeManager::CHUNK_CENTER_QUART;
        int32_t blockCenterY = blockPos.getY() - BiomeManager::CHUNK_CENTER_QUART;
        int32_t blockCenterZ = blockPos.getZ() - BiomeManager::CHUNK_CENTER_QUART;
        int32_t sectionX = blockCenterX >> 2;
        int32_t sectionY = blockCenterY >> 2;
        int32_t sectionZ = blockCenterZ >> 2;
        double xt = (double)(blockCenterX & 3) / 4.0;
        double yt = (double)(blockCenterY & 3) / 4.0;
        double zt = (double)(blockCenterZ & 3) / 4.0;

        int32_t maxDistanceIndex = 0;
        double maxDistance = numeric_limits<double>::infinity();
        for (int32_t i = 0; i < 8; ++i) {
            bool shouldUseCurrentX = (i & 4) == 0;
            bool shouldUseCurrentY = (i & 2) == 0;
            bool shouldUseCurrentZ = (i & 1) == 0;
            int32_t xToUse = shouldUseCurrentX ? sectionX : sectionX + 1;
            int32_t yToUse = shouldUseCurrentY ? sectionY : sectionY + 1;
            int32_t zToUse = shouldUseCurrentZ ? sectionZ : sectionZ + 1;
            double xtToUse = shouldUseCurrentX ? xt : xt - 1.0;
            double ytToUse = shouldUseCurrentY ? yt : yt - 1.0;
            double ztToUse = shouldUseCurrentZ ? zt : zt - 1.0;
            double distance =
                getFiddledDistance(this->biomeZoomSeed, xToUse, yToUse, zToUse, xtToUse, ytToUse, ztToUse);
            if (maxDistance > distance) {
                maxDistanceIndex = i;
                maxDistance = distance;
            }
        }

        int32_t finalX = (maxDistanceIndex & 4) == 0 ? sectionX : sectionX + 1;
        int32_t finalY = (maxDistanceIndex & 2) == 0 ? sectionY : sectionY + 1;
        int32_t finalZ = (maxDistanceIndex & 1) == 0 ? sectionZ : sectionZ + 1;

        return this->noiseBiomeSource.lock()->getNoiseBiome(finalX, finalY, finalZ);
    }

    Biomes getNoiseBiomeAtPosition(double x, double y, double z) {
        int32_t qX = QuartPos::fromBlock(Mth::floor(x));
        int32_t qY = QuartPos::fromBlock(Mth::floor(y));
        int32_t qZ = QuartPos::fromBlock(Mth::floor(z));
        return this->getNoiseBiomeAtQuart(qX, qY, qZ);
    }

    Biomes getNoiseBiomeAtPosition(BlockPos blockPos) {
        int32_t qX = QuartPos::fromBlock(blockPos.getX());
        int32_t qY = QuartPos::fromBlock(blockPos.getY());
        int32_t qZ = QuartPos::fromBlock(blockPos.getZ());
        return this->getNoiseBiomeAtQuart(qX, qY, qZ);
    }

    Biomes getNoiseBiomeAtQuart(int32_t x, int32_t y, int32_t z) {
        return this->noiseBiomeSource.lock()->getNoiseBiome(x, y, z);
    }

    static double getFiddledDistance(int64_t seed, int32_t x, int32_t y, int32_t z, double xt, double yt, double zt) {
        int64_t randValue;

        randValue = LinearCongruentialGenerator::next(seed, (int64_t)x);
        randValue = LinearCongruentialGenerator::next(randValue, (int64_t)y);
        randValue = LinearCongruentialGenerator::next(randValue, (int64_t)z);

        randValue = LinearCongruentialGenerator::next(randValue, (int64_t)x);
        randValue = LinearCongruentialGenerator::next(randValue, (int64_t)y);
        randValue = LinearCongruentialGenerator::next(randValue, (int64_t)z);
        double fx = getFiddle(randValue);

        randValue = LinearCongruentialGenerator::next(randValue, seed);
        double fy = getFiddle(randValue);

        randValue = LinearCongruentialGenerator::next(randValue, seed);
        double fz = getFiddle(randValue);

        return Mth::square(zt + fz) + Mth::square(yt + fy) + Mth::square(xt + fx);
    }

private:
    static double getFiddle(int64_t value) {
        double t = (double)Mth::floorMod((int32_t)(value >> 24), 1024) / 1024.0;
        return (t - 0.5) * 0.9;
    }
};