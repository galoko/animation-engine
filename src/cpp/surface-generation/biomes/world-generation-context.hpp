#pragma once

#include <cinttypes>
#include <memory>

#include "chunk-generator.fwd.hpp"
#include "chunks.fwd.hpp"

using namespace std;

class WorldGenerationContext {
private:
    int32_t minY, height;

public:
    WorldGenerationContext(shared_ptr<ChunkGenerator> chunkGenerator, const LevelHeightAccessor &heightAccessor);
    int32_t getMinGenY() const;
    int32_t getGenDepth() const;
};