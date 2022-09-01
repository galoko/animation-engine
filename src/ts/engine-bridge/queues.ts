// Queues

import { Engine } from "./module"
import {
    InputMessageId,
    MESSAGE_SIZE_IN_BYTES,
    OutputMessageId,
    MESSAGE_HEADER_SIZE_IN_BYTES,
    MessageHandle,
    getOutputMessageHandler,
    InputMessageWriter,
} from "./queue-messages"
import { readU32, readU64, SeekablePtr, writeU32, writeU64 } from "./read-write-utils"
import "./messages/output-messages"
import { Deferred } from "ts-deferred"

// Queues

const MESSAGES_MAX_COUNT = 1024
const QUEUE_HEADER_SIZE_IN_BYTES = 4

let inputQueue: number
let outputQueue: number
const ptr = new SeekablePtr(0)
const results = new Map<MessageHandle, any>()
const resultListeners = new Map<MessageHandle, Array<Deferred<any>>>()

export class Queues {
    private static nextHandle: MessageHandle = 0

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

    static getResult<T>(handle: MessageHandle): Promise<T> {
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

    static processOutputQueue(): void {
        const messagesCount = readU32(outputQueue)

        for (let messageIndex = 0; messageIndex < messagesCount; messageIndex++) {
            const msgPtr =
                outputQueue + QUEUE_HEADER_SIZE_IN_BYTES + messageIndex * MESSAGE_SIZE_IN_BYTES

            ptr.value = msgPtr + MESSAGE_HEADER_SIZE_IN_BYTES

            const id = readU32(ptr) as OutputMessageId
            const handle = readU64(ptr) as OutputMessageId

            const handler = getOutputMessageHandler(id)
            if (handler === undefined) {
                throw new Error("Output message have no handler.")
            }

            const result = handler(ptr, handle, id)
            if (result !== undefined) {
                Queues.registerResult(handle, result)
            }

            if (ptr.value > msgPtr + MESSAGE_SIZE_IN_BYTES) {
                // TODO === after exact size of packet
                throw new Error("Overflow while reading")
            }
        }

        writeU32(outputQueue, 0)
    }

    static pushMessage(
        id: InputMessageId,
        writer: InputMessageWriter,
        ...args: any[]
    ): MessageHandle {
        const messagesCount = readU32(inputQueue)
        if (messagesCount >= MESSAGES_MAX_COUNT) {
            throw new Error("Input queue is full.")
        }

        const handle = Queues.nextHandle++

        ptr.value = inputQueue + QUEUE_HEADER_SIZE_IN_BYTES + messagesCount * MESSAGE_SIZE_IN_BYTES

        writeU32(ptr, id as number)
        writeU64(ptr, handle as number)
        writer(id, ptr, ...args)

        writeU32(inputQueue, messagesCount + 1)

        return handle
    }

    static finalize(): void {
        //
    }
}
