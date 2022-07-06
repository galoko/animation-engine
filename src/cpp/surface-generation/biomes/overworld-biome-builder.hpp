#pragma once

#include "biomes.hpp"
#include "climate.hpp"

class OverworldBiomeBuilder {
private:
    static constexpr float VALLEY_SIZE = 0.05F;
    static constexpr float LOW_START = 0.26666668F;
    static constexpr float HIGH_START = 0.4F;
    static constexpr float HIGH_END = 0.93333334F;
    static constexpr float PEAK_SIZE = 0.1F;

public:
    static constexpr float PEAK_START = 0.56666666F;

private:
    static constexpr float PEAK_END = 0.7666667F;

public:
    static constexpr float NEAR_INLAND_START = -0.11F;
    static constexpr float MID_INLAND_START = 0.03F;
    static constexpr float FAR_INLAND_START = 0.3F;
    static constexpr float EROSION_INDEX_1_START = -0.78F;
    static constexpr float EROSION_INDEX_2_START = -0.375F;

private:
    Climate::Parameter *FULL_RANGE = Climate::Parameter::span(-1.0F, 1.0F);

    vector<Climate::Parameter *> temperatures = {
        Climate::Parameter::span(-1.0F, -0.45F), Climate::Parameter::span(-0.45F, -0.15F),
        Climate::Parameter::span(-0.15F, 0.2F), Climate::Parameter::span(0.2F, 0.55F),
        Climate::Parameter::span(0.55F, 1.0F)};

    vector<Climate::Parameter *> humidities = {
        Climate::Parameter::span(-1.0F, -0.35F), Climate::Parameter::span(-0.35F, -0.1F),
        Climate::Parameter::span(-0.1F, 0.1F), Climate::Parameter::span(0.1F, 0.3F),
        Climate::Parameter::span(0.3F, 1.0F)};

    Climate::Parameter *erosions[7] = {
        Climate::Parameter::span(-1.0F, -0.78F),     Climate::Parameter::span(-0.78F, -0.375F),
        Climate::Parameter::span(-0.375F, -0.2225F), Climate::Parameter::span(-0.2225F, 0.05F),
        Climate::Parameter::span(0.05F, 0.45F),      Climate::Parameter::span(0.45F, 0.55F),
        Climate::Parameter::span(0.55F, 1.0F)};

    Climate::Parameter *FROZEN_RANGE = temperatures[0];

    Climate::Parameter *UNFROZEN_RANGE = Climate::Parameter::span(temperatures[1], temperatures[4]);

    Climate::Parameter *mushroomFieldsContinentalness = Climate::Parameter::span(-1.2F, -1.05F);
    Climate::Parameter *deepOceanContinentalness = Climate::Parameter::span(-1.05F, -0.455F);
    Climate::Parameter *oceanContinentalness = Climate::Parameter::span(-0.455F, -0.19F);
    Climate::Parameter *coastContinentalness = Climate::Parameter::span(-0.19F, -0.11F);
    Climate::Parameter *inlandContinentalness = Climate::Parameter::span(-0.11F, 0.55F);
    Climate::Parameter *nearInlandContinentalness = Climate::Parameter::span(-0.11F, 0.03F);
    Climate::Parameter *midInlandContinentalness = Climate::Parameter::span(0.03F, 0.3F);
    Climate::Parameter *farInlandContinentalness = Climate::Parameter::span(0.3F, 1.0F);

    Biomes OCEANS[2][5] = {
        {Biomes::DEEP_FROZEN_OCEAN, Biomes::DEEP_COLD_OCEAN, Biomes::DEEP_OCEAN, Biomes::DEEP_LUKEWARM_OCEAN,
         Biomes::WARM_OCEAN},
        {Biomes::FROZEN_OCEAN, Biomes::COLD_OCEAN, Biomes::OCEAN, Biomes::LUKEWARM_OCEAN, Biomes::WARM_OCEAN}};

    Biomes MIDDLE_BIOMES[5][5] = {
        {Biomes::SNOWY_PLAINS, Biomes::SNOWY_PLAINS, Biomes::SNOWY_PLAINS, Biomes::SNOWY_TAIGA, Biomes::TAIGA},
        {Biomes::PLAINS, Biomes::PLAINS, Biomes::FOREST, Biomes::TAIGA, Biomes::OLD_GROWTH_SPRUCE_TAIGA},
        {Biomes::FLOWER_FOREST, Biomes::PLAINS, Biomes::FOREST, Biomes::BIRCH_FOREST, Biomes::DARK_FOREST},
        {Biomes::SAVANNA, Biomes::SAVANNA, Biomes::FOREST, Biomes::JUNGLE, Biomes::JUNGLE},
        {Biomes::DESERT, Biomes::DESERT, Biomes::DESERT, Biomes::DESERT, Biomes::DESERT}};

