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
import { readU32, readU64, writeU32, writeU64 } from "./read-write-utils"
import "./messages/output-messages"

// Queues

const MESSAGES_MAX_COUNT = 1024
const QUEUE_HEADER_SIZE_IN_BYTES = 4

let inputQueue: number
let outputQueue: number

export class Queues {
    private static nextHandle: MessageHandle = 0

    static init(): void {
        inputQueue = Engine._get_input_queue_ptr()
        outputQueue = Engine._get_output_queue_ptr()
    }

    static processOutputQueue(): void {
        const messagesCount = readU32(outputQueue)

        for (let messageIndex = 0; messageIndex < messagesCount; messageIndex++) {
            const msgPtr =
                outputQueue + QUEUE_HEADER_SIZE_IN_BYTES + messageIndex * MESSAGE_SIZE_IN_BYTES

            const id = readU32(msgPtr) as OutputMessageId
            const handle = readU64(msgPtr) as OutputMessageId
            const handler = getOutputMessageHandler(id)

            if (handler === undefined) {
                throw new Error("Output message have no handler.")
            }

            handler(id, handle, msgPtr + MESSAGE_HEADER_SIZE_IN_BYTES)
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
        const msgPtr =
            inputQueue + QUEUE_HEADER_SIZE_IN_BYTES + messagesCount * MESSAGE_SIZE_IN_BYTES
        writeU32(msgPtr, id as number)
        writeU64(msgPtr + 4, handle as number)

        writer(id, msgPtr + MESSAGE_HEADER_SIZE_IN_BYTES, ...args)

        writeU32(inputQueue, messagesCount + 1)

        return handle
    }

    static finalize(): void {
        //
    }
}
