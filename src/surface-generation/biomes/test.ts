import { BiomeManager, MultiNoiseBiomeSource } from "./biome-source"
import {
    Blender,
    ChunkGenerator,
    ChunkPos,
    NoiseBasedChunkGenerator,
    NoiseGeneratorSettings,
    NoiseSampler,
} from "./chunk-generator"
import { Mth } from "./mth"
import { IntStream } from "./noise/perlin-noise"
import { PerlinSimplexNoise } from "./noise/perlin-simplex-noise"
import { OverworldBiomeBuilder } from "./overworld-biome-builder"
import { hashCode, WorldgenRandom, XoroshiroRandomSource } from "./random"
import { Climate } from "./climate"
import { Pair } from "./consumer"
import { Biomes } from "./biomes"
import { BlockPos, MutableBlockPos } from "./pos"
import { BIOME_TO_COLOR } from "../../managers/map-loader"
import { ServerLevel } from "./level"
import { LevelHeightAccessor, ProtoChunk } from "./chunks"
import { ChunkStatus } from "./chunk-status"
import { BLOCKS } from "./test-template"

function same(n1, n2, e) {
    return Math.abs(n2 - n1) <= e
}

export function test() {
    const seed = Mth.toLong(hashCode("test"))

    // get list of biomes
    const builder = new OverworldBiomeBuilder()
    const biomes = [] as Pair<Climate.ParameterPoint, Biomes>[]
    builder.addBiomes(biomes)

    const biomeSource = new MultiNoiseBiomeSource(biomes)
    const settings = NoiseGeneratorSettings.OVERWORLD
    const chunkGenerator = new NoiseBasedChunkGenerator(biomeSource, seed, settings)

    const heightAccessor = new LevelHeightAccessor()

    const chunkPos = new ChunkPos(7, 24)
    const chunk = new ProtoChunk(chunkPos, heightAccessor)

    ChunkStatus.BIOMES.generate(null!, chunkGenerator, chunkAccess => chunkAccess, [chunk])
    ChunkStatus.NOISE.generate(null!, chunkGenerator, chunkAccess => chunkAccess, [chunk])

    let result = "const BLOCKS = ["

    const pos = new MutableBlockPos()
    let i = 0
    for (let x = 0; x < 16; x++) {
        for (let z = 0; z < 16; z++) {
            for (let y = -64; y < 256; y++) {
                pos.set(x, y, z)
                const block = chunk.getBlockState(pos)
                const templateBlock = BLOCKS[i++]
                if (block !== templateBlock) {
                    debugger
                }
                result += "'" + block + "', \n"
            }
        }
    }
    result += "]"
    console.log(result)
    debugger

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
