#pragma once

#include "aquifer.hpp"
#include "biome-manager.hpp"
#include "biome-source.hpp"
#include "blocks.hpp"
#include "chunks.fwd.hpp"
#include "mth.hpp"
#include "noise-chunk.hpp"
#include "noise-data.hpp"
#include "noise/blended-noise.hpp"
#include "noise/normal-noise.hpp"
#include "pos.hpp"
#include "random.hpp"
#include "surface-rules.hpp"
#include "surface-system.hpp"
#include "terrain-shaper.hpp"
#include "worldgen-region.fwd.hpp"

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
    StructureSettings(StrongholdConfiguration const &configuration,
                      std::map<shared_ptr<StructureFeature<T>>, shared_ptr<StructureFeatureConfiguration>> options) {
    }

    StructureSettings(bool canHaveStrongholds) {
    }

    StructureSettings() {
    }
};

class NoiseSlider {
private:
    double target;
    int32_t size;
    int32_t offset;

public:
    NoiseSlider(double target, int32_t size, int32_t offset);
    NoiseSlider() {
    }

    double applySlide(double y, int32_t cellY) const;
};

class NoiseSettings {
public:
    int32_t minY;
    int32_t height;
    NoiseSamplingSettings noiseSamplingSettings;
    NoiseSlider topSlideSettings;
    NoiseSlider bottomSlideSettings;
    int32_t noiseSizeHorizontal;
    int32_t noiseSizeVertical;
    bool islandNoiseOverride;
    bool isAmplified;
    bool largeBiomes;
    TerrainShaper terrainShaper;

    NoiseSettings(int32_t minY, int32_t height, NoiseSamplingSettings const &noiseSamplingSettings,
                  NoiseSlider const &topSlideSettings, NoiseSlider const &bottomSlideSettings,
                  int32_t noiseSizeHorizontal, int32_t noiseSizeVertical, bool islandNoiseOverride, bool isAmplified,
                  bool largeBiomes, TerrainShaper const &terrainShaper);

    NoiseSettings() {
    }

public:
    static NoiseSettings create(int32_t minY, int32_t height, NoiseSamplingSettings const &noiseSamplingSettings,
                                NoiseSlider const &topSlideSettings, NoiseSlider const &bottomSlideSettings,
                                int32_t noiseSizeHorizontal, int32_t noiseSizeVertical, bool islandNoiseOverride,
                                bool isAmplified, bool largeBiomes, TerrainShaper const &terrainShaper);

    int32_t getCellHeight() const;
    int32_t getCellWidth() const;
    int32_t getCellCountY() const;
    int32_t getMinCellY() const;
};

class NoiseGeneratorSettings {
private:
    WorldgenRandom::Algorithm randomSource;
    StructureSettings _structureSettings;
    NoiseSettings _noiseSettings;
    BlockState defaultBlock;
    BlockState defaultFluid;
    shared_ptr<SurfaceRules::RuleSource> _surfaceRule;
    int32_t _seaLevel;
    bool _disableMobGeneration;
    bool aquifersEnabled;
    bool noiseCavesEnabled;
    bool oreVeinsEnabled;
    bool noodleCavesEnabled;

private:
    NoiseGeneratorSettings(StructureSettings const &_structureSettings, NoiseSettings const &_noiseSettings,
                           BlockState defaultBlock, BlockState defaultFluid,
                           const shared_ptr<SurfaceRules::RuleSource> _surfaceRule, int32_t _seaLevel,
                           bool _disableMobGeneration, bool aquifersEnabled, bool noiseCavesEnabled,
                           bool oreVeinsEnabled, bool noodleCavesEnabled, bool useLegacyRandom);
    NoiseGeneratorSettings() {
    }

public:
    StructureSettings const &structureSettings() const;
    NoiseSettings const &noiseSettings() const;
    BlockState getDefaultBlock() const;
    BlockState getDefaultFluid() const;
    const shared_ptr<SurfaceRules::RuleSource> surfaceRule() const;
    int32_t seaLevel() const;
    bool disableMobGeneration() const;
    bool isAquifersEnabled() const;
    bool isNoiseCavesEnabled() const;
    bool isOreVeinsEnabled() const;
    bool isNoodleCavesEnabled() const;
    bool useLegacyRandomSource() const;

    unique_ptr<RandomSource> createRandomSource(int64_t seed) const;
    WorldgenRandom::Algorithm getRandomSource() const;

private:
    static NoiseGeneratorSettings overworld(bool isAmplified, bool isLargeBiomes);

