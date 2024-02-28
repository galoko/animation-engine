#pragma once

#include <cstdint>
#include <functional>

#include "biome-default-features.hpp"
#include "biome-generation-settings.hpp"
#include "chunks.hpp"
#include "mob-spawner-settings.hpp"
#include "mth.hpp"
#include "noise/perlin-simplex-noise.hpp"

using namespace std;

enum BiomeCategory {
    BiomeCategory_NONE,
    TAIGA,
    EXTREME_HILLS,
    JUNGLE,
    MESA,
    PLAINS,
    SAVANNA,
    ICY,
    THEEND,
    BEACH,
    FOREST,
    OCEAN,
    DESERT,
    RIVER,
    SWAMP,
    MUSHROOM,
    NETHER,
    UNDERGROUND,
    MOUNTAIN
};

enum Precipitation {
    Precipitation_NONE,
    RAIN,
    SNOW
};

using TemperatureModifier = function<float(BlockPos, float)>;
using GrassColorModifier = function<int(double, double, int)>;

class AmbientParticleSettings {
public:
    int i = 0;
};

class AmbientMoodSettings {
public:
    int i = 0;
};

class SoundEvent {
public:
    int i = 0;
};

class AmbientAdditionsSettings {
public:
    int i = 0;
};

class Music {
public:
    int i = 0;
};

int GrassColorModifier_NONE(double x, double z, int srcColor);
int GrassColorModifier_DARK_FOREST(double x, double z, int srcColor);
int GrassColorModifier_SWAMP(double x, double z, int srcColor);

class BiomeSpecialEffects {
private:
    int fogColor;
    int waterColor;
    int waterFogColor;
    int skyColor;
    shared_ptr<int> foliageColorOverride;
    shared_ptr<int> grassColorOverride;
    GrassColorModifier grassColorModifier;
    shared_ptr<AmbientParticleSettings> ambientParticleSettings;
    shared_ptr<SoundEvent> ambientLoopSoundEvent;
    shared_ptr<AmbientMoodSettings> ambientMoodSettings;
    shared_ptr<AmbientAdditionsSettings> ambientAdditionsSettings;
    shared_ptr<Music> backgroundMusic;

public:
    BiomeSpecialEffects(int fogColor, int waterColor, int waterFogColor, int skyColor,
                        shared_ptr<int> foliageColorOverride, shared_ptr<int> grassColorOverride,
                        GrassColorModifier grassColorModifier,
                        shared_ptr<AmbientParticleSettings> ambientParticleSettings,
                        shared_ptr<SoundEvent> ambientLoopSoundEvent,
                        shared_ptr<AmbientMoodSettings> ambientMoodSettings,
                        shared_ptr<AmbientAdditionsSettings> ambientAdditionsSettings,
                        shared_ptr<Music> backgroundMusic)
        : fogColor(fogColor), waterColor(waterColor), waterFogColor(waterFogColor), skyColor(skyColor),
          foliageColorOverride(foliageColorOverride), grassColorOverride(grassColorOverride),
          grassColorModifier(grassColorModifier), ambientParticleSettings(ambientParticleSettings),
          ambientLoopSoundEvent(ambientLoopSoundEvent), ambientMoodSettings(ambientMoodSettings),
          ambientAdditionsSettings(ambientAdditionsSettings), backgroundMusic(backgroundMusic) {
    }

public:
    int getFogColor() {
        return this->fogColor;
    }

    int getWaterColor() {
        return this->waterColor;
    }

    int getWaterFogColor() {
        return this->waterFogColor;
    }

    int getSkyColor() {
        return this->skyColor;
    }

    shared_ptr<int> getFoliageColorOverride() {
        return this->foliageColorOverride;
    }

    shared_ptr<int> getGrassColorOverride() {
        return this->grassColorOverride;
    }

    GrassColorModifier getGrassColorModifier() {
        return this->grassColorModifier;
    }

    shared_ptr<AmbientParticleSettings> getAmbientParticleSettings() {
        return this->ambientParticleSettings;
    }

    shared_ptr<SoundEvent> getAmbientLoopSoundEvent() {
        return this->ambientLoopSoundEvent;
    }

    shared_ptr<AmbientMoodSettings> getAmbientMoodSettings() {
        return this->ambientMoodSettings;
    }

    shared_ptr<AmbientAdditionsSettings> getAmbientAdditionsSettings() {
        return this->ambientAdditionsSettings;
    }

    shared_ptr<Music> getBackgroundMusic() {
        return this->backgroundMusic;
    }

    class Builder {
    private:
        int _fogColor = 0;
        int _waterColor = 0;
        int _waterFogColor = 0;
        int _skyColor = 0;
        shared_ptr<int> _foliageColorOverride = nullptr;
        shared_ptr<int> _grassColorOverride = nullptr;
        GrassColorModifier _grassColorModifier = GrassColorModifier_NONE;
        shared_ptr<AmbientParticleSettings> _ambientParticle = nullptr;
        shared_ptr<SoundEvent> _ambientLoopSoundEvent = nullptr;
        shared_ptr<AmbientMoodSettings> _ambientMoodSettings = nullptr;
        shared_ptr<AmbientAdditionsSettings> _ambientAdditionsSettings = nullptr;
        shared_ptr<Music> _backgroundMusic = nullptr;

    public:
        BiomeSpecialEffects::Builder &fogColor(int fogColor) {
            this->_fogColor = fogColor;
            return *this;
        }

        BiomeSpecialEffects::Builder &waterColor(int waterColor) {
            this->_waterColor = waterColor;
            return *this;
        }

        BiomeSpecialEffects::Builder &waterFogColor(int waterFogColor) {
            this->_waterFogColor = waterFogColor;
            return *this;
        }

        BiomeSpecialEffects::Builder &skyColor(int skyColor) {
            this->_skyColor = skyColor;
            return *this;
        }

        BiomeSpecialEffects::Builder &foliageColorOverride(int foliageColorOverride) {
            this->_foliageColorOverride = make_shared<int>(foliageColorOverride);
            return *this;
        }

        BiomeSpecialEffects::Builder &grassColorOverride(int grassColorOverride) {
            this->_grassColorOverride = make_shared<int>(grassColorOverride);
            return *this;
        }

        BiomeSpecialEffects::Builder &grassColorModifier(GrassColorModifier grassColorModifier) {
            this->_grassColorModifier = grassColorModifier;
            return *this;
        }

        BiomeSpecialEffects::Builder &ambientParticle(shared_ptr<AmbientParticleSettings> ambientParticle) {
            this->_ambientParticle = ambientParticle;
            return *this;
        }

        BiomeSpecialEffects::Builder &ambientLoopSound(shared_ptr<SoundEvent> ambientLoopSoundEvent) {
            this->_ambientLoopSoundEvent = ambientLoopSoundEvent;
            return *this;
        }

        BiomeSpecialEffects::Builder &ambientMoodSound(shared_ptr<AmbientMoodSettings> ambientMoodSettings) {
            this->_ambientMoodSettings = ambientMoodSettings;
            return *this;
        }

        BiomeSpecialEffects::Builder &ambientAdditionsSound(
            shared_ptr<AmbientAdditionsSettings> ambientAdditionsSettings) {
            this->_ambientAdditionsSettings = ambientAdditionsSettings;
            return *this;
        }

        BiomeSpecialEffects::Builder &backgroundMusic(shared_ptr<Music> backgroundMusic) {
            this->_backgroundMusic = backgroundMusic;
            return *this;
        }

        shared_ptr<BiomeSpecialEffects> build() {
            return make_shared<BiomeSpecialEffects>(
                this->_fogColor, this->_waterColor, this->_waterFogColor, this->_skyColor, this->_foliageColorOverride,
                this->_grassColorOverride, this->_grassColorModifier, this->_ambientParticle,
                this->_ambientLoopSoundEvent, this->_ambientMoodSettings, this->_ambientAdditionsSettings,
                this->_backgroundMusic);
        }
    };
};

class GrassColor {
private:
    static shared_ptr<vector<uint8_t>> pixels;

public:
    static void init(shared_ptr<vector<uint8_t>> input) {
        pixels = input;
    }

    static int get(double x, double z) {
        z *= x;
        int pixelX = (int)((1.0 - x) * 255.0);
        int pixelY = (int)((1.0 - z) * 255.0);
        int pixelIndex = pixelY << 8 | pixelX;
        return pixelIndex >= pixels->size() ? -65281 : pixels->at(pixelIndex);
    }
};

class FoliageColor {
private:
    static shared_ptr<vector<uint8_t>> pixels;

public:
    static void init(shared_ptr<vector<uint8_t>> input) {
        pixels = input;
    }

    static int get(double x, double z) {
        z *= x;
        int pixelX = (int)((1.0 - x) * 255.0);
        int pixelY = (int)((1.0 - z) * 255.0);
        int pixelIndex = pixelY << 8 | pixelX;
        return pixelIndex >= pixels->size() ? getDefaultColor() : pixels->at(pixelIndex);
    }

