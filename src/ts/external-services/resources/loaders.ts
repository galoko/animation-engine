/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { vec3, quat } from "gl-matrix"
import { Mesh, Model, Bone, Animation, Texture } from "../render/render-data"

export function loadMesh(gl: WebGLRenderingContext, data: ArrayBuffer): Mesh {
    const header = new Uint32Array(data, 0, 2)
    const [vertexCount, indexCount] = header

    const indices = new Uint16Array(data, 2 * 4, indexCount)
    const floatPosition = Math.ceil((2 * 4 + indexCount * 2) / 4) * 4
    const vertices = new Float32Array(data, floatPosition, Mesh.STRIDE * vertexCount)

    const vertexBuffer = gl.createBuffer()!
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW)

    const indexBuffer = gl.createBuffer()!
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer)
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW)

    const model = new Mesh(vertexBuffer, vertexCount, indexBuffer, indexCount)

    return model
}

export function loadModel(gl: WebGLRenderingContext, data: ArrayBuffer): Model {
    const header = new Uint32Array(data, 0, 3)
    const [vertexCount, indexCount, boneCount] = header
    const indices = new Uint16Array(data, 3 * 4, indexCount)
    const floatPosition = Math.ceil((3 * 4 + indexCount * 2) / 4) * 4
    const vertices = new Float32Array(data, floatPosition, Model.STRIDE * vertexCount)
    const boneData = new Float32Array(
        data,
        floatPosition + Model.STRIDE * vertexCount * 4,
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

    const vertexBuffer = gl.createBuffer()!
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW)

    const indexBuffer = gl.createBuffer()!
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer)
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW)

    const skin = new Model(vertexBuffer, vertexCount, indexBuffer, indexCount, bones)

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

export async function loadTexture(gl: WebGLRenderingContext, url: string): Promise<Texture> {
    return new Promise(resolve => {
        const image = new Image()
        image.onload = () => {
            const texture = gl.createTexture()!

            gl.bindTexture(gl.TEXTURE_2D, texture)
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image)

            resolve(new Texture(texture))
        }
        image.src = url
    })
}

// URL adapters

export async function loadMeshFromURL(gl: WebGLRenderingContext, url: string): Promise<Mesh> {
    const data = await (await fetch(url)).arrayBuffer()
    return loadMesh(gl, data)
}

export async function loadModelFromURL(gl: WebGLRenderingContext, url: string): Promise<Model> {
    const data = await (await fetch(url)).arrayBuffer()
    return loadModel(gl, data)
}

export async function loadAnimationFromURL(url: string): Promise<Animation> {
    const data = await (await fetch(url)).arrayBuffer()
    return loadAnimation(data)
}