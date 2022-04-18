import { vec3, quat } from "gl-matrix"

export const STRIDE = 1 + 3 + 4

export const HUMAN_BONES_START = 1000
export const HUMAN_BONES_COUNT = 13

const BONE_NAME_TO_BONE_ID = [
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

const SPINE = boneNameToBoneId("Spine")
const UPPER_SPINE = boneNameToBoneId("UpperSpine")
const NECK = boneNameToBoneId("Neck")
const UPPER_LEG_R = boneNameToBoneId("UpperLeg.R")
const LOWER_LEG_R = boneNameToBoneId("LowerLeg.R")
const FOOT_R = boneNameToBoneId("Foot.R")
const UPPER_LEG_L = boneNameToBoneId("UpperLeg.L")
const LOWER_LEG_L = boneNameToBoneId("LowerLeg.L")
const FOOT_L = boneNameToBoneId("Foot.L")
const UPPER_ARM_R = boneNameToBoneId("UpperArm.R")
const LOWER_ARM_R = boneNameToBoneId("LowerArm.R")
const UPPER_ARM_L = boneNameToBoneId("UpperArm.L")
const LOWER_ARM_L = boneNameToBoneId("LowerArm.L")

export function boneIdToBoneName(id: number): string {
    return BONE_NAME_TO_BONE_ID[id - HUMAN_BONES_START]
}

export function boneNameToBoneId(name: string): number {
    const index = BONE_NAME_TO_BONE_ID.indexOf(name)
    if (index === -1) {
        throw new Error("Unknown bone")
    }
    return HUMAN_BONES_START + index
}

const HUMAN_SKELETON = new Map<number, number>()
HUMAN_SKELETON.set(UPPER_SPINE, SPINE)
HUMAN_SKELETON.set(NECK, UPPER_SPINE)

HUMAN_SKELETON.set(LOWER_LEG_R, UPPER_LEG_R)
HUMAN_SKELETON.set(FOOT_R, LOWER_LEG_R)

HUMAN_SKELETON.set(LOWER_LEG_L, UPPER_LEG_L)
HUMAN_SKELETON.set(FOOT_L, LOWER_LEG_L)

HUMAN_SKELETON.set(UPPER_ARM_R, UPPER_SPINE)
HUMAN_SKELETON.set(LOWER_ARM_R, UPPER_ARM_R)

HUMAN_SKELETON.set(UPPER_ARM_L, UPPER_SPINE)
HUMAN_SKELETON.set(LOWER_ARM_L, UPPER_ARM_L)

export function getHumanBoneParent(id: number): number | undefined {
    return HUMAN_SKELETON.get(id)
}

export class Bone {
    static readonly STRIDE = STRIDE

    id: number
    translation: vec3
    rotation: quat
}
