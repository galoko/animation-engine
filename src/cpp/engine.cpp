#ifdef __EMSCRIPTEN__
#include <emscripten.h>
#endif
#include <memory>
#include <stdio.h>

#include "surface-generation/biomes/aquifer.hpp"
#include "surface-generation/biomes/biome-source.hpp"
#include "surface-generation/biomes/blocks.hpp"
#include "surface-generation/biomes/chunk-generator.hpp"
#include "surface-generation/biomes/chunk-status.hpp"
#include "surface-generation/biomes/chunks.hpp"
#include "surface-generation/biomes/memory-debug.hpp"
#include "surface-generation/biomes/noise-chunk.hpp"
#include "surface-generation/biomes/overworld-biome-builder.hpp"
#include "surface-generation/biomes/pos.hpp"
#include "surface-generation/biomes/worldgen-settings.hpp"
#include "template-1-0.hpp"

using namespace Mth;
using namespace std;

#ifndef _MSC_VER
#pragma GCC diagnostic push
#pragma GCC diagnostic ignored "-Wunused-variable"
#endif

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

    saveTestResult(chunk);
}

extern "C" {
    void init() {
        // nothing for now
    }

    void test() {
        doTest();
    }

    bool check() {
        bool result = compareChunkWithTemplate();
        return result;
    }

#ifdef __EMSCRIPTEN__
    // gets an exception object, and prints it out.
    void print_exception(int32_t exceptionPtr) {
        auto e = reinterpret_cast<exception *>(exceptionPtr);
        printf("%s\n", e->what());
    }
#endif

    void print_memory_stats() {
        printMemoryStats();
    }

    void finalize() {
        ChunkStatus::finalize();
        NoiseGeneratorSettings::finalize();
        MultiNoiseBiomeSource::Preset::finalize();
        Noises_finalize();
    }
}

#ifndef _MSC_VER
#pragma GCC diagnostic pop
#endif