    Biomes MIDDLE_BIOMES_VARIANT[5][5] = {
        {Biomes::ICE_SPIKES, Biomes::NULL_BIOME, Biomes::SNOWY_TAIGA, Biomes::NULL_BIOME, Biomes::NULL_BIOME},
        {Biomes::NULL_BIOME, Biomes::NULL_BIOME, Biomes::NULL_BIOME, Biomes::NULL_BIOME, Biomes::OLD_GROWTH_PINE_TAIGA},
        {Biomes::SUNFLOWER_PLAINS, Biomes::NULL_BIOME, Biomes::NULL_BIOME, Biomes::OLD_GROWTH_BIRCH_FOREST,
         Biomes::NULL_BIOME},
        {Biomes::NULL_BIOME, Biomes::NULL_BIOME, Biomes::PLAINS, Biomes::SPARSE_JUNGLE, Biomes::BAMBOO_JUNGLE},
        {Biomes::NULL_BIOME, Biomes::NULL_BIOME, Biomes::NULL_BIOME, Biomes::NULL_BIOME, Biomes::NULL_BIOME}};

    Biomes PLATEAU_BIOMES[5][5] = {
        {Biomes::SNOWY_PLAINS, Biomes::SNOWY_PLAINS, Biomes::SNOWY_PLAINS, Biomes::SNOWY_TAIGA, Biomes::SNOWY_TAIGA},
        {Biomes::MEADOW, Biomes::MEADOW, Biomes::FOREST, Biomes::TAIGA, Biomes::OLD_GROWTH_SPRUCE_TAIGA},
        {Biomes::MEADOW, Biomes::MEADOW, Biomes::MEADOW, Biomes::MEADOW, Biomes::DARK_FOREST},
        {Biomes::SAVANNA_PLATEAU, Biomes::SAVANNA_PLATEAU, Biomes::FOREST, Biomes::FOREST, Biomes::JUNGLE},
        {Biomes::BADLANDS, Biomes::BADLANDS, Biomes::BADLANDS, Biomes::WOODED_BADLANDS, Biomes::WOODED_BADLANDS}};

    Biomes PLATEAU_BIOMES_VARIANT[5][5] = {
        {Biomes::ICE_SPIKES, Biomes::NULL_BIOME, Biomes::NULL_BIOME, Biomes::NULL_BIOME, Biomes::NULL_BIOME},
        {Biomes::NULL_BIOME, Biomes::NULL_BIOME, Biomes::MEADOW, Biomes::MEADOW, Biomes::OLD_GROWTH_PINE_TAIGA},
        {Biomes::NULL_BIOME, Biomes::NULL_BIOME, Biomes::FOREST, Biomes::BIRCH_FOREST, Biomes::NULL_BIOME},
        {Biomes::NULL_BIOME, Biomes::NULL_BIOME, Biomes::NULL_BIOME, Biomes::NULL_BIOME, Biomes::NULL_BIOME},
        {Biomes::ERODED_BADLANDS, Biomes::ERODED_BADLANDS, Biomes::NULL_BIOME, Biomes::NULL_BIOME, Biomes::NULL_BIOME}};

    Biomes EXTREME_HILLS[5][5] = {
        {Biomes::WINDSWEPT_GRAVELLY_HILLS, Biomes::WINDSWEPT_GRAVELLY_HILLS, Biomes::WINDSWEPT_HILLS,
         Biomes::WINDSWEPT_FOREST, Biomes::WINDSWEPT_FOREST},
        {Biomes::WINDSWEPT_GRAVELLY_HILLS, Biomes::WINDSWEPT_GRAVELLY_HILLS, Biomes::WINDSWEPT_HILLS,
         Biomes::WINDSWEPT_FOREST, Biomes::WINDSWEPT_FOREST},
        {Biomes::WINDSWEPT_HILLS, Biomes::WINDSWEPT_HILLS, Biomes::WINDSWEPT_HILLS, Biomes::WINDSWEPT_FOREST,
         Biomes::WINDSWEPT_FOREST},
        {Biomes::NULL_BIOME, Biomes::NULL_BIOME, Biomes::NULL_BIOME, Biomes::NULL_BIOME, Biomes::NULL_BIOME},
        {Biomes::NULL_BIOME, Biomes::NULL_BIOME, Biomes::NULL_BIOME, Biomes::NULL_BIOME, Biomes::NULL_BIOME}};

    vector<Climate::ParameterPoint *> *spawnTarget() {
        Climate::Parameter *depth = Climate::Parameter::point(0.0F);
        return new vector<Climate::ParameterPoint *>(
            {new Climate::ParameterPoint(this->FULL_RANGE, this->FULL_RANGE,
                                         Climate::Parameter::span(this->inlandContinentalness, this->FULL_RANGE),
                                         this->FULL_RANGE, depth, Climate::Parameter::span(-1.0F, -0.16F), 0LL),
             new Climate::ParameterPoint(this->FULL_RANGE, this->FULL_RANGE,
                                         Climate::Parameter::span(this->inlandContinentalness, this->FULL_RANGE),
                                         this->FULL_RANGE, depth, Climate::Parameter::span(0.16F, 1.0F), 0LL)});
    }

