#pragma once

#include <gtc/quaternion.hpp>
#include <gtx/quaternion.hpp>
#include <gtx/transform.hpp>
#include <vec3.hpp>
#include <vec4.hpp>

#include "../../external-services/external-render.hpp"
#include "../../utils/transform.hpp"

using namespace glm;

struct TransformComponent {
public:
    Transformation transform;

    TransformComponent() : transform() {
    }
};

class Graphics {
private:
    RenderHandle handle;
    Transformation localTransform;

public:
    Graphics(RenderHandle handle, const Transformation &localTransform)
        : handle(handle), localTransform(localTransform) {
    }

    void sync(const Transformation &rootTransform) {
        Transformation transform = this->localTransform * rootTransform;
        Render::setTransform(this->handle, transform);
    }

    void show() {
        // Render::addRenderable(this->handle);
    }

    void hide() {
    }
};

struct GraphicsComponent {
    vector<shared_ptr<Graphics>> graphics;

    void sync(const Transformation &rootTransform) {
        for (shared_ptr<Graphics> graphics : this->graphics) {
            graphics->sync(rootTransform);
        }
    }

    void show() {
        for (shared_ptr<Graphics> graphics : this->graphics) {
            graphics->show();
        }
    }

    void hide() {
        for (shared_ptr<Graphics> graphics : this->graphics) {
            graphics->hide();
        }
    }

    void add(shared_ptr<Graphics> graphics) {
        this->graphics.push_back(graphics);
    }
};