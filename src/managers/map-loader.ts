import { quat, vec3 } from "gl-matrix"
import { Object } from "../entities/object"
import { Capsule, Plane, Sphere } from "../models/collision-primitives"
import { PhysicsDef } from "../models/physics-def"
import { CapsuleModelDef } from "../models/templates/capsule-def"
import { SimpleModelDef } from "../models/templates/simple-model-def"
import { randomRange, sfc32, xmur3 } from "../utils/random-utils"
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
                size: vec3.fromValues(50, 50, 1),
                rotation: quat.create(),
            },
            new SimpleModelDef("plane", {
                texMul: 25,
            }),
            "grass2.jpg",
            new PhysicsDef({
                isStatic: true,
            }),
            new Plane()
        )
        Services.world.add(ground)

        // Create xmur3 state:
        const seed = xmur3("suchok")
        // Output four 32-bit hashes to provide the seed for sfc32.
        const rand = sfc32(seed(), seed(), seed(), seed())

        for (let i = 0; i < 100; i++) {
            const size = randomRange(0.5, 3, rand)

            const x = randomRange(-25, 25, rand)
            const y = randomRange(-25, 25, rand)

            const rock = new Object(
                {
                    pos: vec3.fromValues(x, y, randomRange(0, 0.5, rand) + size / 2),
                    size: vec3.fromValues(size, size, size),
                    rotation: quat.create(),
                },
                new SimpleModelDef("sphere", {
                    texMul: 1,
                }),
                "rock.jpg",
                new PhysicsDef({
                    isStatic: true,
                }),
                new Sphere()
            )
            Services.world.add(rock)
        }

        const player = new Object(
            {
                pos: vec3.fromValues(0, 2.61, 10),
                size: vec3.fromValues(1, 1, 1.8),
                rotation: quat.create(),
            },
            new CapsuleModelDef(),
            "blank",
            new PhysicsDef({
                noRotation: true,
                friction: 0.9,
            }),
            new Capsule()
        )
        Services.world.add(player)

        Services.inputManager.setEntityToOrbit(player, 5)
        Services.inputManager.setControlledEntity(player)
    }
}