#pragma once

#include <entt/entt.hpp>
#include <memory>

#include "../ecs/entity.hpp"
#include "../external-services/input-messages.hpp"

using namespace entt;
using namespace std;

namespace {
    struct OrbitCamera {
        shared_ptr<Entity> entityToOrbit;
        float yAngle;
        float zAngle;
        float distance;
        float height;
    };
} // namespace

class CameraManager {
private:
    OrbitCamera orbitCamera;

    void applyOrbit();

    static constexpr double PI = 3.141592653589793238463;
    static constexpr double DEG_TO_RAD = PI / 180.0;

    void onMouseEvent(const MouseMessage &msg);

public:
    CameraManager();

    void initialize();
    void tick(double dt);

    void orbit(shared_ptr<Entity> entity, float yAngle, float zAngle, float distance, float height);

    float getZAngle();
};