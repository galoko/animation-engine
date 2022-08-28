import { mat4, vec3, vec4 } from "gl-matrix"
import { Engine, loadEngine } from "../engine-bridge/module"
import { Queues } from "../engine-bridge/queues"
import { GameLoop } from "./game-loop"
import { InputManager } from "./input-manager"
import { createPrimitive, PrimitiveType } from "./render/primitives"
import { Render } from "./render/render"
import { ResourceManager } from "./resources/resource-manager"

export class Services {
    static async init(): Promise<void> {
        await loadEngine()

        Queues.init()
        ResourceManager.init()
        Render.init()
        InputManager.init()
        GameLoop.init(Services.process)
        Engine._init()
    }

    static process(dt: number): void {
        // engine tick
        Engine._tick(dt)
        // resolve output queue messages
        Queues.processOutputQueue()
        // render
        Render.render()
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
