#pragma once

#include <functional>
#include <stdint.h>

constexpr int32_t MULTIPLY_DE_BRUIJN_BIT_POSITION[] = {0,  1,  28, 2,  29, 14, 24, 3, 30, 22, 20, 15, 25, 17, 4,  8,
                                                       31, 27, 13, 23, 21, 19, 16, 7, 26, 12, 18, 6,  11, 5,  10, 9};

using IntPredicate = std::function<bool(int32_t)>;

#define ushr_l(value, bits) ((int64_t)((uint64_t)value >> bits))

namespace Mth {
    int8_t clamp(int8_t value, int8_t min, int8_t max) {
        if (value < min) {
            return min;
        } else {
            return value > max ? max : value;
        }
    }

    int32_t clamp(int32_t value, int32_t min, int32_t max) {
        if (value < min) {
            return min;
        } else {
            return value > max ? max : value;
        }
    }

    int64_t clamp(int64_t value, int64_t min, int64_t max) {
        if (value < min) {
            return min;
        } else {
            return value > max ? max : value;
        }
    }

    float clamp(float value, float min, float max) {
        if (value < min) {
            return min;
        } else {
            return value > max ? max : value;
        }
    }

    double clamp(double value, double min, double max) {
        if (value < min) {
            return min;
        } else {
            return value > max ? max : value;
        }
    }

    int32_t binarySearch(int32_t startIndex, int32_t endIndex, IntPredicate predicate) {
        int32_t i = endIndex - startIndex;

        while (i > 0) {
            int32_t j = i / 2;
            int32_t k = startIndex + j;
            if (predicate(k)) {
                i = j;
            } else {
                startIndex = k + 1;
                i -= j + 1;
            }
        }

        return startIndex;
    }

    float lerp(float t, float v0, float v1) {
        return v0 + t * (v1 - v0);
    }

    double lerp(double t, double v0, double v1) {
        return v0 + t * (v1 - v0);
    }

    double lerp2(double xt, double yt, double x0, double x1, double y0, double y1) {
        return lerp(yt, lerp(xt, x0, x1), lerp(xt, y0, y1));
    }

    double lerp3(double xt, double yt, double zt, double x0, double x1, double y0, double y1, double x2, double x3,
                 double y2, double y3) {
        return lerp(zt, lerp2(xt, yt, x0, x1, y0, y1), lerp2(xt, yt, x2, x3, y2, y3));
    }

    double smoothstep(double value) {
        return value * value * value * (value * (value * 6.0 - 15.0) + 10.0);
    }

    double smoothstepDerivative(double value) {
        return 30.0 * value * value * (value - 1.0) * (value - 1.0);
    }

    constexpr float square(float value) {
        return value * value;
    }

    constexpr double square(double value) {
        return value * value;
    }

    constexpr int32_t square(int32_t value) {
        return value * value;
    }

    constexpr int64_t square(int64_t value) {
        return value * value;
    }

    constexpr int64_t getSeed(int32_t x, int32_t y, int32_t z) {
        int64_t seed = (int64_t)(x * 3129871) ^ (int64_t)z * 116129781LL ^ (int64_t)y;
        seed = seed * seed * 42317861LL + seed * 11LL;
        return seed >> 16;
    }

    int32_t floor(float value) {
        int32_t result = (int32_t)value;
        return value < (float)result ? result - 1 : result;
    }

    int32_t fastFloor(double value) {
        return (int32_t)(value + 1024.0) - 1024;
    }

    int32_t floor(double value) {
        int32_t result = (int32_t)value;
        return value < (double)result ? result - 1 : result;
    }

    int64_t lfloor(double value) {
        int64_t result = (int64_t)value;
        return value < (double)result ? result - 1LL : result;
    }

    int32_t floorDiv(int32_t x, int32_t y) {
        int32_t r = x / y;
        // if the signs are different and modulo not zero, round down
        if ((x ^ y) < 0 && (r * y != x)) {
            r--;
        }
        return r;
    }

    int32_t intFloorDiv(int32_t x, int32_t y) {
        return floorDiv(x, y);
    }

    double clampedLerp(double v0, double v1, double t) {
        if (t < 0.0) {
            return v0;
        } else {
            return t > 1.0 ? v1 : lerp(t, v0, v1);
        }
    }

    float clampedLerp(float v0, float v1, float t) {
        if (t < 0.0F) {
            return v0;
        } else {
            return t > 1.0F ? v1 : lerp(t, v0, v1);
        }
    }

    float frac(float value) {
        return value - (float)floor(value);
    }

    double frac(double value) {
        return value - (double)lfloor(value);
    }

    constexpr int32_t smallestEncompassingPowerOfTwo(int32_t value) {
        int32_t result = value - 1;
        result |= result >> 1;
        result |= result >> 2;
        result |= result >> 4;
        result |= result >> 8;
        result |= result >> 16;
        return result + 1;
    }

    constexpr bool isPowerOfTwo(int32_t num) {
        return num != 0 && (num & num - 1) == 0;
    }

    constexpr int32_t ceillog2(int32_t num) {
        num = isPowerOfTwo(num) ? num : smallestEncompassingPowerOfTwo(num);
        return MULTIPLY_DE_BRUIJN_BIT_POSITION[(int32_t)((int64_t)num * 125613361LL >> 27) & 31];
    }

    constexpr int32_t log2(int32_t num) {
        return ceillog2(num) - (isPowerOfTwo(num) ? 0 : 1);
    }

    double inverseLerp(double v, double v0, double v1) {
        return (v - v0) / (v1 - v0);
    }

    float inverseLerp(float v, float v0, float v1) {
        return (v - v0) / (v1 - v0);
    }

    double clampedMap(double v, double v0, double v1, double mv0, double mv1) {
        return clampedLerp(mv0, mv1, inverseLerp(v, v0, v1));
    }

    float clampedMap(float v, float v0, float v1, float mv0, float mv1) {
        return clampedLerp(mv0, mv1, inverseLerp(v, v0, v1));
    }

    double map(double v, double v0, double v1, double mv0, double mv1) {
        return lerp(inverseLerp(v, v0, v1), mv0, mv1);
    }

    float map(float v, float v0, float v1, float mv0, float mv1) {
        return lerp(inverseLerp(v, v0, v1), mv0, mv1);
    }

    int32_t quantize(double value, int32_t quantizer) {
        return floor(value / (double)quantizer) * quantizer;
    }

    int32_t floorMod(int32_t x, int32_t y) {
        int32_t mod = x % y;
        // if the signs are different and modulo not zero, adjust result
        if ((mod ^ y) < 0 && mod != 0) {
            mod += y;
        }
        return mod;
    }

    namespace Detail {
        double constexpr sqrtNewtonRaphson(double x, double curr, double prev) {
            return curr == prev ? curr : sqrtNewtonRaphson(x, 0.5 * (curr + x / curr), curr);
        }
    } // namespace Detail

    double constexpr c_sqrt(double x) {
        return x >= 0 && x < std::numeric_limits<double>::infinity() ? Detail::sqrtNewtonRaphson(x, x, 0)
                                                                     : std::numeric_limits<double>::quiet_NaN();
    }
} // namespace Mth