    // high order methods
public:
    void addBiomes(function<void(pair<Climate::ParameterPoint *, Biomes> *)> biomes) {
        this->addOffCoastBiomes(biomes);
        this->addInlandBiomes(biomes);
        this->addUndergroundBiomes(biomes);
    }

private:
    void addOffCoastBiomes(function<void(pair<Climate::ParameterPoint *, Biomes> *)> biomes) {
        this->addSurfaceBiome(biomes, this->FULL_RANGE, this->FULL_RANGE, this->mushroomFieldsContinentalness,
                              this->FULL_RANGE, this->FULL_RANGE, 0.0F, Biomes::MUSHROOM_FIELDS);

        for (int32_t i = 0; i < this->temperatures.size(); ++i) {
            Climate::Parameter *temperature = this->temperatures.at(i);
            this->addSurfaceBiome(biomes, temperature, this->FULL_RANGE, this->deepOceanContinentalness,
                                  this->FULL_RANGE, this->FULL_RANGE, 0.0F, this->OCEANS[0][i]);
            this->addSurfaceBiome(biomes, temperature, this->FULL_RANGE, this->oceanContinentalness, this->FULL_RANGE,
                                  this->FULL_RANGE, 0.0F, this->OCEANS[1][i]);
        }
    }

    void addInlandBiomes(function<void(pair<Climate::ParameterPoint *, Biomes> *)> biomes) {
        this->addMidSlice(biomes, Climate::Parameter::span(-1.0F, -0.93333334F));
        this->addHighSlice(biomes, Climate::Parameter::span(-0.93333334F, -0.7666667F));
        this->addPeaks(biomes, Climate::Parameter::span(-0.7666667F, -0.56666666F));
        this->addHighSlice(biomes, Climate::Parameter::span(-0.56666666F, -0.4F));
        this->addMidSlice(biomes, Climate::Parameter::span(-0.4F, -0.26666668F));
        this->addLowSlice(biomes, Climate::Parameter::span(-0.26666668F, -0.05F));
        this->addValleys(biomes, Climate::Parameter::span(-0.05F, 0.05F));
        this->addLowSlice(biomes, Climate::Parameter::span(0.05F, 0.26666668F));
        this->addMidSlice(biomes, Climate::Parameter::span(0.26666668F, 0.4F));
        this->addHighSlice(biomes, Climate::Parameter::span(0.4F, 0.56666666F));
        this->addPeaks(biomes, Climate::Parameter::span(0.56666666F, 0.7666667F));
        this->addHighSlice(biomes, Climate::Parameter::span(0.7666667F, 0.93333334F));
        this->addMidSlice(biomes, Climate::Parameter::span(0.93333334F, 1.0F));
    }

    // specific type biomes

    void addPeaks(function<void(pair<Climate::ParameterPoint *, Biomes> *)> biomes, Climate::Parameter *erosion) {
        for (int32_t temperatureIndex = 0; temperatureIndex < this->temperatures.size(); ++temperatureIndex) {
            Climate::Parameter *temperature = this->temperatures.at(temperatureIndex);

            for (int32_t humidityIndex = 0; humidityIndex < this->humidities.size(); ++humidityIndex) {
                Climate::Parameter *humidity = this->humidities[humidityIndex];
                Biomes middleBiome = this->pickMiddleBiome(temperatureIndex, humidityIndex, erosion);
                Biomes middleOrBadlands =
                    this->pickMiddleBiomeOrBadlandsIfHot(temperatureIndex, humidityIndex, erosion);
                Biomes middleOrBadlandsOrSlope =
                    this->pickMiddleBiomeOrBadlandsIfHotOrSlopeIfCold(temperatureIndex, humidityIndex, erosion);
                Biomes plateauBiome = this->pickPlateauBiome(temperatureIndex, humidityIndex, erosion);
                Biomes extremeHillsBiome = this->pickExtremeHillsBiome(temperatureIndex, humidityIndex, erosion);
                Biomes maybeShattered =
                    this->maybePickShatteredBiome(temperatureIndex, humidityIndex, erosion, extremeHillsBiome);
                Biomes peakyBiome = this->pickPeakBiome(temperatureIndex, humidityIndex, erosion);
                this->addSurfaceBiome(
                    biomes, temperature, humidity,
                    Climate::Parameter::span(this->coastContinentalness, this->farInlandContinentalness),
                    this->erosions[0], erosion, 0.0F, peakyBiome);
                this->addSurfaceBiome(
                    biomes, temperature, humidity,
                    Climate::Parameter::span(this->coastContinentalness, this->nearInlandContinentalness),
                    this->erosions[1], erosion, 0.0F, middleOrBadlandsOrSlope);
                this->addSurfaceBiome(
                    biomes, temperature, humidity,
                    Climate::Parameter::span(this->midInlandContinentalness, this->farInlandContinentalness),
                    this->erosions[1], erosion, 0.0F, peakyBiome);
                this->addSurfaceBiome(
                    biomes, temperature, humidity,
                    Climate::Parameter::span(this->coastContinentalness, this->nearInlandContinentalness),
                    Climate::Parameter::span(this->erosions[2], this->erosions[3]), erosion, 0.0F, middleBiome);
                this->addSurfaceBiome(
                    biomes, temperature, humidity,
                    Climate::Parameter::span(this->midInlandContinentalness, this->farInlandContinentalness),
                    this->erosions[2], erosion, 0.0F, plateauBiome);
                this->addSurfaceBiome(biomes, temperature, humidity, this->midInlandContinentalness, this->erosions[3],
                                      erosion, 0.0F, middleOrBadlands);
                this->addSurfaceBiome(biomes, temperature, humidity, this->farInlandContinentalness, this->erosions[3],
                                      erosion, 0.0F, plateauBiome);
                this->addSurfaceBiome(
                    biomes, temperature, humidity,
                    Climate::Parameter::span(this->coastContinentalness, this->farInlandContinentalness),
                    this->erosions[4], erosion, 0.0F, middleBiome);
                this->addSurfaceBiome(
                    biomes, temperature, humidity,
                    Climate::Parameter::span(this->coastContinentalness, this->nearInlandContinentalness),
                    this->erosions[5], erosion, 0.0F, maybeShattered);
                this->addSurfaceBiome(
                    biomes, temperature, humidity,
                    Climate::Parameter::span(this->midInlandContinentalness, this->farInlandContinentalness),
                    this->erosions[5], erosion, 0.0F, extremeHillsBiome);
                this->addSurfaceBiome(
                    biomes, temperature, humidity,
                    Climate::Parameter::span(this->coastContinentalness, this->farInlandContinentalness),
                    this->erosions[6], erosion, 0.0F, middleBiome);
            }
        }
    }

