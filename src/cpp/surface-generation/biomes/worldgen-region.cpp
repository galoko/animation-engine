#include "worldgen-region.hpp"

WorldGenRegion::WorldGenRegion(shared_ptr<ChunkGenerator> generator, vector<shared_ptr<ChunkAccess>>& cache)
    : generator(generator), cache(cache), firstPos(cache[0]->getPos()), lastPos(cache[cache.size() - 1]->getPos()) {
    int size = Mth::floor(sqrt((double)cache.size()));
    this->size = size;
    objectCreated("NoiseBiomeSource");
}


void WorldGenRegion::init(int64_t seed) {
    this->biomeManager = make_shared<BiomeManager>(this->shared_from_this(), BiomeManager::obfuscateSeed(seed));
}

shared_ptr<ChunkAccess> WorldGenRegion::getChunk(int32_t x, int32_t z, const ChunkStatus& status, bool ensureNonNull) {
    shared_ptr<ChunkAccess> chunkAccess;
    if (this->hasChunk(x, z)) {
        int shiftedX = x - this->firstPos.x;
        int shiftedZ = z - this->firstPos.z;
        chunkAccess = this->cache[shiftedX + shiftedZ * this->size];
        if (chunkAccess->getStatus()->isOrAfter(status)) {
            return chunkAccess;
        }
    }
    else {
        chunkAccess = nullptr;
    }

    if (!ensureNonNull) {
        return nullptr;
    }
    else {
        if (chunkAccess != nullptr) {
            throw runtime_error("Chunk is not of correct status");
        }
        else {
            throw runtime_error("We are asking a region for a chunk out of bound");
        }
    }
}

bool WorldGenRegion::hasChunk(int x, int z) {
    return x >= this->firstPos.x && x <= this->lastPos.x && z >= this->firstPos.z && z <= this->lastPos.z;
}

Biomes WorldGenRegion::getNoiseBiome(int x, int y, int z) {
    shared_ptr<ChunkAccess> chunkAccess =
        this->getChunk(QuartPos::toSection(x), QuartPos::toSection(z), ChunkStatus::BIOMES, false);
    return chunkAccess != nullptr ? chunkAccess->getNoiseBiome(x, y, z) : this->getUncachedNoiseBiome(x, y, z);
}

Biomes WorldGenRegion::getUncachedNoiseBiome(int32_t x, int32_t y, int32_t z) {
    return this->generator->getNoiseBiome(x, y, z);
}