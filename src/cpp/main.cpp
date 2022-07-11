#include <emscripten.h>
#include <stdio.h>

#include "surface-generation/biomes/aquifer.cpp"
#include "surface-generation/biomes/biome-source.cpp"
#include "surface-generation/biomes/chunk-generator.cpp"
#include "surface-generation/biomes/chunk-status.cpp"
#include "surface-generation/biomes/chunks.cpp"
#include "surface-generation/biomes/mth.cpp"
#include "surface-generation/biomes/noise-chunk.cpp"
#include "surface-generation/biomes/noise-data.cpp"
#include "surface-generation/biomes/pos.cpp"
#include "surface-generation/biomes/random.cpp"

#include "surface-generation/biomes/aquifer.hpp"
#include "surface-generation/biomes/biome-source.hpp"
#include "surface-generation/biomes/chunk-generator.hpp"
#include "surface-generation/biomes/chunk-status.hpp"
#include "surface-generation/biomes/chunks.hpp"
#include "surface-generation/biomes/climate.hpp"
#include "surface-generation/biomes/cubic-spline.hpp"
#include "surface-generation/biomes/heightmap.hpp"
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

uint8_t *doTest() {
    int64_t seed = hashCode("test");

    NoiseBasedChunkGenerator *chunkGenerator = WorldGenSettings::makeDefaultOverworld(seed);
    LevelHeightAccessor *heightAccessor = new SimpleLevelHeightAccessor();

    ChunkPos *chunkPos = new ChunkPos(1, 0);
    ProtoChunk *chunk = new ProtoChunk(chunkPos, heightAccessor);

    ChunkStatus::BIOMES->generate(chunkGenerator, ChunkStatus::EMPTY_CONVERTER, {chunk});
    ChunkStatus::NOISE->generate(chunkGenerator, ChunkStatus::EMPTY_CONVERTER, {chunk});

    uint8_t *result = new uint8_t[16 * 16 * 384];
    MutableBlockPos *pos = new MutableBlockPos();
    int i = 0;
    for (int y = -64; y < 256; y++) {
        for (int x = 0; x < 16; x++) {
            for (int z = 0; z < 16; z++) {
                pos->set(x, y, z);
                BlockState block = chunk->getBlockState(pos);
                result[i++] = (uint8_t)block;
            }
        }
    }

    /*
    uint8_t *result = new uint8_t[4 * 4 * 96];
    MutableBlockPos *pos = new MutableBlockPos();
    int i = 0;
    for (int y = -64 / 4; y < 256 / 4; y++) {
        for (int x = 0; x < 4; x++) {
            for (int z = 0; z < 4; z++) {
                pos->set(x * 4, y * 4, z * 4);
                Biomes biome = chunk->getBiome(pos);
                result[i++] = (uint8_t)biome;
            }
        }
    }
    */

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
}

#pragma GCC diagnostic pop