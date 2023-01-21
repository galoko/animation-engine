/* eslint-disable @typescript-eslint/no-non-null-assertion */

import objectsVert from "../../shaders/objects.vert"
import objectsFrag from "../../shaders/objects.frag"

import skydomeVert from "../../shaders/skydome.vert"
import skydomeFrag from "../../shaders/skydome.frag"

import sunVert from "../../shaders/sun.vert"
import sunFrag from "../../shaders/sun.frag"

import passthroughVert from "../../shaders/passthrough.vert"
import passthroughFrag from "../../shaders/passthrough.frag"

import fogFrag from "../../shaders/fog.frag"

import { mat4, quat, vec3, vec4 } from "gl-matrix"
import { compileShader, WebGLProgramWithUniforms } from "./render-utils"
import { gl, ctx, anisotropic } from "./render-context"
import { CHUNK_MESH_VERTEX_SIZE, Renderable } from "./renderable"
import { Atlas, ATLAS_SIZE } from "./atlas"
import {
    COLORED_MESH_SIZE,
    COLORED_TEXTURED_MESH_SIZE,
    loadColoredMeshFromURL,
    loadColoredTexturedMeshFromURL,
    loadTexture,
    MESH_VERTEX_SIZE,
} from "../resources/loaders"
import { ColoredMesh, Mesh, Texture } from "./render-data"
import { ResourceManager } from "../resources/resource-manager"

const POSITION_INDEX = 0
const COLOR_INDEX = 1
const NORMAL_INDEX = 1
const UV_INDEX = 2
const PARAMS_INDEX = 3

class ColoredMeshBuffer {
    vao: WebGLVertexArrayObject

    vertices: WebGLBuffer
    indices: WebGLBuffer

    constructor(public mesh: ColoredMesh) {
        this.vao = gl.createVertexArray()!

        this.vertices = gl.createBuffer()!
        this.indices = gl.createBuffer()!

        gl.bindVertexArray(this.vao)

        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertices)
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indices)

        gl.bufferData(gl.ARRAY_BUFFER, mesh.vertices, gl.STATIC_DRAW)
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, mesh.indices, gl.STATIC_DRAW)

        gl.enableVertexAttribArray(POSITION_INDEX)
        gl.enableVertexAttribArray(COLOR_INDEX)

        gl.vertexAttribPointer(POSITION_INDEX, 3, gl.FLOAT, false, COLORED_MESH_SIZE * 4, 0)
        gl.vertexAttribPointer(COLOR_INDEX, 4, gl.UNSIGNED_BYTE, true, COLORED_MESH_SIZE * 4, 3 * 4)
    }
}

class MeshBuffer {
    vao: WebGLVertexArrayObject

    vertices: WebGLBuffer
    indices: WebGLBuffer

    constructor(public mesh: Mesh) {
        this.vao = gl.createVertexArray()!

        this.vertices = gl.createBuffer()!
        this.indices = gl.createBuffer()!

        gl.bindVertexArray(this.vao)

        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertices)
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indices)

        gl.bufferData(gl.ARRAY_BUFFER, mesh.vertices, gl.STATIC_DRAW)
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, mesh.indices, gl.STATIC_DRAW)

        gl.enableVertexAttribArray(POSITION_INDEX)
        gl.enableVertexAttribArray(NORMAL_INDEX)
        gl.enableVertexAttribArray(UV_INDEX)

        gl.vertexAttribPointer(POSITION_INDEX, 3, gl.FLOAT, false, MESH_VERTEX_SIZE * 4, 0)
        gl.vertexAttribPointer(NORMAL_INDEX, 3, gl.FLOAT, false, COLORED_MESH_SIZE * 4, 3 * 4)
        gl.vertexAttribPointer(UV_INDEX, 2, gl.FLOAT, false, MESH_VERTEX_SIZE * 4, 6 * 4)
    }
}

class ColoredTexturedMeshBuffer {
    vao: WebGLVertexArrayObject

    vertices: WebGLBuffer
    indices: WebGLBuffer

