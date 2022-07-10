import Cpp, { EmscriptenModule } from "../wasm/cpp"
import CppWasm from "../wasm/cpp.wasm"

export let module: EmscriptenModule

export async function loadWASM(): Promise<void> {
    module = await Cpp({
        wasmBinary: CppWasm,
        print: console.log.bind(console),
        locateFile: (path: string) => `/build/wasm/${path}`,
        mainScriptUrlOrBlob: "/build/wasm/cpp.js",
    })

    return
}
