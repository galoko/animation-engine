#include "chunks.hpp"
#include "chunk-generator.hpp"
#include "chunk-status.hpp"
#include "heightmap.hpp"
#include "mth.hpp"
#include "noise-chunk.hpp"

// LevelHeightAccessor

int32_t LevelHeightAccessor::getMaxBuildHeight() {
    return this->getMinBuildHeight() + this->getHeight();
}

int32_t LevelHeightAccessor::getSectionsCount() {
    return this->getMaxSection() - this->getMinSection();
}

int32_t LevelHeightAccessor::getMinSection() {
    return SectionPos::blockToSectionCoord(this->getMinBuildHeight());
}

int32_t LevelHeightAccessor::getMaxSection() {
    return SectionPos::blockToSectionCoord(this->getMaxBuildHeight() - 1) + 1;
}

bool LevelHeightAccessor::isOutsideBuildHeight(BlockPos *pos) {
    return this->isOutsideBuildHeight(pos->getY());
}

bool LevelHeightAccessor::isOutsideBuildHeight(int32_t y) {
    return y < this->getMinBuildHeight() || y >= this->getMaxBuildHeight();
}

int32_t LevelHeightAccessor::getSectionIndex(int32_t y) {
    return this->getSectionIndexFromSectionY(SectionPos::blockToSectionCoord(y));
}

int32_t LevelHeightAccessor::getSectionIndexFromSectionY(int32_t sectionY) {
    return sectionY - this->getMinSection();
}

int32_t LevelHeightAccessor::getSectionYFromSectionIndex(int32_t sectionIndex) {
    return sectionIndex + this->getMinSection();
}

// SimpleLevelHeightAccessor

int32_t SimpleLevelHeightAccessor::getHeight() {
    return 384;
}

int32_t SimpleLevelHeightAccessor::getMinBuildHeight() {
    return -64;
}

// LevelChunkSection

LevelChunkSection::LevelChunkSection(int32_t y) {
    this->_bottomBlockY = getBottomBlockY(y);

    this->states = new vector<BlockState>(STATES_CONTAINER_SIZE * STATES_CONTAINER_SIZE * STATES_CONTAINER_SIZE);
    fill(this->states->begin(), this->states->end(), Blocks::AIR);

    this->biomes = new vector<Biomes>(BIOME_CONTAINER_SIZE * BIOME_CONTAINER_SIZE * BIOME_CONTAINER_SIZE);
    fill(this->biomes->begin(), this->biomes->end(), Biomes::PLAINS);
}

BlockState LevelChunkSection::getBlockState(int32_t x, int32_t y, int32_t z) {
    return this->states->at(getBlockStateIndex(x, y, z));
}

void LevelChunkSection::acquire() {
    // TODO ?
}

void LevelChunkSection::release() {
    // TODO ?
}

BlockState LevelChunkSection::setBlockState(int32_t x, int32_t y, int32_t z, BlockState blockState) {
    return this->setBlockState(x, y, z, blockState, true);
}

BlockState LevelChunkSection::setBlockState(int32_t x, int32_t y, int32_t z, BlockState blockState, bool checked) {
    BlockState prevBlockState;
    if (checked) {
        prevBlockState = this->states->at(getBlockStateIndex(x, y, z));
        this->states->at(getBlockStateIndex(x, y, z)) = blockState;
    } else {
        prevBlockState = this->states->at(getBlockStateIndex(x, y, z));
        this->states->at(getBlockStateIndex(x, y, z)) = blockState;
    }

    if (prevBlockState != Blocks::AIR) {
        --this->nonEmptyBlockCount;
    }

    if (blockState != Blocks::AIR) {
        ++this->nonEmptyBlockCount;
    }

    return prevBlockState;
}

bool LevelChunkSection::hasOnlyAir() {
    return this->nonEmptyBlockCount == 0;
}

bool LevelChunkSection::isRandomlyTicking() {
    return this->isRandomlyTickingBlocks() || this->isRandomlyTickingFluids();
}

bool LevelChunkSection::isRandomlyTickingBlocks() {
    return this->tickingBlockCount > 0;
}

bool LevelChunkSection::isRandomlyTickingFluids() {
    return this->tickingFluidCount > 0;
}

int32_t LevelChunkSection::bottomBlockY() {
    return this->_bottomBlockY;
}

