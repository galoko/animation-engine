#include "world-generation-context.hpp"

#include "chunk-generator.hpp"
#include "chunks.hpp"

WorldGenerationContext::WorldGenerationContext(shared_ptr<ChunkGenerator> chunkGenerator,
                                               const LevelHeightAccessor &heightAccessor) {
    this->minY = std::max(heightAccessor.getMinBuildHeight(), chunkGenerator->getMinY());
    this->height = std::min(heightAccessor.getHeight(), chunkGenerator->getGenDepth());
}

int32_t WorldGenerationContext::getMinGenY() const {
    return this->minY;
}

int32_t WorldGenerationContext::getGenDepth() const {
    return this->height;
}