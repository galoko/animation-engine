import { Biomes } from "./biomes"
import * as Climate from "./climate"
import { Pair } from "./consumer"

const VALLEY_SIZE = 0.05
const LOW_START = 0.26666668
const HIGH_START = 0.4
const HIGH_END = 0.93333334
const PEAK_SIZE = 0.1
const PEAK_START = 0.56666666
const PEAK_END = 0.7666667
const NEAR_INLAND_START = -0.11
const MID_INLAND_START = 0.03
const FAR_INLAND_START = 0.3
const EROSION_INDEX_1_START = -0.78
const EROSION_INDEX_2_START = -0.375

const FULL_RANGE = Climate.Parameter.span(-1, 1)

const temperatures = [
    Climate.Parameter.span(-1.0, -0.45),
    Climate.Parameter.span(-0.45, -0.15),
    Climate.Parameter.span(-0.15, 0.2),
    Climate.Parameter.span(0.2, 0.55),
    Climate.Parameter.span(0.55, 1.0),
]

const humidities = [
    Climate.Parameter.span(-1.0, -0.35),
    Climate.Parameter.span(-0.35, -PEAK_SIZE),
    Climate.Parameter.span(-PEAK_SIZE, PEAK_SIZE),
    Climate.Parameter.span(PEAK_SIZE, FAR_INLAND_START),
    Climate.Parameter.span(FAR_INLAND_START, 1.0),
]

const erosions = [
    Climate.Parameter.span(-1.0, EROSION_INDEX_1_START),
    Climate.Parameter.span(EROSION_INDEX_1_START, EROSION_INDEX_2_START),
    Climate.Parameter.span(EROSION_INDEX_2_START, -0.2225),
    Climate.Parameter.span(-0.2225, VALLEY_SIZE),
    Climate.Parameter.span(VALLEY_SIZE, 0.45),
    Climate.Parameter.span(0.45, 0.55),
    Climate.Parameter.span(0.55, 1.0),
]

const FROZEN_RANGE = temperatures[0]
const UNFROZEN_RANGE = Climate.Parameter.span(temperatures[1], temperatures[4])
const mushroomFieldsContinentalness = Climate.Parameter.span(-1.2, -1.05)
const deepOceanContinentalness = Climate.Parameter.span(-1.05, -0.455)
const oceanContinentalness = Climate.Parameter.span(-0.455, -0.19)
const coastContinentalness = Climate.Parameter.span(-0.19, NEAR_INLAND_START)
const inlandContinentalness = Climate.Parameter.span(NEAR_INLAND_START, 0.55)
const nearInlandContinentalness = Climate.Parameter.span(NEAR_INLAND_START, MID_INLAND_START)
const midInlandContinentalness = Climate.Parameter.span(MID_INLAND_START, FAR_INLAND_START)
const farInlandContinentalness = Climate.Parameter.span(FAR_INLAND_START, 1.0)

const OCEANS = [
    [
        Biomes.DEEP_FROZEN_OCEAN,
        Biomes.DEEP_COLD_OCEAN,
        Biomes.DEEP_OCEAN,
        Biomes.DEEP_LUKEWARM_OCEAN,
        Biomes.WARM_OCEAN,
    ],
    [
        Biomes.FROZEN_OCEAN,
        Biomes.COLD_OCEAN,
        Biomes.OCEAN,
        Biomes.LUKEWARM_OCEAN,
        Biomes.WARM_OCEAN,
    ],
]

const MIDDLE_BIOMES = [
    [
        Biomes.SNOWY_PLAINS,
        Biomes.SNOWY_PLAINS,
        Biomes.SNOWY_PLAINS,
        Biomes.SNOWY_TAIGA,
        Biomes.TAIGA,
    ],
    [Biomes.PLAINS, Biomes.PLAINS, Biomes.FOREST, Biomes.TAIGA, Biomes.OLD_GROWTH_SPRUCE_TAIGA],
    [Biomes.FLOWER_FOREST, Biomes.PLAINS, Biomes.FOREST, Biomes.BIRCH_FOREST, Biomes.DARK_FOREST],
    [Biomes.SAVANNA, Biomes.SAVANNA, Biomes.FOREST, Biomes.JUNGLE, Biomes.JUNGLE],
    [Biomes.DESERT, Biomes.DESERT, Biomes.DESERT, Biomes.DESERT, Biomes.DESERT],
]

const MIDDLE_BIOMES_VARIANT = [
    [Biomes.ICE_SPIKES, null, Biomes.SNOWY_TAIGA, null, null],
    [null, null, null, null, Biomes.OLD_GROWTH_PINE_TAIGA],
    [Biomes.SUNFLOWER_PLAINS, null, null, Biomes.OLD_GROWTH_BIRCH_FOREST, null],
    [null, null, Biomes.PLAINS, Biomes.SPARSE_JUNGLE, Biomes.BAMBOO_JUNGLE],
    [null, null, null, null, null],
]

