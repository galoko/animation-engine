import { quat, vec3 } from "gl-matrix"
import { Object } from "../entities/object"
import { Capsule, Plane } from "../models/collision-primitives"
import { Services } from "./services"

export class MapLoader {
    async loadMap(mapName: string) {
        if (mapName === "test") {
            await this.loadTestMap()
        } else {
            throw new Error("TODO")
        }
    }

    private loadTestMap() {
        const ground = new Object(
            {
                pos: vec3.fromValues(0, 0, 0),
                size: vec3.fromValues(5, 5, 1),
                rotation: quat.create(),
            },
            "plane",
            "grass.jpg",
            new Plane()
        )
        Services.world.add(ground)

        const player = new Object(
            {
                pos: vec3.fromValues(0, 0, 1),
                size: vec3.fromValues(1, 1, 1),
                rotation: quat.create(),
            },
            "capsule",
            "blank",
            new Capsule()
        )
        Services.world.add(player)

        Services.render.setCamera(vec3.fromValues(3, 3, 3), vec3.fromValues(0, 0, 0))
    }
}
