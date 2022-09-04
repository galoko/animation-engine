/*
SET_TRANSFORM,

SET_PRIMITIVE_COLOR,
SET_PRIMITIVE_LINE_ENDS,
SET_PRIMITIVE_TEXT,

ADD_ENTITY,
REMOVE_ENTITY,
*/

import { mat4, vec3, vec4 } from "gl-matrix"
import { Entity } from "../../external-services/ecs/entity"
import { createPrimitive, PrimitiveType } from "../../external-services/render/primitives"
import { Render } from "../../external-services/render/render"
import { OutputMessageId, registerOutputHandler } from "../queue-messages"
import { Queues } from "../queues"
import { readFloat, readU32, readU64, SeekablePtr } from "../read-write-utils"

const pos = vec3.create()
const lookAt = vec3.create()

function SetCameraHandler(ptr: SeekablePtr): void {
    vec3.set(pos, readFloat(ptr), readFloat(ptr), readFloat(ptr))
    vec3.set(lookAt, readFloat(ptr), readFloat(ptr), readFloat(ptr))

    Render.setCamera(pos, lookAt)
}

registerOutputHandler(OutputMessageId.SET_CAMERA, SetCameraHandler)

function CreatePrimitiveHandler(ptr: SeekablePtr): Promise<Entity> {
    const primitiveType = readU32(ptr) as PrimitiveType
    const transform = mat4.create()
    mat4.identity(transform)
    return createPrimitive(primitiveType, vec4.fromValues(1, 1, 1, 1), transform)
}

registerOutputHandler(OutputMessageId.CREATE_PRIMITIVE, CreatePrimitiveHandler)

async function SetTransformHandler(ptr: SeekablePtr): Promise<void> {
    const entityHandle = readU64(ptr)
    const transform = mat4.fromValues(
        readFloat(ptr),
        readFloat(ptr),
        readFloat(ptr),
        readFloat(ptr),
        readFloat(ptr),
        readFloat(ptr),
        readFloat(ptr),
        readFloat(ptr),
        readFloat(ptr),
        readFloat(ptr),
        readFloat(ptr),
        readFloat(ptr),
        readFloat(ptr),
        readFloat(ptr),
        readFloat(ptr),
        readFloat(ptr)
    )

    const entity = await Queues.getResult<Entity>(entityHandle)
    Render.setTransform(entity, transform)
}

registerOutputHandler(OutputMessageId.SET_TRANSFORM, SetTransformHandler)

async function SetPrimitiveColorHandler(ptr: SeekablePtr): Promise<void> {
    const entityHandle = readU64(ptr)
    const r = readFloat(ptr)
    const g = readFloat(ptr)
    const b = readFloat(ptr)
    const a = readFloat(ptr)

    const entity = await Queues.getResult<Entity>(entityHandle)

    Render.setPrimitiveColor(entity, vec4.fromValues(r, g, b, a))
}

registerOutputHandler(OutputMessageId.SET_PRIMITIVE_COLOR, SetPrimitiveColorHandler)

async function AddEntityHandler(ptr: SeekablePtr): Promise<void> {
    const entityHandle = readU64(ptr)

    const entity = await Queues.getResult<Entity>(entityHandle)

    Render.addEntity(entity)
}

registerOutputHandler(OutputMessageId.ADD_ENTITY, AddEntityHandler)
