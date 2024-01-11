#include "chunks.hpp"
#include "chunk-generator.hpp"
#include "chunk-status.hpp"
#include "heightmap.hpp"
#include "mth.hpp"
#include "noise-chunk.hpp"

// LevelHeightAccessor

int32_t LevelHeightAccessor::getMaxBuildHeight() const {
    return this->getMinBuildHeight() + this->getHeight();
}

int32_t LevelHeightAccessor::getSectionsCount() const {
    return this->getMaxSection() - this->getMinSection();
}

int32_t LevelHeightAccessor::getMinSection() const {
    return SectionPos::blockToSectionCoord(this->getMinBuildHeight());
}

int32_t LevelHeightAccessor::getMaxSection() const {
    return SectionPos::blockToSectionCoord(this->getMaxBuildHeight() - 1) + 1;
}

bool LevelHeightAccessor::isOutsideBuildHeight(BlockPos const &pos) const {
    return this->isOutsideBuildHeight(pos.getY());
}

bool LevelHeightAccessor::isOutsideBuildHeight(int32_t y) const {
    return y < this->getMinBuildHeight() || y >= this->getMaxBuildHeight();
}

int32_t LevelHeightAccessor::getSectionIndex(int32_t y) const {
    return this->getSectionIndexFromSectionY(SectionPos::blockToSectionCoord(y));
}

int32_t LevelHeightAccessor::getSectionIndexFromSectionY(int32_t sectionY) const {
    return sectionY - this->getMinSection();
}

int32_t LevelHeightAccessor::getSectionYFromSectionIndex(int32_t sectionIndex) const {
    return sectionIndex + this->getMinSection();
}

// SimpleLevelHeightAccessor

int32_t SimpleLevelHeightAccessor::getHeight() const {
    return 384;
}

int32_t SimpleLevelHeightAccessor::getMinBuildHeight() const {
    return -64;
}

// LevelChunkSection

LevelChunkSection::LevelChunkSection(int32_t y) {
    this->_bottomBlockY = getBottomBlockY(y);

    this->states = vector<BlockState>(STATES_CONTAINER_SIZE * STATES_CONTAINER_SIZE * STATES_CONTAINER_SIZE);
    fill(this->states.begin(), this->states.end(), Blocks::AIR);

    this->biomes = vector<Biomes>(BIOME_CONTAINER_SIZE * BIOME_CONTAINER_SIZE * BIOME_CONTAINER_SIZE);
    fill(this->biomes.begin(), this->biomes.end(), Biomes::PLAINS);
}

BlockState LevelChunkSection::getBlockState(int32_t x, int32_t y, int32_t z) const {
    return this->states.at(getBlockStateIndex(x, y, z));
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
        prevBlockState = this->states.at(getBlockStateIndex(x, y, z));
        this->states.at(getBlockStateIndex(x, y, z)) = blockState;
    } else {
        prevBlockState = this->states.at(getBlockStateIndex(x, y, z));
        this->states.at(getBlockStateIndex(x, y, z)) = blockState;
    }

    if (prevBlockState != Blocks::AIR) {
        --this->nonEmptyBlockCount;
    }

    if (blockState != Blocks::AIR) {
        ++this->nonEmptyBlockCount;
    }

    return prevBlockState;
}

bool LevelChunkSection::hasOnlyAir() const {
    return this->nonEmptyBlockCount == 0;
}

bool LevelChunkSection::isRandomlyTicking() const {
    return this->isRandomlyTickingBlocks() || this->isRandomlyTickingFluids();
}

bool LevelChunkSection::isRandomlyTickingBlocks() const {
    return this->tickingBlockCount > 0;
}

bool LevelChunkSection::isRandomlyTickingFluids() const {
    return this->tickingFluidCount > 0;
}

int32_t LevelChunkSection::bottomBlockY() const {
    return this->_bottomBlockY;
}

vector<BlockState> const &LevelChunkSection::getStates() const {
    return this->states;
}

vector<Biomes> const &LevelChunkSection::getBiomes() const {
    return this->biomes;
}

Biomes LevelChunkSection::getNoiseBiome(int32_t x, int32_t y, int32_t z) const {
    return this->biomes.at(getBiomesIndex(x, y, z));
}

