#include "world-manager.hpp"

#include <chrono>
#include <glm.hpp>
#include <gtc/quaternion.hpp>
#include <gtx/transform.hpp>
#include <thread>
#include <vec3.hpp>
#include <vec4.hpp>

#include "../ecs/components/components.hpp"
#include "../external-services/external-render.hpp"
#include "../services.hpp"

using namespace glm;

enum BlockSide {
    TOP,
    BOTTOM,
    LEFT,
    RIGHT,
    FRONT,
    BACK,
    NUM_SIDES
};

enum Textures {
    EMPTY,
    STONE,
    SAND,
    DIRT,
    WATER,
    GRASS_TOP,
    GRASS_SIDE,
    GRAVEL
};

map<int32_t, Textures> blockSideToTexture;

int32_t getBlockSideIndex(Blocks block, int32_t side) {
    return (int32_t)block * 6 + side;
}

int32_t getBlockSideTexture(Blocks block, int32_t side) {
    int32_t index = getBlockSideIndex(block, side);
    auto tex = blockSideToTexture.find(index);
    if (tex == blockSideToTexture.end()) {
        return Textures::EMPTY;
    }

    return tex->second;
}

void registerTextureSide(Blocks block, BlockSide side, Textures texture) {
    blockSideToTexture[getBlockSideIndex(block, side)] = texture;
}

void registerTexture(Blocks block, Textures texture) {
    registerTextureSide(block, BlockSide::TOP, texture);
    registerTextureSide(block, BlockSide::BOTTOM, texture);
    registerTextureSide(block, BlockSide::LEFT, texture);
    registerTextureSide(block, BlockSide::RIGHT, texture);
    registerTextureSide(block, BlockSide::FRONT, texture);
    registerTextureSide(block, BlockSide::BACK, texture);
}

vec3 offsets[BlockSide::NUM_SIDES] = {
    vec3(0, 1, 0),  // top
    vec3(0, -1, 0), // bottom
    vec3(-1, 0, 0), // left
    vec3(1, 0, 0),  // right
    vec3(0, 0, -1), // front
    vec3(0, 0, 1),  // back
};

quat sideRotations[BlockSide::NUM_SIDES] = {
    angleAxis(radians(0.f), vec3(1.f, 0.f, 0.f)),
    angleAxis(radians(180.f), vec3(1.f, 0.f, 0.f)),
    angleAxis(radians(90.f), vec3(0.f, 0.f, 1.f)) * angleAxis(radians(-90.f), vec3(1.f, 0.f, 0.f)),
    angleAxis(radians(270.f), vec3(0.f, 0.f, 1.f)) * angleAxis(radians(-90.f), vec3(1.f, 0.f, 0.f)),
    angleAxis(radians(180.f), vec3(0.f, 0.f, 1.f)) * angleAxis(radians(-90.f), vec3(1.f, 0.f, 0.f)),
    angleAxis(radians(-90.f), vec3(1.f, 0.f, 0.f)),
};

// ...

shared_ptr<Entity> WorldManager::createCharacter() {
    const shared_ptr<Entity> character = make_shared<Entity>();

    this->registry.emplace<TransformComponent>(character->handle);
    GraphicsComponent &graphicsComponent = this->registry.emplace<GraphicsComponent>(character->handle);

    RenderHandle cubeModel = Render::requestMesh("cube");
    RenderHandle rockTexture = Render::requestTexture("rock.jpg");

    RenderHandle cubeHandle = Render::createRenderable(cubeModel, rockTexture);

    Transformation transform = Transformation(0, 0, 0, 0);
    shared_ptr<Graphics> cube = make_shared<Graphics>(cubeHandle, transform);
    graphicsComponent.add(cube);

    return character;
}

WorldManager::WorldManager() {
    //
}

