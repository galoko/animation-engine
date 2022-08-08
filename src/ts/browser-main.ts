import { Engine, loadEngine } from "./engine-bridge/module"
import { GameLoop } from "./external-services/game-loop"
import { Services } from "./external-services/services"

async function main() {
    // load the engine first
    await loadEngine()
    Engine._init()

    Services.init()

    GameLoop.start()
}

function shutdown() {
    GameLoop.stop()

    Engine._finalize()
    Engine._print_memory_stats()

    //
}

main()
