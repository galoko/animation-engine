import { toLong } from "../mth"
import { LegacyRandomSource, RandomSource, RandomSupport, WorldgenRandom } from "../random"
import { SimplexNoise } from "./simplex-noise"

export class PerlinSimplexNoise {
    private readonly noiseLevels: SimplexNoise[]
    private readonly highestFreqValueFactor: number
    private readonly highestFreqInputFactor: number

    constructor(randomSource: RandomSource, octaves: number[]) {
        const minusFirstOctave = -octaves[0]
        const lastOctave = octaves[octaves.length - 1]
        const octaveLength = minusFirstOctave + lastOctave + 1

        const simplexNoise = new SimplexNoise(randomSource)
        const l = lastOctave
        this.noiseLevels = new Array(octaveLength)
        if (lastOctave >= 0 && lastOctave < octaveLength && octaves.includes(0)) {
            this.noiseLevels[lastOctave] = simplexNoise
        }

        for (let octaveIndex = lastOctave + 1; octaveIndex < octaveLength; ++octaveIndex) {
            if (octaveIndex >= 0 && octaves.includes(l - octaveIndex)) {
                this.noiseLevels[octaveIndex] = new SimplexNoise(randomSource)
            } else {
                RandomSupport.consumeCount(randomSource, 262)
            }
        }

        if (lastOctave > 0) {
            const seed = toLong(
                simplexNoise.getValue(simplexNoise.xo, simplexNoise.yo, simplexNoise.zo) *
                    9.223372e18
            )
            const randomSource = new WorldgenRandom(new LegacyRandomSource(seed))

            for (let octaveIndex = l - 1; octaveIndex >= 0; --octaveIndex) {
                if (octaveIndex < octaveLength && octaves.includes(l - octaveIndex)) {
                    this.noiseLevels[octaveIndex] = new SimplexNoise(randomSource)
                } else {
                    RandomSupport.consumeCount(randomSource, 262)
                }
            }
        }

        this.highestFreqInputFactor = Math.pow(2.0, lastOctave)
        this.highestFreqValueFactor = 1.0 / (Math.pow(2.0, octaveLength) - 1.0)
    }

    getValue(x: number, y: number, useOffset: boolean): number {
        let noiseValue = 0.0
        let inputScale = this.highestFreqInputFactor
        let outputScale = this.highestFreqValueFactor

        for (const simplexnoise of this.noiseLevels) {
            if (simplexnoise != null) {
                noiseValue +=
                    simplexnoise.getValue(
                        x * inputScale + (useOffset ? simplexnoise.xo : 0.0),
                        y * inputScale + (useOffset ? simplexnoise.yo : 0.0)
                    ) * outputScale
            }

            inputScale /= 2.0
            outputScale *= 2.0
        }

        return noiseValue
    }
}
