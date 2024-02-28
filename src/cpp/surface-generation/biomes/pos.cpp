#include "pos.hpp"

// BlockPos

BlockPos::BlockPos(double x, double y, double z) : x(x), y(y), z(z) {
}

int32_t BlockPos::getX() const {
    return (int32_t)this->x;
}

int32_t BlockPos::getY() const {
    return (int32_t)this->y;
}

int32_t BlockPos::getZ() const {
    return (int32_t)this->z;
}

BlockPos &BlockPos::setX(int32_t value) {
    this->x = value;
    return *this;
}

BlockPos &BlockPos::setY(int32_t value) {
    this->y = value;
    return *this;
}

BlockPos &BlockPos::setZ(int32_t value) {
    this->z = value;
    return *this;
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

int64_t BlockPos::asLong() {
    return BlockPos::asLong(this->getX(), this->getY(), this->getZ());
}

// MutableBlockPos

MutableBlockPos::MutableBlockPos(double x, double y, double z) : BlockPos(x, y, z) {
}

MutableBlockPos &MutableBlockPos::set(int32_t x, int32_t y, int32_t z) {
    BlockPos::setX(x);
    BlockPos::setY(y);
    BlockPos::setZ(z);
    return *this;
}

MutableBlockPos &MutableBlockPos::set(double x, double y, double z) {
    return this->set(Mth::floor(x), Mth::floor(y), Mth::floor(z));
}

MutableBlockPos &MutableBlockPos::setX(int32_t x) {
    BlockPos::setX(x);
    return *this;
}

MutableBlockPos &MutableBlockPos::setY(int32_t y) {
    BlockPos::setY(y);
    return *this;
}

MutableBlockPos &MutableBlockPos::setZ(int32_t z) {
    BlockPos::setZ(z);
    return *this;
}

// ChunkPos

ChunkPos::ChunkPos(int32_t x, int32_t z) : x(x), z(z) {
}

ChunkPos::ChunkPos(BlockPos const &pos)
    : x(SectionPos::blockToSectionCoord(pos.getX())), z(SectionPos::blockToSectionCoord(pos.getZ())) {
}

ChunkPos::ChunkPos(int64_t loc) : x((int32_t)loc), z((int32_t)(loc >> COORD_BITS)) {
}

BlockPos const ChunkPos::getBlockAt(int32_t sectionX, int32_t y, int32_t sectionZ) const {
    return BlockPos(this->getBlockX(sectionX), y, this->getBlockZ(sectionZ));
}

BlockPos const ChunkPos::getMiddleBlockPosition(int32_t y) const {
    return BlockPos(this->getMiddleBlockX(), y, this->getMiddleBlockZ());
}

BlockPos const ChunkPos::getWorldPosition() const {
    return BlockPos(this->getMinBlockX(), 0, this->getMinBlockZ());
}

ChunkPos ChunkPos::ZERO = ChunkPos(0, 0);