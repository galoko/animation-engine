#include "aquifer.hpp"
#include "noise-chunk.hpp"

// FluidStatus

FluidStatus::FluidStatus() : fluidLevel(numeric_limits<int32_t>::lowest()) {
}

FluidStatus::FluidStatus(int32_t fluidLevel, BlockState fluidType) : fluidLevel(fluidLevel), fluidType(fluidType) {
}

bool FluidStatus::isNull() const {
    return this->fluidLevel == numeric_limits<int32_t>::lowest();
}

BlockState FluidStatus::at(int32_t y) const {
    return y < this->fluidLevel ? this->fluidType : Blocks::AIR;
}

// Aquifer

unique_ptr<Aquifer> Aquifer::createDisabled(shared_ptr<Aquifer::FluidPicker> globalFluidPicker) {
    return make_unique<DisabledAquifer>(globalFluidPicker);
}

unique_ptr<Aquifer> Aquifer::create(shared_ptr<NoiseChunk> noiseChunk, ChunkPos const &chunkPos,
                                    NormalNoise const &barrierNoise, NormalNoise const &fluidLevelFloodednessNoise,
                                    NormalNoise const &fluidLevelSpreadNoise, NormalNoise const &lavaNoise,
                                    shared_ptr<PositionalRandomFactory> positionalRandomFactory, int32_t y,
                                    int32_t height, shared_ptr<Aquifer::FluidPicker> globalFluidPicker) {
    return make_unique<NoiseBasedAquifer>(noiseChunk, chunkPos, barrierNoise, fluidLevelFloodednessNoise,
                                          fluidLevelSpreadNoise, lavaNoise, positionalRandomFactory, y, height,
                                          globalFluidPicker);
}

// DisabledAquifer

DisabledAquifer::DisabledAquifer(shared_ptr<FluidPicker> globalFluidPicker) : globalFluidPicker(globalFluidPicker) {
}

BlockState DisabledAquifer::computeSubstance(int32_t x, int32_t y, int32_t z, double baseNoise,
                                             double clampedBaseNoise) {
    return clampedBaseNoise > 0.0 ? Blocks::NULL_BLOCK : this->globalFluidPicker->computeFluid(x, y, z).at(y);
}

bool DisabledAquifer::shouldScheduleFluidUpdate() {
    return false;
}

// NoiseBasedAquifer

NoiseBasedAquifer::NoiseBasedAquifer(shared_ptr<NoiseChunk> noiseChunk, ChunkPos const &chunkPos,
                                     NormalNoise const &barrierNoise, NormalNoise const &fluidLevelFloodednessNoise,
                                     NormalNoise const &fluidLevelSpreadNoise, NormalNoise const &lavaNoise,
                                     shared_ptr<PositionalRandomFactory> positionalRandomFactory, int32_t y,
                                     int32_t height, shared_ptr<Aquifer::FluidPicker> globalFluidPicker)
    : noiseChunk(noiseChunk), barrierNoise(barrierNoise), fluidLevelFloodednessNoise(fluidLevelFloodednessNoise),
      fluidLevelSpreadNoise(fluidLevelSpreadNoise), lavaNoise(lavaNoise),
      positionalRandomFactory(positionalRandomFactory), globalFluidPicker(globalFluidPicker) {

    this->minGridX = this->gridX(chunkPos.getMinBlockX()) - 1;
    this->minGridY = this->gridY(y) - 1;
    this->minGridZ = this->gridZ(chunkPos.getMinBlockZ()) - 1;

    int32_t maxGridX = this->gridX(chunkPos.getMaxBlockX()) + 1;
    int32_t maxGridY = this->gridY(y + height) + 1;
    int32_t maxGridZ = this->gridZ(chunkPos.getMaxBlockZ()) + 1;

    this->gridSizeX = maxGridX - this->minGridX + 1;
    int32_t gridSizeY = maxGridY - this->minGridY + 1;
    this->gridSizeZ = maxGridZ - this->minGridZ + 1;

    int32_t gridSize = this->gridSizeX * gridSizeY * this->gridSizeZ;

    this->aquiferCache = make_unique<Aquifer::FluidStatus[]>(gridSize);
    // TODO use make_unique_for_overwrite here
    this->aquiferLocationCache = make_unique<int64_t[]>(gridSize);
    fill_n(this->aquiferLocationCache.get(), gridSize, numeric_limits<int64_t>::max());
}

int32_t NoiseBasedAquifer::getIndex(int32_t x, int32_t y, int32_t z) {
    int32_t gridX = x - this->minGridX;
    int32_t gridY = y - this->minGridY;
    int32_t gridZ = z - this->minGridZ;
    return (gridY * this->gridSizeZ + gridZ) * this->gridSizeX + gridX;
}

