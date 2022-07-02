#pragma once

#include <algorithm>

#include "cubic-spline.hpp"

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
        Point(float continents, float erosion, float ridges, float weirdness) {
            this->continents = continents;
            this->erosion = erosion;
            this->ridges = ridges;
            this->weirdness = weirdness;
        }
    };

    static constexpr ToFloatFunction<Point *> CoordinateGetters[] = {
        [](TerrainShaper::Point *value) { return value->continents; },
        [](TerrainShaper::Point *value) { return value->erosion; },
        [](TerrainShaper::Point *value) { return value->ridges; },
        [](TerrainShaper::Point *value) { return value->weirdness; }};

private:
    static constexpr float GLOBAL_OFFSET = -0.50375F;
    static constexpr ToFloatFunction<float> NO_TRANSFORM = [](float value) { return value; };
    CubicSpline<TerrainShaper::Point *> *_offsetSampler;
    CubicSpline<TerrainShaper::Point *> *_factorSampler;
    CubicSpline<TerrainShaper::Point *> *_jaggednessSampler;

public:
    TerrainShaper(CubicSpline<TerrainShaper::Point *> *offsetSampler,
                  CubicSpline<TerrainShaper::Point *> *factorSampler,
                  CubicSpline<TerrainShaper::Point *> *jaggednessSampler) {
        this->_offsetSampler = offsetSampler;
        this->_factorSampler = factorSampler;
        this->_jaggednessSampler = jaggednessSampler;
    }

private:
    static float getAmplifiedOffset(float value) {
        return value < 0.0F ? value : value * 2.0F;
    }

    static float getAmplifiedFactor(float value) {
        return 1.25F - 6.25F / (value + 5.0F);
    }

    static float getAmplifiedJaggedness(float value) {
        return value * 2.0F;
    }

public:
    static TerrainShaper *overworld(bool isAmplified) {
        ToFloatFunction<float> offsetTransformer = isAmplified ? TerrainShaper::getAmplifiedOffset : NO_TRANSFORM;
        ToFloatFunction<float> factorTransformer = isAmplified ? TerrainShaper::getAmplifiedFactor : NO_TRANSFORM;
        ToFloatFunction<float> jaggednessTransformer =
            isAmplified ? TerrainShaper::getAmplifiedJaggedness : NO_TRANSFORM;
        CubicSpline<TerrainShaper::Point *> *erosionOffset1 =
            buildErosionOffsetSpline(-0.15F, 0.0F, 0.0F, 0.1F, 0.0F, -0.03F, false, false, offsetTransformer);
        CubicSpline<TerrainShaper::Point *> *erosionOffset2 =
            buildErosionOffsetSpline(-0.1F, 0.03F, 0.1F, 0.1F, 0.01F, -0.03F, false, false, offsetTransformer);
        CubicSpline<TerrainShaper::Point *> *erosionOffset3 =
            buildErosionOffsetSpline(-0.1F, 0.03F, 0.1F, 0.7F, 0.01F, -0.03F, true, true, offsetTransformer);
        CubicSpline<TerrainShaper::Point *> *erosionOffset4 =
            buildErosionOffsetSpline(-0.05F, 0.03F, 0.1F, 1.0F, 0.01F, 0.01F, true, true, offsetTransformer);
        CubicSpline<TerrainShaper::Point *> *offsetSampler =
            CubicSpline<Point *>::builder(CoordinateGetters[CONTINENTS], offsetTransformer)
                ->addPoint(-1.1F, 0.044F, 0.0F)
                ->addPoint(-1.02F, -0.2222F, 0.0F)
                ->addPoint(-0.51F, -0.2222F, 0.0F)
                ->addPoint(-0.44F, -0.12F, 0.0F)
                ->addPoint(-0.18F, -0.12F, 0.0F)
                ->addPoint(-0.16F, erosionOffset1, 0.0F)
                ->addPoint(-0.15F, erosionOffset1, 0.0F)
                ->addPoint(-0.1F, erosionOffset2, 0.0F)
                ->addPoint(0.25F, erosionOffset3, 0.0F)
                ->addPoint(1.0F, erosionOffset4, 0.0F)
                ->build();
        CubicSpline<TerrainShaper::Point *> *factorSampler =
            CubicSpline<Point *>::builder(CoordinateGetters[CONTINENTS], NO_TRANSFORM)
                ->addPoint(-0.19F, 3.95F, 0.0F)
                ->addPoint(-0.15F, getErosionFactor(6.25F, true, NO_TRANSFORM), 0.0F)
                ->addPoint(-0.1F, getErosionFactor(5.47F, true, factorTransformer), 0.0F)
                ->addPoint(0.03F, getErosionFactor(5.08F, true, factorTransformer), 0.0F)
                ->addPoint(0.06F, getErosionFactor(4.69F, false, factorTransformer), 0.0F)
                ->build();
        CubicSpline<TerrainShaper::Point *> *jaggednessSampler =
            CubicSpline<Point *>::builder(CoordinateGetters[CONTINENTS], jaggednessTransformer)
                ->addPoint(-0.11F, 0.0F, 0.0F)
                ->addPoint(0.03F, buildErosionJaggednessSpline(1.0F, 0.5F, 0.0F, 0.0F, jaggednessTransformer), 0.0F)
                ->addPoint(0.65F, buildErosionJaggednessSpline(1.0F, 1.0F, 1.0F, 0.0F, jaggednessTransformer), 0.0F)
                ->build();
        return new TerrainShaper(offsetSampler, factorSampler, jaggednessSampler);
    }