    static int getEvergreenColor() {
        return 6396257;
    }

    static int getBirchColor() {
        return 8431445;
    }

    static int getDefaultColor() {
        return 4764952;
    }
};

class Biome {
public:
    static PerlinSimplexNoise TEMPERATURE_NOISE;
    static PerlinSimplexNoise FROZEN_TEMPERATURE_NOISE;
    static PerlinSimplexNoise BIOME_INFO_NOISE;

    static TemperatureModifier TemperatureModifier_NONE;
    static TemperatureModifier TemperatureModifier_FROZEN;

    class ClimateSettings {
    public:
        Precipitation precipitation;
        float temperature;
        TemperatureModifier temperatureModifier;
        float downfall;

        ClimateSettings(Precipitation precipitation, float temperature, TemperatureModifier temperatureModifier,
                        float downfall)
            : precipitation(precipitation), temperature(temperature), temperatureModifier(temperatureModifier),
              downfall(downfall) {
        }
    };

    class BiomeBuilder {
    private:
        Precipitation _precipitation;
        BiomeCategory _biomeCategory;
        float _temperature;
        TemperatureModifier _temperatureModifier = TemperatureModifier_NONE;
        float _downfall;
        shared_ptr<BiomeSpecialEffects> _specialEffects;
        shared_ptr<MobSpawnSettings> _mobSpawnSettings;
        shared_ptr<BiomeGenerationSettings> _generationSettings;

    public:
        BiomeBuilder() {
            //
        }

        Biome::BiomeBuilder &precipitation(Precipitation precipitation) {
            this->_precipitation = precipitation;
            return *this;
        }

        Biome::BiomeBuilder &biomeCategory(BiomeCategory category) {
            this->_biomeCategory = category;
            return *this;
        }

        Biome::BiomeBuilder &temperature(float temperature) {
            this->_temperature = temperature;
            return *this;
        }

        Biome::BiomeBuilder &downfall(float downfall) {
            this->_downfall = downfall;
            return *this;
        }

        Biome::BiomeBuilder &specialEffects(shared_ptr<BiomeSpecialEffects> specialEffects) {
            this->_specialEffects = specialEffects;
            return *this;
        }

        Biome::BiomeBuilder &mobSpawnSettings(shared_ptr<MobSpawnSettings> mobSpawnSettings) {
            this->_mobSpawnSettings = mobSpawnSettings;
            return *this;
        }

        Biome::BiomeBuilder &generationSettings(shared_ptr<BiomeGenerationSettings> generationSettings) {
            this->_generationSettings = generationSettings;
            return *this;
        }

        Biome::BiomeBuilder &temperatureAdjustment(TemperatureModifier temperatureModifier) {
            this->_temperatureModifier = temperatureModifier;
            return *this;
        }

        shared_ptr<Biome> build() {
            return make_shared<Biome>(Biome::ClimateSettings(this->_precipitation, this->_temperature,
                                                             this->_temperatureModifier, this->_downfall),
                                      this->_biomeCategory, this->_specialEffects, this->_generationSettings,
                                      this->_mobSpawnSettings);
        }
    };

private:
    static constexpr int TEMPERATURE_CACHE_SIZE = 1024;

    Biome::ClimateSettings climateSettings;
    shared_ptr<BiomeGenerationSettings> generationSettings;
    shared_ptr<MobSpawnSettings> mobSettings;
    BiomeCategory biomeCategory;
    shared_ptr<BiomeSpecialEffects> specialEffects;
    map<int64_t, float> temperatureCache;

public:
    Biome(Biome::ClimateSettings climateSettings, BiomeCategory biomeCategory,
          shared_ptr<BiomeSpecialEffects> specialEffects, shared_ptr<BiomeGenerationSettings> generationSettings,
          shared_ptr<MobSpawnSettings> mobSettings)
        : climateSettings(climateSettings), generationSettings(generationSettings), mobSettings(mobSettings),
          biomeCategory(biomeCategory), specialEffects(specialEffects) {
    }

    int getSkyColor() {
        return this->specialEffects->getSkyColor();
    }

    shared_ptr<MobSpawnSettings> getMobSettings() {
        return this->mobSettings;
    }

    Precipitation getPrecipitation() {
        return this->climateSettings.precipitation;
    }

    bool isHumid() {
        return this->getDownfall() > 0.85F;
    }

private:
    float getHeightAdjustedTemperature(BlockPos blockPos) {
        float mofidiedTemperature = this->climateSettings.temperatureModifier(blockPos, this->getBaseTemperature());
        if (blockPos.getY() > 80) {
            float noiseTemperature =
                (float)(TEMPERATURE_NOISE.getValue((double)((float)blockPos.getX() / 8.0F),
                                                   (double)((float)blockPos.getZ() / 8.0F), false) *
                        8.0);
            return mofidiedTemperature - (noiseTemperature + (float)blockPos.getY() - 80.0F) * 0.05F / 40.0F;
        } else {
            return mofidiedTemperature;
        }
    }

    float getTemperature(BlockPos blockPos) {
        long pos = blockPos.asLong();
        auto temperature = this->temperatureCache.find(pos);
        if (temperature != this->temperatureCache.end()) {
            return temperature->second;
        } else {
            float calculatedTemperature = this->getHeightAdjustedTemperature(blockPos);
            if (this->temperatureCache.size() == TEMPERATURE_CACHE_SIZE) {
                if (!this->temperatureCache.empty()) {
                    this->temperatureCache.erase(this->temperatureCache.begin());
                }
            }

            this->temperatureCache.emplace(pos, calculatedTemperature);
            return calculatedTemperature;
        }
    }

public:
    bool shouldFreeze(const LevelHeightAccessor &level, BlockPos blockPos) {
        return this->shouldFreeze(level, blockPos, true);
    }

    bool shouldFreeze(const LevelHeightAccessor &level, BlockPos blockPos, bool checkNeighbors) {
        if (this->warmEnoughToRain(blockPos)) {
            return false;
        } else {
            /*
            if (blockPos.getY() >= level->getMinBuildHeight() && blockPos.getY() < level->getMaxBuildHeight() &&
                level.getBrightness(LightLayer::BLOCK, blockPos) < 10) {
                BlockState blockState = level->getBlockState(blockPos);
                FluidState fluidState = level->getFluidState(blockPos);
                if (fluidState.getType() == Fluids::WATER && blockState.getBlock() instanceof LiquidBlock) {
                    if (!checkNeighbors) {
                        return true;
                    }

                    bool neighborsIsWater = level.isWaterAt(blockPos.west()) && level.isWaterAt(blockPos.east()) &&
                                            level.isWaterAt(blockPos.north()) && level.isWaterAt(blockPos.south());
                    if (!neighborsIsWater) {
                        return true;
                    }
                }
            }
            */

            return false;
        }
    }

    bool coldEnoughToSnow(BlockPos pos) {
        return !this->warmEnoughToRain(pos);
    }

    bool warmEnoughToRain(BlockPos blockPos) {
        return this->getTemperature(blockPos) >= 0.15F;
    }

    bool shouldMeltFrozenOceanIcebergSlightly(BlockPos blockPos) {
        return this->getTemperature(blockPos) > 0.1F;
    }

    bool shouldSnowGolemBurn(BlockPos blockPos) {
        return this->getTemperature(blockPos) > 1.0F;
    }

    bool shouldSnow(const LevelHeightAccessor &level, BlockPos blockPos) {
        if (this->warmEnoughToRain(blockPos)) {
            return false;
        } else {
            /*
            if (blockPos.getY() >= level.getMinBuildHeight() && blockPos.getY() < level.getMaxBuildHeight() &&
                level.getBrightness(LightLayer::BLOCK, blockPos) < 10) {
                BlockState blockState = level.getBlockState(blockPos);
                if (blockState.isAir() && Blocks::SNOW.defaultBlockState().canSurvive(level, blockPos)) {
                    return true;
                }
            }
            */

            return false;
        }
    }

    shared_ptr<BiomeGenerationSettings> getGenerationSettings() {
        return this->generationSettings;
    }

    int getFogColor() {
        return this->specialEffects->getFogColor();
    }

    int getGrassColor(double x, double z) {
        shared_ptr<int> grassColorOverride = this->specialEffects->getGrassColorOverride();
        int color = grassColorOverride ? *grassColorOverride : this->getGrassColorFromTexture();
        return this->specialEffects->getGrassColorModifier()(x, z, color);
    }

private:
    int getGrassColorFromTexture() {
        double temperature = (double)Mth::clamp(this->climateSettings.temperature, 0.0F, 1.0F);
        double downfall = (double)Mth::clamp(this->climateSettings.downfall, 0.0F, 1.0F);
        return GrassColor::get(temperature, downfall);
    }

    int getFoliageColor() {
        shared_ptr<int> foliageColorOverride = this->specialEffects->getFoliageColorOverride();
        return foliageColorOverride ? *foliageColorOverride : this->getFoliageColorFromTexture();
    }