void WorldManager::init() {
    registerTexture(Blocks::STONE, Textures::STONE);
    registerTexture(Blocks::SAND, Textures::SAND);
    registerTexture(Blocks::DIRT, Textures::DIRT);
    registerTexture(Blocks::WATER, Textures::WATER);
    registerTexture(Blocks::GRASS_BLOCK, Textures::GRASS_SIDE);
    registerTextureSide(Blocks::GRASS_BLOCK, BlockSide::TOP, Textures::GRASS_TOP);
    registerTextureSide(Blocks::GRASS_BLOCK, BlockSide::BOTTOM, Textures::DIRT);
    registerTexture(Blocks::GRAVEL, Textures::GRAVEL);

    // ...

    shared_ptr<Entity> player = this->createCharacter();

    this->registry.get<TransformComponent>(player->handle).transform.position =
        vec3(124.5 * 100, 381.5 * 100, 65 * 100);

    this->registry.get<GraphicsComponent>(player->handle).show();

    Services->cameraManager.orbit(player, 0, 0, 5 * 100, 0.5 * 100);
    Services->playerInputManager.setManagedEntity(player);

    this->generateTerrain();
}

void WorldManager::tick(double dt) {
    auto view = registry.view<TransformComponent, GraphicsComponent>();
    for (auto [entity, transformComponent, graphicsComponent] : view.each()) {
        const Transformation &transform = transformComponent.transform;
        graphicsComponent.sync(transform);
    }
}

void WorldManager::addGround() {
    RenderHandle planeModel = Render::requestMesh("plane");
    RenderHandle grassTexture = Render::requestTexture("grass.jpg");

    RenderHandle ground = Render::createRenderable(planeModel, grassTexture);

    Transformation transform = Transformation(0, 0, -0.5 * 100, 140 * 100);
    Render::setTransform(ground, transform);

    Render::addRenderable(ground);
}

void WorldManager::addPillars() {
    RenderHandle wallModel = Render::requestMesh("wall");
    RenderHandle marbleTexture = Render::requestTexture("marble.jpg");

    Transformation transform = Transformation(20 * 100, 0 * 100, -0.5 * 100, 1 * 100);
    RenderHandle wall = Render::createRenderable(wallModel, marbleTexture);
    Render::setTransform(wall, transform);
    Render::addRenderable(wall);

    RenderHandle pillarModel = Render::requestMesh("pillar");

    float PILLARS_COUNT = 10;
    float DISTANCE = 20;
    float STEP = DISTANCE / PILLARS_COUNT;
    for (int32_t i = 0; i < PILLARS_COUNT; i++) {
        float x = -5.0;
        float y = -DISTANCE / 2 + (float)i * STEP + 0.5;

        float t = (float)i / (float)(PILLARS_COUNT - 1);
        t = t * 2 - 1;

        RenderHandle pillar = Render::createRenderable(pillarModel, marbleTexture);
        Transformation transform = Transformation(x * 100, y * 100, -4.5 * 100, 0.5 * 100);
        quat rotation(vec3(0, -0.6 * t, 0.6 * t));
        transform.rotation = rotation;
        Render::setTransform(pillar, transform);

        Render::addRenderable(pillar);
    }
}

#define RANGE (10)
#define RANGE_SIZE (1 + RANGE * 2)

int32_t WorldManager::getIndex(int32_t chunkX, int32_t chunkZ) {
    ChunkPos &centerPos = this->terrainGenerationContext.centerPos;

    int32_t x = chunkX - (-RANGE + centerPos.x);
    int32_t z = chunkZ - (-RANGE + centerPos.z);
    return x * RANGE_SIZE + z;
};

int i = 5;