    // TODO
    // static NoiseGeneratorSettings nether();
    static NoiseGeneratorSettings end();

public:
    static NoiseGeneratorSettings OVERWORLD;
    static NoiseGeneratorSettings LARGE_BIOMES;
    static NoiseGeneratorSettings AMPLIFIED;
    // static NoiseGeneratorSettings NETHER;
    static NoiseGeneratorSettings END;
    static NoiseGeneratorSettings CAVES;
    static NoiseGeneratorSettings FLOATING_ISLANDS;

    static void initialize();
    static void finalize();
};

class TerrainInfo {
public:
    double offset, factor, jaggedness;

    TerrainInfo() {
    }

    TerrainInfo(double offset, double factor, double jaggedness);
};

class Blender {
private:
    static Blender EMPTY;

public:
    TerrainInfo const &blendOffsetAndFactor(int32_t x, int32_t z, TerrainInfo const &terrainInfo) const;
    double blendDensity(int32_t x, int32_t y, int32_t z, double density) const;
    shared_ptr<BiomeResolver> getBiomeResolver(shared_ptr<BiomeResolver> resolver) const;

    static Blender const &empty();
};

class NoiseUtils {
public:
    static double sampleNoiseAndMapToRange(NormalNoise const &noise, double x, double y, double z, double v0,
                                           double v1);

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
    TerrainInfo terrainInfo;

    FlatNoiseData() {
    }

    FlatNoiseData(double shiftedX, double shiftedZ, double continentalness, double weirdness, double erosion,
                  TerrainInfo const &terrainInfo);
};

class NoiseSampler : public Climate::Sampler, public enable_shared_from_this<NoiseSampler> {
public:
    enum class VeinType {
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

    NoiseSettings const &noiseSettings;
    bool isNoiseCavesEnabled;
    NoiseChunk::InterpolatableNoise baseNoise;
    BlendedNoise blendedNoise;
    SimplexNoise islandNoise;
    NormalNoise jaggedNoise;
    NormalNoise barrierNoise;
    NormalNoise fluidLevelFloodednessNoise;
    NormalNoise fluidLevelSpreadNoise;
    NormalNoise lavaNoise;
    NormalNoise layerNoiseSource;
    NormalNoise pillarNoiseSource;
    NormalNoise pillarRarenessModulator;
    NormalNoise pillarThicknessModulator;
    NormalNoise spaghetti2DNoiseSource;
    NormalNoise spaghetti2DElevationModulator;
    NormalNoise spaghetti2DRarityModulator;
    NormalNoise spaghetti2DThicknessModulator;
    NormalNoise spaghetti3DNoiseSource1;
    NormalNoise spaghetti3DNoiseSource2;
    NormalNoise spaghetti3DRarityModulator;
    NormalNoise spaghetti3DThicknessModulator;
    NormalNoise spaghettiRoughnessNoise;
    NormalNoise spaghettiRoughnessModulator;
    NormalNoise bigEntranceNoiseSource;
    NormalNoise cheeseNoiseSource;
    NormalNoise temperatureNoise;
    NormalNoise humidityNoise;
    NormalNoise continentalnessNoise;
    NormalNoise erosionNoise;
    NormalNoise weirdnessNoise;
    NormalNoise offsetNoise;
    NormalNoise gapNoise;
    NoiseChunk::InterpolatableNoise veininess;
    NoiseChunk::InterpolatableNoise veinA;
    NoiseChunk::InterpolatableNoise veinB;
    NoiseChunk::InterpolatableNoise noodleToggle;
    NoiseChunk::InterpolatableNoise noodleThickness;
    NoiseChunk::InterpolatableNoise noodleRidgeA;
    NoiseChunk::InterpolatableNoise noodleRidgeB;
    shared_ptr<PositionalRandomFactory> aquiferPositionalRandomFactory;
    shared_ptr<PositionalRandomFactory> oreVeinsPositionalRandomFactory;
    shared_ptr<PositionalRandomFactory> depthBasedLayerPositionalRandomFactory;
    bool amplified;

public:
    NoiseSampler(NoiseSettings const &noiseSettings, bool isNoiseCavesEnabled, int64_t seed,
                 WorldgenRandom::Algorithm algorithm);
    void afterConstructor(NoiseSettings const &noiseSettings, bool isNoiseCavesEnabled, int64_t seed,
                          WorldgenRandom::Algorithm algorithm);

