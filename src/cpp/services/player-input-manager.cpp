#include "player-input-manager.hpp"

#include "../ecs/components/components.hpp"

#include "../services.hpp"

void PlayerInputManager::setManagedEntity(shared_ptr<Entity> entity) {
    this->managedEntity = entity;
}

void PlayerInputManager::tick(double dt) {
    TransformComponent &transform =
        Services->worldManager.registry.get<TransformComponent>(this->managedEntity->handle);

    float speed = 0.0;
    if (Services->inputManager.isPressed(
            {KeyboardKey::KEY_W, KeyboardKey::KEY_S, KeyboardKey::KEY_A,
             KeyboardKey::KEY_D /*, KeyboardKey::KEY_LCONTROL, KeyboardKey::KEY_LSHIFT*/})) {
        speed = 7.62 * 100 * 15;
    }

    float desiredAngle = Services->cameraManager.getZAngle();
    if (Services->inputManager.isPressed(KeyboardKey::KEY_A)) {
        desiredAngle -= Services->inputManager.isPressed(KeyboardKey::KEY_W)   ? PI / 4
                        : Services->inputManager.isPressed(KeyboardKey::KEY_S) ? -PI / 4
                                                                               : PI / 2;
    }
    if (Services->inputManager.isPressed(KeyboardKey::KEY_D)) {
        desiredAngle += Services->inputManager.isPressed(KeyboardKey::KEY_W)   ? PI / 4
                        : Services->inputManager.isPressed(KeyboardKey::KEY_S) ? -PI / 4
                                                                               : PI / 2;
    }
    if (Services->inputManager.isPressed(KeyboardKey::KEY_S)) {
        desiredAngle += PI;
    }

    quat q = quat(vec3(0, 0, -desiredAngle));
    vec3 velocity = q * vec3(-speed, 0, 0);

    transform.transform.position += velocity * vec3((float)dt);
}