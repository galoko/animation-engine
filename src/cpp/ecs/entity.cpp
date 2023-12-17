#include "entity.hpp"

#include "../services.hpp"

Entity::Entity() {
    this->handle = Services->worldManager.registry.create();
}

Entity::~Entity() {
    if (Services) {
        Services->worldManager.registry.destroy(this->handle);
    }
}