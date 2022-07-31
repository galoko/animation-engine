#include <emscripten.h>
#include <memory>
#include <stdio.h>

#include "surface-generation/biomes/aquifer.hpp"
#include "surface-generation/biomes/biome-source.hpp"
#include "surface-generation/biomes/chunk-generator.hpp"
#include "surface-generation/biomes/chunk-status.hpp"
#include "surface-generation/biomes/chunks.hpp"
#include "surface-generation/biomes/climate.hpp"
#include "surface-generation/biomes/cubic-spline.hpp"
#include "surface-generation/biomes/heightmap.hpp"
#include "surface-generation/biomes/memory-debug.hpp"
#include "surface-generation/biomes/noise-chunk.hpp"
#include "surface-generation/biomes/noise-data.hpp"
#include "surface-generation/biomes/noise/blended-noise.hpp"
#include "surface-generation/biomes/noise/improved-noise.hpp"
#include "surface-generation/biomes/noise/normal-noise.hpp"
#include "surface-generation/biomes/noise/perlin-noise.hpp"
#include "surface-generation/biomes/noise/perlin-simplex-noise.hpp"
#include "surface-generation/biomes/noise/simplex-noise.hpp"
#include "surface-generation/biomes/overworld-biome-builder.hpp"
#include "surface-generation/biomes/pos.hpp"
#include "surface-generation/biomes/random.hpp"
#include "surface-generation/biomes/terrain-shaper.hpp"
#include "surface-generation/biomes/worldgen-settings.hpp"

using namespace Mth;
using namespace std;

#pragma GCC diagnostic push
#pragma GCC diagnostic ignored "-Wunused-variable"

SimpleLevelHeightAccessor heightAccessor = SimpleLevelHeightAccessor();

shared_ptr<ProtoChunk> doTest2() {
    int64_t seed = hashCode("test");

    shared_ptr<NoiseBasedChunkGenerator> chunkGenerator = WorldGenSettings::makeDefaultOverworld(seed);

    ChunkPos chunkPos = ChunkPos(1, 0);
    shared_ptr<ProtoChunk> chunk = make_shared<ProtoChunk>(chunkPos, heightAccessor);

    ChunkStatus::BIOMES.generate(chunkGenerator, ChunkStatus::EMPTY_CONVERTER, {chunk});
    ChunkStatus::NOISE.generate(chunkGenerator, ChunkStatus::EMPTY_CONVERTER, {chunk});

    return chunk;
}

uint8_t *doTest() {
    shared_ptr<ProtoChunk> chunk = nullptr;

    for (int i = 0; i < 5; i++) {
        chunk = doTest2();
    }

    uint8_t *result = new uint8_t[16 * 16 * 384];
    MutableBlockPos pos = MutableBlockPos();
    int i = 0;
    for (int y = -64; y < 256; y++) {
        for (int x = 0; x < 16; x++) {
            for (int z = 0; z < 16; z++) {
                pos.set(x, y, z);
                BlockState block = chunk->getBlockState(pos);
                result[i++] = (uint8_t)block;
            }
        }
    }

    return result;
}

extern "C" {
    void init() {
        //
    }

    uint8_t *test() {
        printf("enter\n");

        uint8_t *blocks = doTest();

        printf("exit\n");

        return blocks;
    }

    // gets an exception object, and prints it out.
    void print_exception(int32_t exceptionPtr) {
        auto e = reinterpret_cast<exception *>(exceptionPtr);
        printf("%s\n", e->what());
    }

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

#pragma GCC diagnostic pop