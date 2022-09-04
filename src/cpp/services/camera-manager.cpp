#include "camera-manager.hpp"

#include <algorithm>

#include "../ecs/components/components.hpp"
#include "../services.hpp"

using namespace std;

CameraManager::CameraManager() {
}

void CameraManager::init() {
    Services->inputManager.mouseEvent.connect<&CameraManager::onMouseEvent>(this);
}

void CameraManager::onMouseEvent(const MouseMessage &msg) {
    float dx = msg.dx;
    float dy = msg.dy;
    bool isLocked = !!msg.isCaptured;

    if (this->orbitCamera.entityToOrbit != nullptr && isLocked) {
        const float ROTATION_SPEED = 0.1 * CameraManager::DEG_TO_RAD;
        const float e = 10e-3;

        this->orbitCamera.zAngle = fmod(this->orbitCamera.zAngle + dx * ROTATION_SPEED, (float)(PI * 2));
        this->orbitCamera.yAngle = std::max(
            (float)(-PI / 2 + e), std::min(this->orbitCamera.yAngle + dy * ROTATION_SPEED, (float)(PI / 2 - e)));
    }
}

void CameraManager::orbit(shared_ptr<Entity> entity, float yAngle, float zAngle, float distance, float height) {
    this->orbitCamera.entityToOrbit = entity;
    this->orbitCamera.yAngle = yAngle;
    this->orbitCamera.zAngle = zAngle;
    this->orbitCamera.distance = distance;
    this->orbitCamera.height = height;
}

void CameraManager::tick(double dt) {
    if (this->orbitCamera.entityToOrbit != nullptr) {
        this->applyOrbit();
    }
}

void CameraManager::applyOrbit() {
    const TransformComponent &transform =
        Services->worldManager.registry.get<TransformComponent>(this->orbitCamera.entityToOrbit->handle);

    vec3 center = vec3(transform.transform * vec4(0, 0, this->orbitCamera.height, 0));

    quat q = quat(vec3(0, -this->orbitCamera.yAngle, -this->orbitCamera.zAngle));

    vec3 eye = center + (q * vec3(this->orbitCamera.distance, 0, 0));

    Render::setCamera(eye, center);
}
