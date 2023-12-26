#include "test.hpp"

#include "../surface-generation/biomes/blocks.hpp"
#include "../surface-generation/biomes/chunk-generator.hpp"
#include "../surface-generation/biomes/chunk-status.hpp"
#include "../surface-generation/biomes/chunks.hpp"
#include "../surface-generation/biomes/pos.hpp"
#include "../surface-generation/biomes/worldgen-settings.hpp"

#include "template-1-0.hpp"

uint8_t RESULT[16 * 16 * 384];

bool compareChunkWithTemplate() {
    bool ok = true;
    int i = 0;
    for (int y = -64; y < 256; y++) {
        for (int x = 0; x < 16; x++) {
            for (int z = 0; z < 16; z++) {
                auto block = blockToStr((BlockState)RESULT[i]);
                auto templateBlock = BLOCKS[i];
                i++;
                if (strcmp(block, templateBlock) != 0) {
                    ok = false;
                    break;
                }
            }
        }
    }

    return ok;
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

    ChunkPos chunkPos = ChunkPos(1, 0);
    shared_ptr<ProtoChunk> chunk = make_shared<ProtoChunk>(chunkPos, heightAccessor);

    ChunkStatus::BIOMES.generate(chunkGenerator, ChunkStatus::EMPTY_CONVERTER, {chunk});
    ChunkStatus::NOISE.generate(chunkGenerator, ChunkStatus::EMPTY_CONVERTER, {chunk});
    ChunkStatus::SURFACE.generate(chunkGenerator, ChunkStatus::EMPTY_CONVERTER, {chunk});

    saveTestResult(chunk);
}