Blocks WorldManager::getBlock(int32_t x, int32_t y, int32_t z) {
    auto &heightAccessor = this->terrainGenerationContext.heightAccessor;
    int32_t startX = this->terrainGenerationContext.startX;
    int32_t endX = this->terrainGenerationContext.endX;
    int32_t startZ = this->terrainGenerationContext.startZ;
    int32_t endZ = this->terrainGenerationContext.endZ;

    if (x < startX || x > endX || z < startZ || z > endZ || y < heightAccessor.getMinBuildHeight() ||
        y > heightAccessor.getMaxBuildHeight()) {
        return Blocks::NULL_BLOCK;
    }

    // debug
    if (x == 124 && z == 377 && y == 65) {
        return Blocks::DIRT;
    }

    BlockPos blockPos(x, y, z);
    ChunkPos chunkPos(blockPos);

    int32_t index = this->getIndex(chunkPos.x, chunkPos.z);

    shared_ptr<ChunkAccess> &chunk = this->terrainGenerationContext.chunks[index];

    BlockPos blockPosInChunk(x - chunkPos.getMinBlockX(), y, z - chunkPos.getMinBlockZ());

    return chunk->getBlockState(blockPosInChunk);
};

bool isInvisible(Blocks block) {
    return block == Blocks::AIR || block == Blocks::NULL_BLOCK || block == Blocks::VOID_AIR;
};

bool isTransparent(Blocks block) {
    return block == Blocks::WATER || isInvisible(block);
};

bool shouldAddSide(Blocks block, Blocks otherBlock) {
    // invisible block
    if (isInvisible(block)) {
        return false;
    }

    // blocks are the same
    if (block == otherBlock) {
        return false;
    }

    // if we are facing non-transparent block
    if (!isTransparent(otherBlock)) {
        return false;
    }

    return true;
};

void writeVertex(vector<float> &vertices, vec3 v, vec3 &n, vec2 uv) {
    vertices.push_back(v.x);
    vertices.push_back(v.y);
    vertices.push_back(v.z);
    vertices.push_back(n.x);
    vertices.push_back(n.y);
    vertices.push_back(n.z);
    vertices.push_back(uv.x);
    vertices.push_back(uv.y);
};

