#include "external-render.hpp"

#include "output-messages.hpp"

void Render::setCamera(vec3 pos, vec3 lookAt) {
    pushMessage(OutputMessageId::SET_CAMERA, SetCameraMessage(pos, lookAt));
}

RenderHandle Render::createPrimitive(PrimitiveType primitiveType) {
    MessageHandle handle = pushMessage(OutputMessageId::CREATE_PRIMITIVE, CreatePrimitiveMessage(primitiveType));
    return RenderHandle(handle);
}

void Render::setTransform(RenderHandle handle, mat4 transform) {
    pushMessage(OutputMessageId::SET_TRANSFORM, SetTransformMessage(handle.handle, transform));
}

void Render::setPrimitiveColor(RenderHandle handle, vec4 color) {
    pushMessage(OutputMessageId::SET_PRIMITIVE_COLOR, SetPrimitiveColorMessage(handle.handle, color));
}

void Render::setPrimitiveLineEnds(RenderHandle handle, vec3 start, vec3 end) {
    throw runtime_error("TODO");
}

void Render::setPrimitiveText(RenderHandle handle, const char *str) {
    throw runtime_error("TODO");
}

void Render::addEntity(RenderHandle handle) {
    pushMessage(OutputMessageId::ADD_ENTITY, AddEntityMessage(handle.handle));
}

void Render::removeEntity(RenderHandle handle) {
    throw runtime_error("TODO");
}