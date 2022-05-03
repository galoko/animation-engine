import { mat4, quat, vec3, vec4 } from "gl-matrix"
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

        const min = vec3.fromValues(Infinity, Infinity, Infinity)
        const max = vec3.fromValues(-Infinity, -Infinity, -Infinity)

        const minBiome = vec3.fromValues(Infinity, Infinity, Infinity)
        const maxBiome = vec3.fromValues(-Infinity, -Infinity, -Infinity)

        const POS_MUL = 1
        const SIZE_MUL = 1

        const POS_TRANSFORM = mat4.create()
        mat4.translate(POS_TRANSFORM, POS_TRANSFORM, vec3.fromValues(0, 0, 1.5))
        mat4.scale(POS_TRANSFORM, POS_TRANSFORM, vec3.fromValues(POS_MUL, POS_MUL, POS_MUL))

        const SIZE_TRANSFORM = mat4.create()
        mat4.scale(SIZE_TRANSFORM, SIZE_TRANSFORM, vec3.fromValues(SIZE_MUL, SIZE_MUL, SIZE_MUL))

        const biomeToShow = Biomes.FROZEN_RIVER

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

            const pos = vec3.fromValues(x, y, z)
            const size = vec3.fromValues(sizeX, sizeY, sizeZ)

            vec3.transformMat4(pos, pos, POS_TRANSFORM)
            vec3.transformMat4(size, size, SIZE_TRANSFORM)

            const box = new Object(
                {
                    pos,
                    size,
                    rotation: quat.create(),
                },
                new SimpleModelDef("cube", {
                    colorOverride: vec4.fromValues(color, 0, 0, 1),
                    alpha: true,
                }),
                "blank"
            )
            if (item.second === biomeToShow) {
                vec3.min(
                    minBiome,
                    minBiome,
                    vec3.fromValues(
                        Climate.unquantizeCoord(xRange.min),
                        Climate.unquantizeCoord(yRange.min),
                        Climate.unquantizeCoord(zRange.min)
                    )
                )

                vec3.max(
                    maxBiome,
                    maxBiome,
                    vec3.fromValues(
                        Climate.unquantizeCoord(xRange.max),
                        Climate.unquantizeCoord(yRange.max),
                        Climate.unquantizeCoord(zRange.max)
                    )
                )

                Services.world.add(box)
            }

            vec3.min(
                min,
                min,
                vec3.fromValues(
                    Climate.unquantizeCoord(xRange.min),
                    Climate.unquantizeCoord(yRange.min),
                    Climate.unquantizeCoord(zRange.min)
                )
            )

            vec3.max(
                max,
                max,
                vec3.fromValues(
                    Climate.unquantizeCoord(xRange.max),
                    Climate.unquantizeCoord(yRange.max),
                    Climate.unquantizeCoord(zRange.max)
                )
            )
        }

        vec3.transformMat4(min, min, SIZE_TRANSFORM)
        vec3.transformMat4(min, min, POS_TRANSFORM)
        vec3.transformMat4(max, max, SIZE_TRANSFORM)
        vec3.transformMat4(max, max, POS_TRANSFORM)

        vec3.transformMat4(minBiome, minBiome, SIZE_TRANSFORM)
        vec3.transformMat4(minBiome, minBiome, POS_TRANSFORM)
        vec3.transformMat4(maxBiome, maxBiome, SIZE_TRANSFORM)
        vec3.transformMat4(maxBiome, maxBiome, POS_TRANSFORM)

        Services.render.addDebugRect(min, max, 0x00ff00, 0xff0000, 0x0000ff)

        Services.render.addText(
            "temperature",
            vec3.fromValues((min[0] + max[0]) * 0.5, max[1], max[2])
        )
        Services.render.addText("cold", vec3.fromValues(min[0], max[1], max[2]))
        Services.render.addText("hot", vec3.fromValues(max[0], max[1], max[2] + 0.1))

        Services.render.addText(
            "humidity",
            vec3.fromValues(max[0], (min[1] + max[1]) * 0.5, max[2])
        )
        Services.render.addText("dry", vec3.fromValues(max[0], min[1], max[2]))
        Services.render.addText("humid", vec3.fromValues(max[0], max[1], max[2]))

        Services.render.addText(
            "continentalness",
            vec3.fromValues(max[0], max[1], (min[2] + max[2]) * 0.5)
        )

        Services.render.addText("ocean", vec3.fromValues(max[0], max[1], min[2]))
        Services.render.addText("center", vec3.fromValues(max[0], max[1], max[2] - 0.1))

        const center = vec3.create()
        vec3.lerp(center, minBiome, maxBiome, 0.5)
        Services.render.addText(biomeToShow.toUpperCase(), center)
    }
}
