#pragma once

#include <functional>

#include "blocks.hpp"
#include "chunks.fwd.hpp"
#include "heightmap.fwd.hpp"
#include "pos.hpp"

using namespace std;

template <typename T> using Predicate = bool (*)(T);

class Heightmap {
private:
    static constexpr Predicate<BlockState> NOT_AIR = [](BlockState p_64263_) -> bool {
        return p_64263_ != Blocks::AIR;
    };
    // TODO
    static constexpr Predicate<BlockState> MATERIAL_MOTION_BLOCKING = NOT_AIR;
    static constexpr Predicate<BlockState> MATERIAL_MOTION_BLOCKING_NO_LEAVES = NOT_AIR;

    int32_t *data;
    Predicate<BlockState> isOpaque;
    ChunkAccess *chunk;

public:
    enum Usage
    {
        WORLDGEN,
        LIVE_WORLD,
        CLIENT,
    };

    typedef HeightmapTypes Types;

    struct TypeDesc {
    public:
        const char *name;
        Usage usage;
        Predicate<BlockState> isOpaque;
    };

    static constexpr TypeDesc isOpaqueData[6] = {
        {.name = "WORLD_SURFACE_WG", .usage = Heightmap::Usage::WORLDGEN, .isOpaque = Heightmap::NOT_AIR},
        {.name = "WORLD_SURFACE", .usage = Heightmap::Usage::CLIENT, .isOpaque = Heightmap::NOT_AIR},
        {.name = "OCEAN_FLOOR_WG",
         .usage = Heightmap::Usage::WORLDGEN,
         .isOpaque = Heightmap::MATERIAL_MOTION_BLOCKING},
        {.name = "OCEAN_FLOOR", .usage = Heightmap::Usage::LIVE_WORLD, .isOpaque = Heightmap::MATERIAL_MOTION_BLOCKING},
        {.name = "MOTION_BLOCKING", .usage = Heightmap::Usage::CLIENT, .isOpaque = Heightmap::MATERIAL_MOTION_BLOCKING},
        {.name = "MOTION_BLOCKING_NO_LEAVES",
         .usage = Heightmap::Usage::LIVE_WORLD,
         .isOpaque = Heightmap::MATERIAL_MOTION_BLOCKING_NO_LEAVES},
    };

    static constexpr const char *Type_name(Types type) {
        return isOpaqueData[type].name;
    };

    static constexpr Usage Type_usage(Types type) {
        return isOpaqueData[type].usage;
    };

    static constexpr Predicate<BlockState> Type_isOpaque(Types type) {
        return isOpaqueData[type].isOpaque;
    };

    Heightmap(ChunkAccess *chunk, Heightmap::Types type) {
        this->isOpaque = Type_isOpaque(type);
        this->chunk = chunk;
        this->data = new int32_t[256];
    }

    static void primeHeightmaps(ChunkAccess *chunkAccess, vector<Heightmap::Types> types) {
        int typeCount = types.size();
        vector<Heightmap *> heightmaps = vector<Heightmap *>();
        heightmaps.reserve(typeCount);

        int maxY = chunkAccess->getHighestSectionPosition() + 16;
        MutableBlockPos *pos = new MutableBlockPos();

        for (int x = 0; x < 16; ++x) {
            for (int z = 0; z < 16; ++z) {

                heightmaps.clear();
                for (Heightmap::Types &type : types) {
                    heightmaps.push_back(chunkAccess->getOrCreateHeightmapUnprimed(type));
                }

                for (int y = maxY - 1; y >= chunkAccess->getMinBuildHeight(); --y) {
                    pos->set(x, y, z);
                    BlockState blockState = chunkAccess->getBlockState(pos);
                    if (blockState != Blocks::AIR) {
                        int heightmapsIndex = 0;
                        while (heightmapsIndex < heightmaps.size()) {
                            Heightmap *heightmap = heightmaps[heightmapsIndex];
                            if (heightmap->isOpaque(blockState)) {
                                heightmap->setHeight(x, z, y + 1);
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

    bool update(int x, int y, int z, BlockState block) {
        int height = this->getFirstAvailable(x, z);
        if (y <= height - 2) {
            return false;
        } else {
            if (this->isOpaque(block)) {
                if (y >= height) {
                    this->setHeight(x, z, y + 1);
                    return true;
                }
            } else if (height - 1 == y) {
                MutableBlockPos *pos = new MutableBlockPos();

                for (int currentY = y - 1; currentY >= this->chunk->getMinBuildHeight(); --currentY) {
                    pos->set(x, currentY, z);
                    if (this->isOpaque(this->chunk->getBlockState(pos))) {
                        this->setHeight(x, z, currentY + 1);
                        return true;
                    }
                }

                this->setHeight(x, z, this->chunk->getMinBuildHeight());
                return true;
            }

            return false;
        }
    }

    int getFirstAvailable(int x, int z) {
        return this->getFirstAvailable(getIndex(x, z));
    }

    int getHighestTaken(int x, int z) {
        return this->getFirstAvailable(getIndex(x, z)) - 1;
    }

    int getFirstAvailable(int index) {
        return this->data[index] + this->chunk->getMinBuildHeight();
    }

    void setHeight(int x, int z, int height) {
        this->data[getIndex(x, z)] = height - this->chunk->getMinBuildHeight();
    }

    static int getIndex(int x, int z) {
        return x + z * 16;
    }
};