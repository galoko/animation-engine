import { BiomeManager, MultiNoiseBiomeSource } from "./biome-source"
import {
    ChunkGenerator,
    NoiseBasedChunkGenerator,
    NoiseGeneratorSettings,
    NoiseSampler,
} from "./chunk-generator"
import { clamp } from "./mth"
import { IntStream } from "./noise/perlin-noise"
import { PerlinSimplexNoise } from "./noise/perlin-simplex-noise"
import { OverworldBiomeBuilder } from "./overworld-biome-builder"
import { WorldgenRandom, XoroshiroRandomSource } from "./random"
import * as Climate from "./climate"
import { Pair } from "./consumer"
import { Biomes } from "./biomes"
import { BlockPos } from "./pos"
import { BIOME_TO_COLOR } from "../../managers/map-loader"

function same(n1, n2, e) {
    return Math.abs(n2 - n1) <= e
}

export function test() {
    const seed = 0xdeadbeafdeadn

    const builder = new OverworldBiomeBuilder()
    const biomes = [] as Pair<Climate.ParameterPoint, Biomes>[]
    builder.addBiomes(biomes)

    const biomeSource = new MultiNoiseBiomeSource(biomes)
    const settings = NoiseGeneratorSettings.OVERWORLD
    const noiseBiomeSource = new NoiseBasedChunkGenerator(biomeSource, seed, settings)
    const biomeMananager = new BiomeManager(noiseBiomeSource, seed)

    /*
    const noiseSettings = settings.noiseSettings
    const sampler = new NoiseSampler(noiseSettings, 0xdeadbeafdeadbeafn, settings.randomSource)
    */

    const canvas = document.createElement("canvas")
    canvas.width = 128
    canvas.height = 128

    canvas.style.width = canvas.width * 1 + "px"
    canvas.style.height = canvas.height * 1 + "px"

    const ctx = canvas.getContext("2d")!

    const data = ctx.getImageData(0, 0, canvas.width, canvas.height)

    console.time("generation")

    for (let x = 0; x < data.width; x++) {
        for (let y = 0; y < data.height; y++) {
            // const x = 520
            // const y = 538
            const p = biomeMananager.getBiome(new BlockPos(x * 20, 256, y * 20))
            const c = BIOME_TO_COLOR[p] ?? 0
            // debugger

            /*
            const t = clamp((p.continentalness / 10000 + 1) / 2, 0, 1)
            const h = Math.round((1 - t) * 240)
            // const v = Math.trunc(8388608 + p.temperature + p.depth + p.erosion + p.humidity) | 0

            ctx.fillStyle = `hsl(${h}, 100%, 50%)`
            const v = parseInt(ctx.fillStyle.slice(1), 16)
            */

            // const v = (8388608 + p.temperature + p.depth + p.erosion + p.humidity) | 0

            data.data[(y * data.width + x) * 4 + 0] = (c >> 16) & 255
            data.data[(y * data.width + x) * 4 + 1] = (c >> 8) & 255
            data.data[(y * data.width + x) * 4 + 2] = c & 255
            data.data[(y * data.width + x) * 4 + 3] = 255
        }
    }

    console.timeEnd("generation")

    ctx.putImageData(data, 0, 0)

    document.body.appendChild(canvas)
}
