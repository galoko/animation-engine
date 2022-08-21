import { loadEngine } from "./engine-bridge/module"
import { GameLoop } from "./external-services/game-loop"
import { Services } from "./external-services/services"
import { test } from "./test"

async function main() {
    await loadEngine()
    test()

    // await Services.init()
    // GameLoop.start()
}

/*
function shutdown() {
    GameLoop.stop()
    Services.finalize()
}
*/

main()
