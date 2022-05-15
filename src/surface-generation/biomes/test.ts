import { Biomes } from "./biomes"
import * as Climate from "./climate"
import { Pair } from "./consumer"
import { OverworldBiomeBuilder } from "./overworld-biome-builder"
import { hashCode, XoroshiroRandomSource } from "./random"

function same(n1, n2, e) {
    return Math.abs(n2 - n1) <= e
}

export function test() {
    const builder = new OverworldBiomeBuilder()

    const output = [] as Pair<Climate.ParameterPoint, Biomes>[]
    builder.addBiomes(output)

    const src = new XoroshiroRandomSource(1515125125n, 15125125232n)
    const fork = src.forkPositional()

    const i = fork.fromHashOf("padla")
    const l = i.nextLong()

    const hash = hashCode("padlapadlapadlapadlapadlapadla")

    // eslint-disable-next-line no-debugger
    debugger
}
