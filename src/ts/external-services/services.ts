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

        Services.test()
    }

    private static async test(): Promise<void> {
        Render.setCamera(vec3.fromValues(0, 10, 0), vec3.fromValues(10, 0, 0))

        const transform = mat4.create()

        mat4.identity(transform)
        mat4.translate(transform, transform, vec3.fromValues(10, 0, 0))
        mat4.scale(transform, transform, vec3.fromValues(2, 2, 5))

        const capsule = await createPrimitive(
            PrimitiveType.Capsule,
            vec4.fromValues(1, 0, 0, 1),
            transform
        )
        Render.addEntity(capsule)

        mat4.identity(transform)
        mat4.translate(transform, transform, vec3.fromValues(10, 0, -2.5))
        mat4.scale(transform, transform, vec3.fromValues(10, 10, 1))
        const ground = await createPrimitive(
            PrimitiveType.Plane,
            vec4.fromValues(0, 0, 1, 1),
            transform
        )
        Render.addEntity(ground)
    }

    static process(dt: number): void {
        // engine tick
        // Engine._tick(dt)
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
