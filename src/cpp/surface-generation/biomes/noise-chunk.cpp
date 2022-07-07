#include "noise-chunk.hpp"
#include "chunk-generator.hpp"

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

NoiseChunk::NoiseInterpolator *NoiseChunk::createNoiseInterpolator(NoiseChunk::NoiseFiller noiseFiller) {
    return new NoiseChunk::NoiseInterpolator(this, noiseFiller);
}

int32_t NoiseChunk::computePreliminarySurfaceLevel(int64_t p_198250_) {
    int32_t i = ChunkPos::getX(p_198250_);
    int32_t j = ChunkPos::getZ(p_198250_);
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
                                  NoiseSampler *p_188763_, NoiseGeneratorSettings *noiseSettings,
                                  Aquifer::FluidPicker *fluidPicker) {
    return new NoiseChunk(
        1, cellCountY, cellNoiseMinY, p_188763_, startX, startZ,
        [](int32_t x, int32_t y, int32_t z) -> double { return 0.0; }, noiseSettings, fluidPicker, Blender::empty());
}

void NoiseChunk::initializeForFirstCellX() {
    for (NoiseChunk::NoiseInterpolator *&interpolator : this->interpolators) {
        interpolator->initializeForFirstCellX();
    }
}

void NoiseChunk::advanceCellX(int32_t p_188750_) {
    for (NoiseChunk::NoiseInterpolator *&interpolator : this->interpolators) {
        interpolator->advanceCellX(p_188750_);
    }
}

void NoiseChunk::selectCellYZ(int32_t p_188811_, int32_t p_188812_) {
    for (NoiseChunk::NoiseInterpolator *&interpolator : this->interpolators) {
        interpolator->selectCellYZ(p_188811_, p_188812_);
    }
}

void NoiseChunk::updateForY(double p_188745_) {
    for (NoiseChunk::NoiseInterpolator *&interpolator : this->interpolators) {
        interpolator->updateForY(p_188745_);
    };
}

void NoiseChunk::updateForX(double p_188793_) {
    for (NoiseChunk::NoiseInterpolator *&interpolator : this->interpolators) {
        interpolator->updateForX(p_188793_);
    };
}

void NoiseChunk::updateForZ(double p_188806_) {
    for (NoiseChunk::NoiseInterpolator *&interpolator : this->interpolators) {
        interpolator->updateForZ(p_188806_);
    };
}

void NoiseChunk::swapSlices() {
    for (NoiseChunk::NoiseInterpolator *&interpolator : this->interpolators) {
        interpolator->swapSlices();
    }
}

void NoiseInterpolator::fillSlice(double **p_188858_, int32_t p_188859_) {
    int32_t i = this->noiseChunk->noiseSettings->getCellWidth();
    int32_t j = this->noiseChunk->noiseSettings->getCellHeight();

    for (int32_t k = 0; k < this->noiseChunk->cellCountXZ + 1; ++k) {
        int32_t l = this->noiseChunk->firstCellZ + k;

        for (int32_t i1 = 0; i1 < this->noiseChunk->cellCountY + 1; ++i1) {
            int32_t j1 = i1 + this->noiseChunk->cellNoiseMinY;
            int32_t k1 = j1 * j;
            double d0 = this->noiseFiller(p_188859_ * i, k1, l * i);
            p_188858_[k][i1] = d0;
        }
    }
}