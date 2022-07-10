#include "chunk-generator.hpp"
#include "heightmap.hpp"

Blender *Blender::EMPTY = new Blender();

NoiseGeneratorSettings *NoiseGeneratorSettings::OVERWORLD = NoiseGeneratorSettings::overworld(false, false);
NoiseGeneratorSettings *NoiseGeneratorSettings::LARGE_BIOMES = NoiseGeneratorSettings::overworld(false, true);
NoiseGeneratorSettings *NoiseGeneratorSettings::AMPLIFIED = NoiseGeneratorSettings::overworld(true, false);
NoiseGeneratorSettings *NoiseGeneratorSettings::NETHER = NoiseGeneratorSettings::nether();
NoiseGeneratorSettings *NoiseGeneratorSettings::END = NoiseGeneratorSettings::end();
NoiseGeneratorSettings *NoiseGeneratorSettings::CAVES = NoiseGeneratorSettings::caves();
NoiseGeneratorSettings *NoiseGeneratorSettings::FLOATING_ISLANDS = NoiseGeneratorSettings::floatingIslands();

ChunkAccess *NoiseBasedChunkGenerator::doFill(Blender *blender, ChunkAccess *chunkAccess, int32_t minCellY,
                                              int32_t cellCount) {
    NoiseGeneratorSettings *settings = this->settings();
    NoiseChunk *noiseChunk = chunkAccess->getOrCreateNoiseChunk(
        this->sampler, [chunkAccess]() -> NoiseFiller { return makeBeardifier(chunkAccess); }, settings,
        this->globalFluidPicker, blender);

    Heightmap *oceanFloorHeightMap = chunkAccess->getOrCreateHeightmapUnprimed(HeightmapTypes::OCEAN_FLOOR_WG);
    Heightmap *worldSurfaceHeightMap = chunkAccess->getOrCreateHeightmapUnprimed(HeightmapTypes::WORLD_SURFACE_WG);

    ChunkPos *chunkPos = chunkAccess->getPos();
    int32_t x = chunkPos->getMinBlockX();
    int32_t z = chunkPos->getMinBlockZ();

    noiseChunk->initializeForFirstCellX();

    // Aquifer *aquifer = noiseChunk->aquifer();
    // MutableBlockPos *pos = new MutableBlockPos();

    NoiseSettings *noiseSettings = settings->noiseSettings();

    int32_t cellWidth = noiseSettings->getCellWidth();
    int32_t cellHeight = noiseSettings->getCellHeight();
    int32_t cellCountX = 16 / cellWidth;
    int32_t cellCountZ = 16 / cellWidth;

    for (int32_t cellX = 0; cellX < cellCountX; ++cellX) {
        noiseChunk->advanceCellX(cellX);

        for (int32_t cellZ = 0; cellZ < cellCountZ; ++cellZ) {
            LevelChunkSection *section = chunkAccess->getSection(chunkAccess->getSectionsCount() - 1);

            for (int32_t cellY = cellCount - 1; cellY >= 0; --cellY) {
                noiseChunk->selectCellYZ(cellY, cellZ);

                for (int32_t yOffset = cellHeight - 1; yOffset >= 0; --yOffset) {
                    int32_t currentY = (minCellY + cellY) * cellHeight + yOffset;
                    int32_t yForSection = currentY & 15;
                    int32_t sectionIndex = chunkAccess->getSectionIndex(currentY);
                    if (chunkAccess->getSectionIndex(section->bottomBlockY()) != sectionIndex) {
                        section = chunkAccess->getSection(sectionIndex);
                    }

                    double yt = (double)yOffset / (double)cellHeight;
                    noiseChunk->updateForY(yt);

                    for (int32_t xOffset = 0; xOffset < cellWidth; ++xOffset) {
                        int32_t currentX = x + cellX * cellWidth + xOffset;
                        int32_t xForSection = currentX & 15;
                        double xt = (double)xOffset / (double)cellWidth;
                        noiseChunk->updateForX(xt);

                        for (int32_t zOffset = 0; zOffset < cellWidth; ++zOffset) {
                            int32_t currentZ = z + cellZ * cellWidth + zOffset;
                            int32_t zForSection = currentZ & 15;
                            double zt = (double)zOffset / (double)cellWidth;
                            noiseChunk->updateForZ(zt);

                            if (section->bottomBlockY() == -64 && yForSection == 0) {
                                noiseChunk = noiseChunk;
                            }

                            BlockState blockState = this->materialRule(noiseChunk, currentX, currentY, currentZ);
                            if (blockState == Blocks::NULL_BLOCK) {
                                blockState = this->defaultBlock;
                            }

                            if (blockState != AIR) {
                                /*
                                if (blockState.getLightEmission() != 0 && chunkAccess instanceof ProtoChunk) {
                                    pos.set(currentX, currentY, currentZ);
                                    ((ProtoChunk)chunkAccess).addLight(pos);
                                }
                                */

                                section->setBlockState(xForSection, yForSection, zForSection, blockState, false);
                                oceanFloorHeightMap->update(xForSection, currentY, zForSection, blockState);
                                worldSurfaceHeightMap->update(xForSection, currentY, zForSection, blockState);

                                /*
                                if (aquifer.shouldScheduleFluidUpdate() && !blockState.getFluidState().isEmpty()) {
                                    pos.set(currentX, currentY, currentZ);
                                    chunkAccess->markPosForPostprocessing(pos);
                                }
                                */
                            }
                        }
                    }
                }
            }
        }

        noiseChunk->swapSlices();
    }

    return chunkAccess;
}