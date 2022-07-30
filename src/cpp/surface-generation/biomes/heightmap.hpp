#pragma once

#include <functional>
#include <vector>

#include "blocks.hpp"
#include "chunks.hpp"
#include "heightmap.fwd.hpp"
#include "pos.hpp"

using namespace std;

template <typename T> using Predicate = bool (*)(T);

class Heightmap {
private:
    static constexpr Predicate<BlockState> NOT_AIR = [](BlockState blockState) -> bool {
        return blockState != Blocks::AIR;
    };
    // TODO
    static constexpr Predicate<BlockState> MATERIAL_MOTION_BLOCKING = NOT_AIR;
    static constexpr Predicate<BlockState> MATERIAL_MOTION_BLOCKING_NO_LEAVES = NOT_AIR;

    int32_t data[256];
    Predicate<BlockState> isOpaque;
    shared_ptr<ChunkAccess> chunk;

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

    static constexpr inline const char *Type_name(Types type) {
        return isOpaqueData[type].name;
    };

    static constexpr inline Usage Type_usage(Types type) {
        return isOpaqueData[type].usage;
    };

    static constexpr inline Predicate<BlockState> Type_isOpaque(Types type) {
        return isOpaqueData[type].isOpaque;
    };

    Heightmap(shared_ptr<ChunkAccess> chunk, Heightmap::Types type);

    static void primeHeightmaps(shared_ptr<ChunkAccess> chunkAccess, vector<Heightmap::Types> types);

    bool update(int32_t x, int32_t y, int32_t z, BlockState block);

    int32_t getFirstAvailable(int32_t x, int32_t z) const;
    int32_t getHighestTaken(int32_t x, int32_t z) const;
    int32_t getFirstAvailable(int32_t index) const;

    void setHeight(int32_t x, int32_t z, int32_t height);

    static constexpr inline int32_t getIndex(int32_t x, int32_t z) {
        return x + z * 16;
    }
};