    int getFoliageColorFromTexture() {
        double clampedTemperature = (double)Mth::clamp(this->climateSettings.temperature, 0.0F, 1.0F);
        double clampedDownfall = (double)Mth::clamp(this->climateSettings.downfall, 0.0F, 1.0F);
        return FoliageColor::get(clampedTemperature, clampedDownfall);
    }

public:
    float getDownfall() {
        return this->climateSettings.downfall;
    }

    float getBaseTemperature() {
        return this->climateSettings.temperature;
    }

    shared_ptr<BiomeSpecialEffects> getSpecialEffects() {
        return this->specialEffects;
    }

    int getWaterColor() {
        return this->specialEffects->getWaterColor();
    }

    int getWaterFogColor() {
        return this->specialEffects->getWaterFogColor();
    }

    shared_ptr<AmbientParticleSettings> getAmbientParticle() {
        return this->specialEffects->getAmbientParticleSettings();
    }

    shared_ptr<SoundEvent> getAmbientLoop() {
        return this->specialEffects->getAmbientLoopSoundEvent();
    }

    shared_ptr<AmbientMoodSettings> getAmbientMood() {
        return this->specialEffects->getAmbientMoodSettings();
    }

    shared_ptr<AmbientAdditionsSettings> getAmbientAdditions() {
        return this->specialEffects->getAmbientAdditionsSettings();
    }

    shared_ptr<Music> getBackgroundMusic() {
        return this->specialEffects->getBackgroundMusic();
    }

    BiomeCategory getBiomeCategory() {
        return this->biomeCategory;
    }
};

class OverworldBiomes {
private:
    static constexpr int32_t NORMAL_WATER_COLOR = 4159204;
    static constexpr int32_t NORMAL_WATER_FOG_COLOR = 329011;
    static constexpr int32_t OVERWORLD_FOG_COLOR = 12638463;

    static shared_ptr<Music> NORMAL_MUSIC;

    static int32_t calculateSkyColor(float temperature) {
        /*
        float temp = temperature / 3.0F;
        temp = Mth::clamp(temp, -1.0F, 1.0F);
        return Mth::hsvToRgb(0.62222224F - temp * 0.05F, 0.5F + temp * 0.1F, 1.0F);
        */
        return 0;
    }

    static shared_ptr<Biome> biome(Precipitation precipitation, BiomeCategory category, float temperature,
                                   float downfall, MobSpawnSettings::Builder &mobSpawnBuilder,
                                   BiomeGenerationSettings::Builder &biomeBuilder, shared_ptr<Music> music) {
        return biome(precipitation, category, temperature, downfall, 4159204, 329011, mobSpawnBuilder, biomeBuilder,
                     music);
    }

    static shared_ptr<Biome> biome(Precipitation precipitation, BiomeCategory category, float temperature,
                                   float downfall, int32_t waterColor, int32_t waterFogColor,
                                   MobSpawnSettings::Builder &mobSpawnBuilder,
                                   BiomeGenerationSettings::Builder &biomeBuilder, shared_ptr<Music> music) {
        return Biome::BiomeBuilder()
            .precipitation(precipitation)
            .biomeCategory(category)
            .temperature(temperature)
            .downfall(downfall)
            .specialEffects(BiomeSpecialEffects::Builder()
                                .waterColor(waterColor)
                                .waterFogColor(waterFogColor)
                                .fogColor(12638463)
                                .skyColor(calculateSkyColor(temperature))
                                //.ambientMoodSound(AmbientMoodSettings::LEGACY_CAVE_SETTINGS)
                                .backgroundMusic(music)
                                .build())
            .mobSpawnSettings(mobSpawnBuilder.build())
            .generationSettings(biomeBuilder.build())
            .build();
    }

    static void globalOverworldGeneration(BiomeGenerationSettings::Builder &builder) {
        BiomeDefaultFeatures::addDefaultCarversAndLakes(builder);
        BiomeDefaultFeatures::addDefaultCrystalFormations(builder);
        BiomeDefaultFeatures::addDefaultMonsterRoom(builder);
        BiomeDefaultFeatures::addDefaultUndergroundVariety(builder);
        BiomeDefaultFeatures::addDefaultSprings(builder);
        BiomeDefaultFeatures::addSurfaceFreezing(builder);
    }

public:
    static shared_ptr<Biome> oldGrowthTaiga(bool isCave) {
        MobSpawnSettings::Builder monSpawnerBuilder;

        BiomeDefaultFeatures::farmAnimals(monSpawnerBuilder);
        /*
        monSpawnerBuilder.addSpawn(MobCategory::CREATURE,
                                   MobSpawnSettings::SpawnerData(EntityType::WOLF, 8, 4, 4));
        monSpawnerBuilder.addSpawn(MobCategory::CREATURE,
                                   MobSpawnSettings::SpawnerData(EntityType::RABBIT, 4, 2, 3));
        monSpawnerBuilder.addSpawn(MobCategory::CREATURE,
                                   MobSpawnSettings::SpawnerData(EntityType::FOX, 8, 2, 4));
        */
        if (isCave) {
            BiomeDefaultFeatures::commonSpawns(monSpawnerBuilder);
        } else {
            BiomeDefaultFeatures::caveSpawns(monSpawnerBuilder);
            BiomeDefaultFeatures::monsters(monSpawnerBuilder, 100, 25, 100, false);
        }

        BiomeGenerationSettings::Builder biomeBuilder;
        globalOverworldGeneration(biomeBuilder);
        BiomeDefaultFeatures::addMossyStoneBlock(biomeBuilder);
        BiomeDefaultFeatures::addFerns(biomeBuilder);
        BiomeDefaultFeatures::addDefaultOres(biomeBuilder);
        BiomeDefaultFeatures::addDefaultSoftDisks(biomeBuilder);
        /*
        biomeBuilder.addFeature(GenerationStep::Decoration::VEGETAL_DECORATION,
                                isCave ? VegetationPlacements::TREES_OLD_GROWTH_SPRUCE_TAIGA
                                       : VegetationPlacements::TREES_OLD_GROWTH_PINE_TAIGA);
        */
        BiomeDefaultFeatures::addDefaultFlowers(biomeBuilder);
        BiomeDefaultFeatures::addGiantTaigaVegetation(biomeBuilder);
        BiomeDefaultFeatures::addDefaultMushrooms(biomeBuilder);
        BiomeDefaultFeatures::addDefaultExtraVegetation(biomeBuilder);
        BiomeDefaultFeatures::addCommonBerryBushes(biomeBuilder);
        return biome(Precipitation::RAIN, BiomeCategory::TAIGA, isCave ? 0.25F : 0.3F, 0.8F, monSpawnerBuilder,
                     biomeBuilder, NORMAL_MUSIC);
    }

    static shared_ptr<Biome> sparseJungle() {
        MobSpawnSettings::Builder mobSpawnBuilder;
        BiomeDefaultFeatures::baseJungleSpawns(mobSpawnBuilder);
        return baseJungle(0.8F, false, true, false, mobSpawnBuilder);
    }

    static shared_ptr<Biome> jungle() {
        MobSpawnSettings::Builder mobSpawnBuilder;
        BiomeDefaultFeatures::baseJungleSpawns(mobSpawnBuilder);
        /*
        mobSpawnBuilder
            .addSpawn(MobCategory::CREATURE, MobSpawnSettings::SpawnerData(EntityType::PARROT, 40, 1, 2))
            .addSpawn(MobCategory::MONSTER, MobSpawnSettings::SpawnerData(EntityType::OCELOT, 2, 1, 3))
            .addSpawn(MobCategory::CREATURE, MobSpawnSettings::SpawnerData(EntityType::PANDA, 1, 1, 2));
        */
        return baseJungle(0.9F, false, false, true, mobSpawnBuilder);
    }

