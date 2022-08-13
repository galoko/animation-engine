let lastTickTime: number | undefined = undefined

type ProcessMethod = (dt: number) => void

export class GameLoop {
    static process: ProcessMethod

    static init(process: ProcessMethod): void {
        GameLoop.process = process
    }

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

        GameLoop.process(dt)

        requestAnimationFrame(GameLoop.tick)
    }

    static finalize(): void {
        //
    }
}