    constructor(public mesh: ColoredMesh) {
        this.vao = gl.createVertexArray()!

        this.vertices = gl.createBuffer()!
        this.indices = gl.createBuffer()!

        gl.bindVertexArray(this.vao)

        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertices)
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indices)

        gl.bufferData(gl.ARRAY_BUFFER, mesh.vertices, gl.STATIC_DRAW)
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, mesh.indices, gl.STATIC_DRAW)

        gl.enableVertexAttribArray(POSITION_INDEX)
        gl.enableVertexAttribArray(COLOR_INDEX)
        gl.enableVertexAttribArray(UV_INDEX)

        gl.vertexAttribPointer(
            POSITION_INDEX,
            3,
            gl.FLOAT,
            false,
            COLORED_TEXTURED_MESH_SIZE * 4,
            0
        )
        gl.vertexAttribPointer(UV_INDEX, 2, gl.FLOAT, false, COLORED_TEXTURED_MESH_SIZE * 4, 3 * 4)
        gl.vertexAttribPointer(
            COLOR_INDEX,
            4,
            gl.UNSIGNED_BYTE,
            true,
            COLORED_TEXTURED_MESH_SIZE * 4,
            (3 + 2) * 4
        )
    }
}

// in vertex count
const VERTEX_BUFFER_SIZE = Math.trunc((4 * 1024 * 1024) / 4 / CHUNK_MESH_VERTEX_SIZE)
const INDEX_BUFFER_SIZE = VERTEX_BUFFER_SIZE // in index count

const ramVertexBuffer = new Float32Array(VERTEX_BUFFER_SIZE * CHUNK_MESH_VERTEX_SIZE)
const ramIndexBuffer = new Uint32Array(INDEX_BUFFER_SIZE)

class BufferChunk {
    vao: WebGLVertexArrayObject

    vertices: WebGLBuffer
    indices: WebGLBuffer

    vertexPos = 0
    indexPos = 0

    atlases: Atlas[] = []

