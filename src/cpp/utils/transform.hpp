#pragma once

using namespace glm;

#include <gtc/quaternion.hpp>
#include <gtx/quaternion.hpp>
#include <gtx/transform.hpp>
#include <mat4x4.hpp>
#include <vec3.hpp>

#pragma pack(push, 1)

class Transformation {
public:
    quat rotation;
    float scale;
    vec3 position;

    Transformation() : rotation(1, 0, 0, 0), scale(1), position(0) {
    }

    Transformation(float x, float y, float z, float scale) : rotation(1, 0, 0, 0), scale(scale), position(x, y, z) {
    }

    Transformation operator*(const Transformation &rhs) {
        Transformation result;

        result.rotation = this->rotation * rhs.rotation;
        result.position = this->position + rhs.position;
        result.scale = this->scale * rhs.scale;

        return result;
    }

    mat4 toMat4() {
        // TODO implement rotation
        return glm::scale(translate(glm::mat4(1), this->position), vec3(this->scale));
    }
};

#pragma pack(pop)