import { Engine, loadEngine } from "./engine-bridge/module"

function delay(timeout: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, timeout))
}

export async function test(): Promise<void> {
    await loadEngine()

    Engine._init()

    await delay(5000)

    const startTime = performance.now()
    Engine._test()
    const endTime = performance.now()

    const ok = Engine._check()

    const ms_int = Math.round(endTime - startTime)
    alert(`${ms_int} ms`)

    alert(ok ? "ok" : "NOT OK")

    Engine._finalize()

    Engine._print_memory_stats()
}
