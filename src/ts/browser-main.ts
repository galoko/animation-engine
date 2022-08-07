import { module, loadEngine } from "./engine-bridge"

function test(): void {
    module._init()

    const startTime = performance.now()
    module._test()
    const endTime = performance.now()

    const ok = module._check()

    const ms_int = Math.round(endTime - startTime)
    alert(`${ms_int} ms`)

    alert(ok ? "ok" : "NOT OK")

    module._finalize()

    module._print_memory_stats()
}

async function main() {
    // load the engine first
    await loadEngine()

    test()
}

main()