    virtual ~NoiseSampler() {
    }

private:
    static NoiseChunk::InterpolatableNoise yLimitedInterpolatableNoise(NormalNoise const &noise, int32_t minY,
                                                                       int32_t maxY, int32_t outOfRangeValue,
                                                                       double noiseMul);
    double calculateBaseNoise(int32_t x, int32_t y, int32_t z, TerrainInfo const &terrainInfo,
                              Blender const &blender) const;
    double calculateBaseNoise(int32_t x, int32_t y, int32_t z, TerrainInfo const &terrainInfo, double blended,
                              bool isNoiseCavesDisabled, bool useJagged, Blender const &blender) const;
    double sampleJaggedNoise(double jaggedness, double x, double z) const;
    double computeBaseDensity(int32_t y, TerrainInfo const &terrainInfo) const;
    double applySlide(double height, int32_t cellY) const;

public:
    NoiseChunk::BlockStateFiller makeBaseNoiseFiller(shared_ptr<NoiseChunk> chunk, NoiseChunk::NoiseFiller filler,
                                                     bool isNoodleCavesEnabled);
    NoiseChunk::BlockStateFiller makeOreVeinifier(shared_ptr<NoiseChunk> noiseChunk, bool enabled);

    int32_t getPreliminarySurfaceLevel(int32_t x, int32_t z, TerrainInfo const &terrainInfo) const;

    unique_ptr<Aquifer> createAquifer(shared_ptr<NoiseChunk> chunkNoise, int32_t x, int32_t z, int32_t cellY,
                                      int32_t cellCount, shared_ptr<Aquifer::FluidPicker> fluidPicker, bool enabled);

    FlatNoiseData const noiseData(int32_t x, int32_t z, Blender const &blender) const;

    Climate::TargetPoint const sample(int32_t x, int32_t y, int32_t z) const override;
    Climate::TargetPoint const target(int32_t x, int32_t y, int32_t z, FlatNoiseData const &flatData) const;

    TerrainInfo const terrainInfo(int32_t x, int32_t z, float continents, float weirdness, float erosion,
                                  Blender const &blender) const;

    BlockPos const findSpawnPosition() const;

    double getOffset(int32_t x, int32_t y, int32_t z) const;

public:
    double getContinentalness(double x, double y, double z) const;
    double getErosion(double x, double y, double z) const;
    double getWeirdness(double x, double y, double z) const;

private:
    double getTemperature(double x, double y, double z) const;
    double getHumidity(double x, double y, double z) const;
    double getBigEntrances(int32_t x, int32_t y, int32_t z) const;
    double getPillars(int32_t x, int32_t y, int32_t z) const;
    double getLayerizedCaverns(int32_t x, int32_t y, int32_t z) const;
    double getSpaghetti3(int32_t x, int32_t y, int32_t z) const;
    double getSpaghetti2(int32_t x, int32_t y, int32_t z) const;

    double spaghettiRoughness(int32_t x, int32_t y, int32_t z) const;

public:
    shared_ptr<PositionalRandomFactory> getDepthBasedLayerPositionalRandom();

private:
    static double clampToUnit(double value);

    static double sampleWithRarity(NormalNoise const &noise, double x, double y, double z, double rarity);

    bool isVein(double noiseSource1, double noiseSource2);

    NoiseSampler::VeinType getVeinType(double veiness, int32_t y);
};

class ChunkGenerator : public NoiseBiomeSource {
private:
    StructureSettings const &settings;
    int64_t strongholdSeed;

protected:
    shared_ptr<BiomeSource> biomeSource;
    shared_ptr<BiomeSource> runtimeBiomeSource;

public:
    ChunkGenerator(shared_ptr<BiomeSource> biomeSource, StructureSettings const &settings);
    ChunkGenerator(shared_ptr<BiomeSource> biomeSource, shared_ptr<BiomeSource> runtimeBiomeSource,
                   StructureSettings const &settings, int64_t strongholdSeed);

    virtual shared_ptr<ChunkGenerator> withSeed(int64_t seed) = 0;

    virtual shared_ptr<ChunkAccess> createBiomes(Blender const &blender, shared_ptr<ChunkAccess> chunkAccess);
    virtual shared_ptr<Climate::Sampler> climateSampler() const = 0;

    Biomes getNoiseBiome(int32_t x, int32_t y, int32_t z) override;

    StructureSettings const &getSettings() const;

    int32_t getSpawnHeight(LevelHeightAccessor const &heightAccessor) const;

    shared_ptr<BiomeSource> getBiomeSource() const;

    virtual int32_t getGenDepth() const = 0;

