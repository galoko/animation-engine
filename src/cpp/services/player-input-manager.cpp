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
    vec3 direction(0, 0, 0);
    if (Services->inputManager.isPressed(
            {KeyboardKey::KEY_W, KeyboardKey::KEY_S, KeyboardKey::KEY_A, KeyboardKey::KEY_D})) {
        speed = 5.2 * 100 * 1;
        direction.x = -1;
    }

    float desiredAngleZ = Services->cameraManager.getZAngle();
    if (Services->inputManager.isPressed(KeyboardKey::KEY_A)) {
        desiredAngleZ -= Services->inputManager.isPressed(KeyboardKey::KEY_W)   ? PI / 4
                         : Services->inputManager.isPressed(KeyboardKey::KEY_S) ? -PI / 4
                                                                                : PI / 2;
    }
    if (Services->inputManager.isPressed(KeyboardKey::KEY_D)) {
        desiredAngleZ += Services->inputManager.isPressed(KeyboardKey::KEY_W)   ? PI / 4
                         : Services->inputManager.isPressed(KeyboardKey::KEY_S) ? -PI / 4
                                                                                : PI / 2;
    }
    if (Services->inputManager.isPressed(KeyboardKey::KEY_S)) {
        desiredAngleZ += PI;
    }

    if (Services->inputManager.isPressed(KeyboardKey::KEY_LSHIFT)) {
        direction.z = -1;
        speed = 5.2 * 100 * 1;
    }
    if (Services->inputManager.isPressed(KeyboardKey::KEY_SPACE)) {
        direction.z = 1;
        speed = 5.2 * 100 * 1;
    }

    if (speed > 0) {
        quat q = quat(vec3(0, 0, -desiredAngleZ));
        vec3 velocity = q * (normalize(direction) * speed);

        transform.transform.position += velocity * vec3((float)dt);
    }
}