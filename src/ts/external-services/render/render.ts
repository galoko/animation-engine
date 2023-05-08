/* eslint-disable @typescript-eslint/no-non-null-assertion */

import objectsShadowNearVert from "../../shaders/objects-shadow-near.vert.wgsl"
import objectsShadowFarVert from "../../shaders/objects-shadow-far.vert.wgsl"

import objectsVert from "../../shaders/objects.vert.wgsl"
import objectsFrag from "../../shaders/objects.frag.wgsl"

import skydomeVert from "../../shaders/skydome.vert.wgsl"
import skydomeFrag from "../../shaders/skydome.frag.wgsl"

import sunVert from "../../shaders/sun.vert.wgsl"
import sunFrag from "../../shaders/sun.frag.wgsl"

import passthroughVert from "../../shaders/passthrough.vert.wgsl"
import passthroughFrag from "../../shaders/passthrough.frag.wgsl"
import passthroughDepthFrag from "../../shaders/passthrough-depth.frag.wgsl"

import fogFrag from "../../shaders/fog.frag.wgsl"

import glareVert from "../../shaders/glare.vert.wgsl"
import glareFrag from "../../shaders/glare.frag.wgsl"

import blankVert from "../../shaders/blank.vert.wgsl"
import blankFrag from "../../shaders/blank.frag.wgsl"

import debugFrustumVert from "../../shaders/debug-frustum.vert.wgsl"
import debugFrustumFrag from "../../shaders/debug-frustum.frag.wgsl"

import { mat4, quat, vec3, vec4 } from "gl-matrix"
import { wg, ctx, wd, canvasWebGPU } from "./render-context"
import { CHUNK_MESH_VERTEX_SIZE, Renderable } from "./renderable"
import { Atlas, ATLAS_SIZE, MAX_ATLASES_COUNT } from "./atlas"
import {
    COLORED_MESH_SIZE,
    COLORED_TEXTURED_MESH_SIZE,
    loadColoredMeshFromURL,
    loadColoredTexturedMeshFromURL,
    loadTexture,
    MESH_VERTEX_SIZE,
} from "../resources/loaders"
import { ColoredMesh, ColoredTexturedMesh, Mesh, Texture } from "./render-data"
import { ResourceManager } from "../resources/resource-manager"

const POSITION_LOC = 0
const COLOR_LOC = 1
const NORMAL_LOC = 1
const UV_LOC = 2
const PARAMS_LOC = 3

class GenericMesh {
    readonly vertices: GPUBuffer
    readonly indices: GPUBuffer
    readonly indexCount: number

    constructor(verticesData: Float32Array, indicesData: Uint16Array) {
        this.vertices = wd.createBuffer({
            size: verticesData.byteLength,
            usage: GPUBufferUsage.VERTEX,
            mappedAtCreation: true,
        })
        this.indices = wd.createBuffer({
            size: indicesData.byteLength,
            usage: GPUBufferUsage.INDEX,
            mappedAtCreation: true,
        })

        new Float32Array(this.vertices.getMappedRange()).set(verticesData)
        this.vertices.unmap()

        new Uint16Array(this.indices.getMappedRange()).set(indicesData)
        this.indices.unmap()

        this.indexCount = indicesData.length
    }
}

class ColoredMeshBuffer extends GenericMesh {
    static readonly buffers: Iterable<GPUVertexBufferLayout> = [
        {
            arrayStride: COLORED_MESH_SIZE * 4,
            attributes: [
                {
                    shaderLocation: POSITION_LOC,
                    offset: 0,
                    format: "float32x3",
                },
                {
                    shaderLocation: COLOR_LOC,
                    offset: 3 * 4,
                    format: "unorm8x4",
                },
            ],
        },
    ]

    constructor(public mesh: ColoredMesh) {
        super(mesh.vertices, mesh.indices)
    }
}

class MeshBuffer extends GenericMesh {
    static readonly buffers: Iterable<GPUVertexBufferLayout> = [
        {
            arrayStride: MESH_VERTEX_SIZE * 4,
            attributes: [
                {
                    shaderLocation: POSITION_LOC,
                    offset: 0,
                    format: "float32x3",
                },
                {
                    shaderLocation: NORMAL_LOC,
                    offset: 3 * 4,
                    format: "float32x3",
                },
                {
                    shaderLocation: UV_LOC,
                    offset: 6 * 4,
                    format: "float32x2",
                },
            ],
        },
    ]

    constructor(public mesh: Mesh) {
        super(mesh.vertices, mesh.indices)
    }
}

class ColoredTexturedMeshBuffer extends GenericMesh {
    static readonly buffers: Iterable<GPUVertexBufferLayout> = [
        {
            arrayStride: COLORED_TEXTURED_MESH_SIZE * 4,
            attributes: [
                {
                    shaderLocation: POSITION_LOC,
                    offset: 0,
                    format: "float32x3",
                },
                {
                    shaderLocation: UV_LOC,
                    offset: 3 * 4,
                    format: "float32x2",
                },
                {
                    shaderLocation: COLOR_LOC,
                    offset: (3 + 2) * 4,
                    format: "unorm8x4",
                },
            ],
        },
    ]

    constructor(public mesh: ColoredTexturedMesh) {
        super(mesh.vertices, mesh.indices)
    }
}

// in vertex count
const VERTEX_BUFFER_SIZE = Math.trunc((4 * 1024 * 1024) / 4 / CHUNK_MESH_VERTEX_SIZE)
const INDEX_BUFFER_SIZE = VERTEX_BUFFER_SIZE // in index count

const ramVertexBuffer = new Float32Array(VERTEX_BUFFER_SIZE * CHUNK_MESH_VERTEX_SIZE)
const ramIndexBuffer = new Uint32Array(INDEX_BUFFER_SIZE)

class BufferChunk {
    static readonly buffers: Iterable<GPUVertexBufferLayout> = [
        {
            arrayStride: CHUNK_MESH_VERTEX_SIZE * 4,
            attributes: [
                {
                    shaderLocation: POSITION_LOC,
                    offset: 0,
                    format: "float32x3",
                },
                {
                    shaderLocation: NORMAL_LOC,
                    offset: 3 * 4,
                    format: "float32x3",
                },
                {
                    shaderLocation: UV_LOC,
                    offset: (3 + 3) * 4,
                    format: "float32x2",
                },
                {
                    shaderLocation: PARAMS_LOC,
                    offset: (3 + 3 + 2) * 4,
                    format: "float32",
                },
            ],
        },
    ]

