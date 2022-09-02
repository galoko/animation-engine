#pragma once

#include <cstdint>
#include <stdexcept>
#include <vector>

using namespace std;

// Input

enum class InputMessageId
{
    NULL_ID = 0,

    // Input
    MOUSE_MOVE,
    MOUSE_DOWN,
    MOUSE_UP,

    KEY_DOWN,
    KEY_UP,

    FIRST_INPUT_MESSAGE = MOUSE_MOVE,
    LAST_INPUT_MESSAGE = KEY_UP
};

// Output

enum class OutputMessageId
{
    NULL_ID = 0,

    // Render

    SET_CAMERA,

    CREATE_PRIMITIVE,

    SET_TRANSFORM,

    SET_PRIMITIVE_COLOR,
    SET_PRIMITIVE_LINE_ENDS,
    SET_PRIMITIVE_TEXT,

    ADD_ENTITY,
    REMOVE_ENTITY,

    // Resources

    REQUEST_TEXTURE,
    REQUEST_MODEL,
    REQUEST_ANIMATION,
};

// Queue

#define QUEUE_BUFFER_SIZE 3 * 1024 * 1024

typedef uint64_t MessageHandle;

#pragma pack(push, 1)

struct ServiceMessageHeader {
    uint32_t id;
    uint32_t size;
    MessageHandle handle;
};

struct ServicesMessageData {
    uint8_t bytes[1];
};

struct ServicesMessage {
    ServiceMessageHeader header;
    ServicesMessageData data;
};

struct ServicesQueue {
    uint32_t messagesCount;
    uint32_t bufferPosition;
    uint8_t buffer[QUEUE_BUFFER_SIZE];
};

#pragma pack(pop)

namespace {
    template <typename T> using MessageHandler = function<void(InputMessageId, MessageHandle, T const &)>;
    using GenericMessageHandler = MessageHandler<ServicesMessageData>;
}; // namespace

extern GenericMessageHandler inputHandlers[(int)InputMessageId::LAST_INPUT_MESSAGE + 1];

ServicesQueue *getInputQueue();
ServicesQueue *getOutputQueue();

extern MessageHandle nextHandle;

template <typename T> MessageHandle pushMessage(OutputMessageId id, T data) {
    ServicesQueue *queue = getOutputQueue();
    int messageBodySize = sizeof(T);
    int messageSize = sizeof(ServiceMessageHeader) + messageBodySize;

    if (queue->bufferPosition + messageSize > QUEUE_BUFFER_SIZE) {
        throw overflow_error("Output queue buffer overflow.");
    }

    ServicesMessage *msg = (ServicesMessage *)&queue->buffer[queue->bufferPosition];

    msg->header.id = (uint32_t)id;
    msg->header.size = messageBodySize;
    msg->header.handle = nextHandle++;

    memcpy(&msg->data.bytes, &data, messageBodySize);

    queue->messagesCount++;

    queue->bufferPosition += messageSize;

    return msg->header.handle;
}

void processInputQueue();

template <typename T> void registerHandler(InputMessageId id, MessageHandler<T> handler) {
    if (inputHandlers[(int)id] != nullptr) {
        throw runtime_error("Handler is already registered for id.");
        return;
    }
    inputHandlers[(int)id] = *((GenericMessageHandler *)&handler);
}

template <typename T> void registerHandler(vector<InputMessageId> const &ids, MessageHandler<T> handler) {
    for (InputMessageId id : ids) {
        registerHandler(id, handler);
    }
}

void unregisterAll();