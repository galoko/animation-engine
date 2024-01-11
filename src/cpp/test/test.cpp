#include "test.hpp"

#include <chrono>
#include <iostream>

#include "../surface-generation/biomes/blocks.hpp"
#include "../surface-generation/biomes/chunk-generator.hpp"
#include "../surface-generation/biomes/chunk-status.hpp"
#include "../surface-generation/biomes/chunks.hpp"
#include "../surface-generation/biomes/pos.hpp"
#include "../surface-generation/biomes/worldgen-region.hpp"
#include "../surface-generation/biomes/worldgen-settings.hpp"

#include "template-8-24-surface.hpp"

using namespace std;

uint8_t RESULT[16 * 16 * 384];

bool compareChunkWithTemplate() {
    int nonMatch = 0;
    int i = 0;
    for (int y = -64; y < 256; y++) {
        for (int x = 0; x < 16; x++) {
            for (int z = 0; z < 16; z++) {
                auto block = blockToStr((BlockState)RESULT[i]);
                auto templateBlock = BLOCKS[i];
                i++;
                if (strcmp(block, templateBlock) != 0) {
                    nonMatch++;
                    // printf("non matched block at %d %d %d, template: %s, ours: %s\n", x, y, z, templateBlock, block);
                    // return false;
                }
            }
        }
    }

    return nonMatch == 0;
}

void saveTestResult(shared_ptr<ProtoChunk> chunk) {
    int i = 0;
    MutableBlockPos pos = MutableBlockPos();
    for (int y = -64; y < 256; y++) {
        for (int x = 0; x < 16; x++) {
            for (int z = 0; z < 16; z++) {
                pos.set(x, y, z);
                BlockState block = chunk->getBlockState(pos);
                RESULT[i++] = (uint8_t)block;
            }
        }
    }
}

void doTest() {
    int64_t seed = hashCode("test");

    shared_ptr<NoiseBasedChunkGenerator> chunkGenerator = WorldGenSettings::makeDefaultOverworld(seed);

    SimpleLevelHeightAccessor heightAccessor = SimpleLevelHeightAccessor();

    ChunkPos chunkPos = ChunkPos(8, 24);
    shared_ptr<ProtoChunk> chunk = make_shared<ProtoChunk>(chunkPos, heightAccessor);

    vector<shared_ptr<ChunkAccess>> cache = {chunk};
    shared_ptr<WorldGenRegion> region = make_shared<WorldGenRegion>(chunkGenerator, cache);
    region->init(seed);
    chunkGenerator->region = region;

    auto start_time = chrono::high_resolution_clock::now();
    ChunkStatus::BIOMES.generate(chunkGenerator, ChunkStatus::EMPTY_CONVERTER, cache);
    auto end_time = std::chrono::high_resolution_clock::now();
    auto time = end_time - start_time;
    cout << "biomes took " << time / std::chrono::milliseconds(1) << "ms to run.\n";

    start_time = chrono::high_resolution_clock::now();
    ChunkStatus::NOISE.generate(chunkGenerator, ChunkStatus::EMPTY_CONVERTER, cache);
    end_time = std::chrono::high_resolution_clock::now();
    time = end_time - start_time;
    cout << "noise took " << time / std::chrono::milliseconds(1) << "ms to run.\n";

    start_time = chrono::high_resolution_clock::now();
    ChunkStatus::SURFACE.generate(chunkGenerator, ChunkStatus::EMPTY_CONVERTER, cache);
    end_time = std::chrono::high_resolution_clock::now();
    time = end_time - start_time;
    cout << "surface took " << time / std::chrono::milliseconds(1) << "ms to run.\n";

    saveTestResult(chunk);
}