    static shared_ptr<Biome> bambooJungle() {
        MobSpawnSettings::Builder mobSpawnBuilder;
        BiomeDefaultFeatures::baseJungleSpawns(mobSpawnBuilder);
        /*
        mobSpawnBuilder
            .addSpawn(MobCategory::CREATURE, MobSpawnSettings::SpawnerData(EntityType::PARROT, 40, 1, 2))
            .addSpawn(MobCategory::CREATURE, MobSpawnSettings::SpawnerData(EntityType::PANDA, 80, 1, 2))
            .addSpawn(MobCategory::MONSTER, MobSpawnSettings::SpawnerData(EntityType::OCELOT, 2, 1, 1));
        */
        return baseJungle(0.9F, true, false, true, mobSpawnBuilder);
    }

private:
    static shared_ptr<Biome> baseJungle(float downfall, bool bambooOnly, bool sparse, bool lightBamboo,
                                        MobSpawnSettings::Builder &mobSpawnBuilder) {
        BiomeGenerationSettings::Builder biomeBuilder;
        globalOverworldGeneration(biomeBuilder);
        BiomeDefaultFeatures::addDefaultOres(biomeBuilder);
        BiomeDefaultFeatures::addDefaultSoftDisks(biomeBuilder);
        if (bambooOnly) {
            BiomeDefaultFeatures::addBambooVegetation(biomeBuilder);
        } else {
            if (lightBamboo) {
                BiomeDefaultFeatures::addLightBambooVegetation(biomeBuilder);
            }

            if (sparse) {
                BiomeDefaultFeatures::addSparseJungleTrees(biomeBuilder);
            } else {
                BiomeDefaultFeatures::addJungleTrees(biomeBuilder);
            }
        }

        BiomeDefaultFeatures::addWarmFlowers(biomeBuilder);
        BiomeDefaultFeatures::addJungleGrass(biomeBuilder);
        BiomeDefaultFeatures::addDefaultMushrooms(biomeBuilder);
        BiomeDefaultFeatures::addDefaultExtraVegetation(biomeBuilder);
        BiomeDefaultFeatures::addJungleVines(biomeBuilder);
        if (sparse) {
            BiomeDefaultFeatures::addSparseJungleMelons(biomeBuilder);
        } else {
            BiomeDefaultFeatures::addJungleMelons(biomeBuilder);
        }

        return biome(Precipitation::RAIN, BiomeCategory::JUNGLE, 0.95F, downfall, mobSpawnBuilder, biomeBuilder,
                     NORMAL_MUSIC);
    }

public:
    static shared_ptr<Biome> windsweptHills(bool forest) {
        MobSpawnSettings::Builder mobSpawnBuilder;
        BiomeDefaultFeatures::farmAnimals(mobSpawnBuilder);
        /*
        mobSpawnBuilder.addSpawn(MobCategory::CREATURE,
                                 MobSpawnSettings::SpawnerData(EntityType::LLAMA, 5, 4, 6));
        */
        BiomeDefaultFeatures::commonSpawns(mobSpawnBuilder);

        BiomeGenerationSettings::Builder biomeBuilder;
        globalOverworldGeneration(biomeBuilder);
        BiomeDefaultFeatures::addDefaultOres(biomeBuilder);
        BiomeDefaultFeatures::addDefaultSoftDisks(biomeBuilder);
        if (forest) {
            BiomeDefaultFeatures::addMountainForestTrees(biomeBuilder);
        } else {
            BiomeDefaultFeatures::addMountainTrees(biomeBuilder);
        }

        BiomeDefaultFeatures::addDefaultFlowers(biomeBuilder);
        BiomeDefaultFeatures::addDefaultGrass(biomeBuilder);
        BiomeDefaultFeatures::addDefaultMushrooms(biomeBuilder);
        BiomeDefaultFeatures::addDefaultExtraVegetation(biomeBuilder);
        BiomeDefaultFeatures::addExtraEmeralds(biomeBuilder);
        BiomeDefaultFeatures::addInfestedStone(biomeBuilder);
        return biome(Precipitation::RAIN, BiomeCategory::EXTREME_HILLS, 0.2F, 0.3F, mobSpawnBuilder, biomeBuilder,
                     NORMAL_MUSIC);
    }

    static shared_ptr<Biome> desert() {
        MobSpawnSettings::Builder mobSpawner;
        BiomeDefaultFeatures::desertSpawns(mobSpawner);

        BiomeGenerationSettings::Builder biomeSettings;
        BiomeDefaultFeatures::addFossilDecoration(biomeSettings);
        globalOverworldGeneration(biomeSettings);
        BiomeDefaultFeatures::addDefaultOres(biomeSettings);
        BiomeDefaultFeatures::addDefaultSoftDisks(biomeSettings);
        BiomeDefaultFeatures::addDefaultFlowers(biomeSettings);
        BiomeDefaultFeatures::addDefaultGrass(biomeSettings);
        BiomeDefaultFeatures::addDesertVegetation(biomeSettings);
        BiomeDefaultFeatures::addDefaultMushrooms(biomeSettings);
        BiomeDefaultFeatures::addDesertExtraVegetation(biomeSettings);
        BiomeDefaultFeatures::addDesertExtraDecoration(biomeSettings);

        return biome(Precipitation::Precipitation_NONE, BiomeCategory::DESERT, 2.0F, 0.0F, mobSpawner, biomeSettings,
                     NORMAL_MUSIC);
    }

    static shared_ptr<Biome> plains(bool sunflower, bool isSnowy, bool haveSurfaceStructures) {
        MobSpawnSettings::Builder mobSpawner;
        BiomeGenerationSettings::Builder biomeBuilder;

        globalOverworldGeneration(biomeBuilder);
        if (isSnowy) {
            // mobSpawner.creatureGenerationProbability(0.07F);
            BiomeDefaultFeatures::snowySpawns(mobSpawner);
            if (haveSurfaceStructures) {
                /*
                biomeBuilder.addFeature(GenerationStep::Decoration::SURFACE_STRUCTURES,
                                        MiscOverworldPlacements::ICE_SPIKE);
                biomeBuilder.addFeature(GenerationStep::Decoration::SURFACE_STRUCTURES,
                                        MiscOverworldPlacements::ICE_PATCH);
                */
            }
        } else {
            BiomeDefaultFeatures::plainsSpawns(mobSpawner);
            BiomeDefaultFeatures::addPlainGrass(biomeBuilder);
            if (sunflower) {
                /*
                biomeBuilder.addFeature(GenerationStep::Decoration::VEGETAL_DECORATION,
                                        VegetationPlacements::PATCH_SUNFLOWER);
                */
            }
        }

        BiomeDefaultFeatures::addDefaultOres(biomeBuilder);
        BiomeDefaultFeatures::addDefaultSoftDisks(biomeBuilder);
        if (isSnowy) {
            BiomeDefaultFeatures::addSnowyTrees(biomeBuilder);
            BiomeDefaultFeatures::addDefaultFlowers(biomeBuilder);
            BiomeDefaultFeatures::addDefaultGrass(biomeBuilder);
        } else {
            BiomeDefaultFeatures::addPlainVegetation(biomeBuilder);
        }

        BiomeDefaultFeatures::addDefaultMushrooms(biomeBuilder);
        if (sunflower) {
            /*
            biomeBuilder.addFeature(GenerationStep::Decoration::VEGETAL_DECORATION,
                                    VegetationPlacements::PATCH_SUGAR_CANE);
            biomeBuilder.addFeature(GenerationStep::Decoration::VEGETAL_DECORATION,
                                    VegetationPlacements::PATCH_PUMPKIN);
            */
        } else {
            BiomeDefaultFeatures::addDefaultExtraVegetation(biomeBuilder);
        }

        float temperature = isSnowy ? 0.0F : 0.8F;
        return biome(isSnowy ? Precipitation::SNOW : Precipitation::RAIN,
                     isSnowy ? BiomeCategory::ICY : BiomeCategory::PLAINS, temperature, isSnowy ? 0.5F : 0.4F,
                     mobSpawner, biomeBuilder, NORMAL_MUSIC);
    }

    static shared_ptr<Biome> mushroomFields() {
        MobSpawnSettings::Builder mobSpawnBuilder;
        BiomeDefaultFeatures::mooshroomSpawns(mobSpawnBuilder);
        BiomeGenerationSettings::Builder biomeBuilder;
        globalOverworldGeneration(biomeBuilder);
        BiomeDefaultFeatures::addDefaultOres(biomeBuilder);
        BiomeDefaultFeatures::addDefaultSoftDisks(biomeBuilder);
        BiomeDefaultFeatures::addMushroomFieldVegetation(biomeBuilder);
        BiomeDefaultFeatures::addDefaultExtraVegetation(biomeBuilder);
        return biome(Precipitation::RAIN, BiomeCategory::MUSHROOM, 0.9F, 1.0F, mobSpawnBuilder, biomeBuilder,
                     NORMAL_MUSIC);
    }

