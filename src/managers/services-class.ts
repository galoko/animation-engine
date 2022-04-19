import { Render } from "./render"
import { Physics } from "./physics"
import { ResourceManager } from "./resource-manager"
import { World } from "./world"
import { GameLoop } from "./gameloop"
import { MapLoader } from "./map-loader"

export class ServicesClass {
    readonly render: Render
    readonly physics: Physics
    readonly resources: ResourceManager
    readonly world: World
    readonly mapLoader: MapLoader
    readonly loop: GameLoop

    constructor(options: { ammo: typeof Ammo }) {
        this.render = new Render()
        this.physics = new Physics(options.ammo)
        this.resources = new ResourceManager()
        this.world = new World()
        this.mapLoader = new MapLoader()
        this.loop = new GameLoop()
    }

    async start(): Promise<void> {
        await this.mapLoader.loadMap("test")
        await this.resources.waitForLoading()

        this.loop.start()
    }
}
