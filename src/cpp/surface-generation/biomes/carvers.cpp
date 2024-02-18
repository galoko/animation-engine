#include "carvers.hpp"

#include "chunk-generator.hpp"

CarvingContext::CarvingContext(shared_ptr<ChunkGenerator> chunkGenerator, const LevelHeightAccessor &heightAccessor,
                               shared_ptr<NoiseChunk> noiseChunk)
    : WorldGenerationContext(chunkGenerator, heightAccessor), generator(chunkGenerator), noiseChunk(noiseChunk) {
}

Blocks CarvingContext::topMaterial(shared_ptr<BiomeManager> biomeManager, shared_ptr<ChunkAccess> chunk,
                                   BlockPos blockPos, bool useWaterHeight) {
    return this->generator->topMaterial(*this, biomeManager, chunk, this->noiseChunk, blockPos, useWaterHeight);
}