#include "biome-generation-settings.hpp"
#include "carvers.hpp"
#include "chunks.hpp"

shared_ptr<WorldCarver> WorldCarver::CAVE;
shared_ptr<WorldCarver> WorldCarver::CANYON;

void WorldCarver::init() {
    WorldCarver::CAVE = make_shared<CaveWorldCarver>();
    WorldCarver::CANYON = make_shared<CanyonWorldCarver>();
}

void WorldCarver::free() {
    //
}

bool WorldCarver::carveEllipsoid(CarvingContext &context, shared_ptr<CarverConfiguration> config,
                                 shared_ptr<ChunkAccess> chunk, shared_ptr<BiomeManager> biomeManager,
                                 shared_ptr<Aquifer> aquifer, double ellipseX, double ellipseY, double ellipseZ,
                                 double range, double heightRange, shared_ptr<CarvingMask> mask,
                                 CarveSkipChecker checker) {
    ChunkPos chunkPos = chunk->getPos();
    double chunkMiddleX = (double)chunkPos.getMiddleBlockX();
    double chunkMiddleZ = (double)chunkPos.getMiddleBlockZ();
    double maxRange = 16.0 + range * 2.0;
    if (!(std::abs(ellipseX - chunkMiddleX) > maxRange) && !(std::abs(ellipseZ - chunkMiddleZ) > maxRange)) {
        int32_t minX = chunkPos.getMinBlockX();
        int32_t minZ = chunkPos.getMinBlockZ();

        int32_t xFrom = std::max(Mth::floor(ellipseX - range) - minX - 1, 0);
        int32_t xTo = std::min(Mth::floor(ellipseX + range) - minX, 15);

        int32_t yFrom = std::max(Mth::floor(ellipseY - heightRange) - 1, context.getMinGenY() + 1);
        int32_t upgradeOffset = 7;
        int32_t yTo = std::min(Mth::floor(ellipseY + heightRange) + 1,
                               context.getMinGenY() + context.getGenDepth() - 1 - upgradeOffset);

        int32_t zFrom = std::max(Mth::floor(ellipseZ - range) - minZ - 1, 0);
        int32_t zTo = std::min(Mth::floor(ellipseZ + range) - minZ, 15);

        bool carved = false;
        MutableBlockPos blockPosToCarve;

        for (int32_t x = xFrom; x <= xTo; ++x) {
            int32_t worldX = chunkPos.getBlockX(x);
            double normalizedX = ((double)worldX + 0.5 - ellipseX) / range;

            for (int32_t z = zFrom; z <= zTo; ++z) {
                int32_t worldZ = chunkPos.getBlockZ(z);
                double normalizedZ = ((double)worldZ + 0.5 - ellipseZ) / range;
                if (!(normalizedX * normalizedX + normalizedZ * normalizedZ >= 1.0)) {
                    bool carvedGrass = false;

                    for (int32_t y = yTo; y > yFrom; --y) {
                        double normalizedY = ((double)y - 0.5 - ellipseY) / heightRange;

                        if (!checker(context, normalizedX, normalizedY, normalizedZ, y) && (!mask->get(x, y, z))) {
                            mask->set(x, y, z);
                            blockPosToCarve.set(worldX, y, worldZ);
                            carved |= this->carveBlock(context, config, chunk, biomeManager, mask, blockPosToCarve,
                                                       aquifer, &carvedGrass);
                        }
                    }
                }
            }
        }

        return carved;
    } else {
        return false;
    }
}

BlockState WorldCarver::getCarveState(CarvingContext &context, shared_ptr<CarverConfiguration> config,
                                      BlockPos blockPos, shared_ptr<Aquifer> aquifer) {
    if (blockPos.getY() <= config->lavaLevel->resolveY(context)) {
        return Blocks::LAVA;
    } else {
        BlockState blockState = aquifer->computeSubstance(blockPos.getX(), blockPos.getY(), blockPos.getZ(), 0.0, 0.0);
        return blockState;
    }
}

bool WorldCarver::carveBlock(CarvingContext &context, shared_ptr<CarverConfiguration> config,
                             shared_ptr<ChunkAccess> chunk, shared_ptr<BiomeManager> biomeManager,
                             shared_ptr<CarvingMask> mask, MutableBlockPos blockPosToCarve, shared_ptr<Aquifer> aquifer,
                             bool *carvedGrass) {
    BlockState blockState = chunk->getBlockState(blockPosToCarve);
    if (blockState == Blocks::GRASS_BLOCK || blockState == Blocks::MYCELIUM) {
        *carvedGrass = true;
    }

    if (!this->canReplaceBlock(blockState)) {
        return false;
    } else {
        BlockState liquidBlock = this->getCarveState(context, config, blockPosToCarve, aquifer);
        if (liquidBlock == Blocks::NULL_BLOCK) {
            return false;
        } else {
            chunk->setBlockState(blockPosToCarve, liquidBlock, false);
            /*
            if (aquifer.shouldScheduleFluidUpdate() && !liquidBlock.getFluidState().isEmpty()) {
                chunk->markPosForPostprocessing(blockPosToCarve);
            }
            */

            if (*carvedGrass) {
                MutableBlockPos blockUnderPos(blockPosToCarve.getX(), blockPosToCarve.getY() - 1,
                                              blockPosToCarve.getZ());
                if (chunk->getBlockState(blockUnderPos) == Blocks::DIRT) {
                    Blocks topMaterial = context.topMaterial(biomeManager, chunk, blockUnderPos,
                                                             true /*!liquidBlock.getFluidState().isEmpty()*/);

                    chunk->setBlockState(blockUnderPos, topMaterial, false);
                    /*
                    if (!topMaterial.getFluidState().isEmpty()) {
                        chunk->markPosForPostprocessing(blockUnderPos);
                    }
                    */
                }
            }

            return true;
        }
    }
}