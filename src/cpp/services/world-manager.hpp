#pragma once

#include <memory>

#include "../ecs/entity.hpp"

using namespace std;

class WorldManager {
private:
    shared_ptr<Entity> createCharacter();

    void addGround();
    void addPillars();

    static constexpr double PI = 3.141592653589793238463;
    static constexpr double DEG_TO_RAD = PI / 180.0;

public:
    registry registry;

    WorldManager();

    void init();

    void tick(double dt);
};