BlockState NoiseBasedAquifer::computeSubstance(int32_t x, int32_t y, int32_t z, double baseNoise,
                                               double clampedBaseNoise) {
    if (baseNoise <= -64.0) {
        return this->globalFluidPicker->computeFluid(x, y, z).at(y);
    } else {
        if (clampedBaseNoise <= 0.0) {
            Aquifer::FluidStatus fluidStatus = this->globalFluidPicker->computeFluid(x, y, z);
            double clampedMaxPressureMulBySim;
            BlockState blockState;
            bool shouldScheduleFluidUpdate;
            if (fluidStatus.at(y) == Blocks::LAVA) {
                blockState = Blocks::LAVA;
                clampedMaxPressureMulBySim = 0.0;
                shouldScheduleFluidUpdate = false;
            } else {
                int32_t someX = Mth::floorDiv(x - 5, 16);
                int32_t someY = Mth::floorDiv(y + 1, 12);
                int32_t someZ = Mth::floorDiv(z - 5, 16);
                int32_t minDistanceSq0 = numeric_limits<int32_t>::max();
                int32_t minDistanceSq1 = numeric_limits<int32_t>::max();
                int32_t minDistanceSq2 = numeric_limits<int32_t>::max();
                int64_t minLocation0 = 0LL;
                int64_t minLocation1 = 0LL;
                int64_t minLocation2 = 0LL;

                for (int32_t xOffset = 0; xOffset <= 1; ++xOffset) {
                    for (int32_t yOffset = -1; yOffset <= 1; ++yOffset) {
                        for (int32_t zOffset = 0; zOffset <= 1; ++zOffset) {
                            int32_t currentX = someX + xOffset;
                            int32_t currentY = someY + yOffset;
                            int32_t currentZ = someZ + zOffset;
                            int32_t gridIndex = this->getIndex(currentX, currentY, currentZ);
                            int64_t cachedLocation = this->aquiferLocationCache[gridIndex];
                            int64_t location;
                            if (cachedLocation != numeric_limits<int64_t>::max()) {
                                location = cachedLocation;
                            } else {
                                unique_ptr<RandomSource> randomsource =
                                    this->positionalRandomFactory->at(currentX, currentY, currentZ);
                                location = BlockPos::asLong(currentX * 16 + randomsource->nextInt(10),
                                                            currentY * 12 + randomsource->nextInt(9),
                                                            currentZ * 16 + randomsource->nextInt(10));
                                this->aquiferLocationCache[gridIndex] = location;
                            }

                            int32_t dx = BlockPos::getX(location) - x;
                            int32_t dy = BlockPos::getY(location) - y;
                            int32_t dz = BlockPos::getZ(location) - z;
                            int32_t distanceSq = dx * dx + dy * dy + dz * dz;
                            if (minDistanceSq0 >= distanceSq) {
                                minLocation2 = minLocation1;
                                minLocation1 = minLocation0;
                                minLocation0 = location;
                                minDistanceSq2 = minDistanceSq1;
                                minDistanceSq1 = minDistanceSq0;
                                minDistanceSq0 = distanceSq;
                            } else if (minDistanceSq1 >= distanceSq) {
                                minLocation2 = minLocation1;
                                minLocation1 = location;
                                minDistanceSq2 = minDistanceSq1;
                                minDistanceSq1 = distanceSq;
                            } else if (minDistanceSq2 >= distanceSq) {
                                minLocation2 = location;
                                minDistanceSq2 = distanceSq;
                            }
                        }
                    }
                }

                Aquifer::FluidStatus minFluidStatus0 = this->getAquiferStatus(minLocation0);
                Aquifer::FluidStatus minFluidStatus1 = this->getAquiferStatus(minLocation1);
                Aquifer::FluidStatus minFluidStatus2 = this->getAquiferStatus(minLocation2);
                double sim01 = similarity(minDistanceSq0, minDistanceSq1);
                double sim02 = similarity(minDistanceSq0, minDistanceSq2);
                double sim03 = similarity(minDistanceSq1, minDistanceSq2);
                shouldScheduleFluidUpdate = sim01 >= FLOWING_UPDATE_SIMULARITY;
                if (minFluidStatus0.at(y) == Blocks::WATER &&
                    this->globalFluidPicker->computeFluid(x, y - 1, z).at(y - 1) == Blocks::LAVA) {
                    clampedMaxPressureMulBySim = 1.0;
                } else if (sim01 > -1.0) {
                    double barrierNoise = NAN;
                    double pressure01 =
                        this->calculatePressure(x, y, z, barrierNoise, minFluidStatus0, minFluidStatus1);
                    double pressure02 =
                        this->calculatePressure(x, y, z, barrierNoise, minFluidStatus0, minFluidStatus2);
                    double pressure12 =
                        this->calculatePressure(x, y, z, barrierNoise, minFluidStatus1, minFluidStatus2);
                    double clampedSim01 = max(0.0, sim01);
                    double clampedSim02 = max(0.0, sim02);
                    double clampedSim12 = max(0.0, sim03);
                    double maxPressureMulBySim =
                        2.0 * clampedSim01 * max(pressure01, max(pressure02 * clampedSim02, pressure12 * clampedSim12));
                    clampedMaxPressureMulBySim = max(0.0, maxPressureMulBySim);
                } else {
                    clampedMaxPressureMulBySim = 0.0;
                }

                blockState = minFluidStatus0.at(y);
            }

            if (clampedBaseNoise + clampedMaxPressureMulBySim <= 0.0) {
                this->_shouldScheduleFluidUpdate = shouldScheduleFluidUpdate;
                return blockState;
            }
        }

        this->_shouldScheduleFluidUpdate = false;
        return Blocks::NULL_BLOCK;
    }
}

