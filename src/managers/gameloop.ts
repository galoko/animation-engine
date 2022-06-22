import { Services } from "./services"

export class GameLoop {
    private prevTime: number | undefined

    private tickBind = this.tick.bind(this)

    start(): void {
        requestAnimationFrame(this.tickBind)
    }

    private tick(time: number): void {
        let dt = this.prevTime != undefined ? time - this.prevTime : 0
        dt = 1000 / 60

        Services.inputManager.tick(dt)
        Services.physics.tick(dt)
        Services.inputManager.postPhysics()
        Services.render.draw()

        this.prevTime = time
        requestAnimationFrame(this.tickBind)
    }
}