vector<BlockState> *LevelChunkSection::getStates() {
    return this->states;
}

vector<Biomes> *LevelChunkSection::getBiomes() {
    return this->biomes;
}

Biomes LevelChunkSection::getNoiseBiome(int32_t x, int32_t y, int32_t z) {
    return this->biomes->at(getBiomesIndex(x, y, z));
}

void LevelChunkSection::fillBiomesFromNoise(BiomeResolver *resolver, Climate::Sampler *sampler, int32_t offsetX,
                                            int32_t offsetZ) {
    vector<Biomes> *biomes = this->getBiomes();
    // biomes->acquire();

    // try {
    int32_t offsetY = QuartPos::fromBlock(this->bottomBlockY());

    for (int32_t x = 0; x < BIOME_CONTAINER_SIZE; ++x) {
        for (int32_t y = 0; y < BIOME_CONTAINER_SIZE; ++y) {
            for (int32_t z = 0; z < BIOME_CONTAINER_SIZE; ++z) {
                biomes->at(getBiomesIndex(x, y, z)) =
                    resolver->getNoiseBiome(offsetX + x, offsetY + y, offsetZ + z, sampler);
            }
        }
    }
    /*
    } finally {
        biomes->release();
    }
    */
}

// ChunkAccess

ChunkAccess::ChunkAccess(ChunkPos *chunkPos, LevelHeightAccessor *levelHeightAccessor) {
    this->noiseChunk = nullptr;
    this->isLightCorrect = false;
    this->chunkPos = chunkPos;
    this->levelHeightAccessor = levelHeightAccessor;
    this->sections = new vector<LevelChunkSection *>(levelHeightAccessor->getSectionsCount());
    this->heightmaps = new std::map<HeightmapTypes, Heightmap *>();

    replaceMissingSections(levelHeightAccessor, this->sections);
}

void ChunkAccess::replaceMissingSections(LevelHeightAccessor *heightAccessor, vector<LevelChunkSection *> *sections) {
    for (int32_t sectionIndex = 0; sectionIndex < sections->size(); ++sectionIndex) {
        if (sections->at(sectionIndex) == nullptr) {
            sections->at(sectionIndex) =
                new LevelChunkSection(heightAccessor->getSectionYFromSectionIndex(sectionIndex));
        }
    }
}

LevelChunkSection *ChunkAccess::getHighestSection() {
    vector<LevelChunkSection *> *sections = this->getSections();

    for (int32_t i = sections->size() - 1; i >= 0; --i) {
        LevelChunkSection *section = sections->at(i);
        if (!section->hasOnlyAir()) {
            return section;
        }
    }

    return nullptr;
}

int32_t ChunkAccess::getHighestSectionPosition() {
    LevelChunkSection *section = this->getHighestSection();
    return section == nullptr ? this->getMinBuildHeight() : section->bottomBlockY();
}

vector<LevelChunkSection *> *ChunkAccess::getSections() {
    return this->sections;
}

LevelChunkSection *ChunkAccess::getSection(int32_t sectionIndex) {
    return this->getSections()->at(sectionIndex);
}

Heightmap *ChunkAccess::getOrCreateHeightmapUnprimed(HeightmapTypes type) {
    auto iterator = this->heightmaps->find(type);
    if (iterator == this->heightmaps->end()) {
        Heightmap *heightmap = new Heightmap(this, type);
        this->heightmaps->insert({type, heightmap});
        return heightmap;
    } else {
        return iterator->second;
    }
}

bool ChunkAccess::hasPrimedHeightmap(HeightmapTypes type) {
    return this->heightmaps->find(type)->second != nullptr;
}

int32_t ChunkAccess::getHeight(HeightmapTypes type, int32_t x, int32_t z) {
    Heightmap *heightmap = this->heightmaps->find(type)->second;
    if (heightmap == nullptr) {
        Heightmap::primeHeightmaps(this, {type});
        heightmap = this->heightmaps->at(type);
    }

    return heightmap->getFirstAvailable(x & 15, z & 15) - 1;
}

ChunkPos *ChunkAccess::getPos() {
    return this->chunkPos;
}

int32_t ChunkAccess::getMinBuildHeight() {
    return this->levelHeightAccessor->getMinBuildHeight();
}

