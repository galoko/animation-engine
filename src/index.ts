import { ServicesClass } from "./managers/services-class"
import { Services, setServices } from "./managers/services"

async function main() {
    const ammo = await Ammo()

    setServices(new ServicesClass({ ammo }))

    await Services.start()
}

main()
