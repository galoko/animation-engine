#pragma once

#include <stdint.h>

#include "mth.hpp"

using namespace std;

class BlockPos {
private:
    double x, y, z;

private:
    static constexpr int32_t PACKED_X_LENGTH = 1 + Mth::log2(Mth::smallestEncompassingPowerOfTwo(30000000));
    static constexpr int32_t PACKED_Z_LENGTH = PACKED_X_LENGTH;

public:
    static constexpr int32_t PACKED_Y_LENGTH = 64 - PACKED_X_LENGTH - PACKED_Z_LENGTH;

private:
    static constexpr int64_t PACKED_X_MASK = (1LL << BlockPos::PACKED_X_LENGTH) - 1LL;
    static constexpr int64_t PACKED_Y_MASK = (1LL << BlockPos::PACKED_Y_LENGTH) - 1LL;
    static constexpr int64_t PACKED_Z_MASK = (1LL << BlockPos::PACKED_Z_LENGTH) - 1LL;
    static constexpr int32_t Y_OFFSET = 0;
    static constexpr int32_t Z_OFFSET = BlockPos::PACKED_Y_LENGTH;
    static constexpr int32_t X_OFFSET = BlockPos::PACKED_Y_LENGTH + PACKED_Z_LENGTH;

public:
    BlockPos(double x, double y, double z) : x(x), y(y), z(z) {
    }

    int32_t getX() {
        return this->x;
    }

    int32_t getY() {
        return this->y;
    }

    int32_t getZ() {
        return this->z;
    }

protected:
    BlockPos *setX(int32_t value) {
        this->x = value;
        return this;
    }

    BlockPos *setY(int32_t value) {
        this->y = value;
        return this;
    }

    BlockPos *setZ(int32_t value) {
        this->z = value;
        return this;
    }

public:
    static int32_t getX(int64_t x) {
        return (int32_t)((x << (64 - X_OFFSET - PACKED_X_LENGTH)) >> (64 - PACKED_X_LENGTH));
    }

    static int32_t getY(int64_t y) {
        return (int32_t)((y << (64 - PACKED_Y_LENGTH)) >> (64 - PACKED_Y_LENGTH));
    }

    static int32_t getZ(int64_t z) {
        return (int32_t)((z << (64 - Z_OFFSET - PACKED_Z_LENGTH)) >> (64 - PACKED_Z_LENGTH));
    }

    static int64_t asLong(int32_t x, int32_t y, int32_t z) {
        int64_t result = 0LL;
        result |= ((int64_t)x & PACKED_X_MASK) << X_OFFSET;
        result |= ((int64_t)y & PACKED_Y_MASK) << 0;
        return result | ((int64_t)z & PACKED_Z_MASK) << Z_OFFSET;
    }
};

class SectionPos {
public:
    static int32_t blockToSectionCoord(int32_t coord) {
        return coord >> 4;
    }

    static int32_t sectionToBlockCoord(int32_t coord, int32_t offset = 0) {
        return (coord << 4) + offset;
    }
};

class MutableBlockPos : public BlockPos {
public:
    MutableBlockPos(double x = 0, double y = 0, double z = 0) : BlockPos(x, y, z) {
    }

    MutableBlockPos *set(int32_t x, int32_t y, int32_t z) {
        BlockPos::setX(x);
        BlockPos::setY(y);
        BlockPos::setZ(z);
        return this;
    }

    MutableBlockPos *set(double x, double y, double z) {
        return this->set(Mth::floor(x), Mth::floor(y), Mth::floor(z));
    }

    MutableBlockPos *setY(int32_t y) {
        BlockPos::setY(y);
        return this;
    }
};

class QuartPos {
public:
    static const int32_t BITS = 2;
    static const int32_t SIZE = 4;
    static const int32_t MASK = 3;

private:
    static const int32_t SECTION_TO_QUARTS_BITS = 2;

    QuartPos() {
    }

public:
    static int32_t fromBlock(int32_t coord) {
        return coord >> BITS;
    }

    static int32_t quartLocal(int32_t coord) {
        return coord & MASK;
    }

    static int32_t toBlock(int32_t coord) {
        return coord << BITS;
    }

    static int32_t fromSection(int32_t coord) {
        return coord << SECTION_TO_QUARTS_BITS;
    }

