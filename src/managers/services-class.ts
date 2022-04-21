import { Render } from "./render"
import { Physics } from "./physics"
import { ResourceManager } from "./resource-manager"
import { World } from "./world"
import { GameLoop } from "./gameloop"
import { MapLoader } from "./map-loader"
import { InputManager } from "./input-manager"

export class ServicesClass {
    readonly render: Render
    readonly physics: Physics
    readonly inputManager: InputManager
    readonly resources: ResourceManager
    readonly world: World
    readonly mapLoader: MapLoader
    readonly loop: GameLoop

    constructor(options: { ammo: typeof Ammo }) {
        const canvas = document.createElement("canvas")
        document.body.appendChild(canvas)

        this.render = new Render(canvas)
        this.physics = new Physics(options.ammo)
        this.inputManager = new InputManager(canvas)
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
