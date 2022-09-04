#include "player-input-manager.hpp"

#include "../services.hpp"

void PlayerInputManager::setManagedEntity(shared_ptr<Entity> entity) {
    this->managedEntity = entity;
}

void PlayerInputManager::tick(double dt) {
    //
}