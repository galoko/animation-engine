#pragma once

#include "external-services.hpp"
#include "output-messages.hpp"

#include "../utils/transform.hpp"

using namespace glm;

struct RenderHandle {
    MessageHandle handle;

    RenderHandle() : handle(NULL_HANDLE) {
    }

    RenderHandle(MessageHandle handle) : handle(handle) {
    }

    bool isNull() {
        return this->handle != NULL_HANDLE;
    }
};

class Render {
public:
    static void setCamera(vec3 pos, vec3 lookAt);

    static RenderHandle createRenderable(RenderHandle mesh, RenderHandle texture);

    static void setTransform(RenderHandle handle, const Transformation &transform);

    static void addRenderable(RenderHandle handle);
    static void removeRenderable(RenderHandle handle);

    static RenderHandle requestTexture(string texName);
    static RenderHandle requestMesh(string meshName);

    static RenderHandle generateOneColorTexture(vec4 color);
};