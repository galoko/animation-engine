import Engine, { EmscriptenModule } from "../wasm/engine"
import EngineWasm from "../wasm/engine.wasm"

export let module: EmscriptenModule

export async function loadEngine(): Promise<void> {
    module = await Engine({
        wasmBinary: EngineWasm,
        print: console.log.bind(console),
        locateFile: (path: string) => `/build/wasm/${path}`,
        mainScriptUrlOrBlob: "/build/wasm/engine.js",
    })

    return
}
