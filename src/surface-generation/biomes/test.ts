import { NoiseGeneratorSettings, NoiseSampler } from "./chunk-generator"
import { toInt } from "./mth"
import { IntStream } from "./noise/perlin-noise"
import { PerlinSimplexNoise } from "./noise/perlin-simplex-noise"
import { WorldgenRandom, XoroshiroRandomSource } from "./random"

function same(n1, n2, e) {
    return Math.abs(n2 - n1) <= e
}

export function test() {
    const settings = NoiseGeneratorSettings.OVERWORLD
    const noiseSettings = settings.noiseSettings
    const sampler = new NoiseSampler(noiseSettings, 0xdeadbeafdeadbeafn, settings.randomSource)

    const canvas = document.createElement("canvas")
    canvas.width = 1024
    canvas.height = 1024

    canvas.style.width = canvas.width * 1 + "px"
    canvas.style.height = canvas.height * 1 + "px"

    const ctx = canvas.getContext("2d")!

    const data = ctx.getImageData(0, 0, canvas.width, canvas.height)

    for (let x = 0; x < data.width; x++) {
        for (let y = 0; y < data.height; y++) {
            // const x = 520
            // const y = 538
            const p = sampler.sample(x, y, 100)
            // debugger

            const v = Math.trunc(8388608 + p.temperature + p.depth + p.erosion + p.humidity) | 0

            data.data[(y * data.width + x) * 4 + 0] = (v >> 16) & 255
            data.data[(y * data.width + x) * 4 + 1] = (v >> 8) & 255
            data.data[(y * data.width + x) * 4 + 2] = v & 255
            data.data[(y * data.width + x) * 4 + 3] = 255
        }
    }

    ctx.putImageData(data, 0, 0)

    document.body.appendChild(canvas)
}