    constructor() {
        this.vao = gl.createVertexArray()!

        this.vertices = gl.createBuffer()!
        this.indices = gl.createBuffer()!

        gl.bindVertexArray(this.vao)

        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertices)
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indices)

        gl.bufferData(
            gl.ARRAY_BUFFER,
            VERTEX_BUFFER_SIZE * CHUNK_MESH_VERTEX_SIZE * 4,
            gl.STREAM_DRAW
        )
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, INDEX_BUFFER_SIZE * 4, gl.STREAM_DRAW)

        gl.enableVertexAttribArray(POSITION_INDEX)
        gl.enableVertexAttribArray(NORMAL_INDEX)
        gl.enableVertexAttribArray(UV_INDEX)
        gl.enableVertexAttribArray(PARAMS_INDEX)

        const attributes = [POSITION_INDEX, NORMAL_INDEX, UV_INDEX, PARAMS_INDEX]
        const sizes = [3, 3, 2, 1]

        let offset = 0
        for (let i = 0; i < attributes.length; i++) {
            const index = attributes[i]
            const size = sizes[i]

            gl.vertexAttribPointer(index, size, gl.FLOAT, false, CHUNK_MESH_VERTEX_SIZE * 4, offset)

            offset += size * 4
        }
    }

    private allocateNewAtlas(): Atlas {
        const atlas = new Atlas(this.atlases.length)
        this.atlases.push(atlas)
        return atlas
    }

    private allocateAndCopyTextureToAtlas(texture: Texture): [number, number, number] {
        for (const atlas of this.atlases) {
            const res = atlas.tryAddTexture(texture)

            if (res) {
                return [...res, atlas.num]
            }
        }

        const atlas = this.allocateNewAtlas()

        const res = atlas.tryAddTexture(texture)
        if (!res) {
            throw new Error("Can't put texture in empty Atlas.")
        }

        return [...res, atlas.num]
    }

    tryAddRenderable(renderable: Renderable): boolean {
        const { mesh, texture } = renderable

        const vertexCount = mesh.vertices.length / MESH_VERTEX_SIZE
        const indexCount = mesh.indices.length

        if (
            VERTEX_BUFFER_SIZE - this.vertexPos < vertexCount ||
            INDEX_BUFFER_SIZE - this.indexPos < indexCount
        ) {
            return false
        }

        const uScale = texture.width / ATLAS_SIZE
        const vScale = texture.height / ATLAS_SIZE

        const [uOffset, vOffset, atlasNum] = this.allocateAndCopyTextureToAtlas(texture)

        gl.bindVertexArray(this.vao)
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertices)
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indices)

        // we can add this object to this chunk

        const perObjectDataIndex = Render.allocatePerObjectInfoIndex()

        // setup vertices
        for (let vertexIndex = 0; vertexIndex < vertexCount; vertexIndex++) {
            const MESH_VERTEX_STATIC_SIZE = 3 + 3
            for (let i = 0; i < MESH_VERTEX_STATIC_SIZE; i++) {
                ramVertexBuffer[vertexIndex * CHUNK_MESH_VERTEX_SIZE + i] =
                    mesh.vertices[vertexIndex * MESH_VERTEX_SIZE + i]
            }

            let u = mesh.vertices[vertexIndex * MESH_VERTEX_SIZE + MESH_VERTEX_STATIC_SIZE + 0]
            let v = mesh.vertices[vertexIndex * MESH_VERTEX_SIZE + MESH_VERTEX_STATIC_SIZE + 1]

            // fix UV for atlas

            u = uOffset + u * uScale
            v = vOffset + v * vScale

            ramVertexBuffer[vertexIndex * CHUNK_MESH_VERTEX_SIZE + MESH_VERTEX_STATIC_SIZE + 0] = u
            ramVertexBuffer[vertexIndex * CHUNK_MESH_VERTEX_SIZE + MESH_VERTEX_STATIC_SIZE + 1] = v

            ramVertexBuffer[vertexIndex * CHUNK_MESH_VERTEX_SIZE + MESH_VERTEX_SIZE + 0] =
                perObjectDataIndex
        }

        // pass vertices to GPU
        gl.bufferSubData(
            gl.ARRAY_BUFFER,
            this.vertexPos * CHUNK_MESH_VERTEX_SIZE * 4,
            ramVertexBuffer,
            0,
            vertexCount * CHUNK_MESH_VERTEX_SIZE
        )

        // setup indices
        for (let indexIndex = 0; indexIndex < indexCount; indexIndex++) {
            ramIndexBuffer[indexIndex] = this.vertexPos + mesh.indices[indexIndex]
        }

        // pass indices to GPU
        gl.bufferSubData(gl.ELEMENT_ARRAY_BUFFER, this.indexPos * 4, ramIndexBuffer, 0, indexCount)

        // seek the chunk

        this.vertexPos += vertexCount
        this.indexPos += indexCount

        // done

        renderable.atlasNum = atlasNum
        renderable.perObjectDataIndex = perObjectDataIndex

        return true
    }
}

const SETTINGS_INDEX = 0
const SETTINGS_SIZE = 4 * 4

const PER_OBJECT_DATA_TEXTURE_SIZE = 1024
// compressed quat + scale + position + flags + specific data(4)
const PER_OBJECT_DATA_ENTRY_SIZE = 3 + 1 + 3 + 1 + 4 // 12 floats, which is 3 pixels
const PER_OBJECT_DATA_ENTRY_SIZE_IN_PIXELS = Math.ceil(PER_OBJECT_DATA_ENTRY_SIZE / 4)

const ramPerObjectDataBuffer = new Float32Array(PER_OBJECT_DATA_ENTRY_SIZE_IN_PIXELS * 4)

function createTexture(tex: Texture): WebGLTexture {
    const texture = gl.createTexture()!
    gl.activeTexture(gl.TEXTURE1)
    gl.bindTexture(gl.TEXTURE_2D, texture)

    gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        tex.width,
        tex.height,
        0,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        tex.pixels
    )

    if (anisotropic) {
        const max = gl.getParameter(anisotropic.MAX_TEXTURE_MAX_ANISOTROPY_EXT)
        gl.texParameterf(gl.TEXTURE_2D, anisotropic.TEXTURE_MAX_ANISOTROPY_EXT, max)
    }

    gl.generateMipmap(gl.TEXTURE_2D)

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR)

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT)

    return texture
}

function createFloatTexture(width: number, height: number): WebGLTexture {
    const texture = gl.createTexture()!
    gl.bindTexture(gl.TEXTURE_2D, texture)

    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, width, height, 0, gl.RGBA, gl.FLOAT, null)

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)

    return texture
}

