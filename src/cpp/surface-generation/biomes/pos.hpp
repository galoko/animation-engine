#pragma once

#include <cstdint>

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
    BlockPos(double x, double y, double z);

    int32_t getX() const;
    int32_t getY() const;
    int32_t getZ() const;

protected:
    BlockPos &setX(int32_t value);
    BlockPos &setY(int32_t value);
    BlockPos &setZ(int32_t value);

public:
    static int32_t getX(int64_t x);
    static int32_t getY(int64_t y);
    static int32_t getZ(int64_t z);

    static int64_t asLong(int32_t x, int32_t y, int32_t z);
};

class SectionPos {
public:
    static constexpr inline int32_t blockToSectionCoord(int32_t coord) {
        return coord >> 4;
    }

    static constexpr inline int32_t sectionToBlockCoord(int32_t coord, int32_t offset = 0) {
        return (coord << 4) + offset;
    }
};

class MutableBlockPos : public BlockPos {
public:
    MutableBlockPos(double x = 0, double y = 0, double z = 0);

    MutableBlockPos &set(int32_t x, int32_t y, int32_t z);
    MutableBlockPos &set(double x, double y, double z);

    MutableBlockPos &setX(int32_t x);
    MutableBlockPos &setY(int32_t y);
    MutableBlockPos &setZ(int32_t z);
};

class QuartPos {
private:
    static const int32_t SECTION_TO_QUARTS_BITS = 2;

public:
    static const int32_t BITS = 2;
    static const int32_t SIZE = 4;
    static const int32_t MASK = 3;

    static constexpr inline int32_t fromBlock(int32_t coord) {
        return coord >> BITS;
    }

    static constexpr inline int32_t quartLocal(int32_t coord) {
        return coord & MASK;
    }

    static constexpr inline int32_t toBlock(int32_t coord) {
        return coord << BITS;
    }

    static constexpr inline int32_t fromSection(int32_t coord) {
        return coord << SECTION_TO_QUARTS_BITS;
    }

    static constexpr inline int32_t toSection(int32_t coord) {
        return coord >> SECTION_TO_QUARTS_BITS;
    }
};

namespace {
    static const int64_t COORD_BITS = 32LL;
    static const int64_t COORD_MASK = 4294967295LL;

    constexpr int64_t ChunkPos_asLong(int32_t x, int32_t z) {
        return ((int64_t)x & COORD_MASK) | (((int64_t)z & COORD_MASK) << COORD_BITS);
    }
} // namespace

class ChunkPos {
private:
    static const int32_t SAFETY_MARGIN = 1056;

    static const int32_t REGION_BITS = 5;
    static const int32_t REGION_MASK = 31;

    static const int32_t HASH_A = 1664525;
    static const int32_t HASH_C = 1013904223;
    static const int32_t HASH_Z_XOR = -559038737;

public:
    static constexpr int64_t asLong(int32_t x, int32_t z) {
        return ChunkPos_asLong(x, z);
    }

    static constexpr int64_t INVALID_CHUNK_POS = ChunkPos_asLong(1875066, 1875066);
    static ChunkPos ZERO;

    int32_t x, z;

    ChunkPos(int32_t x, int32_t z);
    ChunkPos(BlockPos const &pos);
    ChunkPos(int64_t loc);

    BlockPos const getBlockAt(int32_t sectionX, int32_t y, int32_t sectionZ) const;
    BlockPos const getMiddleBlockPosition(int32_t y) const;
    BlockPos const getWorldPosition() const;

    constexpr inline int64_t toLong() {
        return asLong(this->x, this->z);
    }

    static constexpr inline int64_t asLong(BlockPos const &pos) {
        return asLong(SectionPos::blockToSectionCoord(pos.getX()), SectionPos::blockToSectionCoord(pos.getZ()));
    }

    static constexpr inline int32_t getX(int64_t loc) {
        return (int32_t)(loc & COORD_MASK);
    }

    static constexpr inline int32_t getZ(int64_t loc) {
        return (int32_t)(ushr_l(loc, COORD_BITS) & COORD_MASK);
    }

    constexpr inline int32_t hashCode() const {
        int32_t i = HASH_A * this->x + HASH_C;
        int32_t j = HASH_A * (this->z ^ HASH_Z_XOR) + HASH_C;
        return i ^ j;
    }

    constexpr inline bool equals(ChunkPos const &chunkpos) const {
        return this->x == chunkpos.x && this->z == chunkpos.z;
    }

    constexpr inline int32_t getMiddleBlockX() const {
        return this->getBlockX(8);
    }

    constexpr inline int32_t getMiddleBlockZ() const {
        return this->getBlockZ(8);
    }

    constexpr inline int32_t getMinBlockX() const {
        return SectionPos::sectionToBlockCoord(this->x);
    }

    constexpr inline int32_t getMinBlockZ() const {
        return SectionPos::sectionToBlockCoord(this->z);
    }

    constexpr inline int32_t getMaxBlockX() const {
        return this->getBlockX(15);
    }

    constexpr inline int32_t getMaxBlockZ() const {
        return this->getBlockZ(15);
    }

    constexpr inline int32_t getRegionX() const {
        return this->x >> REGION_BITS;
    }

    constexpr inline int32_t getRegionZ() const {
        return this->z >> REGION_BITS;
    }

    constexpr inline int32_t getRegionLocalX() const {
        return this->x & REGION_MASK;
    }

    constexpr inline int32_t getRegionLocalZ() const {
        return this->z & REGION_MASK;
    }

    constexpr inline int32_t getBlockX(int32_t sectionX) const {
        return SectionPos::sectionToBlockCoord(this->x, sectionX);
    }

    constexpr inline int32_t getBlockZ(int32_t sectionZ) const {
        return SectionPos::sectionToBlockCoord(this->z, sectionZ);
    }

    constexpr inline int32_t getChessboardDistance(ChunkPos const &otherPos) const {
        return std::max(Mth::c_abs(this->x - otherPos.x), Mth::c_abs(this->z - otherPos.z));
    }
};