import { ServicesClass } from "./managers/services-class"
import { Services, setServices } from "./managers/services"
import { test2 } from "./surface-generation/biomes/test"

async function main() {
    const ammo = await Ammo()

    setServices(new ServicesClass({ ammo }))

    await Services.start()
}

// test2()

setTimeout(main, 5000)
