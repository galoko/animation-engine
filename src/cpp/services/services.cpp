#include <stdio.h>

#include "gtx/transform.hpp"
#include "mat4x4.hpp"
#include "vec3.hpp"
#include "vec4.hpp"

#include "../external-services/external-services.hpp"
#include "services.hpp"

using namespace glm;

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

InputManager::InputManager() : keyboardState(), mouseState(), mousePoint(), mouseDelta(), mouseCaptured() {
    MessageHandler<KeyboardMessage> keyHandler = [this](InputMessageId id, KeyboardMessage const &msg) -> void {
        KeyboardKey key = (KeyboardKey)msg.key;
        if (key < KeyboardKey::FIRST_KEY || key > KeyboardKey::LAST_KEY) {
            throw overflow_error("Key is out of range.");
        }

        bool down = id == InputMessageId::KEY_DOWN;

        this->keyboardState[(int)key] = down;
    };

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

        this->mouseCaptured = msg.isCaptured != 0;
    };

    registerHandler({InputMessageId::KEY_UP, InputMessageId::KEY_DOWN}, keyHandler);
    registerHandler({InputMessageId::MOUSE_DOWN, InputMessageId::MOUSE_MOVE, InputMessageId::MOUSE_UP}, mouseHandler);
}

// WorldManager

#pragma pack(push, 1)

struct SetCameraMessage {
    vec3 pos, lookAt;

    SetCameraMessage(vec3 pos, vec3 lookAt) : pos(pos), lookAt(lookAt) {
    }
};

enum class PrimitiveType
{
    Plane,
    Cube,
    Sphere,
    Capsule,
    Line,
    Text,
};

struct CreatePrimitiveMessage {
    uint32_t primitiveType;

    CreatePrimitiveMessage(PrimitiveType primitiveType) : primitiveType((uint32_t)primitiveType) {
    }
};

#pragma pack(pop)

WorldManager::WorldManager() {
    //
}

void WorldManager::loadTestMap() {
    pushMessage(OutputMessageId::SET_CAMERA, SetCameraMessage(vec3(0, 10, 0), vec3(10, 0, 0)));

    auto capsule = pushMessage(OutputMessageId::CREATE_PRIMITIVE, CreatePrimitiveMessage(PrimitiveType::Capsule));
    pushMessage(OutputMessageId::SET_PRIMITIVE_COLOR, SetPrimitiveColor(capsule, vec4(1, 0, 0, 1)));
    mat4 transform = scale(translate(mat4(), vec3(10, 0, 0)), vec3(2, 2, 5));
    pushMessage(OutputMessageId::SET_TRANSFORM, SetTransformMessage(capsule, transform));

    /*
    const capsule = await createPrimitive(
        PrimitiveType.Capsule,
        vec4.fromValues(1, 0, 0, 1),
        transform
    )
    Render.addEntity(capsule)

    mat4.identity(transform)
    mat4.translate(transform, transform, vec3.fromValues(10, 0, -2.5))
    mat4.scale(transform, transform, vec3.fromValues(10, 10, 1))
    const ground = await createPrimitive(
        PrimitiveType.Plane,
        vec4.fromValues(0, 0, 1, 1),
        transform
    )
    Render.addEntity(ground)

    mat4.identity(transform)
    mat4.translate(transform, transform, vec3.fromValues(10, 0, 0))
    mat4.scale(transform, transform, vec3.fromValues(2, 2, 5))

    setInterval(() => {
        mat4.scale(transform, transform, vec3.fromValues(0.999, 0.999, 1))

        Render.setTransform(capsule, transform)
    }, 1)
    */
}