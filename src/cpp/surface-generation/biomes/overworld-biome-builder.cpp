#include "overworld-biome-builder.hpp"

// OverworldBiomeBuilder

void OverworldBiomeBuilder::addBiomes(function<void(pair<Climate::ParameterPoint *, Biomes> *)> biomes) {
    this->addOffCoastBiomes(biomes);
    this->addInlandBiomes(biomes);
    this->addUndergroundBiomes(biomes);
}

void OverworldBiomeBuilder::addOffCoastBiomes(function<void(pair<Climate::ParameterPoint *, Biomes> *)> biomes) {
    this->addSurfaceBiome(biomes, this->FULL_RANGE, this->FULL_RANGE, this->mushroomFieldsContinentalness,
                          this->FULL_RANGE, this->FULL_RANGE, 0.0F, Biomes::MUSHROOM_FIELDS);

    for (int32_t i = 0; i < this->temperatures.size(); ++i) {
        Climate::Parameter *temperature = this->temperatures.at(i);
        this->addSurfaceBiome(biomes, temperature, this->FULL_RANGE, this->deepOceanContinentalness, this->FULL_RANGE,
                              this->FULL_RANGE, 0.0F, this->OCEANS[0][i]);
        this->addSurfaceBiome(biomes, temperature, this->FULL_RANGE, this->oceanContinentalness, this->FULL_RANGE,
                              this->FULL_RANGE, 0.0F, this->OCEANS[1][i]);
    }
}