bool NoiseBasedAquifer::shouldScheduleFluidUpdate() {
    return this->_shouldScheduleFluidUpdate;
}

double NoiseBasedAquifer::calculatePressure(int32_t x, int32_t y, int32_t z, double &savedBarrierNoise,
                                            Aquifer::FluidStatus const &fluidStart,
                                            Aquifer::FluidStatus const &fluidEnd) {
    BlockState startBlock = fluidStart.at(y);
    BlockState endBlock = fluidEnd.at(y);
    if ((startBlock != Blocks::LAVA || endBlock != Blocks::WATER) &&
        (startBlock != Blocks::WATER || endBlock != Blocks::LAVA)) {
        int32_t fluidDistance = abs(fluidStart.fluidLevel - fluidEnd.fluidLevel);
        if (fluidDistance == 0) {
            return 0.0;
        } else {
            double fluidMiddleLevel = 0.5 * (double)(fluidStart.fluidLevel + fluidEnd.fluidLevel);
            double distanceAboveFluidMiddleLevel = (double)y + 0.5 - fluidMiddleLevel;
            double halfFluidDistance = (double)fluidDistance / 2.0;
            double distanceToFluidEdge = halfFluidDistance - abs(distanceAboveFluidMiddleLevel);
            double pressure;
            // above middle level
            if (distanceAboveFluidMiddleLevel > 0.0) {
                double shiftedDistanceToFluidEdge = 0.0 + distanceToFluidEdge;
                // before the edge
                if (shiftedDistanceToFluidEdge > 0.0) {
                    pressure = shiftedDistanceToFluidEdge / 1.5;
                } else {
                    // past the edge
                    pressure = shiftedDistanceToFluidEdge / 2.5;
                }
            } else {
                // below middle level
                double shiftedDistanceToFluidEdge = 3.0 + distanceToFluidEdge;
                // before the edge
                if (shiftedDistanceToFluidEdge > 0.0) {
                    pressure = shiftedDistanceToFluidEdge / 3.0;
                } else {
                    // past the edge
                    pressure = shiftedDistanceToFluidEdge / 10.0;
                }
            }

            if (!(pressure < -2.0) && !(pressure > 2.0)) {
                double currentBarrierNoise = savedBarrierNoise;
                if (isnan(currentBarrierNoise)) {
                    double barrierNoise = this->barrierNoise.getValue((double)x, (double)y * 0.5, (double)z);
                    savedBarrierNoise = barrierNoise;
                    return barrierNoise + pressure;
                } else {
                    return currentBarrierNoise + pressure;
                }
            } else {
                return pressure;
            }
        }
    } else {
        return 1.0;
    }
}

int32_t NoiseBasedAquifer::gridX(int32_t x) {
    return Mth::floorDiv(x, NoiseBasedAquifer::X_SPACING);
}

int32_t NoiseBasedAquifer::gridY(int32_t y) {
    return Mth::floorDiv(y, NoiseBasedAquifer::Y_SPACING);
}

int32_t NoiseBasedAquifer::gridZ(int32_t z) {
    return Mth::floorDiv(z, NoiseBasedAquifer::Z_SPACING);
}

Aquifer::FluidStatus NoiseBasedAquifer::getAquiferStatus(int64_t coord) {
    int32_t x = BlockPos::getX(coord);
    int32_t y = BlockPos::getY(coord);
    int32_t z = BlockPos::getZ(coord);
    int32_t gridX = this->gridX(x);
    int32_t gridY = this->gridY(y);
    int32_t gridZ = this->gridZ(z);
    int32_t gridIndex = this->getIndex(gridX, gridY, gridZ);
    Aquifer::FluidStatus fluidStatus = this->aquiferCache[gridIndex];
    if (!fluidStatus.isNull()) {
        return fluidStatus;
    } else {
        Aquifer::FluidStatus fluidStatus = this->computeFluid(x, y, z);
        this->aquiferCache[gridIndex] = fluidStatus;
        return fluidStatus;
    }
}

