#include "world-manager.hpp"

#pragma GCC diagnostic ignored "-Wdeprecated-volatile"

#include <gtc/quaternion.hpp>
#include <gtx/transform.hpp>
#include <mat4x4.hpp>
#include <vec3.hpp>
#include <vec4.hpp>

#include "../ecs/components/components.hpp"
#include "../external-services/external-render.hpp"
#include "../services.hpp"

using namespace glm;

shared_ptr<Entity> WorldManager::createCharacter() {
    const shared_ptr<Entity> character = make_shared<Entity>();

    this->registry.emplace<TransformComponent>(character->handle);
    GraphicsComponent &graphicsComponent = this->registry.emplace<GraphicsComponent>(character->handle);

    mat4 transform = scale(translate(mat4(1), vec3(0, 0, 1)), vec3(1, 1, 2));
    shared_ptr<Graphics> capsule = make_shared<PrimitiveGraphics>(PrimitiveType::Capsule, vec4(1, 1, 1, 1), transform);
    graphicsComponent.add(capsule);

    return character;
}

WorldManager::WorldManager() {
    //
}

int f() {
    return 0;
}
int g() {
    return 1;
}

void WorldManager::init() {
    entt::sigh<int()> signal;
    entt::sink sink{signal};

    sink.connect<&f>();

    shared_ptr<Entity> player = this->createCharacter();
    this->registry.get<GraphicsComponent>(player->handle).show();

    Services->cameraManager.orbit(player, 0.418879, 4.01426, 5, 1);

    this->addGround();
}

void WorldManager::tick(double dt) {
    auto view = registry.view<TransformComponent, GraphicsComponent>();
    for (auto [entity, transformComponent, graphicsComponent] : view.each()) {
        const mat4 &transform = transformComponent.getTransform();
        graphicsComponent.sync(transform);
    }
}

void WorldManager::addGround() {
    RenderHandle ground = Render::createPrimitive(PrimitiveType::Plane);
    Render::setPrimitiveColor(ground, vec4(0, 0, 1, 1));
    mat4 transform = scale(translate(mat4(1), vec3(10, 0, 0)), vec3(10, 10, 1));
    Render::setTransform(ground, transform);
    Render::addEntity(ground);
}