    void addHighSlice(function<void(pair<Climate::ParameterPoint *, Biomes> *)> biomes, Climate::Parameter *erosion) {
        for (int32_t temperatureIndex = 0; temperatureIndex < this->temperatures.size(); ++temperatureIndex) {
            Climate::Parameter *temperature = this->temperatures[temperatureIndex];

            for (int32_t humidityIndex = 0; humidityIndex < this->humidities.size(); ++humidityIndex) {
                Climate::Parameter *humidity = this->humidities[humidityIndex];
                Biomes middleBiome = this->pickMiddleBiome(temperatureIndex, humidityIndex, erosion);
                Biomes middleOrBadlands =
                    this->pickMiddleBiomeOrBadlandsIfHot(temperatureIndex, humidityIndex, erosion);
                Biomes middleOrBadlandsOrSlope =
                    this->pickMiddleBiomeOrBadlandsIfHotOrSlopeIfCold(temperatureIndex, humidityIndex, erosion);
                Biomes plateauBiome = this->pickPlateauBiome(temperatureIndex, humidityIndex, erosion);
                Biomes extremeHillsBiome = this->pickExtremeHillsBiome(temperatureIndex, humidityIndex, erosion);
                Biomes maybeShattered =
                    this->maybePickShatteredBiome(temperatureIndex, humidityIndex, erosion, middleBiome);
                Biomes slopeBiome = this->pickSlopeBiome(temperatureIndex, humidityIndex, erosion);
                Biomes peakyBiome = this->pickPeakBiome(temperatureIndex, humidityIndex, erosion);
                this->addSurfaceBiome(biomes, temperature, humidity, this->coastContinentalness,
                                      Climate::Parameter::span(this->erosions[0], this->erosions[1]), erosion, 0.0F,
                                      middleBiome);
                this->addSurfaceBiome(biomes, temperature, humidity, this->nearInlandContinentalness, this->erosions[0],
                                      erosion, 0.0F, slopeBiome);
                this->addSurfaceBiome(
                    biomes, temperature, humidity,
                    Climate::Parameter::span(this->midInlandContinentalness, this->farInlandContinentalness),
                    this->erosions[0], erosion, 0.0F, peakyBiome);
                this->addSurfaceBiome(biomes, temperature, humidity, this->nearInlandContinentalness, this->erosions[1],
                                      erosion, 0.0F, middleOrBadlandsOrSlope);
                this->addSurfaceBiome(
                    biomes, temperature, humidity,
                    Climate::Parameter::span(this->midInlandContinentalness, this->farInlandContinentalness),
                    this->erosions[1], erosion, 0.0F, slopeBiome);
                this->addSurfaceBiome(
                    biomes, temperature, humidity,
                    Climate::Parameter::span(this->coastContinentalness, this->nearInlandContinentalness),
                    Climate::Parameter::span(this->erosions[2], this->erosions[3]), erosion, 0.0F, middleBiome);
                this->addSurfaceBiome(
                    biomes, temperature, humidity,
                    Climate::Parameter::span(this->midInlandContinentalness, this->farInlandContinentalness),
                    this->erosions[2], erosion, 0.0F, plateauBiome);
                this->addSurfaceBiome(biomes, temperature, humidity, this->midInlandContinentalness, this->erosions[3],
                                      erosion, 0.0F, middleOrBadlands);
                this->addSurfaceBiome(biomes, temperature, humidity, this->farInlandContinentalness, this->erosions[3],
                                      erosion, 0.0F, plateauBiome);
                this->addSurfaceBiome(
                    biomes, temperature, humidity,
                    Climate::Parameter::span(this->coastContinentalness, this->farInlandContinentalness),
                    this->erosions[4], erosion, 0.0F, middleBiome);
                this->addSurfaceBiome(
                    biomes, temperature, humidity,
                    Climate::Parameter::span(this->coastContinentalness, this->nearInlandContinentalness),
                    this->erosions[5], erosion, 0.0F, maybeShattered);
                this->addSurfaceBiome(
                    biomes, temperature, humidity,
                    Climate::Parameter::span(this->midInlandContinentalness, this->farInlandContinentalness),
                    this->erosions[5], erosion, 0.0F, extremeHillsBiome);
                this->addSurfaceBiome(
                    biomes, temperature, humidity,
                    Climate::Parameter::span(this->coastContinentalness, this->farInlandContinentalness),
                    this->erosions[6], erosion, 0.0F, middleBiome);
            }
        }
    }

