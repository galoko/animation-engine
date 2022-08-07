import { Pair } from "../consumer"
import { RandomSource, RandomSupport } from "../random"
import { ImprovedNoise } from "./improved-noise"
import { Mth } from "../mth"

export abstract class IntStream {
    static rangeClosed(startInclusive: number, endInclusive: number): number[] {
        const result = [] as number[]

        for (let i = startInclusive; i <= endInclusive; i++) {
            result.push(i)
        }

        return result
    }
}

export class PerlinNoise {
    private readonly noiseLevels: ImprovedNoise[]
    public readonly firstOctave: number
    public readonly amplitudes: number[]
    private readonly lowestFreqValueFactor: number
    private readonly lowestFreqInputFactor: number

    static createLegacyForBlendedNoise(randomSource: RandomSource, octaves: number[]): PerlinNoise {
        return new PerlinNoise(randomSource, PerlinNoise.makeAmplitudes(octaves), false)
    }

    static createLegacyForLegacyNormalNoise(
        randomSource: RandomSource,
        firstOctave: number,
        amplitudes: number[]
    ): PerlinNoise {
        return new PerlinNoise(randomSource, Pair.of(firstOctave, amplitudes), false)
    }

    public static create(randomSource: RandomSource, octaves: number[]): PerlinNoise {
        return new PerlinNoise(randomSource, PerlinNoise.makeAmplitudes(octaves), true)
    }

    public static create2(
        randomSource: RandomSource,
        firstOctave: number,
        amplitudes: number[]
    ): PerlinNoise {
        return new PerlinNoise(randomSource, Pair.of(firstOctave, amplitudes), true)
    }

    private static makeAmplitudes(octaves: number[]): Pair<number, number[]> {
        const minusFirstOctave = -octaves[0]
        const lastOctave = octaves[octaves.length - 1]
        const octaveLength = minusFirstOctave + lastOctave + 1

        const doublelist: number[] = new Array(octaveLength)
        doublelist.fill(0)

        for (const octave of octaves) {
            doublelist[octave + minusFirstOctave] = 1.0
        }

        return Pair.of(-minusFirstOctave, doublelist)
    }

    protected constructor(
        randomSource: RandomSource,
        octaveAndAmplitudes: Pair<number, number[]>,
        notLegacy: boolean
    ) {
        this.firstOctave = octaveAndAmplitudes.first
        this.amplitudes = octaveAndAmplitudes.second
        const amplitudesCount = this.amplitudes.length
        const minusFirstOctave = -this.firstOctave
        this.noiseLevels = new Array(amplitudesCount)
        if (notLegacy) {
            const positionalrandomfactory = randomSource.forkPositional()

            for (let k = 0; k < amplitudesCount; ++k) {
                if (this.amplitudes[k] != 0.0) {
                    const l = this.firstOctave + k
                    this.noiseLevels[k] = new ImprovedNoise(
                        positionalrandomfactory.fromHashOf("octave_" + l)
                    )
                }
            }
        } else {
            const improvednoise = new ImprovedNoise(randomSource)
            if (minusFirstOctave >= 0 && minusFirstOctave < amplitudesCount) {
                const d0 = this.amplitudes[minusFirstOctave]
                if (d0 != 0.0) {
                    this.noiseLevels[minusFirstOctave] = improvednoise
                }
            }

            for (let octaveIndex = minusFirstOctave - 1; octaveIndex >= 0; --octaveIndex) {
                if (octaveIndex < amplitudesCount) {
                    const d1 = this.amplitudes[octaveIndex]
                    if (d1 != 0.0) {
                        this.noiseLevels[octaveIndex] = new ImprovedNoise(randomSource)
                    } else {
                        PerlinNoise.skipOctave(randomSource)
                    }
                } else {
                    PerlinNoise.skipOctave(randomSource)
                }
            }

            if (
                this.noiseLevels.filter(noise => noise).length !=
                this.amplitudes.filter(amplitude => amplitude != 0).length
            ) {
                throw new Error(
                    "Failed to create correct number of noise levels for given non-zero amplitudes"
                )
            }

            if (minusFirstOctave < amplitudesCount - 1) {
                throw new Error("Positive octaves are temporarily disabled")
            }
        }

        this.lowestFreqInputFactor = Math.pow(2.0, -minusFirstOctave)
        this.lowestFreqValueFactor =
            Math.pow(2.0, amplitudesCount - 1) / (Math.pow(2.0, amplitudesCount) - 1.0)
    }

    private static skipOctave(randomSource: RandomSource): void {
        RandomSupport.consumeCount(randomSource, 262)
    }

    public getValue(
        x: number,
        y: number,
        z: number,
        yStep = 0,
        maxYfract = 0,
        useYfractOverride = false
    ): number {
        let value = 0.0
        let inputScale = this.lowestFreqInputFactor
        let outputScale = this.lowestFreqValueFactor

        for (let i = 0; i < this.noiseLevels.length; ++i) {
            const improvednoise = this.noiseLevels[i]
            if (improvednoise != null) {
                const noise = improvednoise.noise(
                    PerlinNoise.wrap(x * inputScale),
                    useYfractOverride ? -improvednoise.yo : PerlinNoise.wrap(y * inputScale),
                    PerlinNoise.wrap(z * inputScale),
                    yStep * inputScale,
                    maxYfract * inputScale
                )
                value += this.amplitudes[i] * noise * outputScale
            }

            inputScale *= 2.0
            outputScale /= 2.0
        }

        return value
    }

    getOctaveNoise(octave: number): ImprovedNoise {
        return this.noiseLevels[this.noiseLevels.length - 1 - octave]
    }

    static wrap(num: number): number {
        return num - Mth.lfloor(num / 3.3554432e7 + 0.5) * 3.3554432e7
    }
}
