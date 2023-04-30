import { mat4, quat, vec3 } from "gl-matrix"

export class RefCountingResource {
    private refCount = 0

    incRef(): number {
        this.refCount++
        return this.refCount
    }

    decRef(): number {
        this.refCount--
        if (this.refCount < 0) {
            throw new Error("Resourse ref count is negative.")
        }
        return this.refCount
    }
}

export class Mesh extends RefCountingResource {
    constructor(readonly vertices: Float32Array, readonly indices: Uint16Array) {
        super()
    }
}

export class ColoredMesh extends RefCountingResource {
    constructor(readonly vertices: Float32Array, readonly indices: Uint16Array) {
        super()
    }
}

export class ColoredTexturedMesh extends RefCountingResource {
    constructor(readonly vertices: Float32Array, readonly indices: Uint16Array) {
        super()
    }
}

export class Texture extends RefCountingResource {
    constructor(
        readonly id: string,
        readonly pixels: Uint8ClampedArray,
        readonly width: number,
        readonly height: number
    ) {
        super()
    }
}

export class Bone {
    static readonly STRIDE = 1 + 3 + 4

    static readonly HUMAN_BONES_START = 1000
    static readonly HUMAN_BONES_COUNT = 13

    private static readonly BONE_NAME_TO_BONE_ID = [
        "Spine",
        "UpperSpine",
        "Neck",
        "UpperLeg.R",
        "LowerLeg.R",
        "Foot.R",
        "UpperLeg.L",
        "LowerLeg.L",
        "Foot.L",
        "UpperArm.R",
        "LowerArm.R",
        "UpperArm.L",
        "LowerArm.L",
    ]

    static readonly SPINE = Bone.nameToId("Spine")
    static readonly UPPER_SPINE = Bone.nameToId("UpperSpine")
    static readonly NECK = Bone.nameToId("Neck")
    static readonly UPPER_LEG_R = Bone.nameToId("UpperLeg.R")
    static readonly LOWER_LEG_R = Bone.nameToId("LowerLeg.R")
    static readonly FOOT_R = Bone.nameToId("Foot.R")
    static readonly UPPER_LEG_L = Bone.nameToId("UpperLeg.L")
    static readonly LOWER_LEG_L = Bone.nameToId("LowerLeg.L")
    static readonly FOOT_L = Bone.nameToId("Foot.L")
    static readonly UPPER_ARM_R = Bone.nameToId("UpperArm.R")
    static readonly LOWER_ARM_R = Bone.nameToId("LowerArm.R")
    static readonly UPPER_ARM_L = Bone.nameToId("UpperArm.L")
    static readonly LOWER_ARM_L = Bone.nameToId("LowerArm.L")

    static readonly HUMAN_SKELETON = Bone.createHumanSkeleton()

    private static createHumanSkeleton(): Map<number, number> {
        const HUMAN_SKELETON = new Map<number, number>()

        HUMAN_SKELETON.set(Bone.UPPER_SPINE, Bone.SPINE)
        HUMAN_SKELETON.set(Bone.NECK, Bone.UPPER_SPINE)

        HUMAN_SKELETON.set(Bone.LOWER_LEG_R, Bone.UPPER_LEG_R)
        HUMAN_SKELETON.set(Bone.FOOT_R, Bone.LOWER_LEG_R)

        HUMAN_SKELETON.set(Bone.LOWER_LEG_L, Bone.UPPER_LEG_L)
        HUMAN_SKELETON.set(Bone.FOOT_L, Bone.LOWER_LEG_L)

        HUMAN_SKELETON.set(Bone.UPPER_ARM_R, Bone.UPPER_SPINE)
        HUMAN_SKELETON.set(Bone.LOWER_ARM_R, Bone.UPPER_ARM_R)

        HUMAN_SKELETON.set(Bone.UPPER_ARM_L, Bone.UPPER_SPINE)
        HUMAN_SKELETON.set(Bone.LOWER_ARM_L, Bone.UPPER_ARM_L)

        return HUMAN_SKELETON
    }

