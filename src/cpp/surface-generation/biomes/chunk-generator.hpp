#pragma once

#include "biome-source.hpp"
#include "blocks.hpp"
#include "chunks.fwd.hpp"
#include "mth.hpp"
#include "noise-data.hpp"
#include "noise/blended-noise.hpp"
#include "noise/normal-noise.hpp"
#include "pos.hpp"
#include "random.hpp"
#include "surface-rules.hpp"
#include "terrain-shaper.hpp"

#include <map>
#include <set>

using namespace std;

class StrongholdConfiguration {};

class StructureFeatureConfiguration {};

class FeatureConfiguration {};

template <typename T> class StructureFeature {};

class StructureSettings {
public:
    template <typename T>
    StructureSettings(StrongholdConfiguration *configuration,
                      std::map<StructureFeature<T> *, StructureFeatureConfiguration *> options) {
    }

    StructureSettings(bool canHaveStrongholds) {
    }
};

class NoiseSlider {
private:
    double target;
    int32_t size;
    int32_t offset;

public:
    NoiseSlider(double target, int32_t size, int32_t offset);

    double applySlide(double y, int32_t cellY);
};

class NoiseSettings {
public:
    int32_t minY;
    int32_t height;
    NoiseSamplingSettings *noiseSamplingSettings;
    NoiseSlider *topSlideSettings;
    NoiseSlider *bottomSlideSettings;
    int32_t noiseSizeHorizontal;
    int32_t noiseSizeVertical;
    bool islandNoiseOverride;
    bool isAmplified;
    bool largeBiomes;
    TerrainShaper *terrainShaper;

    NoiseSettings(int32_t minY, int32_t height, NoiseSamplingSettings *noiseSamplingSettings,
                  NoiseSlider *topSlideSettings, NoiseSlider *bottomSlideSettings, int32_t noiseSizeHorizontal,
                  int32_t noiseSizeVertical, bool islandNoiseOverride, bool isAmplified, bool largeBiomes,
                  TerrainShaper *terrainShaper);

public:
    static NoiseSettings *create(int32_t minY, int32_t height, NoiseSamplingSettings *noiseSamplingSettings,
                                 NoiseSlider *topSlideSettings, NoiseSlider *bottomSlideSettings,
                                 int32_t noiseSizeHorizontal, int32_t noiseSizeVertical, bool islandNoiseOverride,
                                 bool isAmplified, bool largeBiomes, TerrainShaper *terrainShaper);

    int32_t getCellHeight();
    int32_t getCellWidth();
    int32_t getCellCountY();
    int32_t getMinCellY();
};

class NoiseGeneratorSettings {
private:
    WorldgenRandom::Algorithm randomSource;
    StructureSettings *_structureSettings;
    NoiseSettings *_noiseSettings;
    BlockState defaultBlock;
    BlockState defaultFluid;
    SurfaceRules::RuleSource *_surfaceRule;
    int32_t _seaLevel;
    bool _disableMobGeneration;
    bool aquifersEnabled;
    bool noiseCavesEnabled;
    bool oreVeinsEnabled;
    bool noodleCavesEnabled;

private:
    NoiseGeneratorSettings(StructureSettings *_structureSettings, NoiseSettings *_noiseSettings,
                           BlockState defaultBlock, BlockState defaultFluid, SurfaceRules::RuleSource *_surfaceRule,
                           int32_t _seaLevel, bool _disableMobGeneration, bool aquifersEnabled, bool noiseCavesEnabled,
                           bool oreVeinsEnabled, bool noodleCavesEnabled, bool useLegacyRandom);

public:
    StructureSettings *structureSettings();
    NoiseSettings *noiseSettings();
    BlockState getDefaultBlock();
    BlockState getDefaultFluid();
    SurfaceRules::RuleSource *surfaceRule();
    int32_t seaLevel();
    bool disableMobGeneration();
    bool isAquifersEnabled();
    bool isNoiseCavesEnabled();
    bool isOreVeinsEnabled();
    bool isNoodleCavesEnabled();
    bool useLegacyRandomSource();

    RandomSource *createRandomSource(int64_t seed);
    WorldgenRandom::Algorithm getRandomSource();

private:
    static NoiseGeneratorSettings *end();

    // TODO
    static NoiseGeneratorSettings *nether();
    static NoiseGeneratorSettings *overworld(bool isAmplified, bool isLargeBiomes);
    static NoiseGeneratorSettings *caves();
    static NoiseGeneratorSettings *floatingIslands();

public:
    static NoiseGeneratorSettings *OVERWORLD;
    static NoiseGeneratorSettings *LARGE_BIOMES;
    static NoiseGeneratorSettings *AMPLIFIED;
    static NoiseGeneratorSettings *NETHER;
    static NoiseGeneratorSettings *END;
    static NoiseGeneratorSettings *CAVES;
    static NoiseGeneratorSettings *FLOATING_ISLANDS;
};

