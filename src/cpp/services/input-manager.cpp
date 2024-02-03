#include "input-manager.hpp"

#include <cstdio>

#include "../external-services/external-services.hpp"

InputManager::InputManager()
    : keyboardState(), mouseState(), mousePoint(), mouseDelta(), mouseCaptured(), mouseEventSignal(),
      keyboardEventSignal(), mouseEvent(this->mouseEventSignal), keyboardEvent(this->keyboardEventSignal) {
    MessageHandler<KeyboardMessage> keyHandler = [this](InputMessageId id, MessageHandle handle,
                                                        KeyboardMessage const &msg) -> void {
        KeyboardKey key = (KeyboardKey)msg.key;
        if (key < KeyboardKey::FIRST_KEY || key > KeyboardKey::LAST_KEY) {
            throw overflow_error("Key is out of range.");
        }

        bool down = id == InputMessageId::KEY_DOWN;

        this->keyboardState[(int32_t)key] = down;

        // printf("key message %d is %s\n", msg.key, down ? "pressed" : "not pressed");

        this->keyboardEventSignal.publish(msg);
    };

    MessageHandler<MouseMessage> mouseHandler = [this](InputMessageId id, MessageHandle handle,
                                                       MouseMessage const &msg) -> void {
        MouseButton button = (MouseButton)msg.button;
        if (button < MouseButton::FIRST_BUTTON || button > MouseButton::LAST_BUTTON) {
            throw overflow_error("Button is out of range.");
        }

        if (id == InputMessageId::MOUSE_DOWN) {
            this->mouseState[(int32_t)button] = true;
        } else if (id == InputMessageId::MOUSE_UP) {
            this->mouseState[(int32_t)button] = false;
        }

        this->mouseDelta.x = !isnan(msg.dx) ? msg.dx : 0;
        this->mouseDelta.y = !isnan(msg.dy) ? msg.dy : 0;

        this->mousePoint.x = msg.x;
        this->mousePoint.y = msg.y;

        this->mouseCaptured = msg.isCaptured != 0;

        // printf("mouse message at %f %f (%f %f), captured: %d\n", this->mousePoint.x, this->mousePoint.y,
        //        this->mouseDelta.x, this->mouseDelta.y, msg.isCaptured);

        this->mouseEventSignal.publish(msg);
    };

    registerHandler({InputMessageId::KEY_UP, InputMessageId::KEY_DOWN}, keyHandler);
    registerHandler({InputMessageId::MOUSE_DOWN, InputMessageId::MOUSE_MOVE, InputMessageId::MOUSE_UP}, mouseHandler);
}

bool InputManager::isPressed(KeyboardKey key) {
    return this->keyboardState[(int32_t)key];
}

bool InputManager::isPressed(vector<KeyboardKey> keys) {
    for (KeyboardKey key : keys) {
        if (this->isPressed(key)) {
            return true;
        }
    }

    return false;
}