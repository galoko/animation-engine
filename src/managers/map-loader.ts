import { quat, vec3, vec4 } from "gl-matrix"
import { Object } from "../entities/object"
import { Box, Capsule, Plane, Sphere } from "../models/collision-primitives"
import { CollisionGroups, PhysicsDef } from "../models/physics-def"
import { CapsuleModelDef } from "../models/templates/capsule-def"
import { SimpleModelDef } from "../models/templates/simple-model-def"
import { Services } from "./services"

import { Biomes } from "../surface-generation/biomes/biomes"
import * as Climate from "../surface-generation/biomes/climate"
import { Pair } from "../surface-generation/biomes/consumer"
import { OverworldBiomeBuilder } from "../surface-generation/biomes/overworld-biome-builder"

export class MapLoader {
    async loadMap(mapName: string) {
        if (mapName === "test") {
            await this.loadTestMap()
        } else {
            throw new Error("TODO")
        }
    }

    private loadTestMap() {
        const q = quat.create()
        quat.fromEuler(q, 0, 0, 0)

        const ground = new Object(
            {
                pos: vec3.fromValues(0, 0, 0),
                size: vec3.fromValues(50, 50, 1),
                rotation: q,
            },
            new SimpleModelDef("plane", {
                texMul: 25,
            }),
            "grass2.jpg",
            new PhysicsDef({
                isStatic: true,
                bakedTransform: true,
            }),
            new Plane()
        )
        Services.world.add(ground)

        const player = new Object(
            {
                pos: vec3.fromValues(0, 2.61, 1.8 / 2),
                size: vec3.fromValues(1, 1, 1.8),
                rotation: quat.create(),
            },
            new CapsuleModelDef(),
            "blank",
            new PhysicsDef({
                noRotation: true,
                friction: 0.9,
                collisionGroup: CollisionGroups.PLAYER,
            }),
            new Capsule()
        )
        Services.world.add(player)

        Services.inputManager.setEntityToOrbit(player, 5)
        Services.inputManager.setControlledEntity(player)

        // const builder = new OverworldBiomeBuilder()

        // const output = [] as Pair<Climate.ParameterPoint, Biomes>[]
        // builder.addBiomes(output)

        // for ()

        for (let x = 0; x < 5; x++) {
            for (let y = 0; y < 5; y++) {
                const box = new Object(
                    {
                        pos: vec3.fromValues(x, y, 1.8 / 2),
                        size: vec3.fromValues(0.75, 0.75, 0.75),
                        rotation: quat.create(),
                    },
                    new SimpleModelDef("cube", {
                        colorOverride: vec4.fromValues(x / 5, y / 5, 0.5, 0.5),
                        alpha: true,
                    }),
                    "blank"
                )
                Services.world.add(box)
            }
        }
    }
}
