#pragma once

#include <cstdint>
#include <stdexcept>

using namespace std;

// Input

enum class InputMessageId
{
    NULL_ID = 0,

    // Input
    MOUSE_MOVE,
    MOUSE_DOWN,
    MOUSE_UP,
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

    // Test

    TEST_CALLBACK
};

// Messages

struct MouseMessage {
    int32_t button, x, y;

    MouseMessage(int32_t button, int32_t x, int32_t y) : button(button), x(x), y(y) {
    }
};

struct Test {
    int32_t test_number;
    char const *test_str;
    int (*test_callback)();

    Test(int32_t test_number, char const *test_str, int (*test_callback)())
        : test_number(test_number), test_str(test_str), test_callback(test_callback) {
    }
};

// Queue

struct ServicesMessage {
    uint32_t id;
    // reserved data
    uint8_t data[60];
};

#define MESSAGES_SIZE_IN_BYTES 64
#define MESSAGES_MAX_COUNT 1024
#define MESSAGES_BODY_SIZE_IN_BYTES (MESSAGES_SIZE_IN_BYTES - 4)

#pragma pack(push, 1)

struct ServicesQueue {
    int32_t messagesCount;
    ServicesMessage messages[MESSAGES_MAX_COUNT];
};

#pragma pack(pop)

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
    memcpy(&msg->data[0], &data, messageBodySize);

    queue->messagesCount++;
}