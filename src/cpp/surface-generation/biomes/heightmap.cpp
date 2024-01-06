#include "heightmap.hpp"

Heightmap::Heightmap(shared_ptr<ChunkAccess> chunkAccess, Heightmap::Types type) : data(), chunkAccess(chunkAccess) {
    this->isOpaque = Type_isOpaque(type);
}

void Heightmap::primeHeightmaps(shared_ptr<ChunkAccess> chunkAccess, vector<Heightmap::Types> types) {
    int32_t typeCount = (int32_t)types.size();
    vector<shared_ptr<Heightmap>> heightmaps = vector<shared_ptr<Heightmap>>();
    heightmaps.reserve(typeCount);

    int32_t maxY = chunkAccess->getHighestSectionPosition() + 16;
    MutableBlockPos pos = MutableBlockPos();

    for (int32_t x = 0; x < 16; ++x) {
        for (int32_t z = 0; z < 16; ++z) {

            heightmaps.clear();
            for (Heightmap::Types &type : types) {
                heightmaps.push_back(chunkAccess->getOrCreateHeightmapUnprimed(type));
            }

            for (int32_t y = maxY - 1; y >= chunkAccess->getMinBuildHeight(); --y) {
                pos.set(x, y, z);
                BlockState blockState = chunkAccess->getBlockState(pos);
                if (blockState != Blocks::AIR) {
                    int32_t heightmapsIndex = 0;
                    while (heightmapsIndex < heightmaps.size()) {
                        Heightmap &heightmap = *heightmaps[heightmapsIndex];
                        if (heightmap.isOpaque(blockState)) {
                            heightmap.setHeight(x, z, y + 1);
                            // TODO optimize this?
                            heightmaps.erase(heightmaps.begin() + heightmapsIndex);
                        } else {
                            heightmapsIndex++;
                        }
                    }

                    if (heightmaps.size() == 0) {
                        break;
                    }
                }
            }
        }
    }
}

bool Heightmap::update(int32_t x, int32_t y, int32_t z, BlockState block) {
    int32_t height = this->getFirstAvailable(x, z);
    if (y <= height - 2) {
        return false;
    } else {
        if (this->isOpaque(block)) {
            if (y >= height) {
                this->setHeight(x, z, y + 1);
                return true;
            }
        } else if (height - 1 == y) {
            MutableBlockPos pos = MutableBlockPos();

            shared_ptr<ChunkAccess> chunkAccess = this->chunkAccess.lock();

            for (int32_t currentY = y - 1; currentY >= chunkAccess->getMinBuildHeight(); --currentY) {
                pos.set(x, currentY, z);
                if (this->isOpaque(chunkAccess->getBlockState(pos))) {
                    this->setHeight(x, z, currentY + 1);
                    return true;
                }
            }

            this->setHeight(x, z, chunkAccess->getMinBuildHeight());
            return true;
        }

        return false;
    }
}

int32_t Heightmap::getFirstAvailable(int32_t x, int32_t z) const {
    return this->getFirstAvailable(getIndex(x, z));
}

int32_t Heightmap::getHighestTaken(int32_t x, int32_t z) const {
    return this->getFirstAvailable(getIndex(x, z)) - 1;
}

int32_t Heightmap::getFirstAvailable(int32_t index) const {
    return this->data[index] + this->chunkAccess.lock()->getMinBuildHeight();
}

void Heightmap::setHeight(int32_t x, int32_t z, int32_t height) {
    this->data[getIndex(x, z)] = height - this->chunkAccess.lock()->getMinBuildHeight();
}