#include "mth.hpp"
#define _USE_MATH_DEFINES
#include <cmath>
#include <math.h>

using namespace std;

float Mth::SIN[SIN_VALUE_COUNT];

void Mth::initialize() {
    for (int32_t i = 0; i < SIN_VALUE_COUNT; ++i) {
        SIN[i] = (float)std::sin((double)i * M_PI * 2.0 / SIN_VALUE_COUNT);
    }
}

void Mth::finalize() {
    //
}
