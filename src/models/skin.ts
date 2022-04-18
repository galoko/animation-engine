import { mat4 } from "gl-matrix"
import type { AttributeDef } from "../managers/render"
import { Bone, getHumanBoneParent, HUMAN_BONES_COUNT, HUMAN_BONES_START } from "./bone"

const ATTRIBUTES: AttributeDef[] = [
    {
        name: "p",
        size: 3,
    },
    {
        name: "n",
        size: 3,
    },
    {
        name: "uv",
        size: 2,
    },
    {
        name: "w",
        size: 4,
    },
    {
        name: "j",
        size: 4,
    },
]
const STRIDE = ATTRIBUTES.reduce((acum, value) => acum + value.size, 0)

export class Skin {
    static readonly ATTRIBUTES = ATTRIBUTES
    static readonly STRIDE = STRIDE

    readonly inverseMatrices: mat4[]
    readonly boneIdToBoneIndex: Map<number, number>

    constructor(
        readonly vertices: WebGLBuffer,
        readonly vertexCount: number,
        readonly indices: WebGLBuffer,
        readonly indexCount: number,
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
        const parentId = getHumanBoneParent(id)
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
        const parentId = getHumanBoneParent(id)
        if (parentId === undefined) {
            return undefined
        }

        return this.getBoneIndex(parentId)
    }

    private buildInverseMatrices() {
        for (
            let boneId = HUMAN_BONES_START;
            boneId < HUMAN_BONES_START + HUMAN_BONES_COUNT;
            boneId++
        ) {
            const boneIndex = this.getBoneIndex(boneId)
            if (boneIndex === undefined) {
                throw new Error("Unknown bone")
            }

            const parentBoneId = getHumanBoneParent(boneId)
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
