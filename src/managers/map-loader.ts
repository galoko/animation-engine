import { mat4, quat, vec3, vec4 } from "gl-matrix"
import { SimpleObject } from "../entities/object"
import { Box, Capsule, Plane, Sphere } from "../models/collision-primitives"
import { CollisionGroups, PhysicsDef } from "../models/physics-def"
import { CapsuleModelDef } from "../models/templates/capsule-def"
import { SimpleModelDef } from "../models/templates/simple-model-def"
import { Services } from "./services"

import { Biomes } from "../surface-generation/biomes/biomes"
import { Climate } from "../surface-generation/biomes/climate"
import { Pair } from "../surface-generation/biomes/consumer"
import { OverworldBiomeBuilder } from "../surface-generation/biomes/overworld-biome-builder"
import { colorToRGBA } from "./render"

export const BIOME_TO_COLOR: Partial<{ [key in Biomes]: number }> = {}
BIOME_TO_COLOR[Biomes.THE_VOID] = 0x000000
BIOME_TO_COLOR[Biomes.PLAINS] = 0x00cc00
BIOME_TO_COLOR[Biomes.SUNFLOWER_PLAINS] = 0xffff66
BIOME_TO_COLOR[Biomes.SNOWY_PLAINS] = 0xccffff
BIOME_TO_COLOR[Biomes.ICE_SPIKES] = 0xccffff
BIOME_TO_COLOR[Biomes.DESERT] = 0xffcc66
BIOME_TO_COLOR[Biomes.SWAMP] = 0x006666
BIOME_TO_COLOR[Biomes.FOREST] = 0x009933
BIOME_TO_COLOR[Biomes.FLOWER_FOREST] = 0xcae03a
BIOME_TO_COLOR[Biomes.BIRCH_FOREST] = 0xd6dea6
BIOME_TO_COLOR[Biomes.DARK_FOREST] = 0x183615
BIOME_TO_COLOR[Biomes.OLD_GROWTH_BIRCH_FOREST] = 0xd6dea6
BIOME_TO_COLOR[Biomes.OLD_GROWTH_PINE_TAIGA] = 0x009933
BIOME_TO_COLOR[Biomes.OLD_GROWTH_SPRUCE_TAIGA] = 0x009933
BIOME_TO_COLOR[Biomes.TAIGA] = 0x071705
BIOME_TO_COLOR[Biomes.SNOWY_TAIGA] = 0x364034
BIOME_TO_COLOR[Biomes.SAVANNA] = 0x849626
BIOME_TO_COLOR[Biomes.SAVANNA_PLATEAU] = 0x909c54
BIOME_TO_COLOR[Biomes.WINDSWEPT_HILLS] = 0x2e612c
BIOME_TO_COLOR[Biomes.WINDSWEPT_GRAVELLY_HILLS] = 0x445744
BIOME_TO_COLOR[Biomes.WINDSWEPT_FOREST] = 0x2f4d2f
BIOME_TO_COLOR[Biomes.WINDSWEPT_SAVANNA] = 0x656e47
BIOME_TO_COLOR[Biomes.JUNGLE] = 0x18c71a
BIOME_TO_COLOR[Biomes.SPARSE_JUNGLE] = 0x8ac26e
BIOME_TO_COLOR[Biomes.BAMBOO_JUNGLE] = 0x38b832
BIOME_TO_COLOR[Biomes.BADLANDS] = 0xbd6920
BIOME_TO_COLOR[Biomes.ERODED_BADLANDS] = 0xb3743e
BIOME_TO_COLOR[Biomes.WOODED_BADLANDS] = 0xc79044
BIOME_TO_COLOR[Biomes.MEADOW] = 0x4cc22f
BIOME_TO_COLOR[Biomes.GROVE] = 0x80997a
BIOME_TO_COLOR[Biomes.SNOWY_SLOPES] = 0xe2e6e1
BIOME_TO_COLOR[Biomes.FROZEN_PEAKS] = 0xb8c8d4
BIOME_TO_COLOR[Biomes.JAGGED_PEAKS] = 0x95999c
BIOME_TO_COLOR[Biomes.STONY_PEAKS] = 0x686869
BIOME_TO_COLOR[Biomes.RIVER] = 0x4a73a8
BIOME_TO_COLOR[Biomes.FROZEN_RIVER] = 0x7ba2d4
BIOME_TO_COLOR[Biomes.BEACH] = 0xf2f754
BIOME_TO_COLOR[Biomes.SNOWY_BEACH] = 0xcbcca3
BIOME_TO_COLOR[Biomes.STONY_SHORE] = 0xccd2d9
BIOME_TO_COLOR[Biomes.WARM_OCEAN] = 0x117dfa
BIOME_TO_COLOR[Biomes.LUKEWARM_OCEAN] = 0x3186e8
BIOME_TO_COLOR[Biomes.DEEP_LUKEWARM_OCEAN] = 0x2262ab
BIOME_TO_COLOR[Biomes.OCEAN] = 0x4883c7
BIOME_TO_COLOR[Biomes.DEEP_OCEAN] = 0x335e8f
BIOME_TO_COLOR[Biomes.COLD_OCEAN] = 0x5a7a9e
BIOME_TO_COLOR[Biomes.DEEP_COLD_OCEAN] = 0x3c5169
BIOME_TO_COLOR[Biomes.FROZEN_OCEAN] = 0x5a6e85
BIOME_TO_COLOR[Biomes.DEEP_FROZEN_OCEAN] = 0x3a4552
BIOME_TO_COLOR[Biomes.MUSHROOM_FIELDS] = 0xd67e74
BIOME_TO_COLOR[Biomes.DRIPSTONE_CAVES] = 0x0
BIOME_TO_COLOR[Biomes.LUSH_CAVES] = 0x0
BIOME_TO_COLOR[Biomes.NETHER_WASTES] = 0x0
BIOME_TO_COLOR[Biomes.WARPED_FOREST] = 0x0
BIOME_TO_COLOR[Biomes.CRIMSON_FOREST] = 0x0
BIOME_TO_COLOR[Biomes.SOUL_SAND_VALLEY] = 0x0
BIOME_TO_COLOR[Biomes.BASALT_DELTAS] = 0x0
BIOME_TO_COLOR[Biomes.THE_END] = 0x0
BIOME_TO_COLOR[Biomes.END_HIGHLANDS] = 0x0
BIOME_TO_COLOR[Biomes.END_MIDLANDS] = 0x0
BIOME_TO_COLOR[Biomes.SMALL_END_ISLANDS] = 0x0
BIOME_TO_COLOR[Biomes.END_BARRENS] = 0x0

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

        const ground = new SimpleObject(
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

        const player = new SimpleObject(
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

        /*

        const builder = new OverworldBiomeBuilder()

        const output = [] as Pair<Climate.ParameterPoint, Biomes>[]
        builder.addBiomes(output)

        const min = vec3.fromValues(Infinity, Infinity, Infinity)
        const max = vec3.fromValues(-Infinity, -Infinity, -Infinity)

        const POS_MUL = 1
        const SIZE_MUL = 1

        const POS_TRANSFORM = mat4.create()
        mat4.translate(POS_TRANSFORM, POS_TRANSFORM, vec3.fromValues(0, 0, 1.5))
        mat4.scale(POS_TRANSFORM, POS_TRANSFORM, vec3.fromValues(POS_MUL, POS_MUL, POS_MUL))

        const SIZE_TRANSFORM = mat4.create()
        mat4.scale(SIZE_TRANSFORM, SIZE_TRANSFORM, vec3.fromValues(SIZE_MUL, SIZE_MUL, SIZE_MUL))

        const biomesToShow = [Biomes.BIRCH_FOREST, Biomes.FOREST, Biomes.DARK_FOREST]

        const biomeBounds: Partial<{
            [key in Biomes]: {
                min: vec3
                max: vec3
            }
        }> = {}

        for (const item of output) {
            const { first: point, second: biome } = item

            const xRange = point.temperature
            const yRange = point.humidity
            const zRange = point.continentalness

            const x = Climate.unquantizeCoord(xRange.center)
            const y = Climate.unquantizeCoord(yRange.center)
            const z = Climate.unquantizeCoord(zRange.center)

            const sizeX = Climate.unquantizeCoord(xRange.length)
            const sizeY = Climate.unquantizeCoord(yRange.length)
            const sizeZ = Climate.unquantizeCoord(zRange.length)

            const color = BIOME_TO_COLOR[biome]!
            const rgba = colorToRGBA(color)

            const pos = vec3.fromValues(x, y, z)
            const size = vec3.fromValues(sizeX, sizeY, sizeZ)

            vec3.transformMat4(pos, pos, POS_TRANSFORM)
            vec3.transformMat4(size, size, SIZE_TRANSFORM)

            const box = new SimpleObject(
                {
                    pos,
                    size,
                    rotation: quat.create(),
                },
                new SimpleModelDef("cube", {
                    colorOverride: vec4.fromValues(rgba[0], rgba[1], rgba[2], 0.8),
                    alpha: true,
                }),
                "blank"
            )
            if (biomesToShow.includes(biome)) {
                let bounds = biomeBounds[biome]
                if (bounds === undefined) {
                    bounds = {
                        min: vec3.fromValues(Infinity, Infinity, Infinity),
                        max: vec3.fromValues(-Infinity, -Infinity, -Infinity),
                    }
                    biomeBounds[biome] = bounds
                }

                vec3.min(
                    bounds.min,
                    bounds.min,
                    vec3.fromValues(
                        Climate.unquantizeCoord(xRange.min),
                        Climate.unquantizeCoord(yRange.min),
                        Climate.unquantizeCoord(zRange.min)
                    )
                )

                vec3.max(
                    bounds.max,
                    bounds.max,
                    vec3.fromValues(
                        Climate.unquantizeCoord(xRange.max),
                        Climate.unquantizeCoord(yRange.max),
                        Climate.unquantizeCoord(zRange.max)
                    )
                )

                // Services.world.add(box)
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

        /*
        for (const biome of Object.keys(biomeBounds)) {
            const center = vec3.create()

            const bounds = biomeBounds[biome]
            vec3.transformMat4(bounds.min, bounds.min, SIZE_TRANSFORM)
            vec3.transformMat4(bounds.min, bounds.min, POS_TRANSFORM)
            vec3.transformMat4(bounds.max, bounds.max, SIZE_TRANSFORM)
            vec3.transformMat4(bounds.max, bounds.max, POS_TRANSFORM)

            vec3.lerp(center, bounds.min, bounds.max, 0.5)
            Services.render.addText(biome.toUpperCase(), center)

            const size = vec3.clone(bounds.max)
            vec3.sub(size, size, bounds.min)

            const color = BIOME_TO_COLOR[biome]!
            const rgba = colorToRGBA(color)

            const box = new SimpleObject(
                {
                    pos: center,
                    size,
                    rotation: quat.create(),
                },
                new SimpleModelDef("cube", {
                    colorOverride: vec4.fromValues(rgba[0], rgba[1], rgba[2], 0.6),
                    alpha: true,
                }),
                "blank"
            )

            Services.world.add(box)
        }
        */
    }
}