    static idToName(id: number): string {
        return Bone.BONE_NAME_TO_BONE_ID[id - Bone.HUMAN_BONES_START]
    }

    static nameToId(name: string): number {
        const index = Bone.BONE_NAME_TO_BONE_ID.indexOf(name)
        if (index === -1) {
            throw new Error("Unknown bone")
        }
        return Bone.HUMAN_BONES_START + index
    }

    static getHumanBoneParent(id: number): number | undefined {
        return Bone.HUMAN_SKELETON.get(id)
    }

    constructor(public id: number, public translation: vec3, public rotation: quat) {}
}

export class Model {
    readonly inverseMatrices: mat4[]
    readonly boneIdToBoneIndex: Map<number, number>

    constructor(
        readonly vertices: Float32Array,
        readonly indices: Uint16Array,
        readonly bones: Bone[]
    ) {
        this.inverseMatrices = new Array(bones.length)

        this.boneIdToBoneIndex = new Map()
        for (let i = 0; i < bones.length; i++) {
            this.boneIdToBoneIndex.set(bones[i].id, i)
        }

        this.buildInverseMatrices()
    }

    public getBoneIndex(id: number): number | undefined {
        return this.boneIdToBoneIndex.get(id)
    }

    public getBone(id: number): Bone | null {
        const index = this.getBoneIndex(id)
        if (index === undefined) {
            return null
        }
        return this.bones[index]
    }

    public getBoneParent(id: number): Bone | null {
        const parentId = Bone.getHumanBoneParent(id)
        if (parentId === undefined) {
            return null
        }

        const parentIndex = this.getBoneIndex(parentId)
        if (parentIndex === undefined) {
            throw new Error("Unknown bone")
        }

        return this.bones[parentIndex]
    }

    public getBoneParentIndex(id: number): number | undefined {
        const parentId = Bone.getHumanBoneParent(id)
        if (parentId === undefined) {
            return undefined
        }

        return this.getBoneIndex(parentId)
    }

    private buildInverseMatrices() {
        for (
            let boneId = Bone.HUMAN_BONES_START;
            boneId < Bone.HUMAN_BONES_START + Bone.HUMAN_BONES_COUNT;
            boneId++
        ) {
            const boneIndex = this.getBoneIndex(boneId)
            if (boneIndex === undefined) {
                throw new Error("Unknown bone")
            }

            const parentBoneId = Bone.getHumanBoneParent(boneId)
            const parentBoneIndex =
                parentBoneId !== undefined ? this.boneIdToBoneIndex.get(parentBoneId) : undefined

            const bone = this.bones[boneIndex]
            const invMatrix = mat4.create()
            mat4.fromRotationTranslation(invMatrix, bone.rotation, bone.translation)

            if (parentBoneIndex !== undefined) {
                const parentMatrix = mat4.clone(this.inverseMatrices[parentBoneIndex])
                mat4.invert(parentMatrix, parentMatrix)
                mat4.mul(invMatrix, parentMatrix, invMatrix)
            }

            mat4.invert(invMatrix, invMatrix)

            this.inverseMatrices[boneIndex] = invMatrix
        }
    }
}

export class Animation {
    constructor(readonly timings: number[], readonly values: Map<number, quat[]>) {}

    private findTimingNextIndex(s: number): number {
        let index = 1
        while (this.timings[index] <= s && index < this.timings.length) {
            index++
        }

        console.assert(index < this.timings.length)

        return index
    }

    getRotation(boneId: number, s: number): quat {
        const first = this.timings[0]
        const last = this.timings[this.timings.length - 1]
        const duration = last - first

        s = first + ((s - first) % duration)

        const rotation = quat.create()

        const rotations = this.values.get(boneId)

        if (rotations !== undefined) {
            const nextIndex = this.findTimingNextIndex(s)
            const prevIndex = nextIndex - 1

            const s0 = this.timings[prevIndex]
            const s1 = this.timings[nextIndex]

            const t = (s - s0) / (s1 - s0)

            const r0 = rotations[prevIndex]
            const r1 = rotations[nextIndex]

            quat.slerp(rotation, r0, r1, t)
        }

        return rotation
    }
}