const PLATEAU_BIOMES = [
    [
        Biomes.SNOWY_PLAINS,
        Biomes.SNOWY_PLAINS,
        Biomes.SNOWY_PLAINS,
        Biomes.SNOWY_TAIGA,
        Biomes.SNOWY_TAIGA,
    ],
    [Biomes.MEADOW, Biomes.MEADOW, Biomes.FOREST, Biomes.TAIGA, Biomes.OLD_GROWTH_SPRUCE_TAIGA],
    [Biomes.MEADOW, Biomes.MEADOW, Biomes.MEADOW, Biomes.MEADOW, Biomes.DARK_FOREST],
    [Biomes.SAVANNA_PLATEAU, Biomes.SAVANNA_PLATEAU, Biomes.FOREST, Biomes.FOREST, Biomes.JUNGLE],
    [
        Biomes.BADLANDS,
        Biomes.BADLANDS,
        Biomes.BADLANDS,
        Biomes.WOODED_BADLANDS,
        Biomes.WOODED_BADLANDS,
    ],
]

const PLATEAU_BIOMES_VARIANT = [
    [Biomes.ICE_SPIKES, null, null, null, null],
    [null, null, Biomes.MEADOW, Biomes.MEADOW, Biomes.OLD_GROWTH_PINE_TAIGA],
    [null, null, Biomes.FOREST, Biomes.BIRCH_FOREST, null],
    [null, null, null, null, null],
    [Biomes.ERODED_BADLANDS, Biomes.ERODED_BADLANDS, null, null, null],
]

const EXTREME_HILLS = [
    [
        Biomes.WINDSWEPT_GRAVELLY_HILLS,
        Biomes.WINDSWEPT_GRAVELLY_HILLS,
        Biomes.WINDSWEPT_HILLS,
        Biomes.WINDSWEPT_FOREST,
        Biomes.WINDSWEPT_FOREST,
    ],
    [
        Biomes.WINDSWEPT_GRAVELLY_HILLS,
        Biomes.WINDSWEPT_GRAVELLY_HILLS,
        Biomes.WINDSWEPT_HILLS,
        Biomes.WINDSWEPT_FOREST,
        Biomes.WINDSWEPT_FOREST,
    ],
    [
        Biomes.WINDSWEPT_HILLS,
        Biomes.WINDSWEPT_HILLS,
        Biomes.WINDSWEPT_HILLS,
        Biomes.WINDSWEPT_FOREST,
        Biomes.WINDSWEPT_FOREST,
    ],
    [null, null, null, null, null],
    [null, null, null, null, null],
]

type BuilderOutput = Pair<Climate.ParameterPoint, Biomes>[]

export class OverworldBiomeBuilder {
    // high order methods

    addBiomes(biomes: BuilderOutput): void {
        this.addOffCoastBiomes(biomes)
        this.addInlandBiomes(biomes)
        this.addUndergroundBiomes(biomes)
    }

    private addOffCoastBiomes(biomes: BuilderOutput): void {
        this.addSurfaceBiome(
            biomes,
            FULL_RANGE,
            FULL_RANGE,
            mushroomFieldsContinentalness,
            FULL_RANGE,
            FULL_RANGE,
            0.0,
            Biomes.MUSHROOM_FIELDS
        )

        for (let i = 0; i < temperatures.length; ++i) {
            const temperature = temperatures[i]
            this.addSurfaceBiome(
                biomes,
                temperature,
                FULL_RANGE,
                deepOceanContinentalness,
                FULL_RANGE,
                FULL_RANGE,
                0.0,
                OCEANS[0][i]
            )
            this.addSurfaceBiome(
                biomes,
                temperature,
                FULL_RANGE,
                oceanContinentalness,
                FULL_RANGE,
                FULL_RANGE,
                0.0,
                OCEANS[1][i]
            )
        }
    }

    private addInlandBiomes(biomes: BuilderOutput): void {
        this.addMidSlice(biomes, Climate.Parameter.span(-1.0, -HIGH_END))
        this.addHighSlice(biomes, Climate.Parameter.span(-HIGH_END, -PEAK_END))
        this.addPeaks(biomes, Climate.Parameter.span(-PEAK_END, -PEAK_START))
        this.addHighSlice(biomes, Climate.Parameter.span(-PEAK_START, -HIGH_START))
        this.addMidSlice(biomes, Climate.Parameter.span(-HIGH_START, -LOW_START))
        this.addLowSlice(biomes, Climate.Parameter.span(-LOW_START, -VALLEY_SIZE))
        this.addValleys(biomes, Climate.Parameter.span(-VALLEY_SIZE, VALLEY_SIZE))
        this.addLowSlice(biomes, Climate.Parameter.span(VALLEY_SIZE, LOW_START))
        this.addMidSlice(biomes, Climate.Parameter.span(LOW_START, HIGH_START))
        this.addHighSlice(biomes, Climate.Parameter.span(HIGH_START, PEAK_START))
        this.addPeaks(biomes, Climate.Parameter.span(PEAK_START, PEAK_END))
        this.addHighSlice(biomes, Climate.Parameter.span(PEAK_END, HIGH_END))
        this.addMidSlice(biomes, Climate.Parameter.span(HIGH_END, 1.0))
    }

    // specific type biomes

