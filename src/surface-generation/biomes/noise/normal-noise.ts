import { RandomSource } from "../random"
import { PerlinNoise } from "./perlin-noise"

export class NoiseParameters {
    public readonly amplitudes: number[]

    constructor(firstOctave: number, firstAmplitude: number, ...amplitudes: number[])
    constructor(firstOctave: number, amplitudes: number[])
    constructor(
        public readonly firstOctave: number,
        firstAmplitude: number[] | number,
        ...amplitudes: number[]
    ) {
        if (typeof firstAmplitude === "number") {
            this.amplitudes = [firstAmplitude, ...amplitudes]
        } else {
            this.amplitudes = firstAmplitude
        }
    }
}

export class NormalNoise {
    private static readonly INPUT_FACTOR = 1.0181268882175227
    private static readonly TARGET_DEVIATION = 0.3333333333333333
    private readonly valueFactor: number
    private readonly first: PerlinNoise
    private readonly second: PerlinNoise

    public static createLegacyNetherBiome(
        randomSource: RandomSource,
        parameters: NoiseParameters
    ): NormalNoise {
        return new NormalNoise(randomSource, parameters.firstOctave, parameters.amplitudes, false)
    }

    public static create(
        randomSource: RandomSource,
        firstOctave: number,
        ...amplitudes: number[]
    ): NormalNoise {
        return new NormalNoise(randomSource, firstOctave, amplitudes, true)
    }

    public static create2(p_192849_: RandomSource, p_192850_: NoiseParameters): NormalNoise {
        return new NormalNoise(p_192849_, p_192850_.firstOctave, p_192850_.amplitudes, true)
    }

    public static create3(
        randomSource: RandomSource,
        firstOctave: number,
        amplitudes: number[]
    ): NormalNoise {
        return new NormalNoise(randomSource, firstOctave, amplitudes, true)
    }

    private constructor(
        randomSource: RandomSource,
        firstOctave: number,
        amplitudes: number[],
        notLegacy: boolean
    ) {
        if (notLegacy) {
            this.first = PerlinNoise.create2(randomSource, firstOctave, amplitudes)
            this.second = PerlinNoise.create2(randomSource, firstOctave, amplitudes)
        } else {
            this.first = PerlinNoise.createLegacyForLegacyNormalNoise(
                randomSource,
                firstOctave,
                amplitudes
            )
            this.second = PerlinNoise.createLegacyForLegacyNormalNoise(
                randomSource,
                firstOctave,
                amplitudes
            )
        }

        let minAmplitudeIndex = Number.MAX_SAFE_INTEGER
        let maxAmplitudeIndex = Number.MIN_SAFE_INTEGER

        for (let amplitudeIndex = 0; amplitudeIndex < amplitudes.length; amplitudeIndex++) {
            const amplitude = amplitudes[amplitudeIndex]
            if (amplitude != 0.0) {
                minAmplitudeIndex = Math.min(minAmplitudeIndex, amplitudeIndex)
                maxAmplitudeIndex = Math.max(maxAmplitudeIndex, amplitudeIndex)
            }
        }

        this.valueFactor =
            0.16666666666666666 /
            NormalNoise.expectedDeviation(maxAmplitudeIndex - minAmplitudeIndex)
    }

    private static expectedDeviation(v: number): number {
        return 0.1 * (1.0 + 1.0 / (v + 1))
    }

    public getValue(x: number, y: number, z: number): number {
        const inputX = x * NormalNoise.INPUT_FACTOR
        const inputY = y * NormalNoise.INPUT_FACTOR
        const inputZ = z * NormalNoise.INPUT_FACTOR
        return (
            (this.first.getValue(x, y, z) + this.second.getValue(inputX, inputY, inputZ)) *
            this.valueFactor
        )
    }

    public parameters(): NoiseParameters {
        return new NoiseParameters(this.first.firstOctave, this.first.amplitudes)
    }
}