    static shared_ptr<Biome> savanna(bool shattered, bool llama) {
        BiomeGenerationSettings::Builder biomeBuilder;
        globalOverworldGeneration(biomeBuilder);
        if (!shattered) {
            BiomeDefaultFeatures::addSavannaGrass(biomeBuilder);
        }

        BiomeDefaultFeatures::addDefaultOres(biomeBuilder);
        BiomeDefaultFeatures::addDefaultSoftDisks(biomeBuilder);
        if (shattered) {
            BiomeDefaultFeatures::addShatteredSavannaTrees(biomeBuilder);
            BiomeDefaultFeatures::addDefaultFlowers(biomeBuilder);
            BiomeDefaultFeatures::addShatteredSavannaGrass(biomeBuilder);
        } else {
            BiomeDefaultFeatures::addSavannaTrees(biomeBuilder);
            BiomeDefaultFeatures::addWarmFlowers(biomeBuilder);
            BiomeDefaultFeatures::addSavannaExtraGrass(biomeBuilder);
        }

        BiomeDefaultFeatures::addDefaultMushrooms(biomeBuilder);
        BiomeDefaultFeatures::addDefaultExtraVegetation(biomeBuilder);
        MobSpawnSettings::Builder mobSpawnBuilder;
        BiomeDefaultFeatures::farmAnimals(mobSpawnBuilder);
        /*
        mobSpawnBuilder
            .addSpawn(MobCategory::CREATURE, MobSpawnSettings::SpawnerData(EntityType::HORSE, 1, 2, 6))
            .addSpawn(MobCategory::CREATURE, MobSpawnSettings::SpawnerData(EntityType::DONKEY, 1, 1, 1));
        */
        BiomeDefaultFeatures::commonSpawns(mobSpawnBuilder);
        if (llama) {
            /*
            mobSpawnBuilder.addSpawn(MobCategory::CREATURE, MobSpawnSettings::SpawnerData(EntityType::LLAMA, 8, 4, 4));
            */
        }

        return biome(Precipitation::Precipitation_NONE, BiomeCategory::SAVANNA, 2.0F, 0.0F, mobSpawnBuilder,
                     biomeBuilder, NORMAL_MUSIC);
    }

    static shared_ptr<Biome> badlands(bool trees) {
        MobSpawnSettings::Builder mobSpawnBuilder;
        BiomeDefaultFeatures::commonSpawns(mobSpawnBuilder);
        BiomeGenerationSettings::Builder biomeBuilder;
        globalOverworldGeneration(biomeBuilder);
        BiomeDefaultFeatures::addDefaultOres(biomeBuilder);
        BiomeDefaultFeatures::addExtraGold(biomeBuilder);
        BiomeDefaultFeatures::addDefaultSoftDisks(biomeBuilder);
        if (trees) {
            BiomeDefaultFeatures::addBadlandsTrees(biomeBuilder);
        }

        BiomeDefaultFeatures::addBadlandGrass(biomeBuilder);
        BiomeDefaultFeatures::addDefaultMushrooms(biomeBuilder);
        BiomeDefaultFeatures::addBadlandExtraVegetation(biomeBuilder);
        return Biome::BiomeBuilder()
            .precipitation(Precipitation::Precipitation_NONE)
            .biomeCategory(BiomeCategory::MESA)
            .temperature(2.0F)
            .downfall(0.0F)
            .specialEffects(BiomeSpecialEffects::Builder()
                                .waterColor(4159204)
                                .waterFogColor(329011)
                                .fogColor(12638463)
                                .skyColor(calculateSkyColor(2.0F))
                                .foliageColorOverride(10387789)
                                .grassColorOverride(9470285)
                                // .ambientMoodSound(AmbientMoodSettings::LEGACY_CAVE_SETTINGS)
                                .build())
            .mobSpawnSettings(mobSpawnBuilder.build())
            .generationSettings(biomeBuilder.build())
            .build();
    }

private:
    static shared_ptr<Biome> baseOcean(MobSpawnSettings::Builder &mobSpawnBuilder, int32_t waterColor,
                                       int32_t waterFogColor, BiomeGenerationSettings::Builder &biomeBuilder) {
        return biome(Precipitation::RAIN, BiomeCategory::OCEAN, 0.5F, 0.5F, waterColor, waterFogColor, mobSpawnBuilder,
                     biomeBuilder, NORMAL_MUSIC);
    }

    static BiomeGenerationSettings::Builder baseOceanGeneration() {
        BiomeGenerationSettings::Builder biomeBuilder;
        globalOverworldGeneration(biomeBuilder);
        BiomeDefaultFeatures::addDefaultOres(biomeBuilder);
        BiomeDefaultFeatures::addDefaultSoftDisks(biomeBuilder);
        BiomeDefaultFeatures::addWaterTrees(biomeBuilder);
        BiomeDefaultFeatures::addDefaultFlowers(biomeBuilder);
        BiomeDefaultFeatures::addDefaultGrass(biomeBuilder);
        BiomeDefaultFeatures::addDefaultMushrooms(biomeBuilder);
        BiomeDefaultFeatures::addDefaultExtraVegetation(biomeBuilder);
        return biomeBuilder;
    }

public:
    static shared_ptr<Biome> coldOcean(bool deep) {
        MobSpawnSettings::Builder mobSpawnBuilder;
        BiomeDefaultFeatures::oceanSpawns(mobSpawnBuilder, 3, 4, 15);
        /*
        mobSpawnBuilder.addSpawn(MobCategory::WATER_AMBIENT,
                                 MobSpawnSettings::SpawnerData(EntityType::SALMON, 15, 1, 5));
        */
        BiomeGenerationSettings::Builder biomeBuilder = baseOceanGeneration();
        /*
        biomeBuilder.addFeature(GenerationStep::Decoration::VEGETAL_DECORATION,
                                deep ? AquaticPlacements::SEAGRASS_DEEP_COLD : AquaticPlacements::SEAGRASS_COLD);
        */
        BiomeDefaultFeatures::addDefaultSeagrass(biomeBuilder);
        BiomeDefaultFeatures::addColdOceanExtraVegetation(biomeBuilder);
        return baseOcean(mobSpawnBuilder, 4020182, 329011, biomeBuilder);
    }

    static shared_ptr<Biome> ocean(bool deep) {
        MobSpawnSettings::Builder mobSpawnBuilder;
        BiomeDefaultFeatures::oceanSpawns(mobSpawnBuilder, 1, 4, 10);
        /*
        mobSpawnBuilder.addSpawn(MobCategory::WATER_CREATURE,
                                 MobSpawnSettings::SpawnerData(EntityType::DOLPHIN, 1, 1, 2));
        */
        BiomeGenerationSettings::Builder biomeBuilder = baseOceanGeneration();
        /*
        biomeBuilder.addFeature(GenerationStep::Decoration::VEGETAL_DECORATION,
                                deep ? AquaticPlacements::SEAGRASS_DEEP : AquaticPlacements::SEAGRASS_NORMAL);
        */
        BiomeDefaultFeatures::addDefaultSeagrass(biomeBuilder);
        BiomeDefaultFeatures::addColdOceanExtraVegetation(biomeBuilder);
        return baseOcean(mobSpawnBuilder, 4159204, 329011, biomeBuilder);
    }

    static shared_ptr<Biome> lukeWarmOcean(bool deep) {
        MobSpawnSettings::Builder mobSpawnBuilder;
        if (deep) {
            BiomeDefaultFeatures::oceanSpawns(mobSpawnBuilder, 8, 4, 8);
        } else {
            BiomeDefaultFeatures::oceanSpawns(mobSpawnBuilder, 10, 2, 15);
        }

        /*
        mobSpawnBuilder
            .addSpawn(MobCategory::WATER_AMBIENT, MobSpawnSettings::SpawnerData(EntityType::PUFFERFISH, 5, 1, 3))
            .addSpawn(MobCategory::WATER_AMBIENT, MobSpawnSettings::SpawnerData(EntityType::TROPICAL_FISH, 25, 8, 8))
            .addSpawn(MobCategory::WATER_CREATURE, MobSpawnSettings::SpawnerData(EntityType::DOLPHIN, 2, 1, 2));
        */
        BiomeGenerationSettings::Builder biomeBuilder = baseOceanGeneration();
        /*
        biomeBuilder.addFeature(GenerationStep::Decoration::VEGETAL_DECORATION,
                                deep ? AquaticPlacements::SEAGRASS_DEEP_WARM : AquaticPlacements::SEAGRASS_WARM);
        */
        if (deep) {
            BiomeDefaultFeatures::addDefaultSeagrass(biomeBuilder);
        }

        BiomeDefaultFeatures::addLukeWarmKelp(biomeBuilder);
        return baseOcean(mobSpawnBuilder, 4566514, 267827, biomeBuilder);
    }

    static shared_ptr<Biome> warmOcean() {
        MobSpawnSettings::Builder mobSpawnBuilder;
        /*
        mobSpawnBuilder.addSpawn(MobCategory::WATER_AMBIENT, MobSpawnSettings::SpawnerData(EntityType::PUFFERFISH, 15,
            1, 3);
        */
        BiomeDefaultFeatures::warmOceanSpawns(mobSpawnBuilder, 10, 4);
        BiomeGenerationSettings::Builder biomeBuilder = baseOceanGeneration();
        /*
        .addFeature(GenerationStep::Decoration::VEGETAL_DECORATION, AquaticPlacements::WARM_OCEAN_VEGETATION)
        .addFeature(GenerationStep::Decoration::VEGETAL_DECORATION, AquaticPlacements::SEAGRASS_WARM)
        .addFeature(GenerationStep::Decoration::VEGETAL_DECORATION, AquaticPlacements::SEA_PICKLE)
        */
        return baseOcean(mobSpawnBuilder, 4445678, 270131, biomeBuilder);
    }

