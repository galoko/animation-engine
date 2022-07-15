#include "noise-chunk.hpp"
#include "chunk-generator.hpp"
#include "mth.hpp"

// ConstantSampler

ConstantSampler::ConstantSampler(double value) {
    this->value = value;
}

double ConstantSampler::sample() {
    return this->value;
}

// NoiseChunk

NoiseChunk *NoiseChunk::forChunk(ChunkAccess *chunkAccess, NoiseSampler *sampler,
                                 function<NoiseChunk::NoiseFiller(void)> filler,
                                 NoiseGeneratorSettings *generatorSettings, Aquifer::FluidPicker *fluidPicker,
                                 Blender *blender) {
    ChunkPos *chunkpos = chunkAccess->getPos();
    NoiseSettings *noisesettings = generatorSettings->noiseSettings();
    int32_t minY = max(noisesettings->minY, chunkAccess->getMinBuildHeight());
    int32_t maxY = min(noisesettings->minY + noisesettings->height, chunkAccess->getMaxBuildHeight());
    int32_t cellMinY = Mth::intFloorDiv(minY, noisesettings->getCellHeight());
    int32_t cellCountY = Mth::intFloorDiv(maxY - minY, noisesettings->getCellHeight());
    return new NoiseChunk(16 / noisesettings->getCellWidth(), cellCountY, cellMinY, sampler, chunkpos->getMinBlockX(),
                          chunkpos->getMinBlockZ(), filler(), generatorSettings, fluidPicker, blender);
}

NoiseChunk *NoiseChunk::forColumn(int32_t startX, int32_t startZ, int32_t cellNoiseMinY, int32_t cellCountY,
                                  NoiseSampler *sampler, NoiseGeneratorSettings *noiseSettings,
                                  Aquifer::FluidPicker *fluidPicker) {
    return new NoiseChunk(
        1, cellCountY, cellNoiseMinY, sampler, startX, startZ,
        [](int32_t x, int32_t y, int32_t z) -> double { return 0.0; }, noiseSettings, fluidPicker, Blender::empty());
}

NoiseChunk::NoiseChunk(int32_t cellCountXZ, int32_t cellCountY, int32_t cellNoiseMinY, NoiseSampler *sampler,
                       int32_t startX, int32_t startZ, NoiseChunk::NoiseFiller filler,
                       NoiseGeneratorSettings *noiseSettings, Aquifer::FluidPicker *fluidPicker, Blender *blender) {
    this->noiseSettings = noiseSettings->noiseSettings();
    this->cellCountXZ = cellCountXZ;
    this->cellCountY = cellCountY;
    this->cellNoiseMinY = cellNoiseMinY;
    this->sampler = sampler;
    int32_t cellWidth = this->noiseSettings->getCellWidth();
    this->firstCellX = Mth::floorDiv(startX, cellWidth);
    this->firstCellZ = Mth::floorDiv(startZ, cellWidth);
    this->interpolators = vector<NoiseChunk::NoiseInterpolator *>();
    this->firstNoiseX = QuartPos::fromBlock(startX);
    this->firstNoiseZ = QuartPos::fromBlock(startZ);
    int32_t countXZ = QuartPos::fromBlock(cellCountXZ * cellWidth);
    this->_noiseData = vector<FlatNoiseData **>(countXZ + 1);
    this->blender = blender;

    for (int32_t offsetX = 0; offsetX <= countXZ; ++offsetX) {
        int32_t x = this->firstNoiseX + offsetX;
        this->_noiseData[offsetX] = new FlatNoiseData *[countXZ + 1];

        for (int32_t offsetZ = 0; offsetZ <= countXZ; ++offsetZ) {
            int32_t z = this->firstNoiseZ + offsetZ;
            this->_noiseData[offsetX][offsetZ] = sampler->noiseData(x, z, blender);
        }
    }

    this->_aquifer = sampler->createAquifer(this, startX, startZ, cellNoiseMinY, cellCountY, fluidPicker,
                                            noiseSettings->isAquifersEnabled());
    this->baseNoise = sampler->makeBaseNoiseFiller(this, filler, noiseSettings->isNoodleCavesEnabled());
    this->oreVeins = sampler->makeOreVeinifier(this, noiseSettings->isOreVeinsEnabled());
}

FlatNoiseData *NoiseChunk::noiseData(int32_t x, int32_t z) {
    return this->_noiseData[x - this->firstNoiseX][z - this->firstNoiseZ];
}

int32_t NoiseChunk::preliminarySurfaceLevel(int32_t x, int32_t z) {
    return computeIfAbsent<int64_t, int32_t>(
        this->_preliminarySurfaceLevel, ChunkPos::asLong(QuartPos::fromBlock(x), QuartPos::fromBlock(z)),
        [this](int64_t loc) -> int32_t { return this->computePreliminarySurfaceLevel(loc); });
}

int32_t NoiseChunk::computePreliminarySurfaceLevel(int64_t loc) {
    int32_t i = ChunkPos::getX(loc);
    int32_t j = ChunkPos::getZ(loc);
    int32_t k = i - this->firstNoiseX;
    int32_t l = j - this->firstNoiseZ;
    int32_t i1 = this->_noiseData.size();
    TerrainInfo *terraininfo;
    if (k >= 0 && l >= 0 && k < i1 && l < i1) {
        terraininfo = this->_noiseData[k][l]->terrainInfo;
    } else {
        terraininfo = this->sampler->noiseData(i, j, this->blender)->terrainInfo;
    }

    return this->sampler->getPreliminarySurfaceLevel(QuartPos::toBlock(i), QuartPos::toBlock(j), terraininfo);
}

NoiseChunk::NoiseInterpolator *NoiseChunk::createNoiseInterpolator(NoiseChunk::NoiseFiller noiseFiller) {
    return new NoiseChunk::NoiseInterpolator(this, noiseFiller);
}

