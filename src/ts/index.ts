/*
import { ServicesClass } from "./managers/services-class"
import { Services, setServices } from "./managers/services"
*/
import Cpp, { EmscriptenModule } from "../wasm/cpp"
import CppWasm from "../wasm/cpp.wasm"

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

// main()

test_cpp()