constexpr int32_t SURFACE_SAMPLING_OFFSETS_IN_CHUNKS[][2] = {
    {-2, -1}, {-1, -1}, {0, -1}, {1, -1}, {-3, 0}, {-2, 0}, {-1, 0}, {0, 0}, {1, 0}, {-2, 1}, {-1, 1}, {0, 1}, {1, 1}};

Aquifer::FluidStatus NoiseBasedAquifer::computeFluid(int32_t x, int32_t y, int32_t z) {
    Aquifer::FluidStatus fluidStatus = this->globalFluidPicker->computeFluid(x, y, z);
    int32_t minSurfaceY = numeric_limits<int32_t>::max();
    int32_t maxY = y + 12;
    int32_t minY = y - 12;
    bool haveFluidAtMaxSurfaceYinPlace = false;

    for (const int32_t(&offset)[2] : SURFACE_SAMPLING_OFFSETS_IN_CHUNKS) {
        int32_t shiftedX = x + SectionPos::sectionToBlockCoord(offset[0]);
        int32_t shiftedZ = z + SectionPos::sectionToBlockCoord(offset[1]);
        int32_t surfaceY = this->noiseChunk->preliminarySurfaceLevel(shiftedX, shiftedZ);
        int32_t maxSurfaceY = surfaceY + 8;
        bool isOffsetInPlace = offset[0] == 0 && offset[1] == 0;
        if (isOffsetInPlace && minY > maxSurfaceY) {
            return fluidStatus;
        }

        bool isMaxSurfaceYinYRange = maxY > maxSurfaceY;
        if (isMaxSurfaceYinYRange || isOffsetInPlace) {
            Aquifer::FluidStatus fluidStatus = this->globalFluidPicker->computeFluid(shiftedX, maxSurfaceY, shiftedZ);
            if (fluidStatus.at(maxSurfaceY) != Blocks::AIR) {
                if (isOffsetInPlace) {
                    haveFluidAtMaxSurfaceYinPlace = true;
                }

                if (isMaxSurfaceYinYRange) {
                    return fluidStatus;
                }
            }
        }

        minSurfaceY = min(minSurfaceY, surfaceY);
    }

    int32_t distanceBetweenMinSurfaceYandYPlus8 = minSurfaceY + 8 - y;
    double t = haveFluidAtMaxSurfaceYinPlace
                   ? Mth::clampedMap((double)distanceBetweenMinSurfaceYandYPlus8, 0.0, 64.0, 1.0, 0.0)
                   : 0.0;
    double floodedness =
        Mth::clamp(this->fluidLevelFloodednessNoise.getValue((double)x, (double)y * 0.67, (double)z), -1.0, 1.0);
    double minFloodedness = Mth::map(t, 1.0, 0.0, -0.3, 0.8);
    if (floodedness > minFloodedness) {
        return fluidStatus;
    } else {
        double someFloodedness = Mth::map(t, 1.0, 0.0, -0.8, 0.4);
        if (floodedness <= someFloodedness) {
            return Aquifer::FluidStatus(DimensionType::WAY_BELOW_MIN_Y, fluidStatus.fluidType);
        } else {
            int32_t scaledX = Mth::floorDiv(x, 16);
            int32_t scaledY = Mth::floorDiv(y, 40);
            int32_t scaledZ = Mth::floorDiv(z, 16);
            int32_t fluidBaseY = scaledY * 40 + 20;
            double fluidLevelSpread =
                this->fluidLevelSpreadNoise.getValue((double)scaledX, (double)scaledY / 1.4, (double)scaledZ) * 10.0;
            int32_t quantizedFluidLevelSpread = Mth::quantize(fluidLevelSpread, 3);
            int32_t fluidY = fluidBaseY + quantizedFluidLevelSpread;
            int32_t fluidLevel = min(minSurfaceY, fluidY);
            BlockState blockstate = this->getFluidType(x, y, z, fluidStatus, fluidY);
            return Aquifer::FluidStatus(fluidLevel, blockstate);
        }
    }
}

BlockState NoiseBasedAquifer::getFluidType(int32_t x, int32_t y, int32_t z, Aquifer::FluidStatus const &fluidStatus,
                                           int32_t fluidY) {
    if (fluidY <= -10) {
        int32_t scaledX = Mth::floorDiv(x, 64);
        int32_t scaledY = Mth::floorDiv(y, 40);
        int32_t scaledZ = Mth::floorDiv(z, 64);
        double lavaNoise = this->lavaNoise.getValue((double)scaledX, (double)scaledY, (double)scaledZ);
        if (abs(lavaNoise) > 0.3) {
            return Blocks::LAVA;
        }
    }

    return fluidStatus.fluidType;
}