import { NoiseSamplingSettings } from "../chunk-generator"
import { RandomSource } from "../random"
import { IntStream, PerlinNoise } from "./perlin-noise"
import { Mth } from "../mth"

export interface NoiseFiller {
    calculateNoise(x: number, y: number, z: number): number
}

export class BlendedNoise implements NoiseFiller {
    private readonly xzScale: number
    private readonly yScale: number
    private readonly xzMainScale: number
    private readonly yMainScale: number

    private constructor(
        private readonly minLimitNoise: PerlinNoise,
        private readonly maxLimitNoise: PerlinNoise,
        private readonly mainNoise: PerlinNoise,
        settings: NoiseSamplingSettings,
        private readonly cellWidth: number,
        private readonly cellHeight: number
    ) {
        this.xzScale = 684.412 * settings.xzScale
        this.yScale = 684.412 * settings.yScale
        this.xzMainScale = this.xzScale / settings.xzFactor
        this.yMainScale = this.yScale / settings.yFactor
    }

    public static create(
        randomSource: RandomSource,
        settings: NoiseSamplingSettings,
        cellWidth: number,
        cellHeight: number
    ): BlendedNoise {
        return new BlendedNoise(
            PerlinNoise.createLegacyForBlendedNoise(randomSource, IntStream.rangeClosed(-15, 0)),
            PerlinNoise.createLegacyForBlendedNoise(randomSource, IntStream.rangeClosed(-15, 0)),
            PerlinNoise.createLegacyForBlendedNoise(randomSource, IntStream.rangeClosed(-7, 0)),
            settings,
            cellWidth,
            cellHeight
        )
    }

    public calculateNoise(x: number, y: number, z: number): number {
        const cellX = Mth.floorDiv(x, this.cellWidth)
        const cellY = Mth.floorDiv(y, this.cellHeight)
        const cellZ = Mth.floorDiv(z, this.cellWidth)
        let minNoiseValue = 0.0
        let maxNoiseValue = 0.0
        let noiseValue = 0.0
        let scale = 1.0

        for (let octave = 0; octave < 8; ++octave) {
            const improvedNoise = this.mainNoise.getOctaveNoise(octave)
            if (improvedNoise != null) {
                noiseValue +=
                    improvedNoise.noise(
                        PerlinNoise.wrap(cellX * this.xzMainScale * scale),
                        PerlinNoise.wrap(cellY * this.yMainScale * scale),
                        PerlinNoise.wrap(cellZ * this.xzMainScale * scale),
                        this.yMainScale * scale,
                        cellY * this.yMainScale * scale
                    ) / scale
            }

            scale /= 2.0
        }

        const t = (noiseValue / 10.0 + 1.0) / 2.0
        const isMaxOrHigher = t >= 1.0
        const isMinOrLower = t <= 0.0
        scale = 1.0

        for (let octave = 0; octave < 16; ++octave) {
            const x = PerlinNoise.wrap(cellX * this.xzScale * scale)
            const y = PerlinNoise.wrap(cellY * this.yScale * scale)
            const z = PerlinNoise.wrap(cellZ * this.xzScale * scale)
            const yScale = this.yScale * scale
            if (!isMaxOrHigher) {
                const improvedNoise = this.minLimitNoise.getOctaveNoise(octave)
                if (improvedNoise != null) {
                    minNoiseValue += improvedNoise.noise(x, y, z, yScale, cellY * yScale) / scale
                }
            }

            if (!isMinOrLower) {
                const improvedNoise = this.maxLimitNoise.getOctaveNoise(octave)
                if (improvedNoise != null) {
                    maxNoiseValue += improvedNoise.noise(x, y, z, yScale, cellY * yScale) / scale
                }
            }

            scale /= 2.0
        }

        return Mth.clampedLerp(minNoiseValue / 512.0, maxNoiseValue / 512.0, t) / 128.0
    }
}