    private addPeaks(biomes: BuilderOutput, weirdness: Climate.Parameter): void {
        for (let temperatureIndex = 0; temperatureIndex < temperatures.length; ++temperatureIndex) {
            const temperature = temperatures[temperatureIndex]

            for (let humidityIndex = 0; humidityIndex < humidities.length; ++humidityIndex) {
                const humidity = humidities[humidityIndex]
                const middleBiome = this.pickMiddleBiome(temperatureIndex, humidityIndex, weirdness)
                const middleOrBadlands = this.pickMiddleBiomeOrBadlandsIfHot(
                    temperatureIndex,
                    humidityIndex,
                    weirdness
                )
                const middleOrBadlandsOrSlope = this.pickMiddleBiomeOrBadlandsIfHotOrSlopeIfCold(
                    temperatureIndex,
                    humidityIndex,
                    weirdness
                )
                const plateauBiome = this.pickPlateauBiome(
                    temperatureIndex,
                    humidityIndex,
                    weirdness
                )
                const extremeHillsBiome = this.pickExtremeHillsBiome(
                    temperatureIndex,
                    humidityIndex,
                    weirdness
                )
                const maybeShattered = this.maybePickShatteredBiome(
                    temperatureIndex,
                    humidityIndex,
                    weirdness,
                    extremeHillsBiome
                )
                const peakyBiome = this.pickPeakBiome(temperatureIndex, humidityIndex, weirdness)
                this.addSurfaceBiome(
                    biomes,
                    temperature,
                    humidity,
                    Climate.Parameter.span(coastContinentalness, farInlandContinentalness),
                    erosions[0],
                    weirdness,
                    0.0,
                    peakyBiome
                )
                this.addSurfaceBiome(
                    biomes,
                    temperature,
                    humidity,
                    Climate.Parameter.span(coastContinentalness, nearInlandContinentalness),
                    erosions[1],
                    weirdness,
                    0.0,
                    middleOrBadlandsOrSlope
                )
                this.addSurfaceBiome(
                    biomes,
                    temperature,
                    humidity,
                    Climate.Parameter.span(midInlandContinentalness, farInlandContinentalness),
                    erosions[1],
                    weirdness,
                    0.0,
                    peakyBiome
                )
                this.addSurfaceBiome(
                    biomes,
                    temperature,
                    humidity,
                    Climate.Parameter.span(coastContinentalness, nearInlandContinentalness),
                    Climate.Parameter.span(erosions[2], erosions[3]),
                    weirdness,
                    0.0,
                    middleBiome
                )
                this.addSurfaceBiome(
                    biomes,
                    temperature,
                    humidity,
                    Climate.Parameter.span(midInlandContinentalness, farInlandContinentalness),
                    erosions[2],
                    weirdness,
                    0.0,
                    plateauBiome
                )
                this.addSurfaceBiome(
                    biomes,
                    temperature,
                    humidity,
                    midInlandContinentalness,
                    erosions[3],
                    weirdness,
                    0.0,
                    middleOrBadlands
                )
                this.addSurfaceBiome(
                    biomes,
                    temperature,
                    humidity,
                    farInlandContinentalness,
                    erosions[3],
                    weirdness,
                    0.0,
                    plateauBiome
                )
                this.addSurfaceBiome(
                    biomes,
                    temperature,
                    humidity,
                    Climate.Parameter.span(coastContinentalness, farInlandContinentalness),
                    erosions[4],
                    weirdness,
                    0.0,
                    middleBiome
                )
                this.addSurfaceBiome(
                    biomes,
                    temperature,
                    humidity,
                    Climate.Parameter.span(coastContinentalness, nearInlandContinentalness),
                    erosions[5],
                    weirdness,
                    0.0,
                    maybeShattered
                )
                this.addSurfaceBiome(
                    biomes,
                    temperature,
                    humidity,
                    Climate.Parameter.span(midInlandContinentalness, farInlandContinentalness),
                    erosions[5],
                    weirdness,
                    0.0,
                    extremeHillsBiome
                )
                this.addSurfaceBiome(
                    biomes,
                    temperature,
                    humidity,
                    Climate.Parameter.span(coastContinentalness, farInlandContinentalness),
                    erosions[6],
                    weirdness,
                    0.0,
                    middleBiome
                )
            }
        }
    }

