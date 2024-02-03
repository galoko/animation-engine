#include "noise-chunk.hpp"
#include "chunk-generator.hpp"
#include "mth.hpp"

// ConstantSampler

ConstantSampler::ConstantSampler(double value) {
    this->value = value;
    objectCreated("Sampler");
}

double ConstantSampler::sample() {
    return this->value;
}

// NoiseChunk

shared_ptr<NoiseChunk> NoiseChunk::forChunk(shared_ptr<ChunkAccess> chunkAccess, shared_ptr<NoiseSampler> sampler,
                                            function<NoiseChunk::NoiseFiller(void)> fillerSupplier,
                                            NoiseGeneratorSettings const &generatorSettings,
                                            shared_ptr<SimpleFluidPicker> fluidPicker) {
    ChunkPos const &chunkPos = chunkAccess->getPos();
    NoiseSettings const &noiseSettings = generatorSettings.noiseSettings();
    int32_t minY = max(noiseSettings.minY, chunkAccess->getMinBuildHeight());
    int32_t maxY = min(noiseSettings.minY + noiseSettings.height, chunkAccess->getMaxBuildHeight());
    int32_t cellMinY = Mth::intFloorDiv(minY, noiseSettings.getCellHeight());
    int32_t cellCountY = Mth::intFloorDiv(maxY - minY, noiseSettings.getCellHeight());
    NoiseFiller filler = fillerSupplier();
    return make_shared<NoiseChunk>(16 / noiseSettings.getCellWidth(), cellCountY, cellMinY, sampler,
                                   chunkPos.getMinBlockX(), chunkPos.getMinBlockZ(), filler, generatorSettings,
                                   fluidPicker)
        ->afterConstructor(16 / noiseSettings.getCellWidth(), cellCountY, cellMinY, sampler, chunkPos.getMinBlockX(),
                           chunkPos.getMinBlockZ(), filler, generatorSettings, fluidPicker);
}

shared_ptr<NoiseChunk> NoiseChunk::forColumn(int32_t startX, int32_t startZ, int32_t cellNoiseMinY, int32_t cellCountY,
                                             shared_ptr<NoiseSampler> sampler,
                                             NoiseGeneratorSettings const &noiseSettings,
                                             shared_ptr<SimpleFluidPicker> fluidPicker) {
    NoiseFiller filler = [](int32_t x, int32_t y, int32_t z) -> double { return 0.0; };
    return make_shared<NoiseChunk>(1, cellCountY, cellNoiseMinY, sampler, startX, startZ, filler, noiseSettings,
                                   fluidPicker)
        ->afterConstructor(1, cellCountY, cellNoiseMinY, sampler, startX, startZ, filler, noiseSettings, fluidPicker);
}

NoiseChunk::NoiseChunk(int32_t cellCountXZ, int32_t cellCountY, int32_t cellNoiseMinY, shared_ptr<NoiseSampler> sampler,
                       int32_t startX, int32_t startZ, NoiseChunk::NoiseFiller filler,
                       NoiseGeneratorSettings const &noiseSettings, shared_ptr<SimpleFluidPicker> fluidPicker)
    : noiseSettings(noiseSettings.noiseSettings()), sampler(sampler) {
    this->cellCountXZ = cellCountXZ;
    this->cellCountY = cellCountY;
    this->cellNoiseMinY = cellNoiseMinY;
    int32_t cellWidth = this->noiseSettings.getCellWidth();
    this->firstCellX = Mth::floorDiv(startX, cellWidth);
    this->firstCellZ = Mth::floorDiv(startZ, cellWidth);
    this->firstNoiseX = QuartPos::fromBlock(startX);
    this->firstNoiseZ = QuartPos::fromBlock(startZ);
    int32_t countXZ = QuartPos::fromBlock(cellCountXZ * cellWidth);
    this->_noiseData = vector<vector<FlatNoiseData>>(countXZ + 1);

    for (int32_t offsetX = 0; offsetX <= countXZ; ++offsetX) {
        int32_t x = this->firstNoiseX + offsetX;
        this->_noiseData[offsetX] = vector<FlatNoiseData>(countXZ + 1);

        for (int32_t offsetZ = 0; offsetZ <= countXZ; ++offsetZ) {
            int32_t z = this->firstNoiseZ + offsetZ;
            this->_noiseData[offsetX][offsetZ] = sampler->noiseData(x, z);
        }
    }

    objectCreated("NoiseChunk");
}

