#include "chunk-generator.hpp"
#include "heightmap.hpp"

// NoiseSlider

NoiseSlider::NoiseSlider(double target, int32_t size, int32_t offset) : target(target), size(size), offset(offset) {
}

double NoiseSlider::applySlide(double y, int32_t cellY) {
    if (this->size <= 0) {
        return y;
    } else {
        double t = (double)(cellY - this->offset) / (double)this->size;
        return Mth::clampedLerp(this->target, y, t);
    }
}

// NoiseSettings

NoiseSettings::NoiseSettings(int32_t minY, int32_t height, NoiseSamplingSettings *noiseSamplingSettings,
                             NoiseSlider *topSlideSettings, NoiseSlider *bottomSlideSettings,
                             int32_t noiseSizeHorizontal, int32_t noiseSizeVertical, bool islandNoiseOverride,
                             bool isAmplified, bool largeBiomes, TerrainShaper *terrainShaper) {
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

NoiseSettings *NoiseSettings::create(int32_t minY, int32_t height, NoiseSamplingSettings *noiseSamplingSettings,
                                     NoiseSlider *topSlideSettings, NoiseSlider *bottomSlideSettings,
                                     int32_t noiseSizeHorizontal, int32_t noiseSizeVertical, bool islandNoiseOverride,
                                     bool isAmplified, bool largeBiomes, TerrainShaper *terrainShaper) {
    NoiseSettings *noisesettings = new NoiseSettings(minY, height, noiseSamplingSettings, topSlideSettings,
                                                     bottomSlideSettings, noiseSizeHorizontal, noiseSizeVertical,
                                                     islandNoiseOverride, isAmplified, largeBiomes, terrainShaper);
    return noisesettings;
}

int32_t NoiseSettings::getCellHeight() {
    return QuartPos::toBlock(this->noiseSizeVertical);
}

int32_t NoiseSettings::getCellWidth() {
    return QuartPos::toBlock(this->noiseSizeHorizontal);
}

int32_t NoiseSettings::getCellCountY() {
    return this->height / this->getCellHeight();
}

int32_t NoiseSettings::getMinCellY() {
    return Mth::intFloorDiv(this->minY, this->getCellHeight());
}

// NoiseGeneratorSettings

NoiseGeneratorSettings::NoiseGeneratorSettings(StructureSettings *_structureSettings, NoiseSettings *_noiseSettings,
                                               BlockState defaultBlock, BlockState defaultFluid,
                                               SurfaceRules::RuleSource *_surfaceRule, int32_t _seaLevel,
                                               bool _disableMobGeneration, bool aquifersEnabled, bool noiseCavesEnabled,
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

StructureSettings *NoiseGeneratorSettings::structureSettings() {
    return this->_structureSettings;
}

NoiseSettings *NoiseGeneratorSettings::noiseSettings() {
    return this->_noiseSettings;
}

BlockState NoiseGeneratorSettings::getDefaultBlock() {
    return this->defaultBlock;
}

BlockState NoiseGeneratorSettings::getDefaultFluid() {
    return this->defaultFluid;
}

SurfaceRules::RuleSource *NoiseGeneratorSettings::surfaceRule() {
    return this->_surfaceRule;
}

int32_t NoiseGeneratorSettings::seaLevel() {
    return this->_seaLevel;
}

bool NoiseGeneratorSettings::disableMobGeneration() {
    return this->_disableMobGeneration;
}

bool NoiseGeneratorSettings::isAquifersEnabled() {
    return this->aquifersEnabled;
}

bool NoiseGeneratorSettings::isNoiseCavesEnabled() {
    return this->noiseCavesEnabled;
}

bool NoiseGeneratorSettings::isOreVeinsEnabled() {
    return this->oreVeinsEnabled;
}

bool NoiseGeneratorSettings::isNoodleCavesEnabled() {
    return this->noodleCavesEnabled;
}

bool NoiseGeneratorSettings::useLegacyRandomSource() {
    return this->randomSource == WorldgenRandom::Algorithm::LEGACY;
}

RandomSource *NoiseGeneratorSettings::createRandomSource(int64_t seed) {
    return WorldgenRandom::Algorithm_newInstance(this->getRandomSource(), seed);
}

WorldgenRandom::Algorithm NoiseGeneratorSettings::getRandomSource() {
    return this->randomSource;
}

NoiseGeneratorSettings *NoiseGeneratorSettings::end() {
    return new NoiseGeneratorSettings(
        new StructureSettings(false),
        NoiseSettings::create(0, 128, new NoiseSamplingSettings(2.0, 1.0, 80.0, 160.0),
                              new NoiseSlider(-23.4375, 64, -46), new NoiseSlider(-0.234375, 7, 1), 2, 1, true, false,
                              false, TerrainProvider::end()),
        Blocks::END_STONE, Blocks::AIR, SurfaceRuleData::end(), 0, true, false, false, false, false, true);
}

// TODO
NoiseGeneratorSettings *NoiseGeneratorSettings::nether() {
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

NoiseGeneratorSettings *NoiseGeneratorSettings::overworld(bool isAmplified, bool isLargeBiomes) {
    return new NoiseGeneratorSettings(
        new StructureSettings(true),
        NoiseSettings::create(-64, 384, new NoiseSamplingSettings(1.0, 1.0, 80.0, 160.0),
                              new NoiseSlider(-0.078125, 2, isAmplified ? 0 : 8),
                              new NoiseSlider(isAmplified ? 0.4 : 0.1171875, 3, 0), 1, 2, false, isAmplified,
                              isLargeBiomes, TerrainProvider::overworld(isAmplified)),
        Blocks::STONE, Blocks::WATER, SurfaceRuleData::overworld(), 63, false, true, false, true, false, false);
}

NoiseGeneratorSettings *NoiseGeneratorSettings::caves() {
    return new NoiseGeneratorSettings(new StructureSettings(false),
                                      NoiseSettings::create(-64, 192, new NoiseSamplingSettings(1.0, 3.0, 80.0, 60.0),
                                                            new NoiseSlider(0.9375, 3, 0), new NoiseSlider(2.5, 4, -1),
                                                            1, 2, false, false, false, TerrainProvider::caves()),
                                      Blocks::STONE, Blocks::WATER, SurfaceRuleData::overworldLike(false, true, true),
                                      32, false, false, false, false, false, true);
}

NoiseGeneratorSettings *NoiseGeneratorSettings::floatingIslands() {
    return new NoiseGeneratorSettings(new StructureSettings(true),
                                      NoiseSettings::create(0, 256, new NoiseSamplingSettings(2.0, 1.0, 80.0, 160.0),
                                                            new NoiseSlider(-23.4375, 64, -46),
                                                            new NoiseSlider(-0.234375, 7, 1), 2, 1, false, false, false,
                                                            TerrainProvider::floatingIslands()),
                                      Blocks::STONE, Blocks::WATER, SurfaceRuleData::overworldLike(false, false, false),
                                      -64, false, false, false, false, false, true);
}

NoiseGeneratorSettings *NoiseGeneratorSettings::OVERWORLD = NoiseGeneratorSettings::overworld(false, false);
NoiseGeneratorSettings *NoiseGeneratorSettings::LARGE_BIOMES = NoiseGeneratorSettings::overworld(false, true);
NoiseGeneratorSettings *NoiseGeneratorSettings::AMPLIFIED = NoiseGeneratorSettings::overworld(true, false);
NoiseGeneratorSettings *NoiseGeneratorSettings::NETHER = NoiseGeneratorSettings::nether();
NoiseGeneratorSettings *NoiseGeneratorSettings::END = NoiseGeneratorSettings::end();
NoiseGeneratorSettings *NoiseGeneratorSettings::CAVES = NoiseGeneratorSettings::caves();
NoiseGeneratorSettings *NoiseGeneratorSettings::FLOATING_ISLANDS = NoiseGeneratorSettings::floatingIslands();

// TerrainInfo

TerrainInfo::TerrainInfo(double offset, double factor, double jaggedness)
    : offset(offset), factor(factor), jaggedness(jaggedness) {
}

// Blender

TerrainInfo *Blender::blendOffsetAndFactor(int32_t x, int32_t z, TerrainInfo *terrainInfo) {
    return terrainInfo;
}

double Blender::blendDensity(int32_t x, int32_t y, int32_t z, double density) {
    return density;
}

BiomeResolver *Blender::getBiomeResolver(BiomeResolver *resolver) {
    return resolver;
}

Blender *Blender::empty() {
    return EMPTY;
}

Blender *Blender::EMPTY = new Blender();

// NoiseUtils

double NoiseUtils::sampleNoiseAndMapToRange(NormalNoise *noise, double x, double y, double z, double v0, double v1) {
    double t = noise->getValue(x, y, z);
    return Mth::map(t, -1.0, 1.0, v0, v1);
}

// FlatNoiseData

FlatNoiseData::FlatNoiseData(double shiftedX, double shiftedZ, double continentalness, double weirdness, double erosion,
                             TerrainInfo *terrainInfo) {
    this->shiftedX = shiftedX;
    this->shiftedZ = shiftedZ;
    this->continentalness = continentalness;
    this->weirdness = weirdness;
    this->erosion = erosion;
    this->terrainInfo = terrainInfo;
}

// NoiseSampler

NoiseSampler::NoiseSampler(NoiseSettings *noiseSettings, bool isNoiseCavesEnabled, int64_t seed,
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
        this->temperatureNoise =
            Noises_instantiate(positionalrandomfactory, largeBiomes ? Noises::TEMPERATURE_LARGE : Noises::TEMPERATURE);
        this->humidityNoise =
            Noises_instantiate(positionalrandomfactory, largeBiomes ? Noises::VEGETATION_LARGE : Noises::VEGETATION);
        this->offsetNoise = Noises_instantiate(positionalrandomfactory, Noises::SHIFT);
    } else {
        this->blendedNoise = new BlendedNoise(WorldgenRandom::Algorithm_newInstance(algorithm, seed),
                                              noiseSettings->noiseSamplingSettings, noiseSettings->getCellWidth(),
                                              noiseSettings->getCellHeight());
        this->temperatureNoise = NormalNoise::createLegacyNetherBiome(
            WorldgenRandom::Algorithm_newInstance(algorithm, seed), new NormalNoise::NoiseParameters(-7, 1.0, {1.0}));
        this->humidityNoise =
            NormalNoise::createLegacyNetherBiome(WorldgenRandom::Algorithm_newInstance(algorithm, seed + 1LL),
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
    this->spaghetti2DElevationModulator = Noises_instantiate(positionalrandomfactory, Noises::SPAGHETTI_2D_ELEVATION);
    this->spaghetti2DRarityModulator = Noises_instantiate(positionalrandomfactory, Noises::SPAGHETTI_2D_MODULATOR);
    this->spaghetti2DThicknessModulator = Noises_instantiate(positionalrandomfactory, Noises::SPAGHETTI_2D_THICKNESS);
    this->spaghetti3DNoiseSource1 = Noises_instantiate(positionalrandomfactory, Noises::SPAGHETTI_3D_1);
    this->spaghetti3DNoiseSource2 = Noises_instantiate(positionalrandomfactory, Noises::SPAGHETTI_3D_2);
    this->spaghetti3DRarityModulator = Noises_instantiate(positionalrandomfactory, Noises::SPAGHETTI_3D_RARITY);
    this->spaghetti3DThicknessModulator = Noises_instantiate(positionalrandomfactory, Noises::SPAGHETTI_3D_THICKNESS);
    this->spaghettiRoughnessNoise = Noises_instantiate(positionalrandomfactory, Noises::SPAGHETTI_ROUGHNESS);
    this->spaghettiRoughnessModulator =
        Noises_instantiate(positionalrandomfactory, Noises::SPAGHETTI_ROUGHNESS_MODULATOR);
    this->bigEntranceNoiseSource = Noises_instantiate(positionalrandomfactory, Noises::CAVE_ENTRANCE);
    this->layerNoiseSource = Noises_instantiate(positionalrandomfactory, Noises::CAVE_LAYER);
    this->cheeseNoiseSource = Noises_instantiate(positionalrandomfactory, Noises::CAVE_CHEESE);
    this->continentalnessNoise = Noises_instantiate(positionalrandomfactory, largeBiomes ? Noises::CONTINENTALNESS_LARGE
                                                                                         : Noises::CONTINENTALNESS);
    this->erosionNoise =
        Noises_instantiate(positionalrandomfactory, largeBiomes ? Noises::EROSION_LARGE : Noises::EROSION);
    this->weirdnessNoise = Noises_instantiate(positionalrandomfactory, Noises::RIDGE);
    this->veininess = yLimitedInterpolatableNoise(Noises_instantiate(positionalrandomfactory, Noises::ORE_VEININESS),
                                                  minVeinY, maxVeinY, 0, 1.5);
    this->veinA = yLimitedInterpolatableNoise(Noises_instantiate(positionalrandomfactory, Noises::ORE_VEIN_A), minVeinY,
                                              maxVeinY, 0, 4.0);
    this->veinB = yLimitedInterpolatableNoise(Noises_instantiate(positionalrandomfactory, Noises::ORE_VEIN_B), minVeinY,
                                              maxVeinY, 0, 4.0);
    this->gapNoise = Noises_instantiate(positionalrandomfactory, Noises::ORE_GAP);
    this->noodleToggle = yLimitedInterpolatableNoise(Noises_instantiate(positionalrandomfactory, Noises::NOODLE),
                                                     clampedMinY, clampedMaxY, -1, 1.0);
    this->noodleThickness = yLimitedInterpolatableNoise(
        Noises_instantiate(positionalrandomfactory, Noises::NOODLE_THICKNESS), clampedMinY, clampedMaxY, 0, 1.0);
    this->noodleRidgeA =
        yLimitedInterpolatableNoise(Noises_instantiate(positionalrandomfactory, Noises::NOODLE_RIDGE_A), clampedMinY,
                                    clampedMaxY, 0, 2.6666666666666665);
    this->noodleRidgeB =
        yLimitedInterpolatableNoise(Noises_instantiate(positionalrandomfactory, Noises::NOODLE_RIDGE_B), clampedMinY,
                                    clampedMaxY, 0, 2.6666666666666665);
    this->jaggedNoise = Noises_instantiate(positionalrandomfactory, Noises::JAGGED);
}

NoiseChunk::InterpolatableNoise NoiseSampler::yLimitedInterpolatableNoise(NormalNoise *noise, int32_t minY,
                                                                          int32_t maxY, int32_t outOfRangeValue,
                                                                          double noiseMul) {
    NoiseChunk::NoiseFiller filler = [noise, minY, maxY, outOfRangeValue, noiseMul](int32_t x, int32_t y,
                                                                                    int32_t z) -> double {
        return y <= maxY && y >= minY
                   ? noise->getValue((double)x * noiseMul, (double)y * noiseMul, (double)z * noiseMul)
                   : (double)outOfRangeValue;
    };
    return [filler](NoiseChunk *chunk) -> NoiseChunk::Sampler * { return chunk->createNoiseInterpolator(filler); };
}

double NoiseSampler::calculateBaseNoise(int32_t x, int32_t y, int32_t z, TerrainInfo *terrainInfo, Blender *blender) {
    double blended = this->blendedNoise->calculateNoise(x, y, z);
    bool isNoiseCavesDisabled = !this->isNoiseCavesEnabled;
    return this->calculateBaseNoise(x, y, z, terrainInfo, blended, isNoiseCavesDisabled, true, blender);
}

double NoiseSampler::calculateBaseNoise(int32_t x, int32_t y, int32_t z, TerrainInfo *terrainInfo, double blended,
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
        double minBetweenBigEntranceAndSpaghetti = min(bigEntrance, spaghetti3 + spaghettiRoughness);
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
            spaghettiHeight = min(minBetweenBigEntranceAndSpaghetti, spaghetti2 + spaghettiRoughness);
            pillars = this->getPillars(x, y, z);
            pillars = -64.0;
        }
    } else {
        someHeight = blendedHeight;
        spaghettiHeight = 64.0;
        pillars = -64.0;
    }

    double finalHeight = max(min(someHeight, spaghettiHeight), pillars);
    finalHeight = this->applySlide(finalHeight, y / this->noiseSettings->getCellHeight());
    finalHeight = blender->blendDensity(x, y, z, finalHeight);
    return Mth::clamp(finalHeight, -64.0, 64.0);
}

double NoiseSampler::sampleJaggedNoise(double jaggedness, double x, double z) {
    if (jaggedness == 0.0) {
        return 0.0;
    } else {
        double jagged = this->jaggedNoise->getValue(x * 1500.0, 0.0, z * 1500.0);
        return jagged > 0.0 ? jaggedness * jagged : jaggedness / 2.0 * jagged;
    }
}

double NoiseSampler::computeBaseDensity(int32_t y, TerrainInfo *terrainInfo) {
    double normalizedY = 1.0 - (double)y / 128.0;
    return normalizedY + terrainInfo->offset;
}

double NoiseSampler::applySlide(double height, int32_t cellY) {
    int32_t cellYdelta = cellY - this->noiseSettings->getMinCellY();
    height =
        this->noiseSettings->topSlideSettings->applySlide(height, this->noiseSettings->getCellCountY() - cellYdelta);
    return this->noiseSettings->bottomSlideSettings->applySlide(height, cellYdelta);
}

NoiseChunk::BlockStateFiller NoiseSampler::makeBaseNoiseFiller(NoiseChunk *chunk, NoiseChunk::NoiseFiller filler,
                                                               bool isNoodleCavesEnabled) {
    NoiseChunk::Sampler *baseNoiseSampler = this->baseNoise(chunk);
    NoiseChunk::Sampler *toggleSampler = isNoodleCavesEnabled ? this->noodleToggle(chunk) : new ConstantSampler(-1.0);
    NoiseChunk::Sampler *thicknessSampler =
        isNoodleCavesEnabled ? this->noodleThickness(chunk) : new ConstantSampler(0.0);
    NoiseChunk::Sampler *ridgeASampler = isNoodleCavesEnabled ? this->noodleRidgeA(chunk) : new ConstantSampler(0.0);
    NoiseChunk::Sampler *ridgeBSampler = isNoodleCavesEnabled ? this->noodleRidgeB(chunk) : new ConstantSampler(0.0);
    return [chunk, filler, baseNoiseSampler, toggleSampler, thicknessSampler, ridgeASampler,
            ridgeBSampler](int32_t x, int32_t y, int32_t z) -> BlockState {
        double baseNoise = baseNoiseSampler->sample();
        double clampedBaseNoise = Mth::clamp(baseNoise * 0.64, -1.0, 1.0);
        clampedBaseNoise = clampedBaseNoise / 2.0 - clampedBaseNoise * clampedBaseNoise * clampedBaseNoise / 24.0;
        if (toggleSampler->sample() >= 0.0) {
            double thickness = Mth::clampedMap(thicknessSampler->sample(), -1.0, 1.0, 0.05, 0.1);
            double ridgeA = abs(1.5 * ridgeASampler->sample()) - thickness;
            double ridgeB = abs(1.5 * ridgeBSampler->sample()) - thickness;
            clampedBaseNoise = min(clampedBaseNoise, max(ridgeA, ridgeB));
        }

        clampedBaseNoise += filler(x, y, z);

        return chunk->aquifer()->computeSubstance(x, y, z, baseNoise, clampedBaseNoise);
    };
}

NoiseChunk::BlockStateFiller NoiseSampler::makeOreVeinifier(NoiseChunk *noiseChunk, bool enabled) {
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
                    Mth::clampedMap(abs(veininess), (double)0.4F, (double)0.6F, (double)0.1F, (double)0.3F);
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

int32_t NoiseSampler::getPreliminarySurfaceLevel(int32_t x, int32_t z, TerrainInfo *terrainInfo) {
    for (int32_t cellY = this->noiseSettings->getMinCellY() + this->noiseSettings->getCellCountY();
         cellY >= this->noiseSettings->getMinCellY(); --cellY) {
        int32_t y = cellY * this->noiseSettings->getCellHeight();
        double baseNoise = this->calculateBaseNoise(x, y, z, terrainInfo, -0.703125, true, false, Blender::empty());
        if (baseNoise > 0.390625) {
            return y;
        }
    }

    return numeric_limits<int32_t>::max();
}

Aquifer *NoiseSampler::createAquifer(NoiseChunk *chunkNoise, int32_t x, int32_t z, int32_t cellY, int32_t cellCount,
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

FlatNoiseData *NoiseSampler::noiseData(int32_t x, int32_t z, Blender *blender) {
    double shiftedX = (double)x + this->getOffset(x, 0, z);
    double shiftedZ = (double)z + this->getOffset(z, x, 0);
    double continentalness = this->getContinentalness(shiftedX, 0.0, shiftedZ);
    double weirdness = this->getWeirdness(shiftedX, 0.0, shiftedZ);
    double erosion = this->getErosion(shiftedX, 0.0, shiftedZ);
    TerrainInfo *terrainInfo = this->terrainInfo(QuartPos::toBlock(x), QuartPos::toBlock(z), (float)continentalness,
                                                 (float)weirdness, (float)erosion, blender);
    return new FlatNoiseData(shiftedX, shiftedZ, continentalness, weirdness, erosion, terrainInfo);
}

Climate::TargetPoint *NoiseSampler::sample(int32_t x, int32_t y, int32_t z) {
    return this->target(x, y, z, this->noiseData(x, z, Blender::empty()));
}

Climate::TargetPoint *NoiseSampler::target(int32_t x, int32_t y, int32_t z, FlatNoiseData *flatData) {
    double shiftedX = flatData->shiftedX;
    double shiftedY = (double)y + this->getOffset(y, z, x);
    double shiftedZ = flatData->shiftedZ;
    double baseDensity = this->computeBaseDensity(QuartPos::toBlock(y), flatData->terrainInfo);
    return Climate::target((float)this->getTemperature(shiftedX, shiftedY, shiftedZ),
                           (float)this->getHumidity(shiftedX, shiftedY, shiftedZ), (float)flatData->continentalness,
                           (float)flatData->erosion, (float)baseDensity, (float)flatData->weirdness);
}

TerrainInfo *NoiseSampler::terrainInfo(int32_t x, int32_t z, float continents, float weirdness, float erosion,
                                       Blender *blender) {
    TerrainShaper *terrainShaper = this->noiseSettings->terrainShaper;
    TerrainShaper::Point *point = terrainShaper->makePoint(continents, erosion, weirdness);
    float offset = terrainShaper->offset(point);
    float factor = terrainShaper->factor(point);
    float jaggedness = terrainShaper->jaggedness(point);
    TerrainInfo *terrainInfo = new TerrainInfo((double)offset, (double)factor, (double)jaggedness);
    return blender->blendOffsetAndFactor(x, z, terrainInfo);
}

BlockPos *NoiseSampler::findSpawnPosition() {
    // return Climate::findSpawnPosition(this->spawnTarget, this);
    return nullptr;
}

double NoiseSampler::getOffset(int32_t x, int32_t y, int32_t z) {
    return this->offsetNoise->getValue((double)x, (double)y, (double)z) * 4.0;
}

double NoiseSampler::getTemperature(double x, double y, double z) {
    return this->temperatureNoise->getValue(x, 0.0, z);
}

double NoiseSampler::getHumidity(double x, double y, double z) {
    return this->humidityNoise->getValue(x, 0.0, z);
}

double NoiseSampler::getContinentalness(double x, double y, double z) {
    return this->continentalnessNoise->getValue(x, y, z);
}

double NoiseSampler::getErosion(double x, double y, double z) {
    return this->erosionNoise->getValue(x, y, z);
}

double NoiseSampler::getWeirdness(double x, double y, double z) {
    return this->weirdnessNoise->getValue(x, y, z);
}

double NoiseSampler::getBigEntrances(int32_t x, int32_t y, int32_t z) {
    double base = this->bigEntranceNoiseSource->getValue((double)x * 0.75, (double)y * 0.5, (double)z * 0.75) + 0.37;
    double offset = (double)(y - -10) / 40.0;
    return base + Mth::clampedLerp(0.3, 0.0, offset);
}

double NoiseSampler::getPillars(int32_t x, int32_t y, int32_t z) {
    double d2 =
        NoiseUtils::sampleNoiseAndMapToRange(this->pillarRarenessModulator, (double)x, (double)y, (double)z, 0.0, 2.0);

    double d5 =
        NoiseUtils::sampleNoiseAndMapToRange(this->pillarThicknessModulator, (double)x, (double)y, (double)z, 0.0, 1.1);
    d5 = pow(d5, 3.0);

    double d8 = this->pillarNoiseSource->getValue((double)x * 25.0, (double)y * 0.3, (double)z * 25.0);
    d8 = d5 * (d8 * 2.0 - d2);
    return d8 > 0.03 ? d8 : -numeric_limits<double>::infinity();
}

double NoiseSampler::getLayerizedCaverns(int32_t x, int32_t y, int32_t z) {
    double layerNoise = this->layerNoiseSource->getValue((double)x, (double)(y * 8), (double)z);
    return Mth::square(layerNoise) * 4.0;
}

double NoiseSampler::getSpaghetti3(int32_t x, int32_t y, int32_t z) {
    double rarity = this->spaghetti3DRarityModulator->getValue((double)(x * 2), (double)y, (double)(z * 2));
    double rarity3 = NoiseSampler::QuantizedSpaghettiRarity::getSpaghettiRarity3(rarity);

    double thickness = NoiseUtils::sampleNoiseAndMapToRange(this->spaghetti3DThicknessModulator, (double)x, (double)y,
                                                            (double)z, 0.065, 0.088);
    double noiseSource1 = sampleWithRarity(this->spaghetti3DNoiseSource1, (double)x, (double)y, (double)z, rarity3);
    double noise1 = abs(rarity3 * noiseSource1) - thickness;
    double noiseSource2 = sampleWithRarity(this->spaghetti3DNoiseSource2, (double)x, (double)y, (double)z, rarity3);
    double noise2 = abs(rarity3 * noiseSource2) - thickness;
    return clampToUnit(max(noise1, noise2));
}

double NoiseSampler::getSpaghetti2(int32_t x, int32_t y, int32_t z) {
    double rarity = this->spaghetti2DRarityModulator->getValue((double)(x * 2), (double)y, (double)(z * 2));
    double rarity2 = NoiseSampler::QuantizedSpaghettiRarity::getSphaghettiRarity2(rarity);
    double thickness = NoiseUtils::sampleNoiseAndMapToRange(this->spaghetti2DThicknessModulator, (double)(x * 2),
                                                            (double)y, (double)(z * 2), 0.6, 1.3);
    double noiseSource = sampleWithRarity(this->spaghetti2DNoiseSource, (double)x, (double)y, (double)z, rarity2);

    double noise2 = abs(rarity2 * noiseSource) - 0.083 * thickness;
    int32_t minCellY = this->noiseSettings->getMinCellY();
    double elevation = NoiseUtils::sampleNoiseAndMapToRange(this->spaghetti2DElevationModulator, (double)x, 0.0,
                                                            (double)z, (double)minCellY, 8.0);
    double noise1 = abs(elevation - (double)y / 8.0) - 1.0 * thickness;
    noise1 = noise1 * noise1 * noise1;
    return clampToUnit(max(noise1, noise2));
}

double NoiseSampler::spaghettiRoughness(int32_t x, int32_t y, int32_t z) {
    double roughness = NoiseUtils::sampleNoiseAndMapToRange(this->spaghettiRoughnessModulator, (double)x, (double)y,
                                                            (double)z, 0.0, 0.1);
    return (0.4 - abs(this->spaghettiRoughnessNoise->getValue((double)x, (double)y, (double)z))) * roughness;
}

PositionalRandomFactory *NoiseSampler::getDepthBasedLayerPositionalRandom() {
    return this->depthBasedLayerPositionalRandomFactory;
}

double NoiseSampler::clampToUnit(double value) {
    return Mth::clamp(value, -1.0, 1.0);
}

double NoiseSampler::sampleWithRarity(NormalNoise *noise, double x, double y, double z, double rarity) {
    return noise->getValue(x / rarity, y / rarity, z / rarity);
}

bool NoiseSampler::isVein(double noiseSource1, double noiseSource2) {
    double noise1 = abs(1.0 * noiseSource1) - (double)0.08F;
    double noise2 = abs(1.0 * noiseSource2) - (double)0.08F;
    return max(noise1, noise2) < 0.0;
}

NoiseSampler::VeinType NoiseSampler::getVeinType(double veiness, int32_t y) {
    /*
    NoiseSampler::VeinType noisesampler$veintype =
        veiness > 0.0 ? NoiseSampler::VeinType::COPPER : NoiseSampler::VeinType::IRON;
    int32_t i = noisesampler$veintype.maxY - y;
    int32_t j = y - noisesampler$veintype.minY;
    if (j >= 0 && i >= 0) {
        int32_t k = min(i, j);
        double d0 = Mth::clampedMap((double)k, 0.0, 20.0, -0.2, 0.0);
        return abs(veiness) + d0 < (double)0.4F ? nullptr : noisesampler$veintype;
    } else {
    */
    return NoiseSampler::VeinType::NULL_VEIN;
    //}
}

// ChunkGenerator

ChunkGenerator::ChunkGenerator(BiomeSource *biomeSource, StructureSettings *settings)
    : ChunkGenerator(biomeSource, biomeSource, settings, 0LL) {
}

ChunkGenerator::ChunkGenerator(BiomeSource *biomeSource, BiomeSource *runtimeBiomeSource, StructureSettings *settings,
                               int64_t strongholdSeed) {
    this->biomeSource = biomeSource;
    this->runtimeBiomeSource = runtimeBiomeSource;
    this->settings = settings;
    this->strongholdSeed = strongholdSeed;
}

ChunkAccess *ChunkGenerator::createBiomes(Blender *blender, ChunkAccess *chunk) {
    chunk->fillBiomesFromNoise(this->runtimeBiomeSource, this->climateSampler());
    return chunk;
}

Biomes ChunkGenerator::getNoiseBiome(int32_t x, int32_t y, int32_t z) {
    return this->getBiomeSource()->getNoiseBiome(x, y, z, this->climateSampler());
}

StructureSettings *ChunkGenerator::getSettings() {
    return this->settings;
}

int32_t ChunkGenerator::getSpawnHeight(LevelHeightAccessor *heightAccessor) {
    return 64;
}

BiomeSource *ChunkGenerator::getBiomeSource() {
    return this->runtimeBiomeSource;
}

int32_t ChunkGenerator::getFirstFreeHeight(int32_t x, int32_t z, HeightmapTypes type,
                                           LevelHeightAccessor *heightAccessor) {
    return this->getBaseHeight(x, z, type, heightAccessor);
}

int32_t ChunkGenerator::getFirstOccupiedHeight(int32_t x, int32_t z, HeightmapTypes type,
                                               LevelHeightAccessor *heightAccessor) {
    return this->getBaseHeight(x, z, type, heightAccessor) - 1;
}

// SimpleFluidPicker

SimpleFluidPicker::SimpleFluidPicker(int32_t seaLevel, Aquifer::FluidStatus *lava, Aquifer::FluidStatus *defaultFluid) {
    this->seaLevel = seaLevel;
    this->lava = lava;
    this->defaultFluid = defaultFluid;
}

Aquifer::FluidStatus *SimpleFluidPicker::computeFluid(int32_t x, int32_t y, int32_t z) {
    return y < min(-54, this->seaLevel) ? this->lava : this->defaultFluid;
}

// NoiseClimateSampler

NoiseClimateSampler::NoiseClimateSampler(NoiseSampler *sampler, NoiseChunk *noisechunk) {
    this->sampler = sampler;
    this->noisechunk = noisechunk;
}

Climate::TargetPoint *NoiseClimateSampler::sample(int32_t x, int32_t y, int32_t z) {
    return this->sampler->target(x, y, z, this->noisechunk->noiseData(x, z));
}

// NoiseBasedChunkGenerator

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

NoiseFiller makeBeardifier(ChunkAccess *chunkAccess) {
    return [](int32_t x, int32_t y, int32_t z) -> double { return 0; };
}

NoiseBasedChunkGenerator::NoiseBasedChunkGenerator(BiomeSource *biomeSource, int64_t seed,
                                                   function<NoiseGeneratorSettings *(void)> settings)
    : NoiseBasedChunkGenerator(biomeSource, biomeSource, seed, settings) {
}

NoiseBasedChunkGenerator::NoiseBasedChunkGenerator(BiomeSource *biomeSource, BiomeSource *runtimeBiomeSource,
                                                   int64_t seed, function<NoiseGeneratorSettings *(void)> settings)
    : ChunkGenerator(biomeSource, runtimeBiomeSource, settings()->structureSettings(), seed) {

    this->seed = seed;
    this->settings = settings;
    NoiseGeneratorSettings *noiseGeneratorSettings = this->settings();
    this->defaultBlock = noiseGeneratorSettings->getDefaultBlock();
    NoiseSettings *noisesettings = noiseGeneratorSettings->noiseSettings();
    this->sampler = new NoiseSampler(noisesettings, noiseGeneratorSettings->isNoiseCavesEnabled(), seed,
                                     noiseGeneratorSettings->getRandomSource());
    vector<WorldGenMaterialRule> rules = vector<WorldGenMaterialRule>();
    rules.push_back([](NoiseChunk *noiseChunk, int32_t x, int32_t y, int32_t z) -> BlockState {
        return noiseChunk->updateNoiseAndGenerateBaseState(x, y, z);
    });
    /*
    rules.push_back([](NoiseChunk *noiseChunk, int32_t x, int32_t y, int32_t z) -> BlockState {
        return noiseChunk->oreVeinify(x, y, z);
    });
    */
    this->materialRule = makeMaterialRuleList(rules);
    Aquifer::FluidStatus *lava = new Aquifer::FluidStatus(-54, Blocks::LAVA);
    int32_t seaLevel = noiseGeneratorSettings->seaLevel();
    Aquifer::FluidStatus *defaultFluid = new Aquifer::FluidStatus(seaLevel, noiseGeneratorSettings->getDefaultFluid());
    // Aquifer::FluidStatus *air = new Aquifer::FluidStatus(noisesettings->minY - 1, Blocks::AIR);
    this->globalFluidPicker = new SimpleFluidPicker(seaLevel, lava, defaultFluid);
    /*
    this->surfaceSystem =
        new SurfaceSystem(this->defaultBlock, seaLevel, seed, noiseGeneratorSettings->getRandomSource());
    */
}

ChunkAccess *NoiseBasedChunkGenerator::createBiomes(Blender *blender, ChunkAccess *chunkAccess) {
    this->doCreateBiomes(blender, chunkAccess);
    return chunkAccess;
}

void NoiseBasedChunkGenerator::doCreateBiomes(Blender *blender, ChunkAccess *chunkAccess) {
    NoiseChunk *noisechunk = chunkAccess->getOrCreateNoiseChunk(
        this->sampler, [chunkAccess]() -> NoiseFiller { return makeBeardifier(chunkAccess); }, this->settings(),
        this->globalFluidPicker, blender);
    BiomeResolver *biomeresolver =
        BelowZeroRetrogen::getBiomeResolver(blender->getBiomeResolver(this->runtimeBiomeSource), chunkAccess);
    chunkAccess->fillBiomesFromNoise(biomeresolver, new NoiseClimateSampler(this->sampler, noisechunk));
}

Climate::Sampler *NoiseBasedChunkGenerator::climateSampler() {
    return this->sampler;
}

ChunkGenerator *NoiseBasedChunkGenerator::withSeed(int64_t seed) {
    return new NoiseBasedChunkGenerator(this->biomeSource->withSeed(seed), seed, this->settings);
}

int32_t NoiseBasedChunkGenerator::getBaseHeight(int32_t x, int32_t z, HeightmapTypes type,
                                                LevelHeightAccessor *heightAccessor) {
    return 0;
}

ChunkAccess *NoiseBasedChunkGenerator::fillFromNoise(Blender *blender, ChunkAccess *chunkAccess) {
    NoiseSettings *noisesettings = this->settings()->noiseSettings();
    LevelHeightAccessor *heightAccessor = chunkAccess->getHeightAccessorForGeneration();
    int32_t minY = max(noisesettings->minY, heightAccessor->getMinBuildHeight());
    int32_t maxY = min(noisesettings->minY + noisesettings->height, heightAccessor->getMaxBuildHeight());
    int32_t minCellY = Mth::intFloorDiv(minY, noisesettings->getCellHeight());
    int32_t cellCount = Mth::intFloorDiv(maxY - minY, noisesettings->getCellHeight());
    if (cellCount <= 0) {
        return chunkAccess;
    } else {
        int32_t maxSectionIndex = chunkAccess->getSectionIndex(cellCount * noisesettings->getCellHeight() - 1 + minY);
        int32_t minSectionIndex = chunkAccess->getSectionIndex(minY);
        set<LevelChunkSection *> sections = set<LevelChunkSection *>();

        for (int32_t sectionIndex = maxSectionIndex; sectionIndex >= minSectionIndex; --sectionIndex) {
            LevelChunkSection *section = chunkAccess->getSection(sectionIndex);
            section->acquire();
            sections.insert(section);
        }

        ChunkAccess *result = this->doFill(blender, chunkAccess, minCellY, cellCount);

        for (LevelChunkSection *section : sections) {
            section->release();
        }

        return result;
    }
}

ChunkAccess *NoiseBasedChunkGenerator::doFill(Blender *blender, ChunkAccess *chunkAccess, int32_t minCellY,
                                              int32_t cellCount) {
    NoiseGeneratorSettings *settings = this->settings();
    NoiseChunk *noiseChunk = chunkAccess->getOrCreateNoiseChunk(
        this->sampler, [chunkAccess]() -> NoiseFiller { return makeBeardifier(chunkAccess); }, settings,
        this->globalFluidPicker, blender);

    Heightmap *oceanFloorHeightMap = chunkAccess->getOrCreateHeightmapUnprimed(HeightmapTypes::OCEAN_FLOOR_WG);
    Heightmap *worldSurfaceHeightMap = chunkAccess->getOrCreateHeightmapUnprimed(HeightmapTypes::WORLD_SURFACE_WG);

    ChunkPos *chunkPos = chunkAccess->getPos();
    int32_t x = chunkPos->getMinBlockX();
    int32_t z = chunkPos->getMinBlockZ();

    noiseChunk->initializeForFirstCellX();

    // Aquifer *aquifer = noiseChunk->aquifer();
    // MutableBlockPos *pos = new MutableBlockPos();

    NoiseSettings *noiseSettings = settings->noiseSettings();

    int32_t cellWidth = noiseSettings->getCellWidth();
    int32_t cellHeight = noiseSettings->getCellHeight();
    int32_t cellCountX = 16 / cellWidth;
    int32_t cellCountZ = 16 / cellWidth;

    for (int32_t cellX = 0; cellX < cellCountX; ++cellX) {
        noiseChunk->advanceCellX(cellX);

        for (int32_t cellZ = 0; cellZ < cellCountZ; ++cellZ) {
            LevelChunkSection *section = chunkAccess->getSection(chunkAccess->getSectionsCount() - 1);

            for (int32_t cellY = cellCount - 1; cellY >= 0; --cellY) {
                noiseChunk->selectCellYZ(cellY, cellZ);

                for (int32_t yOffset = cellHeight - 1; yOffset >= 0; --yOffset) {
                    int32_t currentY = (minCellY + cellY) * cellHeight + yOffset;
                    int32_t yForSection = currentY & 15;
                    int32_t sectionIndex = chunkAccess->getSectionIndex(currentY);
                    if (chunkAccess->getSectionIndex(section->bottomBlockY()) != sectionIndex) {
                        section = chunkAccess->getSection(sectionIndex);
                    }

                    double yt = (double)yOffset / (double)cellHeight;
                    noiseChunk->updateForY(yt);

                    for (int32_t xOffset = 0; xOffset < cellWidth; ++xOffset) {
                        int32_t currentX = x + cellX * cellWidth + xOffset;
                        int32_t xForSection = currentX & 15;
                        double xt = (double)xOffset / (double)cellWidth;
                        noiseChunk->updateForX(xt);

                        for (int32_t zOffset = 0; zOffset < cellWidth; ++zOffset) {
                            int32_t currentZ = z + cellZ * cellWidth + zOffset;
                            int32_t zForSection = currentZ & 15;
                            double zt = (double)zOffset / (double)cellWidth;
                            noiseChunk->updateForZ(zt);

                            BlockState blockState = this->materialRule(noiseChunk, currentX, currentY, currentZ);
                            if (blockState == Blocks::NULL_BLOCK) {
                                blockState = this->defaultBlock;
                            }

                            if (blockState != AIR) {
                                /*
                                if (blockState.getLightEmission() != 0 && chunkAccess instanceof ProtoChunk) {
                                    pos.set(currentX, currentY, currentZ);
                                    ((ProtoChunk)chunkAccess).addLight(pos);
                                }
                                */

                                section->setBlockState(xForSection, yForSection, zForSection, blockState, false);
                                oceanFloorHeightMap->update(xForSection, currentY, zForSection, blockState);
                                worldSurfaceHeightMap->update(xForSection, currentY, zForSection, blockState);

                                /*
                                if (aquifer.shouldScheduleFluidUpdate() && !blockState.getFluidState().isEmpty()) {
                                    pos.set(currentX, currentY, currentZ);
                                    chunkAccess->markPosForPostprocessing(pos);
                                }
                                */
                            }
                        }
                    }
                }
            }
        }

        noiseChunk->swapSlices();
    }

    return chunkAccess;
}

int32_t NoiseBasedChunkGenerator::getGenDepth() {
    return this->settings()->noiseSettings()->height;
}

int32_t NoiseBasedChunkGenerator::getSeaLevel() {
    return this->settings()->seaLevel();
}

int32_t NoiseBasedChunkGenerator::getMinY() {
    return this->settings()->noiseSettings()->minY;
}