#include "pos.hpp"

// BlockPos

BlockPos::BlockPos(double x, double y, double z) : x(x), y(y), z(z) {
}

int32_t BlockPos::getX() {
    return this->x;
}

int32_t BlockPos::getY() {
    return this->y;
}

int32_t BlockPos::getZ() {
    return this->z;
}

BlockPos *BlockPos::setX(int32_t value) {
    this->x = value;
    return this;
}

BlockPos *BlockPos::setY(int32_t value) {
    this->y = value;
    return this;
}

BlockPos *BlockPos::setZ(int32_t value) {
    this->z = value;
    return this;
}

int32_t BlockPos::getX(int64_t x) {
    return (int32_t)((x << (64 - X_OFFSET - PACKED_X_LENGTH)) >> (64 - PACKED_X_LENGTH));
}

int32_t BlockPos::getY(int64_t y) {
    return (int32_t)((y << (64 - PACKED_Y_LENGTH)) >> (64 - PACKED_Y_LENGTH));
}

int32_t BlockPos::getZ(int64_t z) {
    return (int32_t)((z << (64 - Z_OFFSET - PACKED_Z_LENGTH)) >> (64 - PACKED_Z_LENGTH));
}

int64_t BlockPos::asLong(int32_t x, int32_t y, int32_t z) {
    int64_t result = 0LL;
    result |= ((int64_t)x & PACKED_X_MASK) << X_OFFSET;
    result |= ((int64_t)y & PACKED_Y_MASK) << 0;
    return result | ((int64_t)z & PACKED_Z_MASK) << Z_OFFSET;
}

// MutableBlockPos

MutableBlockPos::MutableBlockPos(double x, double y, double z) : BlockPos(x, y, z) {
}

MutableBlockPos *MutableBlockPos::set(int32_t x, int32_t y, int32_t z) {
    BlockPos::setX(x);
    BlockPos::setY(y);
    BlockPos::setZ(z);
    return this;
}

MutableBlockPos *MutableBlockPos::set(double x, double y, double z) {
    return this->set(Mth::floor(x), Mth::floor(y), Mth::floor(z));
}

MutableBlockPos *MutableBlockPos::setY(int32_t y) {
    BlockPos::setY(y);
    return this;
}

// ChunkPos

ChunkPos::ChunkPos(int32_t x, int32_t z) : x(x), z(z) {
}

ChunkPos::ChunkPos(BlockPos *pos)
    : x(SectionPos::blockToSectionCoord(pos->getX())), z(SectionPos::blockToSectionCoord(pos->getZ())) {
}

ChunkPos::ChunkPos(int64_t loc) : x((int32_t)loc), z((int32_t)(loc >> COORD_BITS)) {
}

BlockPos *ChunkPos::getBlockAt(int32_t sectionX, int32_t y, int32_t sectionZ) {
    return new BlockPos(this->getBlockX(sectionX), y, this->getBlockZ(sectionZ));
}

BlockPos *ChunkPos::getMiddleBlockPosition(int32_t y) {
    return new BlockPos(this->getMiddleBlockX(), y, this->getMiddleBlockZ());
}

BlockPos *ChunkPos::getWorldPosition() {
    return new BlockPos(this->getMinBlockX(), 0, this->getMinBlockZ());
}

ChunkPos *ChunkPos::ZERO = new ChunkPos(0, 0);