Blender *NoiseChunk::getBlender() {
    return this->blender;
}

void NoiseChunk::initializeForFirstCellX() {
    for (NoiseChunk::NoiseInterpolator *&interpolator : this->interpolators) {
        interpolator->initializeForFirstCellX();
    }
}

void NoiseChunk::advanceCellX(int32_t cellX) {
    for (NoiseChunk::NoiseInterpolator *&interpolator : this->interpolators) {
        interpolator->advanceCellX(cellX);
    }
}

void NoiseChunk::selectCellYZ(int32_t cellY, int32_t cellZ) {
    for (NoiseChunk::NoiseInterpolator *&interpolator : this->interpolators) {
        interpolator->selectCellYZ(cellY, cellZ);
    }
}

void NoiseChunk::updateForY(double t) {
    for (NoiseChunk::NoiseInterpolator *&interpolator : this->interpolators) {
        interpolator->updateForY(t);
    };
}

void NoiseChunk::updateForX(double t) {
    for (NoiseChunk::NoiseInterpolator *&interpolator : this->interpolators) {
        interpolator->updateForX(t);
    };
}

void NoiseChunk::updateForZ(double t) {
    for (NoiseChunk::NoiseInterpolator *&interpolator : this->interpolators) {
        interpolator->updateForZ(t);
    };
}

void NoiseChunk::swapSlices() {
    for (NoiseChunk::NoiseInterpolator *&interpolator : this->interpolators) {
        interpolator->swapSlices();
    }
}

Aquifer *NoiseChunk::aquifer() {
    return this->_aquifer;
}

BlockState NoiseChunk::updateNoiseAndGenerateBaseState(int32_t x, int32_t y, int32_t z) {
    return this->baseNoise(x, y, z);
}

BlockState NoiseChunk::oreVeinify(int32_t x, int32_t y, int32_t z) {
    return this->oreVeins(x, y, z);
}

// NoiseInterpolator

NoiseInterpolator::NoiseInterpolator(NoiseChunk *noiseChunk, NoiseFiller filler) {
    this->noiseChunk = noiseChunk;
    this->noiseFiller = filler;
    this->slice0 = this->allocateSlice(this->noiseChunk->cellCountY, this->noiseChunk->cellCountXZ);
    this->slice1 = this->allocateSlice(this->noiseChunk->cellCountY, this->noiseChunk->cellCountXZ);
    this->noiseChunk->interpolators.push_back(this);
}

double **NoiseInterpolator::allocateSlice(int32_t cellCountY, int32_t cellCountXZ) {
    int32_t sliceWidth = cellCountXZ + 1;
    int32_t sliceHeight = cellCountY + 1;
    double **slice = new double *[sliceWidth];

    for (int32_t x = 0; x < sliceWidth; ++x) {
        slice[x] = new double[sliceHeight];
    }

    return slice;
}

void NoiseInterpolator::initializeForFirstCellX() {
    this->fillSlice(this->slice0, this->noiseChunk->firstCellX);
}

void NoiseInterpolator::advanceCellX(int32_t cellX) {
    this->fillSlice(this->slice1, this->noiseChunk->firstCellX + cellX + 1);
}

void NoiseInterpolator::fillSlice(double **slice, int32_t cellX) {
    int32_t cellWidth = this->noiseChunk->noiseSettings->getCellWidth();
    int32_t cellHeight = this->noiseChunk->noiseSettings->getCellHeight();

    for (int32_t offsetZ = 0; offsetZ < this->noiseChunk->cellCountXZ + 1; ++offsetZ) {
        int32_t cellZ = this->noiseChunk->firstCellZ + offsetZ;

        for (int32_t offsetY = 0; offsetY < this->noiseChunk->cellCountY + 1; ++offsetY) {
            int32_t cellY = offsetY + this->noiseChunk->cellNoiseMinY;
            int32_t y = cellY * cellHeight;
            double noise = this->noiseFiller(cellX * cellWidth, y, cellZ * cellWidth);
            slice[offsetZ][offsetY] = noise;
        }
    }
}

void NoiseInterpolator::selectCellYZ(int32_t cellY, int32_t cellZ) {
    this->noise000 = this->slice0[cellZ][cellY];
    this->noise001 = this->slice0[cellZ + 1][cellY];
    this->noise100 = this->slice1[cellZ][cellY];
    this->noise101 = this->slice1[cellZ + 1][cellY];
    this->noise010 = this->slice0[cellZ][cellY + 1];
    this->noise011 = this->slice0[cellZ + 1][cellY + 1];
    this->noise110 = this->slice1[cellZ][cellY + 1];
    this->noise111 = this->slice1[cellZ + 1][cellY + 1];
}

void NoiseInterpolator::updateForY(double t) {
    this->valueXZ00 = Mth::lerp(t, this->noise000, this->noise010);
    this->valueXZ10 = Mth::lerp(t, this->noise100, this->noise110);
    this->valueXZ01 = Mth::lerp(t, this->noise001, this->noise011);
    this->valueXZ11 = Mth::lerp(t, this->noise101, this->noise111);
}

void NoiseInterpolator::updateForX(double t) {
    this->valueZ0 = Mth::lerp(t, this->valueXZ00, this->valueXZ10);
    this->valueZ1 = Mth::lerp(t, this->valueXZ01, this->valueXZ11);
}

void NoiseInterpolator::updateForZ(double t) {
    this->value = Mth::lerp(t, this->valueZ0, this->valueZ1);
}

double NoiseInterpolator::sample() {
    return this->value;
}

void NoiseInterpolator::swapSlices() {
    double **adouble = this->slice0;
    this->slice0 = this->slice1;
    this->slice1 = adouble;
}