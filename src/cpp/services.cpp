#include <stdio.h>

#include "services.hpp"

void ServicesManager::tick(double dt) {
    this->worldManager.tick(dt);
    this->playerInputManager.tick(dt);
    this->cameraManager.tick(dt);
}

unique_ptr<ServicesManager> Services;