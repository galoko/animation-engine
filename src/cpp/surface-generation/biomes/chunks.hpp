#pragma once

#include "aquifer.hpp"
#include "biome-source.hpp"
#include "biomes.hpp"
#include "chunk-generator.fwd.hpp"
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
    int32_t getHeight() const;
    int32_t getMinBuildHeight() const;

    int32_t getMaxBuildHeight() const;
    int32_t getSectionsCount() const;
    int32_t getMinSection() const;
    int32_t getMaxSection() const;

    bool isOutsideBuildHeight(BlockPos const &pos) const;
    bool isOutsideBuildHeight(int32_t y) const;

    int32_t getSectionIndex(int32_t y) const;
    int32_t getSectionIndexFromSectionY(int32_t sectionY) const;
    int32_t getSectionYFromSectionIndex(int32_t sectionIndex) const;
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
    vector<BlockState> states;
    vector<Biomes> biomes;

public:
    LevelChunkSection() {
    }
    LevelChunkSection(int32_t y);

private:
    static constexpr inline int32_t getBlockStateIndex(int32_t x, int32_t y, int32_t z) {
        return (y * STATES_CONTAINER_SIZE * STATES_CONTAINER_SIZE + z * STATES_CONTAINER_SIZE + x);
    }

    static constexpr inline int32_t getBiomesIndex(int32_t x, int32_t y, int32_t z) {
        return (y * BIOME_CONTAINER_SIZE * BIOME_CONTAINER_SIZE + z * BIOME_CONTAINER_SIZE + x);
    }

public:
    static constexpr inline int32_t getBottomBlockY(int32_t y) {
        return y << 4;
    }

    BlockState getBlockState(int32_t x, int32_t y, int32_t z) const;

    void acquire();
    void release();

    BlockState setBlockState(int32_t x, int32_t y, int32_t z, BlockState blockState);
    BlockState setBlockState(int32_t x, int32_t y, int32_t z, BlockState blockState, bool checked);

    bool hasOnlyAir() const;
    bool isRandomlyTicking() const;
    bool isRandomlyTickingBlocks() const;
    bool isRandomlyTickingFluids() const;

    int32_t bottomBlockY() const;

    vector<BlockState> const &getStates() const;
    vector<Biomes> const &getBiomes() const;

    Biomes getNoiseBiome(int32_t x, int32_t y, int32_t z) const;
    void fillBiomesFromNoise(shared_ptr<BiomeResolver> resolver, shared_ptr<Climate::Sampler> sampler, int32_t offsetX,
                             int32_t offsetZ);
};

class ChunkAccess : public LevelHeightAccessor, public enable_shared_from_this<ChunkAccess> {
private:
    ChunkStatus* status;
    ChunkPos chunkPos;
    LevelHeightAccessor const &levelHeightAccessor;
public:
    shared_ptr<NoiseChunk> noiseChunk;

protected:
    vector<LevelChunkSection> sections;
    std::map<HeightmapTypes, shared_ptr<Heightmap>> heightmaps;

public:
    bool isLightCorrect;

    ChunkAccess(ChunkPos const &chunkPos, LevelHeightAccessor const &levelHeightAccessor);
    virtual ~ChunkAccess();

private:
    static void replaceMissingSections(LevelHeightAccessor const &heightAccessor, vector<LevelChunkSection> &sections);

public:
    LevelChunkSection *getHighestSection();
    int32_t getHighestSectionPosition();
    vector<LevelChunkSection> &getSections();
    LevelChunkSection &getSection(int32_t sectionIndex);

    shared_ptr<Heightmap> getOrCreateHeightmapUnprimed(HeightmapTypes type);
    bool hasPrimedHeightmap(HeightmapTypes type) const;

    int32_t getHeight(HeightmapTypes type, int32_t x, int32_t z);

    ChunkPos const &getPos() const;

    int32_t getMinBuildHeight() const;
    int32_t getHeight() const;

    shared_ptr<NoiseChunk> getOrCreateNoiseChunk(shared_ptr<NoiseSampler> sampler, function<NoiseFiller(void)> filler,
                                                 NoiseGeneratorSettings const &settings,
                                                 shared_ptr<SimpleFluidPicker> fluidPicker, Blender const &blender);

    Biomes getNoiseBiome(int32_t x, int32_t y, int32_t z);

    void fillBiomesFromNoise(shared_ptr<BiomeResolver> resolver, shared_ptr<Climate::Sampler> sampler);

    LevelHeightAccessor const &getHeightAccessorForGeneration();

    BlockState getBlockState(BlockPos const& pos) const;
    BlockState setBlockState(BlockPos const& pos, BlockState blockState, bool checked);

    void setStatus(ChunkStatus* status);
    ChunkStatus* getStatus();
};