#pragma once

#include <memory>

#include "vec2.hpp"

using namespace glm;
using namespace std;

namespace {
    enum class MouseButton
    {
        NONE = 0,

        LEFT,
        MIDDLE,
        RIGHT,

        FIRST_BUTTON = NONE,
        LAST_BUTTON = RIGHT
    };

    enum class KeyboardKey
    {
        KEY_0 = 1,
        KEY_1,
        KEY_2,
        KEY_3,
        KEY_4,
        KEY_5,
        KEY_6,
        KEY_7,
        KEY_8,
        KEY_9,
        KEY_A,
        KEY_B,
        KEY_C,
        KEY_D,
        KEY_E,
        KEY_F,
        KEY_G,
        KEY_H,
        KEY_I,
        KEY_J,
        KEY_K,
        KEY_L,
        KEY_M,
        KEY_N,
        KEY_O,
        KEY_P,
        KEY_Q,
        KEY_R,
        KEY_S,
        KEY_T,
        KEY_U,
        KEY_V,
        KEY_W,
        KEY_X,
        KEY_Y,
        KEY_Z,
        KEY_SPACE,
        KEY_LSHIFT,
        KEY_RSHIFT,
        KEY_LCONTROL,
        KEY_RCONTROL,

        FIRST_KEY = KEY_0,
        LAST_KEY = KEY_RCONTROL
    };
}; // namespace

// handles input, like mouse and key presses
class InputManager {
private:
    bool keyboardState[(int)KeyboardKey::LAST_KEY + 1];
    bool mouseState[(int)MouseButton::LAST_BUTTON + 1];

    vec2 mousePoint, mouseDelta;
    bool mouseCaptured;

public:
    InputManager();
};

// handles camera?
class CameraManager {
    //
};

// handles physics
class PhysicsManager {
    //
};

// keeps a list of all bodies and terrain?
class WorldManager {
public:
    WorldManager();

    void loadTestMap();
};

class ServicesManager {
public:
    InputManager inputManager;
    CameraManager cameraManager;
    PhysicsManager physicsManager;
    WorldManager worldManager;
};

extern unique_ptr<ServicesManager> Services;