#pragma once

#include <memory>

#include "../ecs/entity.hpp"

using namespace std;

class PlayerInputManager {
private:
    shared_ptr<Entity> managedEntity;

public:
    void setManagedEntity(shared_ptr<Entity> entity);

    void tick(double dt);
};