    vertices: GPUBuffer
    indices: GPUBuffer

    vertexPos = 0
    indexPos = 0

    constructor() {
        this.vertices = wd.createBuffer({
            size: VERTEX_BUFFER_SIZE * CHUNK_MESH_VERTEX_SIZE * 4,
            usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
        })
        this.indices = wd.createBuffer({
            size: INDEX_BUFFER_SIZE * 4,
            usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
        })
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

        const [uOffset, vOffset, atlasNum] = Render.getAtlasSlotForTexture(texture)

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
        wd.queue.writeBuffer(
            this.vertices,
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
        wd.queue.writeBuffer(this.indices, this.indexPos * 4, ramIndexBuffer, 0, indexCount)

        // seek the chunk

        this.vertexPos += vertexCount
        this.indexPos += indexCount

        // done

        renderable.atlasNum = atlasNum
        renderable.perObjectDataIndex = perObjectDataIndex

        return true
    }
}

const MAT4_FLOAT_SIZE = 4 * 4
const MAT4_BYTE_SIZE = MAT4_FLOAT_SIZE * 4

const SETTINGS_SIZE = 6 * MAT4_FLOAT_SIZE

const PER_OBJECT_DATA_BUFFER_SIZE = 1024 * 1024
// compressed quat + scale + position + flags
const PER_OBJECT_DATA_ENTRY_SIZE = 3 + 1 + 3 + 1

const ramPerObjectDataBuffer = new Float32Array(PER_OBJECT_DATA_ENTRY_SIZE)

function createTexture(tex: Texture): GPUTexture {
    const texture = wd.createTexture({
        size: [tex.width, tex.height, 1],
        format: "rgba8unorm",
        usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
    })

    wd.queue.writeTexture(
        { texture },
        tex.pixels,
        { bytesPerRow: tex.width * 4, rowsPerImage: tex.height },
        { width: tex.width, height: tex.height }
    )

    return texture
}

function createFloatTexture(width: number, height: number): GPUTexture {
    const texture = wd.createTexture({
        size: [width, height, 1],
        format: "rgb10a2unorm",
        usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.RENDER_ATTACHMENT,
    })

    return texture
}

type AtlasSlot = [number, number, number]

enum BlankQueryState {
    None,
    Requested,
    Pending,
}

const QUERY_BUFFER_SIZE = 8

const SHADOW_RESOLUTION = 4096

export class Render {
    private static viewMatrix: mat4
    private static viewMatrix_inplace: mat4
    private static projectionMatrix: mat4

    private static vp: mat4
    private static vp_inv: mat4
    private static vp_inplace: mat4
    private static vp_sun: mat4
    private static vp_glare: mat4
    private static vp_shadow_near: mat4
    private static vp_shadow_far: mat4

    private static settingsBuffer: Float32Array
    private static settings: GPUBuffer

    private static shadowNearPipeline: GPURenderPipeline
    private static shadowNearBind: GPUBindGroup
    private static shadowFarPipeline: GPURenderPipeline
    private static shadowFarBind: GPUBindGroup

    private static objectsPipeline: GPURenderPipeline
    private static objectsBind: GPUBindGroup

    private static skydomePipeline: GPURenderPipeline
    private static skydomeBind: GPUBindGroup

    private static sunPipeline: GPURenderPipeline
    private static sunBind: GPUBindGroup

    private static blankPipeline: GPURenderPipeline
    private static blankBind: GPUBindGroup

    private static fogPipeline: GPURenderPipeline
    private static fogBind: GPUBindGroup

    private static screenPipeline: GPURenderPipeline
    private static screenBind: GPUBindGroup

    private static glarePipeline: GPURenderPipeline
    private static glareBind: GPUBindGroup

    // atlases
    private static atlasesTexture: GPUTexture
    private static atlases: Atlas[]
    private static atlasCache: Map<string, AtlasSlot>

    // shadow cascade depth buffers
    private static shadowDepthBuffers: GPUTexture
    private static shadowDepthBuffersView: GPUTextureView
    private static shadowDepthBufferNearView: GPUTextureView
    private static shadowDepthBufferFarView: GPUTextureView
    private static shadowNearPassDesc: GPURenderPassDescriptor
    private static shadowFarPassDesc: GPURenderPassDescriptor

    // render targets
    private static mainPassTexture: GPUTexture
    private static mainPassTextureView: GPUTextureView
    private static depthBuffer: GPUTexture
    private static depthBufferView: GPUTextureView
    private static mainPassDesc: GPURenderPassDescriptor

    private static fogPassTexture: GPUTexture
    private static fogPassTextureView: GPUTextureView
    private static fogPassDesc: GPURenderPassDescriptor

    private static screenPassDesc: GPURenderPassDescriptor

    private static skydome: ColoredMeshBuffer
    private static checkerboard: GPUTexture
    private static sun: ColoredTexturedMeshBuffer
    private static sunTexture: GPUTexture
    private static blank: ColoredTexturedMeshBuffer
    private static glare: ColoredTexturedMeshBuffer
    private static glareTexture: GPUTexture
    private static fullscreenPlain: MeshBuffer

    private static debugTextureView: GPUTextureView
    private static debugTexturePlane: MeshBuffer
    private static debugTextureBind: GPUBindGroup
    private static debugDepthPipeline: GPURenderPipeline

    private static debugFrustumMesh: MeshBuffer
    private static debugFrustumBind: GPUBindGroup
    private static debugFrustumPipeline: GPURenderPipeline

    private static perObjectData: GPUBuffer
    // TODO keep list of free entries
    private static nextPerObjectIndex = 0

    // shaders
    private static blankQuery: GPUQuerySet
    private static blankQueryResult: GPUBuffer
    private static blankQueryResultAsync: GPUBuffer
    private static blankQueryState = BlankQueryState.None
    private static blankSamplesCount = 0

    private static glareScale = 0

    // camera

    private static cameraPosition: vec3

    private static scene: BufferChunk[] = []

    static async init(): Promise<void> {
        Render.projectionMatrix = mat4.create()
        Render.viewMatrix = mat4.create()
        Render.viewMatrix_inplace = mat4.create()
        Render.cameraPosition = vec3.create()
        Render.vp_inv = mat4.create()

        Render.handleResize()

        Render.initAtlases()
        Render.setupFrameBuffers()
        Render.createPerObjectData()
        Render.compilerShaders()
        await Render.loadResources()
        Render.createUBOs()
    }