function clampValue(value: number, min: number, max: number): number {
    if (value < min) value = min
    else if (value > max) value = max
    return value
}

function angleBetweenVectors(objectDirection: vec3, right: vec3, cameraDirection: vec3): number {
    const UP = vec3.fromValues(0, 0, 1)
    const objAngle = Math.acos(vec3.dot(objectDirection, UP))
    const objAxis = vec3.create()
    vec3.cross(objAxis, objectDirection, UP)

    const objQ = quat.create()
    quat.setAxisAngle(objQ, objAxis, objAngle)
    quat.invert(objQ, objQ)

    const FORWARD = vec3.fromValues(1, 0, 0)
    const cameraAngle = Math.acos(vec3.dot(cameraDirection, FORWARD))
    const cameraAxis = vec3.create()
    vec3.cross(cameraAxis, cameraDirection, FORWARD)

    const cameraQ = quat.create()
    quat.setAxisAngle(cameraQ, cameraAxis, cameraAngle)

    const q = quat.create()
    quat.mul(q, cameraQ, objQ)

    const siny_cosp = 2 * (q[3] * q[2] + q[0] * q[1])
    const cosy_cosp = 1 - 2 * (q[1] * q[1] + q[2] * q[2])

    return Math.atan2(siny_cosp, cosy_cosp)
}

export class Render {
    private static viewMatrix: mat4
    private static projectionMatrix: mat4
    private static vp: mat4

    private static settingsBuffer: Float32Array
    private static texturesBuffer = new Int32Array([
        0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15,
    ])

    // render targets
    private static mainPass: WebGLFramebuffer
    private static mainPassTexture: WebGLTexture
    private static depthBuffer: WebGLTexture
    private static fogPass: WebGLFramebuffer
    private static fogPassTexture: WebGLTexture

    // TODO
    private static skydome: ColoredMeshBuffer
    private static checkerboard: WebGLTexture
    private static sun: ColoredTexturedMeshBuffer
    private static sunTexture: WebGLTexture
    private static fullscreenPlain: MeshBuffer

    private static perObjectData: WebGLBuffer
    // TODO keep list of free entries
    private static nextPerObjectX = 0
    private static nextPerObjectY = 0

    private static settings: WebGLBuffer
    private static objectsShader: WebGLProgramWithUniforms
    private static skydomeShader: WebGLProgramWithUniforms
    private static sunShader: WebGLProgramWithUniforms
    private static fogShader: WebGLProgramWithUniforms
    private static passthroughShader: WebGLProgramWithUniforms

    private static scene: BufferChunk[] = []

    static init(): void {
        gl.getExtension("OES_texture_float")
        gl.getExtension("OES_texture_float_linear")
        gl.getExtension("EXT_color_buffer_float")

        Render.projectionMatrix = mat4.create()
        Render.viewMatrix = mat4.create()
        Render.vp = mat4.create()

        Render.handleResize()

        Render.setupFrameBuffers()
        Render.createPerObjectData()
        Render.createUBOs()
        Render.compilerShaders()

        Render.setupWebGL()
    }