class TerrainInfo {
public:
    double offset, factor, jaggedness;

    TerrainInfo(double offset, double factor, double jaggedness);
};

class Blender {
private:
    static Blender *EMPTY;

public:
    TerrainInfo *blendOffsetAndFactor(int32_t x, int32_t z, TerrainInfo *terrainInfo);
    double blendDensity(int32_t x, int32_t y, int32_t z, double density);

    BiomeResolver *getBiomeResolver(BiomeResolver *resolver);

    static Blender *empty();
};

class NoiseUtils {
public:
    static double sampleNoiseAndMapToRange(NormalNoise *noise, double x, double y, double z, double v0, double v1);

private:
    static constexpr double PI = 3.141592653589793238463;

public:
    static double biasTowardsExtreme(double base, double mul) {
        return base + sin(PI * base) * mul / PI;
    }
};

class FlatNoiseData {
public:
    double shiftedX;
    double shiftedZ;
    double continentalness;
    double weirdness;
    double erosion;
    TerrainInfo *terrainInfo;

    FlatNoiseData(double shiftedX, double shiftedZ, double continentalness, double weirdness, double erosion,
                  TerrainInfo *terrainInfo);
};

class NoiseSampler : public Climate::Sampler {
public:
    enum VeinType
    {
        NULL_VEIN,
        COPPER,
        IRON,
    };

    class QuantizedSpaghettiRarity {
    private:
        QuantizedSpaghettiRarity() {
        }

    public:
        static constexpr inline double getSphaghettiRarity2(double rarity) {
            if (rarity < -0.75) {
                return 0.5;
            } else if (rarity < -0.5) {
                return 0.75;
            } else if (rarity < 0.5) {
                return 1.0;
            } else {
                return rarity < 0.75 ? 2.0 : 3.0;
            }
        }

        static constexpr inline double getSpaghettiRarity3(double rarity) {
            if (rarity < -0.5) {
                return 0.75;
            } else if (rarity < 0.0) {
                return 1.0;
            } else {
                return rarity < 0.5 ? 1.5 : 2.0;
            }
        }
    };

private:
    static constexpr float ORE_VEIN_RARITY = 1.0F;
    static constexpr float ORE_THICKNESS = 0.08F;
    static constexpr float VEININESS_THRESHOLD = 0.4F;
    static constexpr double VEININESS_FREQUENCY = 1.5;
    static constexpr int32_t EDGE_ROUNDOFF_BEGIN = 20;
    static constexpr double MAX_EDGE_ROUNDOFF = 0.2;
    static constexpr float VEIN_SOLIDNESS = 0.7F;
    static constexpr float MIN_RICHNESS = 0.1F;
    static constexpr float MAX_RICHNESS = 0.3F;
    static constexpr float MAX_RICHNESS_THRESHOLD = 0.6F;
    static constexpr float CHANCE_OF_RAW_ORE_BLOCK = 0.02F;
    static constexpr float SKIP_ORE_IF_GAP_NOISE_IS_BELOW = -0.3F;
    static constexpr double NOODLE_SPACING_AND_STRAIGHTNESS = 1.5;

