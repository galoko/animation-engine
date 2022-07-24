#pragma once

#include <memory>

#include "../mth.hpp"
#include "../random.hpp"

using namespace std;

class SimplexNoise {
public:
    static constexpr int32_t GRADIENT[][3] = {{1, 1, 0},  {-1, 1, 0},  {1, -1, 0}, {-1, -1, 0}, {1, 0, 1},  {-1, 0, 1},
                                              {1, 0, -1}, {-1, 0, -1}, {0, 1, 1},  {0, -1, 1},  {0, 1, -1}, {0, -1, -1},
                                              {1, 1, 0},  {0, -1, 1},  {-1, 1, 0}, {0, -1, -1}};

private:
    static constexpr double SQRT_3 = Mth::c_sqrt(3.0);
    static constexpr double F2 = 0.5 * (SQRT_3 - 1.0);
    static constexpr double G2 = (3.0 - SQRT_3) / 6.0;

    int32_t _p[512];

public:
    double xo, yo, zo;

    SimplexNoise() {
    }

    SimplexNoise(shared_ptr<RandomSource> randomSource);

    static double dot(const int32_t v[], double x, double y, double z);

private:
    int32_t p(int32_t index);

    double getCornerNoise3D(int32_t gradintIndex, double x, double y, double z, double maxLengthSq);

public:
    double getValue(double x, double y);
    double getValue(double x, double y, double z);
};