import { vec3 } from "gl-matrix"
import { Render } from "../../external-services/render/render"
import { Mesh, Texture } from "../../external-services/render/render-data"
import { Renderable } from "../../external-services/render/renderable"
import { ResourceManager } from "../../external-services/resources/resource-manager"
import { OutputMessageId, registerOutputHandler } from "../queue-messages"
import { Queues } from "../queues"
import {
    readPointer,
    readString,
    readToFloatArray,
    readU32,
    readU64,
    SeekablePtr,
} from "../read-write-utils"
import { Engine } from "../module"
import { MESH_VERTEX_SIZE } from "../../external-services/resources/loaders"

const pos = vec3.create()
const lookAt = vec3.create()

function SetCameraHandler(ptr: SeekablePtr): void {
    readToFloatArray(ptr, pos)
    readToFloatArray(ptr, lookAt)

    Render.setCamera(pos, lookAt)
}

registerOutputHandler(OutputMessageId.SET_CAMERA, SetCameraHandler)

async function CreateRenderableHandler(ptr: SeekablePtr): Promise<Renderable> {
    const meshHandle = readU64(ptr)
    const textureHandle = readU64(ptr)

    const mesh =
        Queues.getResultSync<Mesh>(meshHandle) || (await Queues.getResultAsync<Mesh>(meshHandle))

    const texture =
        Queues.getResultSync<Texture>(textureHandle) ||
        (await Queues.getResultAsync<Texture>(textureHandle))

    const renderable = new Renderable(mesh, texture)

    return renderable
}

registerOutputHandler(OutputMessageId.CREATE_RENDERABLE, CreateRenderableHandler)

async function SetTransformHandler(ptr: SeekablePtr): Promise<void> {
    const renderableHandle = readU64(ptr)

    const transformData = new Float32Array(4 + 1 + 3)
    readToFloatArray(ptr, transformData)

    const renderable =
        Queues.getResultSync<Renderable>(renderableHandle) ||
        (await Queues.getResultAsync<Renderable>(renderableHandle))

    Render.setTransform(renderable, transformData)
}

registerOutputHandler(OutputMessageId.SET_TRANSFORM, SetTransformHandler)

async function AddRenderableHandler(ptr: SeekablePtr): Promise<void> {
    const renderableHandle = readU64(ptr)

    const renderable =
        Queues.getResultSync<Renderable>(renderableHandle) ||
        (await Queues.getResultAsync<Renderable>(renderableHandle))

    Render.addRenderable(renderable)
}

registerOutputHandler(OutputMessageId.ADD_RENDERABLE, AddRenderableHandler)

const MAX_NAME_LENGTH = 64

async function RequestTexture(ptr: SeekablePtr): Promise<Texture> {
    const texName = readString(ptr, MAX_NAME_LENGTH)
    const texture = await ResourceManager.requestTexture(texName)
    return texture
}

registerOutputHandler(OutputMessageId.REQUEST_TEXTURE, RequestTexture)

async function RequestMesh(ptr: SeekablePtr): Promise<Mesh> {
    const meshName = readString(ptr, MAX_NAME_LENGTH)
    const mesh = await ResourceManager.requestMesh(meshName)
    return mesh
}

registerOutputHandler(OutputMessageId.REQUEST_MESH, RequestMesh)

async function CreateGeneratedMesh(ptr: SeekablePtr): Promise<Mesh> {
    const vertexCount = readU32(ptr)
    const indexCount = readU32(ptr)
    const data = readPointer(ptr)

    const vertices = new Float32Array(Engine.HEAPU8.buffer, data, vertexCount)

    const indices = new Uint16Array(
        Engine.HEAPU8.buffer,
        data + vertexCount * Float32Array.BYTES_PER_ELEMENT,
        indexCount
    )

    const model = new Mesh(vertices, indices)

    return model
}

registerOutputHandler(OutputMessageId.CREATE_GENERATED_MESH, CreateGeneratedMesh)

async function GenerateOneColorTexture(/*ptr: SeekablePtr*/): Promise<void> {
    // TODO
}

registerOutputHandler(OutputMessageId.GENERATE_ONE_COLOR_TEXTURE, GenerateOneColorTexture)