NoiseChunk::~NoiseChunk() {
    objectFreed("NoiseChunk");
}

shared_ptr<NoiseChunk> NoiseChunk::afterConstructor(int32_t cellCountXZ, int32_t cellCountY, int32_t cellNoiseMinY,
                                                    shared_ptr<NoiseSampler> sampler, int32_t startX, int32_t startZ,
                                                    NoiseChunk::NoiseFiller filler,
                                                    NoiseGeneratorSettings const &noiseSettings,
                                                    shared_ptr<SimpleFluidPicker> fluidPicker) {
    shared_ptr<NoiseChunk> sharedThis = this->shared_from_this();

    this->_aquifer = sampler->createAquifer(sharedThis, startX, startZ, cellNoiseMinY, cellCountY, fluidPicker,
                                            noiseSettings.isAquifersEnabled());
    this->baseNoise = sampler->makeBaseNoiseFiller(sharedThis, filler, noiseSettings.isNoodleCavesEnabled());
    this->oreVeins = sampler->makeOreVeinifier(sharedThis, noiseSettings.isOreVeinsEnabled());

    return sharedThis;
}

FlatNoiseData const &NoiseChunk::noiseData(int32_t x, int32_t z) {
    return this->_noiseData[x - this->firstNoiseX][z - this->firstNoiseZ];
}

int32_t NoiseChunk::preliminarySurfaceLevel(int32_t x, int32_t z) {
    int64_t loc = ChunkPos::asLong(QuartPos::fromBlock(x), QuartPos::fromBlock(z));
    auto iterator = this->_preliminarySurfaceLevel.find(loc);
    if (iterator == this->_preliminarySurfaceLevel.end()) {
        int32_t height = this->computePreliminarySurfaceLevel(loc);
        this->_preliminarySurfaceLevel.insert({loc, height});
        return height;
    } else {
        return iterator->second;
    }
}

int32_t NoiseChunk::computePreliminarySurfaceLevel(int64_t loc) {
    int32_t chunkX = ChunkPos::getX(loc);
    int32_t chunkY = ChunkPos::getZ(loc);
    int32_t shiftedChunkX = chunkX - this->firstNoiseX;
    int32_t shiftedChunkY = chunkY - this->firstNoiseZ;
    int32_t noiseDataSize = (int32_t)this->_noiseData.size();
    TerrainInfo const &terraininfo =
        (shiftedChunkX >= 0 && shiftedChunkY >= 0 && shiftedChunkX < noiseDataSize && shiftedChunkY < noiseDataSize)
            ? this->_noiseData[shiftedChunkX][shiftedChunkY].terrainInfo
            : this->sampler->noiseData(chunkX, chunkY).terrainInfo;

    return this->sampler->getPreliminarySurfaceLevel(QuartPos::toBlock(chunkX), QuartPos::toBlock(chunkY), terraininfo);
}

shared_ptr<NoiseChunk::NoiseInterpolator> NoiseChunk::createNoiseInterpolator(NoiseChunk::NoiseFiller noiseFiller) {
    shared_ptr<NoiseChunk::NoiseInterpolator> interpolator =
        make_shared<NoiseChunk::NoiseInterpolator>(this->shared_from_this(), noiseFiller);

    this->interpolators.push_back(interpolator);

    return interpolator;
}

void NoiseChunk::initializeForFirstCellX() {
    for (shared_ptr<NoiseChunk::NoiseInterpolator> &interpolator : this->interpolators) {
        interpolator->initializeForFirstCellX();
    }
}

void NoiseChunk::advanceCellX(int32_t cellX) {
    for (shared_ptr<NoiseChunk::NoiseInterpolator> &interpolator : this->interpolators) {
        interpolator->advanceCellX(cellX);
    }
}

void NoiseChunk::selectCellYZ(int32_t cellY, int32_t cellZ) {
    for (shared_ptr<NoiseChunk::NoiseInterpolator> &interpolator : this->interpolators) {
        interpolator->selectCellYZ(cellY, cellZ);
    }
}

void NoiseChunk::updateForY(double t) {
    for (shared_ptr<NoiseChunk::NoiseInterpolator> &interpolator : this->interpolators) {
        interpolator->updateForY(t);
    };
}

void NoiseChunk::updateForX(double t) {
    for (shared_ptr<NoiseChunk::NoiseInterpolator> &interpolator : this->interpolators) {
        interpolator->updateForX(t);
    };
}

