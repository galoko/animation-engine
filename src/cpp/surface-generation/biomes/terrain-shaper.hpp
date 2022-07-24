#pragma once

#include <algorithm>

#include "cubic-spline.hpp"
#include "terrain-shaper.hpp"

using namespace std;

class TerrainShaper {
private:
    enum Coordinate
    {
        CONTINENTS,
        EROSION,
        WEIRDNESS,
        RIDGES
    };

public:
    class Point {
    public:
        float continents, erosion, ridges, weirdness;
        Point(float continents, float erosion, float ridges, float weirdness);
    };

    static constexpr ToFloatFunction<Point const &> CoordinateGetters[] = {
        [](Point const &value) { return value.continents; }, [](Point const &value) { return value.erosion; },
        [](Point const &value) { return value.ridges; }, [](Point const &value) { return value.weirdness; }};

private:
    static constexpr float GLOBAL_OFFSET = -0.50375F;
    static constexpr ToFloatFunction<float> NO_TRANSFORM = [](float const &value) { return value; };

    shared_ptr<CubicSpline<Point>> _offsetSampler;
    shared_ptr<CubicSpline<Point>> _factorSampler;
    shared_ptr<CubicSpline<Point>> _jaggednessSampler;

public:
    TerrainShaper(shared_ptr<CubicSpline<Point>> offsetSampler, shared_ptr<CubicSpline<Point>> factorSampler,
                  shared_ptr<CubicSpline<Point>> jaggednessSampler);

private:
    static constexpr inline float getAmplifiedOffset(float const &value) {
        return value < 0.0F ? value : value * 2.0F;
    }

    static constexpr inline float getAmplifiedFactor(float const &value) {
        return 1.25F - 6.25F / (value + 5.0F);
    }

    static constexpr inline float getAmplifiedJaggedness(float const &value) {
        return value * 2.0F;
    }

public:
    static TerrainShaper overworld(bool isAmplified);

private:
    static shared_ptr<CubicSpline<Point>> buildErosionJaggednessSpline(float p_187295_, float p_187296_,
                                                                       float p_187297_, float p_187298_,
                                                                       ToFloatFunction<float> p_187299_);

    static shared_ptr<CubicSpline<Point>> buildRidgeJaggednessSpline(float weirdness1, float weirdness0,
                                                                     ToFloatFunction<float> transformer);

    static shared_ptr<CubicSpline<Point>> buildWeirdnessJaggednessSpline(float wierdness,
                                                                         ToFloatFunction<float> transformer);

    static shared_ptr<CubicSpline<Point>> getErosionFactor(float p_187308_, bool p_187309_,
                                                           ToFloatFunction<float> transformer);

    static constexpr inline float calculateSlope(float p_187272_, float p_187273_, float p_187274_, float p_187275_) {
        return (p_187273_ - p_187272_) / (p_187275_ - p_187274_);
    }

    static shared_ptr<CubicSpline<Point>> buildMountainRidgeSplineWithPoints(float p_187331_, bool p_187332_,
                                                                             ToFloatFunction<float> p_187333_);

    static constexpr inline float mountainContinentalness(float p_187327_, float p_187328_, float p_187329_) {
        float f2 = 1.0F - (1.0F - p_187328_) * 0.5F;
        float f3 = 0.5F * (1.0F - p_187328_);
        float f4 = (p_187327_ + 1.17F) * 0.46082947F;
        float f5 = f4 * f2 - f3;
        return p_187327_ < p_187329_ ? max(f5, -0.2222F) : max(f5, 0.0F);
    }

    static constexpr inline float calculateMountainRidgeZeroContinentalnessPoint(float p_187344_) {
        float f2 = 1.0F - (1.0F - p_187344_) * 0.5F;
        float f3 = 0.5F * (1.0F - p_187344_);
        return f3 / (0.46082947F * f2) - 1.17F;
    }

    static shared_ptr<CubicSpline<Point>> buildErosionOffsetSpline(float p_187285_, float p_187286_, float p_187287_,
                                                                   float p_187288_, float p_187289_, float p_187290_,
                                                                   bool p_187291_, bool p_187292_,
                                                                   ToFloatFunction<float> p_187293_);

    static shared_ptr<CubicSpline<Point>> ridgeSpline(float p_187277_, float p_187278_, float p_187279_,
                                                      float p_187280_, float p_187281_, float p_187282_,
                                                      ToFloatFunction<float> p_187283_);

public:
    shared_ptr<CubicSpline<Point>> offsetSampler();
    shared_ptr<CubicSpline<Point>> factorSampler();
    shared_ptr<CubicSpline<Point>> jaggednessSampler();

    float offset(Point const &value) const;
    float factor(Point const &value) const;
    float jaggedness(Point const &value) const;

    Point const makePoint(float continents, float erosion, float weirdness) const;

    static constexpr inline float peaksAndValleys(float weirdness) {
        return -(Mth::c_abs(Mth::c_abs(weirdness) - 0.6666667F) - 0.33333334F) * 3.0F;
    }
};

class TerrainProvider {
public:
    static TerrainShaper overworld(bool isAmplified);
    static TerrainShaper caves();
    static TerrainShaper floatingIslands();
    static TerrainShaper nether();
    static TerrainShaper end();
};