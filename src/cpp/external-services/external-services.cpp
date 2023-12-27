#include <stdio.h>

#include "external-services.hpp"

ServicesQueue inputQueue, outputQueue;

ServicesQueue *getInputQueue() {
    return &inputQueue;
}

ServicesQueue *getOutputQueue() {
    return &outputQueue;
}

GenericMessageHandler inputHandlers[(int)InputMessageId::LAST_INPUT_MESSAGE + 1];

MessageHandle nextHandle = 1;

void processInputQueue() {
    ServicesQueue *queue = getInputQueue();

    uint8_t *ptr = &queue->buffer[0];
    for (uint32_t messageIndex = 0; messageIndex < queue->messagesCount; messageIndex++) {
        ServicesMessage const *msg = (ServicesMessage const *)ptr;

        // printf("message received, id: %d, size: %d, handle: %lld\n", msg->header.id, msg->header.size,
        //        msg->header.handle);

        GenericMessageHandler handler = inputHandlers[msg->header.id];

        if (handler != nullptr) {
            handler((InputMessageId)msg->header.id, msg->header.handle, msg->data);
        } else {
            throw runtime_error("Message have no handler.");
        }

        ptr += sizeof(ServiceMessageHeader) + msg->header.size;
    }

    queue->messagesCount = 0;
    queue->bufferPosition = 0;
}

void unregisterAll() {
    for (int i = 0; i <= (int)InputMessageId::LAST_INPUT_MESSAGE; i++) {
        inputHandlers[i] = nullptr;
    }
}