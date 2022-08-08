// Queues

import { Engine } from "./module"
import {
    InputMessage,
    getOutputMessageClass,
    InputMessageId,
    MESSAGES_SIZE_IN_BYTES,
    OutputMessageId,
    InputMessageClass,
} from "./queue-messages"
import { readU32, writeU32 } from "./read-write-utils"
import "./messages/output-messages"

// Queues

const MESSAGES_MAX_COUNT = 1024

let inputQueue: number
let outputQueue: number

export class Queues {
    static init(): void {
        inputQueue = Engine._get_input_queue_ptr()
        outputQueue = Engine._get_output_queue_ptr()
    }

    static processOutputQueue(): void {
        const messagesCount = readU32(outputQueue)

        for (let messageIndex = 0; messageIndex < messagesCount; messageIndex++) {
            const msgPtr = outputQueue + 4 + messageIndex * MESSAGES_SIZE_IN_BYTES

            const id = readU32(msgPtr) as OutputMessageId
            const clazz = getOutputMessageClass(id)

            if (clazz === undefined) {
                throw new Error("Output message class is not registered.")
            }

            const message = new clazz(msgPtr + 4)
            message.deserialize()
            message.apply()
        }
    }

    static pushMessage<T extends InputMessage>(data: T) {
        const id = (data.constructor as InputMessageClass).ID
        if (id === InputMessageId.NULL_ID) {
            throw new Error("ID for InputMessage is not set.")
        }

        const messagesCount = readU32(inputQueue)
        if (messagesCount >= MESSAGES_MAX_COUNT) {
            throw new Error("Input queue is full.")
        }

        const msgPtr = inputQueue + 4 + messagesCount * MESSAGES_SIZE_IN_BYTES
        writeU32(msgPtr, id as number)

        data.setPtr(msgPtr + 4)
        data.serialize()

        writeU32(inputQueue, messagesCount + 1)
    }
}
