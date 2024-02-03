#pragma once

#include <memory>
#include <vector>

#include "../ecs/entity.hpp"

// minecraft

#include "../surface-generation/biomes/blocks.hpp"
#include "../surface-generation/biomes/chunk-generator.hpp"
#include "../surface-generation/biomes/chunk-status.hpp"
#include "../surface-generation/biomes/chunks.hpp"
#include "../surface-generation/biomes/pos.hpp"
#include "../surface-generation/biomes/worldgen-region.hpp"
#include "../surface-generation/biomes/worldgen-settings.hpp"

using namespace std;

class TerrainGenerationContext {
public:
    ChunkPos centerPos;
    vector<shared_ptr<ChunkAccess>> chunks;
    LevelHeightAccessor heightAccessor;
    int32_t startX, endX, startZ, endZ;

    TerrainGenerationContext() : centerPos(0, 0) {
        //
    }
};

class WorldManager {
private:
    TerrainGenerationContext terrainGenerationContext;

    shared_ptr<Entity> createCharacter();

    void addGround();
    void addPillars();

    int32_t getIndex(int32_t chunkX, int32_t chunkZ);
    Blocks getBlock(int32_t x, int32_t y, int32_t z);
    void generateTerrain();

    static constexpr double PI = 3.141592653589793238463;
    static constexpr double DEG_TO_RAD = PI / 180.0;

public:
    registry registry;

    WorldManager();

    void init();

    void tick(double dt);
};