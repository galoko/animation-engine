import { PerlinNoise } from "./noise/perlin-noise"

export class NoiseParameters {
    public readonly amplitudes: number[]

    constructor(
        private readonly firstOctave: number,
        firstAmplitude: number,
        ...amplitudes: number[]
    ) {
        this.amplitudes = [firstAmplitude, ...amplitudes]
    }
}

export class NormalNoise {
    private readonly INPUT_FACTOR = 1.0181268882175227
    private readonly TARGET_DEVIATION = 0.3333333333333333

    private readonly valueFactor: number
    private readonly first: PerlinNoise
    private readonly second: PerlinNoise

    public static createLegacyNetherBiome(
        p_192844_: RandomSource,
        p_192845_: NoiseParameters
    ): NormalNoise {
        return new NormalNoise(p_192844_, p_192845_.firstOctave, p_192845_.amplitudes, false)
    }

    public static create(
        p_164355_: RandomSource,
        p_164356_: number,
        ...p_164357_: number[]
    ): NormalNoise {
        return new NormalNoise(p_164355_, p_164356_, p_164357_.slice(), true)
    }

    public static create1(randomSource: RandomSource, first: NoiseParameters): NormalNoise {
        return new NormalNoise(randomSource, first.firstOctave, first.amplitudes, true)
    }

    public static create2(
        randomSource: RandomSource,
        firstOctave: number,
        amplitudes: number[]
    ): NormalNoise {
        return new NormalNoise(randomSource, firstOctave, amplitudes, true)
    }

    constructor(
        p_192838_: RandomSource,
        p_192839_: number,
        p_192840_: number[],
        p_192841_: boolean
    ) {
        if (p_192841_) {
            this.first = PerlinNoise.create(p_192838_, p_192839_, p_192840_)
            this.second = PerlinNoise.create(p_192838_, p_192839_, p_192840_)
        } else {
            this.first = PerlinNoise.createLegacyForLegacyNormalNoise(
                p_192838_,
                p_192839_,
                p_192840_
            )
            this.second = PerlinNoise.createLegacyForLegacyNormalNoise(
                p_192838_,
                p_192839_,
                p_192840_
            )
        }

        let i = Number.MAX_VALUE
        let j = Number.MIN_VALUE

        for (let k = 0; k < p_192840_.length; k++) {
            const d0 = p_192840_[k]
            if (d0 != 0.0) {
                i = Math.min(i, k)
                j = Math.max(j, k)
            }
        }

        this.valueFactor = 0.16666666666666666 / NormalNoise.expectedDeviation(j - i)
    }

    private static expectedDeviation(p_75385_: number): number {
        return 0.1 * (1.0 + 1.0 / (p_75385_ + 1))
    }

    public getValue(p_75381_: number, p_75382_: number, p_75383_: number): number {
        const d0 = p_75381_ * 1.0181268882175227
        const d1 = p_75382_ * 1.0181268882175227
        const d2 = p_75383_ * 1.0181268882175227
        return (
            (this.first.getValue(p_75381_, p_75382_, p_75383_) + this.second.getValue(d0, d1, d2)) *
            this.valueFactor
        )
    }

    public parameters(): NoiseParameters {
        return new NoiseParameters(this.first.firstOctave, this.first.amplitudes)
    }
}