    void addMidSlice(function<void(pair<Climate::ParameterPoint *, Biomes> *)> biomes, Climate::Parameter *erosion) {
        this->addSurfaceBiome(biomes, this->FULL_RANGE, this->FULL_RANGE, this->coastContinentalness,
                              Climate::Parameter::span(this->erosions[0], this->erosions[2]), erosion, 0.0F,
                              Biomes::STONY_SHORE);
        this->addSurfaceBiome(biomes, this->UNFROZEN_RANGE, this->FULL_RANGE,
                              Climate::Parameter::span(this->nearInlandContinentalness, this->farInlandContinentalness),
                              this->erosions[6], erosion, 0.0F, Biomes::SWAMP);

        for (int32_t temperatureIndex = 0; temperatureIndex < this->temperatures.size(); ++temperatureIndex) {
            Climate::Parameter *temperature = this->temperatures[temperatureIndex];

            for (int32_t humidityIndex = 0; humidityIndex < this->humidities.size(); ++humidityIndex) {
                Climate::Parameter *humidity = this->humidities[humidityIndex];
                Biomes middleBiome = this->pickMiddleBiome(temperatureIndex, humidityIndex, erosion);
                Biomes middleOrBadlands =
                    this->pickMiddleBiomeOrBadlandsIfHot(temperatureIndex, humidityIndex, erosion);
                Biomes middleOrBadlandsOrSlope =
                    this->pickMiddleBiomeOrBadlandsIfHotOrSlopeIfCold(temperatureIndex, humidityIndex, erosion);
                Biomes extremeHillsBiome = this->pickExtremeHillsBiome(temperatureIndex, humidityIndex, erosion);
                Biomes plateauBiome = this->pickPlateauBiome(temperatureIndex, humidityIndex, erosion);
                Biomes beachBiome = this->pickBeachBiome(temperatureIndex, humidityIndex);
                Biomes maybeShattered =
                    this->maybePickShatteredBiome(temperatureIndex, humidityIndex, erosion, middleBiome);
                Biomes shatteredCoastBiome = this->pickShatteredCoastBiome(temperatureIndex, humidityIndex, erosion);
                Biomes slopeBiome = this->pickSlopeBiome(temperatureIndex, humidityIndex, erosion);
                this->addSurfaceBiome(
                    biomes, temperature, humidity,
                    Climate::Parameter::span(this->nearInlandContinentalness, this->farInlandContinentalness),
                    this->erosions[0], erosion, 0.0F, slopeBiome);
                this->addSurfaceBiome(
                    biomes, temperature, humidity,
                    Climate::Parameter::span(this->nearInlandContinentalness, this->midInlandContinentalness),
                    this->erosions[1], erosion, 0.0F, middleOrBadlandsOrSlope);
                this->addSurfaceBiome(biomes, temperature, humidity, this->farInlandContinentalness, this->erosions[1],
                                      erosion, 0.0F, temperatureIndex == 0 ? slopeBiome : plateauBiome);
                this->addSurfaceBiome(biomes, temperature, humidity, this->nearInlandContinentalness, this->erosions[2],
                                      erosion, 0.0F, middleBiome);
                this->addSurfaceBiome(biomes, temperature, humidity, this->midInlandContinentalness, this->erosions[2],
                                      erosion, 0.0F, middleOrBadlands);
                this->addSurfaceBiome(biomes, temperature, humidity, this->farInlandContinentalness, this->erosions[2],
                                      erosion, 0.0F, plateauBiome);
                this->addSurfaceBiome(
                    biomes, temperature, humidity,
                    Climate::Parameter::span(this->coastContinentalness, this->nearInlandContinentalness),
                    this->erosions[3], erosion, 0.0F, middleBiome);
                this->addSurfaceBiome(
                    biomes, temperature, humidity,
                    Climate::Parameter::span(this->midInlandContinentalness, this->farInlandContinentalness),
                    this->erosions[3], erosion, 0.0F, middleOrBadlands);
                if (erosion->max < 0LL) {
                    this->addSurfaceBiome(biomes, temperature, humidity, this->coastContinentalness, this->erosions[4],
                                          erosion, 0.0F, beachBiome);
                    this->addSurfaceBiome(
                        biomes, temperature, humidity,
                        Climate::Parameter::span(this->nearInlandContinentalness, this->farInlandContinentalness),
                        this->erosions[4], erosion, 0.0F, middleBiome);
                } else {
                    this->addSurfaceBiome(
                        biomes, temperature, humidity,
                        Climate::Parameter::span(this->coastContinentalness, this->farInlandContinentalness),
                        this->erosions[4], erosion, 0.0F, middleBiome);
                }

                this->addSurfaceBiome(biomes, temperature, humidity, this->coastContinentalness, this->erosions[5],
                                      erosion, 0.0F, shatteredCoastBiome);
                this->addSurfaceBiome(biomes, temperature, humidity, this->nearInlandContinentalness, this->erosions[5],
                                      erosion, 0.0F, maybeShattered);
                this->addSurfaceBiome(
                    biomes, temperature, humidity,
                    Climate::Parameter::span(this->midInlandContinentalness, this->farInlandContinentalness),
                    this->erosions[5], erosion, 0.0F, extremeHillsBiome);
                if (erosion->max < 0LL) {
                    this->addSurfaceBiome(biomes, temperature, humidity, this->coastContinentalness, this->erosions[6],
                                          erosion, 0.0F, beachBiome);
                } else {
                    this->addSurfaceBiome(biomes, temperature, humidity, this->coastContinentalness, this->erosions[6],
                                          erosion, 0.0F, middleBiome);
                }

                if (temperatureIndex == 0) {
                    this->addSurfaceBiome(
                        biomes, temperature, humidity,
                        Climate::Parameter::span(this->nearInlandContinentalness, this->farInlandContinentalness),
                        this->erosions[6], erosion, 0.0F, middleBiome);
                }
            }
        }
    }

