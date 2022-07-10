/* eslint-disable no-debugger */
import { MultiNoiseBiomeSource } from "./biome-source"
import { ChunkPos, NoiseBasedChunkGenerator, NoiseGeneratorSettings } from "./chunk-generator"
import { Mth } from "./mth"
import { OverworldBiomeBuilder } from "./overworld-biome-builder"
import { hashCode } from "./random"
import { Climate } from "./climate"
import { Pair } from "./consumer"
import { Biomes, CPP_ID_TO_BIOME_NAME } from "./biomes"
import { MutableBlockPos } from "./pos"
import { LevelHeightAccessor, ProtoChunk } from "./chunks"
import { ChunkStatus } from "./chunk-status"
import { BLOCKS } from "./template-0-0"
import { module } from "../../cpp-bridge"
import { CPP_ID_TO_BLOCK_NAME } from "./blocks"

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

    const chunkPos = new ChunkPos(0, 0)
    const chunk = new ProtoChunk(chunkPos, heightAccessor)

    ChunkStatus.BIOMES.generate(null!, chunkGenerator, chunkAccess => chunkAccess, [chunk])
    ChunkStatus.NOISE.generate(null!, chunkGenerator, chunkAccess => chunkAccess, [chunk])

    let result = "const BLOCKS = ["

    const pos = new MutableBlockPos()
    let i = 0
    for (let y = -64; y < 256; y++) {
        for (let x = 0; x < 16; x++) {
            for (let z = 0; z < 16; z++) {
                pos.set(x, y, z)
                const block = chunk.getBlockState(pos)
                const templateBlock = BLOCKS[i++]
                if (block !== templateBlock) {
                    debugger
                    chunk.getBlockState(pos)
                    debugger
                }
                result += "'" + block + "', \n"
            }
        }
    }
    result += "]"

    try {
        const ptr = module._test()
        // debugger

        let result = "const BLOCKS = ["

        const pos = new MutableBlockPos()
        let i = 0
        for (let y = -64; y < 256; y++) {
            for (let x = 0; x < 16; x++) {
                for (let z = 0; z < 16; z++) {
                    pos.set(x, y, z)
                    const block = chunk.getBlockState(pos)
                    const templateBlock = CPP_ID_TO_BLOCK_NAME[module.HEAPU8[ptr + i]]
                    i++
                    if (block !== templateBlock) {
                        debugger
                    }
                    result += "'" + templateBlock + "', \n"
                }
            }
        }
        result += "]"

        /*
        const pos = new MutableBlockPos()
        let i = 0
        for (let y = -64 / 4; y < 256 / 4; y++) {
            for (let x = 0; x < 4; x++) {
                for (let z = 0; z < 4; z++) {
                    pos.set(x * 4, y * 4, z * 4)
                    const biome = chunk.getBiome(pos)
                    const templateBiome = CPP_ID_TO_BIOME_NAME[module.HEAPU8[ptr + i]]
                    i++
                    if (biome !== templateBiome) {
                        debugger
                    }
                    result += "'" + templateBiome + "', \n"
                }
            }
        }
        result += "]"
        */
        console.log(result)
    } catch (ptr) {
        module._print_exception(ptr)
    }

    debugger
}