    NoiseSettings *noiseSettings;
    bool isNoiseCavesEnabled;
    NoiseChunk::InterpolatableNoise baseNoise;
    BlendedNoise *blendedNoise;
    SimplexNoise *islandNoise;
    NormalNoise *jaggedNoise;
    NormalNoise *barrierNoise;
    NormalNoise *fluidLevelFloodednessNoise;
    NormalNoise *fluidLevelSpreadNoise;
    NormalNoise *lavaNoise;
    NormalNoise *layerNoiseSource;
    NormalNoise *pillarNoiseSource;
    NormalNoise *pillarRarenessModulator;
    NormalNoise *pillarThicknessModulator;
    NormalNoise *spaghetti2DNoiseSource;
    NormalNoise *spaghetti2DElevationModulator;
    NormalNoise *spaghetti2DRarityModulator;
    NormalNoise *spaghetti2DThicknessModulator;
    NormalNoise *spaghetti3DNoiseSource1;
    NormalNoise *spaghetti3DNoiseSource2;
    NormalNoise *spaghetti3DRarityModulator;
    NormalNoise *spaghetti3DThicknessModulator;
    NormalNoise *spaghettiRoughnessNoise;
    NormalNoise *spaghettiRoughnessModulator;
    NormalNoise *bigEntranceNoiseSource;
    NormalNoise *cheeseNoiseSource;
    NormalNoise *temperatureNoise;
    NormalNoise *humidityNoise;
    NormalNoise *continentalnessNoise;
    NormalNoise *erosionNoise;
    NormalNoise *weirdnessNoise;
    NormalNoise *offsetNoise;
    NormalNoise *gapNoise;
    NoiseChunk::InterpolatableNoise veininess;
    NoiseChunk::InterpolatableNoise veinA;
    NoiseChunk::InterpolatableNoise veinB;
    NoiseChunk::InterpolatableNoise noodleToggle;
    NoiseChunk::InterpolatableNoise noodleThickness;
    NoiseChunk::InterpolatableNoise noodleRidgeA;
    NoiseChunk::InterpolatableNoise noodleRidgeB;
    PositionalRandomFactory *aquiferPositionalRandomFactory;
    PositionalRandomFactory *oreVeinsPositionalRandomFactory;
    PositionalRandomFactory *depthBasedLayerPositionalRandomFactory;
    bool amplified;

public:
    NoiseSampler(NoiseSettings *noiseSettings, bool isNoiseCavesEnabled, int64_t seed,
                 WorldgenRandom::Algorithm algorithm);

private:
    static NoiseChunk::InterpolatableNoise yLimitedInterpolatableNoise(NormalNoise *noise, int32_t minY, int32_t maxY,
                                                                       int32_t outOfRangeValue, double noiseMul);
    double calculateBaseNoise(int32_t x, int32_t y, int32_t z, TerrainInfo *terrainInfo, Blender *blender);
    double calculateBaseNoise(int32_t x, int32_t y, int32_t z, TerrainInfo *terrainInfo, double blended,
                              bool isNoiseCavesDisabled, bool useJagged, Blender *blender);
    double sampleJaggedNoise(double jaggedness, double x, double z);
    double computeBaseDensity(int32_t y, TerrainInfo *terrainInfo);
    double applySlide(double height, int32_t cellY);

public:
    NoiseChunk::BlockStateFiller makeBaseNoiseFiller(NoiseChunk *chunk, NoiseChunk::NoiseFiller filler,
                                                     bool isNoodleCavesEnabled);
    NoiseChunk::BlockStateFiller makeOreVeinifier(NoiseChunk *noiseChunk, bool enabled);

    int32_t getPreliminarySurfaceLevel(int32_t x, int32_t z, TerrainInfo *terrainInfo);

    Aquifer *createAquifer(NoiseChunk *chunkNoise, int32_t x, int32_t z, int32_t cellY, int32_t cellCount,
                           Aquifer::FluidPicker *fluidPicker, bool enabled);

    FlatNoiseData *noiseData(int32_t x, int32_t z, Blender *blender);

    Climate::TargetPoint *sample(int32_t x, int32_t y, int32_t z) override;
    Climate::TargetPoint *target(int32_t x, int32_t y, int32_t z, FlatNoiseData *flatData);

    TerrainInfo *terrainInfo(int32_t x, int32_t z, float continents, float weirdness, float erosion, Blender *blender);

    BlockPos *findSpawnPosition();

    double getOffset(int32_t x, int32_t y, int32_t z);

public:
    double getContinentalness(double x, double y, double z);
    double getErosion(double x, double y, double z);
    double getWeirdness(double x, double y, double z);

private:
    double getTemperature(double x, double y, double z);
    double getHumidity(double x, double y, double z);
    double getBigEntrances(int32_t x, int32_t y, int32_t z);
    double getPillars(int32_t x, int32_t y, int32_t z);
    double getLayerizedCaverns(int32_t x, int32_t y, int32_t z);
    double getSpaghetti3(int32_t x, int32_t y, int32_t z);
    double getSpaghetti2(int32_t x, int32_t y, int32_t z);

    double spaghettiRoughness(int32_t x, int32_t y, int32_t z);

public:
    PositionalRandomFactory *getDepthBasedLayerPositionalRandom();

private:
    static double clampToUnit(double value);

    static double sampleWithRarity(NormalNoise *noise, double x, double y, double z, double rarity);

    bool isVein(double noiseSource1, double noiseSource2);

    NoiseSampler::VeinType getVeinType(double veiness, int32_t y);
};

class NoiseBiomeSource {
public:
    virtual Biomes getNoiseBiome(int32_t x, int32_t y, int32_t z) = 0;
};

class ChunkGenerator : public NoiseBiomeSource {
private:
    StructureSettings *settings;
    int64_t strongholdSeed;

protected:
    BiomeSource *biomeSource;
    BiomeSource *runtimeBiomeSource;

public:
    ChunkGenerator(BiomeSource *biomeSource, StructureSettings *settings);
    ChunkGenerator(BiomeSource *biomeSource, BiomeSource *runtimeBiomeSource, StructureSettings *settings,
                   int64_t strongholdSeed);

