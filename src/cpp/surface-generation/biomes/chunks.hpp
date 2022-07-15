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
    virtual int32_t getHeight() = 0;
    virtual int32_t getMinBuildHeight() = 0;

    int32_t getMaxBuildHeight();
    int32_t getSectionsCount();
    int32_t getMinSection();
    int32_t getMaxSection();

    bool isOutsideBuildHeight(BlockPos *pos);
    bool isOutsideBuildHeight(int32_t y);

    int32_t getSectionIndex(int32_t y);
    int32_t getSectionIndexFromSectionY(int32_t sectionY);
    int32_t getSectionYFromSectionIndex(int32_t sectionIndex);
};

class SimpleLevelHeightAccessor : public LevelHeightAccessor {
    int32_t getHeight() override;
    int32_t getMinBuildHeight() override;
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
    LevelChunkSection(int32_t y);

private:
    static constexpr inline int32_t getBlockStateIndex(int32_t x, int32_t y, int32_t z) {
        return (z * STATES_CONTAINER_SIZE * STATES_CONTAINER_SIZE + y * STATES_CONTAINER_SIZE + x);
    }

    static constexpr inline int32_t getBiomesIndex(int32_t x, int32_t y, int32_t z) {
        return (z * BIOME_CONTAINER_SIZE * BIOME_CONTAINER_SIZE + y * BIOME_CONTAINER_SIZE + x);
    }

public:
    static constexpr inline int32_t getBottomBlockY(int32_t y) {
        return y << 4;
    }

    BlockState getBlockState(int32_t x, int32_t y, int32_t z);

    void acquire();
    void release();

    BlockState setBlockState(int32_t x, int32_t y, int32_t z, BlockState blockState);
    BlockState setBlockState(int32_t x, int32_t y, int32_t z, BlockState blockState, bool checked);

    bool hasOnlyAir();
    bool isRandomlyTicking();
    bool isRandomlyTickingBlocks();
    bool isRandomlyTickingFluids();

    int32_t bottomBlockY();

    vector<BlockState> *getStates();
    vector<Biomes> *getBiomes();

    Biomes getNoiseBiome(int32_t x, int32_t y, int32_t z);
    void fillBiomesFromNoise(BiomeResolver *resolver, Climate::Sampler *sampler, int32_t offsetX, int32_t offsetZ);
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

    ChunkAccess(ChunkPos *chunkPos, LevelHeightAccessor *levelHeightAccessor);

private:
    static void replaceMissingSections(LevelHeightAccessor *heightAccessor, vector<LevelChunkSection *> *sections);

public:
    virtual BlockState setBlockState(BlockPos *pos, BlockState blockState, bool checked) = 0;

    LevelChunkSection *getHighestSection();
    int32_t getHighestSectionPosition();
    vector<LevelChunkSection *> *getSections();
    LevelChunkSection *getSection(int32_t sectionIndex);

    Heightmap *getOrCreateHeightmapUnprimed(HeightmapTypes type);
    bool hasPrimedHeightmap(HeightmapTypes type);

    int32_t getHeight(HeightmapTypes type, int32_t x, int32_t z);

    ChunkPos *getPos();

    int32_t getMinBuildHeight() override;
    int32_t getHeight() override;

    NoiseChunk *getOrCreateNoiseChunk(NoiseSampler *sampler, function<NoiseFiller(void)> filler,
                                      NoiseGeneratorSettings *settings, Aquifer::FluidPicker *fluidPicker,
                                      Blender *blender);

    Biomes getNoiseBiome(int32_t x, int32_t y, int32_t z);

    void fillBiomesFromNoise(BiomeResolver *resolver, Climate::Sampler *sampler);

    LevelHeightAccessor *getHeightAccessorForGeneration();

    virtual ChunkStatus *getStatus() = 0;
};

class ProtoChunk : public ChunkAccess {
public:
    ProtoChunk(ChunkPos *chunkPos, LevelHeightAccessor *levelHeightAccessor);

    BlockState getBlockState(BlockPos *pos) override;
    BlockState setBlockState(BlockPos *pos, BlockState blockState, bool checked) override;

    ChunkStatus *getStatus() override;
};