    static async loadResources(): Promise<void> {
        Render.skydome = new ColoredMeshBuffer(await loadColoredMeshFromURL("build/skydome.cml"))
        Render.checkerboard = createTexture(await loadTexture("build/checkerboard.png"))

        Render.sun = new ColoredTexturedMeshBuffer(
            await loadColoredTexturedMeshFromURL("build/sun.ctml")
        )
        Render.sunTexture = createTexture(await loadTexture("build/sun.png"))

        Render.blank = new ColoredTexturedMeshBuffer(
            await loadColoredTexturedMeshFromURL("build/blank.ctml")
        )

        Render.glare = new ColoredTexturedMeshBuffer(
            await loadColoredTexturedMeshFromURL("build/glare.ctml")
        )
        Render.glareTexture = createTexture(await loadTexture("build/glare.png"))
    }

    static async setupTest(): Promise<void> {
        /*
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
                    // rotation
                    0,
                    0,
                    0,
                    1,
                    // scale
                    coordinates[i * 4 + 0],
                    // position
                    coordinates[i * 4 + 1],
                    coordinates[i * 4 + 2],
                    coordinates[i * 4 + 3],
                ])
            )

            Render.addRenderable(mountains)
        }
        */

        Render.fullscreenPlain = new MeshBuffer(
            await ResourceManager.requestMesh("fullscreen_plane")
        )

        Render.debugTexturePlane = new MeshBuffer(ResourceManager.generatePlane(50, 50, 400, 400))
    }

    private static initAtlases() {
        Render.atlasesTexture = wd.createTexture({
            size: [ATLAS_SIZE, ATLAS_SIZE, MAX_ATLASES_COUNT],
            dimension: "2d",
            format: "rgba8unorm",
            usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
        })
        Render.atlases = []
        Render.atlasCache = new Map<string, AtlasSlot>()
    }

    private static allocateNewAtlas(): Atlas {
        const atlasNum = Render.atlases.length
        const atlas = new Atlas(atlasNum, Render.atlasesTexture)
        Render.atlases.push(atlas)
        return atlas
    }

    public static getAtlasSlotForTexture(texture: Texture): AtlasSlot {
        const slot = Render.atlasCache.get(texture.id)
        if (slot) {
            return slot
        }

        const newSlot = Render.allocateAndCopyTextureToAtlas(texture)
        Render.atlasCache.set(texture.id, newSlot)

        return newSlot
    }

    private static allocateAndCopyTextureToAtlas(texture: Texture): AtlasSlot {
        for (const atlas of Render.atlases) {
            const res = atlas.tryAddTexture(texture)

            if (res) {
                return [...res, atlas.num]
            }
        }

        const atlas = Render.allocateNewAtlas()

        const res = atlas.tryAddTexture(texture)
        if (!res) {
            throw new Error("Can't put texture in empty Atlas.")
        }

        return [...res, atlas.num]
    }

    private static setupFrameBuffers() {
        Render.mainPassTexture = createFloatTexture(canvasWebGPU.width, canvasWebGPU.height)
        Render.mainPassTextureView = Render.mainPassTexture.createView()

        Render.depthBuffer = wd.createTexture({
            size: [canvasWebGPU.width, canvasWebGPU.height],
            format: "depth24plus",
            usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.RENDER_ATTACHMENT,
        })
        Render.depthBufferView = Render.depthBuffer.createView()

        Render.shadowDepthBuffers = wd.createTexture({
            size: [SHADOW_RESOLUTION, SHADOW_RESOLUTION, 2],
            format: "depth24plus",
            usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.RENDER_ATTACHMENT,
        })
        Render.shadowDepthBuffersView = Render.shadowDepthBuffers.createView()
        Render.shadowDepthBufferNearView = Render.shadowDepthBuffers.createView({
            baseArrayLayer: 0,
            arrayLayerCount: 1,
            dimension: "2d",
        })
        Render.shadowDepthBufferFarView = Render.shadowDepthBuffers.createView({
            baseArrayLayer: 1,
            arrayLayerCount: 1,
            dimension: "2d",
        })

        Render.debugTextureView = Render.shadowDepthBufferNearView

        Render.blankQuery = wd.createQuerySet({
            type: "occlusion",
            count: 1,
        })
        Render.blankQueryResult = wd.createBuffer({
            size: QUERY_BUFFER_SIZE,
            usage: GPUBufferUsage.QUERY_RESOLVE | GPUBufferUsage.COPY_SRC,
        })
        Render.blankQueryResultAsync = wd.createBuffer({
            size: QUERY_BUFFER_SIZE,
            usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
        })

        Render.shadowNearPassDesc = {
            colorAttachments: [],
            depthStencilAttachment: {
                view: Render.shadowDepthBufferNearView,

                depthClearValue: 1.0,
                depthLoadOp: "clear",
                depthStoreOp: "store",
            },
        }

        Render.shadowFarPassDesc = {
            colorAttachments: [],
            depthStencilAttachment: {
                view: Render.shadowDepthBufferFarView,

                depthClearValue: 1.0,
                depthLoadOp: "clear",
                depthStoreOp: "store",
            },
        }

        Render.mainPassDesc = {
            colorAttachments: [
                {
                    view: Render.mainPassTextureView,

                    clearValue: {
                        r: 0.284532,
                        g: 0.365823,
                        b: 0.423077,
                        a: 1.0,
                    },
                    loadOp: "clear",
                    storeOp: "store",
                },
            ],
            depthStencilAttachment: {
                view: Render.depthBufferView,

                depthClearValue: 1.0,
                depthLoadOp: "clear",
                depthStoreOp: "store",
            },
            occlusionQuerySet: Render.blankQuery,
        }

        // fog pass

        Render.fogPassTexture = createFloatTexture(canvasWebGPU.width, canvasWebGPU.height)
        Render.fogPassTextureView = Render.fogPassTexture.createView()

        Render.fogPassDesc = {
            colorAttachments: [
                {
                    view: Render.fogPassTextureView,

                    clearValue: {
                        r: 0,
                        g: 0,
                        b: 0,
                        a: 1,
                    },
                    loadOp: "clear",
                    storeOp: "store",
                },
            ],
        }

        Render.screenPassDesc = {
            colorAttachments: [
                {
                    view: null!,

                    clearValue: {
                        r: 0,
                        g: 0,
                        b: 0,
                        a: 1,
                    },
                    loadOp: "clear",
                    storeOp: "store",
                },
            ],
        }
    }

