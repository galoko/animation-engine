import { Engine, loadEngine } from "../engine-bridge/module"
import { Queues } from "../engine-bridge/queues"
import { GameLoop } from "./game-loop"
import { InputManager } from "./input-manager"
import { Render } from "./render"
import { ResourseManager } from "./resource-manager"

export class Services {
    static async init(): Promise<void> {
        await loadEngine()

        Queues.init()
        ResourseManager.init()
        Render.init()
        InputManager.init()
        GameLoop.init()
        Engine._init()
    }

    static process(dt: number): void {
        // engine tick
        Engine._tick(dt)
        // resolve output queue messages
        Queues.processOutputQueue()
    }

    static finalize(): void {
        Engine._finalize()
        GameLoop.finalize()
        InputManager.finalize()
        Render.finalize()
        ResourseManager.finalize()
        Queues.finalize()

        Engine._print_memory_stats()
    }
}