    private addHighSlice(biomes: BuilderOutput, weirdness: Climate.Parameter): void {
        for (let temperatureIndex = 0; temperatureIndex < temperatures.length; ++temperatureIndex) {
            const temperature = temperatures[temperatureIndex]

            for (let humidityIndex = 0; humidityIndex < humidities.length; ++humidityIndex) {
                const humidity = humidities[humidityIndex]
                const middleBiome = this.pickMiddleBiome(temperatureIndex, humidityIndex, weirdness)
                const middleOrBadlands = this.pickMiddleBiomeOrBadlandsIfHot(
                    temperatureIndex,
                    humidityIndex,
                    weirdness
                )
                const middleOrBadlandsOrSlope = this.pickMiddleBiomeOrBadlandsIfHotOrSlopeIfCold(
                    temperatureIndex,
                    humidityIndex,
                    weirdness
                )
                const plateauBiome = this.pickPlateauBiome(
                    temperatureIndex,
                    humidityIndex,
                    weirdness
                )
                const extremeHillsBiome = this.pickExtremeHillsBiome(
                    temperatureIndex,
                    humidityIndex,
                    weirdness
                )
                const maybeShattered = this.maybePickShatteredBiome(
                    temperatureIndex,
                    humidityIndex,
                    weirdness,
                    middleBiome
                )
                const slopeBiome = this.pickSlopeBiome(temperatureIndex, humidityIndex, weirdness)
                const peakyBiome = this.pickPeakBiome(temperatureIndex, humidityIndex, weirdness)
                this.addSurfaceBiome(
                    biomes,
                    temperature,
                    humidity,
                    coastContinentalness,
                    Climate.Parameter.span(erosions[0], erosions[1]),
                    weirdness,
                    0.0,
                    middleBiome
                )
                this.addSurfaceBiome(
                    biomes,
                    temperature,
                    humidity,
                    nearInlandContinentalness,
                    erosions[0],
                    weirdness,
                    0.0,
                    slopeBiome
                )
                this.addSurfaceBiome(
                    biomes,
                    temperature,
                    humidity,
                    Climate.Parameter.span(midInlandContinentalness, farInlandContinentalness),
                    erosions[0],
                    weirdness,
                    0.0,
                    peakyBiome
                )
                this.addSurfaceBiome(
                    biomes,
                    temperature,
                    humidity,
                    nearInlandContinentalness,
                    erosions[1],
                    weirdness,
                    0.0,
                    middleOrBadlandsOrSlope
                )
                this.addSurfaceBiome(
                    biomes,
                    temperature,
                    humidity,
                    Climate.Parameter.span(midInlandContinentalness, farInlandContinentalness),
                    erosions[1],
                    weirdness,
                    0.0,
                    slopeBiome
                )
                this.addSurfaceBiome(
                    biomes,
                    temperature,
                    humidity,
                    Climate.Parameter.span(coastContinentalness, nearInlandContinentalness),
                    Climate.Parameter.span(erosions[2], erosions[3]),
                    weirdness,
                    0.0,
                    middleBiome
                )
                this.addSurfaceBiome(
                    biomes,
                    temperature,
                    humidity,
                    Climate.Parameter.span(midInlandContinentalness, farInlandContinentalness),
                    erosions[2],
                    weirdness,
                    0.0,
                    plateauBiome
                )
                this.addSurfaceBiome(
                    biomes,
                    temperature,
                    humidity,
                    midInlandContinentalness,
                    erosions[3],
                    weirdness,
                    0.0,
                    middleOrBadlands
                )
                this.addSurfaceBiome(
                    biomes,
                    temperature,
                    humidity,
                    farInlandContinentalness,
                    erosions[3],
                    weirdness,
                    0.0,
                    plateauBiome
                )
                this.addSurfaceBiome(
                    biomes,
                    temperature,
                    humidity,
                    Climate.Parameter.span(coastContinentalness, farInlandContinentalness),
                    erosions[4],
                    weirdness,
                    0.0,
                    middleBiome
                )
                this.addSurfaceBiome(
                    biomes,
                    temperature,
                    humidity,
                    Climate.Parameter.span(coastContinentalness, nearInlandContinentalness),
                    erosions[5],
                    weirdness,
                    0.0,
                    maybeShattered
                )
                this.addSurfaceBiome(
                    biomes,
                    temperature,
                    humidity,
                    Climate.Parameter.span(midInlandContinentalness, farInlandContinentalness),
                    erosions[5],
                    weirdness,
                    0.0,
                    extremeHillsBiome
                )
                this.addSurfaceBiome(
                    biomes,
                    temperature,
                    humidity,
                    Climate.Parameter.span(coastContinentalness, farInlandContinentalness),
                    erosions[6],
                    weirdness,
                    0.0,
                    middleBiome
                )
            }
        }
    }

