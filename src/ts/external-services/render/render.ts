/* eslint-disable @typescript-eslint/no-non-null-assertion */

import objectsDepthBufferVert from "../../shaders/objects-depth-buffer.vert.wgsl"
import objectsShadowNearVert from "../../shaders/objects-shadow-near.vert.wgsl"
import objectsShadowFarVert from "../../shaders/objects-shadow-far.vert.wgsl"
import contactShadowsFrag from "../../shaders/contact-shadows.frag.wgsl"

import volumetricInitComp from "../../shaders/volumetric_init.comp.wgsl"
import volumetricAddComp from "../../shaders/volumetric_add.comp.wgsl"

import objectsVert from "../../shaders/objects.vert.wgsl"
import objectsFrag from "../../shaders/objects.frag.wgsl"

import skydomeVert from "../../shaders/skydome.vert.wgsl"
import skydomeFrag from "../../shaders/skydome.frag.wgsl"

import sunVert from "../../shaders/sun.vert.wgsl"
import sunFrag from "../../shaders/sun.frag.wgsl"

import passthroughVert from "../../shaders/passthrough.vert.wgsl"
import passthroughFrag from "../../shaders/passthrough.frag.wgsl"
import passthroughTexFrag from "../../shaders/passthrough-tex.frag.wgsl"
import passthroughDepthFrag from "../../shaders/passthrough-depth.frag.wgsl"
import passthroughFrag_Debug from "../../shaders/passthrough_debug.frag.wgsl"

import fogFrag from "../../shaders/fog.frag.wgsl"

import glareVert from "../../shaders/glare.vert.wgsl"
import glareFrag from "../../shaders/glare.frag.wgsl"

import blankVert from "../../shaders/blank.vert.wgsl"
import blankFrag from "../../shaders/blank.frag.wgsl"

import debugFrustumVert from "../../shaders/debug-frustum.vert.wgsl"
import debugFrustumFrag from "../../shaders/debug-frustum.frag.wgsl"

import { mat4, quat, vec2, vec3, vec4 } from "gl-matrix"
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

const VOLUMETRIC_TEX_WIDTH = 320
const VOLUMETRIC_TEX_HEIGHT = 192
const VOLUMETRIC_TEX_DEPTH = 90

const VOLUMETRIC_DISPATCH_X = VOLUMETRIC_TEX_WIDTH / 32
const VOLUMETRIC_DISPATCH_Y = VOLUMETRIC_TEX_HEIGHT / 32
const VOLUMETRIC_DISPATCH_Z = VOLUMETRIC_TEX_DEPTH / 1

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

const VEC2_FLOAT_SIZE = 2
const VEC3_FLOAT_SIZE = 3
const MAT4_FLOAT_SIZE = 4 * 4

const VEC2_BYTE_SIZE = VEC2_FLOAT_SIZE * 4
const VEC2_BYTE_SIZE_ALIGN = 4 * 4
const VEC3_BYTE_SIZE = VEC3_FLOAT_SIZE * 4
const VEC3_BYTE_SIZE_ALIGN = 4 * 4
const MAT4_BYTE_SIZE = MAT4_FLOAT_SIZE * 4

