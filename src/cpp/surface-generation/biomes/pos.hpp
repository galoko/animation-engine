#pragma once

#include <stdint.h>

#include "mth.hpp"

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

    int getX() {
        return this->x;
    }

    int getY() {
        return this->y;
    }

    int getZ() {
        return this->z;
    }

protected:
    BlockPos *setX(int value) {
        this->x = value;
        return this;
    }

    BlockPos *setY(int value) {
        this->y = value;
        return this;
    }

    BlockPos *setZ(int value) {
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
    static int blockToSectionCoord(int coord) {
        return coord >> 4;
    }

    static int sectionToBlockCoord(int coord, int offset = 0) {
        return (coord << 4) + offset;
    }
};

class MutableBlockPos : BlockPos {
    MutableBlockPos(double x = 0, double y = 0, double z = 0) : BlockPos(x, y, z) {
    }

    MutableBlockPos *set(int x, int y, int z) {
        this->setX(x);
        this->setY(y);
        this->setZ(z);
        return this;
    }

    MutableBlockPos *set(double x, double y, double z) {
        return this->set(Mth::floor(x), Mth::floor(y), Mth::floor(z));
    }

    MutableBlockPos *setY(int y) {
        this->setY(y);
        return this;
    }
};