#pragma once

#include <memory>

#include <gtc/quaternion.hpp>
#include <gtx/quaternion.hpp>
#include <vec4.hpp>

#include "../ecs/entity.hpp"

using namespace std;
using namespace glm;

class PlayerInputManager {
private:
    shared_ptr<Entity> managedEntity;

    static constexpr double PI = 3.141592653589793238463;

public:
    void setManagedEntity(shared_ptr<Entity> entity);

    void tick(double dt);
};