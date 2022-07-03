#pragma once

#include "blocks.hpp"
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
    StructureSettings(StrongholdConfiguration *p_64586_,
                      std::map<StructureFeature<T> *, StructureFeatureConfiguration *> p_64587_) {
        //
    }

    StructureSettings(bool canHaveStrongholds) {
        // TODO
    }
};

class NoiseSamplingSettings {
public:
    double xzScale, yScale, xzFactor, yFactor;

    NoiseSamplingSettings(double p_64497_, double p_64498_, double p_64499_, double p_64500_) {
        this->xzScale = p_64497_;
        this->yScale = p_64498_;
        this->xzFactor = p_64499_;
        this->yFactor = p_64500_;
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
    static NoiseSettings *create(int32_t p_189200_, int32_t p_189201_, NoiseSamplingSettings *p_189202_,
                                 NoiseSlider *p_189203_, NoiseSlider *p_189204_, int32_t p_189205_, int32_t p_189206_,
                                 bool p_189207_, bool p_189208_, bool p_189209_, TerrainShaper *p_189210_) {
        NoiseSettings *noisesettings =
            new NoiseSettings(p_189200_, p_189201_, p_189202_, p_189203_, p_189204_, p_189205_, p_189206_, p_189207_,
                              p_189208_, p_189209_, p_189210_);
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
    NoiseGeneratorSettings(StructureSettings *p_188873_, NoiseSettings *p_188874_, BlockState p_188875_,
                           BlockState p_188876_, SurfaceRules::RuleSource *p_188877_, int32_t p_188878_, bool p_188879_,
                           bool p_188880_, bool p_188881_, bool p_188882_, bool noodleCavesEnabled,
                           bool useLegacyRandom) {
        this->_structureSettings = p_188873_;
        this->_noiseSettings = p_188874_;
        this->defaultBlock = p_188875_;
        this->defaultFluid = p_188876_;
        this->_surfaceRule = p_188877_;
        this->_seaLevel = p_188878_;
        this->_disableMobGeneration = p_188879_;
        this->aquifersEnabled = p_188880_;
        this->noiseCavesEnabled = p_188881_;
        this->oreVeinsEnabled = p_188882_;
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