void LevelChunkSection::fillBiomesFromNoise(shared_ptr<BiomeResolver> resolver, shared_ptr<Climate::Sampler> sampler,
                                            int32_t offsetX, int32_t offsetZ) {
    vector<Biomes> &biomes = this->biomes;
    // biomes->acquire();

    // try {
    int32_t offsetY = QuartPos::fromBlock(this->bottomBlockY());

    for (int32_t x = 0; x < BIOME_CONTAINER_SIZE; ++x) {
        for (int32_t y = 0; y < BIOME_CONTAINER_SIZE; ++y) {
            for (int32_t z = 0; z < BIOME_CONTAINER_SIZE; ++z) {
                biomes.at(getBiomesIndex(x, y, z)) =
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

ChunkAccess::ChunkAccess(ChunkPos const &chunkPos, LevelHeightAccessor const &levelHeightAccessor)
    : chunkPos(chunkPos), levelHeightAccessor(levelHeightAccessor) {
    this->noiseChunk = nullptr;
    this->isLightCorrect = false;
    this->sections = vector<LevelChunkSection>(levelHeightAccessor.getSectionsCount());
    this->heightmaps = std::map<HeightmapTypes, shared_ptr<Heightmap>>();

    replaceMissingSections(levelHeightAccessor, this->sections);

    objectCreated("ChunkAccess");
}

ChunkAccess::~ChunkAccess() {
    objectFreed("ChunkAccess");
}

void ChunkAccess::replaceMissingSections(LevelHeightAccessor const &heightAccessor,
                                         vector<LevelChunkSection> &sections) {
    for (int32_t sectionIndex = 0; sectionIndex < sections.size(); ++sectionIndex) {
        sections.at(sectionIndex) = LevelChunkSection(heightAccessor.getSectionYFromSectionIndex(sectionIndex));
    }
}

LevelChunkSection *ChunkAccess::getHighestSection() {
    vector<LevelChunkSection> &sections = this->getSections();

    for (int32_t sectionIndex = (int32_t)sections.size() - 1; sectionIndex >= 0; --sectionIndex) {
        LevelChunkSection &section = this->getSection(sectionIndex);
        if (!section.hasOnlyAir()) {
            return &section;
        }
    }

    return nullptr;
}

int32_t ChunkAccess::getHighestSectionPosition() {
    LevelChunkSection *section = this->getHighestSection();
    return section == nullptr ? this->getMinBuildHeight() : section->bottomBlockY();
}

vector<LevelChunkSection> &ChunkAccess::getSections() {
    return this->sections;
}

LevelChunkSection &ChunkAccess::getSection(int32_t sectionIndex) {
    return this->sections.at(sectionIndex);
}

shared_ptr<Heightmap> ChunkAccess::getOrCreateHeightmapUnprimed(HeightmapTypes type) {
    auto iterator = this->heightmaps.find(type);
    if (iterator == this->heightmaps.end()) {
        shared_ptr<Heightmap> heightmap = make_shared<Heightmap>(this->shared_from_this(), type);
        this->heightmaps.insert({type, heightmap});
        return this->heightmaps.at(type);
    } else {
        return iterator->second;
    }
}

bool ChunkAccess::hasPrimedHeightmap(HeightmapTypes type) const {
    return this->heightmaps.find(type) != this->heightmaps.end();
}

int32_t ChunkAccess::getHeight(HeightmapTypes type, int32_t x, int32_t z) {
    auto heightmapIterator = this->heightmaps.find(type);
    if (heightmapIterator == this->heightmaps.end()) {
        Heightmap::primeHeightmaps(this->shared_from_this(), {type});
    }
    shared_ptr<Heightmap> heightmap = this->heightmaps.at(type);
    return heightmap->getFirstAvailable(x & 15, z & 15) - 1;
}

ChunkPos const &ChunkAccess::getPos() const {
    return this->chunkPos;
}

int32_t ChunkAccess::getMinBuildHeight() const {
    return this->levelHeightAccessor.getMinBuildHeight();
}

int32_t ChunkAccess::getHeight() const {
    return this->levelHeightAccessor.getHeight();
}

shared_ptr<NoiseChunk> ChunkAccess::getOrCreateNoiseChunk(shared_ptr<NoiseSampler> sampler,
                                                          function<NoiseFiller(void)> filler,
                                                          NoiseGeneratorSettings const &settings,
                                                          shared_ptr<Aquifer::FluidPicker> fluidPicker,
                                                          Blender const &blender) {
    if (this->noiseChunk == nullptr) {
        this->noiseChunk =
            NoiseChunk::forChunk(this->shared_from_this(), sampler, filler, settings, fluidPicker, blender);
    }

    return this->noiseChunk;
}

Biomes ChunkAccess::getNoiseBiome(int32_t x, int32_t y, int32_t z) {
    int32_t minY = QuartPos::fromBlock(this->getMinBuildHeight());
    int32_t maxY = minY + QuartPos::fromBlock(this->getHeight()) - 1;
    int32_t clampedY = Mth::clamp(y, minY, maxY);
    int32_t sectionIndex = this->getSectionIndex(QuartPos::toBlock(clampedY));
    return this->getSection(sectionIndex).getNoiseBiome(x & 3, clampedY & 3, z & 3);
}

void ChunkAccess::fillBiomesFromNoise(shared_ptr<BiomeResolver> resolver, shared_ptr<Climate::Sampler> sampler) {
    ChunkPos const &chunkpos = this->getPos();
    int32_t x = QuartPos::fromBlock(chunkpos.getMinBlockX());
    int32_t z = QuartPos::fromBlock(chunkpos.getMinBlockZ());
    LevelHeightAccessor const &heightAccessor = this->getHeightAccessorForGeneration();

    for (int32_t y = heightAccessor.getMinSection(); y < heightAccessor.getMaxSection(); ++y) {
        LevelChunkSection &section = this->getSection(this->getSectionIndexFromSectionY(y));
        section.fillBiomesFromNoise(resolver, sampler, x, z);
    }
}

LevelHeightAccessor const &ChunkAccess::getHeightAccessorForGeneration() {
    return *this;
}

// ProtoChunk

ProtoChunk::ProtoChunk(ChunkPos const &chunkPos, LevelHeightAccessor const &levelHeightAccessor)
    : ChunkAccess(chunkPos, levelHeightAccessor), status(nullptr) {
}

BlockState ProtoChunk::getBlockState(BlockPos const &pos) const {
    int32_t y = pos.getY();
    if (this->isOutsideBuildHeight(y)) {
        return Blocks::VOID_AIR;
    } else {
        LevelChunkSection const &section = this->sections.at(this->getSectionIndex(y));
        return section.hasOnlyAir() ? Blocks::AIR : section.getBlockState(pos.getX() & 15, y & 15, pos.getZ() & 15);
    }
}

BlockState ProtoChunk::setBlockState(BlockPos const &pos, BlockState blockState, bool checked) {
    int32_t x = pos.getX();
    int32_t y = pos.getY();
    int32_t z = pos.getZ();
    if (y >= this->getMinBuildHeight() && y < this->getMaxBuildHeight()) {
        int32_t sectionIndex = this->getSectionIndex(y);
        if (this->getSection(sectionIndex).hasOnlyAir() && blockState == Blocks::AIR) {
            return blockState;
        } else {
            LevelChunkSection &section = this->getSection(sectionIndex);

            BlockState prevBlockState = section.setBlockState(x & 15, y & 15, z & 15, blockState);

            vector<HeightmapTypes> &heightmapsAfter = this->getStatus()->heightmapsAfter;
            vector<HeightmapTypes> createdHeightmaps = vector<HeightmapTypes>();

            for (HeightmapTypes &type : heightmapsAfter) {
                auto heightmap = this->heightmaps.find(type);
                if (heightmap == this->heightmaps.end()) {
                    createdHeightmaps.push_back(type);
                }
            }

            if (createdHeightmaps.size() > 0) {
                Heightmap::primeHeightmaps(this->shared_from_this(), createdHeightmaps);
            }

            for (HeightmapTypes &type : heightmapsAfter) {
                this->heightmaps.at(type)->update(x & 15, y, z & 15, blockState);
            }

            return prevBlockState;
        }
    } else {
        return Blocks::VOID_AIR;
    }
}

void ProtoChunk::setStatus(ChunkStatus* status) {
    this->status = status;
}

ChunkStatus* ProtoChunk::getStatus() {
    return this->status;
}
