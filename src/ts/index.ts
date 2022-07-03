/*
import { ServicesClass } from "./managers/services-class"
import { Services, setServices } from "./managers/services"
*/
import Cpp, { EmscriptenModule } from "../wasm/cpp"
import CppWasm from "../wasm/cpp.wasm"
import { Biomes } from "./surface-generation/biomes/biomes"
import { Climate } from "./surface-generation/biomes/climate"
import { Pair } from "./surface-generation/biomes/consumer"
import { OverworldBiomeBuilder } from "./surface-generation/biomes/overworld-biome-builder"

/*
async function main() {
    const ammo = await Ammo()

    setServices(new ServicesClass({ ammo }))

    await Services.start()
}
*/

async function loadWASM(): Promise<EmscriptenModule> {
    return Cpp({
        wasmBinary: CppWasm,
        print: console.log.bind(console),
        locateFile: (path: string) => `/build/wasm/${path}`,
        mainScriptUrlOrBlob: "/build/wasm/cpp.js",
    })
}

async function test_cpp() {
    const module = await loadWASM()
    module._init()
}

test_cpp()

function test_js() {
    const builder = new OverworldBiomeBuilder()

    const biomes = [] as Pair<Climate.ParameterPoint, Biomes>[]
    builder.addBiomes(biomes)

    for (const pair of biomes) {
        console.log(pair.second)
    }

    console.log("done")
}

test_js()

// main()
