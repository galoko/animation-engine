#pragma once

#include "mat4x4.hpp"

#include "external-services.hpp"
#include "output-messages.hpp"

using namespace glm;

struct RenderHandle {
    MessageHandle handle;

    RenderHandle(MessageHandle handle) : handle(handle) {
    }
};

class Render {
public:
    static void setCamera(vec3 pos, vec3 lookAt);

    static RenderHandle createPrimitive(PrimitiveType primitiveType);

    static void setTransform(RenderHandle handle, mat4 transform);

    static void setPrimitiveColor(RenderHandle handle, vec4 color);
    static void setPrimitiveLineEnds(RenderHandle handle, vec3 start, vec3 end);
    static void setPrimitiveText(RenderHandle handle, const char *str);

    static void addEntity(RenderHandle handle);
    static void removeEntity(RenderHandle handle);
};