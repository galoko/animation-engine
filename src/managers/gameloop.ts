import { Services } from "./services"

export class GameLoop {
    private prevTime: number | undefined

    private tickBind = this.tick.bind(this)

    start(): void {
        requestAnimationFrame(this.tickBind)
    }

    private tick(time: number): void {
        const dt = this.prevTime != undefined ? time - this.prevTime : 0

        Services.physics.tick(dt)
        Services.render.draw()

        this.prevTime = time
        requestAnimationFrame(this.tickBind)
    }
}
