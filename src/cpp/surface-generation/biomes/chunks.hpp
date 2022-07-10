#pragma once

#include "biome-source.hpp"
#include "biomes.hpp"
#include "chunk-status.fwd.hpp"
#include "chunks.fwd.hpp"
#include "climate.hpp"
#include "heightmap.fwd.hpp"
#include "mth.hpp"
#include "noise-chunk.fwd.hpp"
#include "pos.hpp"

using namespace std;

class LevelHeightAccessor {
public:
    virtual int32_t getHeight() = 0;

    virtual int32_t getMinBuildHeight() = 0;

    int32_t getMaxBuildHeight() {
        return this->getMinBuildHeight() + this->getHeight();
    }

    int32_t getSectionsCount() {
        return this->getMaxSection() - this->getMinSection();
    }

    int32_t getMinSection() {
        return SectionPos::blockToSectionCoord(this->getMinBuildHeight());
    }

    int32_t getMaxSection() {
        return SectionPos::blockToSectionCoord(this->getMaxBuildHeight() - 1) + 1;
    }

    bool isOutsideBuildHeight(BlockPos *pos) {
        return this->isOutsideBuildHeight(pos->getY());
    }

    bool isOutsideBuildHeight(int32_t y) {
        return y < this->getMinBuildHeight() || y >= this->getMaxBuildHeight();
    }

    int32_t getSectionIndex(int32_t y) {
        return this->getSectionIndexFromSectionY(SectionPos::blockToSectionCoord(y));
    }

    int32_t getSectionIndexFromSectionY(int32_t sectionY) {
        return sectionY - this->getMinSection();
    }

    int32_t getSectionYFromSectionIndex(int32_t sectionIndex) {
        return sectionIndex + this->getMinSection();
    }
};

class SimpleLevelHeightAccessor : public LevelHeightAccessor {
    int32_t getHeight() override {
        return 384;
    }

    int32_t getMinBuildHeight() override {
        return -64;
    }
};

class BlockGetter : public LevelHeightAccessor {
public:
    virtual BlockState getBlockState(BlockPos *pos) = 0;
};

class LevelChunkSection {
public:
    static const int32_t SECTION_WIDTH = 16;
    static const int32_t SECTION_HEIGHT = 16;
    static const int32_t SECTION_SIZE = 4096;
    static const int32_t BIOME_CONTAINER_BITS = 2;
    static const int32_t STATES_CONTAINER_BITS = 4;
    static const int32_t BIOME_CONTAINER_SIZE = 1 << BIOME_CONTAINER_BITS;
    static const int32_t STATES_CONTAINER_SIZE = 1 << STATES_CONTAINER_BITS;

private:
    int32_t _bottomBlockY;
    short nonEmptyBlockCount;
    short tickingBlockCount;
    short tickingFluidCount;
    vector<BlockState> *states;
    vector<Biomes> *biomes;

public:
    /*
    LevelChunkSection(int32_t y, vector<BlockState> states, vector<Biomes> biomes) {
        this->_bottomBlockY = getBottomBlockY(y);
        this->states = new vector<BlockState>(states);
        this->biomes = new vector<Biomes>(biomes);
        this->recalcBlockCounts();
    }
    */

    LevelChunkSection(int32_t y) {
        this->_bottomBlockY = getBottomBlockY(y);

        this->states = new vector<BlockState>(STATES_CONTAINER_SIZE * STATES_CONTAINER_SIZE * STATES_CONTAINER_SIZE);
        fill(this->states->begin(), this->states->end(), Blocks::AIR);

        this->biomes = new vector<Biomes>(BIOME_CONTAINER_SIZE * BIOME_CONTAINER_SIZE * BIOME_CONTAINER_SIZE);
        fill(this->biomes->begin(), this->biomes->end(), Biomes::PLAINS);
    }

private:
    static int32_t getBlockStateIndex(int32_t x, int32_t y, int32_t z) {
        return (z * STATES_CONTAINER_SIZE * STATES_CONTAINER_SIZE + y * STATES_CONTAINER_SIZE + x);
    }

    static int32_t getBiomesIndex(int32_t x, int32_t y, int32_t z) {
        return (z * BIOME_CONTAINER_SIZE * BIOME_CONTAINER_SIZE + y * BIOME_CONTAINER_SIZE + x);
    }

public:
    static int32_t getBottomBlockY(int32_t y) {
        return y << 4;
    }

    BlockState getBlockState(int32_t x, int32_t y, int32_t z) {
        return this->states->at(getBlockStateIndex(x, y, z));
    }

    /*
    FluidState getFluidState(int32_t x, int32_t y, int32_t z) {
        return this->states.get(x, y, z).getFluidState();
    }
    */

    void acquire() {
        // TODO ?
    }

    void release() {
        // TODO ?
    }

    BlockState setBlockState(int32_t x, int32_t y, int32_t z, BlockState blockState) {
        return this->setBlockState(x, y, z, blockState, true);
    }

