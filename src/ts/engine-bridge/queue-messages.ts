import { readU32, writeU32 } from "./read-write-utils"

export const MESSAGES_SIZE_IN_BYTES = 64
export const MESSAGES_BODY_SIZE_IN_BYTES = MESSAGES_SIZE_IN_BYTES - 4

export enum InputMessageId {
    NULL_ID = 0,

    // Input
    MOUSE_MOVE,
    MOUSE_DOWN,
    MOUSE_UP,
}

export abstract class InputMessage {
    static ID = InputMessageId.NULL_ID

    private ptr: number | undefined = undefined
    private size = 0

    protected writeU32(value: number) {
        if (this.ptr === undefined) {
            throw new Error("InputMessage ptr is not set.")
        }

        writeU32(this.ptr, value)
        this.seek(4)
    }

    private seek(amount: number): void {
        if (this.ptr === undefined) {
            throw new Error("InputMessage ptr is not set.")
        }

        if (this.size + amount > MESSAGES_BODY_SIZE_IN_BYTES) {
            throw new Error("Message body exceeds size.")
        }

        this.ptr += amount
        this.size += amount
    }

    public setPtr(ptr: number) {
        this.ptr = ptr
    }

    public abstract serialize(): void
}

export type InputMessageClass = {
    new (ptr: number): InputMessage
    ID: InputMessageId
}

export enum OutputMessageId {
    NULL_ID = 0,

    // Render
    ADD_OBJECT,
    REMOVE_OBJECT,

    // Resources
    REQUEST_TEXTURE,
    REQUEST_MODEL,
    REQUEST_ANIMATION,

    // Test

    TEST_CALLBACK,
}

export abstract class OutputMessage {
    static ID = OutputMessageId.NULL_ID

    private avaiableBytesCount = MESSAGES_BODY_SIZE_IN_BYTES

    constructor(private ptr: number) {}

    protected readU32(): number {
        const result = readU32(this.ptr)
        this.seek(4)
        return result
    }

    private seek(amount: number): void {
        if (this.avaiableBytesCount < amount) {
            throw new Error("OutputMessage out of range.")
        }

        this.ptr += amount
        this.avaiableBytesCount -= amount
    }

    abstract deserialize(): void
    abstract apply(): void
}

type OutputMessageClass = {
    new (ptr: number): OutputMessage
    ID: OutputMessageId
}

const OUTPUT_CLASSES: {
    [key in OutputMessageId]?: OutputMessageClass
} = {}

export function registerOutputClass(clazz: OutputMessageClass): void {
    const id = clazz.ID

    if (id === OutputMessageId.NULL_ID) {
        throw new Error("ID for OutputMessage is not set.")
    }

    if (OUTPUT_CLASSES[id] !== undefined) {
        throw new Error("Output class is already registered.")
    }

    OUTPUT_CLASSES[id] = clazz
}

export function getOutputMessageClass(id: OutputMessageId): OutputMessageClass | undefined {
    return OUTPUT_CLASSES[id]
}