    private static createPerObjectData() {
        Render.perObjectData = wd.createBuffer({
            size: PER_OBJECT_DATA_BUFFER_SIZE * PER_OBJECT_DATA_ENTRY_SIZE * 4,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
        })
    }

    static allocatePerObjectInfoIndex(): number {
        if (Render.nextPerObjectIndex + 1 > PER_OBJECT_DATA_BUFFER_SIZE) {
            throw new Error("Out of space in PerObjectData.")
        }

        const result = Render.nextPerObjectIndex

        Render.nextPerObjectIndex += 1

        return result
    }

    private static updatePerObjectData(renderable: Renderable): void {
        if (renderable.perObjectDataIndex === undefined) {
            return
        }

        if (renderable.atlasNum === undefined) {
            throw "Object doesn't have an atlas"
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
            renderable.atlasNum!,
        ])

        const i = renderable.perObjectDataIndex
        const byteOffset = i * PER_OBJECT_DATA_ENTRY_SIZE * 4

        wd.queue.writeBuffer(
            Render.perObjectData,
            byteOffset,
            ramPerObjectDataBuffer,
            0,
            PER_OBJECT_DATA_ENTRY_SIZE
        )
    }

    private static createUBOs() {
        const linearSampler = wd.createSampler({
            magFilter: "linear",
            minFilter: "linear",
            mipmapFilter: "linear",
            maxAnisotropy: 16,
            addressModeU: "repeat",
            addressModeV: "repeat",
        })

        Render.settingsBuffer = new Float32Array(SETTINGS_SIZE)

        Render.vp = new Float32Array(
            Render.settingsBuffer.buffer,
            0 * MAT4_BYTE_SIZE,
            MAT4_FLOAT_SIZE
        )
        Render.vp_inplace = new Float32Array(
            Render.settingsBuffer.buffer,
            1 * MAT4_BYTE_SIZE,
            MAT4_FLOAT_SIZE
        )
        Render.vp_sun = new Float32Array(
            Render.settingsBuffer.buffer,
            2 * MAT4_BYTE_SIZE,
            MAT4_FLOAT_SIZE
        )
        Render.vp_glare = new Float32Array(
            Render.settingsBuffer.buffer,
            3 * MAT4_BYTE_SIZE,
            MAT4_FLOAT_SIZE
        )
        Render.vp_shadow_near = new Float32Array(
            Render.settingsBuffer.buffer,
            4 * MAT4_BYTE_SIZE,
            MAT4_FLOAT_SIZE
        )
        Render.vp_shadow_far = new Float32Array(
            Render.settingsBuffer.buffer,
            5 * MAT4_BYTE_SIZE,
            MAT4_FLOAT_SIZE
        )

        // settings for objects
        Render.settings = wd.createBuffer({
            size: SETTINGS_SIZE * 4,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        })

        Render.shadowNearBind = wd.createBindGroup({
            layout: Render.shadowNearPipeline.getBindGroupLayout(0),
            entries: [
                {
                    binding: 0,
                    resource: {
                        buffer: Render.settings,
                    },
                },
                {
                    binding: 1,
                    resource: {
                        buffer: Render.perObjectData,
                    },
                },
            ],
        })

        Render.shadowFarBind = wd.createBindGroup({
            layout: Render.shadowFarPipeline.getBindGroupLayout(0),
            entries: [
                {
                    binding: 0,
                    resource: {
                        buffer: Render.settings,
                    },
                },
                {
                    binding: 1,
                    resource: {
                        buffer: Render.perObjectData,
                    },
                },
            ],
        })

        Render.objectsBind = wd.createBindGroup({
            layout: Render.objectsPipeline.getBindGroupLayout(0),
            entries: [
                {
                    binding: 0,
                    resource: {
                        buffer: Render.settings,
                    },
                },
                {
                    binding: 1,
                    resource: {
                        buffer: Render.perObjectData,
                    },
                },
                {
                    binding: 2,
                    resource: linearSampler,
                },
                {
                    binding: 3,
                    resource: Render.atlasesTexture.createView(),
                },
            ],
        })

        const checkerboardView = Render.checkerboard.createView()

        Render.skydomeBind = wd.createBindGroup({
            layout: Render.skydomePipeline.getBindGroupLayout(0),
            entries: [
                {
                    binding: 0,
                    resource: {
                        buffer: Render.settings,
                    },
                },
                {
                    binding: 1,
                    resource: linearSampler,
                },
                {
                    binding: 2,
                    resource: checkerboardView,
                },
            ],
        })

        Render.sunBind = wd.createBindGroup({
            layout: Render.sunPipeline.getBindGroupLayout(0),
            entries: [
                {
                    binding: 0,
                    resource: {
                        buffer: Render.settings,
                    },
                },
                {
                    binding: 1,
                    resource: linearSampler,
                },
                {
                    binding: 2,
                    resource: Render.sunTexture.createView(),
                },
            ],
        })

        Render.blankBind = wd.createBindGroup({
            layout: Render.blankPipeline.getBindGroupLayout(0),
            entries: [
                {
                    binding: 0,
                    resource: {
                        buffer: Render.settings,
                    },
                },
            ],
        })

        Render.fogBind = wd.createBindGroup({
            layout: Render.fogPipeline.getBindGroupLayout(0),
            entries: [
                {
                    binding: 0,
                    resource: linearSampler,
                },
                {
                    binding: 1,
                    resource: Render.mainPassTextureView,
                },
                {
                    binding: 2,
                    resource: Render.depthBufferView,
                },
            ],
        })

        Render.screenBind = wd.createBindGroup({
            layout: Render.screenPipeline.getBindGroupLayout(0),
            entries: [
                {
                    binding: 0,
                    resource: linearSampler,
                },
                {
                    binding: 1,
                    resource: Render.fogPassTextureView,
                },
            ],
        })

        Render.glareBind = wd.createBindGroup({
            layout: Render.glarePipeline.getBindGroupLayout(0),
            entries: [
                {
                    binding: 0,
                    resource: {
                        buffer: Render.settings,
                    },
                },
                {
                    binding: 1,
                    resource: linearSampler,
                },
                {
                    binding: 2,
                    resource: Render.glareTexture.createView(),
                },
                {
                    binding: 3,
                    resource: checkerboardView,
                },
            ],
        })

        Render.debugTextureBind = wd.createBindGroup({
            layout: Render.debugDepthPipeline.getBindGroupLayout(0),
            entries: [
                {
                    binding: 0,
                    resource: linearSampler,
                },
                {
                    binding: 1,
                    resource: Render.debugTextureView,
                },
            ],
        })

        Render.debugFrustumBind = wd.createBindGroup({
            layout: Render.debugFrustumPipeline.getBindGroupLayout(0),
            entries: [
                {
                    binding: 0,
                    resource: {
                        buffer: Render.settings,
                    },
                },
            ],
        })
    }

