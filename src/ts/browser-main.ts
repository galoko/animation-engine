import { GameLoop } from "./external-services/game-loop"
import { Services } from "./external-services/services"
import { test } from "./test"

async function main() {
    await Services.init()
    GameLoop.start()
}

// main()

test()
