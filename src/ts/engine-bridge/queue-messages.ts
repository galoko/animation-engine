import { SeekablePtr } from "./read-write-utils"

export type MessageHandle = number

export enum InputMessageId {
    NULL_ID = 0,

    // Input
    MOUSE_MOVE,
    MOUSE_DOWN,
    MOUSE_UP,

    KEY_DOWN,
    KEY_UP,
}

export enum OutputMessageId {
    NULL_ID = 0,

    // Render
    SET_CAMERA,

    CREATE_RENDERABLE,

    SET_TRANSFORM,

    ADD_RENDERABLE,
    REMOVE_RENDERABLE,

    // Resources
    REQUEST_TEXTURE,
    REQUEST_MESH,
    REQUEST_ANIMATION,
    CREATE_GENERATED_MESH,

    // Resource generators
    GENERATE_ONE_COLOR_TEXTURE,
    GENERATE_LINE_MESH,
    GENERATE_TEXT_TEXTURE,
}

type OutputMessageHandler = (ptr: SeekablePtr, handle: MessageHandle, id: OutputMessageId) => any

export type InputMessageWriter = (id: InputMessageId, ptr: SeekablePtr, ...args: any[]) => void

const OUTPUT_HANDLERS: {
    [key in OutputMessageId]?: OutputMessageHandler
} = {}

export function registerOutputHandler(id: OutputMessageId, handler: OutputMessageHandler): void {
    if (id === OutputMessageId.NULL_ID) {
        throw new Error("ID for OutputMessage is not set.")
    }

    if (OUTPUT_HANDLERS[id] !== undefined) {
        throw new Error("Output class is already registered.")
    }

    OUTPUT_HANDLERS[id] = handler
}

export function getOutputMessageHandler(id: OutputMessageId): OutputMessageHandler | undefined {
    return OUTPUT_HANDLERS[id]
}
