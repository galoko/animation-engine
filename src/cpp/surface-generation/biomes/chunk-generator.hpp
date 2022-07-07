#pragma once

#include "biome-source.hpp"
#include "blocks.hpp"
#include "chunk-generator.fwd.hpp"
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
#define _USE_MATH_DEFINES
#include <math.h>

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
        //
    }

    StructureSettings(bool canHaveStrongholds) {
        // TODO
    }
};

class NoiseSlider {
private:
    double target;
    int32_t size;
    int32_t offset;

public:
    NoiseSlider(double target, int32_t size, int32_t offset) {
        this->target = target;
        this->size = size;
        this->offset = offset;
    }

    double applySlide(double y, int32_t cellY) {
        if (this->size <= 0) {
            return y;
        } else {
            double t = (double)(cellY - this->offset) / (double)this->size;
            return Mth::clampedLerp(this->target, y, t);
        }
    }
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
                  TerrainShaper *terrainShaper) {
        this->minY = minY;
        this->height = height;
        this->noiseSamplingSettings = noiseSamplingSettings;
        this->topSlideSettings = topSlideSettings;
        this->bottomSlideSettings = bottomSlideSettings;
        this->noiseSizeHorizontal = noiseSizeHorizontal;
        this->noiseSizeVertical = noiseSizeVertical;
        this->islandNoiseOverride = islandNoiseOverride;
        this->isAmplified = isAmplified;
        this->largeBiomes = largeBiomes;
        this->terrainShaper = terrainShaper;
    }

public:
    static NoiseSettings *create(int32_t minY, int32_t height, NoiseSamplingSettings *noiseSamplingSettings,
                                 NoiseSlider *topSlideSettings, NoiseSlider *bottomSlideSettings,
                                 int32_t noiseSizeHorizontal, int32_t noiseSizeVertical, bool islandNoiseOverride,
                                 bool isAmplified, bool largeBiomes, TerrainShaper *terrainShaper) {
        NoiseSettings *noisesettings = new NoiseSettings(minY, height, noiseSamplingSettings, topSlideSettings,
                                                         bottomSlideSettings, noiseSizeHorizontal, noiseSizeVertical,
                                                         islandNoiseOverride, isAmplified, largeBiomes, terrainShaper);
        return noisesettings;
    }

    int32_t getCellHeight() {
        return QuartPos::toBlock(this->noiseSizeVertical);
    }

    int32_t getCellWidth() {
        return QuartPos::toBlock(this->noiseSizeHorizontal);
    }

    int32_t getCellCountY() {
        return this->height / this->getCellHeight();
    }

    int32_t getMinCellY() {
        return Mth::intFloorDiv(this->minY, this->getCellHeight());
    }
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
                           bool oreVeinsEnabled, bool noodleCavesEnabled, bool useLegacyRandom) {
        this->_structureSettings = _structureSettings;
        this->_noiseSettings = _noiseSettings;
        this->defaultBlock = defaultBlock;
        this->defaultFluid = defaultFluid;
        this->_surfaceRule = _surfaceRule;
        this->_seaLevel = _seaLevel;
        this->_disableMobGeneration = _disableMobGeneration;
        this->aquifersEnabled = aquifersEnabled;
        this->noiseCavesEnabled = noiseCavesEnabled;
        this->oreVeinsEnabled = oreVeinsEnabled;
        this->noodleCavesEnabled = noodleCavesEnabled;
        this->randomSource = useLegacyRandom ? WorldgenRandom::Algorithm::LEGACY : WorldgenRandom::Algorithm::XOROSHIRO;
    }

public:
    StructureSettings *structureSettings() {
        return this->_structureSettings;
    }

    NoiseSettings *noiseSettings() {
        return this->_noiseSettings;
    }

    BlockState getDefaultBlock() {
        return this->defaultBlock;
    }

    BlockState getDefaultFluid() {
        return this->defaultFluid;
    }

    SurfaceRules::RuleSource *surfaceRule() {
        return this->_surfaceRule;
    }

    int32_t seaLevel() {
        return this->_seaLevel;
    }

    bool disableMobGeneration() {
        return this->_disableMobGeneration;
    }

    bool isAquifersEnabled() {
        return this->aquifersEnabled;
    }

    bool isNoiseCavesEnabled() {
        return this->noiseCavesEnabled;
    }

    bool isOreVeinsEnabled() {
        return this->oreVeinsEnabled;
    }

    bool isNoodleCavesEnabled() {
        return false;
    }

    bool useLegacyRandomSource() {
        return this->randomSource == WorldgenRandom::Algorithm::LEGACY;
    }

    RandomSource *createRandomSource(int64_t seed) {
        return WorldgenRandom::Algorithm_newInstance(this->getRandomSource(), seed);
    }

    WorldgenRandom::Algorithm getRandomSource() {
        return this->randomSource;
    }

