import { vec3, quat, mat4 } from "gl-matrix"
import { CompiledShader } from "./render-utils"

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
    id: number
    translation: vec3
    rotation: quat
}

export class Model {
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

const ATTRIBUTES = [
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
const MODEL_STRIDE = ATTRIBUTES.reduce((acum, value) => acum + value.size, 0)

export function defineModelVertexBuffer(gl: WebGLRenderingContext, shader: CompiledShader): void {
    let offset = 0
    for (const attr of ATTRIBUTES) {
        const attrNum = shader[attr.name] as number
        if (attrNum !== undefined) {
            gl.vertexAttribPointer(
                attrNum,
                attr.size,
                gl.FLOAT,
                false,
                MODEL_STRIDE * Float32Array.BYTES_PER_ELEMENT,
                offset * Float32Array.BYTES_PER_ELEMENT
            )
            gl.enableVertexAttribArray(attrNum)
        }

        offset += attr.size
    }
}

const BONE_STRIDE = 1 + 3 + 4

export function loadModel(gl: WebGLRenderingContext, data: ArrayBuffer): Model {
    const header = new Uint32Array(data, 0, 3)
    const [vertexCount, indexCount, boneCount] = header
    const indices = new Uint16Array(data, 3 * 4, indexCount)
    const floatPosition = Math.ceil((3 * 4 + indexCount * 2) / 4) * 4
    const vertices = new Float32Array(data, floatPosition, MODEL_STRIDE * vertexCount)
    const boneData = new Float32Array(
        data,
        floatPosition + MODEL_STRIDE * vertexCount * 4,
        boneCount * BONE_STRIDE
    )

    const bones: Bone[] = []
    for (let i = 0; i < boneCount; i++) {
        const bone = new Bone()
        bone.id = Math.trunc(boneData[i * BONE_STRIDE + 0])
        bone.translation = vec3.fromValues(
            boneData[i * BONE_STRIDE + 1],
            boneData[i * BONE_STRIDE + 2],
            boneData[i * BONE_STRIDE + 3]
        )
        bone.rotation = quat.fromValues(
            boneData[i * BONE_STRIDE + 4],
            boneData[i * BONE_STRIDE + 5],
            boneData[i * BONE_STRIDE + 6],
            boneData[i * BONE_STRIDE + 7]
        )

        bones.push(bone)
    }

    const vertexBuffer = gl.createBuffer()!
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW)

    const indexBuffer = gl.createBuffer()!
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer)
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW)

    const model = new Model(vertexBuffer, vertexCount, indexBuffer, indexCount, bones)

    return model
}

export async function loadModelFromURL(gl: WebGLRenderingContext, url: string): Promise<Model> {
    const data = await (await fetch(url)).arrayBuffer()
    return loadModel(gl, data)
}

export function loadAnimation(data: ArrayBuffer) {
    const floats = new Float32Array(data)
    const keyframeCount = Math.trunc(floats[0])
    const bonesCount = Math.trunc(floats[1])

    const timings = [] as number[]
    for (let i = 0; i < keyframeCount; i++) {
        timings.push(floats[2 + i])
    }

    const map = new Map<number, quat[]>()

    const valuesPos = 2 + keyframeCount
    const VALUES_STRIDE = 1 + 4 * keyframeCount
    for (let i = 0; i < bonesCount; i++) {
        const pos = valuesPos + i * VALUES_STRIDE

        const boneId = Math.trunc(floats[pos + 0])

        const rotations = [] as quat[]
        for (let j = 0; j < keyframeCount; j++) {
            const rotation = quat.fromValues(
                floats[pos + 1 + j * 4 + 0],
                floats[pos + 1 + j * 4 + 1],
                floats[pos + 1 + j * 4 + 2],
                floats[pos + 1 + j * 4 + 3]
            )
            rotations.push(rotation)
        }

        map.set(boneId, rotations)
    }

    const animation = new Animation(timings, map)

    return animation
}

export async function loadAnimationFromURL(url: string): Promise<Animation> {
    const data = await (await fetch(url)).arrayBuffer()
    return loadAnimation(data)
}

export async function loadTexture(gl: WebGLRenderingContext, url: string): Promise<WebGLTexture> {
    return new Promise(resolve => {
        const image = new Image()
        image.onload = () => {
            const texture = gl.createTexture()!
            gl.bindTexture(gl.TEXTURE_2D, texture)
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image)
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)

            resolve(texture)
        }
        image.src = url
    })
}