    static shared_ptr<Biome> frozenOcean(bool deep) {
        MobSpawnSettings::Builder mobSpawnBuilder;
        /*
        mobSpawnBuilder.addSpawn(MobCategory::WATER_CREATURE, MobSpawnSettings::SpawnerData(EntityType::SQUID, 1, 1, 4))
            .addSpawn(MobCategory::WATER_AMBIENT, MobSpawnSettings::SpawnerData(EntityType::SALMON, 15, 1, 5))
            .addSpawn(MobCategory::CREATURE, MobSpawnSettings::SpawnerData(EntityType::POLAR_BEAR, 1, 1, 2));
        */
        BiomeDefaultFeatures::commonSpawns(mobSpawnBuilder);
        // mobSpawnBuilder.addSpawn(MobCategory::MONSTER, MobSpawnSettings::SpawnerData(EntityType::DROWNED, 5, 1, 1));
        float temperature = deep ? 0.5F : 0.0F;
        BiomeGenerationSettings::Builder biomeBuilder;
        BiomeDefaultFeatures::addIcebergs(biomeBuilder);
        globalOverworldGeneration(biomeBuilder);
        BiomeDefaultFeatures::addBlueIce(biomeBuilder);
        BiomeDefaultFeatures::addDefaultOres(biomeBuilder);
        BiomeDefaultFeatures::addDefaultSoftDisks(biomeBuilder);
        BiomeDefaultFeatures::addWaterTrees(biomeBuilder);
        BiomeDefaultFeatures::addDefaultFlowers(biomeBuilder);
        BiomeDefaultFeatures::addDefaultGrass(biomeBuilder);
        BiomeDefaultFeatures::addDefaultMushrooms(biomeBuilder);
        BiomeDefaultFeatures::addDefaultExtraVegetation(biomeBuilder);
        return Biome::BiomeBuilder()
            .precipitation(deep ? Precipitation::RAIN : Precipitation::SNOW)
            .biomeCategory(BiomeCategory::OCEAN)
            .temperature(temperature)
            .temperatureAdjustment(Biome::TemperatureModifier_FROZEN)
            .downfall(0.5F)
            .specialEffects(BiomeSpecialEffects::Builder()
                                .waterColor(3750089)
                                .waterFogColor(329011)
                                .fogColor(12638463)
                                .skyColor(calculateSkyColor(temperature))
                                // .ambientMoodSound(AmbientMoodSettings::LEGACY_CAVE_SETTINGS)
                                .build())
            .mobSpawnSettings(mobSpawnBuilder.build())
            .generationSettings(biomeBuilder.build())
            .build();
    }

    static shared_ptr<Biome> forest(bool birch, bool tall, bool flowers) {
        BiomeGenerationSettings::Builder biomeBuilder;
        globalOverworldGeneration(biomeBuilder);
        if (flowers) {
            /*
            biomeBuilder.addFeature(GenerationStep::Decoration::VEGETAL_DECORATION,
                                    VegetationPlacements::FLOWER_FOREST_FLOWERS);
            */
        } else {
            BiomeDefaultFeatures::addForestFlowers(biomeBuilder);
        }

        BiomeDefaultFeatures::addDefaultOres(biomeBuilder);
        BiomeDefaultFeatures::addDefaultSoftDisks(biomeBuilder);
        if (flowers) {
            /*
            biomeBuilder.addFeature(GenerationStep::Decoration::VEGETAL_DECORATION,
                                    VegetationPlacements::TREES_FLOWER_FOREST);
            biomeBuilder.addFeature(GenerationStep::Decoration::VEGETAL_DECORATION,
                                    VegetationPlacements::FLOWER_FLOWER_FOREST);
            */
            BiomeDefaultFeatures::addDefaultGrass(biomeBuilder);
        } else {
            if (birch) {
                if (tall) {
                    BiomeDefaultFeatures::addTallBirchTrees(biomeBuilder);
                } else {
                    BiomeDefaultFeatures::addBirchTrees(biomeBuilder);
                }
            } else {
                BiomeDefaultFeatures::addOtherBirchTrees(biomeBuilder);
            }

            BiomeDefaultFeatures::addDefaultFlowers(biomeBuilder);
            BiomeDefaultFeatures::addForestGrass(biomeBuilder);
        }

        BiomeDefaultFeatures::addDefaultMushrooms(biomeBuilder);
        BiomeDefaultFeatures::addDefaultExtraVegetation(biomeBuilder);
        MobSpawnSettings::Builder mobSpawnBuilder;
        BiomeDefaultFeatures::farmAnimals(mobSpawnBuilder);
        BiomeDefaultFeatures::commonSpawns(mobSpawnBuilder);
        if (flowers) {
            /*
            mobSpawnBuilder.addSpawn(MobCategory::CREATURE, MobSpawnSettings::SpawnerData(EntityType::RABBIT, 4, 2, 3));
            */
        } else if (!birch) {
            /*
            mobSpawnBuilder.addSpawn(MobCategory::CREATURE, MobSpawnSettings::SpawnerData(EntityType::WOLF, 5, 4, 4));
            */
        }

        float temparature = birch ? 0.6F : 0.7F;
        return biome(Precipitation::RAIN, BiomeCategory::FOREST, temparature, birch ? 0.6F : 0.8F, mobSpawnBuilder,
                     biomeBuilder, NORMAL_MUSIC);
    }

    static shared_ptr<Biome> taiga(bool snowy) {
        MobSpawnSettings::Builder mobSpawnBuilder;
        BiomeDefaultFeatures::farmAnimals(mobSpawnBuilder);
        /*
        mobSpawnBuilder.addSpawn(MobCategory::CREATURE, MobSpawnSettings::SpawnerData(EntityType::WOLF, 8, 4, 4))
            .addSpawn(MobCategory::CREATURE, MobSpawnSettings::SpawnerData(EntityType::RABBIT, 4, 2, 3))
            .addSpawn(MobCategory::CREATURE, MobSpawnSettings::SpawnerData(EntityType::FOX, 8, 2, 4));
        */
        BiomeDefaultFeatures::commonSpawns(mobSpawnBuilder);
        float temperature = snowy ? -0.5F : 0.25F;
        BiomeGenerationSettings::Builder biomeBuilder;
        globalOverworldGeneration(biomeBuilder);
        BiomeDefaultFeatures::addFerns(biomeBuilder);
        BiomeDefaultFeatures::addDefaultOres(biomeBuilder);
        BiomeDefaultFeatures::addDefaultSoftDisks(biomeBuilder);
        BiomeDefaultFeatures::addTaigaTrees(biomeBuilder);
        BiomeDefaultFeatures::addDefaultFlowers(biomeBuilder);
        BiomeDefaultFeatures::addTaigaGrass(biomeBuilder);
        BiomeDefaultFeatures::addDefaultExtraVegetation(biomeBuilder);
        if (snowy) {
            BiomeDefaultFeatures::addRareBerryBushes(biomeBuilder);
        } else {
            BiomeDefaultFeatures::addCommonBerryBushes(biomeBuilder);
        }

        return biome(snowy ? Precipitation::SNOW : Precipitation::RAIN, BiomeCategory::TAIGA, temperature,
                     snowy ? 0.4F : 0.8F, snowy ? 4020182 : 4159204, 329011, mobSpawnBuilder, biomeBuilder,
                     NORMAL_MUSIC);
    }

    static shared_ptr<Biome> darkForest() {
        MobSpawnSettings::Builder mobSpawnBuilder;
        BiomeDefaultFeatures::farmAnimals(mobSpawnBuilder);
        BiomeDefaultFeatures::commonSpawns(mobSpawnBuilder);
        BiomeGenerationSettings::Builder biomeBuilder;
        globalOverworldGeneration(biomeBuilder);
        /*
        biomeBuilder.addFeature(GenerationStep::Decoration::VEGETAL_DECORATION,
                                VegetationPlacements::DARK_FOREST_VEGETATION);
        */
        BiomeDefaultFeatures::addForestFlowers(biomeBuilder);
        BiomeDefaultFeatures::addDefaultOres(biomeBuilder);
        BiomeDefaultFeatures::addDefaultSoftDisks(biomeBuilder);
        BiomeDefaultFeatures::addDefaultFlowers(biomeBuilder);
        BiomeDefaultFeatures::addForestGrass(biomeBuilder);
        BiomeDefaultFeatures::addDefaultMushrooms(biomeBuilder);
        BiomeDefaultFeatures::addDefaultExtraVegetation(biomeBuilder);
        return Biome::BiomeBuilder()
            .precipitation(Precipitation::RAIN)
            .biomeCategory(BiomeCategory::FOREST)
            .temperature(0.7F)
            .downfall(0.8F)
            .specialEffects(BiomeSpecialEffects::Builder()
                                .waterColor(4159204)
                                .waterFogColor(329011)
                                .fogColor(12638463)
                                .skyColor(calculateSkyColor(0.7F))
                                .grassColorModifier(GrassColorModifier_DARK_FOREST)
                                // .ambientMoodSound(AmbientMoodSettings::LEGACY_CAVE_SETTINGS)
                                .build())
            .mobSpawnSettings(mobSpawnBuilder.build())
            .generationSettings(biomeBuilder.build())
            .build();
    }

