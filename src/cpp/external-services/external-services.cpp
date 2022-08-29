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

MessageHandle nextHandle = 0;

void processInputQueue() {
    ServicesQueue *queue = getInputQueue();

    for (int messageIndex = 0; messageIndex < queue->messagesCount; messageIndex++) {
        ServicesMessage const &msg = queue->messages[messageIndex];

        printf("message received, id: %d, handle: %lld\n", msg.id, msg.handle);

        GenericMessageHandler handler = inputHandlers[msg.id];

        if (handler != nullptr) {
            handler((InputMessageId)msg.id, msg.handle, msg.data);
        } else {
            throw runtime_error("Message have no handler.");
        }
    }

    queue->messagesCount = 0;
}