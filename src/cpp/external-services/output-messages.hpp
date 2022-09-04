#pragma once

#include <mat4x4.hpp>
#include <vec3.hpp>
#include <vec4.hpp>

using namespace glm;

#pragma pack(push, 1)

struct SetCameraMessage {
    vec3 pos, lookAt;

    SetCameraMessage(vec3 pos, vec3 lookAt) : pos(pos), lookAt(lookAt) {
    }
};

enum class PrimitiveType
{
    Plane,
    Cube,
    Sphere,
    Capsule,
    Line,
    Text,
};

struct CreatePrimitiveMessage {
    uint32_t primitiveType;

    CreatePrimitiveMessage(PrimitiveType primitiveType) : primitiveType((uint32_t)primitiveType) {
    }
};

struct SetTransformMessage {
    MessageHandle handle;
    mat4 transform;

    SetTransformMessage(MessageHandle handle, mat4 transform) : handle(handle), transform(transform) {
    }
};

struct SetPrimitiveColorMessage {
    MessageHandle handle;
    vec4 color;

    SetPrimitiveColorMessage(MessageHandle handle, vec4 color) : handle(handle), color(color) {
    }
};

struct AddEntityMessage {
    MessageHandle handle;

    AddEntityMessage(MessageHandle handle) : handle(handle) {
    }
};

#pragma pack(pop)