    private addMidSlice(biomes: BuilderOutput, weirdness: Climate.Parameter): void {
        this.addSurfaceBiome(
            biomes,
            FULL_RANGE,
            FULL_RANGE,
            coastContinentalness,
            Climate.Parameter.span(erosions[0], erosions[2]),
            weirdness,
            0.0,
            Biomes.STONY_SHORE
        )
        this.addSurfaceBiome(
            biomes,
            UNFROZEN_RANGE,
            FULL_RANGE,
            Climate.Parameter.span(nearInlandContinentalness, farInlandContinentalness),
            erosions[6],
            weirdness,
            0.0,
            Biomes.SWAMP
        )

        for (let temperatureIndex = 0; temperatureIndex < temperatures.length; ++temperatureIndex) {
            const temperature = temperatures[temperatureIndex]

            for (let humidityIndex = 0; humidityIndex < humidities.length; ++humidityIndex) {
                const humidity = humidities[humidityIndex]
                const middleBiome = this.pickMiddleBiome(temperatureIndex, humidityIndex, weirdness)
                const middleOrBadlands = this.pickMiddleBiomeOrBadlandsIfHot(
                    temperatureIndex,
                    humidityIndex,
                    weirdness
                )
                const middleOrBadlandsOrSlope = this.pickMiddleBiomeOrBadlandsIfHotOrSlopeIfCold(
                    temperatureIndex,
                    humidityIndex,
                    weirdness
                )
                const extremeHillsBiome = this.pickExtremeHillsBiome(
                    temperatureIndex,
                    humidityIndex,
                    weirdness
                )
                const plateauBiome = this.pickPlateauBiome(
                    temperatureIndex,
                    humidityIndex,
                    weirdness
                )
                const beachBiome = this.pickBeachBiome(temperatureIndex)
                const maybeShattered = this.maybePickShatteredBiome(
                    temperatureIndex,
                    humidityIndex,
                    weirdness,
                    middleBiome
                )
                const shatteredCoastBiome = this.pickShatteredCoastBiome(
                    temperatureIndex,
                    humidityIndex,
                    weirdness
                )
                const slopeBiome = this.pickSlopeBiome(temperatureIndex, humidityIndex, weirdness)
                this.addSurfaceBiome(
                    biomes,
                    temperature,
                    humidity,
                    Climate.Parameter.span(nearInlandContinentalness, farInlandContinentalness),
                    erosions[0],
                    weirdness,
                    0.0,
                    slopeBiome
                )
                this.addSurfaceBiome(
                    biomes,
                    temperature,
                    humidity,
                    Climate.Parameter.span(nearInlandContinentalness, midInlandContinentalness),
                    erosions[1],
                    weirdness,
                    0.0,
                    middleOrBadlandsOrSlope
                )
                this.addSurfaceBiome(
                    biomes,
                    temperature,
                    humidity,
                    farInlandContinentalness,
                    erosions[1],
                    weirdness,
                    0.0,
                    temperatureIndex == 0 ? slopeBiome : plateauBiome
                )
                this.addSurfaceBiome(
                    biomes,
                    temperature,
                    humidity,
                    nearInlandContinentalness,
                    erosions[2],
                    weirdness,
                    0.0,
                    middleBiome
                )
                this.addSurfaceBiome(
                    biomes,
                    temperature,
                    humidity,
                    midInlandContinentalness,
                    erosions[2],
                    weirdness,
                    0.0,
                    middleOrBadlands
                )
                this.addSurfaceBiome(
                    biomes,
                    temperature,
                    humidity,
                    farInlandContinentalness,
                    erosions[2],
                    weirdness,
                    0.0,
                    plateauBiome
                )
                this.addSurfaceBiome(
                    biomes,
                    temperature,
                    humidity,
                    Climate.Parameter.span(coastContinentalness, nearInlandContinentalness),
                    erosions[3],
                    weirdness,
                    0.0,
                    middleBiome
                )
                this.addSurfaceBiome(
                    biomes,
                    temperature,
                    humidity,
                    Climate.Parameter.span(midInlandContinentalness, farInlandContinentalness),
                    erosions[3],
                    weirdness,
                    0.0,
                    middleOrBadlands
                )
                if (weirdness.max < 0) {
                    this.addSurfaceBiome(
                        biomes,
                        temperature,
                        humidity,
                        coastContinentalness,
                        erosions[4],
                        weirdness,
                        0.0,
                        beachBiome
                    )
                    this.addSurfaceBiome(
                        biomes,
                        temperature,
                        humidity,
                        Climate.Parameter.span(nearInlandContinentalness, farInlandContinentalness),
                        erosions[4],
                        weirdness,
                        0.0,
                        middleBiome
                    )
                } else {
                    this.addSurfaceBiome(
                        biomes,
                        temperature,
                        humidity,
                        Climate.Parameter.span(coastContinentalness, farInlandContinentalness),
                        erosions[4],
                        weirdness,
                        0.0,
                        middleBiome
                    )
                }

                this.addSurfaceBiome(
                    biomes,
                    temperature,
                    humidity,
                    coastContinentalness,
                    erosions[5],
                    weirdness,
                    0.0,
                    shatteredCoastBiome
                )
                this.addSurfaceBiome(
                    biomes,
                    temperature,
                    humidity,
                    nearInlandContinentalness,
                    erosions[5],
                    weirdness,
                    0.0,
                    maybeShattered
                )
                this.addSurfaceBiome(
                    biomes,
                    temperature,
                    humidity,
                    Climate.Parameter.span(midInlandContinentalness, farInlandContinentalness),
                    erosions[5],
                    weirdness,
                    0.0,
                    extremeHillsBiome
                )
                if (weirdness.max < 0) {
                    this.addSurfaceBiome(
                        biomes,
                        temperature,
                        humidity,
                        coastContinentalness,
                        erosions[6],
                        weirdness,
                        0.0,
                        beachBiome
                    )
                } else {
                    this.addSurfaceBiome(
                        biomes,
                        temperature,
                        humidity,
                        coastContinentalness,
                        erosions[6],
                        weirdness,
                        0.0,
                        middleBiome
                    )
                }

                if (temperatureIndex == 0) {
                    this.addSurfaceBiome(
                        biomes,
                        temperature,
                        humidity,
                        Climate.Parameter.span(nearInlandContinentalness, farInlandContinentalness),
                        erosions[6],
                        weirdness,
                        0.0,
                        middleBiome
                    )
                }
            }
        }
    }