    virtual shared_ptr<ChunkAccess> fillFromNoise(Blender const &blender, shared_ptr<ChunkAccess> chunkAccess) = 0;
    virtual shared_ptr<ChunkAccess> buildSurface(shared_ptr<ChunkAccess> chunkAccess) = 0;

    virtual int32_t getSeaLevel() const = 0;

    virtual int32_t getMinY() const = 0;

    virtual int32_t getBaseHeight(int32_t x, int32_t z, HeightmapTypes type,
                                  LevelHeightAccessor const &heightAccessor) const = 0;

    // virtual NoiseColumn* getBaseColumn(int32_t x, int32_t y, LevelHeightAccessor const& heightAccessor) = 0;

    int32_t getFirstFreeHeight(int32_t x, int32_t z, HeightmapTypes type,
                               LevelHeightAccessor const &heightAccessor) const;
    int32_t getFirstOccupiedHeight(int32_t x, int32_t z, HeightmapTypes type,
                                   LevelHeightAccessor const &heightAccessor) const;
};

using WorldGenMaterialRule = function<BlockState(shared_ptr<NoiseChunk> noiseChunk, int32_t x, int32_t y, int32_t z)>;

class SimpleFluidPicker : public Aquifer::FluidPicker {
private:
    int32_t seaLevel;
    Aquifer::FluidStatus lava;
    Aquifer::FluidStatus defaultFluid;

public:
    SimpleFluidPicker(int32_t seaLevel, Aquifer::FluidStatus const &lava, Aquifer::FluidStatus const &defaultFluid);

    Aquifer::FluidStatus computeFluid(int32_t x, int32_t y, int32_t z) override;
};

class BelowZeroRetrogen {
public:
    static shared_ptr<BiomeResolver> getBiomeResolver(shared_ptr<BiomeResolver> resolver,
                                                      shared_ptr<ChunkAccess> chunkAccess) {
        return resolver;
    };
};

class NoiseClimateSampler : public Climate::Sampler {
private:
    shared_ptr<NoiseSampler> sampler;
    shared_ptr<NoiseChunk> noiseChunk;

public:
    NoiseClimateSampler(shared_ptr<NoiseSampler> sampler, shared_ptr<NoiseChunk> noisechunk);

    virtual ~NoiseClimateSampler() {
        objectFreed("NoiseClimateSampler");
    }

    Climate::TargetPoint const sample(int32_t x, int32_t y, int32_t z) const override;
};

class NoiseBasedChunkGenerator : public ChunkGenerator, public enable_shared_from_this<NoiseBasedChunkGenerator> {
private:
    static const BlockState AIR = Blocks::AIR;

    BlockState defaultBlock;
    int64_t seed;
    NoiseGeneratorSettings const &settings;
    shared_ptr<NoiseSampler> sampler;
    shared_ptr<SurfaceSystem> surfaceSystem;
    WorldGenMaterialRule materialRule;
    shared_ptr<Aquifer::FluidPicker> globalFluidPicker;

public:
    shared_ptr<WorldGenRegion> region;

    NoiseBasedChunkGenerator(shared_ptr<BiomeSource> biomeSource, int64_t seed, NoiseGeneratorSettings const &settings);
private:
    NoiseBasedChunkGenerator(shared_ptr<BiomeSource> biomeSource, shared_ptr<BiomeSource> runtimeBiomeSource,
                             int64_t seed, NoiseGeneratorSettings const &settings);

    shared_ptr<ChunkAccess> createBiomes(Blender const &blender, shared_ptr<ChunkAccess> chunkAccess) override;

private:
    void doCreateBiomes(Blender const &blender, shared_ptr<ChunkAccess> chunkAccess);

public:
    shared_ptr<Climate::Sampler> climateSampler() const override;

    shared_ptr<ChunkGenerator> withSeed(int64_t seed) override;

    int32_t getBaseHeight(int32_t x, int32_t z, HeightmapTypes type,
                          LevelHeightAccessor const &heightAccessor) const override;

    shared_ptr<ChunkAccess> fillFromNoise(Blender const &blender, shared_ptr<ChunkAccess> chunkAccess) override;
    shared_ptr<ChunkAccess> buildSurface(shared_ptr<ChunkAccess> chunkAccess) override;

private:
    shared_ptr<ChunkAccess> doFill(Blender const &blender, shared_ptr<ChunkAccess> chunkAccess, int32_t minCellY,
                                   int32_t cellCount);

public:
    int32_t getGenDepth() const override;
    int32_t getSeaLevel() const override;
    int32_t getMinY() const override;
};