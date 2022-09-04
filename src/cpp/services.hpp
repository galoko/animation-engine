#pragma once

#include <memory>

#include "services/camera-manager.hpp"
#include "services/input-manager.hpp"
#include "services/physics-manager.hpp"
#include "services/player-input-manager.hpp"
#include "services/world-manager.hpp"

using namespace std;

class ServicesManager {
public:
    InputManager inputManager;
    CameraManager cameraManager;
    PlayerInputManager playerInputManager;
    PhysicsManager physicsManager;
    WorldManager worldManager;

    void tick(double dt);
};

extern unique_ptr<ServicesManager> Services;