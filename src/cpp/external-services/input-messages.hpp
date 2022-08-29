#pragma once

#include <cstdint>

#pragma pack(push, 1)

struct KeyboardMessage {
    uint32_t key;
};

struct MouseMessage {
    uint32_t button;
    float x, y, dx, dy;
    uint32_t isCaptured;
};

#pragma pack(pop)