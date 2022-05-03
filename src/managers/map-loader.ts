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

        const builder = new OverworldBiomeBuilder()

        const output = [] as Pair<Climate.ParameterPoint, Biomes>[]
        builder.addBiomes(output)

        let p = 0
        for (const item of output) {
            const xRange = item.first.temperature
            const yRange = item.first.humidity
            const zRange = item.first.continentalness

            const x = Climate.unquantizeCoord(xRange.center)
            const y = Climate.unquantizeCoord(yRange.center)
            const z = Climate.unquantizeCoord(zRange.center)

            const sizeX = Climate.unquantizeCoord(xRange.length)
            const sizeY = Climate.unquantizeCoord(yRange.length)
            const sizeZ = Climate.unquantizeCoord(zRange.length)

            const color = 1

            const POS_MUL = 3.5
            const SIZE_MUL = 1

            const pos = vec3.fromValues(x * POS_MUL, y * POS_MUL, 3 + z * POS_MUL)

            const box = new Object(
                {
                    pos,
                    size: vec3.fromValues(sizeX * SIZE_MUL, sizeY * SIZE_MUL, sizeZ * SIZE_MUL),
                    rotation: quat.create(),
                },
                new SimpleModelDef("cube", {
                    colorOverride: vec4.fromValues(color, 0, 0, 0.6),
                    alpha: true,
                }),
                "blank"
            )
            Services.world.add(box)

            p++
        }
    }
}
