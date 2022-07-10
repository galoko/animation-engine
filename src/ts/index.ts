// import { ServicesClass } from "./managers/services-class"
// import { Services, setServices } from "./managers/services"
import { loadWASM } from "./cpp-bridge"
import { test } from "./surface-generation/biomes/test"

async function main() {
    await loadWASM()

    test()

    /*
    const ammo = await Ammo()

    setServices(new ServicesClass({ ammo }))

    await Services.start()
    */
}

main()