    static int32_t toSection(int32_t coord) {
        return coord >> SECTION_TO_QUARTS_BITS;
    }
};

constexpr int64_t ChunkPos_asLong(int32_t x, int32_t z) {
    return ((int64_t)x & 4294967295LL) | (((int64_t)z & 4294967295LL) << 32);
}

class ChunkPos {
private:
    static const int32_t SAFETY_MARGIN = 1056;

public:
    static constexpr int64_t asLong(int32_t x, int32_t z) {
        return ChunkPos_asLong(x, z);
    }

    static constexpr int64_t INVALID_CHUNK_POS = ChunkPos_asLong(1875066, 1875066);
    static ChunkPos *ZERO;

private:
    static const int64_t COORD_BITS = 32LL;
    static const int64_t COORD_MASK = 4294967295LL;
    static const int32_t REGION_BITS = 5;
    static const int32_t REGION_MASK = 31;

public:
    int32_t x, z;

private:
    static const int32_t HASH_A = 1664525;
    static const int32_t HASH_C = 1013904223;
    static const int32_t HASH_Z_XOR = -559038737;

public:
    ChunkPos(int32_t x, int32_t z) {
        this->x = x;
        this->z = z;
    }

    ChunkPos(BlockPos *pos) {
        this->x = SectionPos::blockToSectionCoord(pos->getX());
        this->z = SectionPos::blockToSectionCoord(pos->getZ());
    }

    ChunkPos(int64_t loc) {
        this->x = (int32_t)loc;
        this->z = (int32_t)(loc >> 32);
    }

    int64_t toLong() {
        return asLong(this->x, this->z);
    }

    static int64_t asLong(BlockPos *pos) {
        return asLong(SectionPos::blockToSectionCoord(pos->getX()), SectionPos::blockToSectionCoord(pos->getZ()));
    }

    static int32_t getX(int64_t loc) {
        return (int32_t)(loc & 4294967295LL);
    }

    static int32_t getZ(int64_t loc) {
        return (int32_t)(ushr_l(loc, 32) & 4294967295LL);
    }

    int32_t hashCode() {
        int32_t i = 1664525 * this->x + 1013904223;
        int32_t j = 1664525 * (this->z ^ -559038737) + 1013904223;
        return i ^ j;
    }

    bool equals(ChunkPos *chunkpos) {
        return this->x == chunkpos->x && this->z == chunkpos->z;
    }

    int32_t getMiddleBlockX() {
        return this->getBlockX(8);
    }

    int32_t getMiddleBlockZ() {
        return this->getBlockZ(8);
    }

    int32_t getMinBlockX() {
        return SectionPos::sectionToBlockCoord(this->x);
    }

    int32_t getMinBlockZ() {
        return SectionPos::sectionToBlockCoord(this->z);
    }

    int32_t getMaxBlockX() {
        return this->getBlockX(15);
    }

    int32_t getMaxBlockZ() {
        return this->getBlockZ(15);
    }

    int32_t getRegionX() {
        return this->x >> 5;
    }

    int32_t getRegionZ() {
        return this->z >> 5;
    }

    int32_t getRegionLocalX() {
        return this->x & 31;
    }

    int32_t getRegionLocalZ() {
        return this->z & 31;
    }

    BlockPos *getBlockAt(int32_t sectionX, int32_t y, int32_t sectionZ) {
        return new BlockPos(this->getBlockX(sectionX), y, this->getBlockZ(sectionZ));
    }

    int32_t getBlockX(int32_t sectionX) {
        return SectionPos::sectionToBlockCoord(this->x, sectionX);
    }

    int32_t getBlockZ(int32_t sectionZ) {
        return SectionPos::sectionToBlockCoord(this->z, sectionZ);
    }

    BlockPos *getMiddleBlockPosition(int32_t y) {
        return new BlockPos(this->getMiddleBlockX(), y, this->getMiddleBlockZ());
    }

    BlockPos *getWorldPosition() {
        return new BlockPos(this->getMinBlockX(), 0, this->getMinBlockZ());
    }

    int32_t getChessboardDistance(ChunkPos *otherPos) {
        return max(abs(this->x - otherPos->x), abs(this->z - otherPos->z));
    }
};