    private static compilerShaders() {
        const screenFormat = navigator.gpu.getPreferredCanvasFormat()

        const primitive: GPUPrimitiveState = {
            topology: "triangle-list",
            cullMode: "none",
        }

        // objects

        const objectsShadowNearShaderVert = wd.createShaderModule({ code: objectsShadowNearVert })
        Render.shadowNearPipeline = wd.createRenderPipeline({
            layout: "auto",
            vertex: {
                module: objectsShadowNearShaderVert,
                entryPoint: "main",
                buffers: BufferChunk.buffers,
            },
            depthStencil: {
                depthWriteEnabled: true,
                depthCompare: "less",
                format: "depth24plus",
            },
            primitive,
        })

        const objectsShadowFarShaderVert = wd.createShaderModule({ code: objectsShadowFarVert })
        Render.shadowFarPipeline = wd.createRenderPipeline({
            layout: "auto",
            vertex: {
                module: objectsShadowFarShaderVert,
                entryPoint: "main",
                buffers: BufferChunk.buffers,
            },
            depthStencil: {
                depthWriteEnabled: true,
                depthCompare: "less",
                format: "depth24plus",
            },
            primitive,
        })

        const objectsShaderVert = wd.createShaderModule({ code: objectsVert })
        const objectsShaderFrag = wd.createShaderModule({ code: objectsFrag })

        Render.objectsPipeline = wd.createRenderPipeline({
            layout: "auto",
            vertex: {
                module: objectsShaderVert,
                entryPoint: "main",
                buffers: BufferChunk.buffers,
            },
            fragment: {
                module: objectsShaderFrag,
                entryPoint: "main",
                targets: [
                    {
                        format: "rgb10a2unorm",
                        writeMask: GPUColorWrite.RED | GPUColorWrite.GREEN | GPUColorWrite.BLUE,
                    },
                ],
            },
            depthStencil: {
                depthWriteEnabled: true,
                depthCompare: "less",
                format: "depth24plus",
            },
            primitive,
        })

        const skydomeShaderVert = wd.createShaderModule({ code: skydomeVert })
        const skydomeShaderFrag = wd.createShaderModule({ code: skydomeFrag })

        Render.skydomePipeline = wd.createRenderPipeline({
            layout: "auto",
            vertex: {
                module: skydomeShaderVert,
                entryPoint: "main",
                buffers: ColoredMeshBuffer.buffers,
            },
            fragment: {
                module: skydomeShaderFrag,
                entryPoint: "main",
                targets: [
                    {
                        format: "rgb10a2unorm",
                        blend: {
                            color: {
                                operation: "add",
                                srcFactor: "src-alpha",
                                dstFactor: "one-minus-src-alpha",
                            },
                            alpha: {
                                operation: "add",
                                srcFactor: "src-alpha",
                                dstFactor: "one-minus-src-alpha",
                            },
                        },
                        writeMask: GPUColorWrite.RED | GPUColorWrite.GREEN | GPUColorWrite.BLUE,
                    },
                ],
            },
            depthStencil: {
                depthWriteEnabled: true,
                depthCompare: "less-equal",
                format: "depth24plus",
            },
            primitive,
        })

        const sunShaderVert = wd.createShaderModule({ code: sunVert })
        const sunShaderFrag = wd.createShaderModule({ code: sunFrag })

        Render.sunPipeline = wd.createRenderPipeline({
            layout: "auto",
            vertex: {
                module: sunShaderVert,
                entryPoint: "main",
                buffers: ColoredTexturedMeshBuffer.buffers,
            },
            fragment: {
                module: sunShaderFrag,
                entryPoint: "main",
                targets: [
                    {
                        format: "rgb10a2unorm",
                        blend: {
                            color: {
                                operation: "add",
                                srcFactor: "src-alpha",
                                dstFactor: "one",
                            },
                            alpha: {
                                operation: "add",
                                srcFactor: "src-alpha",
                                dstFactor: "one",
                            },
                        },
                        writeMask: GPUColorWrite.RED | GPUColorWrite.GREEN | GPUColorWrite.BLUE,
                    },
                ],
            },
            depthStencil: {
                depthWriteEnabled: true,
                depthCompare: "less-equal",
                format: "depth24plus",
            },
            primitive,
        })

        const blankShaderVert = wd.createShaderModule({ code: blankVert })
        const blankShaderFrag = wd.createShaderModule({ code: blankFrag })

        Render.blankPipeline = wd.createRenderPipeline({
            layout: "auto",
            vertex: {
                module: blankShaderVert,
                entryPoint: "main",
                buffers: ColoredTexturedMeshBuffer.buffers,
            },
            fragment: {
                module: blankShaderFrag,
                entryPoint: "main",
                targets: [
                    {
                        format: "rgb10a2unorm",
                        blend: {
                            color: {
                                operation: "add",
                                srcFactor: "src-alpha",
                                dstFactor: "one",
                            },
                            alpha: {
                                operation: "add",
                                srcFactor: "src-alpha",
                                dstFactor: "one",
                            },
                        },
                        writeMask: GPUColorWrite.RED | GPUColorWrite.GREEN | GPUColorWrite.BLUE,
                    },
                ],
            },
            depthStencil: {
                depthWriteEnabled: false,
                depthCompare: "less-equal",
                format: "depth24plus",
            },
            primitive,
        })

        const passthroughShaderVert = wd.createShaderModule({ code: passthroughVert })
        const passthroughShaderFrag = wd.createShaderModule({ code: passthroughFrag })

        const fogShaderFrag = wd.createShaderModule({ code: fogFrag })

        Render.fogPipeline = wd.createRenderPipeline({
            layout: "auto",
            vertex: {
                module: passthroughShaderVert,
                entryPoint: "main",
                buffers: MeshBuffer.buffers,
            },
            fragment: {
                module: fogShaderFrag,
                entryPoint: "main",
                targets: [
                    {
                        format: "rgb10a2unorm",
                        blend: {
                            color: {
                                operation: "add",
                                srcFactor: "one",
                                dstFactor: "zero",
                            },
                            alpha: {
                                operation: "add",
                                srcFactor: "one",
                                dstFactor: "zero",
                            },
                        },
                        writeMask: GPUColorWrite.ALL,
                    },
                ],
            },
            primitive,
        })

        const glareShaderVert = wd.createShaderModule({ code: glareVert })
        const glareShaderFrag = wd.createShaderModule({ code: glareFrag })

        Render.glarePipeline = wd.createRenderPipeline({
            layout: "auto",
            vertex: {
                module: glareShaderVert,
                entryPoint: "main",
                buffers: ColoredTexturedMeshBuffer.buffers,
            },
            fragment: {
                module: glareShaderFrag,
                entryPoint: "main",
                targets: [
                    {
                        format: "rgb10a2unorm",
                        blend: {
                            color: {
                                operation: "add",
                                srcFactor: "src-alpha",
                                dstFactor: "one",
                            },
                            alpha: {
                                operation: "add",
                                srcFactor: "src-alpha",
                                dstFactor: "one",
                            },
                        },
                        writeMask: GPUColorWrite.ALL,
                    },
                ],
            },
            primitive,
        })

        Render.screenPipeline = wd.createRenderPipeline({
            layout: "auto",
            vertex: {
                module: passthroughShaderVert,
                entryPoint: "main",
                buffers: MeshBuffer.buffers,
            },
            fragment: {
                module: passthroughShaderFrag,
                entryPoint: "main",
                targets: [
                    {
                        format: screenFormat,
                        writeMask: GPUColorWrite.ALL,
                    },
                ],
            },
            primitive,
        })

        const passthroughDepthShaderFrag = wd.createShaderModule({ code: passthroughDepthFrag })
        Render.debugDepthPipeline = wd.createRenderPipeline({
            layout: "auto",
            vertex: {
                module: passthroughShaderVert,
                entryPoint: "main",
                buffers: MeshBuffer.buffers,
            },
            fragment: {
                module: passthroughDepthShaderFrag,
                entryPoint: "main",
                targets: [
                    {
                        format: screenFormat,
                        writeMask: GPUColorWrite.ALL,
                    },
                ],
            },
            primitive,
        })

        const debugFrustumShaderVert = wd.createShaderModule({ code: debugFrustumVert })
        const debugFrustumShaderFrag = wd.createShaderModule({ code: debugFrustumFrag })

        Render.debugFrustumPipeline = wd.createRenderPipeline({
            layout: "auto",
            vertex: {
                module: debugFrustumShaderVert,
                entryPoint: "main",
                buffers: MeshBuffer.buffers,
            },
            fragment: {
                module: debugFrustumShaderFrag,
                entryPoint: "main",
                targets: [
                    {
                        format: "rgb10a2unorm",
                        blend: {
                            color: {
                                operation: "add",
                                srcFactor: "src-alpha",
                                dstFactor: "one",
                            },
                            alpha: {
                                operation: "add",
                                srcFactor: "src-alpha",
                                dstFactor: "one",
                            },
                        },
                        writeMask: GPUColorWrite.ALL,
                    },
                ],
            },
            depthStencil: {
                depthWriteEnabled: false,
                depthCompare: "less-equal",
                format: "depth24plus",
            },
            primitive,
        })
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

    static setCamera(pos: vec3, lookAt: vec3): void {
        mat4.lookAt(Render.viewMatrix, pos, lookAt, Render.UP)

        mat4.copy(Render.viewMatrix_inplace, Render.viewMatrix)
        // clear translation
        Render.viewMatrix_inplace[12] = 0
        Render.viewMatrix_inplace[13] = 0
        Render.viewMatrix_inplace[14] = 0
        Render.viewMatrix_inplace[15] = 0

        mat4.identity(Render.vp)
        mat4.multiply(Render.vp, Render.vp, Render.projectionMatrix)
        mat4.copy(Render.vp_inplace, Render.vp)

        mat4.multiply(Render.vp, Render.vp, Render.viewMatrix)
        mat4.multiply(Render.vp_inplace, Render.vp_inplace, Render.viewMatrix_inplace)

        vec3.copy(Render.cameraPosition, pos)

        mat4.invert(Render.vp_inv, Render.vp)
    }

    // utils

    static handleResize(): void {
        const dpr = devicePixelRatio

        const newWidth = Math.floor(document.body.clientWidth * dpr)
        const newHeight = Math.floor(document.body.clientHeight * dpr)

        if (canvasWebGPU.width === newWidth && canvasWebGPU.height === newHeight) {
            return
        }

        ctx.canvas.style.width = newWidth / dpr + "px"
        ctx.canvas.style.height = newHeight / dpr + "px"
        ctx.canvas.width = newWidth
        ctx.canvas.height = newHeight

        const glCanvas = canvasWebGPU as HTMLCanvasElement
        glCanvas.style.width = newWidth / dpr + "px"
        glCanvas.style.height = newHeight / dpr + "px"
        canvasWebGPU.width = newWidth
        canvasWebGPU.height = newHeight

        ctx.resetTransform()
        ctx.scale(dpr, dpr)

        mat4.perspectiveZO(
            Render.projectionMatrix,
            (65 * Math.PI) / 180,
            canvasWebGPU.width / canvasWebGPU.height,
            15,
            353840
        )
    }

    private static applyCameraRotationToModelMatrix(model: mat4): void {
        const q = quat.create()
        mat4.getRotation(q, Render.viewMatrix)

        const objQ = quat.create()
        mat4.getRotation(objQ, model)

        quat.mul(q, q, objQ)
        quat.invert(q, q)

        const p = vec3.fromValues(0, 1, 0)
        vec3.transformQuat(p, p, q)

        const a = Math.atan2(p[1], p[0])

        mat4.rotateZ(model, model, a)
    }

    private static rotateModelUpfront(model: mat4): void {
        mat4.rotateX(model, model, Math.PI)
        mat4.rotateZ(model, model, -Math.PI / 2)
    }

    static calcGlareScale(dt: number): void {
        const MIN_SAMPLES = 750
        const MAX_SAMPLES = 1500

        const MIN_GLARE_SCALE = 0.25
        const MAX_GLARE_SCALE = 1

        let glareTargetScale: number
        if (Render.blankSamplesCount > MIN_SAMPLES) {
            const t = Math.min(
                (Render.blankSamplesCount - MIN_SAMPLES) / (MAX_SAMPLES - MIN_SAMPLES),
                1
            )
            glareTargetScale = MIN_GLARE_SCALE + t * (MAX_GLARE_SCALE - MIN_GLARE_SCALE)
        } else {
            glareTargetScale = 0
        }

        const GLARE_SPEED = 1 / 0.075

        if (glareTargetScale - Render.glareScale) {
            const direction = Math.sign(glareTargetScale - Render.glareScale)

            Render.glareScale += GLARE_SPEED * direction * dt

            Render.glareScale =
                Math.min(glareTargetScale * direction, Render.glareScale * direction) * direction
        }
    }

    static calcSunTransform(): void {
        const sunYAngle = Math.PI * 1.55
        const sunPosition = vec3.fromValues(20.6666469573975, 77.4717559814453, 341.035034179687)

        const sunModel = mat4.create()
        mat4.rotateY(sunModel, sunModel, sunYAngle)
        mat4.translate(sunModel, sunModel, sunPosition)

        Render.applyCameraRotationToModelMatrix(sunModel)
        Render.rotateModelUpfront(sunModel)

        const glareScale = Render.glareScale
        const glareScale3 = vec3.fromValues(glareScale, glareScale, glareScale)
        const glareModel = mat4.clone(sunModel)
        mat4.scale(glareModel, glareModel, glareScale3)

        mat4.copy(Render.vp_sun, Render.vp_inplace)
        mat4.multiply(Render.vp_sun, Render.vp_sun, sunModel)

        mat4.copy(Render.vp_glare, Render.vp_inplace)
        mat4.multiply(Render.vp_glare, Render.vp_glare, glareModel)

        // TODO calc near/far shadow frustums

        const UP_SHADOW = vec3.fromValues(0, 0, 1)

        const sunDirection = vec3.fromValues(0, 0, 0)
        vec3.transformMat4(sunDirection, sunDirection, sunModel)
        vec3.normalize(sunDirection, sunDirection)

        const SHADOW_CAMERA_DISTANCE = 15000

        const shadowCameraPos = vec3.clone(Render.cameraPosition)
        const temp = vec3.clone(sunDirection)
        vec3.scale(temp, temp, SHADOW_CAMERA_DISTANCE)
        vec3.add(shadowCameraPos, shadowCameraPos, temp)

        const shadowView = mat4.create()
        mat4.lookAt(shadowView, shadowCameraPos, Render.cameraPosition, UP_SHADOW)

        const points = [-1, 1, 1, 1, -1, -1, 1, -1]

        const min = vec3.fromValues(Infinity, Infinity, Infinity)
        const max = vec3.fromValues(-Infinity, -Infinity, -Infinity)

        const MIN_NEAR = 0
        const MAX_NEAR = 0.986808896064758

        const v = vec4.create()
        for (const z of [MIN_NEAR, MAX_NEAR]) {
            for (let i = 0; i < points.length; i += 2) {
                // setup frustum point
                vec4.set(v, points[i], points[i + 1], z, 1)
                vec4.transformMat4(v, v, Render.vp_inv)
                vec4.scale(v, v, 1 / v[3])

                vec4.transformMat4(v, v, shadowView)
                vec4.scale(v, v, 1 / v[3])

                for (let j = 0; j < 3; j++) {
                    min[j] = Math.min(min[j], v[j])
                    max[j] = Math.max(max[j], v[j])
                }
            }
        }

        const shadowNearProjection = mat4.create()
        mat4.orthoZO(shadowNearProjection, min[0], max[0], min[1], max[1], -max[2], -min[2])

        mat4.identity(Render.vp_shadow_near)
        mat4.multiply(Render.vp_shadow_near, Render.vp_shadow_near, shadowNearProjection)
        mat4.multiply(Render.vp_shadow_near, Render.vp_shadow_near, shadowView)

        const vp_shadow_near_inv = mat4.create()
        mat4.invert(vp_shadow_near_inv, Render.vp_shadow_near)

        function get(x: number, y: number, z: number): vec4 {
            const v = vec4.fromValues(x, y, z, 1)
            vec4.transformMat4(v, v, vp_shadow_near_inv)
            vec4.scale(v, v, 1 / v[3])
            return v
        }

        // console.log(get(0, 0, 0))
        // console.log(get(0, 0, 1))
        // debugger

        // mat4.copy(Render.vp, Render.vp_shadow_near)

        /*
        if (!Render.debugFrustumMesh) {
            const vertices = [
                1, -1, 1, -1, -1, -1, 1, -1, -1, -1, -1, 1, -1, 1, -1, -1, -1, -1, -1, 1, 1, 1, 1,
                -1, -1, 1, -1, 1, 1, 1, 1, -1, -1, 1, 1, -1, -1, 1, -1, 1, -1, -1, -1, -1, -1, -1,
                -1, 1, 1, 1, 1, -1, 1, 1, -1, -1, 1, -1, 1, 1, 1, 1, 1, 1, -1, 1, 1, 1, -1, 1, -1,
                1,
            ]
            const transformedVertices = []

            const v = vec4.create()
            for (let i = 0; i < vertices.length; i += 3) {
                const x = vertices[i + 0]
                const y = vertices[i + 1]
                const z = vertices[i + 2] * 0.5 + 0.5

                vec4.set(v, x, y, z, 1)

                vec4.transformMat4(v, v, vp_shadow_near_inv)
                vec4.scale(v, v, 1 / v[3])

                transformedVertices.push(v[0])
                transformedVertices.push(v[1])
                transformedVertices.push(v[2])
                transformedVertices.push(0)
                transformedVertices.push(0)
                transformedVertices.push(0)
                transformedVertices.push(0)
                transformedVertices.push(0)
            }

            Render.debugFrustumMesh = new MeshBuffer(
                ResourceManager.generateCube(new Float32Array(transformedVertices))
            )
        }
        */
    }

    static render(dt: number): void {
        Render.handleResize()

        // objects color pass

        Render.calcGlareScale(dt)
        Render.calcSunTransform()

        wd.queue.writeBuffer(Render.settings, 0, Render.settingsBuffer)

        const commandEncoder = wd.createCommandEncoder()
        {
            // shadow near pass
            const passEncoder = commandEncoder.beginRenderPass(Render.shadowNearPassDesc)

            passEncoder.setBindGroup(0, Render.shadowNearBind)
            passEncoder.setPipeline(Render.shadowNearPipeline)
            for (const chunk of Render.scene) {
                passEncoder.setVertexBuffer(0, chunk.vertices)
                passEncoder.setIndexBuffer(chunk.indices, "uint32")
                passEncoder.drawIndexed(chunk.indexPos)
            }
            passEncoder.end()
        }

        {
            // shadow far pass
            const passEncoder = commandEncoder.beginRenderPass(Render.shadowFarPassDesc)

            passEncoder.setBindGroup(0, Render.shadowFarBind)
            passEncoder.setPipeline(Render.shadowFarPipeline)
            for (const chunk of Render.scene) {
                passEncoder.setVertexBuffer(0, chunk.vertices)
                passEncoder.setIndexBuffer(chunk.indices, "uint32")
                passEncoder.drawIndexed(chunk.indexPos)
            }
            passEncoder.end()
        }

        {
            // screen space shadow reconstruction pass
        }

        {
            const passEncoder = commandEncoder.beginRenderPass(Render.mainPassDesc)

            passEncoder.setBindGroup(0, Render.objectsBind)
            passEncoder.setPipeline(Render.objectsPipeline)
            for (const chunk of Render.scene) {
                passEncoder.setVertexBuffer(0, chunk.vertices)
                passEncoder.setIndexBuffer(chunk.indices, "uint32")
                passEncoder.drawIndexed(chunk.indexPos)
            }

            passEncoder.setBindGroup(0, Render.skydomeBind)
            passEncoder.setPipeline(Render.skydomePipeline)
            passEncoder.setVertexBuffer(0, Render.skydome.vertices)
            passEncoder.setIndexBuffer(Render.skydome.indices, "uint16")
            passEncoder.drawIndexed(Render.skydome.indexCount)

            passEncoder.setBindGroup(0, Render.sunBind)
            passEncoder.setPipeline(Render.sunPipeline)
            passEncoder.setVertexBuffer(0, Render.sun.vertices)
            passEncoder.setIndexBuffer(Render.sun.indices, "uint16")
            passEncoder.drawIndexed(Render.sun.indexCount)

            if (Render.blankQueryState === BlankQueryState.None) {
                passEncoder.setBindGroup(0, Render.blankBind)
                passEncoder.setPipeline(Render.blankPipeline)
                passEncoder.setVertexBuffer(0, Render.blank.vertices)
                passEncoder.setIndexBuffer(Render.blank.indices, "uint16")
                passEncoder.beginOcclusionQuery(0)
                passEncoder.drawIndexed(Render.blank.indexCount)
                passEncoder.endOcclusionQuery()
                Render.blankQueryState = BlankQueryState.Requested
            }

            if (Render.debugFrustumMesh) {
                passEncoder.setBindGroup(0, Render.debugFrustumBind)
                passEncoder.setPipeline(Render.debugFrustumPipeline)
                passEncoder.setVertexBuffer(0, Render.debugFrustumMesh.vertices)
                passEncoder.setIndexBuffer(Render.debugFrustumMesh.indices, "uint16")
                passEncoder.drawIndexed(Render.debugFrustumMesh.indexCount)
            }

            passEncoder.end()
        }

        if (Render.blankQueryState === BlankQueryState.Requested) {
            commandEncoder.resolveQuerySet(Render.blankQuery, 0, 1, Render.blankQueryResult, 0)
            commandEncoder.copyBufferToBuffer(
                Render.blankQueryResult,
                0,
                Render.blankQueryResultAsync,
                0,
                QUERY_BUFFER_SIZE
            )
        }

        {
            const passEncoder = commandEncoder.beginRenderPass(Render.fogPassDesc)

            passEncoder.setBindGroup(0, Render.fogBind)
            passEncoder.setPipeline(Render.fogPipeline)
            passEncoder.setVertexBuffer(0, Render.fullscreenPlain.vertices)
            passEncoder.setIndexBuffer(Render.fullscreenPlain.indices, "uint16")
            passEncoder.drawIndexed(Render.fullscreenPlain.indexCount)

            if (Render.glareScale > 10e-6) {
                passEncoder.setBindGroup(0, Render.glareBind)
                passEncoder.setPipeline(Render.glarePipeline)
                passEncoder.setVertexBuffer(0, Render.glare.vertices)
                passEncoder.setIndexBuffer(Render.glare.indices, "uint16")
                passEncoder.drawIndexed(Render.glare.indexCount)
            }

            passEncoder.end()
        }

        // @ts-expect-error here we need to render to frame that is currently assign to next frame
        // we need Render because WebGPU may use frame buffering to smooth out FPS
        // so each frame may have different texture assigned
        Render.screenPassDesc.colorAttachments[0].view = wg.getCurrentTexture().createView()
        {
            const passEncoder = commandEncoder.beginRenderPass(Render.screenPassDesc)

            passEncoder.setBindGroup(0, Render.screenBind)
            passEncoder.setPipeline(Render.screenPipeline)
            passEncoder.setVertexBuffer(0, Render.fullscreenPlain.vertices)
            passEncoder.setIndexBuffer(Render.fullscreenPlain.indices, "uint16")
            passEncoder.drawIndexed(Render.fullscreenPlain.indexCount)

            // DEBUG
            passEncoder.setBindGroup(0, Render.debugTextureBind)
            passEncoder.setPipeline(Render.debugDepthPipeline)
            passEncoder.setVertexBuffer(0, Render.debugTexturePlane.vertices)
            passEncoder.setIndexBuffer(Render.debugTexturePlane.indices, "uint16")
            passEncoder.drawIndexed(Render.debugTexturePlane.indexCount)

            passEncoder.end()
        }

        wd.queue.submit([commandEncoder.finish()])

        if (Render.blankQueryState === BlankQueryState.Requested) {
            Render.blankQueryState = BlankQueryState.Pending
            Render.blankQueryResultAsync.mapAsync(GPUMapMode.READ).then(function () {
                const data = new Uint32Array(
                    Render.blankQueryResultAsync.getMappedRange(0, QUERY_BUFFER_SIZE)
                )
                const result = data[0] !== 0 || data[1] !== 0
                Render.blankSamplesCount = result ? 30000 : 0

                Render.blankQueryResultAsync.unmap()

                Render.blankQueryState = BlankQueryState.None
            })
        }
    }

    static finalize(): void {
        //
    }
}