    virtual ChunkGenerator *withSeed(int64_t seed) = 0;

    virtual ChunkAccess *createBiomes(Blender *blender, ChunkAccess *chunk);
    virtual Climate::Sampler *climateSampler() = 0;

    Biomes getNoiseBiome(int32_t x, int32_t y, int32_t z) override;

    StructureSettings *getSettings();

    int32_t getSpawnHeight(LevelHeightAccessor *heightAccessor);

    BiomeSource *getBiomeSource();

    virtual int32_t getGenDepth() = 0;

    virtual ChunkAccess *fillFromNoise(Blender *blender, ChunkAccess *chunkAccess) = 0;

    virtual int32_t getSeaLevel() = 0;

    virtual int32_t getMinY() = 0;

    virtual int32_t getBaseHeight(int32_t x, int32_t z, HeightmapTypes type, LevelHeightAccessor *heightAccessor) = 0;

    // virtual NoiseColumn *getBaseColumn(int32_t x, int32_t y, LevelHeightAccessor *heightAccessor) = 0;

    int32_t getFirstFreeHeight(int32_t x, int32_t z, HeightmapTypes type, LevelHeightAccessor *heightAccessor);
    int32_t getFirstOccupiedHeight(int32_t x, int32_t z, HeightmapTypes type, LevelHeightAccessor *heightAccessor);
};

using WorldGenMaterialRule = function<BlockState(NoiseChunk *noiseChunk, int32_t x, int32_t y, int32_t z)>;

class SimpleFluidPicker : public Aquifer::FluidPicker {
private:
    int32_t seaLevel;
    Aquifer::FluidStatus *lava;
    Aquifer::FluidStatus *defaultFluid;

public:
    SimpleFluidPicker(int32_t seaLevel, Aquifer::FluidStatus *lava, Aquifer::FluidStatus *defaultFluid);

    Aquifer::FluidStatus *computeFluid(int32_t x, int32_t y, int32_t z) override;
};

WorldGenMaterialRule makeMaterialRuleList(vector<WorldGenMaterialRule> rules) {
    return [rules](NoiseChunk *noiseChunk, int32_t x, int32_t y, int32_t z) -> BlockState {
        for (const WorldGenMaterialRule &rule : rules) {
            BlockState blockstate = rule(noiseChunk, x, y, z);
            if (blockstate != Blocks::NULL_BLOCK) {
                return blockstate;
            }
        }

        return Blocks::NULL_BLOCK;
    };
}

class BelowZeroRetrogen {
public:
    static BiomeResolver *getBiomeResolver(BiomeResolver *resolver, ChunkAccess *chunkAccess) {
        return resolver;
    };
};

NoiseFiller makeBeardifier(ChunkAccess *chunkAccess) {
    return [](int32_t x, int32_t y, int32_t z) -> double { return 0; };
}

class NoiseClimateSampler : public Climate::Sampler {
private:
    NoiseSampler *sampler;
    NoiseChunk *noisechunk;

public:
    NoiseClimateSampler(NoiseSampler *sampler, NoiseChunk *noisechunk);

    Climate::TargetPoint *sample(int32_t x, int32_t y, int32_t z) override;
};

class NoiseBasedChunkGenerator : public ChunkGenerator {
private:
    static const BlockState AIR = Blocks::AIR;

    BlockState defaultBlock;
    int64_t seed;
    function<NoiseGeneratorSettings *(void)> settings;
    NoiseSampler *sampler;
    // SurfaceSystem *surfaceSystem;
    WorldGenMaterialRule materialRule;
    Aquifer::FluidPicker *globalFluidPicker;

public:
    NoiseBasedChunkGenerator(BiomeSource *biomeSource, int64_t seed, function<NoiseGeneratorSettings *(void)> settings);

private:
    NoiseBasedChunkGenerator(BiomeSource *biomeSource, BiomeSource *runtimeBiomeSource, int64_t seed,
                             function<NoiseGeneratorSettings *(void)> settings);

    ChunkAccess *createBiomes(Blender *blender, ChunkAccess *chunkAccess) override;

private:
    void doCreateBiomes(Blender *blender, ChunkAccess *chunkAccess);

public:
    Climate::Sampler *climateSampler() override;

    ChunkGenerator *withSeed(int64_t seed) override;

    int32_t getBaseHeight(int32_t x, int32_t z, HeightmapTypes type, LevelHeightAccessor *heightAccessor) override;

    ChunkAccess *fillFromNoise(Blender *blender, ChunkAccess *chunkAccess) override;

private:
    ChunkAccess *doFill(Blender *blender, ChunkAccess *chunkAccess, int32_t minCellY, int32_t cellCount);

public:
    int32_t getGenDepth() override;
    int32_t getSeaLevel() override;
    int32_t getMinY() override;
};