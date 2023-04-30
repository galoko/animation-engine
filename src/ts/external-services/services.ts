import { Engine, loadEngine } from "../engine-bridge/module"
import { Queues } from "../engine-bridge/queues"
import { GameLoop } from "./game-loop"
import { InputManager } from "./input-manager"
import { Render } from "./render/render"
import { initWebGPU } from "./render/render-context"
import { ResourceManager } from "./resources/resource-manager"

export class Services {
    static async init(): Promise<void> {
        await loadEngine()
        await initWebGPU()

        Queues.init()
        ResourceManager.init()
        await Render.init()
        InputManager.init()
        GameLoop.init(Services.process)
        Engine._init()

        await Render.setupTest()
    }

    static process(dt: number): void {
        // console.log("TICK")
        // engine tick
        Engine._tick(dt)
        // resolve output queue messages
        Queues.processOutputQueue()
        // render
        Render.render(dt)
    }

    static finalize(): void {
        Engine._finalize()
        GameLoop.finalize()
        InputManager.finalize()
        Render.finalize()
        ResourceManager.finalize()
        Queues.finalize()

        Engine._print_memory_stats()
    }
}