void NoiseChunk::updateForZ(double t) {
    for (shared_ptr<NoiseChunk::NoiseInterpolator> &interpolator : this->interpolators) {
        interpolator->updateForZ(t);
    };
}

void NoiseChunk::swapSlices() {
    for (shared_ptr<NoiseChunk::NoiseInterpolator> &interpolator : this->interpolators) {
        interpolator->swapSlices();
    }
}

shared_ptr<Aquifer> NoiseChunk::aquifer() {
    return this->_aquifer;
}

BlockState NoiseChunk::updateNoiseAndGenerateBaseState(int32_t x, int32_t y, int32_t z) {
    return this->baseNoise(x, y, z);
}

BlockState NoiseChunk::oreVeinify(int32_t x, int32_t y, int32_t z) {
    return this->oreVeins(x, y, z);
}

// NoiseInterpolator

NoiseInterpolator::NoiseInterpolator(shared_ptr<NoiseChunk> noiseChunk, NoiseFiller filler) : noiseChunk(noiseChunk) {
    this->noiseFiller = filler;
    this->slice0 = this->allocateSlice(noiseChunk->cellCountY, noiseChunk->cellCountXZ);
    this->slice1 = this->allocateSlice(noiseChunk->cellCountY, noiseChunk->cellCountXZ);
    objectCreated("Sampler");
}

unique_ptr<double[]> NoiseInterpolator::allocateSlice(int32_t cellCountY, int32_t cellCountXZ) {
    int32_t sliceWidth = cellCountXZ + 1;
    int32_t sliceHeight = cellCountY + 1;
    // TODO use make_unique_for_overwrite here
    unique_ptr<double[]> slice = make_unique<double[]>(sliceWidth * sliceHeight);

    return slice;
}

int32_t NoiseInterpolator::getSliceIndex(int32_t cellZ, int32_t cellY) {
    int32_t sliceWidth = this->noiseChunk.lock()->cellCountXZ + 1;
    return cellY * sliceWidth + cellZ;
}

void NoiseInterpolator::initializeForFirstCellX() {
    this->fillSlice(this->slice0, this->noiseChunk.lock()->firstCellX);
}

void NoiseInterpolator::advanceCellX(int32_t cellX) {
    this->fillSlice(this->slice1, this->noiseChunk.lock()->firstCellX + cellX + 1);
}

void NoiseInterpolator::fillSlice(shared_ptr<double[]> slice, int32_t cellX) {
    shared_ptr<NoiseChunk> noiseChunk = this->noiseChunk.lock();
    int32_t cellWidth = noiseChunk->noiseSettings.getCellWidth();
    int32_t cellHeight = noiseChunk->noiseSettings.getCellHeight();

    for (int32_t offsetZ = 0; offsetZ < noiseChunk->cellCountXZ + 1; ++offsetZ) {
        int32_t cellZ = noiseChunk->firstCellZ + offsetZ;

        for (int32_t offsetY = 0; offsetY < noiseChunk->cellCountY + 1; ++offsetY) {
            int32_t cellY = offsetY + noiseChunk->cellNoiseMinY;
            int32_t y = cellY * cellHeight;
            double noise = this->noiseFiller(cellX * cellWidth, y, cellZ * cellWidth);
            slice.get()[this->getSliceIndex(offsetZ, offsetY)] = noise;
        }
    }
}

void NoiseInterpolator::selectCellYZ(int32_t cellY, int32_t cellZ) {
    this->noise000 = this->slice0.get()[getSliceIndex(cellZ, cellY)];
    this->noise001 = this->slice0.get()[getSliceIndex(cellZ + 1, cellY)];
    this->noise100 = this->slice1.get()[getSliceIndex(cellZ, cellY)];
    this->noise101 = this->slice1.get()[getSliceIndex(cellZ + 1, cellY)];
    this->noise010 = this->slice0.get()[getSliceIndex(cellZ, cellY + 1)];
    this->noise011 = this->slice0.get()[getSliceIndex(cellZ + 1, cellY + 1)];
    this->noise110 = this->slice1.get()[getSliceIndex(cellZ, cellY + 1)];
    this->noise111 = this->slice1.get()[getSliceIndex(cellZ + 1, cellY + 1)];
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
    shared_ptr<double[]> adouble = this->slice0;
    this->slice0 = this->slice1;
    this->slice1 = adouble;
}