    BlockState setBlockState(int32_t x, int32_t y, int32_t z, BlockState blockState, bool checked) {
        BlockState prevBlockState;
        if (checked) {
            prevBlockState = this->states->at(getBlockStateIndex(x, y, z));
            this->states->at(getBlockStateIndex(x, y, z)) = blockState;
        } else {
            prevBlockState = this->states->at(getBlockStateIndex(x, y, z));
            this->states->at(getBlockStateIndex(x, y, z)) = blockState;
        }

        /*
        FluidState prevFluidState = prevBlockState.getFluidState();
        FluidState nextFluidState = blockState.getFluidState();
        */
        if (prevBlockState != Blocks::AIR) {
            --this->nonEmptyBlockCount;
            /*
            if (prevBlockState.isRandomlyTicking()) {
                --this->tickingBlockCount;
            }
            */
        }

        /*
        if (!prevFluidState.isEmpty()) {
            --this->tickingFluidCount;
        }
        */

        if (blockState != Blocks::AIR) {
            ++this->nonEmptyBlockCount;
            /*
            if (blockState.isRandomlyTicking()) {
                ++this->tickingBlockCount;
            }
            */
        }

        /*
        if (!nextFluidState.isEmpty()) {
            ++this->tickingFluidCount;
        }
        */

        return prevBlockState;
    }

    bool hasOnlyAir() {
        return this->nonEmptyBlockCount == 0;
    }

    bool isRandomlyTicking() {
        return this->isRandomlyTickingBlocks() || this->isRandomlyTickingFluids();
    }

    bool isRandomlyTickingBlocks() {
        return this->tickingBlockCount > 0;
    }

    bool isRandomlyTickingFluids() {
        return this->tickingFluidCount > 0;
    }

    int32_t bottomBlockY() {
        return this->_bottomBlockY;
    }

    /*
    void recalcBlockCounts() {
        this->nonEmptyBlockCount = 0;
        this->tickingBlockCount = 0;
        this->tickingFluidCount = 0;
        this->states->count([](BlockState blockState, int32_t count) -> void {
            FluidState fluidstate = blockState.getFluidState();
            if (!blockState.isAir()) {
                this->nonEmptyBlockCount = (short)(this->nonEmptyBlockCount + count);
                if (blockState.isRandomlyTicking()) {
                    this->tickingBlockCount = (short)(this->tickingBlockCount + count);
                }
            }

            if (!fluidstate.isEmpty()) {
                this->nonEmptyBlockCount = (short)(this->nonEmptyBlockCount + count);
                if (fluidstate.isRandomlyTicking()) {
                    this->tickingFluidCount = (short)(this->tickingFluidCount + count);
                }
            }
        });
    }
    */

    vector<BlockState> *getStates() {
        return this->states;
    }

    vector<Biomes> *getBiomes() {
        return this->biomes;
    }

    /*
    void read(FriendlyByteBuf buffer) {
        this->nonEmptyBlockCount = buffer.readShort();
        this->states.read(buffer);
        this->biomes.read(buffer);
    }

    void write(FriendlyByteBuf buffer) {
        buffer.writeShort(this->nonEmptyBlockCount);
        this->states.write(buffer);
        this->biomes.write(buffer);
    }

    int32_t getSerializedSize() {
        return 2 + this->states.getSerializedSize() + this->biomes.getSerializedSize();
    }

    bool maybeHas(Predicate<BlockState> predicate) {
        return this->states.maybeHas(predicate);
    }
    */

    Biomes getNoiseBiome(int32_t x, int32_t y, int32_t z) {
        return this->biomes->at(getBiomesIndex(x, y, z));
    }

    void fillBiomesFromNoise(BiomeResolver *resolver, Climate::Sampler *sampler, int32_t offsetX, int32_t offsetZ) {
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
};

class ChunkAccess : public BlockGetter {
private:
    LevelHeightAccessor *levelHeightAccessor;
    ChunkPos *chunkPos;
    NoiseChunk *noiseChunk;

protected:
    vector<LevelChunkSection *> *sections;
    std::map<HeightmapTypes, Heightmap *> *heightmaps;

public:
    bool isLightCorrect;

    ChunkAccess(ChunkPos *chunkPos, LevelHeightAccessor *levelHeightAccessor) {
        this->chunkPos = chunkPos;
        this->levelHeightAccessor = levelHeightAccessor;
        this->sections = new vector<LevelChunkSection *>(levelHeightAccessor->getSectionsCount());
        this->heightmaps = new std::map<HeightmapTypes, Heightmap *>();

        replaceMissingSections(levelHeightAccessor, this->sections);
    }

private:
    static void replaceMissingSections(LevelHeightAccessor *heightAccessor, vector<LevelChunkSection *> *sections) {
        for (int32_t sectionIndex = 0; sectionIndex < sections->size(); ++sectionIndex) {
            if (sections->at(sectionIndex) == nullptr) {
                sections->at(sectionIndex) =
                    new LevelChunkSection(heightAccessor->getSectionYFromSectionIndex(sectionIndex));
            }
        }
    }

public:
    virtual BlockState setBlockState(BlockPos *pos, BlockState blockState, bool checked) = 0;