void OverworldBiomeBuilder::addInlandBiomes(function<void(pair<Climate::ParameterPoint *, Biomes> *)> biomes) {
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

void OverworldBiomeBuilder::addPeaks(function<void(pair<Climate::ParameterPoint *, Biomes> *)> biomes,
                                     Climate::Parameter *erosion) {
    for (int32_t temperatureIndex = 0; temperatureIndex < this->temperatures.size(); ++temperatureIndex) {
        Climate::Parameter *temperature = this->temperatures.at(temperatureIndex);

        for (int32_t humidityIndex = 0; humidityIndex < this->humidities.size(); ++humidityIndex) {
            Climate::Parameter *humidity = this->humidities[humidityIndex];
            Biomes middleBiome = this->pickMiddleBiome(temperatureIndex, humidityIndex, erosion);
            Biomes middleOrBadlands = this->pickMiddleBiomeOrBadlandsIfHot(temperatureIndex, humidityIndex, erosion);
            Biomes middleOrBadlandsOrSlope =
                this->pickMiddleBiomeOrBadlandsIfHotOrSlopeIfCold(temperatureIndex, humidityIndex, erosion);
            Biomes plateauBiome = this->pickPlateauBiome(temperatureIndex, humidityIndex, erosion);
            Biomes extremeHillsBiome = this->pickExtremeHillsBiome(temperatureIndex, humidityIndex, erosion);
            Biomes maybeShattered =
                this->maybePickShatteredBiome(temperatureIndex, humidityIndex, erosion, extremeHillsBiome);
            Biomes peakyBiome = this->pickPeakBiome(temperatureIndex, humidityIndex, erosion);
            this->addSurfaceBiome(biomes, temperature, humidity,
                                  Climate::Parameter::span(this->coastContinentalness, this->farInlandContinentalness),
                                  this->erosions[0], erosion, 0.0F, peakyBiome);
            this->addSurfaceBiome(biomes, temperature, humidity,
                                  Climate::Parameter::span(this->coastContinentalness, this->nearInlandContinentalness),
                                  this->erosions[1], erosion, 0.0F, middleOrBadlandsOrSlope);
            this->addSurfaceBiome(
                biomes, temperature, humidity,
                Climate::Parameter::span(this->midInlandContinentalness, this->farInlandContinentalness),
                this->erosions[1], erosion, 0.0F, peakyBiome);
            this->addSurfaceBiome(biomes, temperature, humidity,
                                  Climate::Parameter::span(this->coastContinentalness, this->nearInlandContinentalness),
                                  Climate::Parameter::span(this->erosions[2], this->erosions[3]), erosion, 0.0F,
                                  middleBiome);
            this->addSurfaceBiome(
                biomes, temperature, humidity,
                Climate::Parameter::span(this->midInlandContinentalness, this->farInlandContinentalness),
                this->erosions[2], erosion, 0.0F, plateauBiome);
            this->addSurfaceBiome(biomes, temperature, humidity, this->midInlandContinentalness, this->erosions[3],
                                  erosion, 0.0F, middleOrBadlands);
            this->addSurfaceBiome(biomes, temperature, humidity, this->farInlandContinentalness, this->erosions[3],
                                  erosion, 0.0F, plateauBiome);
            this->addSurfaceBiome(biomes, temperature, humidity,
                                  Climate::Parameter::span(this->coastContinentalness, this->farInlandContinentalness),
                                  this->erosions[4], erosion, 0.0F, middleBiome);
            this->addSurfaceBiome(biomes, temperature, humidity,
                                  Climate::Parameter::span(this->coastContinentalness, this->nearInlandContinentalness),
                                  this->erosions[5], erosion, 0.0F, maybeShattered);
            this->addSurfaceBiome(
                biomes, temperature, humidity,
                Climate::Parameter::span(this->midInlandContinentalness, this->farInlandContinentalness),
                this->erosions[5], erosion, 0.0F, extremeHillsBiome);
            this->addSurfaceBiome(biomes, temperature, humidity,
                                  Climate::Parameter::span(this->coastContinentalness, this->farInlandContinentalness),
                                  this->erosions[6], erosion, 0.0F, middleBiome);
        }
    }
}

void OverworldBiomeBuilder::addHighSlice(function<void(pair<Climate::ParameterPoint *, Biomes> *)> biomes,
                                         Climate::Parameter *erosion) {
    for (int32_t temperatureIndex = 0; temperatureIndex < this->temperatures.size(); ++temperatureIndex) {
        Climate::Parameter *temperature = this->temperatures[temperatureIndex];

        for (int32_t humidityIndex = 0; humidityIndex < this->humidities.size(); ++humidityIndex) {
            Climate::Parameter *humidity = this->humidities[humidityIndex];
            Biomes middleBiome = this->pickMiddleBiome(temperatureIndex, humidityIndex, erosion);
            Biomes middleOrBadlands = this->pickMiddleBiomeOrBadlandsIfHot(temperatureIndex, humidityIndex, erosion);
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
            this->addSurfaceBiome(biomes, temperature, humidity,
                                  Climate::Parameter::span(this->coastContinentalness, this->nearInlandContinentalness),
                                  Climate::Parameter::span(this->erosions[2], this->erosions[3]), erosion, 0.0F,
                                  middleBiome);
            this->addSurfaceBiome(
                biomes, temperature, humidity,
                Climate::Parameter::span(this->midInlandContinentalness, this->farInlandContinentalness),
                this->erosions[2], erosion, 0.0F, plateauBiome);
            this->addSurfaceBiome(biomes, temperature, humidity, this->midInlandContinentalness, this->erosions[3],
                                  erosion, 0.0F, middleOrBadlands);
            this->addSurfaceBiome(biomes, temperature, humidity, this->farInlandContinentalness, this->erosions[3],
                                  erosion, 0.0F, plateauBiome);
            this->addSurfaceBiome(biomes, temperature, humidity,
                                  Climate::Parameter::span(this->coastContinentalness, this->farInlandContinentalness),
                                  this->erosions[4], erosion, 0.0F, middleBiome);
            this->addSurfaceBiome(biomes, temperature, humidity,
                                  Climate::Parameter::span(this->coastContinentalness, this->nearInlandContinentalness),
                                  this->erosions[5], erosion, 0.0F, maybeShattered);
            this->addSurfaceBiome(
                biomes, temperature, humidity,
                Climate::Parameter::span(this->midInlandContinentalness, this->farInlandContinentalness),
                this->erosions[5], erosion, 0.0F, extremeHillsBiome);
            this->addSurfaceBiome(biomes, temperature, humidity,
                                  Climate::Parameter::span(this->coastContinentalness, this->farInlandContinentalness),
                                  this->erosions[6], erosion, 0.0F, middleBiome);
        }
    }
}

void OverworldBiomeBuilder::addMidSlice(function<void(pair<Climate::ParameterPoint *, Biomes> *)> biomes,
                                        Climate::Parameter *erosion) {
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
            Biomes middleOrBadlands = this->pickMiddleBiomeOrBadlandsIfHot(temperatureIndex, humidityIndex, erosion);
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
            this->addSurfaceBiome(biomes, temperature, humidity,
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

            this->addSurfaceBiome(biomes, temperature, humidity, this->coastContinentalness, this->erosions[5], erosion,
                                  0.0F, shatteredCoastBiome);
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

void OverworldBiomeBuilder::addLowSlice(function<void(pair<Climate::ParameterPoint *, Biomes> *)> biomes,
                                        Climate::Parameter *erosion) {
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
            Biomes resourcekey4 = this->maybePickShatteredBiome(temperatureIndex, humidityIndex, erosion, resourcekey);
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

void OverworldBiomeBuilder::addValleys(function<void(pair<Climate::ParameterPoint *, Biomes> *)> biomes,
                                       Climate::Parameter *erosion) {
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
                          Climate::Parameter::span(this->erosions[0], this->erosions[1]), erosion, 0.0F, Biomes::RIVER);
    this->addSurfaceBiome(biomes, this->FROZEN_RANGE, this->FULL_RANGE,
                          Climate::Parameter::span(this->coastContinentalness, this->farInlandContinentalness),
                          Climate::Parameter::span(this->erosions[2], this->erosions[5]), erosion, 0.0F,
                          Biomes::FROZEN_RIVER);
    this->addSurfaceBiome(biomes, this->UNFROZEN_RANGE, this->FULL_RANGE,
                          Climate::Parameter::span(this->coastContinentalness, this->farInlandContinentalness),
                          Climate::Parameter::span(this->erosions[2], this->erosions[5]), erosion, 0.0F, Biomes::RIVER);
    this->addSurfaceBiome(biomes, this->FROZEN_RANGE, this->FULL_RANGE, this->coastContinentalness, this->erosions[6],
                          erosion, 0.0F, Biomes::FROZEN_RIVER);
    this->addSurfaceBiome(biomes, this->UNFROZEN_RANGE, this->FULL_RANGE, this->coastContinentalness, this->erosions[6],
                          erosion, 0.0F, Biomes::RIVER);
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

void OverworldBiomeBuilder::addUndergroundBiomes(function<void(pair<Climate::ParameterPoint *, Biomes> *)> biomes) {
    this->addUndergroundBiome(biomes, this->FULL_RANGE, this->FULL_RANGE, Climate::Parameter::span(0.8F, 1.0F),
                              this->FULL_RANGE, this->FULL_RANGE, 0.0F, Biomes::DRIPSTONE_CAVES);
    this->addUndergroundBiome(biomes, this->FULL_RANGE, Climate::Parameter::span(0.7F, 1.0F), this->FULL_RANGE,
                              this->FULL_RANGE, this->FULL_RANGE, 0.0F, Biomes::LUSH_CAVES);
}

// biome pickers

Biomes OverworldBiomeBuilder::pickMiddleBiome(int32_t temperatureIndex, int32_t humidityIndex,
                                              Climate::Parameter *weirdness) {
    if (weirdness->max < 0LL) {
        return this->MIDDLE_BIOMES[temperatureIndex][humidityIndex];
    } else {
        Biomes biome = this->MIDDLE_BIOMES_VARIANT[temperatureIndex][humidityIndex];
        return biome == Biomes::NULL_BIOME ? this->MIDDLE_BIOMES[temperatureIndex][humidityIndex] : biome;
    }
}

Biomes OverworldBiomeBuilder::pickMiddleBiomeOrBadlandsIfHot(int32_t temperatureIndex, int32_t humidityIndex,
                                                             Climate::Parameter *weirdness) {
    return temperatureIndex == 4 ? this->pickBadlandsBiome(humidityIndex, weirdness)
                                 : this->pickMiddleBiome(temperatureIndex, humidityIndex, weirdness);
}

Biomes OverworldBiomeBuilder::pickMiddleBiomeOrBadlandsIfHotOrSlopeIfCold(int32_t temperatureIndex,
                                                                          int32_t humidityIndex,
                                                                          Climate::Parameter *weirdness) {
    return temperatureIndex == 0 ? this->pickSlopeBiome(temperatureIndex, humidityIndex, weirdness)
                                 : this->pickMiddleBiomeOrBadlandsIfHot(temperatureIndex, humidityIndex, weirdness);
}

Biomes OverworldBiomeBuilder::maybePickShatteredBiome(int32_t temperatureIndex, int32_t humidityIndex,
                                                      Climate::Parameter *erosion, Biomes defaultBiome) {
    return temperatureIndex > 1 && humidityIndex < 4 && erosion->max >= 0LL ? Biomes::WINDSWEPT_SAVANNA : defaultBiome;
}

Biomes OverworldBiomeBuilder::pickShatteredCoastBiome(int32_t temperatureIndex, int32_t humidityIndex,
                                                      Climate::Parameter *erosion) {
    Biomes biome = erosion->max >= 0LL ? this->pickMiddleBiome(temperatureIndex, humidityIndex, erosion)
                                       : this->pickBeachBiome(temperatureIndex, humidityIndex);
    return this->maybePickShatteredBiome(temperatureIndex, humidityIndex, erosion, biome);
}

Biomes OverworldBiomeBuilder::pickBeachBiome(int32_t temperatureIndex, int32_t humidityIndex) {
    if (temperatureIndex == 0) {
        return Biomes::SNOWY_BEACH;
    } else {
        return temperatureIndex == 4 ? Biomes::DESERT : Biomes::BEACH;
    }
}

Biomes OverworldBiomeBuilder::pickBadlandsBiome(int32_t humidityIndex, Climate::Parameter *erosion) {
    if (humidityIndex < 2) {
        return erosion->max < 0LL ? Biomes::ERODED_BADLANDS : Biomes::BADLANDS;
    } else {
        return humidityIndex < 3 ? Biomes::BADLANDS : Biomes::WOODED_BADLANDS;
    }
}

Biomes OverworldBiomeBuilder::pickPlateauBiome(int32_t temperatureIndex, int32_t humidityIndex,
                                               Climate::Parameter *erosion) {
    if (erosion->max < 0LL) {
        return this->PLATEAU_BIOMES[temperatureIndex][humidityIndex];
    } else {
        Biomes biome = this->PLATEAU_BIOMES_VARIANT[temperatureIndex][humidityIndex];
        return biome == Biomes::NULL_BIOME ? this->PLATEAU_BIOMES[temperatureIndex][humidityIndex] : biome;
    }
}

Biomes OverworldBiomeBuilder::pickPeakBiome(int32_t temperatureIndex, int32_t humidityIndex,
                                            Climate::Parameter *erosion) {
    if (temperatureIndex <= 2) {
        return erosion->max < 0LL ? Biomes::JAGGED_PEAKS : Biomes::FROZEN_PEAKS;
    } else {
        return temperatureIndex == 3 ? Biomes::STONY_PEAKS : this->pickBadlandsBiome(humidityIndex, erosion);
    }
}

Biomes OverworldBiomeBuilder::pickSlopeBiome(int32_t temperatureIndex, int32_t humidityIndex,
                                             Climate::Parameter *erosion) {
    if (temperatureIndex >= 3) {
        return this->pickPlateauBiome(temperatureIndex, humidityIndex, erosion);
    } else {
        return humidityIndex <= 1 ? Biomes::SNOWY_SLOPES : Biomes::GROVE;
    }
}

Biomes OverworldBiomeBuilder::pickExtremeHillsBiome(int32_t temperatureIndex, int32_t humidityIndex,
                                                    Climate::Parameter *erosion) {
    Biomes biome = this->EXTREME_HILLS[temperatureIndex][humidityIndex];
    return biome == Biomes::NULL_BIOME ? this->pickMiddleBiome(temperatureIndex, humidityIndex, erosion) : biome;
}

// push result

void OverworldBiomeBuilder::addSurfaceBiome(function<void(pair<Climate::ParameterPoint *, Biomes> *)> biomes,
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

void OverworldBiomeBuilder::addUndergroundBiome(function<void(pair<Climate::ParameterPoint *, Biomes> *)> biomes,
                                                Climate::Parameter *temperature, Climate::Parameter *humidity,
                                                Climate::Parameter *continentalness, Climate::Parameter *erosion,
                                                Climate::Parameter *currentErrosion, float offset, Biomes biome) {
    biomes(new pair(Climate::parameters(temperature, humidity, continentalness, erosion,
                                        Climate::Parameter::span(0.2F, 0.9F), currentErrosion, offset),
                    biome));
}