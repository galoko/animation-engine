#pragma once

#include <vec3.hpp>
#include <vec4.hpp>

#include "../utils/transform.hpp"

using namespace glm;

#pragma pack(push, 1)

struct SetCameraMessage {
    vec3 pos, lookAt;

    SetCameraMessage(vec3 pos, vec3 lookAt) : pos(pos), lookAt(lookAt) {
    }
};

struct CreateRenderableMessage {
    MessageHandle meshHandle, textureHandle;

    CreateRenderableMessage(MessageHandle meshHandle, MessageHandle textureHandle)
        : meshHandle(meshHandle), textureHandle(textureHandle) {
    }
};

struct SetTransformMessage {
    MessageHandle handle;
    Transformation transform;

    SetTransformMessage(MessageHandle handle, const Transformation &transform) : handle(handle), transform(transform) {
    }
};

struct AddRenderableMessage {
    MessageHandle handle;

    AddRenderableMessage(MessageHandle handle) : handle(handle) {
    }
};

#define MAX_NAME_LENGTH 64

struct RequestMeshMessage {
    char meshName[MAX_NAME_LENGTH];

    RequestMeshMessage(string meshName) {
        size_t length = std::min(meshName.length(), (size_t)MAX_NAME_LENGTH - 1);
        memcpy(this->meshName, meshName.c_str(), length);
        this->meshName[length] = 0;
    }
};

struct CreateGeneratedMeshMessage {
    uint32_t vertexCount;
    uint32_t indexCount;
    void *data;

    CreateGeneratedMeshMessage(uint32_t vertexCount, uint32_t indexCount, void *data)
        : vertexCount(vertexCount), indexCount(indexCount), data(data) {
    }
};

struct RequestTextureMessage {
    char texName[MAX_NAME_LENGTH];

    RequestTextureMessage(string texName) {
        size_t length = std::min(texName.length(), (size_t)MAX_NAME_LENGTH - 1);
        memcpy(this->texName, texName.c_str(), length);
        this->texName[length] = 0;
    }
};

struct GenerateOneColorTextureMessage {
    vec4 color;

    GenerateOneColorTextureMessage(vec4 color) : color(color) {
    }
};

#pragma pack(pop)