private:
    static NoiseGeneratorSettings *end() {
        return new NoiseGeneratorSettings(
            new StructureSettings(false),
            NoiseSettings::create(0, 128, new NoiseSamplingSettings(2.0, 1.0, 80.0, 160.0),
                                  new NoiseSlider(-23.4375, 64, -46), new NoiseSlider(-0.234375, 7, 1), 2, 1, true,
                                  false, false, TerrainProvider::end()),
            Blocks::END_STONE, Blocks::AIR, SurfaceRuleData::end(), 0, true, false, false, false, false, true);
    }

    // TODO
    static NoiseGeneratorSettings *nether() {
        /*
        map<StructureFeature<FeatureConfiguration>, StructureFeatureConfiguration> map =
            Maps.newHashMap(StructureSettings.DEFAULTS);
        map.put(StructureFeature.RUINED_PORTAL, new StructureFeatureConfiguration(25, 10, 34222645));
        return new NoiseGeneratorSettings(
            new StructureSettings(nullptr, map),
            NoiseSettings::create(0, 128, new NoiseSamplingSettings(1.0, 3.0, 80.0, 60.0),
                                  new NoiseSlider(0.9375, 3, 0), new NoiseSlider(2.5, 4, -1), 1, 2, false, false, false,
                                  TerrainProvider::nether()),
            Blocks::NETHERRACK, Blocks::LAVA, SurfaceRuleData::nether(), 32, false, false, false, false, false, true);
        */
        return nullptr;
    }

    static NoiseGeneratorSettings *overworld(bool isAmplified, bool isLargeBiomes) {
        return new NoiseGeneratorSettings(
            new StructureSettings(true),
            NoiseSettings::create(-64, 384, new NoiseSamplingSettings(1.0, 1.0, 80.0, 160.0),
                                  new NoiseSlider(-0.078125, 2, isAmplified ? 0 : 8),
                                  new NoiseSlider(isAmplified ? 0.4 : 0.1171875, 3, 0), 1, 2, false, isAmplified,
                                  isLargeBiomes, TerrainProvider::overworld(isAmplified)),
            Blocks::STONE, Blocks::WATER, SurfaceRuleData::overworld(), 63, false, true, true, true, true, false);
    }

    static NoiseGeneratorSettings *caves() {
        return new NoiseGeneratorSettings(
            new StructureSettings(false),
            NoiseSettings::create(-64, 192, new NoiseSamplingSettings(1.0, 3.0, 80.0, 60.0),
                                  new NoiseSlider(0.9375, 3, 0), new NoiseSlider(2.5, 4, -1), 1, 2, false, false, false,
                                  TerrainProvider::caves()),
            Blocks::STONE, Blocks::WATER, SurfaceRuleData::overworldLike(false, true, true), 32, false, false, false,
            false, false, true);
    }

    static NoiseGeneratorSettings *floatingIslands() {
        return new NoiseGeneratorSettings(
            new StructureSettings(true),
            NoiseSettings::create(0, 256, new NoiseSamplingSettings(2.0, 1.0, 80.0, 160.0),
                                  new NoiseSlider(-23.4375, 64, -46), new NoiseSlider(-0.234375, 7, 1), 2, 1, false,
                                  false, false, TerrainProvider::floatingIslands()),
            Blocks::STONE, Blocks::WATER, SurfaceRuleData::overworldLike(false, false, false), -64, false, false, false,
            false, false, true);
    }

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

    TerrainInfo(double offset, double factor, double jaggedness) {
        this->offset = offset;
        this->factor = factor;
        this->jaggedness = jaggedness;
    }
};

class Blender {
private:
    static Blender *EMPTY;

public:
    TerrainInfo *blendOffsetAndFactor(int32_t x, int32_t z, TerrainInfo *terrainInfo) {
        return terrainInfo;
    }

    double blendDensity(int32_t x, int32_t y, int32_t z, double density) {
        return density;
    }

    BiomeResolver *getBiomeResolver(BiomeResolver *resolver) {
        return resolver;
    }

    static Blender *empty() {
        return EMPTY;
    }
};

class NoiseUtils {
public:
    static double sampleNoiseAndMapToRange(NormalNoise *noise, double x, double y, double z, double v0, double v1) {
        double t = noise->getValue(x, y, z);
        return Mth::map(t, -1.0, 1.0, v0, v1);
    }