int32_t ChunkAccess::getHeight() {
    return this->levelHeightAccessor->getHeight();
}

NoiseChunk *ChunkAccess::getOrCreateNoiseChunk(NoiseSampler *sampler, function<NoiseFiller(void)> filler,
                                               NoiseGeneratorSettings *settings, Aquifer::FluidPicker *fluidPicker,
                                               Blender *blender) {
    if (this->noiseChunk == nullptr) {
        this->noiseChunk = NoiseChunk::forChunk(this, sampler, filler, settings, fluidPicker, blender);
    }

    return this->noiseChunk;
}

Biomes ChunkAccess::getNoiseBiome(int32_t x, int32_t y, int32_t z) {
    int32_t minY = QuartPos::fromBlock(this->getMinBuildHeight());
    int32_t maxY = minY + QuartPos::fromBlock(this->getHeight()) - 1;
    int32_t clampedY = Mth::clamp(y, minY, maxY);
    int32_t sectionIndex = this->getSectionIndex(QuartPos::toBlock(clampedY));
    return this->sections->at(sectionIndex)->getNoiseBiome(x & 3, clampedY & 3, z & 3);
}

void ChunkAccess::fillBiomesFromNoise(BiomeResolver *resolver, Climate::Sampler *sampler) {
    ChunkPos *chunkpos = this->getPos();
    int32_t x = QuartPos::fromBlock(chunkpos->getMinBlockX());
    int32_t z = QuartPos::fromBlock(chunkpos->getMinBlockZ());
    LevelHeightAccessor *levelheightaccessor = this->getHeightAccessorForGeneration();

    for (int32_t y = levelheightaccessor->getMinSection(); y < levelheightaccessor->getMaxSection(); ++y) {
        LevelChunkSection *section = this->getSection(this->getSectionIndexFromSectionY(y));
        section->fillBiomesFromNoise(resolver, sampler, x, z);
    }
}

LevelHeightAccessor *ChunkAccess::getHeightAccessorForGeneration() {
    return this;
}

// ProtoChunk

ProtoChunk::ProtoChunk(ChunkPos *chunkPos, LevelHeightAccessor *levelHeightAccessor)
    : ChunkAccess(chunkPos, levelHeightAccessor) {
}

BlockState ProtoChunk::getBlockState(BlockPos *pos) {
    int32_t y = pos->getY();
    if (this->isOutsideBuildHeight(y)) {
        return Blocks::VOID_AIR;
    } else {
        LevelChunkSection *section = this->getSection(this->getSectionIndex(y));
        return section->hasOnlyAir() ? Blocks::AIR : section->getBlockState(pos->getX() & 15, y & 15, pos->getZ() & 15);
    }
}

BlockState ProtoChunk::setBlockState(BlockPos *pos, BlockState blockState, bool checked) {
    int32_t x = pos->getX();
    int32_t y = pos->getY();
    int32_t z = pos->getZ();
    if (y >= this->getMinBuildHeight() && y < this->getMaxBuildHeight()) {
        int32_t sectionIndex = this->getSectionIndex(y);
        if (this->sections->at(sectionIndex)->hasOnlyAir() && blockState == Blocks::AIR) {
            return blockState;
        } else {
            LevelChunkSection *section = this->getSection(sectionIndex);

            BlockState prevBlockState = section->setBlockState(x & 15, y & 15, z & 15, blockState);

            vector<HeightmapTypes> &heightmapsAfter = this->getStatus()->heightmapsAfter;
            vector<HeightmapTypes> createdHeightmaps = vector<HeightmapTypes>();

            for (HeightmapTypes &type : heightmapsAfter) {
                Heightmap *heightmap = this->heightmaps->find(type)->second;
                if (heightmap == nullptr) {
                    createdHeightmaps.push_back(type);
                }
            }

            if (createdHeightmaps.size() > 0) {
                Heightmap::primeHeightmaps(this, createdHeightmaps);
            }

            for (HeightmapTypes &type : heightmapsAfter) {
                this->heightmaps->at(type)->update(x & 15, y, z & 15, blockState);
            }

            return prevBlockState;
        }
    } else {
        return Blocks::VOID_AIR;
    }
}

ChunkStatus *ProtoChunk::getStatus() {
    return nullptr;
}
