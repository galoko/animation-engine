#include "surface-system.hpp"

void SurfaceSystem::buildSurface(shared_ptr<BiomeManager> biomeManager, WorldGenerationContext generationContext,
                                 shared_ptr<ChunkAccess> chunkAccess, shared_ptr<NoiseChunk> noiseChunk,
                                 shared_ptr<SurfaceRules::RuleSource> ruleSource) {
    MutableBlockPos columnPos;
    ChunkPos chunkPos = chunkAccess->getPos();
    int32_t startX = chunkPos.getMinBlockX();
    int32_t startZ = chunkPos.getMinBlockZ();

    auto getBlock = [chunkAccess, &columnPos](int32_t y) -> BlockState {
        return chunkAccess->getBlockState(columnPos.setY(y));
    };

    auto setBlock = [chunkAccess, &columnPos](int32_t y, BlockState blockState) -> void {
        const LevelHeightAccessor &levelHeightAccessor = chunkAccess->getHeightAccessorForGeneration();
        if (y >= levelHeightAccessor.getMinBuildHeight() && y < levelHeightAccessor.getMaxBuildHeight()) {
            chunkAccess->setBlockState(columnPos.setY(y), blockState, false);
            /*
            if (!blockState.getFluidState().isEmpty()) {
                chunkAccess->markPosForPostprocessing(columnPos);
            }
            */
        }
    };

    shared_ptr<SurfaceRules::Context> context = make_shared<SurfaceRules::Context>(
        this->shared_from_this(), chunkAccess, noiseChunk, biomeManager, generationContext);
    context->init();

    shared_ptr<SurfaceRules::SurfaceRule> surfaceRule = ruleSource->apply(context);
    MutableBlockPos blockPos;

    for (int32_t offsetX = 0; offsetX < 16; ++offsetX) {
        for (int32_t offsetZ = 0; offsetZ < 16; ++offsetZ) {
            int32_t x = startX + offsetX;
            int32_t z = startZ + offsetZ;

            int32_t maxY = chunkAccess->getHeight(HeightmapTypes::WORLD_SURFACE_WG, offsetX, offsetZ) + 1;

            columnPos.setX(x).setZ(z);

            context->updateXZ(x, z);

            int32_t startY = 0;
            int32_t waterY = numeric_limits<int32_t>::min();
            int32_t beforeStoneY = numeric_limits<int32_t>::max();
            int32_t minY = chunkAccess->getMinBuildHeight();

            for (int32_t y = maxY; y >= minY; --y) {
                BlockState blockState = getBlock(y);
                if (blockState == Blocks::AIR) {
                    startY = 0;
                    waterY = numeric_limits<int32_t>::min();
                } else if (blockState == Blocks::WATER) {
                    if (waterY == numeric_limits<int32_t>::min()) {
                        waterY = y + 1;
                    }
                } else {
                    if (beforeStoneY >= y) {
                        beforeStoneY = DimensionType::WAY_BELOW_MIN_Y;

                        for (int32_t currentY = y - 1; currentY >= minY - 1; --currentY) {
                            BlockState blockState = getBlock(currentY);
                            if (!this->isStone(blockState)) {
                                beforeStoneY = currentY + 1;
                                break;
                            }
                        }
                    }

                    ++startY;
                    int32_t countY = y - beforeStoneY + 1;
                    context->updateY(startY, countY, waterY, x, y, z);
                    if (blockState == this->defaultBlock) {
                        BlockState blockState = surfaceRule->tryApply(x, y, z);
                        if (blockState != BlockState::NULL_BLOCK) {
                            setBlock(y, blockState);
                        }
                    }
                }
            }
        }
    }
}