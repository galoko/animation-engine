#pragma once

#include "biome-manager.hpp"
#include "blocks.hpp"
#include "noise-data.hpp"
#include "noise/normal-noise.hpp"
#include "pos.hpp"
#include "random.hpp"
#include "surface-rules.hpp"
#include <cinttypes>

class SurfaceSystem : public enable_shared_from_this<SurfaceSystem> {
private:
    BlockState defaultBlock;
    shared_ptr<PositionalRandomFactory> randomFactory;
    NormalNoise surfaceNoise;
    NormalNoise surfaceSecondaryNoise;

public:
    SurfaceSystem(BlockState defaultBlock, int64_t seed, WorldgenRandom::Algorithm randAlgorithm)
        : defaultBlock(defaultBlock),
          randomFactory(WorldgenRandom::Algorithm_newInstance(randAlgorithm, seed)->forkPositional()) {

        this->surfaceNoise = Noises_instantiate(this->randomFactory, Noises::SURFACE);
        this->surfaceSecondaryNoise = Noises_instantiate(this->randomFactory, Noises::SURFACE_SECONDARY);
        objectCreated("SurfaceSystem");
    }

    ~SurfaceSystem() {
        objectFreed("SurfaceSystem");
    }

    void buildSurface(shared_ptr<BiomeManager> biomeManager, WorldGenerationContext generationContext,
                      shared_ptr<ChunkAccess> chunkAccess, shared_ptr<NoiseChunk> noiseChunk,
                      shared_ptr<SurfaceRules::RuleSource> ruleSource);

    int32_t getSurfaceDepth(int32_t x, int32_t z) {
        return this->getSurfaceDepth(this->surfaceNoise, x, z);
    }

    int32_t getSurfaceSecondaryDepth(int32_t x, int32_t z) {
        return this->getSurfaceDepth(this->surfaceSecondaryNoise, x, z);
    }

    int32_t getSurfaceDepth(NormalNoise noise, int32_t x, int32_t z) {
        return (int32_t)(noise.getValue((double)x, 0.0, (double)z) * 2.75 + 3.0 +
                         this->randomFactory->at(x, 0, z)->nextDouble() * 0.25);
    }

private:
    bool isStone(BlockState blockState) {
        return blockState != Blocks::AIR && blockState != Blocks::WATER;
    }
};