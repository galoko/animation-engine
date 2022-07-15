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
    void addBiomes(function<void(pair<Climate::ParameterPoint *, Biomes> *)> biomes);

private:
    void addOffCoastBiomes(function<void(pair<Climate::ParameterPoint *, Biomes> *)> biomes);
    void addInlandBiomes(function<void(pair<Climate::ParameterPoint *, Biomes> *)> biomes);

    // specific type biomes

    void addPeaks(function<void(pair<Climate::ParameterPoint *, Biomes> *)> biomes, Climate::Parameter *erosion);
    void addHighSlice(function<void(pair<Climate::ParameterPoint *, Biomes> *)> biomes, Climate::Parameter *erosion);
    void addMidSlice(function<void(pair<Climate::ParameterPoint *, Biomes> *)> biomes, Climate::Parameter *erosion);
    void addLowSlice(function<void(pair<Climate::ParameterPoint *, Biomes> *)> biomes, Climate::Parameter *erosion);
    void addValleys(function<void(pair<Climate::ParameterPoint *, Biomes> *)> biomes, Climate::Parameter *erosion);
    void addUndergroundBiomes(function<void(pair<Climate::ParameterPoint *, Biomes> *)> biomes);

    // biome pickers

    Biomes pickMiddleBiome(int32_t temperatureIndex, int32_t humidityIndex, Climate::Parameter *weirdness);
    Biomes pickMiddleBiomeOrBadlandsIfHot(int32_t temperatureIndex, int32_t humidityIndex,
                                          Climate::Parameter *weirdness);
    Biomes pickMiddleBiomeOrBadlandsIfHotOrSlopeIfCold(int32_t temperatureIndex, int32_t humidityIndex,
                                                       Climate::Parameter *weirdness);
    Biomes maybePickShatteredBiome(int32_t temperatureIndex, int32_t humidityIndex, Climate::Parameter *erosion,
                                   Biomes defaultBiome);
    Biomes pickShatteredCoastBiome(int32_t temperatureIndex, int32_t humidityIndex, Climate::Parameter *erosion);
    Biomes pickBeachBiome(int32_t temperatureIndex, int32_t humidityIndex);
    Biomes pickBadlandsBiome(int32_t humidityIndex, Climate::Parameter *erosion);
    Biomes pickPlateauBiome(int32_t temperatureIndex, int32_t humidityIndex, Climate::Parameter *erosion);
    Biomes pickPeakBiome(int32_t temperatureIndex, int32_t humidityIndex, Climate::Parameter *erosion);
    Biomes pickSlopeBiome(int32_t temperatureIndex, int32_t humidityIndex, Climate::Parameter *erosion);
    Biomes pickExtremeHillsBiome(int32_t temperatureIndex, int32_t humidityIndex, Climate::Parameter *erosion);

    // push result

    void addSurfaceBiome(function<void(pair<Climate::ParameterPoint *, Biomes> *)> biomes,
                         Climate::Parameter *temperature, Climate::Parameter *humidity,
                         Climate::Parameter *continentalness, Climate::Parameter *erosion,
                         Climate::Parameter *currentErrosion, float offset, Biomes biome);
    void addUndergroundBiome(function<void(pair<Climate::ParameterPoint *, Biomes> *)> biomes,
                             Climate::Parameter *temperature, Climate::Parameter *humidity,
                             Climate::Parameter *continentalness, Climate::Parameter *erosion,
                             Climate::Parameter *currentErrosion, float offset, Biomes biome);
};