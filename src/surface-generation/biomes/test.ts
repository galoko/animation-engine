import { Biomes } from "./biomes"
import { NoiseSamplingSettings } from "./chunk-generator"
import * as Climate from "./climate"
import { Pair } from "./consumer"
import { BlendedNoise } from "./noise/blended-noise"
import { NormalNoise } from "./noise/normal-noise"
import { PerlinNoise } from "./noise/perlin-noise"
import { OverworldBiomeBuilder } from "./overworld-biome-builder"
import { hashCode, LegacyRandomSource, XoroshiroRandomSource } from "./random"

function same(n1, n2, e) {
    return Math.abs(n2 - n1) <= e
}

export function test() {
    const noise = BlendedNoise.create(
        new XoroshiroRandomSource(5125125125n),
        new NoiseSamplingSettings(1, 1, 1, 1),
        64,
        64
    )

    const canvas = document.createElement("canvas")
    canvas.width = 1024
    canvas.height = 1024

    canvas.style.width = canvas.width * 6 + "px"
    canvas.style.height = canvas.height * 6 + "px"

    const ctx = canvas.getContext("2d")!

    const data = ctx.getImageData(0, 0, canvas.width, canvas.height)

    for (let x = 0; x < data.width; x++) {
        for (let y = 0; y < data.height; y++) {
            const value = noise.calculateNoise(x * 1000, y * 1000, 0)

            const v = Math.trunc(((value + 1) / 2) * 255)
            data.data[(y * data.width + x) * 4 + 0] = (v >> 16) & 255
            data.data[(y * data.width + x) * 4 + 1] = (v >> 8) & 255
            data.data[(y * data.width + x) * 4 + 2] = v & 255
            data.data[(y * data.width + x) * 4 + 3] = 255
        }
    }

    ctx.putImageData(data, 0, 0)

    document.body.appendChild(canvas)
}
