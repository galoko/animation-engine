import { Render } from "./render"
import { Physics } from "./physics"
import { ResourceManager } from "./resource-manager"
import { World } from "./world"
import { GameLoop } from "./gameloop"

export class ServicesClass {
    readonly render: Render
    readonly physics: Physics
    readonly resources: ResourceManager
    readonly world: World
    readonly loop: GameLoop

    constructor(options: { ammo: typeof Ammo }) {
        this.render = new Render()
        this.physics = new Physics(options.ammo)
        this.resources = new ResourceManager()
        this.world = new World()
        this.loop = new GameLoop()
    }

    start(): void {
        this.loop.start()
    }
}