const SETTINGS_SIZE = 9 * MAT4_FLOAT_SIZE + 1 * VEC2_FLOAT_SIZE + 2 * VEC3_BYTE_SIZE

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
// TODO for now this must be manually synced with contact shadows shader
const SHADOW_RND_STEP = 4 / SHADOW_RESOLUTION

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
    private static vp_shadow_near_uv: mat4
    private static vp_shadow_far_uv: mat4
    private static invScreenResolution: vec2
    private static cameraPosition: vec3
    private static sunDirection: vec3

    private static settingsBuffer: Float32Array
    private static settings: GPUBuffer

    private static depthBufferPipeline: GPURenderPipeline
    private static depthBufferBind: GPUBindGroup

    private static shadowNearPipeline: GPURenderPipeline
    private static shadowNearBind: GPUBindGroup
    private static shadowFarPipeline: GPURenderPipeline
    private static shadowFarBind: GPUBindGroup

    private static volumetricInitPipeline: GPUComputePipeline
    private static volumetricInitBind: GPUBindGroup

    private static volumetricAddPipeline: GPUComputePipeline
    private static volumetricAddBinds: GPUBindGroup[]

    private static contactShadowsPipeline: GPURenderPipeline
    private static contactShadowsBind: GPUBindGroup

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

    // depth buffer
    private static depthBuffer: GPUTexture
    private static depthBufferView: GPUTextureView
    private static depthBufferPass: GPURenderPassDescriptor

    // shadow cascade depth buffers
    private static shadowDepthBuffers: GPUTexture
    private static shadowDepthBuffersView: GPUTextureView
    private static shadowDepthBufferNearView: GPUTextureView
    private static shadowDepthBufferFarView: GPUTextureView
    private static shadowNearPassDesc: GPURenderPassDescriptor
    private static shadowFarPassDesc: GPURenderPassDescriptor

    private static contactShadowsTexture: GPUTexture
    private static contactShadowsTextureView: GPUTextureView
    private static contactShadowsPassDesc: GPURenderPassDescriptor

    // volumetric lighting
    private static volumetricLightingBuffer0: GPUTexture
    private static volumetricLightingBuffer1: GPUTexture
    private static volumetricLightingBufferView0: GPUTextureView
    private static volumetricLightingBufferView1: GPUTextureView

    // render targets
    private static mainPassTexture: GPUTexture
    private static mainPassTextureView: GPUTextureView
    private static mainPassDesc: GPURenderPassDescriptor

    private static fogPassTexture: GPUTexture
    private static fogPassTextureView: GPUTextureView
    private static fogPassDesc: GPURenderPassDescriptor

    private static screenPassDesc: GPURenderPassDescriptor

    private static skydome: ColoredMeshBuffer
    private static dithering: GPUTexture
    private static sun: ColoredTexturedMeshBuffer
    private static sunTexture: GPUTexture
    private static blank: ColoredTexturedMeshBuffer
    private static glare: ColoredTexturedMeshBuffer
    private static glareTexture: GPUTexture
    private static fullscreenPlain: MeshBuffer

    private static volumetricCurve: GPUTexture
    private static volumetricRandomData: GPUTexture
    private static debugTextureExample: GPUTexture

    private static debugIsDepth: boolean
    private static debugTextureView: GPUTextureView
    private static debugTexturePlane: MeshBuffer
    private static debugTextureBind: GPUBindGroup
    private static debugTexturePipeline: GPURenderPipeline
    private static debugDepthBind: GPUBindGroup
    private static debugDepthPipeline: GPURenderPipeline

    private static debugFrustumMeshes: MeshBuffer[]
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

    private static scene: BufferChunk[] = []

    static async init(): Promise<void> {
        Render.projectionMatrix = mat4.create()
        Render.viewMatrix = mat4.create()
        Render.viewMatrix_inplace = mat4.create()

        Render.debugFrustumMeshes = []

        Render.handleResize()

        Render.initAtlases()
        Render.setupFrameBuffers()
        Render.createPerObjectData()
        Render.compilerShaders()
        await Render.loadResources()
        Render.createUBOs()

        // await Render.setupShadowsTest()
    }

    static async setupShadowsTest(): Promise<void> {
        // add bucket
        const bucket = new Renderable(
            await ResourceManager.requestMesh("bucket"),
            await ResourceManager.requestTexture("rock.jpg")
        )
        Render.setTransform(
            bucket,
            new Float32Array([
                // rotation
                -0.000004685526619141456, -0.000009808394679566845, 0.9487481117248535,
                0.316033273935318,
                // scale
                10,
                // position
                -796.7786865234375, -241.33251953125, -86.42948150634766,
            ])
        )
        Render.addRenderable(bucket)

        // add ground
        const ground = new Renderable(
            await ResourceManager.requestMesh("ground"),
            await ResourceManager.requestTexture("grass.jpg")
        )
        Render.setTransform(
            ground,
            new Float32Array([
                // rotation
                0, 0, 0, 1,
                // scale
                1,
                // position
                -654.9658203125, -588.56103515625, -85.90818786621094,
            ])
        )
        Render.addRenderable(ground)

        // setup camera
        Render.setCamera(
            vec3.fromValues(0, 0, 0),
            vec3.fromValues(-0.7991405129432678, -0.5913922190666199, -0.11954037100076675)
        )
    }

    static async loadResources(): Promise<void> {
        Render.skydome = new ColoredMeshBuffer(await loadColoredMeshFromURL("build/skydome.cml"))
        Render.dithering = createTexture(await loadTexture("build/dithering.png"))

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

        const curveData = new Uint8Array(
            await (await fetch("build/volumetric_curve_data_rgba.bin")).arrayBuffer()
        )
        const curveWidth = curveData.byteLength / 4
        Render.volumetricCurve = wd.createTexture({
            size: [curveWidth, 1],
            format: "rgba8unorm",
            dimension: "2d",
            usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
        })
        wd.queue.writeTexture(
            { texture: Render.volumetricCurve },
            curveData,
            { bytesPerRow: curveWidth * 4, rowsPerImage: 1 },
            { width: curveWidth, height: 1 }
        )

        const randomData = new Uint8Array(
            await (await fetch("build/volumetric_random_data_tighten.bin")).arrayBuffer()
        )
        Render.volumetricRandomData = wd.createTexture({
            size: [32, 32, 32],
            format: "r8unorm",
            dimension: "3d",
            usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
        })
        wd.queue.writeTexture(
            { texture: Render.volumetricRandomData },
            randomData,
            { bytesPerRow: 32, rowsPerImage: 32 },
            { width: 32, height: 32, depthOrArrayLayers: 32 }
        )

        Render.debugTextureExample = wd.createTexture({
            size: [2, 2],
            format: "rgba8unorm",
            dimension: "2d",
            usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
        })
        wd.queue.writeTexture(
            { texture: Render.debugTextureExample },
            new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 254, 254, 154, 0]),
            { bytesPerRow: 2 * 4, rowsPerImage: 2 },
            { width: 2, height: 2 }
        )
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

        Render.debugTexturePlane = new MeshBuffer(
            ResourceManager.generatePlane(0, 0, canvasWebGPU.width, canvasWebGPU.height)
        )
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
        Render.contactShadowsTexture = wd.createTexture({
            size: [canvasWebGPU.width, canvasWebGPU.height],
            format: "r32float",
            usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.RENDER_ATTACHMENT,
        })
        Render.contactShadowsTextureView = Render.contactShadowsTexture.createView()

        Render.volumetricLightingBuffer0 = wd.createTexture({
            size: [VOLUMETRIC_TEX_WIDTH, VOLUMETRIC_TEX_HEIGHT, VOLUMETRIC_TEX_DEPTH],
            // FIXME supposed to be r16float, memory usage x4
            format: "rgba16float",
            dimension: "3d",
            usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.STORAGE_BINDING,
        })
        Render.volumetricLightingBufferView0 = Render.volumetricLightingBuffer0.createView()

        Render.volumetricLightingBuffer1 = wd.createTexture({
            size: [VOLUMETRIC_TEX_WIDTH, VOLUMETRIC_TEX_HEIGHT, VOLUMETRIC_TEX_DEPTH],
            // FIXME supposed to be r16float, memory usage x4
            format: "rgba16float",
            dimension: "3d",
            usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.STORAGE_BINDING,
        })
        Render.volumetricLightingBufferView1 = Render.volumetricLightingBuffer1.createView()

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

        // Render.debugTextureView = Render.contactShadowsTextureView
        // Render.debugTextureView = Render.shadowDepthBufferNearView
        // Render.debugIsDepth = true

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

        Render.contactShadowsPassDesc = {
            colorAttachments: [
                {
                    view: Render.contactShadowsTextureView,

                    clearValue: {
                        r: 1,
                        g: 1,
                        b: 1,
                        a: 1,
                    },
                    loadOp: "clear",
                    storeOp: "store",
                },
            ],
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

        Render.depthBufferPass = {
            colorAttachments: [],
            depthStencilAttachment: {
                view: Render.depthBufferView,

                depthClearValue: 1.0,
                depthLoadOp: "clear",
                depthStoreOp: "store",
            },
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
        const linearRepeatSampler = wd.createSampler({
            magFilter: "linear",
            minFilter: "linear",
            mipmapFilter: "linear",
            maxAnisotropy: 16,
            addressModeU: "repeat",
            addressModeV: "repeat",
        })
        const linearClampSampler = wd.createSampler({
            magFilter: "linear",
            minFilter: "linear",
            mipmapFilter: "linear",
            addressModeU: "clamp-to-edge",
            addressModeV: "clamp-to-edge",
        })
        const linearMirrorSampler = wd.createSampler({
            magFilter: "linear",
            minFilter: "linear",
            mipmapFilter: "linear",
            addressModeU: "mirror-repeat",
            addressModeV: "mirror-repeat",
        })
        const pointClampSampler = wd.createSampler({
            magFilter: "nearest",
            minFilter: "nearest",
            mipmapFilter: "nearest",
            addressModeU: "clamp-to-edge",
            addressModeV: "clamp-to-edge",
        })
        const pointRepeatSampler = wd.createSampler({
            magFilter: "nearest",
            minFilter: "nearest",
            mipmapFilter: "nearest",
            addressModeU: "repeat",
            addressModeV: "repeat",
        })
        const comparisonSampler = wd.createSampler({
            magFilter: "linear",
            minFilter: "linear",
            mipmapFilter: "linear",
            compare: "less",
            addressModeU: "clamp-to-edge",
            addressModeV: "clamp-to-edge",
        })

        Render.settingsBuffer = new Float32Array(SETTINGS_SIZE)

        let pos = 0

        Render.vp = new Float32Array(Render.settingsBuffer.buffer, pos, MAT4_FLOAT_SIZE)
        pos += MAT4_BYTE_SIZE

        Render.vp_inplace = new Float32Array(Render.settingsBuffer.buffer, pos, MAT4_FLOAT_SIZE)
        pos += MAT4_BYTE_SIZE

        Render.vp_sun = new Float32Array(Render.settingsBuffer.buffer, pos, MAT4_FLOAT_SIZE)
        pos += MAT4_BYTE_SIZE

        Render.vp_glare = new Float32Array(Render.settingsBuffer.buffer, pos, MAT4_FLOAT_SIZE)
        pos += MAT4_BYTE_SIZE

        Render.vp_shadow_near = new Float32Array(Render.settingsBuffer.buffer, pos, MAT4_FLOAT_SIZE)
        pos += MAT4_BYTE_SIZE

        Render.vp_shadow_far = new Float32Array(Render.settingsBuffer.buffer, pos, MAT4_FLOAT_SIZE)
        pos += MAT4_BYTE_SIZE

        Render.vp_shadow_near_uv = new Float32Array(
            Render.settingsBuffer.buffer,
            pos,
            MAT4_FLOAT_SIZE
        )
        pos += MAT4_BYTE_SIZE

        Render.vp_shadow_far_uv = new Float32Array(
            Render.settingsBuffer.buffer,
            pos,
            MAT4_FLOAT_SIZE
        )
        pos += MAT4_BYTE_SIZE

        Render.vp_inv = new Float32Array(Render.settingsBuffer.buffer, pos, MAT4_FLOAT_SIZE)
        pos += MAT4_BYTE_SIZE

        Render.invScreenResolution = new Float32Array(
            Render.settingsBuffer.buffer,
            pos,
            VEC2_FLOAT_SIZE
        )
        pos += VEC2_BYTE_SIZE_ALIGN

        Render.cameraPosition = new Float32Array(Render.settingsBuffer.buffer, pos, VEC3_FLOAT_SIZE)
        pos += VEC3_BYTE_SIZE_ALIGN

        Render.sunDirection = new Float32Array(Render.settingsBuffer.buffer, pos, VEC3_FLOAT_SIZE)
        pos += VEC3_BYTE_SIZE_ALIGN

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

        Render.volumetricInitBind = wd.createBindGroup({
            layout: Render.volumetricInitPipeline.getBindGroupLayout(0),
            entries: [
                {
                    binding: 0,
                    resource: {
                        buffer: Render.settings,
                    },
                },
                {
                    binding: 1,
                    resource: pointClampSampler,
                },
                {
                    binding: 2,
                    resource: linearClampSampler,
                },
                {
                    binding: 3,
                    resource: linearMirrorSampler,
                },
                {
                    binding: 4,
                    resource: Render.shadowDepthBuffersView,
                },
                {
                    binding: 5,
                    resource: Render.volumetricCurve.createView(),
                },
                {
                    binding: 6,
                    resource: Render.volumetricRandomData.createView(),
                },
                {
                    binding: 7,
                    resource: Render.volumetricLightingBufferView0,
                },
                {
                    binding: 8,
                    resource: Render.volumetricLightingBufferView1,
                },
            ],
        })

        Render.volumetricAddBinds = []
        const swapChain = [
            Render.volumetricLightingBufferView0,
            Render.volumetricLightingBufferView1,
        ]
        for (let i = 0; i < VOLUMETRIC_TEX_DEPTH; i++) {
            const input = swapChain[i % swapChain.length]
            const output = swapChain[(i + 1) % swapChain.length]

            const z = 1 + i
            const zBuffer = wd.createBuffer({
                size: 4,
                usage: GPUBufferUsage.UNIFORM,
                mappedAtCreation: true,
            })
            const zData = new Uint32Array(zBuffer.getMappedRange())
            zData[0] = z
            zBuffer.unmap()

            const bind = wd.createBindGroup({
                layout: Render.volumetricAddPipeline.getBindGroupLayout(0),
                entries: [
                    {
                        binding: 0,
                        resource: {
                            buffer: zBuffer,
                        },
                    },
                    {
                        binding: 1,
                        resource: pointClampSampler,
                    },
                    {
                        binding: 2,
                        resource: input,
                    },
                    {
                        binding: 3,
                        resource: output,
                    },
                ],
            })

            Render.volumetricAddBinds.push(bind)
        }

        Render.contactShadowsBind = wd.createBindGroup({
            layout: Render.contactShadowsPipeline.getBindGroupLayout(0),
            entries: [
                {
                    binding: 0,
                    resource: {
                        buffer: Render.settings,
                    },
                },
                {
                    binding: 1,
                    resource: Render.depthBufferView,
                },
                {
                    binding: 2,
                    resource: Render.shadowDepthBuffersView,
                },
                {
                    binding: 3,
                    resource: comparisonSampler,
                },
            ],
        })

        Render.depthBufferBind = wd.createBindGroup({
            layout: Render.depthBufferPipeline.getBindGroupLayout(0),
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
                    resource: linearRepeatSampler,
                },
                {
                    binding: 3,
                    resource: Render.atlasesTexture.createView(),
                },
                {
                    binding: 4,
                    resource: Render.contactShadowsTextureView,
                },
            ],
        })

        const ditheringView = Render.dithering.createView()

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
                    resource: pointRepeatSampler,
                },
                {
                    binding: 2,
                    resource: ditheringView,
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
                    resource: linearRepeatSampler,
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
                    resource: linearRepeatSampler,
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
                    resource: linearClampSampler,
                },
                {
                    binding: 1,
                    // resource: Render.debugTextureExample.createView(),
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
                    resource: linearRepeatSampler,
                },
                {
                    binding: 2,
                    resource: pointRepeatSampler,
                },
                {
                    binding: 3,
                    resource: Render.glareTexture.createView(),
                },
                {
                    binding: 4,
                    resource: ditheringView,
                },
            ],
        })

        if (Render.debugTextureView) {
            Render.debugTextureBind = wd.createBindGroup({
                layout: Render.debugTexturePipeline.getBindGroupLayout(0),
                entries: [
                    {
                        binding: 0,
                        resource: Render.debugTextureView,
                    },
                ],
            })

            Render.debugDepthBind = wd.createBindGroup({
                layout: Render.debugDepthPipeline.getBindGroupLayout(0),
                entries: [
                    {
                        binding: 0,
                        resource: linearRepeatSampler,
                    },
                    {
                        binding: 1,
                        resource: Render.debugTextureView,
                    },
                ],
            })
        }

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
            cullMode: "back",
            unclippedDepth: true,
        }

        const passthroughShaderVert = wd.createShaderModule({ code: passthroughVert })
        const passthroughShaderFrag = wd.createShaderModule({ code: passthroughFrag })
        const passthroughShaderFrag_Debug = wd.createShaderModule({ code: passthroughFrag_Debug })

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
                depthBiasClamp: -100,
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
                depthBiasClamp: -100,
            },
            primitive,
        })

        // volumetric lighting

        const volumetricInitShaderComp = wd.createShaderModule({ code: volumetricInitComp })
        Render.volumetricInitPipeline = wd.createComputePipeline({
            layout: "auto",
            compute: {
                module: volumetricInitShaderComp,
                entryPoint: "main",
            },
        })

        const volumetricAddShaderComp = wd.createShaderModule({ code: volumetricAddComp })
        Render.volumetricAddPipeline = wd.createComputePipeline({
            layout: "auto",
            compute: {
                module: volumetricAddShaderComp,
                entryPoint: "main",
            },
        })

        // contact shadows

        const contactShadowsShaderFrag = wd.createShaderModule({ code: contactShadowsFrag })
        Render.contactShadowsPipeline = wd.createRenderPipeline({
            layout: "auto",
            vertex: {
                module: passthroughShaderVert,
                entryPoint: "main",
                buffers: MeshBuffer.buffers,
            },
            fragment: {
                module: contactShadowsShaderFrag,
                entryPoint: "main",
                targets: [
                    {
                        format: "r32float",
                        writeMask: GPUColorWrite.ALL,
                    },
                ],
            },
            primitive,
        })

        const objectsDepthBufferShaderVert = wd.createShaderModule({ code: objectsDepthBufferVert })
        Render.depthBufferPipeline = wd.createRenderPipeline({
            layout: "auto",
            vertex: {
                module: objectsDepthBufferShaderVert,
                entryPoint: "main",
                buffers: BufferChunk.buffers,
            },
            depthStencil: {
                depthWriteEnabled: true,
                depthCompare: "less",
                format: "depth24plus",
                depthBiasClamp: -100,
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
                depthWriteEnabled: false,
                depthCompare: "always",
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
                depthWriteEnabled: false,
                depthCompare: "always",
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
                // module: passthroughShaderFrag_Debug,
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

        const passthroughTexShaderFrag = wd.createShaderModule({ code: passthroughTexFrag })
        Render.debugTexturePipeline = wd.createRenderPipeline({
            layout: "auto",
            vertex: {
                module: passthroughShaderVert,
                entryPoint: "main",
                buffers: MeshBuffer.buffers,
            },
            fragment: {
                module: passthroughTexShaderFrag,
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
        Render.viewMatrix_inplace[15] = 1

        mat4.identity(Render.vp)
        mat4.multiply(Render.vp, Render.vp, Render.projectionMatrix)
        mat4.copy(Render.vp_inplace, Render.vp)

        mat4.multiply(Render.vp, Render.vp, Render.viewMatrix)
        mat4.multiply(Render.vp_inplace, Render.vp_inplace, Render.viewMatrix_inplace)

        vec3.copy(Render.cameraPosition, pos)

        mat4.invert(Render.vp_inv, Render.vp)
    }

    // utils

    static readonly NEAR = 15
    static readonly FAR = 353840

    static handleResize(): void {
        const dpr = devicePixelRatio

        let newWidth = Math.floor(document.body.clientWidth * dpr)
        let newHeight = Math.floor(document.body.clientHeight * dpr)

        newWidth = 3840
        newHeight = 2160

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
            (50 * Math.PI) / 180,
            canvasWebGPU.width / canvasWebGPU.height,
            Render.NEAR,
            Render.FAR
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

    private static getQuasiLogDepth(linearDepth: number): number {
        return (1 / linearDepth - 1 / Render.NEAR) / (1 / Render.FAR - 1 / Render.NEAR)
    }

    private static getShadowProjection(shadowView: mat4, near: number, far: number): mat4 {
        const points = [-1, 1, 1, 1, -1, -1, 1, -1]

        const min = vec3.fromValues(Infinity, Infinity, Infinity)
        const max = vec3.fromValues(-Infinity, -Infinity, -Infinity)

        const v = vec4.create()
        for (const z of [near, far]) {
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

        const projection = mat4.create()
        mat4.orthoZO(projection, min[0], max[0], min[1], max[1], -max[2], -min[2])

        return projection
    }

    static sunYAngle = Math.PI * 1.55

    static calcSunTransform(dt: number): void {
        // Render.sunYAngle += dt * 0.5

        /*
        Render.sunYAngle = 0.0

        const sunPosition = vec3.fromValues(
            -0.76995176076889,
            0.0843339264392853,
            0.632504463195801
        )
        // TODO check out sun trajectory and sun scale, which appears to be dynamic
        vec3.scale(sunPosition, sunPosition, 350)
        */

        const sunPosition = vec3.fromValues(20.6666469573975, 77.4717559814453, 341.035034179687)

        const sunModel = mat4.create()
        mat4.rotateY(sunModel, sunModel, Render.sunYAngle)
        mat4.translate(sunModel, sunModel, sunPosition)

        const transformedPos = vec4.fromValues(0, 0, 0, 1)
        vec4.transformMat4(transformedPos, transformedPos, sunModel)

        mat4.identity(sunModel)
        mat4.translate(sunModel, sunModel, transformedPos as vec3)

        // calc near/far shadow frustums

        const UP_SHADOW = vec3.fromValues(0, 1, 0)
        const SHADOW_CAMERA_DISTANCE = 15000

        const sunDirection = Render.sunDirection
        vec3.set(sunDirection, 0, 0, 0)
        vec3.transformMat4(sunDirection, sunDirection, sunModel)
        vec3.normalize(sunDirection, sunDirection)
        vec3.negate(sunDirection, sunDirection)

        const shadowCameraPos = vec3.clone(Render.cameraPosition)
        const temp = vec3.clone(sunDirection)
        vec3.negate(temp, temp)
        vec3.scale(temp, temp, SHADOW_CAMERA_DISTANCE)
        vec3.add(shadowCameraPos, shadowCameraPos, temp)

        const shadowView = mat4.create()
        mat4.lookAt(shadowView, shadowCameraPos, Render.cameraPosition, UP_SHADOW)

        const inv_shadowView = mat4.clone(shadowView)
        inv_shadowView[12] = 0
        inv_shadowView[13] = 0
        inv_shadowView[14] = 0
        inv_shadowView[15] = 1
        mat4.invert(inv_shadowView, inv_shadowView)
        mat4.mul(sunModel, sunModel, inv_shadowView)

        Render.applyCameraRotationToModelMatrix(sunModel)
        Render.rotateModelUpfront(sunModel)

        const CASCADE_DISTANCES = [
            0,
            Render.getQuasiLogDepth(1133.5),
            Render.getQuasiLogDepth(10100),
        ]

        const shadowNearProjection = Render.getShadowProjection(
            shadowView,
            CASCADE_DISTANCES[0],
            CASCADE_DISTANCES[1]
        )

        mat4.identity(Render.vp_shadow_near)
        mat4.multiply(Render.vp_shadow_near, Render.vp_shadow_near, shadowNearProjection)
        mat4.multiply(Render.vp_shadow_near, Render.vp_shadow_near, shadowView)

        const shadowFarProjection = Render.getShadowProjection(shadowView, 0, CASCADE_DISTANCES[2])

        mat4.identity(Render.vp_shadow_far)
        mat4.multiply(Render.vp_shadow_far, Render.vp_shadow_far, shadowFarProjection)
        mat4.multiply(Render.vp_shadow_far, Render.vp_shadow_far, shadowView)

        /*
        const toUV = mat4.create()
        mat4.scale(toUV, toUV, vec3.fromValues(0.5, 0.5, 1))
        mat4.translate(toUV, toUV, vec3.fromValues(1, 1, 0))

        mat4.mul(Render.vp_shadow_near_uv, toUV, Render.vp_shadow_near)
        mat4.mul(Render.vp_shadow_far_uv, toUV, Render.vp_shadow_far)
        */

        vec2.set(Render.invScreenResolution, 1 / canvasWebGPU.width, 1 / canvasWebGPU.height)

        /*
        if (Render.debugFrustumMeshes.length < 1) {
            Render.debugFrustumMeshes.push(
                new MeshBuffer(
                    ResourceManager.generateCubeFromTransform(
                        mat4.invert(mat4.create(), Render.vp_shadow_near),
                        0,
                        1,
                        0,
                        1
                    )
                )
            )

            Render.debugFrustumMeshes.push(
                new MeshBuffer(
                    ResourceManager.generateCubeFromTransform(
                        mat4.invert(mat4.create(), Render.vp_shadow_far),
                        0,
                        1,
                        1,
                        0
                    )
                )
            )

            Render.debugFrustumMeshes.push(
                new MeshBuffer(
                    ResourceManager.generateCubeFromTransform(
                        Render.vp_inv,
                        1,
                        0,
                        CASCADE_DISTANCES[1],
                        CASCADE_DISTANCES[2]
                    )
                )
            )
        }
        */

        //

        const glareScale = Render.glareScale
        const glareScale3 = vec3.fromValues(glareScale, glareScale, glareScale)
        const glareModel = mat4.clone(sunModel)
        mat4.scale(glareModel, glareModel, glareScale3)

        mat4.copy(Render.vp_sun, Render.vp_inplace)
        mat4.multiply(Render.vp_sun, Render.vp_sun, sunModel)

        mat4.copy(Render.vp_glare, Render.vp_inplace)
        mat4.multiply(Render.vp_glare, Render.vp_glare, glareModel)
    }

    static render(dt: number): void {
        Render.handleResize()

        // objects color pass

        Render.calcGlareScale(dt)
        Render.calcSunTransform(dt)

        wd.queue.writeBuffer(Render.settings, 0, Render.settingsBuffer)

        const commandEncoder = wd.createCommandEncoder()

        {
            // shadow near pass
            const passEncoder = commandEncoder.beginRenderPass(Render.depthBufferPass)

            passEncoder.setBindGroup(0, Render.depthBufferBind)
            passEncoder.setPipeline(Render.depthBufferPipeline)
            for (const chunk of Render.scene) {
                passEncoder.setVertexBuffer(0, chunk.vertices)
                passEncoder.setIndexBuffer(chunk.indices, "uint32")
                passEncoder.drawIndexed(chunk.indexPos)
            }
            passEncoder.end()
        }

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
            const passEncoder = commandEncoder.beginComputePass()

            passEncoder.setPipeline(Render.volumetricInitPipeline)
            passEncoder.setBindGroup(0, Render.volumetricInitBind)
            passEncoder.dispatchWorkgroups(
                VOLUMETRIC_DISPATCH_X,
                VOLUMETRIC_DISPATCH_Y,
                VOLUMETRIC_DISPATCH_Z
            )

            passEncoder.setPipeline(Render.volumetricAddPipeline)
            for (let i = 0; i < VOLUMETRIC_TEX_DEPTH; i++) {
                passEncoder.setBindGroup(0, Render.volumetricAddBinds[i])
                passEncoder.dispatchWorkgroups(VOLUMETRIC_DISPATCH_X, VOLUMETRIC_DISPATCH_Y, 1)
            }

            passEncoder.end()
        }

        {
            // screen space shadow reconstruction pass
            const passEncoder = commandEncoder.beginRenderPass(Render.contactShadowsPassDesc)

            passEncoder.setBindGroup(0, Render.contactShadowsBind)
            passEncoder.setPipeline(Render.contactShadowsPipeline)
            passEncoder.setVertexBuffer(0, Render.fullscreenPlain.vertices)
            passEncoder.setIndexBuffer(Render.fullscreenPlain.indices, "uint16")
            passEncoder.drawIndexed(Render.fullscreenPlain.indexCount)

            passEncoder.end()
        }

        {
            const passEncoder = commandEncoder.beginRenderPass(Render.mainPassDesc)

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

            passEncoder.setBindGroup(0, Render.objectsBind)
            passEncoder.setPipeline(Render.objectsPipeline)
            for (const chunk of Render.scene) {
                passEncoder.setVertexBuffer(0, chunk.vertices)
                passEncoder.setIndexBuffer(chunk.indices, "uint32")
                passEncoder.drawIndexed(chunk.indexPos)
            }

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

            if (Render.debugFrustumMeshes.length > 0) {
                passEncoder.setBindGroup(0, Render.debugFrustumBind)
                passEncoder.setPipeline(Render.debugFrustumPipeline)
                for (const debugFrustumMesh of Render.debugFrustumMeshes) {
                    passEncoder.setVertexBuffer(0, debugFrustumMesh.vertices)
                    passEncoder.setIndexBuffer(debugFrustumMesh.indices, "uint16")
                    passEncoder.drawIndexed(debugFrustumMesh.indexCount)
                }
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
            if (Render.debugTextureView) {
                if (Render.debugIsDepth) {
                    passEncoder.setBindGroup(0, Render.debugDepthBind)
                    passEncoder.setPipeline(Render.debugDepthPipeline)
                } else {
                    passEncoder.setBindGroup(0, Render.debugTextureBind)
                    passEncoder.setPipeline(Render.debugTexturePipeline)
                }
                passEncoder.setVertexBuffer(0, Render.debugTexturePlane.vertices)
                passEncoder.setIndexBuffer(Render.debugTexturePlane.indices, "uint16")
                passEncoder.drawIndexed(Render.debugTexturePlane.indexCount)
            }

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
