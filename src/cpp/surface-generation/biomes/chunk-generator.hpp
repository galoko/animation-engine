#pragma once

#include "biome-source.hpp"
#include "blocks.hpp"
#include "chunk-generator.fwd.hpp"
#include "chunks.fwd.hpp"
#include "mth.hpp"
#include "pos.hpp"
#include "random.hpp"
#include "surface-rules.hpp"
#include "terrain-shaper.hpp"

#include <map>

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

class NoiseSamplingSettings {
public:
    double xzScale, yScale, xzFactor, yFactor;

    NoiseSamplingSettings(double xzScale, double yScale, double xzFactor, double yFactor) {
        this->xzScale = xzScale;
        this->yScale = yScale;
        this->xzFactor = xzFactor;
        this->yFactor = yFactor;
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

class TerrainInfo {};

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

class NoiseBiomeSource {
    Biomes getNoiseBiome(int32_t x, int32_t y, int32_t z);
};

class ChunkGenerator {
public:
    ChunkAccess *createBiomes(Blender *blender, ChunkAccess *chunk) {
        // TODO
        // chunk->fillBiomesFromNoise(this.runtimeBiomeSource::getNoiseBiome, this->climateSampler());
        return chunk;
    }

    ChunkAccess *fillFromNoise(Blender *blender, ChunkAccess *chunk) {
        // TODO
        // chunk->fillBiomesFromNoise(this.runtimeBiomeSource::getNoiseBiome, this->climateSampler());
        return chunk;
    }
};