    static async setupTest(): Promise<void> {
        this.skydome = new ColoredMeshBuffer(await loadColoredMeshFromURL("/build/skydome.cml"))
        this.checkerboard = createTexture(await loadTexture("/build/checkerboard.png"))

        this.sun = new ColoredTexturedMeshBuffer(
            await loadColoredTexturedMeshFromURL("/build/sun.ctml")
        )
        this.sunTexture = createTexture(await loadTexture("/build/sun_glare_debug.png"))

        const coordinates = [
            //
            8, -101515.1328125, -38915.29296875, -1551.75769042969,
            //
            8, -101515.1328125, -71683.296875, -1551.75769042969,
            //
            4, -35979.12890625, 10236.70703125, -1551.75769042969,
            //
            4, -35979.12890625, 10236.70703125, -1551.75769042969,
            //
            4, -35979.12890625, -6147.29296875, -1551.75769042969,
            //
            4, -35979.12890625, -6147.29296875, -1551.75769042969,
            //
            8, -68747.1328125, -6147.29296875, -1551.75769042969,
            //
            4, -35979.12890625, -22531.29296875, -1551.75769042969,
            //
            4, -35979.12890625, -22531.29296875, -1551.75769042969,
            //
            8, -68747.1328125, -38915.29296875, -1551.75769042969,
            //
            8, -68747.1328125, -71683.296875, -1551.75769042969,
            //
            8, -101515.1328125, -6147.29296875, -1551.75769042969,
            //
            8, -134283.125, 26620.70703125, -1551.75769042969,
            //
            8, -134283.125, -6147.29296875, -1551.75769042969,
            //
            16, -134283.125, -137219.296875, -1551.75769042969,
            //
            16, -199819.125, 59388.70703125, -1551.75769042969,
            //
            16, -199819.125, -6147.29296875, -1551.75769042969,
            //
            16, -265355.125, -6147.29296875, -1551.75769042969,
        ]

        for (let i = 0; i < 18; i++) {
            const mountains = new Renderable(
                await ResourceManager.requestMesh(`mountains_${i}`),
                await ResourceManager.requestTexture("mountains.png")
            )
            Render.setTransform(
                mountains,
                new Float32Array([
                    0,
                    0,
                    0,
                    1,
                    // scale
                    coordinates[i * 4 + 0],
                    // xyz
                    coordinates[i * 4 + 1],
                    coordinates[i * 4 + 2],
                    coordinates[i * 4 + 3],
                ])
            )

            Render.addRenderable(mountains)
        }

        this.fullscreenPlain = new MeshBuffer(await ResourceManager.requestMesh("fullscreen_plane"))
    }

    private static setupFrameBuffers() {
        this.mainPass = gl.createFramebuffer()!
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.mainPass)

        this.mainPassTexture = createFloatTexture(gl.canvas.width, gl.canvas.height)
        gl.framebufferTexture2D(
            gl.FRAMEBUFFER,
            gl.COLOR_ATTACHMENT0,
            gl.TEXTURE_2D,
            this.mainPassTexture,
            0
        )

        // create a depth texture
        this.depthBuffer = gl.createTexture()!
        gl.bindTexture(gl.TEXTURE_2D, this.depthBuffer)

        gl.texImage2D(
            gl.TEXTURE_2D,
            0,
            gl.DEPTH_COMPONENT24,
            gl.canvas.width,
            gl.canvas.height,
            0,
            gl.DEPTH_COMPONENT,
            gl.UNSIGNED_INT,
            null
        )