    private addLowSlice(biomes: BuilderOutput, weirdness: Climate.Parameter): void {
        this.addSurfaceBiome(
            biomes,
            FULL_RANGE,
            FULL_RANGE,
            coastContinentalness,
            Climate.Parameter.span(erosions[0], erosions[2]),
            weirdness,
            0.0,
            Biomes.STONY_SHORE
        )
        this.addSurfaceBiome(
            biomes,
            UNFROZEN_RANGE,
            FULL_RANGE,
            Climate.Parameter.span(nearInlandContinentalness, farInlandContinentalness),
            erosions[6],
            weirdness,
            0.0,
            Biomes.SWAMP
        )

        for (let temperatureIndex = 0; temperatureIndex < temperatures.length; ++temperatureIndex) {
            const temperature = temperatures[temperatureIndex]

            for (let humidityIndex = 0; humidityIndex < humidities.length; ++humidityIndex) {
                const humidity = humidities[humidityIndex]
                const resourcekey = this.pickMiddleBiome(temperatureIndex, humidityIndex, weirdness)
                const resourcekey1 = this.pickMiddleBiomeOrBadlandsIfHot(
                    temperatureIndex,
                    humidityIndex,
                    weirdness
                )
                const resourcekey2 = this.pickMiddleBiomeOrBadlandsIfHotOrSlopeIfCold(
                    temperatureIndex,
                    humidityIndex,
                    weirdness
                )
                const resourcekey3 = this.pickBeachBiome(temperatureIndex)
                const resourcekey4 = this.maybePickShatteredBiome(
                    temperatureIndex,
                    humidityIndex,
                    weirdness,
                    resourcekey
                )
                const resourcekey5 = this.pickShatteredCoastBiome(
                    temperatureIndex,
                    humidityIndex,
                    weirdness
                )
                this.addSurfaceBiome(
                    biomes,
                    temperature,
                    humidity,
                    nearInlandContinentalness,
                    Climate.Parameter.span(erosions[0], erosions[1]),
                    weirdness,
                    0.0,
                    resourcekey1
                )
                this.addSurfaceBiome(
                    biomes,
                    temperature,
                    humidity,
                    Climate.Parameter.span(midInlandContinentalness, farInlandContinentalness),
                    Climate.Parameter.span(erosions[0], erosions[1]),
                    weirdness,
                    0.0,
                    resourcekey2
                )
                this.addSurfaceBiome(
                    biomes,
                    temperature,
                    humidity,
                    nearInlandContinentalness,
                    Climate.Parameter.span(erosions[2], erosions[3]),
                    weirdness,
                    0.0,
                    resourcekey
                )
                this.addSurfaceBiome(
                    biomes,
                    temperature,
                    humidity,
                    Climate.Parameter.span(midInlandContinentalness, farInlandContinentalness),
                    Climate.Parameter.span(erosions[2], erosions[3]),
                    weirdness,
                    0.0,
                    resourcekey1
                )
                this.addSurfaceBiome(
                    biomes,
                    temperature,
                    humidity,
                    coastContinentalness,
                    Climate.Parameter.span(erosions[3], erosions[4]),
                    weirdness,
                    0.0,
                    resourcekey3
                )
                this.addSurfaceBiome(
                    biomes,
                    temperature,
                    humidity,
                    Climate.Parameter.span(nearInlandContinentalness, farInlandContinentalness),
                    erosions[4],
                    weirdness,
                    0.0,
                    resourcekey
                )
                this.addSurfaceBiome(
                    biomes,
                    temperature,
                    humidity,
                    coastContinentalness,
                    erosions[5],
                    weirdness,
                    0.0,
                    resourcekey5
                )
                this.addSurfaceBiome(
                    biomes,
                    temperature,
                    humidity,
                    nearInlandContinentalness,
                    erosions[5],
                    weirdness,
                    0.0,
                    resourcekey4
                )
                this.addSurfaceBiome(
                    biomes,
                    temperature,
                    humidity,
                    Climate.Parameter.span(midInlandContinentalness, farInlandContinentalness),
                    erosions[5],
                    weirdness,
                    0.0,
                    resourcekey
                )
                this.addSurfaceBiome(
                    biomes,
                    temperature,
                    humidity,
                    coastContinentalness,
                    erosions[6],
                    weirdness,
                    0.0,
                    resourcekey3
                )
                if (temperatureIndex == 0) {
                    this.addSurfaceBiome(
                        biomes,
                        temperature,
                        humidity,
                        Climate.Parameter.span(nearInlandContinentalness, farInlandContinentalness),
                        erosions[6],
                        weirdness,
                        0.0,
                        resourcekey
                    )
                }
            }
        }
    }

