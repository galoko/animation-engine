// Queues

import { Engine } from "./module"
import {
    InputMessageId,
    OutputMessageId,
    MessageHandle,
    getOutputMessageHandler,
    InputMessageWriter,
} from "./queue-messages"
import { readU32, readU64, SeekablePtr, writeU32, writeU64 } from "./read-write-utils"
import "./messages/output-messages"
import { Deferred } from "ts-deferred"

const QUEUE_BUFFER_SIZE = 3 * 1024 * 1024

// Queues

let inputQueue: number
let outputQueue: number
const ptr = new SeekablePtr(0)
const results = new Map<MessageHandle, any>()
const resultListeners = new Map<MessageHandle, Array<Deferred<any>>>()

export class Queues {
    private static nextHandle: MessageHandle = 1

    static init(): void {
        inputQueue = Engine._get_input_queue_ptr()
        outputQueue = Engine._get_output_queue_ptr()
    }

    static registerResult(handle: MessageHandle, result: any): void {
        results.set(handle, result)
        if (result instanceof Promise) {
            result.then(value => {
                if (value !== undefined) {
                    results.set(handle, value)
                } else {
                    results.delete(handle)
                }

                // resolve all listeners
                const listeners = resultListeners.get(handle)
                if (listeners) {
                    for (const listener of listeners) {
                        listener.resolve(value)
                    }
                    resultListeners.delete(handle)
                }
            })
        }
    }

    static getResultAsync<T>(handle: MessageHandle): Promise<T> {
        const result = new Deferred<T>()

        const value = results.get(handle)
        if (value === undefined) {
            result.reject("Result not found")
        } else if (value instanceof Promise) {
            let listeners = resultListeners.get(handle)
            if (listeners === undefined) {
                listeners = []
                resultListeners.set(handle, listeners)
            }
            listeners.push(result)
        } else {
            result.resolve(value)
        }

        return result.promise
    }

    static getResultSync<T>(handle: MessageHandle): T | undefined {
        const value = results.get(handle)

        if (value instanceof Promise) {
            return undefined
        } else {
            return value
        }
    }

    static processOutputQueue(): void {
        ptr.value = outputQueue
        const messagesCount = readU32(ptr)
        const bytesAvailable = readU32(ptr)

        for (let messageIndex = 0; messageIndex < messagesCount; messageIndex++) {
            const id = readU32(ptr) as OutputMessageId
            const size = readU32(ptr) as number
            const handle = readU64(ptr) as MessageHandle

            const handler = getOutputMessageHandler(id)
            if (handler === undefined) {
                throw new Error("Output message have no handler.")
            }

            const dataPtr = ptr.value

            const result = handler(ptr, handle, id)
            if (result !== undefined) {
                Queues.registerResult(handle, result)
            }

            if (ptr.value > dataPtr + size) {
                throw new Error("Overflow while reading message")
            }

            ptr.value = dataPtr + size
        }

        ptr.value = outputQueue
        writeU32(ptr, 0)
        writeU32(ptr, 0)
    }

    static pushMessage(
        id: InputMessageId,
        writer: InputMessageWriter,
        ...args: any[]
    ): MessageHandle {
        ptr.value = inputQueue

        const messagesCount = readU32(ptr)
        const bytesWritten = readU32(ptr)

        ptr.value += bytesWritten

        const handle = Queues.nextHandle++

        const messagePtr = ptr.value

        writeU32(ptr, id as number)
        const sizePtr = ptr.value
        // size place older
        writeU32(ptr, 0)
        writeU64(ptr, handle as number)

        const dataPtr = ptr.value
        writer(id, ptr, ...args)
        const messageBodySize = ptr.value - dataPtr

        const messageSize = ptr.value - messagePtr

        if (bytesWritten + messageSize > QUEUE_BUFFER_SIZE) {
            // TODO here we have already have written out of bounds, we need to prevent this
            throw new Error("Input queue buffer overflow.")
        }

        // update message header (size)
        ptr.value = sizePtr
        writeU32(ptr, messageBodySize)

        // update queue header
        ptr.value = inputQueue
        writeU32(ptr, messagesCount + 1)
        writeU32(ptr, bytesWritten + messageSize)

        return handle
    }

    static finalize(): void {
        //
    }
}