    static shared_ptr<Biome> swamp() {
        MobSpawnSettings::Builder mobSpawnBuilder;
        BiomeDefaultFeatures::farmAnimals(mobSpawnBuilder);
        BiomeDefaultFeatures::commonSpawns(mobSpawnBuilder);
        // mobSpawnBuilder.addSpawn(MobCategory::MONSTER, MobSpawnSettings::SpawnerData(EntityType::SLIME, 1, 1, 1));
        BiomeGenerationSettings::Builder biomeBuilder;
        BiomeDefaultFeatures::addFossilDecoration(biomeBuilder);
        globalOverworldGeneration(biomeBuilder);
        BiomeDefaultFeatures::addDefaultOres(biomeBuilder);
        BiomeDefaultFeatures::addSwampClayDisk(biomeBuilder);
        BiomeDefaultFeatures::addSwampVegetation(biomeBuilder);
        BiomeDefaultFeatures::addDefaultMushrooms(biomeBuilder);
        BiomeDefaultFeatures::addSwampExtraVegetation(biomeBuilder);
        // biomeBuilder.addFeature(GenerationStep::Decoration::VEGETAL_DECORATION, AquaticPlacements::SEAGRASS_SWAMP);
        return Biome::BiomeBuilder()
            .precipitation(Precipitation::RAIN)
            .biomeCategory(BiomeCategory::SWAMP)
            .temperature(0.8F)
            .downfall(0.9F)
            .specialEffects(BiomeSpecialEffects::Builder()
                                .waterColor(6388580)
                                .waterFogColor(2302743)
                                .fogColor(12638463)
                                .skyColor(calculateSkyColor(0.8F))
                                .foliageColorOverride(6975545)
                                .grassColorModifier(GrassColorModifier_SWAMP)
                                // .ambientMoodSound(AmbientMoodSettings::LEGACY_CAVE_SETTINGS)
                                .build())
            .mobSpawnSettings(mobSpawnBuilder.build())
            .generationSettings(biomeBuilder.build())
            .build();
    }

    static shared_ptr<Biome> river(bool frozen) {
        MobSpawnSettings::Builder mobSpawnBuilder;
        /*
        mobSpawnBuilder.addSpawn(MobCategory::WATER_CREATURE, MobSpawnSettings::SpawnerData(EntityType::SQUID, 2, 1, 4))
            .addSpawn(MobCategory::WATER_AMBIENT, MobSpawnSettings::SpawnerData(EntityType::SALMON, 5, 1, 5));
        */
        BiomeDefaultFeatures::commonSpawns(mobSpawnBuilder);
        /*
        mobSpawnBuilder.addSpawn(MobCategory::MONSTER,
                                 MobSpawnSettings::SpawnerData(EntityType::DROWNED, frozen ? 1 : 100, 1, 1));
        */

        BiomeGenerationSettings::Builder biomeBuilder;
        globalOverworldGeneration(biomeBuilder);
        BiomeDefaultFeatures::addDefaultOres(biomeBuilder);
        BiomeDefaultFeatures::addDefaultSoftDisks(biomeBuilder);
        BiomeDefaultFeatures::addWaterTrees(biomeBuilder);
        BiomeDefaultFeatures::addDefaultFlowers(biomeBuilder);
        BiomeDefaultFeatures::addDefaultGrass(biomeBuilder);
        BiomeDefaultFeatures::addDefaultMushrooms(biomeBuilder);
        BiomeDefaultFeatures::addDefaultExtraVegetation(biomeBuilder);

        if (!frozen) {
            /*
            biomeBuilder.addFeature(GenerationStep::Decoration::VEGETAL_DECORATION, AquaticPlacements::SEAGRASS_RIVER);
            */
        }

        float temperature = frozen ? 0.0F : 0.5F;
        return biome(frozen ? Precipitation::SNOW : Precipitation::RAIN, BiomeCategory::RIVER, temperature, 0.5F,
                     frozen ? 3750089 : 4159204, 329011, mobSpawnBuilder, biomeBuilder, NORMAL_MUSIC);
    }

    static shared_ptr<Biome> beach(bool snowy, bool stony) {
        MobSpawnSettings::Builder mobSpawnBuilder;
        bool regular = !stony && !snowy;
        if (regular) {
            /*
            mobSpawnBuilder.addSpawn(MobCategory::CREATURE, MobSpawnSettings::SpawnerData(EntityType::TURTLE, 5, 2, 5));
            */
        }

        BiomeDefaultFeatures::commonSpawns(mobSpawnBuilder);
        BiomeGenerationSettings::Builder biomeBuilder;
        globalOverworldGeneration(biomeBuilder);
        BiomeDefaultFeatures::addDefaultOres(biomeBuilder);
        BiomeDefaultFeatures::addDefaultSoftDisks(biomeBuilder);
        BiomeDefaultFeatures::addDefaultFlowers(biomeBuilder);
        BiomeDefaultFeatures::addDefaultGrass(biomeBuilder);
        BiomeDefaultFeatures::addDefaultMushrooms(biomeBuilder);
        BiomeDefaultFeatures::addDefaultExtraVegetation(biomeBuilder);
        float temperature;
        if (snowy) {
            temperature = 0.05F;
        } else if (stony) {
            temperature = 0.2F;
        } else {
            temperature = 0.8F;
        }

        return biome(snowy ? Precipitation::SNOW : Precipitation::RAIN, BiomeCategory::BEACH, temperature,
                     regular ? 0.4F : 0.3F, snowy ? 4020182 : 4159204, 329011, mobSpawnBuilder, biomeBuilder,
                     NORMAL_MUSIC);
    }

    static shared_ptr<Biome> theVoid() {
        MobSpawnSettings::Builder mobSpawnBuilder;
        BiomeGenerationSettings::Builder biomeBuilder;
        /*
        biomeBuilder.addFeature(GenerationStep::Decoration::TOP_LAYER_MODIFICATION,
                                MiscOverworldPlacements::VOID_START_PLATFORM);
        */
        return biome(Precipitation::Precipitation_NONE, BiomeCategory::BiomeCategory_NONE, 0.5F, 0.5F, mobSpawnBuilder,
                     biomeBuilder, NORMAL_MUSIC);
    }

    static shared_ptr<Biome> meadow() {
        BiomeGenerationSettings::Builder biomeBuilder;
        MobSpawnSettings::Builder mobSpawnBuilder;
        /*
        mobSpawnBuilder.addSpawn(MobCategory::CREATURE, MobSpawnSettings::SpawnerData(EntityType::DONKEY, 1, 1, 2))
            .addSpawn(MobCategory::CREATURE, MobSpawnSettings::SpawnerData(EntityType::RABBIT, 2, 2, 6))
            .addSpawn(MobCategory::CREATURE, MobSpawnSettings::SpawnerData(EntityType::SHEEP, 2, 2, 4));
        */
        BiomeDefaultFeatures::commonSpawns(mobSpawnBuilder);
        globalOverworldGeneration(biomeBuilder);
        BiomeDefaultFeatures::addPlainGrass(biomeBuilder);
        BiomeDefaultFeatures::addDefaultOres(biomeBuilder);
        BiomeDefaultFeatures::addDefaultSoftDisks(biomeBuilder);
        BiomeDefaultFeatures::addMeadowVegetation(biomeBuilder);
        BiomeDefaultFeatures::addExtraEmeralds(biomeBuilder);
        BiomeDefaultFeatures::addInfestedStone(biomeBuilder);
        shared_ptr<Music> music = nullptr; // nullptr; // Musics::createGameMusic(SoundEvents::MUSIC_BIOME_MEADOW);
        return biome(Precipitation::RAIN, BiomeCategory::MOUNTAIN, 0.5F, 0.8F, 937679, 329011, mobSpawnBuilder,
                     biomeBuilder, music);
    }

    static shared_ptr<Biome> frozenPeaks() {
        BiomeGenerationSettings::Builder biomeBuilder;
        MobSpawnSettings::Builder mobSpawnBuilder;
        // mobSpawnBuilder.addSpawn(MobCategory::CREATURE, MobSpawnSettings::SpawnerData(EntityType::GOAT, 5, 1, 3));
        BiomeDefaultFeatures::commonSpawns(mobSpawnBuilder);
        globalOverworldGeneration(biomeBuilder);
        BiomeDefaultFeatures::addFrozenSprings(biomeBuilder);
        BiomeDefaultFeatures::addDefaultOres(biomeBuilder);
        BiomeDefaultFeatures::addDefaultSoftDisks(biomeBuilder);
        BiomeDefaultFeatures::addExtraEmeralds(biomeBuilder);
        BiomeDefaultFeatures::addInfestedStone(biomeBuilder);
        shared_ptr<Music> music = nullptr; // Musics::createGameMusic(SoundEvents::MUSIC_BIOME_FROZEN_PEAKS);
        return biome(Precipitation::SNOW, BiomeCategory::MOUNTAIN, -0.7F, 0.9F, mobSpawnBuilder, biomeBuilder, music);
    }

