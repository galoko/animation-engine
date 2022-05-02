import { Biomes } from "./biomes"
import * as Climate from "./climate"
import { Pair } from "./consumer"
import { OverworldBiomeBuilder } from "./overworld-biome-builder"

export function test() {
    const builder = new OverworldBiomeBuilder()

    const output = [] as Pair<Climate.ParameterPoint, Biomes>[]
    builder.addBiomes(output)

    // eslint-disable-next-line no-debugger
    debugger
}
