import { GameLoop } from "./external-services/game-loop"
import { Services } from "./external-services/services"

async function main() {
    await Services.init()
    GameLoop.start()
}

/*
function shutdown() {
    GameLoop.stop()
    Services.finalize()
}
*/

main()
