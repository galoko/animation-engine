#include "world-manager.hpp"

#include <gtc/quaternion.hpp>
#include <gtx/transform.hpp>
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

    RenderHandle cubeModel = Render::requestMesh("cube");
    RenderHandle rockTexture = Render::requestTexture("rock.jpg");

    RenderHandle cubeHandle = Render::createRenderable(cubeModel, rockTexture);

    Transformation transform = Transformation(0, 0, 0.5, 1);
    shared_ptr<Graphics> cube = make_shared<Graphics>(cubeHandle, transform);
    graphicsComponent.add(cube);

    return character;
}

WorldManager::WorldManager() {
    //
}

void WorldManager::init() {
    shared_ptr<Entity> player = this->createCharacter();
    this->registry.get<GraphicsComponent>(player->handle).show();

    Services->cameraManager.orbit(player, 0.418879, 4.01426, 5, 0.5);
    Services->playerInputManager.setManagedEntity(player);

    this->addGround();
}

void WorldManager::tick(double dt) {
    auto view = registry.view<TransformComponent, GraphicsComponent>();
    for (auto [entity, transformComponent, graphicsComponent] : view.each()) {
        const Transformation &transform = transformComponent.transform;
        graphicsComponent.sync(transform);
    }
}

void WorldManager::addGround() {
    RenderHandle planeModel = Render::requestMesh("plane");
    RenderHandle grassTexture = Render::requestTexture("grass.jpg");

    RenderHandle ground = Render::createRenderable(planeModel, grassTexture);

    Transformation transform = Transformation(0, 0, 0, 0.05);
    Render::setTransform(ground, transform);

    Render::addRenderable(ground);
}