    static double biasTowardsExtreme(double base, double mul) {
        return base + std::sin(M_PI * base) * mul / M_PI;
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
                  TerrainInfo *terrainInfo) {
        this->shiftedX = shiftedX;
        this->shiftedZ = shiftedZ;
        this->continentalness = continentalness;
        this->weirdness = weirdness;
        this->erosion = erosion;
        this->terrainInfo = terrainInfo;
    }
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
        static double getSphaghettiRarity2(double rarity) {
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

        static double getSpaghettiRarity3(double rarity) {
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
                 WorldgenRandom::Algorithm algorithm) {
        this->noiseSettings = noiseSettings;
        this->isNoiseCavesEnabled = isNoiseCavesEnabled;
        this->baseNoise = [this](NoiseChunk *noiseChunk) -> NoiseChunk::Sampler * {
            return noiseChunk->createNoiseInterpolator([this, noiseChunk](int32_t x, int32_t y, int32_t z) -> double {
                return this->calculateBaseNoise(
                    x, y, z, noiseChunk->noiseData(QuartPos::fromBlock(x), QuartPos::fromBlock(z))->terrainInfo,
                    noiseChunk->getBlender());
            });
        };
        if (noiseSettings->islandNoiseOverride) {
            RandomSource *randomsource = WorldgenRandom::Algorithm_newInstance(algorithm, seed);
            randomsource->consumeCount(17292);
            this->islandNoise = new SimplexNoise(randomsource);
        } else {
            this->islandNoise = nullptr;
        }

        this->amplified = noiseSettings->isAmplified;
        int32_t minY = noiseSettings->minY;
        int32_t minVeinY = minY;
        int32_t maxVeinY = minY;
        int32_t clampedMinY = minY + 4;
        int32_t clampedMaxY = minY + noiseSettings->height;
        bool largeBiomes = noiseSettings->largeBiomes;
        PositionalRandomFactory *positionalrandomfactory =
            WorldgenRandom::Algorithm_newInstance(algorithm, seed)->forkPositional();
        if (algorithm != WorldgenRandom::Algorithm::LEGACY) {
            this->blendedNoise = new BlendedNoise(positionalrandomfactory->fromHashOfResourceLocation("terrain"),
                                                  noiseSettings->noiseSamplingSettings, noiseSettings->getCellWidth(),
                                                  noiseSettings->getCellHeight());
            this->temperatureNoise = Noises_instantiate(positionalrandomfactory,
                                                        largeBiomes ? Noises::TEMPERATURE_LARGE : Noises::TEMPERATURE);
            this->humidityNoise = Noises_instantiate(positionalrandomfactory,
                                                     largeBiomes ? Noises::VEGETATION_LARGE : Noises::VEGETATION);
            this->offsetNoise = Noises_instantiate(positionalrandomfactory, Noises::SHIFT);
        } else {
            this->blendedNoise = new BlendedNoise(WorldgenRandom::Algorithm_newInstance(algorithm, seed),
                                                  noiseSettings->noiseSamplingSettings, noiseSettings->getCellWidth(),
                                                  noiseSettings->getCellHeight());
            this->temperatureNoise =
                NormalNoise::createLegacyNetherBiome(WorldgenRandom::Algorithm_newInstance(algorithm, seed),
                                                     new NormalNoise::NoiseParameters(-7, 1.0, {1.0}));
            this->humidityNoise =
                NormalNoise::createLegacyNetherBiome(WorldgenRandom::Algorithm_newInstance(algorithm, seed + 1L),
                                                     new NormalNoise::NoiseParameters(-7, 1.0, {1.0}));
            this->offsetNoise =
                NormalNoise::create(positionalrandomfactory->fromHashOfResourceLocation(getNoiseName(Noises::SHIFT)),
                                    new NormalNoise::NoiseParameters(0, 0.0));
        }

        this->aquiferPositionalRandomFactory =
            positionalrandomfactory->fromHashOfResourceLocation("aquifer")->forkPositional();
        this->oreVeinsPositionalRandomFactory =
            positionalrandomfactory->fromHashOfResourceLocation("ore")->forkPositional();
        this->depthBasedLayerPositionalRandomFactory =
            positionalrandomfactory->fromHashOfResourceLocation("depth_based_layer")->forkPositional();
        this->barrierNoise = Noises_instantiate(positionalrandomfactory, Noises::AQUIFER_BARRIER);
        this->fluidLevelFloodednessNoise =
            Noises_instantiate(positionalrandomfactory, Noises::AQUIFER_FLUID_LEVEL_FLOODEDNESS);
        this->lavaNoise = Noises_instantiate(positionalrandomfactory, Noises::AQUIFER_LAVA);
        this->fluidLevelSpreadNoise = Noises_instantiate(positionalrandomfactory, Noises::AQUIFER_FLUID_LEVEL_SPREAD);
        this->pillarNoiseSource = Noises_instantiate(positionalrandomfactory, Noises::PILLAR);
        this->pillarRarenessModulator = Noises_instantiate(positionalrandomfactory, Noises::PILLAR_RARENESS);
        this->pillarThicknessModulator = Noises_instantiate(positionalrandomfactory, Noises::PILLAR_THICKNESS);
        this->spaghetti2DNoiseSource = Noises_instantiate(positionalrandomfactory, Noises::SPAGHETTI_2);
        this->spaghetti2DElevationModulator =
            Noises_instantiate(positionalrandomfactory, Noises::SPAGHETTI_2D_ELEVATION);
        this->spaghetti2DRarityModulator = Noises_instantiate(positionalrandomfactory, Noises::SPAGHETTI_2D_MODULATOR);
        this->spaghetti2DThicknessModulator =
            Noises_instantiate(positionalrandomfactory, Noises::SPAGHETTI_2D_THICKNESS);
        this->spaghetti3DNoiseSource1 = Noises_instantiate(positionalrandomfactory, Noises::SPAGHETTI_3D_1);
        this->spaghetti3DNoiseSource2 = Noises_instantiate(positionalrandomfactory, Noises::SPAGHETTI_3D_2);
        this->spaghetti3DRarityModulator = Noises_instantiate(positionalrandomfactory, Noises::SPAGHETTI_3D_RARITY);
        this->spaghetti3DThicknessModulator =
            Noises_instantiate(positionalrandomfactory, Noises::SPAGHETTI_3D_THICKNESS);
        this->spaghettiRoughnessNoise = Noises_instantiate(positionalrandomfactory, Noises::SPAGHETTI_ROUGHNESS);
        this->spaghettiRoughnessModulator =
            Noises_instantiate(positionalrandomfactory, Noises::SPAGHETTI_ROUGHNESS_MODULATOR);
        this->bigEntranceNoiseSource = Noises_instantiate(positionalrandomfactory, Noises::CAVE_ENTRANCE);
        this->layerNoiseSource = Noises_instantiate(positionalrandomfactory, Noises::CAVE_LAYER);
        this->cheeseNoiseSource = Noises_instantiate(positionalrandomfactory, Noises::CAVE_CHEESE);
        this->continentalnessNoise = Noises_instantiate(
            positionalrandomfactory, largeBiomes ? Noises::CONTINENTALNESS_LARGE : Noises::CONTINENTALNESS);
        this->erosionNoise =
            Noises_instantiate(positionalrandomfactory, largeBiomes ? Noises::EROSION_LARGE : Noises::EROSION);
        this->weirdnessNoise = Noises_instantiate(positionalrandomfactory, Noises::RIDGE);
        this->veininess = yLimitedInterpolatableNoise(
            Noises_instantiate(positionalrandomfactory, Noises::ORE_VEININESS), minVeinY, maxVeinY, 0, 1.5);
        this->veinA = yLimitedInterpolatableNoise(Noises_instantiate(positionalrandomfactory, Noises::ORE_VEIN_A),
                                                  minVeinY, maxVeinY, 0, 4.0);
        this->veinB = yLimitedInterpolatableNoise(Noises_instantiate(positionalrandomfactory, Noises::ORE_VEIN_B),
                                                  minVeinY, maxVeinY, 0, 4.0);
        this->gapNoise = Noises_instantiate(positionalrandomfactory, Noises::ORE_GAP);
        this->noodleToggle = yLimitedInterpolatableNoise(Noises_instantiate(positionalrandomfactory, Noises::NOODLE),
                                                         clampedMinY, clampedMaxY, -1, 1.0);
        this->noodleThickness = yLimitedInterpolatableNoise(
            Noises_instantiate(positionalrandomfactory, Noises::NOODLE_THICKNESS), clampedMinY, clampedMaxY, 0, 1.0);
        this->noodleRidgeA =
            yLimitedInterpolatableNoise(Noises_instantiate(positionalrandomfactory, Noises::NOODLE_RIDGE_A),
                                        clampedMinY, clampedMaxY, 0, 2.6666666666666665);
        this->noodleRidgeB =
            yLimitedInterpolatableNoise(Noises_instantiate(positionalrandomfactory, Noises::NOODLE_RIDGE_B),
                                        clampedMinY, clampedMaxY, 0, 2.6666666666666665);
        this->jaggedNoise = Noises_instantiate(positionalrandomfactory, Noises::JAGGED);
    }

private:
    static NoiseChunk::InterpolatableNoise yLimitedInterpolatableNoise(NormalNoise *noise, int32_t minY, int32_t maxY,
                                                                       int32_t outOfRangeValue, double noiseMul) {
        NoiseChunk::NoiseFiller filler = [noise, minY, maxY, outOfRangeValue, noiseMul](int32_t x, int32_t y,
                                                                                        int32_t z) -> double {
            return y <= maxY && y >= minY
                       ? noise->getValue((double)x * noiseMul, (double)y * noiseMul, (double)z * noiseMul)
                       : (double)outOfRangeValue;
        };
        return [filler](NoiseChunk *chunk) -> NoiseChunk::Sampler * { return chunk->createNoiseInterpolator(filler); };
    }

    double calculateBaseNoise(int32_t x, int32_t y, int32_t z, TerrainInfo *terrainInfo, Blender *blender) {
        double blended = this->blendedNoise->calculateNoise(x, y, z);
        bool isNoiseCavesDisabled = !this->isNoiseCavesEnabled;
        return this->calculateBaseNoise(x, y, z, terrainInfo, blended, isNoiseCavesDisabled, true, blender);
    }

    double calculateBaseNoise(int32_t x, int32_t y, int32_t z, TerrainInfo *terrainInfo, double blended,
                              bool isNoiseCavesDisabled, bool useJagged, Blender *blender) {
        double height;
        if (this->islandNoise != nullptr) {
            // TODO
            // height = ((double)TheEndBiomeSource::getHeightValue(this->islandNoise, x / 8, z / 8) - 8.0) / 128.0;
            height = 0;
        } else {
            double jagged = useJagged ? this->sampleJaggedNoise(terrainInfo->jaggedness, (double)x, (double)z) : 0.0;
            double density = (this->computeBaseDensity(y, terrainInfo) + jagged) * terrainInfo->factor;
            height = density * (double)(density > 0.0 ? 4 : 1);
        }

        double blendedHeight = height + blended;
        double someHeight;
        double spaghettiHeight;
        double pillars;
        if (!isNoiseCavesDisabled && !(blendedHeight < -64.0)) {
            double blendedHeightMinusWhatever = blendedHeight - 1.5625;
            bool isNegativeHeight = blendedHeightMinusWhatever < 0.0;
            double bigEntrance = this->getBigEntrances(x, y, z);
            double spaghettiRoughness = this->spaghettiRoughness(x, y, z);
            double spaghetti3 = this->getSpaghetti3(x, y, z);
            double minBetweenBigEntranceAndSpaghetti = std::min(bigEntrance, spaghetti3 + spaghettiRoughness);
            if (isNegativeHeight) {
                someHeight = blendedHeight;
                spaghettiHeight = minBetweenBigEntranceAndSpaghetti * 5.0;
                pillars = -64.0;
            } else {
                double layerizedCaverns = this->getLayerizedCaverns(x, y, z);
                if (layerizedCaverns > 64.0) {
                    someHeight = 64.0;
                } else {
                    double cheese = this->cheeseNoiseSource->getValue((double)x, (double)y / 1.5, (double)z);
                    double clampedCheese = Mth::clamp(cheese + 0.27, -1.0, 1.0);
                    double multipliedHeight = blendedHeightMinusWhatever * 1.28;
                    double clampedCheesePlusClampedMultipliedHeight =
                        clampedCheese + Mth::clampedLerp(0.5, 0.0, multipliedHeight);
                    someHeight = clampedCheesePlusClampedMultipliedHeight + layerizedCaverns;
                }

                double spaghetti2 = this->getSpaghetti2(x, y, z);
                spaghettiHeight = std::min(minBetweenBigEntranceAndSpaghetti, spaghetti2 + spaghettiRoughness);
                pillars = this->getPillars(x, y, z);
                pillars = -64.0;
            }
        } else {
            someHeight = blendedHeight;
            spaghettiHeight = 64.0;
            pillars = -64.0;
        }

        double finalHeight = std::max(std::min(someHeight, spaghettiHeight), pillars);
        finalHeight = this->applySlide(finalHeight, y / this->noiseSettings->getCellHeight());
        finalHeight = blender->blendDensity(x, y, z, finalHeight);
        return Mth::clamp(finalHeight, -64.0, 64.0);
    }

    double sampleJaggedNoise(double jaggedness, double x, double z) {
        if (jaggedness == 0.0) {
            return 0.0;
        } else {
            double jagged = this->jaggedNoise->getValue(x * 1500.0, 0.0, z * 1500.0);
            return jagged > 0.0 ? jaggedness * jagged : jaggedness / 2.0 * jagged;
        }
    }

    double computeBaseDensity(int32_t y, TerrainInfo *terrainInfo) {
        double normalizedY = 1.0 - (double)y / 128.0;
        return normalizedY + terrainInfo->offset;
    }

    double applySlide(double height, int32_t cellY) {
        int32_t cellYdelta = cellY - this->noiseSettings->getMinCellY();
        height = this->noiseSettings->topSlideSettings->applySlide(height,
                                                                   this->noiseSettings->getCellCountY() - cellYdelta);
        return this->noiseSettings->bottomSlideSettings->applySlide(height, cellYdelta);
    }

public:
    NoiseChunk::BlockStateFiller makeBaseNoiseFiller(NoiseChunk *chunk, NoiseChunk::NoiseFiller filler,
                                                     bool isNoodleCavesEnabled) {
        NoiseChunk::Sampler *baseNoiseSampler = this->baseNoise(chunk);
        NoiseChunk::Sampler *toggleSampler =
            isNoodleCavesEnabled ? this->noodleToggle(chunk) : new ConstantSampler(-1.0);
        NoiseChunk::Sampler *thicknessSampler =
            isNoodleCavesEnabled ? this->noodleThickness(chunk) : new ConstantSampler(0.0);
        NoiseChunk::Sampler *ridgeASampler =
            isNoodleCavesEnabled ? this->noodleRidgeA(chunk) : new ConstantSampler(0.0);
        NoiseChunk::Sampler *ridgeBSampler =
            isNoodleCavesEnabled ? this->noodleRidgeB(chunk) : new ConstantSampler(0.0);
        return [chunk, filler, baseNoiseSampler, toggleSampler, thicknessSampler, ridgeASampler,
                ridgeBSampler](int32_t x, int32_t y, int32_t z) -> BlockState {
            double baseNoise = baseNoiseSampler->sample();
            double clampedBaseNoise = Mth::clamp(baseNoise * 0.64, -1.0, 1.0);
            clampedBaseNoise = clampedBaseNoise / 2.0 - clampedBaseNoise * clampedBaseNoise * clampedBaseNoise / 24.0;
            if (toggleSampler->sample() >= 0.0) {
                double thickness = Mth::clampedMap(thicknessSampler->sample(), -1.0, 1.0, 0.05, 0.1);
                double ridgeA = std::abs(1.5 * ridgeASampler->sample()) - thickness;
                double ridgeB = std::abs(1.5 * ridgeBSampler->sample()) - thickness;
                clampedBaseNoise = std::min(clampedBaseNoise, std::max(ridgeA, ridgeB));
            }

            clampedBaseNoise += filler(x, y, z);

            return chunk->aquifer()->computeSubstance(x, y, z, baseNoise, clampedBaseNoise);
        };
    }

    NoiseChunk::BlockStateFiller makeOreVeinifier(NoiseChunk *noiseChunk, bool enabled) {
        if (!enabled) {
            return [](int32_t x, int32_t y, int32_t z) -> BlockState { return BlockState::NULL_BLOCK; };
        } else {
            NoiseChunk::Sampler *veininessSampler = this->veininess(noiseChunk);
            NoiseChunk::Sampler *veinASampler = this->veinA(noiseChunk);
            NoiseChunk::Sampler *veinBSampler = this->veinB(noiseChunk);
            BlockState blockState = Blocks::NULL_BLOCK;
            return [this, blockState, veininessSampler, veinASampler, veinBSampler](int32_t x, int32_t y,
                                                                                    int32_t z) -> BlockState {
                RandomSource *randomSource = this->oreVeinsPositionalRandomFactory->at(x, y, z);
                double veininess = veininessSampler->sample();
                NoiseSampler::VeinType veinType = this->getVeinType(veininess, y);
                if (veinType == VeinType::NULL_VEIN) {
                    return blockState;
                } else if (randomSource->nextFloat() > 0.7F) {
                    return blockState;
                } else if (this->isVein(veinASampler->sample(), veinBSampler->sample())) {
                    double clampedVeininess =
                        Mth::clampedMap(std::abs(veininess), (double)0.4F, (double)0.6F, (double)0.1F, (double)0.3F);
                    if ((double)randomSource->nextFloat() < clampedVeininess &&
                        this->gapNoise->getValue((double)x, (double)y, (double)z) > (double)-0.3F) {
                        /*
                        return randomsource->nextFloat() < 0.02F ? noisesampler$veintype.rawOreBlock
                                                                 : noisesampler$veintype.ore;
                        */
                        return Blocks::NULL_BLOCK;
                    } else {
                        // return noisesampler$veintype->filler;
                        return Blocks::NULL_BLOCK;
                    }
                } else {
                    return blockState;
                }
            };
        }
    }

    int32_t getPreliminarySurfaceLevel(int32_t x, int32_t z, TerrainInfo *terrainInfo) {
        for (int32_t cellY = this->noiseSettings->getMinCellY() + this->noiseSettings->getCellCountY();
             cellY >= this->noiseSettings->getMinCellY(); --cellY) {
            int32_t y = cellY * this->noiseSettings->getCellHeight();
            double baseNoise = this->calculateBaseNoise(x, y, z, terrainInfo, -0.703125, true, false, Blender::empty());
            if (baseNoise > 0.390625) {
                return y;
            }
        }

        return INT_MAX;
    }

    Aquifer *createAquifer(NoiseChunk *chunkNoise, int32_t x, int32_t z, int32_t cellY, int32_t cellCount,
                           Aquifer::FluidPicker *fluidPicker, bool enabled) {
        if (!enabled) {
            return Aquifer::createDisabled(fluidPicker);
        } else {
            int32_t chunkX = SectionPos::blockToSectionCoord(x);
            int32_t chunkZ = SectionPos::blockToSectionCoord(z);
            return Aquifer::create(chunkNoise, new ChunkPos(chunkX, chunkZ), this->barrierNoise,
                                   this->fluidLevelFloodednessNoise, this->fluidLevelSpreadNoise, this->lavaNoise,
                                   this->aquiferPositionalRandomFactory, cellY * this->noiseSettings->getCellHeight(),
                                   cellCount * this->noiseSettings->getCellHeight(), fluidPicker);
        }
    }

    FlatNoiseData *noiseData(int32_t x, int32_t z, Blender *blender) {
        double shiftedX = (double)x + this->getOffset(x, 0, z);
        double shiftedZ = (double)z + this->getOffset(z, x, 0);
        double continentalness = this->getContinentalness(shiftedX, 0.0, shiftedZ);
        double weirdness = this->getWeirdness(shiftedX, 0.0, shiftedZ);
        double erosion = this->getErosion(shiftedX, 0.0, shiftedZ);
        TerrainInfo *terrainInfo = this->terrainInfo(QuartPos::toBlock(x), QuartPos::toBlock(z), (float)continentalness,
                                                     (float)weirdness, (float)erosion, blender);
        return new FlatNoiseData(shiftedX, shiftedZ, continentalness, weirdness, erosion, terrainInfo);
    }

    Climate::TargetPoint *sample(int32_t x, int32_t y, int32_t z) {
        return this->target(x, y, z, this->noiseData(x, z, Blender::empty()));
    }

    Climate::TargetPoint *target(int32_t x, int32_t y, int32_t z, FlatNoiseData *flatData) {
        double shiftedX = flatData->shiftedX;
        double shiftedY = (double)y + this->getOffset(y, z, x);
        double shiftedZ = flatData->shiftedZ;
        double baseDensity = this->computeBaseDensity(QuartPos::toBlock(y), flatData->terrainInfo);
        return Climate::target((float)this->getTemperature(shiftedX, shiftedY, shiftedZ),
                               (float)this->getHumidity(shiftedX, shiftedY, shiftedZ), (float)flatData->continentalness,
                               (float)flatData->erosion, (float)baseDensity, (float)flatData->weirdness);
    }

    TerrainInfo *terrainInfo(int32_t x, int32_t z, float continents, float weirdness, float erosion, Blender *blender) {
        TerrainShaper *terrainShaper = this->noiseSettings->terrainShaper;
        TerrainShaper::Point *point = terrainShaper->makePoint(continents, erosion, weirdness);
        float offset = terrainShaper->offset(point);
        float factor = terrainShaper->factor(point);
        float jaggedness = terrainShaper->jaggedness(point);
        TerrainInfo *terrainInfo = new TerrainInfo((double)offset, (double)factor, (double)jaggedness);
        return blender->blendOffsetAndFactor(x, z, terrainInfo);
    }

    BlockPos *findSpawnPosition() {
        // return Climate::findSpawnPosition(this->spawnTarget, this);
        return nullptr;
    }

    double getOffset(int32_t x, int32_t y, int32_t z) {
        return this->offsetNoise->getValue((double)x, (double)y, (double)z) * 4.0;
    }

private:
    double getTemperature(double x, double y, double z) {
        return this->temperatureNoise->getValue(x, 0.0, z);
    }

    double getHumidity(double x, double y, double z) {
        return this->humidityNoise->getValue(x, 0.0, z);
    }

public:
    double getContinentalness(double x, double y, double z) {
        return this->continentalnessNoise->getValue(x, y, z);
    }

    double getErosion(double x, double y, double z) {
        return this->erosionNoise->getValue(x, y, z);
    }

    double getWeirdness(double x, double y, double z) {
        return this->weirdnessNoise->getValue(x, y, z);
    }

private:
    double getBigEntrances(int32_t x, int32_t y, int32_t z) {
        double base =
            this->bigEntranceNoiseSource->getValue((double)x * 0.75, (double)y * 0.5, (double)z * 0.75) + 0.37;
        double offset = (double)(y - -10) / 40.0;
        return base + Mth::clampedLerp(0.3, 0.0, offset);
    }

    double getPillars(int32_t x, int32_t y, int32_t z) {

        double d2 = NoiseUtils::sampleNoiseAndMapToRange(this->pillarRarenessModulator, (double)x, (double)y, (double)z,
                                                         0.0, 2.0);

        double d5 = NoiseUtils::sampleNoiseAndMapToRange(this->pillarThicknessModulator, (double)x, (double)y,
                                                         (double)z, 0.0, 1.1);
        d5 = std::pow(d5, 3.0);

        double d8 = this->pillarNoiseSource->getValue((double)x * 25.0, (double)y * 0.3, (double)z * 25.0);
        d8 = d5 * (d8 * 2.0 - d2);
        return d8 > 0.03 ? d8 : -std::numeric_limits<double>::infinity();
    }

    double getLayerizedCaverns(int32_t x, int32_t y, int32_t z) {
        double layerNoise = this->layerNoiseSource->getValue((double)x, (double)(y * 8), (double)z);
        return Mth::square(layerNoise) * 4.0;
    }

    double getSpaghetti3(int32_t x, int32_t y, int32_t z) {
        double rarity = this->spaghetti3DRarityModulator->getValue((double)(x * 2), (double)y, (double)(z * 2));
        double rarity3 = NoiseSampler::QuantizedSpaghettiRarity::getSpaghettiRarity3(rarity);

        double thickness = NoiseUtils::sampleNoiseAndMapToRange(this->spaghetti3DThicknessModulator, (double)x,
                                                                (double)y, (double)z, 0.065, 0.088);
        double noiseSource1 = sampleWithRarity(this->spaghetti3DNoiseSource1, (double)x, (double)y, (double)z, rarity3);
        double noise1 = std::abs(rarity3 * noiseSource1) - thickness;
        double noiseSource2 = sampleWithRarity(this->spaghetti3DNoiseSource2, (double)x, (double)y, (double)z, rarity3);
        double noise2 = std::abs(rarity3 * noiseSource2) - thickness;
        return clampToUnit(std::max(noise1, noise2));
    }

    double getSpaghetti2(int32_t x, int32_t y, int32_t z) {
        double rarity = this->spaghetti2DRarityModulator->getValue((double)(x * 2), (double)y, (double)(z * 2));
        double rarity2 = NoiseSampler::QuantizedSpaghettiRarity::getSphaghettiRarity2(rarity);
        double thickness = NoiseUtils::sampleNoiseAndMapToRange(this->spaghetti2DThicknessModulator, (double)(x * 2),
                                                                (double)y, (double)(z * 2), 0.6, 1.3);
        double noiseSource = sampleWithRarity(this->spaghetti2DNoiseSource, (double)x, (double)y, (double)z, rarity2);

        double noise2 = std::abs(rarity2 * noiseSource) - 0.083 * thickness;
        int32_t minCellY = this->noiseSettings->getMinCellY();
        double elevation = NoiseUtils::sampleNoiseAndMapToRange(this->spaghetti2DElevationModulator, (double)x, 0.0,
                                                                (double)z, (double)minCellY, 8.0);
        double noise1 = std::abs(elevation - (double)y / 8.0) - 1.0 * thickness;
        noise1 = noise1 * noise1 * noise1;
        return clampToUnit(std::max(noise1, noise2));
    }

    double spaghettiRoughness(int32_t x, int32_t y, int32_t z) {
        double roughness = NoiseUtils::sampleNoiseAndMapToRange(this->spaghettiRoughnessModulator, (double)x, (double)y,
                                                                (double)z, 0.0, 0.1);
        return (0.4 - std::abs(this->spaghettiRoughnessNoise->getValue((double)x, (double)y, (double)z))) * roughness;
    }

public:
    PositionalRandomFactory *getDepthBasedLayerPositionalRandom() {
        return this->depthBasedLayerPositionalRandomFactory;
    }

private:
    static double clampToUnit(double value) {
        return Mth::clamp(value, -1.0, 1.0);
    }

    static double sampleWithRarity(NormalNoise *noise, double x, double y, double z, double rarity) {
        return noise->getValue(x / rarity, y / rarity, z / rarity);
    }

    bool isVein(double noiseSource1, double noiseSource2) {
        double noise1 = std::abs(1.0 * noiseSource1) - (double)0.08F;
        double noise2 = std::abs(1.0 * noiseSource2) - (double)0.08F;
        return std::max(noise1, noise2) < 0.0;
    }

    NoiseSampler::VeinType getVeinType(double veiness, int32_t y) {
        /*
        NoiseSampler::VeinType noisesampler$veintype =
            veiness > 0.0 ? NoiseSampler::VeinType::COPPER : NoiseSampler::VeinType::IRON;
        int32_t i = noisesampler$veintype.maxY - y;
        int32_t j = y - noisesampler$veintype.minY;
        if (j >= 0 && i >= 0) {
            int32_t k = std::min(i, j);
            double d0 = Mth::clampedMap((double)k, 0.0, 20.0, -0.2, 0.0);
            return std::abs(veiness) + d0 < (double)0.4F ? nullptr : noisesampler$veintype;
        } else {
        */
        return NoiseSampler::VeinType::NULL_VEIN;
        //}
    }
};

class NoiseBiomeSource {
public:
    virtual Biomes getNoiseBiome(int32_t x, int32_t y, int32_t z) = 0;
};

class ChunkGenerator : public NoiseBiomeSource {
public:
    ChunkAccess *createBiomes(Blender *blender, ChunkAccess *chunk) {
        // TODO
        // chunk->fillBiomesFromNoise(this->runtimeBiomeSource::getNoiseBiome, this->climateSampler());
        return chunk;
    }

    ChunkAccess *fillFromNoise(Blender *blender, ChunkAccess *chunk) {
        // TODO
        // chunk->fillBiomesFromNoise(this->runtimeBiomeSource::getNoiseBiome, this->climateSampler());
        return chunk;
    }
};