    private addValleys(biomes: BuilderOutput, wierdness: Climate.Parameter): void {
        this.addSurfaceBiome(
            biomes,
            FROZEN_RANGE,
            FULL_RANGE,
            coastContinentalness,
            Climate.Parameter.span(erosions[0], erosions[1]),
            wierdness,
            0.0,
            wierdness.max < 0 ? Biomes.STONY_SHORE : Biomes.FROZEN_RIVER
        )
        this.addSurfaceBiome(
            biomes,
            UNFROZEN_RANGE,
            FULL_RANGE,
            coastContinentalness,
            Climate.Parameter.span(erosions[0], erosions[1]),
            wierdness,
            0.0,
            wierdness.max < 0 ? Biomes.STONY_SHORE : Biomes.RIVER
        )
        this.addSurfaceBiome(
            biomes,
            FROZEN_RANGE,
            FULL_RANGE,
            nearInlandContinentalness,
            Climate.Parameter.span(erosions[0], erosions[1]),
            wierdness,
            0.0,
            Biomes.FROZEN_RIVER
        )
        this.addSurfaceBiome(
            biomes,
            UNFROZEN_RANGE,
            FULL_RANGE,
            nearInlandContinentalness,
            Climate.Parameter.span(erosions[0], erosions[1]),
            wierdness,
            0.0,
            Biomes.RIVER
        )
        this.addSurfaceBiome(
            biomes,
            FROZEN_RANGE,
            FULL_RANGE,
            Climate.Parameter.span(coastContinentalness, farInlandContinentalness),
            Climate.Parameter.span(erosions[2], erosions[5]),
            wierdness,
            0.0,
            Biomes.FROZEN_RIVER
        )
        this.addSurfaceBiome(
            biomes,
            UNFROZEN_RANGE,
            FULL_RANGE,
            Climate.Parameter.span(coastContinentalness, farInlandContinentalness),
            Climate.Parameter.span(erosions[2], erosions[5]),
            wierdness,
            0.0,
            Biomes.RIVER
        )
        this.addSurfaceBiome(
            biomes,
            FROZEN_RANGE,
            FULL_RANGE,
            coastContinentalness,
            erosions[6],
            wierdness,
            0.0,
            Biomes.FROZEN_RIVER
        )
        this.addSurfaceBiome(
            biomes,
            UNFROZEN_RANGE,
            FULL_RANGE,
            coastContinentalness,
            erosions[6],
            wierdness,
            0.0,
            Biomes.RIVER
        )
        this.addSurfaceBiome(
            biomes,
            UNFROZEN_RANGE,
            FULL_RANGE,
            Climate.Parameter.span(inlandContinentalness, farInlandContinentalness),
            erosions[6],
            wierdness,
            0.0,
            Biomes.SWAMP
        )
        this.addSurfaceBiome(
            biomes,
            FROZEN_RANGE,
            FULL_RANGE,
            Climate.Parameter.span(inlandContinentalness, farInlandContinentalness),
            erosions[6],
            wierdness,
            0.0,
            Biomes.FROZEN_RIVER
        )

        for (let temperatureIndex = 0; temperatureIndex < temperatures.length; ++temperatureIndex) {
            const temperature = temperatures[temperatureIndex]

            for (let humidityIndex = 0; humidityIndex < humidities.length; ++humidityIndex) {
                const humidity = humidities[humidityIndex]
                const resourcekey = this.pickMiddleBiomeOrBadlandsIfHot(
                    temperatureIndex,
                    humidityIndex,
                    wierdness
                )
                this.addSurfaceBiome(
                    biomes,
                    temperature,
                    humidity,
                    Climate.Parameter.span(midInlandContinentalness, farInlandContinentalness),
                    Climate.Parameter.span(erosions[0], erosions[1]),
                    wierdness,
                    0.0,
                    resourcekey
                )
            }
        }
    }

    private addUndergroundBiomes(biomes: BuilderOutput): void {
        this.addUndergroundBiome(
            biomes,
            FULL_RANGE,
            FULL_RANGE,
            Climate.Parameter.span(0.8, 1.0),
            FULL_RANGE,
            FULL_RANGE,
            0.0,
            Biomes.DRIPSTONE_CAVES
        )
        this.addUndergroundBiome(
            biomes,
            FULL_RANGE,
            Climate.Parameter.span(0.7, 1.0),
            FULL_RANGE,
            FULL_RANGE,
            FULL_RANGE,
            0.0,
            Biomes.LUSH_CAVES
        )
    }

    // biome pickers

    private pickMiddleBiome(
        temperatureIndex: number,
        humidityIndex: number,
        weirdness: Climate.Parameter
    ): Biomes {
        if (weirdness.max < 0) {
            return MIDDLE_BIOMES[temperatureIndex][humidityIndex]
        } else {
            const resourcekey = MIDDLE_BIOMES_VARIANT[temperatureIndex][humidityIndex]
            return resourcekey == null
                ? MIDDLE_BIOMES[temperatureIndex][humidityIndex]
                : resourcekey
        }
    }

    private pickMiddleBiomeOrBadlandsIfHot(
        temperatureIndex: number,
        humidityIndex: number,
        weirdness: Climate.Parameter
    ): Biomes {
        return temperatureIndex == 4
            ? this.pickBadlandsBiome(humidityIndex, weirdness)
            : this.pickMiddleBiome(temperatureIndex, humidityIndex, weirdness)
    }

