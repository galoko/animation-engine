import { Services } from "./services"

let lastTickTime: number | undefined = undefined

export class GameLoop {
    static start(): void {
        requestAnimationFrame(GameLoop.tick)
    }

    static pause(): void {
        //
    }

    static stop(): void {
        //
    }

    static tick(time: number): void {
        if (lastTickTime === undefined) {
            lastTickTime = time
        }

        const dt = (time - lastTickTime) / 1000
        lastTickTime = time

        Services.process(dt)

        requestAnimationFrame(GameLoop.tick)
    }
}
