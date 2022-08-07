import { mat4 } from "gl-matrix"
import { HUMAN_BONES_COUNT, HUMAN_BONES_START } from "../models/bone"
import { Skin } from "../models/skin"
import { Animation } from "../models/animation"

export function calculateSkinningMatrices(
    skin: Skin,
    animation: Animation,
    s: number,
    buffer: ArrayBuffer
): Float32Array {
    const worldMatrices = new Array(HUMAN_BONES_COUNT)
    const globalMatrices = new Array(HUMAN_BONES_COUNT)

    for (let boneId = HUMAN_BONES_START; boneId < HUMAN_BONES_START + HUMAN_BONES_COUNT; boneId++) {
        const boneParentIndex = skin.getBoneParentIndex(boneId)

        const boneIndex = skin.getBoneIndex(boneId)
        if (boneIndex === undefined) {
            throw new Error("Unknown bone")
        }

        const bone = skin.bones[boneIndex]

        const invMatrix = skin.inverseMatrices[boneIndex]

        const rotation = animation.getRotation(boneId, s)

        const worldMatrix = mat4.create()
        mat4.fromRotationTranslation(worldMatrix, rotation, bone.translation)

        if (boneParentIndex !== undefined) {
            const parentGlobalMatrix = globalMatrices[boneParentIndex]
            mat4.mul(worldMatrix, parentGlobalMatrix, worldMatrix)
        }

        globalMatrices[boneIndex] = mat4.clone(worldMatrix)

        mat4.mul(worldMatrix, worldMatrix, invMatrix)
        worldMatrices[boneIndex] = worldMatrix
    }

    const result = new Float32Array(buffer, 0, skin.bones.length * 16)
    for (let boneIndex = 0; boneIndex < skin.bones.length; boneIndex++) {
        result.set(worldMatrices[boneIndex], boneIndex * 16)
    }

    return result
}
