import { quat, vec3, vec4 } from "gl-matrix"
import { SimpleObject } from "../entities/object"
import { Capsule, Plane } from "../models/collision-primitives"
import { CollisionGroups, PhysicsDef } from "../models/physics-def"
import { CapsuleModelDef } from "../models/templates/capsule-def"
import { SimpleModelDef } from "../models/templates/simple-model-def"
import { Services } from "./services"
import { Deferred } from "ts-deferred"

import { Biomes } from "../surface-generation/biomes/biomes"
import { ModelDef, ModelDefEntry } from "../models/model-def"

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
                alpha: true,
                colorOverride: vec4.fromValues(0, 1, 0, 0.1),
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
            "minecraft-atlas"
        )
        Services.world.add(minecraftLand)

        Services.inputManager.setEntityToOrbit(player, 5)
        Services.inputManager.setControlledEntity(player)
    }
}

class MinecraftModelDef extends ModelDef {
    private entries: ModelDefEntry[] = []

    constructor() {
        super()
        this.generateModels()
    }

    async generateModels(): Promise<void> {
        const [halfSphere, cylinder] = await Promise.all([
            Services.resources.requireModel("half_sphere"),
            Services.resources.requireModel("cylinder"),
        ])

        this.entries = [
            { model: halfSphere, transform: undefined! },
            { model: cylinder, transform: undefined! },
            { model: halfSphere, transform: undefined! },
        ]
    }

    update(transform: TransformData): void {
        const height = transform.size[2]

        this.entries[0].transform = cloneTransform(transform)
        this.entries[0].transform.size[2] = 1
        this.entries[0].transform.pos[2] += (height - 1) / 2

        this.entries[1].transform = cloneTransform(transform)
        this.entries[1].transform.size[2] -= 1

        this.entries[2].transform = cloneTransform(transform)
        this.entries[2].transform.size[2] = 1

        const q = quat.create()
        quat.fromEuler(q, 180, 0, 0)
        quat.mul(this.entries[2].transform.rotation, this.entries[2].transform.rotation, q)

        this.entries[2].transform.pos[2] -= (height - 1) / 2
    }

    getEntries(): ModelDefEntry[] {
        if (this.entries === undefined) {
            throw new Error("Models are not loaded.")
        }

        return this.entries
    }
}
