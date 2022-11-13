#include "external-render.hpp"

#include "output-messages.hpp"

void Render::setCamera(vec3 pos, vec3 lookAt) {
    pushMessage(OutputMessageId::SET_CAMERA, SetCameraMessage(pos, lookAt));
}

RenderHandle Render::createRenderable(RenderHandle mesh, RenderHandle texture) {
    MessageHandle handle =
        pushMessage(OutputMessageId::CREATE_RENDERABLE, CreateRenderableMessage(mesh.handle, texture.handle));
    return RenderHandle(handle);
}

void Render::setTransform(RenderHandle handle, const Transformation &transform) {
    pushMessage(OutputMessageId::SET_TRANSFORM, SetTransformMessage(handle.handle, transform));
}

void Render::addRenderable(RenderHandle handle) {
    pushMessage(OutputMessageId::ADD_RENDERABLE, AddRenderableMessage(handle.handle));
}

void Render::removeRenderable(RenderHandle handle) {
    throw runtime_error("TODO");
}

RenderHandle Render::requestTexture(string texName) {
    MessageHandle handle = pushMessage(OutputMessageId::REQUEST_TEXTURE, RequestTextureMessage(texName));
    return RenderHandle(handle);
}

RenderHandle Render::requestMesh(string meshName) {
    MessageHandle handle = pushMessage(OutputMessageId::REQUEST_MESH, RequestMeshMessage(meshName));
    return RenderHandle(handle);
}

RenderHandle Render::generateOneColorTexture(vec4 color) {
    MessageHandle handle =
        pushMessage(OutputMessageId::GENERATE_ONE_COLOR_TEXTURE, GenerateOneColorTextureMessage(color));
    return RenderHandle(handle);
}