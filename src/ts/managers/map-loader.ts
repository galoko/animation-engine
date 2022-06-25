import { quat, vec3, vec4 } from "gl-matrix"
import { SimpleObject } from "../entities/object"
import { Capsule, Plane } from "../models/collision-primitives"
import { CollisionGroups, PhysicsDef } from "../models/physics-def"
import { CapsuleModelDef } from "../models/templates/capsule-def"
import { MinecraftModelDef } from "../models/templates/minecraft-voxel-model-def"
import { SimpleModelDef } from "../models/templates/simple-model-def"
import { TextureDef } from "../models/texture-def"
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
        const q = quat.create()
        quat.fromEuler(q, 0, 0, 0)

        const ground = new SimpleObject(
            {
                pos: vec3.fromValues(0, 0, 0),
                size: vec3.fromValues(500, 500, 1),
                rotation: q,
            },
            new SimpleModelDef("plane", {
                texMul: 25,
                alpha: true,
                colorOverride: vec4.fromValues(0, 0, 0, 0),
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

        const minecraftLand = new SimpleObject(
            {
                pos: vec3.fromValues(0, 0, 0),
                size: vec3.fromValues(1, 1, 1),
                rotation: quat.create(),
            },
            new MinecraftModelDef(),
            new TextureDef({ name: "minecraft-atlas", nn: true })
        )
        Services.world.add(minecraftLand)

        Services.inputManager.setEntityToOrbit(player, 5)
        Services.inputManager.setControlledEntity(player)
    }
}