    void addLowSlice(function<void(pair<Climate::ParameterPoint *, Biomes> *)> biomes, Climate::Parameter *erosion) {
        this->addSurfaceBiome(biomes, this->FULL_RANGE, this->FULL_RANGE, this->coastContinentalness,
                              Climate::Parameter::span(this->erosions[0], this->erosions[2]), erosion, 0.0F,
                              Biomes::STONY_SHORE);
        this->addSurfaceBiome(biomes, this->UNFROZEN_RANGE, this->FULL_RANGE,
                              Climate::Parameter::span(this->nearInlandContinentalness, this->farInlandContinentalness),
                              this->erosions[6], erosion, 0.0F, Biomes::SWAMP);

        for (int32_t temperatureIndex = 0; temperatureIndex < this->temperatures.size(); ++temperatureIndex) {
            Climate::Parameter *climate$parameter = this->temperatures[temperatureIndex];

            for (int32_t humidityIndex = 0; humidityIndex < this->humidities.size(); ++humidityIndex) {
                Climate::Parameter *climate$parameter1 = this->humidities[humidityIndex];
                Biomes resourcekey = this->pickMiddleBiome(temperatureIndex, humidityIndex, erosion);
                Biomes resourcekey1 = this->pickMiddleBiomeOrBadlandsIfHot(temperatureIndex, humidityIndex, erosion);
                Biomes resourcekey2 =
                    this->pickMiddleBiomeOrBadlandsIfHotOrSlopeIfCold(temperatureIndex, humidityIndex, erosion);
                Biomes resourcekey3 = this->pickBeachBiome(temperatureIndex, humidityIndex);
                Biomes resourcekey4 =
                    this->maybePickShatteredBiome(temperatureIndex, humidityIndex, erosion, resourcekey);
                Biomes resourcekey5 = this->pickShatteredCoastBiome(temperatureIndex, humidityIndex, erosion);
                this->addSurfaceBiome(biomes, climate$parameter, climate$parameter1, this->nearInlandContinentalness,
                                      Climate::Parameter::span(this->erosions[0], this->erosions[1]), erosion, 0.0F,
                                      resourcekey1);
                this->addSurfaceBiome(
                    biomes, climate$parameter, climate$parameter1,
                    Climate::Parameter::span(this->midInlandContinentalness, this->farInlandContinentalness),
                    Climate::Parameter::span(this->erosions[0], this->erosions[1]), erosion, 0.0F, resourcekey2);
                this->addSurfaceBiome(biomes, climate$parameter, climate$parameter1, this->nearInlandContinentalness,
                                      Climate::Parameter::span(this->erosions[2], this->erosions[3]), erosion, 0.0F,
                                      resourcekey);
                this->addSurfaceBiome(
                    biomes, climate$parameter, climate$parameter1,
                    Climate::Parameter::span(this->midInlandContinentalness, this->farInlandContinentalness),
                    Climate::Parameter::span(this->erosions[2], this->erosions[3]), erosion, 0.0F, resourcekey1);
                this->addSurfaceBiome(biomes, climate$parameter, climate$parameter1, this->coastContinentalness,
                                      Climate::Parameter::span(this->erosions[3], this->erosions[4]), erosion, 0.0F,
                                      resourcekey3);
                this->addSurfaceBiome(
                    biomes, climate$parameter, climate$parameter1,
                    Climate::Parameter::span(this->nearInlandContinentalness, this->farInlandContinentalness),
                    this->erosions[4], erosion, 0.0F, resourcekey);
                this->addSurfaceBiome(biomes, climate$parameter, climate$parameter1, this->coastContinentalness,
                                      this->erosions[5], erosion, 0.0F, resourcekey5);
                this->addSurfaceBiome(biomes, climate$parameter, climate$parameter1, this->nearInlandContinentalness,
                                      this->erosions[5], erosion, 0.0F, resourcekey4);
                this->addSurfaceBiome(
                    biomes, climate$parameter, climate$parameter1,
                    Climate::Parameter::span(this->midInlandContinentalness, this->farInlandContinentalness),
                    this->erosions[5], erosion, 0.0F, resourcekey);
                this->addSurfaceBiome(biomes, climate$parameter, climate$parameter1, this->coastContinentalness,
                                      this->erosions[6], erosion, 0.0F, resourcekey3);
                if (temperatureIndex == 0) {
                    this->addSurfaceBiome(
                        biomes, climate$parameter, climate$parameter1,
                        Climate::Parameter::span(this->nearInlandContinentalness, this->farInlandContinentalness),
                        this->erosions[6], erosion, 0.0F, resourcekey);
                }
            }
        }
    }