    private pickMiddleBiomeOrBadlandsIfHotOrSlopeIfCold(
        temperatureIndex: number,
        humidityIndex: number,
        weirdness: Climate.Parameter
    ): Biomes {
        return temperatureIndex == 0
            ? this.pickSlopeBiome(temperatureIndex, humidityIndex, weirdness)
            : this.pickMiddleBiomeOrBadlandsIfHot(temperatureIndex, humidityIndex, weirdness)
    }

    private maybePickShatteredBiome(
        temperatureIndex: number,
        humidityIndex: number,
        weirdness: Climate.Parameter,
        defaultBiome: Biomes
    ): Biomes {
        return temperatureIndex > 1 && humidityIndex < 4 && weirdness.max >= 0
            ? Biomes.WINDSWEPT_SAVANNA
            : defaultBiome
    }

    private pickShatteredCoastBiome(
        temperatureIndex: number,
        humidityIndex: number,
        weirdness: Climate.Parameter
    ): Biomes {
        const biome =
            weirdness.max >= 0
                ? this.pickMiddleBiome(temperatureIndex, humidityIndex, weirdness)
                : this.pickBeachBiome(temperatureIndex)
        return this.maybePickShatteredBiome(temperatureIndex, humidityIndex, weirdness, biome)
    }

    private pickBeachBiome(temperatureIndex: number): Biomes {
        if (temperatureIndex == 0) {
            return Biomes.SNOWY_BEACH
        } else {
            return temperatureIndex == 4 ? Biomes.DESERT : Biomes.BEACH
        }
    }

    private pickBadlandsBiome(humidityIndex: number, weirdness: Climate.Parameter): Biomes {
        if (humidityIndex < 2) {
            return weirdness.max < 0 ? Biomes.ERODED_BADLANDS : Biomes.BADLANDS
        } else {
            return humidityIndex < 3 ? Biomes.BADLANDS : Biomes.WOODED_BADLANDS
        }
    }

    private pickPlateauBiome(
        temperatureIndex: number,
        humidityIndex: number,
        weirdness: Climate.Parameter
    ): Biomes {
        if (weirdness.max < 0) {
            return PLATEAU_BIOMES[temperatureIndex][humidityIndex]
        } else {
            const biome = PLATEAU_BIOMES_VARIANT[temperatureIndex][humidityIndex]
            return biome == null ? PLATEAU_BIOMES[temperatureIndex][humidityIndex] : biome
        }
    }

    private pickPeakBiome(
        temperatureIndex: number,
        humidityIndex: number,
        weirdness: Climate.Parameter
    ): Biomes {
        if (temperatureIndex <= 2) {
            return weirdness.max < 0 ? Biomes.JAGGED_PEAKS : Biomes.FROZEN_PEAKS
        } else {
            return temperatureIndex == 3
                ? Biomes.STONY_PEAKS
                : this.pickBadlandsBiome(humidityIndex, weirdness)
        }
    }

    private pickSlopeBiome(
        temperatureIndex: number,
        humidityIndex: number,
        weirdness: Climate.Parameter
    ): Biomes {
        if (temperatureIndex >= 3) {
            return this.pickPlateauBiome(temperatureIndex, humidityIndex, weirdness)
        } else {
            return humidityIndex <= 1 ? Biomes.SNOWY_SLOPES : Biomes.GROVE
        }
    }

    private pickExtremeHillsBiome(
        temperatureIndex: number,
        humidityIndex: number,
        weirdness: Climate.Parameter
    ): Biomes {
        const extremeHillsBiome = EXTREME_HILLS[temperatureIndex][humidityIndex]
        return extremeHillsBiome == null
            ? this.pickMiddleBiome(temperatureIndex, humidityIndex, weirdness)
            : extremeHillsBiome
    }

    // push result

    private addSurfaceBiome(
        biomes: BuilderOutput,
        temperature: Climate.Parameter,
        humidity: Climate.Parameter,
        continentalness: Climate.Parameter,
        erosion: Climate.Parameter,
        weirdness: Climate.Parameter,
        offset: number,
        biome: Biomes
    ) {
        biomes.push(
            Pair.of(
                Climate.parameters(
                    temperature,
                    humidity,
                    continentalness,
                    erosion,
                    Climate.Parameter.point(0.0),
                    weirdness,
                    offset
                ),
                biome
            )
        )
        biomes.push(
            Pair.of(
                Climate.parameters(
                    temperature,
                    humidity,
                    continentalness,
                    erosion,
                    Climate.Parameter.point(1.0),
                    weirdness,
                    offset
                ),
                biome
            )
        )
    }

    private addUndergroundBiome(
        biomes: BuilderOutput,
        temperature: Climate.Parameter,
        humidity: Climate.Parameter,
        continentalness: Climate.Parameter,
        erosion: Climate.Parameter,
        weirdness: Climate.Parameter,
        offset: number,
        biome: Biomes
    ) {
        biomes.push(
            Pair.of(
                Climate.parameters(
                    temperature,
                    humidity,
                    continentalness,
                    erosion,
                    Climate.Parameter.span(0.2, 0.9),
                    weirdness,
                    offset
                ),
                biome
            )
        )
    }
}
