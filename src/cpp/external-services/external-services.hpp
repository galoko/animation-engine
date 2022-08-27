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
    ADD_OBJECT,
    REMOVE_OBJECT,

    // Resources
    REQUEST_TEXTURE,
    REQUEST_MODEL,
    REQUEST_ANIMATION,
};

// Queue

#define MESSAGES_SIZE_IN_BYTES 64
#define MESSAGES_MAX_COUNT 1024
#define MESSAGES_BODY_SIZE_IN_BYTES (MESSAGES_SIZE_IN_BYTES - 4)

#pragma pack(push, 1)

struct ServicesMessageData {
    uint8_t reserved[60];
};

struct ServicesMessage {
    uint32_t id;
    ServicesMessageData data;
};

struct ServicesQueue {
    int32_t messagesCount;
    ServicesMessage messages[MESSAGES_MAX_COUNT];
};

#pragma pack(pop)

namespace {
    template <typename T> using MessageHandler = function<void(InputMessageId, T const &)>;
    using GenericMessageHandler = MessageHandler<ServicesMessageData>;
}; // namespace

extern GenericMessageHandler inputHandlers[(int)InputMessageId::LAST_INPUT_MESSAGE + 1];

ServicesQueue *getInputQueue();
ServicesQueue *getOutputQueue();

template <typename T> void pushMessage(OutputMessageId id, T data) {
    ServicesQueue *queue = getOutputQueue();

    if (queue->messagesCount >= MESSAGES_MAX_COUNT) {
        throw length_error("Output queue is full.");
    }

    int messageBodySize = sizeof(T);

    if (messageBodySize > MESSAGES_BODY_SIZE_IN_BYTES) {
        throw length_error("Message body exceeds size.");
    }

    ServicesMessage *msg = &queue->messages[queue->messagesCount];

    msg->id = (uint32_t)id;
    memcpy(&msg->data.reserved[0], &data, messageBodySize);

    queue->messagesCount++;
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