#pragma once

#include <cstdint>
#include <functional>
#include <stdexcept>
#include <string>
#include <vector>

using namespace std;

// Input

enum class InputMessageId {
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

enum class OutputMessageId {
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
};

// Queue

#define QUEUE_BUFFER_SIZE 3 * 1024 * 1024

typedef uint64_t MessageHandle;

#define NULL_HANDLE ((MessageHandle)0)

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

extern GenericMessageHandler inputHandlers[(int32_t)InputMessageId::LAST_INPUT_MESSAGE + 1];

ServicesQueue *getInputQueue();
ServicesQueue *getOutputQueue();

extern MessageHandle nextHandle;

template <typename T> MessageHandle pushMessage(OutputMessageId id, T data) {
    ServicesQueue *queue = getOutputQueue();
    int32_t messageBodySize = sizeof(T);
    int32_t messageSize = sizeof(ServiceMessageHeader) + messageBodySize;

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
    if (inputHandlers[(int32_t)id] != nullptr) {
        throw runtime_error("Handler is already registered for id.");
        return;
    }
    inputHandlers[(int32_t)id] = *((GenericMessageHandler *)&handler);
}

template <typename T> void registerHandler(vector<InputMessageId> const &ids, MessageHandler<T> handler) {
    for (InputMessageId id : ids) {
        registerHandler(id, handler);
    }
}

void unregisterAll();