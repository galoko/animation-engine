#pragma once

#pragma GCC diagnostic ignored "-Wdeprecated-volatile"

#include <gtc/quaternion.hpp>
#include <gtx/quaternion.hpp>
#include <gtx/transform.hpp>
#include <mat4x4.hpp>
#include <vec3.hpp>
#include <vec4.hpp>

#include "../../external-services/external-render.hpp"

using namespace glm;

struct TransformComponent {
    vec3 position;
    vec3 scale;
    quat rotation;

    mat4 transform;
    bool changed;

    TransformComponent() : position(0), scale(1), rotation(1, 0, 0, 0), changed(false) {
    }

    const mat4 &getTransform() {
        this->transform =
            glm::translate(glm::toMat4(this->rotation) * glm::scale(mat4(1), this->scale), this->position);
        return this->transform;
    }
};

class Graphics {
public:
    virtual void sync(const mat4 &rootTransform) = 0;
    virtual void show() = 0;
    virtual void hide() = 0;

    virtual ~Graphics() {
    }
};

class PrimitiveGraphics : public Graphics {
private:
    RenderHandle handle;
    mat4 localTransform;

public:
    PrimitiveGraphics(PrimitiveType primitiveType, vec4 color, mat4 localTransform) : localTransform(localTransform) {
        this->handle = Render::createPrimitive(primitiveType);
        Render::setPrimitiveColor(this->handle, color);
    }

    virtual void sync(const mat4 &rootTransform) {
        mat4 transform = this->localTransform * rootTransform;
        Render::setTransform(this->handle, transform);
    }

    virtual void show() {
        Render::addEntity(this->handle);
    }

    virtual void hide() {
    }
};

struct GraphicsComponent {
    vector<shared_ptr<Graphics>> graphics;

    void sync(const mat4 &rootTransform) {
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