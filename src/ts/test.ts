import { Engine } from "./engine-bridge/module"

export function test(): void {
    Engine._init()

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