    void addValleys(function<void(pair<Climate::ParameterPoint *, Biomes> *)> biomes, Climate::Parameter *erosion) {
        this->addSurfaceBiome(biomes, this->FROZEN_RANGE, this->FULL_RANGE, this->coastContinentalness,
                              Climate::Parameter::span(this->erosions[0], this->erosions[1]), erosion, 0.0F,
                              erosion->max < 0LL ? Biomes::STONY_SHORE : Biomes::FROZEN_RIVER);
        this->addSurfaceBiome(biomes, this->UNFROZEN_RANGE, this->FULL_RANGE, this->coastContinentalness,
                              Climate::Parameter::span(this->erosions[0], this->erosions[1]), erosion, 0.0F,
                              erosion->max < 0LL ? Biomes::STONY_SHORE : Biomes::RIVER);
        this->addSurfaceBiome(biomes, this->FROZEN_RANGE, this->FULL_RANGE, this->nearInlandContinentalness,
                              Climate::Parameter::span(this->erosions[0], this->erosions[1]), erosion, 0.0F,
                              Biomes::FROZEN_RIVER);
        this->addSurfaceBiome(biomes, this->UNFROZEN_RANGE, this->FULL_RANGE, this->nearInlandContinentalness,
                              Climate::Parameter::span(this->erosions[0], this->erosions[1]), erosion, 0.0F,
                              Biomes::RIVER);
        this->addSurfaceBiome(biomes, this->FROZEN_RANGE, this->FULL_RANGE,
                              Climate::Parameter::span(this->coastContinentalness, this->farInlandContinentalness),
                              Climate::Parameter::span(this->erosions[2], this->erosions[5]), erosion, 0.0F,
                              Biomes::FROZEN_RIVER);
        this->addSurfaceBiome(biomes, this->UNFROZEN_RANGE, this->FULL_RANGE,
                              Climate::Parameter::span(this->coastContinentalness, this->farInlandContinentalness),
                              Climate::Parameter::span(this->erosions[2], this->erosions[5]), erosion, 0.0F,
                              Biomes::RIVER);
        this->addSurfaceBiome(biomes, this->FROZEN_RANGE, this->FULL_RANGE, this->coastContinentalness,
                              this->erosions[6], erosion, 0.0F, Biomes::FROZEN_RIVER);
        this->addSurfaceBiome(biomes, this->UNFROZEN_RANGE, this->FULL_RANGE, this->coastContinentalness,
                              this->erosions[6], erosion, 0.0F, Biomes::RIVER);
        this->addSurfaceBiome(biomes, this->UNFROZEN_RANGE, this->FULL_RANGE,
                              Climate::Parameter::span(this->inlandContinentalness, this->farInlandContinentalness),
                              this->erosions[6], erosion, 0.0F, Biomes::SWAMP);
        this->addSurfaceBiome(biomes, this->FROZEN_RANGE, this->FULL_RANGE,
                              Climate::Parameter::span(this->inlandContinentalness, this->farInlandContinentalness),
                              this->erosions[6], erosion, 0.0F, Biomes::FROZEN_RIVER);

        for (int32_t i = 0; i < this->temperatures.size(); ++i) {
            Climate::Parameter *temperature = this->temperatures[i];

            for (int32_t j = 0; j < this->humidities.size(); ++j) {
                Climate::Parameter *humidity = this->humidities[j];
                Biomes resourcekey = this->pickMiddleBiomeOrBadlandsIfHot(i, j, erosion);
                this->addSurfaceBiome(
                    biomes, temperature, humidity,
                    Climate::Parameter::span(this->midInlandContinentalness, this->farInlandContinentalness),
                    Climate::Parameter::span(this->erosions[0], this->erosions[1]), erosion, 0.0F, resourcekey);
            }
        }
    }

    void addUndergroundBiomes(function<void(pair<Climate::ParameterPoint *, Biomes> *)> biomes) {
        this->addUndergroundBiome(biomes, this->FULL_RANGE, this->FULL_RANGE, Climate::Parameter::span(0.8F, 1.0F),
                                  this->FULL_RANGE, this->FULL_RANGE, 0.0F, Biomes::DRIPSTONE_CAVES);
        this->addUndergroundBiome(biomes, this->FULL_RANGE, Climate::Parameter::span(0.7F, 1.0F), this->FULL_RANGE,
                                  this->FULL_RANGE, this->FULL_RANGE, 0.0F, Biomes::LUSH_CAVES);
    }

    // biome pickers

    Biomes pickMiddleBiome(int32_t temperatureIndex, int32_t humidityIndex, Climate::Parameter *weirdness) {
        if (weirdness->max < 0LL) {
            return this->MIDDLE_BIOMES[temperatureIndex][humidityIndex];
        } else {
            Biomes biome = this->MIDDLE_BIOMES_VARIANT[temperatureIndex][humidityIndex];
            return biome == Biomes::NULL_BIOME ? this->MIDDLE_BIOMES[temperatureIndex][humidityIndex] : biome;
        }
    }

