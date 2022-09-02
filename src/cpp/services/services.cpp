#include <stdio.h>

#include "gtx/transform.hpp"
#include "mat4x4.hpp"
#include "vec3.hpp"
#include "vec4.hpp"

#include "../external-services/external-render.hpp"
#include "../external-services/input-messages.hpp"

#include "services.hpp"

using namespace glm;

unique_ptr<ServicesManager> Services;

// InputManager

InputManager::InputManager() : keyboardState(), mouseState(), mousePoint(), mouseDelta(), mouseCaptured() {
    MessageHandler<KeyboardMessage> keyHandler = [this](InputMessageId id, MessageHandle handle,
                                                        KeyboardMessage const &msg) -> void {
        KeyboardKey key = (KeyboardKey)msg.key;
        if (key < KeyboardKey::FIRST_KEY || key > KeyboardKey::LAST_KEY) {
            throw overflow_error("Key is out of range.");
        }

        bool down = id == InputMessageId::KEY_DOWN;

        this->keyboardState[(int)key] = down;

        printf("key message %d is %s\n", msg.key, down ? "pressed" : "not pressed");
    };

    MessageHandler<MouseMessage> mouseHandler = [this](InputMessageId id, MessageHandle handle,
                                                       MouseMessage const &msg) -> void {
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

        this->mouseCaptured = msg.isCaptured != 0;

        printf("mouse message at %f %f (%f %f), captured: %d\n", this->mousePoint.x, this->mousePoint.y,
               this->mouseDelta.x, this->mouseDelta.y, msg.isCaptured);
    };

    registerHandler({InputMessageId::KEY_UP, InputMessageId::KEY_DOWN}, keyHandler);
    registerHandler({InputMessageId::MOUSE_DOWN, InputMessageId::MOUSE_MOVE, InputMessageId::MOUSE_UP}, mouseHandler);
}

// WorldManager

WorldManager::WorldManager() {
    //
}

void WorldManager::loadTestMap() {
    Render::setCamera(vec3(0, 10, 0), vec3(10, 0, 0));

    mat4 transform;

    RenderHandle capsule = Render::createPrimitive(PrimitiveType::Capsule);
    Render::setPrimitiveColor(capsule, vec4(1, 0, 0, 1));
    transform = scale(translate(mat4(1), vec3(10, 0, 0)), vec3(2, 2, 5));
    Render::setTransform(capsule, transform);
    Render::addEntity(capsule);

    RenderHandle ground = Render::createPrimitive(PrimitiveType::Plane);
    Render::setPrimitiveColor(ground, vec4(0, 0, 1, 1));
    transform = scale(translate(mat4(1), vec3(10, 0, -2.5)), vec3(10, 10, 1));
    Render::setTransform(ground, transform);
    Render::addEntity(ground);
}