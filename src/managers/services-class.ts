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
        const canvasWebGL = document.createElement("canvas")
        const canvas2D = document.createElement("canvas")
        canvas2D.style.pointerEvents = "none"
        document.body.appendChild(canvasWebGL)
        document.body.appendChild(canvas2D)

        this.render = new Render(canvasWebGL, canvas2D)
        this.physics = new Physics(options.ammo)
        this.inputManager = new InputManager(canvasWebGL)
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
