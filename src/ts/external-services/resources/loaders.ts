/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { vec3, quat } from "gl-matrix"
import {
    Mesh,
    Model,
    Bone,
    Animation,
    Texture,
    ColoredMesh,
    ColoredTexturedMesh,
} from "../render/render-data"

export const MESH_VERTEX_SIZE = 3 + 3 + 2

export function loadMesh(data: ArrayBuffer): Mesh {
    const header = new Uint32Array(data, 0, 2)
    const [vertexCount, indexCount] = header

    const indices = new Uint16Array(data, 2 * 4, indexCount)
    const floatPosition = Math.ceil((2 * 4 + indexCount * 2) / 4) * 4
    const vertices = new Float32Array(data, floatPosition, MESH_VERTEX_SIZE * vertexCount)

    const model = new Mesh(vertices, indices)

    return model
}

export const COLORED_MESH_SIZE = 3 + 1

export function loadColoredMesh(data: ArrayBuffer): ColoredMesh {
    const header = new Uint32Array(data, 0, 2)
    const [vertexCount, indexCount] = header

    const indices = new Uint16Array(data, 2 * 4, indexCount)
    const verticesAndColors = new Float32Array(
        data,
        2 * 4 + indexCount * 2,
        COLORED_MESH_SIZE * vertexCount
    )

    const model = new ColoredMesh(verticesAndColors, indices)

    return model
}

export const COLORED_TEXTURED_MESH_SIZE = 3 + 2 + 1

export function loadColoredTexturedMesh(data: ArrayBuffer): ColoredTexturedMesh {
    const header = new Uint32Array(data, 0, 2)
    const [vertexCount, indexCount] = header

    const indices = new Uint16Array(data, 2 * 4, indexCount)
    const verticesAndColors = new Float32Array(
        data,
        2 * 4 + indexCount * 2,
        COLORED_TEXTURED_MESH_SIZE * vertexCount
    )

    const model = new ColoredTexturedMesh(verticesAndColors, indices)

    return model
}

export const MODEL_VERTEX_SIZE = 3 + 3 + 2 + 4 + 4

export function loadModel(data: ArrayBuffer): Model {
    const header = new Uint32Array(data, 0, 3)
    const [vertexCount, indexCount, boneCount] = header
    const indices = new Uint16Array(data, 3 * 4, indexCount)
    const floatPosition = Math.ceil((3 * 4 + indexCount * 2) / 4) * 4
    const vertices = new Float32Array(data, floatPosition, MODEL_VERTEX_SIZE * vertexCount)
    const boneData = new Float32Array(
        data,
        floatPosition + MODEL_VERTEX_SIZE * vertexCount * 4,
        boneCount * Bone.STRIDE
    )

    const bones: Bone[] = []
    for (let i = 0; i < boneCount; i++) {
        const id = Math.trunc(boneData[i * Bone.STRIDE + 0])
        const translation = vec3.fromValues(
            boneData[i * Bone.STRIDE + 1],
            boneData[i * Bone.STRIDE + 2],
            boneData[i * Bone.STRIDE + 3]
        )
        const rotation = quat.fromValues(
            boneData[i * Bone.STRIDE + 4],
            boneData[i * Bone.STRIDE + 5],
            boneData[i * Bone.STRIDE + 6],
            boneData[i * Bone.STRIDE + 7]
        )

        const bone = new Bone(id, translation, rotation)

        bones.push(bone)
    }

    const skin = new Model(vertices, indices, bones)

    return skin
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

const MAX_TEX_SIZE = 2048
const canvas = document.createElement("canvas")
canvas.width = MAX_TEX_SIZE
canvas.height = MAX_TEX_SIZE
const ctx = canvas.getContext("2d", { willReadFrequently: true })!

export async function loadTexture(url: string): Promise<Texture> {
    return new Promise(resolve => {
        const image = new Image()
        image.onload = () => {
            const canvas = ctx.canvas
            ctx.clearRect(0, 0, canvas.width, canvas.height)
            ctx.drawImage(image, 0, 0)

            const data = ctx.getImageData(0, 0, image.width, image.height)

            resolve(new Texture(url, data.data, data.width, data.height))
        }
        image.src = url
    })
}

// URL adapters

export async function loadMeshFromURL(url: string): Promise<Mesh> {
    const data = await (await fetch(url)).arrayBuffer()
    return loadMesh(data)
}

export async function loadColoredMeshFromURL(url: string): Promise<ColoredMesh> {
    const data = await (await fetch(url)).arrayBuffer()
    return loadColoredMesh(data)
}

export async function loadColoredTexturedMeshFromURL(url: string): Promise<ColoredTexturedMesh> {
    const data = await (await fetch(url)).arrayBuffer()
    return loadColoredTexturedMesh(data)
}

export async function loadModelFromURL(url: string): Promise<Model> {
    const data = await (await fetch(url)).arrayBuffer()
    return loadModel(data)
}

export async function loadAnimationFromURL(url: string): Promise<Animation> {
    const data = await (await fetch(url)).arrayBuffer()
    return loadAnimation(data)
}