    Biomes pickMiddleBiomeOrBadlandsIfHot(int32_t temperatureIndex, int32_t humidityIndex,
                                          Climate::Parameter *weirdness) {
        return temperatureIndex == 4 ? this->pickBadlandsBiome(humidityIndex, weirdness)
                                     : this->pickMiddleBiome(temperatureIndex, humidityIndex, weirdness);
    }

    Biomes pickMiddleBiomeOrBadlandsIfHotOrSlopeIfCold(int32_t temperatureIndex, int32_t humidityIndex,
                                                       Climate::Parameter *weirdness) {
        return temperatureIndex == 0 ? this->pickSlopeBiome(temperatureIndex, humidityIndex, weirdness)
                                     : this->pickMiddleBiomeOrBadlandsIfHot(temperatureIndex, humidityIndex, weirdness);
    }

    Biomes maybePickShatteredBiome(int32_t temperatureIndex, int32_t humidityIndex, Climate::Parameter *erosion,
                                   Biomes defaultBiome) {
        return temperatureIndex > 1 && humidityIndex < 4 && erosion->max >= 0LL ? Biomes::WINDSWEPT_SAVANNA
                                                                                : defaultBiome;
    }

    Biomes pickShatteredCoastBiome(int32_t temperatureIndex, int32_t humidityIndex, Climate::Parameter *erosion) {
        Biomes biome = erosion->max >= 0LL ? this->pickMiddleBiome(temperatureIndex, humidityIndex, erosion)
                                           : this->pickBeachBiome(temperatureIndex, humidityIndex);
        return this->maybePickShatteredBiome(temperatureIndex, humidityIndex, erosion, biome);
    }

    Biomes pickBeachBiome(int32_t temperatureIndex, int32_t humidityIndex) {
        if (temperatureIndex == 0) {
            return Biomes::SNOWY_BEACH;
        } else {
            return temperatureIndex == 4 ? Biomes::DESERT : Biomes::BEACH;
        }
    }

    Biomes pickBadlandsBiome(int32_t humidityIndex, Climate::Parameter *erosion) {
        if (humidityIndex < 2) {
            return erosion->max < 0LL ? Biomes::ERODED_BADLANDS : Biomes::BADLANDS;
        } else {
            return humidityIndex < 3 ? Biomes::BADLANDS : Biomes::WOODED_BADLANDS;
        }
    }

    Biomes pickPlateauBiome(int32_t temperatureIndex, int32_t humidityIndex, Climate::Parameter *erosion) {
        if (erosion->max < 0LL) {
            return this->PLATEAU_BIOMES[temperatureIndex][humidityIndex];
        } else {
            Biomes biome = this->PLATEAU_BIOMES_VARIANT[temperatureIndex][humidityIndex];
            return biome == Biomes::NULL_BIOME ? this->PLATEAU_BIOMES[temperatureIndex][humidityIndex] : biome;
        }
    }

    Biomes pickPeakBiome(int32_t temperatureIndex, int32_t humidityIndex, Climate::Parameter *erosion) {
        if (temperatureIndex <= 2) {
            return erosion->max < 0LL ? Biomes::JAGGED_PEAKS : Biomes::FROZEN_PEAKS;
        } else {
            return temperatureIndex == 3 ? Biomes::STONY_PEAKS : this->pickBadlandsBiome(humidityIndex, erosion);
        }
    }

    Biomes pickSlopeBiome(int32_t temperatureIndex, int32_t humidityIndex, Climate::Parameter *erosion) {
        if (temperatureIndex >= 3) {
            return this->pickPlateauBiome(temperatureIndex, humidityIndex, erosion);
        } else {
            return humidityIndex <= 1 ? Biomes::SNOWY_SLOPES : Biomes::GROVE;
        }
    }

    Biomes pickExtremeHillsBiome(int32_t temperatureIndex, int32_t humidityIndex, Climate::Parameter *erosion) {
        Biomes biome = this->EXTREME_HILLS[temperatureIndex][humidityIndex];
        return biome == Biomes::NULL_BIOME ? this->pickMiddleBiome(temperatureIndex, humidityIndex, erosion) : biome;
    }

    // push result

    void addSurfaceBiome(function<void(pair<Climate::ParameterPoint *, Biomes> *)> biomes,
                         Climate::Parameter *temperature, Climate::Parameter *humidity,
                         Climate::Parameter *continentalness, Climate::Parameter *erosion,
                         Climate::Parameter *currentErrosion, float offset, Biomes biome) {
        biomes(new pair(Climate::parameters(temperature, humidity, continentalness, erosion,
                                            Climate::Parameter::point(0.0F), currentErrosion, offset),
                        biome));
        biomes(new pair(Climate::parameters(temperature, humidity, continentalness, erosion,
                                            Climate::Parameter::point(1.0F), currentErrosion, offset),
                        biome));
    }

    void addUndergroundBiome(function<void(pair<Climate::ParameterPoint *, Biomes> *)> biomes,
                             Climate::Parameter *temperature, Climate::Parameter *humidity,
                             Climate::Parameter *continentalness, Climate::Parameter *erosion,
                             Climate::Parameter *currentErrosion, float offset, Biomes biome) {
        biomes(new pair(Climate::parameters(temperature, humidity, continentalness, erosion,
                                            Climate::Parameter::span(0.2F, 0.9F), currentErrosion, offset),
                        biome));
    }
};