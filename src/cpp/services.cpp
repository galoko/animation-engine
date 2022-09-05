#include <stdio.h>

#include "services.hpp"

void ServicesManager::tick(double dt) {
    this->playerInputManager.tick(dt);
    this->worldManager.tick(dt);
    this->cameraManager.tick(dt);
}

unique_ptr<ServicesManager> Services;