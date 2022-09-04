#pragma once

#include <entt/entt.hpp>

using namespace entt;

struct Entity {
    entity handle;
    Entity();
    ~Entity();
};