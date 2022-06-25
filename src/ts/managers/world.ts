import { Entity } from "../entities/entity"
import { Services } from "./services"

export class World {
    add(entity: Entity): void {
        Services.render.add(entity)
        Services.physics.add(entity)
    }
}
