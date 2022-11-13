/* eslint-disable @typescript-eslint/no-non-null-assertion */

import objectsVert from "../../shaders/objects.vert"
import objectsFrag from "../../shaders/objects.frag"

import { mat4, quat, vec3 } from "gl-matrix"
import { compileShader, WebGLProgramWithUniforms } from "./render-utils"
import { gl, ctx } from "./render-context"
import { Renderable, VERTEX_SIZE } from "./renderable"
import { Atlas, ATLAS_SIZE } from "./atlas"
import { MESH_VERTEX_SIZE } from "../resources/loaders"
import { Texture } from "./render-data"

const VERTEX_BUFFER_SIZE = Math.trunc((4 * 1024 * 1024) / 4 / VERTEX_SIZE) // in vertex count
const INDEX_BUFFER_SIZE = VERTEX_BUFFER_SIZE // in index count

const POSITION_INDEX = 0
const NORMAL_INDEX = 1
const UV_INDEX = 2
const PARAMS_INDEX = 3

const ramVertexBuffer = new Float32Array(VERTEX_BUFFER_SIZE * VERTEX_SIZE)
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

        gl.bufferData(gl.ARRAY_BUFFER, VERTEX_BUFFER_SIZE * VERTEX_SIZE * 4, gl.STREAM_DRAW)
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

            gl.vertexAttribPointer(index, size, gl.FLOAT, false, VERTEX_SIZE * 4, offset)

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

        // we can add this object to this chunk

        const perObjectDataIndex = Render.allocatePerObjectInfoIndex()

        // setup vertices
        for (let vertexIndex = 0; vertexIndex < vertexCount; vertexIndex++) {
            const MESH_VERTEX_STATIC_SIZE = 3 + 3
            for (let i = 0; i < MESH_VERTEX_STATIC_SIZE; i++) {
                ramVertexBuffer[vertexIndex * VERTEX_SIZE + i] =
                    mesh.vertices[vertexIndex * MESH_VERTEX_SIZE + i]
            }

            let u = mesh.vertices[vertexIndex * MESH_VERTEX_SIZE + MESH_VERTEX_STATIC_SIZE + 0]
            let v = mesh.vertices[vertexIndex * MESH_VERTEX_SIZE + MESH_VERTEX_STATIC_SIZE + 1]

            // fix UV for atlas

            u = uOffset + u * uScale
            v = vOffset + v * vScale

            ramVertexBuffer[vertexIndex * VERTEX_SIZE + MESH_VERTEX_STATIC_SIZE + 0] = u
            ramVertexBuffer[vertexIndex * VERTEX_SIZE + MESH_VERTEX_STATIC_SIZE + 1] = v

            ramVertexBuffer[vertexIndex * VERTEX_SIZE + MESH_VERTEX_SIZE + 0] = perObjectDataIndex
        }

        // pass vertices to GPU
        gl.bufferSubData(
            gl.ARRAY_BUFFER,
            this.vertexPos * VERTEX_SIZE * 4,
            ramVertexBuffer,
            0,
            vertexCount * VERTEX_SIZE
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

export class Render {
    private static viewMatrix: mat4
    private static projectionMatrix: mat4
    private static vp: mat4

    private static settingsBuffer: Float32Array
    private static texturesBuffer = new Int32Array([
        0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15,
    ])

    private static perObjectData: WebGLBuffer
    // TODO keep list of free entries
    private static nextPerObjectX = 0
    private static nextPerObjectY = 0

    private static settings: WebGLBuffer
    private static objectsShader: WebGLProgramWithUniforms

    private static scene: BufferChunk[] = []

    static init(): void {
        Render.projectionMatrix = mat4.create()
        Render.viewMatrix = mat4.create()
        Render.vp = mat4.create()

        Render.createPerObjectData()
        Render.createUBOs()
        Render.compilerShaders()

        Render.setupWebGL()
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

        // view
        Render.vp = new Float32Array(Render.settingsBuffer.buffer, 0, 4 * 4)

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
    }

    private static setupWebGL(): void {
        gl.clearColor(0.284532, 0.365823, 0.423077, 1)

        gl.disable(gl.CULL_FACE)
        gl.enable(gl.DEPTH_TEST)

        gl.disable(gl.BLEND)
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
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
        renderable.position[0] = transformData[0]
        renderable.position[1] = transformData[1]
        renderable.position[2] = transformData[2]
        renderable.position[3] = transformData[3]

        renderable.scale = transformData[4]

        renderable.position[0] = transformData[5]
        renderable.position[1] = transformData[6]
        renderable.position[2] = transformData[7]

        Render.updatePerObjectData(renderable)
    }

    // camera

    static UP = vec3.fromValues(0, 0, 1)

    static setCamera(pos: vec3, lookAt: vec3): void {
        mat4.lookAt(Render.viewMatrix, pos, lookAt, Render.UP)

        mat4.identity(Render.vp)
        mat4.multiply(Render.vp, Render.vp, Render.projectionMatrix)
        mat4.multiply(Render.vp, Render.vp, Render.viewMatrix)
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

        gl.canvas.style.width = newWidth / dpr + "px"
        gl.canvas.style.height = newHeight / dpr + "px"
        gl.canvas.width = newWidth
        gl.canvas.height = newHeight

        ctx.resetTransform()
        ctx.scale(dpr, dpr)

        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height)

        mat4.perspective(
            Render.projectionMatrix,
            (65 * Math.PI) / 180,
            gl.canvas.width / gl.canvas.height,
            0.1,
            100
        )
    }

    static render(): void {
        Render.handleResize()

        const { objectsShader } = Render

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
    }

    static finalize(): void {
        //
    }
}