void WorldManager::generateTerrain() {
    TerrainGenerationContext &context = this->terrainGenerationContext;
    context.centerPos = ChunkPos(7, 23);
    context.heightAccessor = LevelHeightAccessor();
    context.chunks = vector<shared_ptr<ChunkAccess>>(RANGE_SIZE * RANGE_SIZE);

    int64_t seed = hashCode("test");

    shared_ptr<ChunkGenerator> chunkGenerator = WorldGenSettings::makeDefaultOverworld(seed);

    auto generation_start_time = chrono::high_resolution_clock::now();

    for (int32_t chunkX = -RANGE + context.centerPos.x; chunkX <= context.centerPos.x + RANGE; chunkX++) {
        for (int32_t chunkZ = -RANGE + context.centerPos.z; chunkZ <= context.centerPos.z + RANGE; chunkZ++) {
            auto chunk_start_time = chrono::high_resolution_clock::now();
            int32_t index = this->getIndex(chunkX, chunkZ);

            ChunkPos chunkPos = ChunkPos(chunkX, chunkZ);
            shared_ptr<ChunkAccess> chunk = make_shared<ChunkAccess>(chunkPos, context.heightAccessor);

            vector<shared_ptr<ChunkAccess>> cache = {chunk};
            shared_ptr<WorldGenRegion> region = make_shared<WorldGenRegion>(chunkGenerator, cache);
            region->init(seed);
            chunkGenerator->region = region;

            ChunkStatus::BIOMES.generate(chunkGenerator, ChunkStatus::EMPTY_CONVERTER, cache);
            ChunkStatus::NOISE.generate(chunkGenerator, ChunkStatus::EMPTY_CONVERTER, cache);
            ChunkStatus::SURFACE.generate(chunkGenerator, ChunkStatus::EMPTY_CONVERTER, cache);

            context.chunks[index] = chunk;

            auto chunkTime = chrono::high_resolution_clock::now() - chunk_start_time;

            printf("chunk %d %d has been generated (took %lldms)\n", chunkX, chunkZ,
                   chunkTime / chrono::milliseconds(1));
        }
    }

    auto generation_total_time = chrono::high_resolution_clock::now() - generation_start_time;
    printf("%d chunks has been generated in %lldms\n", (int32_t)context.chunks.size(),
           generation_total_time / chrono::milliseconds(1));

    auto meshing_start_time = chrono::high_resolution_clock::now();

    RenderHandle atlasTexture = Render::requestTexture("minecraft-atlas.png");

    shared_ptr<ChunkAccess> firstChunk = context.chunks[0];
    shared_ptr<ChunkAccess> lastChunk = context.chunks[context.chunks.size() - 1];

    context.startX = firstChunk->getPos().getMinBlockX();
    context.startZ = firstChunk->getPos().getMinBlockZ();
    context.endX = lastChunk->getPos().getMaxBlockX();
    context.endZ = lastChunk->getPos().getMaxBlockZ();

    for (shared_ptr<ChunkAccess> chunk : context.chunks) {
        vector<float> vertices;
        vector<uint16_t> indices;

        ChunkPos chunkPos = chunk->getPos();
        int32_t startX = chunkPos.getMinBlockX();
        int32_t endX = chunkPos.getMaxBlockX();
        int32_t startZ = chunkPos.getMinBlockZ();
        int32_t endZ = chunkPos.getMaxBlockZ();

        for (int32_t y = context.heightAccessor.getMinBuildHeight(); y <= context.heightAccessor.getMaxBuildHeight();
             y++) {
            for (int32_t z = startZ; z <= endZ; z++) {
                for (int32_t x = startX; x <= endX; x++) {
                    Blocks block = this->getBlock(x, y, z);
                    if (isInvisible(block)) {
                        continue;
                    }

                    for (int32_t side = BlockSide::TOP; side <= BlockSide::BACK; side++) {
                        vec3 blockPos(x, z, y);
                        blockPos += vec3(0.5, 0.5, 0);
                        vec3 offset = offsets[side];
                        Blocks otherBlock = this->getBlock(x + offset.x, y + offset.y, z + offset.z);

                        if (shouldAddSide(block, otherBlock)) {
                            // printf("adding side at %d %d %d\n", x, z, y);

                            quat q = sideRotations[side];

                            int32_t offset = vertices.size() / (3 + 3 + 2);

                            indices.push_back(offset + 0);
                            indices.push_back(offset + 1);
                            indices.push_back(offset + 2);
                            indices.push_back(offset + 1);
                            indices.push_back(offset + 3);
                            indices.push_back(offset + 2);

                            vec3 n = q * vec3(0, 0, 1);

                            int32_t uvIndex = getBlockSideTexture(block, side);
                            vec2 uv = vec2((float)uvIndex * 16.f / 256.f, 0.f);
                            vec2 one_texture_length(16.f / 256.f, 16.f / 16.f);

                            writeVertex(vertices, blockPos + q * vec3(-0.5f, -0.5f, 0.5f), n, uv);
                            writeVertex(vertices, blockPos + q * vec3(0.5f, -0.5f, 0.5f), n,
                                        uv + vec2(one_texture_length.x, 0));
                            writeVertex(vertices, blockPos + q * vec3(-0.5f, 0.5f, 0.5f), n,
                                        uv + vec2(0, one_texture_length.y));
                            writeVertex(vertices, blockPos + q * vec3(0.5f, 0.5f, 0.5f), n, uv + one_texture_length);
                        }
                    }
                }
            }
        }

        void *memory = malloc(vertices.size() * sizeof(float) + indices.size() * sizeof(uint16_t));
        memcpy(memory, vertices.data(), vertices.size() * sizeof(float));
        memcpy((void *)((float *)memory + vertices.size()), indices.data(), indices.size() * sizeof(uint16_t));

        RenderHandle generatedModel = Render::createGeneratedMesh(vertices.size(), indices.size(), memory);
        RenderHandle model = Render::createRenderable(generatedModel, atlasTexture);

        Transformation transform = Transformation(0, 0, 0, 100);
        Render::setTransform(model, transform);

        Render::addRenderable(model);
    }

    auto meshing_total_time = chrono::high_resolution_clock::now() - meshing_start_time;
    printf("%d chunks has been meshed in %lldms\n", (int32_t)context.chunks.size(),
           meshing_total_time / chrono::milliseconds(1));
}