private:
    static CubicSpline<TerrainShaper::Point *> *buildErosionJaggednessSpline(float p_187295_, float p_187296_,
                                                                             float p_187297_, float p_187298_,
                                                                             ToFloatFunction<float> p_187299_) {
        CubicSpline<TerrainShaper::Point *> *cubicspline = buildRidgeJaggednessSpline(p_187295_, p_187297_, p_187299_);
        CubicSpline<TerrainShaper::Point *> *cubicspline1 = buildRidgeJaggednessSpline(p_187296_, p_187298_, p_187299_);
        return CubicSpline<Point *>::builder(CoordinateGetters[EROSION], p_187299_)
            ->addPoint(-1.0F, cubicspline, 0.0F)
            ->addPoint(-0.78F, cubicspline1, 0.0F)
            ->addPoint(-0.5775F, cubicspline1, 0.0F)
            ->addPoint(-0.375F, 0.0F, 0.0F)
            ->build();
    }

    static CubicSpline<TerrainShaper::Point *> *buildRidgeJaggednessSpline(float p_187301_, float p_187302_,
                                                                           ToFloatFunction<float> p_187303_) {
        float f = peaksAndValleys(0.4F);
        float f1 = peaksAndValleys(0.56666666F);
        float f2 = (f + f1) / 2.0F;
        CubicSpline<Point *>::Builder *builder = CubicSpline<Point *>::builder(CoordinateGetters[RIDGES], p_187303_);
        builder->addPoint(f, 0.0F, 0.0F);
        if (p_187302_ > 0.0F) {
            builder->addPoint(f2, buildWeirdnessJaggednessSpline(p_187302_, p_187303_), 0.0F);
        } else {
            builder->addPoint(f2, 0.0F, 0.0F);
        }

        if (p_187301_ > 0.0F) {
            builder->addPoint(1.0F, buildWeirdnessJaggednessSpline(p_187301_, p_187303_), 0.0F);
        } else {
            builder->addPoint(1.0F, 0.0F, 0.0F);
        }

        return builder->build();
    }

    static CubicSpline<TerrainShaper::Point *> *buildWeirdnessJaggednessSpline(float p_187305_,
                                                                               ToFloatFunction<float> p_187306_) {
        float f = 0.63F * p_187305_;
        float f1 = 0.3F * p_187305_;
        return CubicSpline<Point *>::builder(CoordinateGetters[WEIRDNESS], p_187306_)
            ->addPoint(-0.01F, f, 0.0F)
            ->addPoint(0.01F, f1, 0.0F)
            ->build();
    }

    static CubicSpline<TerrainShaper::Point *> *getErosionFactor(float p_187308_, bool p_187309_,
                                                                 ToFloatFunction<float> p_187310_) {
        CubicSpline<TerrainShaper::Point *> *cubicspline =
            CubicSpline<Point *>::builder(CoordinateGetters[WEIRDNESS], p_187310_)
                ->addPoint(-0.2F, 6.3F, 0.0F)
                ->addPoint(0.2F, p_187308_, 0.0F)
                ->build();
        CubicSpline<Point *>::Builder *builder =
            CubicSpline<Point *>::builder(CoordinateGetters[EROSION], p_187310_)
                ->addPoint(-0.6F, cubicspline, 0.0F)
                ->addPoint(-0.5F,
                           CubicSpline<Point *>::builder(CoordinateGetters[WEIRDNESS], p_187310_)
                               ->addPoint(-0.05F, 6.3F, 0.0F)
                               ->addPoint(0.05F, 2.67F, 0.0F)
                               ->build(),
                           0.0F)
                ->addPoint(-0.35F, cubicspline, 0.0F)
                ->addPoint(-0.25F, cubicspline, 0.0F)
                ->addPoint(-0.1F,
                           CubicSpline<Point *>::builder(CoordinateGetters[WEIRDNESS], p_187310_)
                               ->addPoint(-0.05F, 2.67F, 0.0F)
                               ->addPoint(0.05F, 6.3F, 0.0F)
                               ->build(),
                           0.0F)
                ->addPoint(0.03F, cubicspline, 0.0F);
        if (p_187309_) {
            CubicSpline<TerrainShaper::Point *> *cubicspline1 =
                CubicSpline<Point *>::builder(CoordinateGetters[WEIRDNESS], p_187310_)
                    ->addPoint(0.0F, p_187308_, 0.0F)
                    ->addPoint(0.1F, 0.625F, 0.0F)
                    ->build();
            CubicSpline<TerrainShaper::Point *> *cubicspline2 =
                CubicSpline<Point *>::builder(CoordinateGetters[RIDGES], p_187310_)
                    ->addPoint(-0.9F, p_187308_, 0.0F)
                    ->addPoint(-0.69F, cubicspline1, 0.0F)
                    ->build();
            builder->addPoint(0.35F, p_187308_, 0.0F)
                ->addPoint(0.45F, cubicspline2, 0.0F)
                ->addPoint(0.55F, cubicspline2, 0.0F)
                ->addPoint(0.62F, p_187308_, 0.0F);
        } else {
            CubicSpline<TerrainShaper::Point *> *cubicspline3 =
                CubicSpline<Point *>::builder(CoordinateGetters[RIDGES], p_187310_)
                    ->addPoint(-0.7F, cubicspline, 0.0F)
                    ->addPoint(-0.15F, 1.37F, 0.0F)
                    ->build();
            CubicSpline<TerrainShaper::Point *> *cubicspline4 =
                CubicSpline<Point *>::builder(CoordinateGetters[RIDGES], p_187310_)
                    ->addPoint(0.45F, cubicspline, 0.0F)
                    ->addPoint(0.7F, 1.56F, 0.0F)
                    ->build();
            builder->addPoint(0.05F, cubicspline4, 0.0F)
                ->addPoint(0.4F, cubicspline4, 0.0F)
                ->addPoint(0.45F, cubicspline3, 0.0F)
                ->addPoint(0.55F, cubicspline3, 0.0F)
                ->addPoint(0.58F, p_187308_, 0.0F);
        }

        return builder->build();
    }

    static float calculateSlope(float p_187272_, float p_187273_, float p_187274_, float p_187275_) {
        return (p_187273_ - p_187272_) / (p_187275_ - p_187274_);
    }

    static CubicSpline<TerrainShaper::Point *> *buildMountainRidgeSplineWithPoints(float p_187331_, bool p_187332_,
                                                                                   ToFloatFunction<float> p_187333_) {
        CubicSpline<Point *>::Builder *builder = CubicSpline<Point *>::builder(CoordinateGetters[RIDGES], p_187333_);
        float f2 = mountainContinentalness(-1.0F, p_187331_, -0.7F);
        float f4 = mountainContinentalness(1.0F, p_187331_, -0.7F);
        float f5 = calculateMountainRidgeZeroContinentalnessPoint(p_187331_);
        if (-0.65F < f5 && f5 < 1.0F) {
            float f14 = mountainContinentalness(-0.65F, p_187331_, -0.7F);
            float f9 = mountainContinentalness(-0.75F, p_187331_, -0.7F);
            float f10 = calculateSlope(f2, f9, -1.0F, -0.75F);
            builder->addPoint(-1.0F, f2, f10);
            builder->addPoint(-0.75F, f9, 0.0F);
            builder->addPoint(-0.65F, f14, 0.0F);
            float f11 = mountainContinentalness(f5, p_187331_, -0.7F);
            float f12 = calculateSlope(f11, f4, f5, 1.0F);
            builder->addPoint(f5 - 0.01F, f11, 0.0F);
            builder->addPoint(f5, f11, f12);
            builder->addPoint(1.0F, f4, f12);
        } else {
            float f7 = calculateSlope(f2, f4, -1.0F, 1.0F);
            if (p_187332_) {
                builder->addPoint(-1.0F, max(0.2F, f2), 0.0F);
                builder->addPoint(0.0F, Mth::lerp(0.5F, f2, f4), f7);
            } else {
                builder->addPoint(-1.0F, f2, f7);
            }

            builder->addPoint(1.0F, f4, f7);
        }

        return builder->build();
    }

    static float mountainContinentalness(float p_187327_, float p_187328_, float p_187329_) {
        float f2 = 1.0F - (1.0F - p_187328_) * 0.5F;
        float f3 = 0.5F * (1.0F - p_187328_);
        float f4 = (p_187327_ + 1.17F) * 0.46082947F;
        float f5 = f4 * f2 - f3;
        return p_187327_ < p_187329_ ? max(f5, -0.2222F) : max(f5, 0.0F);
    }

    static float calculateMountainRidgeZeroContinentalnessPoint(float p_187344_) {
        float f2 = 1.0F - (1.0F - p_187344_) * 0.5F;
        float f3 = 0.5F * (1.0F - p_187344_);
        return f3 / (0.46082947F * f2) - 1.17F;
    }

    static CubicSpline<TerrainShaper::Point *> *buildErosionOffsetSpline(float p_187285_, float p_187286_,
                                                                         float p_187287_, float p_187288_,
                                                                         float p_187289_, float p_187290_,
                                                                         bool p_187291_, bool p_187292_,
                                                                         ToFloatFunction<float> p_187293_) {
        CubicSpline<TerrainShaper::Point *> *cubicspline =
            buildMountainRidgeSplineWithPoints(Mth::lerp(p_187288_, 0.6F, 1.5F), p_187292_, p_187293_);
        CubicSpline<TerrainShaper::Point *> *cubicspline1 =
            buildMountainRidgeSplineWithPoints(Mth::lerp(p_187288_, 0.6F, 1.0F), p_187292_, p_187293_);
        CubicSpline<TerrainShaper::Point *> *cubicspline2 =
            buildMountainRidgeSplineWithPoints(p_187288_, p_187292_, p_187293_);
        CubicSpline<TerrainShaper::Point *> *cubicspline3 =
            ridgeSpline(p_187285_ - 0.15F, 0.5F * p_187288_, Mth::lerp(0.5F, 0.5F, 0.5F) * p_187288_, 0.5F * p_187288_,
                        0.6F * p_187288_, 0.5F, p_187293_);
        CubicSpline<TerrainShaper::Point *> *cubicspline4 =
            ridgeSpline(p_187285_, p_187289_ * p_187288_, p_187286_ * p_187288_, 0.5F * p_187288_, 0.6F * p_187288_,
                        0.5F, p_187293_);
        CubicSpline<TerrainShaper::Point *> *cubicspline5 =
            ridgeSpline(p_187285_, p_187289_, p_187289_, p_187286_, p_187287_, 0.5F, p_187293_);
        CubicSpline<TerrainShaper::Point *> *cubicspline6 =
            ridgeSpline(p_187285_, p_187289_, p_187289_, p_187286_, p_187287_, 0.5F, p_187293_);
        CubicSpline<TerrainShaper::Point *> *cubicspline7 =
            CubicSpline<Point *>::builder(CoordinateGetters[RIDGES], p_187293_)
                ->addPoint(-1.0F, p_187285_, 0.0F)
                ->addPoint(-0.4F, cubicspline5, 0.0F)
                ->addPoint(0.0F, p_187287_ + 0.07F, 0.0F)
                ->build();
        CubicSpline<TerrainShaper::Point *> *cubicspline8 =
            ridgeSpline(-0.02F, p_187290_, p_187290_, p_187286_, p_187287_, 0.0F, p_187293_);
        CubicSpline<Point *>::Builder *builder = CubicSpline<Point *>::builder(CoordinateGetters[EROSION], p_187293_)
                                                     ->addPoint(-0.85F, cubicspline, 0.0F)
                                                     ->addPoint(-0.7F, cubicspline1, 0.0F)
                                                     ->addPoint(-0.4F, cubicspline2, 0.0F)
                                                     ->addPoint(-0.35F, cubicspline3, 0.0F)
                                                     ->addPoint(-0.1F, cubicspline4, 0.0F)
                                                     ->addPoint(0.2F, cubicspline5, 0.0F);
        if (p_187291_) {
            builder->addPoint(0.4F, cubicspline6, 0.0F)
                ->addPoint(0.45F, cubicspline7, 0.0F)
                ->addPoint(0.55F, cubicspline7, 0.0F)
                ->addPoint(0.58F, cubicspline6, 0.0F);
        }

        builder->addPoint(0.7F, cubicspline8, 0.0F);
        return builder->build();
    }

    static CubicSpline<TerrainShaper::Point *> *ridgeSpline(float p_187277_, float p_187278_, float p_187279_,
                                                            float p_187280_, float p_187281_, float p_187282_,
                                                            ToFloatFunction<float> p_187283_) {
        float f = max(0.5F * (p_187278_ - p_187277_), p_187282_);
        float f1 = 5.0F * (p_187279_ - p_187278_);
        return CubicSpline<Point *>::builder(CoordinateGetters[RIDGES], p_187283_)
            ->addPoint(-1.0F, p_187277_, f)
            ->addPoint(-0.4F, p_187278_, min(f, f1))
            ->addPoint(0.0F, p_187279_, f1)
            ->addPoint(0.4F, p_187280_, 2.0F * (p_187280_ - p_187279_))
            ->addPoint(1.0F, p_187281_, 0.7F * (p_187281_ - p_187280_))
            ->build();
    }

public:
    CubicSpline<TerrainShaper::Point *> *offsetSampler() {
        return this->_offsetSampler;
    }

    CubicSpline<TerrainShaper::Point *> *factorSampler() {
        return this->_factorSampler;
    }

    CubicSpline<TerrainShaper::Point *> *jaggednessSampler() {
        return this->_jaggednessSampler;
    }

    float offset(TerrainShaper::Point *value) {
        return this->_offsetSampler->apply(value) + -0.50375F;
    }

    float factor(TerrainShaper::Point *value) {
        return this->_factorSampler->apply(value);
    }

    float jaggedness(TerrainShaper::Point *value) {
        return this->_jaggednessSampler->apply(value);
    }

    TerrainShaper::Point *makePoint(float continents, float erosion, float weirdness) {
        return new TerrainShaper::Point(continents, erosion, peaksAndValleys(weirdness), weirdness);
    }

    static float peaksAndValleys(float weirdness) {
        return -(abs(abs(weirdness) - 0.6666667F) - 0.33333334F) * 3.0F;
    }
};