    static shared_ptr<Biome> jaggedPeaks() {
        BiomeGenerationSettings::Builder biomeBuilder;
        MobSpawnSettings::Builder mobSpawnBuilder;
        // mobSpawnBuilder.addSpawn(MobCategory::CREATURE, MobSpawnSettings::SpawnerData(EntityType::GOAT, 5, 1, 3));
        BiomeDefaultFeatures::commonSpawns(mobSpawnBuilder);
        globalOverworldGeneration(biomeBuilder);
        BiomeDefaultFeatures::addFrozenSprings(biomeBuilder);
        BiomeDefaultFeatures::addDefaultOres(biomeBuilder);
        BiomeDefaultFeatures::addDefaultSoftDisks(biomeBuilder);
        BiomeDefaultFeatures::addExtraEmeralds(biomeBuilder);
        BiomeDefaultFeatures::addInfestedStone(biomeBuilder);
        shared_ptr<Music> music = nullptr; // Musics::createGameMusic(SoundEvents::MUSIC_BIOME_JAGGED_PEAKS);
        return biome(Precipitation::SNOW, BiomeCategory::MOUNTAIN, -0.7F, 0.9F, mobSpawnBuilder, biomeBuilder, music);
    }

    static shared_ptr<Biome> stonyPeaks() {
        BiomeGenerationSettings::Builder biomeBuilder;
        MobSpawnSettings::Builder mobSpawnBuilder;
        BiomeDefaultFeatures::commonSpawns(mobSpawnBuilder);
        globalOverworldGeneration(biomeBuilder);
        BiomeDefaultFeatures::addDefaultOres(biomeBuilder);
        BiomeDefaultFeatures::addDefaultSoftDisks(biomeBuilder);
        BiomeDefaultFeatures::addExtraEmeralds(biomeBuilder);
        BiomeDefaultFeatures::addInfestedStone(biomeBuilder);
        shared_ptr<Music> music = nullptr; // Musics::createGameMusic(SoundEvents::MUSIC_BIOME_STONY_PEAKS);
        return biome(Precipitation::RAIN, BiomeCategory::MOUNTAIN, 1.0F, 0.3F, mobSpawnBuilder, biomeBuilder, music);
    }

    static shared_ptr<Biome> snowySlopes() {
        BiomeGenerationSettings::Builder biomeBuilder;
        MobSpawnSettings::Builder mobSpawnBuilder;
        /*
        mobSpawnBuilder.addSpawn(MobCategory::CREATURE, MobSpawnSettings::SpawnerData(EntityType::RABBIT, 4, 2, 3))
            .addSpawn(MobCategory::CREATURE, MobSpawnSettings::SpawnerData(EntityType::GOAT, 5, 1, 3));
        */
        BiomeDefaultFeatures::commonSpawns(mobSpawnBuilder);
        globalOverworldGeneration(biomeBuilder);
        BiomeDefaultFeatures::addFrozenSprings(biomeBuilder);
        BiomeDefaultFeatures::addDefaultOres(biomeBuilder);
        BiomeDefaultFeatures::addDefaultSoftDisks(biomeBuilder);
        BiomeDefaultFeatures::addDefaultExtraVegetation(biomeBuilder);
        BiomeDefaultFeatures::addExtraEmeralds(biomeBuilder);
        BiomeDefaultFeatures::addInfestedStone(biomeBuilder);
        shared_ptr<Music> music = nullptr; // Musics::createGameMusic(SoundEvents::MUSIC_BIOME_SNOWY_SLOPES);
        return biome(Precipitation::SNOW, BiomeCategory::MOUNTAIN, -0.3F, 0.9F, mobSpawnBuilder, biomeBuilder, music);
    }

    static shared_ptr<Biome> grove() {
        BiomeGenerationSettings::Builder biomeBuilder;
        MobSpawnSettings::Builder mobSpawnBuilder;
        BiomeDefaultFeatures::farmAnimals(mobSpawnBuilder);
        /*
        mobSpawnBuilder.addSpawn(MobCategory::CREATURE, MobSpawnSettings::SpawnerData(EntityType::WOLF, 8, 4, 4))
            .addSpawn(MobCategory::CREATURE, MobSpawnSettings::SpawnerData(EntityType::RABBIT, 4, 2, 3))
            .addSpawn(MobCategory::CREATURE, MobSpawnSettings::SpawnerData(EntityType::FOX, 8, 2, 4));
        */
        BiomeDefaultFeatures::commonSpawns(mobSpawnBuilder);
        globalOverworldGeneration(biomeBuilder);
        BiomeDefaultFeatures::addFrozenSprings(biomeBuilder);
        BiomeDefaultFeatures::addDefaultOres(biomeBuilder);
        BiomeDefaultFeatures::addDefaultSoftDisks(biomeBuilder);
        BiomeDefaultFeatures::addGroveTrees(biomeBuilder);
        BiomeDefaultFeatures::addDefaultExtraVegetation(biomeBuilder);
        BiomeDefaultFeatures::addExtraEmeralds(biomeBuilder);
        BiomeDefaultFeatures::addInfestedStone(biomeBuilder);
        shared_ptr<Music> music = nullptr; // Musics::createGameMusic(SoundEvents::MUSIC_BIOME_GROVE);
        return biome(Precipitation::SNOW, BiomeCategory::FOREST, -0.2F, 0.8F, mobSpawnBuilder, biomeBuilder, music);
    }

    static shared_ptr<Biome> lushCaves() {
        MobSpawnSettings::Builder mobSpawnBuilder;
        /*
        mobSpawnBuilder.addSpawn(MobCategory::AXOLOTLS, MobSpawnSettings::SpawnerData(EntityType::AXOLOTL, 10, 4, 6));
        mobSpawnBuilder.addSpawn(MobCategory::WATER_AMBIENT,
                                 MobSpawnSettings::SpawnerData(EntityType::TROPICAL_FISH, 25, 8, 8));
        */
        BiomeDefaultFeatures::commonSpawns(mobSpawnBuilder);
        BiomeGenerationSettings::Builder biomeBuilder;
        globalOverworldGeneration(biomeBuilder);
        BiomeDefaultFeatures::addPlainGrass(biomeBuilder);
        BiomeDefaultFeatures::addDefaultOres(biomeBuilder);
        BiomeDefaultFeatures::addLushCavesSpecialOres(biomeBuilder);
        BiomeDefaultFeatures::addDefaultSoftDisks(biomeBuilder);
        BiomeDefaultFeatures::addLushCavesVegetationFeatures(biomeBuilder);
        shared_ptr<Music> music = nullptr; // Musics::createGameMusic(SoundEvents::MUSIC_BIOME_LUSH_CAVES);
        return biome(Precipitation::RAIN, BiomeCategory::UNDERGROUND, 0.5F, 0.5F, mobSpawnBuilder, biomeBuilder, music);
    }

    static shared_ptr<Biome> dripstoneCaves() {
        MobSpawnSettings::Builder mobSpawnBuilder;
        BiomeDefaultFeatures::dripstoneCavesSpawns(mobSpawnBuilder);
        BiomeGenerationSettings::Builder biomeBuilder;
        globalOverworldGeneration(biomeBuilder);
        BiomeDefaultFeatures::addPlainGrass(biomeBuilder);
        BiomeDefaultFeatures::addDefaultOres(biomeBuilder, true);
        BiomeDefaultFeatures::addDefaultSoftDisks(biomeBuilder);
        BiomeDefaultFeatures::addPlainVegetation(biomeBuilder);
        BiomeDefaultFeatures::addDefaultMushrooms(biomeBuilder);
        BiomeDefaultFeatures::addDefaultExtraVegetation(biomeBuilder);
        BiomeDefaultFeatures::addDripstone(biomeBuilder);
        shared_ptr<Music> music = nullptr; // Musics::createGameMusic(SoundEvents::MUSIC_BIOME_DRIPSTONE_CAVES);
        return biome(Precipitation::RAIN, BiomeCategory::UNDERGROUND, 0.8F, 0.4F, mobSpawnBuilder, biomeBuilder, music);
    }
};

class BiomeInstances {
public:
    static shared_ptr<Biome> THE_VOID;
    static shared_ptr<Biome> PLAINS;

    static void init();
    static void free();

private:
    static map<Biomes, shared_ptr<Biome>> biomes;

    static shared_ptr<Biome> registerBiome(Biomes biome, shared_ptr<Biome> biomeInstance) {
        biomes.emplace(biome, biomeInstance);
        return biomeInstance;
    }

public:
    static shared_ptr<Biome> get(Biomes biome) {
        auto it = biomes.find(biome);
        return it != biomes.end() ? it->second : nullptr;
    }
};