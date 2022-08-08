import EngineStartup, { EmscriptenModule } from "../../wasm/engine"
import EngineWasm from "../../wasm/engine.wasm"

export let Engine: EmscriptenModule

export async function loadEngine(): Promise<void> {
    Engine = await EngineStartup({
        wasmBinary: EngineWasm,
        print: console.log.bind(console),
        locateFile: (path: string) => `/build/wasm/${path}`,
        mainScriptUrlOrBlob: "/build/wasm/engine.js",
    })

    return
}