        // set the filtering so we don't need mips
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)

        // attach the depth texture to the framebuffer
        gl.framebufferTexture2D(
            gl.FRAMEBUFFER,
            gl.DEPTH_ATTACHMENT,
            gl.TEXTURE_2D,
            this.depthBuffer,
            0
        )

        this.fogPass = gl.createFramebuffer()!
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.fogPass)
        this.fogPassTexture = createFloatTexture(gl.canvas.width, gl.canvas.height)
        gl.framebufferTexture2D(
            gl.FRAMEBUFFER,
            gl.COLOR_ATTACHMENT0,
            gl.TEXTURE_2D,
            this.fogPassTexture,
            0
        )
    }

    private static createPerObjectData() {
        const pixels = new Float32Array(
            PER_OBJECT_DATA_TEXTURE_SIZE * PER_OBJECT_DATA_TEXTURE_SIZE * 4
        )
        for (let i = 0; i < pixels.length; i++) {
            pixels[i] = 0.1
        }

        this.perObjectData = gl.createTexture()!
        gl.activeTexture(gl.TEXTURE0)
        gl.bindTexture(gl.TEXTURE_2D, this.perObjectData)
        gl.texImage2D(
            gl.TEXTURE_2D,
            0,
            gl.RGBA32F,
            PER_OBJECT_DATA_TEXTURE_SIZE,
            PER_OBJECT_DATA_TEXTURE_SIZE,
            0,
            gl.RGBA,
            gl.FLOAT,
            pixels
        )
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
    }

    static allocatePerObjectInfoIndex(): number {
        if (
            this.nextPerObjectX + PER_OBJECT_DATA_ENTRY_SIZE_IN_PIXELS >
            PER_OBJECT_DATA_TEXTURE_SIZE
        ) {
            this.nextPerObjectX = 0
            this.nextPerObjectY++
        }

        if (this.nextPerObjectY > PER_OBJECT_DATA_TEXTURE_SIZE) {
            throw new Error("Out of space in PerObjectData.")
        }

        const result = this.nextPerObjectY * PER_OBJECT_DATA_TEXTURE_SIZE + this.nextPerObjectX

        this.nextPerObjectX += PER_OBJECT_DATA_ENTRY_SIZE_IN_PIXELS

        return result
    }

    private static updatePerObjectData(renderable: Renderable): void {
        if (renderable.perObjectDataIndex === undefined) {
            return
        }

        ramPerObjectDataBuffer.set([
            // pixel 0
            renderable.rotation[0],
            renderable.rotation[1],
            renderable.rotation[2],
            renderable.scale,
            // pixel 1
            renderable.position[0],
            renderable.position[1],
            renderable.position[2],
            0, // TODO flags
            // pixel 2
            0,
            0,
            0,
            0,
        ])

        const x = renderable.perObjectDataIndex % PER_OBJECT_DATA_TEXTURE_SIZE
        const y = Math.trunc(renderable.perObjectDataIndex / PER_OBJECT_DATA_TEXTURE_SIZE)

        gl.activeTexture(gl.TEXTURE0)
        gl.bindTexture(gl.TEXTURE_2D, Render.perObjectData)
        gl.texSubImage2D(
            gl.TEXTURE_2D,
            0,
            x,
            y,
            PER_OBJECT_DATA_ENTRY_SIZE_IN_PIXELS,
            1,
            gl.RGBA,
            gl.FLOAT,
            ramPerObjectDataBuffer
        )
    }

    private static createUBOs() {
        Render.settingsBuffer = new Float32Array(SETTINGS_SIZE)
        Render.vp = new Float32Array(Render.settingsBuffer.buffer, 0, 4 * 4)
        // settings for objects
        Render.settings = gl.createBuffer()!
        gl.bindBuffer(gl.UNIFORM_BUFFER, Render.settings)
        gl.bufferData(gl.UNIFORM_BUFFER, SETTINGS_SIZE * 4, gl.DYNAMIC_DRAW)
        gl.bindBufferBase(gl.UNIFORM_BUFFER, SETTINGS_INDEX, Render.settings)
    }

    private static compilerShaders() {
        Render.objectsShader = compileShader(
            objectsVert,
            objectsFrag,
            {
                settings: SETTINGS_INDEX,
            },
            ["textures"]
        )

        Render.skydomeShader = compileShader(
            skydomeVert,
            skydomeFrag,
            {
                settings: SETTINGS_INDEX,
            },
            ["checkerboard"]
        )

        Render.sunShader = compileShader(
            sunVert,
            sunFrag,
            {
                settings: SETTINGS_INDEX,
            },
            ["tex"]
        )

        Render.fogShader = compileShader(passthroughVert, fogFrag, {}, [
            "sceneColors",
            "depthBuffer",
        ])
        Render.passthroughShader = compileShader(passthroughVert, passthroughFrag, {}, ["tex"])
    }

    private static setupWebGL(): void {
        gl.clearColor(0.284532, 0.365823, 0.423077, 1)

        gl.disable(gl.CULL_FACE)
        gl.enable(gl.DEPTH_TEST)

        gl.enable(gl.BLEND)
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)

        gl.hint(gl.FRAGMENT_SHADER_DERIVATIVE_HINT, gl.FASTEST)
    }

    // entities

    private static allocateNewBufferChunk(): BufferChunk {
        const chunk = new BufferChunk()
        Render.scene.push(chunk)
        return chunk
    }

    static addRenderable(renderable: Renderable): void {
        let chunk = Render.scene[Render.scene.length - 1]
        if (!chunk || !chunk.tryAddRenderable(renderable)) {
            chunk = Render.allocateNewBufferChunk()
            if (!chunk.tryAddRenderable(renderable)) {
                throw new Error("shit")
            }
        }

        Render.updatePerObjectData(renderable)
    }

    static setTransform(renderable: Renderable, transformData: Float32Array): void {
        renderable.rotation[0] = transformData[0]
        renderable.rotation[1] = transformData[1]
        renderable.rotation[2] = transformData[2]
        renderable.rotation[3] = transformData[3]

        renderable.scale = transformData[4]

        renderable.position[0] = transformData[5]
        renderable.position[1] = transformData[6]
        renderable.position[2] = transformData[7]

        Render.updatePerObjectData(renderable)
    }

    // camera

    static UP = vec3.fromValues(0, 0, 1)

    static cameraPos = vec3.create()
    static cameraDirection = vec3.create()

    static setCamera(pos: vec3, lookAt: vec3): void {
        mat4.lookAt(Render.viewMatrix, pos, lookAt, Render.UP)

        mat4.identity(Render.vp)
        mat4.multiply(Render.vp, Render.vp, Render.projectionMatrix)
        mat4.multiply(Render.vp, Render.vp, Render.viewMatrix)

        vec3.copy(this.cameraPos, pos)
        vec3.sub(this.cameraDirection, lookAt, this.cameraPos)
        vec3.normalize(this.cameraDirection, this.cameraDirection)
    }

    // utils

    static handleResize(): void {
        const dpr = devicePixelRatio

        const newWidth = Math.floor(document.body.clientWidth * dpr)
        const newHeight = Math.floor(document.body.clientHeight * dpr)

        if (gl.canvas.width === newWidth && gl.canvas.height === newHeight) {
            return
        }

        ctx.canvas.style.width = newWidth / dpr + "px"
        ctx.canvas.style.height = newHeight / dpr + "px"
        ctx.canvas.width = newWidth
        ctx.canvas.height = newHeight

        const glCanvas = gl.canvas as HTMLCanvasElement
        glCanvas.style.width = newWidth / dpr + "px"
        glCanvas.style.height = newHeight / dpr + "px"
        gl.canvas.width = newWidth
        gl.canvas.height = newHeight

        ctx.resetTransform()
        ctx.scale(dpr, dpr)

        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height)

        mat4.perspective(
            Render.projectionMatrix,
            (65 * Math.PI) / 180,
            gl.canvas.width / gl.canvas.height,
            15,
            undefined!
        )
    }

    static render(): void {
        gl.enable(gl.CULL_FACE)
        gl.cullFace(gl.BACK)

        gl.bindFramebuffer(gl.FRAMEBUFFER, this.mainPass)

        gl.colorMask(true, true, true, false)

        Render.handleResize()

        const { objectsShader, skydomeShader } = Render

        gl.disable(gl.BLEND)
        gl.enable(gl.DEPTH_TEST)

        mat4.identity(Render.vp)
        mat4.multiply(Render.vp, Render.vp, Render.projectionMatrix)
        mat4.multiply(Render.vp, Render.vp, Render.viewMatrix)
        gl.bindBuffer(gl.UNIFORM_BUFFER, Render.settings)
        gl.bufferSubData(gl.UNIFORM_BUFFER, 0, Render.settingsBuffer)

        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

        gl.useProgram(objectsShader)
        gl.uniform1iv(objectsShader.textures, Render.texturesBuffer)

        gl.activeTexture(gl.TEXTURE0)
        gl.bindTexture(gl.TEXTURE_2D, Render.perObjectData)

        for (const chunk of Render.scene) {
            gl.bindVertexArray(chunk.vao)

            for (let i = 0; i < chunk.atlases.length; i++) {
                const atlas = chunk.atlases[i]
                atlas.update()

                gl.activeTexture(gl.TEXTURE1 + i)
                gl.bindTexture(gl.TEXTURE_2D, atlas.texture)
            }

            gl.drawElements(gl.TRIANGLES, chunk.indexPos, gl.UNSIGNED_INT, 0)
        }

        // shader for sky

        gl.depthFunc(gl.LEQUAL)
        gl.enable(gl.BLEND)

        const viewMatrixWithoutTranslation = mat4.clone(Render.viewMatrix)
        viewMatrixWithoutTranslation[12] = 0
        viewMatrixWithoutTranslation[13] = 0
        viewMatrixWithoutTranslation[14] = 0
        viewMatrixWithoutTranslation[15] = 0

        // sky dome

        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)

        mat4.identity(Render.vp)
        mat4.multiply(Render.vp, Render.vp, Render.projectionMatrix)
        mat4.multiply(Render.vp, Render.vp, viewMatrixWithoutTranslation)
        gl.bindBuffer(gl.UNIFORM_BUFFER, Render.settings)
        gl.bufferSubData(gl.UNIFORM_BUFFER, 0, Render.settingsBuffer)

        gl.useProgram(skydomeShader)
        gl.uniform1i(skydomeShader.checkerboard, 0)

        gl.activeTexture(gl.TEXTURE0)
        gl.bindTexture(gl.TEXTURE_2D, Render.checkerboard)

        gl.bindVertexArray(this.skydome.vao)

        gl.drawElements(gl.TRIANGLES, this.skydome.mesh.indices.length, gl.UNSIGNED_SHORT, 0)

        // sun

        gl.disable(gl.BLEND)
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE)

        mat4.identity(Render.vp)
        mat4.multiply(Render.vp, Render.vp, Render.projectionMatrix)
        mat4.multiply(Render.vp, Render.vp, viewMatrixWithoutTranslation)

        const yAngle = Math.PI * 1.5

        const model = mat4.create()
        mat4.rotateY(model, model, yAngle)
        // mat4.rotateY(model, model, 0.1)
        // const sunPos = vec3.fromValues(20.6666469573975, 77.4717559814453, 341.035034179687)

        const q = quat.create()
        mat4.getRotation(q, this.viewMatrix)

        const objQ = quat.create()
        mat4.getRotation(objQ, model)

        quat.mul(q, q, objQ)
        quat.invert(q, q)

        const p = vec3.fromValues(0, 1, 0)
        vec3.transformQuat(p, p, q)

        const a = Math.atan2(p[1], p[0])

        console.log("angle: ", (a / Math.PI) * 180)

        mat4.translate(model, model, vec3.fromValues(0, 0, 350))

        mat4.rotateZ(model, model, a)

        mat4.rotateX(model, model, Math.PI)
        mat4.rotateZ(model, model, -Math.PI / 2)

        mat4.multiply(Render.vp, Render.vp, model)

        gl.bindBuffer(gl.UNIFORM_BUFFER, Render.settings)
        gl.bufferSubData(gl.UNIFORM_BUFFER, 0, Render.settingsBuffer)

        gl.useProgram(this.sunShader)
        gl.uniform1i(this.sunShader.tex, 0)

        gl.activeTexture(gl.TEXTURE0)
        gl.bindTexture(gl.TEXTURE_2D, Render.sunTexture)

        gl.bindVertexArray(this.sun.vao)

        gl.drawElements(gl.TRIANGLES, this.sun.mesh.indices.length, gl.UNSIGNED_SHORT, 0)

        // fog
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.fogPass)

        gl.disable(gl.DEPTH_TEST)

        gl.colorMask(true, true, true, true)

        gl.blendFunc(gl.ONE, gl.ZERO)

        gl.useProgram(this.fogShader)
        gl.uniform1i(this.fogShader.sceneColors, 0)
        gl.uniform1i(this.fogShader.depthBuffer, 1)

        gl.activeTexture(gl.TEXTURE0)
        gl.bindTexture(gl.TEXTURE_2D, Render.mainPassTexture)

        gl.activeTexture(gl.TEXTURE1)
        gl.bindTexture(gl.TEXTURE_2D, Render.depthBuffer)

        gl.bindVertexArray(this.fullscreenPlain.vao)

        gl.drawElements(
            gl.TRIANGLES,
            this.fullscreenPlain.mesh.indices.length,
            gl.UNSIGNED_SHORT,
            0
        )

        // render to canvas

        gl.bindFramebuffer(gl.FRAMEBUFFER, null)

        gl.disable(gl.DEPTH_TEST)
        gl.disable(gl.BLEND)
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE)

        gl.colorMask(true, true, true, true)

        gl.useProgram(this.passthroughShader)
        gl.uniform1i(this.passthroughShader.tex, 0)

        gl.activeTexture(gl.TEXTURE0)
        gl.bindTexture(gl.TEXTURE_2D, Render.fogPassTexture)

        gl.bindVertexArray(this.fullscreenPlain.vao)

        gl.drawElements(
            gl.TRIANGLES,
            this.fullscreenPlain.mesh.indices.length,
            gl.UNSIGNED_SHORT,
            0
        )
    }

    static finalize(): void {
        //
    }
}
