#include <stdio.h>

#include "../external-services/external-services.hpp"
#include "services.hpp"

unique_ptr<ServicesManager> Services;

// InputManager

#pragma pack(push, 1)

struct KeyboardMessage {
    uint32_t key;
};

struct MouseMessage {
    uint32_t button;
    float x, y, dx, dy;
    uint32_t isCaptured;
};

#pragma pack(pop)

InputManager::InputManager() : keyboardState(), mouseState(), mousePoint(), mouseDelta() {
    MessageHandler<KeyboardMessage> keyHandler = [this](InputMessageId id, KeyboardMessage const &msg) -> void {
        KeyboardKey key = (KeyboardKey)msg.key;
        if (key < KeyboardKey::FIRST_KEY || key > KeyboardKey::LAST_KEY) {
            throw overflow_error("Key is out of range.");
        }

        bool down = id == InputMessageId::KEY_DOWN;

        this->keyboardState[(int)key] = down;

        printf("keyboard key %d is %s\n", msg.key, down ? "down" : "up");
    };

    registerHandler({InputMessageId::KEY_UP, InputMessageId::KEY_DOWN}, keyHandler);

    MessageHandler<MouseMessage> mouseHandler = [this](InputMessageId id, MouseMessage const &msg) -> void {
        MouseButton button = (MouseButton)msg.button;
        if (button < MouseButton::FIRST_BUTTON || button > MouseButton::LAST_BUTTON) {
            throw overflow_error("Button is out of range.");
        }

        if (id == InputMessageId::MOUSE_DOWN) {
            this->mouseState[(int)button] = true;
        } else if (id == InputMessageId::MOUSE_UP) {
            this->mouseState[(int)button] = false;
        }

        this->mouseDelta.x = !isnan(msg.dx) ? msg.dx : 0;
        this->mouseDelta.y = !isnan(msg.dy) ? msg.dy : 0;

        this->mousePoint.x = msg.x;
        this->mousePoint.y = msg.y;

        printf("mouse button %d is %d at %f %f (%f %f), captured: %d\n", msg.button, (int)id, this->mousePoint.x,
               this->mousePoint.y, this->mouseDelta.x, this->mouseDelta.y, msg.isCaptured);
    };

    registerHandler({InputMessageId::MOUSE_DOWN, InputMessageId::MOUSE_MOVE, InputMessageId::MOUSE_UP}, mouseHandler);
}