    LevelChunkSection *getHighestSection() {
        vector<LevelChunkSection *> *sections = this->getSections();

        for (int32_t i = sections->size() - 1; i >= 0; --i) {
            LevelChunkSection *section = sections->at(i);
            if (!section->hasOnlyAir()) {
                return section;
            }
        }

        return nullptr;
    }

    int32_t getHighestSectionPosition() {
        LevelChunkSection *section = this->getHighestSection();
        return section == nullptr ? this->getMinBuildHeight() : section->bottomBlockY();
    }

    vector<LevelChunkSection *> *getSections() {
        return this->sections;
    }

    LevelChunkSection *getSection(int32_t sectionIndex) {
        return this->getSections()->at(sectionIndex);
    }

    /*
    Collection<Entry<HeightmapTypes, Heightmap>> getHeightmaps() {
        return Collections.unmodifiableSet(this->heightmaps.entrySet());
    }

    void setHeightmap(HeightmapTypes type, int64_t *data) {
        this->getOrCreateHeightmapUnprimed(type)->setRawData(this, type, data);
    }
    */

    Heightmap *getOrCreateHeightmapUnprimed(HeightmapTypes type);

    bool hasPrimedHeightmap(HeightmapTypes type) {
        return this->heightmaps->find(type)->second != nullptr;
    }

    int32_t getHeight(HeightmapTypes type, int32_t x, int32_t z);

    ChunkPos *getPos() {
        return this->chunkPos;
    }

    int32_t getMinBuildHeight() override {
        return this->levelHeightAccessor->getMinBuildHeight();
    }

    int32_t getHeight() override {
        return this->levelHeightAccessor->getHeight();
    }

    NoiseChunk *getOrCreateNoiseChunk(NoiseSampler *sampler, function<NoiseFiller(void)> filler,
                                      NoiseGeneratorSettings *settings, Aquifer::FluidPicker *fluidPicker,
                                      Blender *blender);

    Biomes getNoiseBiome(int32_t x, int32_t y, int32_t z) {
        int32_t minY = QuartPos::fromBlock(this->getMinBuildHeight());
        int32_t maxY = minY + QuartPos::fromBlock(this->getHeight()) - 1;
        int32_t clampedY = Mth::clamp(y, minY, maxY);
        int32_t sectionIndex = this->getSectionIndex(QuartPos::toBlock(clampedY));
        return this->sections->at(sectionIndex)->getNoiseBiome(x & 3, clampedY & 3, z & 3);
    }

    void fillBiomesFromNoise(BiomeResolver *resolver, Climate::Sampler *sampler) {
        ChunkPos *chunkpos = this->getPos();
        int32_t x = QuartPos::fromBlock(chunkpos->getMinBlockX());
        int32_t z = QuartPos::fromBlock(chunkpos->getMinBlockZ());
        LevelHeightAccessor *levelheightaccessor = this->getHeightAccessorForGeneration();

        for (int32_t y = levelheightaccessor->getMinSection(); y < levelheightaccessor->getMaxSection(); ++y) {
            LevelChunkSection *section = this->getSection(this->getSectionIndexFromSectionY(y));
            section->fillBiomesFromNoise(resolver, sampler, x, z);
        }
    }

    LevelHeightAccessor *getHeightAccessorForGeneration() {
        return this;
    }

    virtual ChunkStatus *getStatus() = 0;
};

class ProtoChunk : public ChunkAccess {
public:
    ProtoChunk(ChunkPos *chunkPos, LevelHeightAccessor *levelHeightAccessor)
        : ChunkAccess(chunkPos, levelHeightAccessor) {
    }

    BlockState getBlockState(BlockPos *pos) override {
        int32_t y = pos->getY();
        if (this->isOutsideBuildHeight(y)) {
            return Blocks::VOID_AIR;
        } else {
            LevelChunkSection *section = this->getSection(this->getSectionIndex(y));
            return section->hasOnlyAir() ? Blocks::AIR
                                         : section->getBlockState(pos->getX() & 15, y & 15, pos->getZ() & 15);
        }
    }

    Biomes getBiome(BlockPos *pos) {
        int32_t y = pos->getY();
        if (this->isOutsideBuildHeight(y)) {
            return Biomes::NULL_BIOME;
        } else {
            LevelChunkSection *section = this->getSection(this->getSectionIndex(y));
            return section->getNoiseBiome(pos->getX() & 3, y & 3, pos->getZ() & 3);
        }
    }

    BlockState setBlockState(BlockPos *pos, BlockState blockState, bool checked) override;

    ChunkStatus *getStatus() override {
        return nullptr;
    }
};