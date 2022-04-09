import { vec3, quat } from "gl-matrix"
import { CompiledShader } from "./render-utils"

const HUMAN_BONES_START = 1000

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

export function boneIdToBoneName(id: number): string {
    return BONE_NAME_TO_BONE_ID[id - HUMAN_BONES_START]
}

export class Bone {
    id: number
    translation: vec3
    rotation: quat
}

export class Model {
    constructor(
        readonly vertices: WebGLBuffer,
        readonly vertexCount: number,
        readonly indices: WebGLBuffer,
        readonly indexCount: number,
        readonly bones: Bone[]
    ) {
        //
    }
}

export class Animation {
    constructor(readonly timings: number[], readonly values: Map<number, quat[]>) {}
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

    const vertexBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW)

    const indexBuffer = gl.createBuffer()
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

    const timings = []
    for (let i = 0; i < keyframeCount; i++) {
        timings.push(floats[2 + i])
    }

    const map = new Map<number, quat[]>()

    const valuesPos = 2 + keyframeCount
    const VALUES_STRIDE = 1 + 4 * keyframeCount
    for (let i = 0; i < bonesCount; i++) {
        const pos = valuesPos + i * VALUES_STRIDE

        const boneId = Math.trunc(floats[pos + 0])

        const rotations = []
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
