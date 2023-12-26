#include "terrain-shaper.hpp"

// Point

TerrainShaper::Point::Point(float continents, float erosion, float ridges, float weirdness) {
    this->continents = continents;
    this->erosion = erosion;
    this->ridges = ridges;
    this->weirdness = weirdness;
}

// TerrainShaper

TerrainShaper::TerrainShaper(shared_ptr<CubicSpline<TerrainShaper::Point>> offsetSampler,
                             shared_ptr<CubicSpline<TerrainShaper::Point>> factorSampler,
                             shared_ptr<CubicSpline<TerrainShaper::Point>> jaggednessSampler) {
    this->_offsetSampler = offsetSampler;
    this->_factorSampler = factorSampler;
    this->_jaggednessSampler = jaggednessSampler;
}

TerrainShaper TerrainShaper::overworld(bool isAmplified) {
    ToFloatFunction<float> offsetTransformer = isAmplified ? TerrainShaper::getAmplifiedOffset : NO_TRANSFORM;
    ToFloatFunction<float> factorTransformer = isAmplified ? TerrainShaper::getAmplifiedFactor : NO_TRANSFORM;
    ToFloatFunction<float> jaggednessTransformer = isAmplified ? TerrainShaper::getAmplifiedJaggedness : NO_TRANSFORM;
    shared_ptr<CubicSpline<TerrainShaper::Point>> erosionOffset1 =
        buildErosionOffsetSpline(-0.15F, 0.0F, 0.0F, 0.1F, 0.0F, -0.03F, false, false, offsetTransformer);
    shared_ptr<CubicSpline<TerrainShaper::Point>> erosionOffset2 =
        buildErosionOffsetSpline(-0.1F, 0.03F, 0.1F, 0.1F, 0.01F, -0.03F, false, false, offsetTransformer);
    shared_ptr<CubicSpline<TerrainShaper::Point>> erosionOffset3 =
        buildErosionOffsetSpline(-0.1F, 0.03F, 0.1F, 0.7F, 0.01F, -0.03F, true, true, offsetTransformer);
    shared_ptr<CubicSpline<TerrainShaper::Point>> erosionOffset4 =
        buildErosionOffsetSpline(-0.05F, 0.03F, 0.1F, 1.0F, 0.01F, 0.01F, true, true, offsetTransformer);
    shared_ptr<CubicSpline<TerrainShaper::Point>> offsetSampler =
        CubicSpline<TerrainShaper::Point>::builder(CoordinateGetters[CONTINENTS], offsetTransformer)
            .addPoint(-1.1F, 0.044F, 0.0F)
            .addPoint(-1.02F, -0.2222F, 0.0F)
            .addPoint(-0.51F, -0.2222F, 0.0F)
            .addPoint(-0.44F, -0.12F, 0.0F)
            .addPoint(-0.18F, -0.12F, 0.0F)
            .addPoint(-0.16F, erosionOffset1, 0.0F)
            .addPoint(-0.15F, erosionOffset1, 0.0F)
            .addPoint(-0.1F, erosionOffset2, 0.0F)
            .addPoint(0.25F, erosionOffset3, 0.0F)
            .addPoint(1.0F, erosionOffset4, 0.0F)
            .build();
    shared_ptr<CubicSpline<TerrainShaper::Point>> factorSampler =
        CubicSpline<TerrainShaper::Point>::builder(CoordinateGetters[CONTINENTS], NO_TRANSFORM)
            .addPoint(-0.19F, 3.95F, 0.0F)
            .addPoint(-0.15F, getErosionFactor(6.25F, true, NO_TRANSFORM), 0.0F)
            .addPoint(-0.1F, getErosionFactor(5.47F, true, factorTransformer), 0.0F)
            .addPoint(0.03F, getErosionFactor(5.08F, true, factorTransformer), 0.0F)
            .addPoint(0.06F, getErosionFactor(4.69F, false, factorTransformer), 0.0F)
            .build();
    shared_ptr<CubicSpline<TerrainShaper::Point>> jaggednessSampler =
        CubicSpline<TerrainShaper::Point>::builder(CoordinateGetters[CONTINENTS], jaggednessTransformer)
            .addPoint(-0.11F, 0.0F, 0.0F)
            .addPoint(0.03F, buildErosionJaggednessSpline(1.0F, 0.5F, 0.0F, 0.0F, jaggednessTransformer), 0.0F)
            .addPoint(0.65F, buildErosionJaggednessSpline(1.0F, 1.0F, 1.0F, 0.0F, jaggednessTransformer), 0.0F)
            .build();
    return TerrainShaper(offsetSampler, factorSampler, jaggednessSampler);
}

shared_ptr<CubicSpline<TerrainShaper::Point>> TerrainShaper::buildErosionJaggednessSpline(
    float p_187295_, float p_187296_, float p_187297_, float p_187298_, ToFloatFunction<float> p_187299_) {
    shared_ptr<CubicSpline<TerrainShaper::Point>> cubicspline =
        buildRidgeJaggednessSpline(p_187295_, p_187297_, p_187299_);
    shared_ptr<CubicSpline<TerrainShaper::Point>> cubicspline1 =
        buildRidgeJaggednessSpline(p_187296_, p_187298_, p_187299_);
    return CubicSpline<TerrainShaper::Point>::builder(CoordinateGetters[EROSION], p_187299_)
        .addPoint(-1.0F, cubicspline, 0.0F)
        .addPoint(-0.78F, cubicspline1, 0.0F)
        .addPoint(-0.5775F, cubicspline1, 0.0F)
        .addPoint(-0.375F, 0.0F, 0.0F)
        .build();
}

shared_ptr<CubicSpline<TerrainShaper::Point>> TerrainShaper::buildRidgeJaggednessSpline(
    float weirdness1, float weirdness0, ToFloatFunction<float> transformer) {
    float f = peaksAndValleys(0.4F);
    float f1 = peaksAndValleys(0.56666666F);
    float f2 = (f + f1) / 2.0F;
    CubicSpline<TerrainShaper::Point>::Builder builder =
        CubicSpline<TerrainShaper::Point>::builder(CoordinateGetters[RIDGES], transformer);
    builder.addPoint(f, 0.0F, 0.0F);
    if (weirdness0 > 0.0F) {
        builder.addPoint(f2, buildWeirdnessJaggednessSpline(weirdness0, transformer), 0.0F);
    } else {
        builder.addPoint(f2, 0.0F, 0.0F);
    }

    if (weirdness1 > 0.0F) {
        builder.addPoint(1.0F, buildWeirdnessJaggednessSpline(weirdness1, transformer), 0.0F);
    } else {
        builder.addPoint(1.0F, 0.0F, 0.0F);
    }

    return builder.build();
}

shared_ptr<CubicSpline<TerrainShaper::Point>> TerrainShaper::buildWeirdnessJaggednessSpline(
    float wierdness, ToFloatFunction<float> transformer) {
    float f = 0.63F * wierdness;
    float f1 = 0.3F * wierdness;
    return CubicSpline<TerrainShaper::Point>::builder(CoordinateGetters[WEIRDNESS], transformer)
        .addPoint(-0.01F, f, 0.0F)
        .addPoint(0.01F, f1, 0.0F)
        .build();
}

shared_ptr<CubicSpline<TerrainShaper::Point>> TerrainShaper::getErosionFactor(float p_187308_, bool p_187309_,
                                                                              ToFloatFunction<float> transformer) {
    shared_ptr<CubicSpline<TerrainShaper::Point>> cubicspline =
        CubicSpline<TerrainShaper::Point>::builder(CoordinateGetters[WEIRDNESS], transformer)
            .addPoint(-0.2F, 6.3F, 0.0F)
            .addPoint(0.2F, p_187308_, 0.0F)
            .build();
    CubicSpline<TerrainShaper::Point>::Builder builder =
        CubicSpline<TerrainShaper::Point>::builder(CoordinateGetters[EROSION], transformer)
            .addPoint(-0.6F, cubicspline, 0.0F)
            .addPoint(-0.5F,
                      CubicSpline<TerrainShaper::Point>::builder(CoordinateGetters[WEIRDNESS], transformer)
                          .addPoint(-0.05F, 6.3F, 0.0F)
                          .addPoint(0.05F, 2.67F, 0.0F)
                          .build(),
                      0.0F)
            .addPoint(-0.35F, cubicspline, 0.0F)
            .addPoint(-0.25F, cubicspline, 0.0F)
            .addPoint(-0.1F,
                      CubicSpline<TerrainShaper::Point>::builder(CoordinateGetters[WEIRDNESS], transformer)
                          .addPoint(-0.05F, 2.67F, 0.0F)
                          .addPoint(0.05F, 6.3F, 0.0F)
                          .build(),
                      0.0F)
            .addPoint(0.03F, cubicspline, 0.0F);
    if (p_187309_) {
        shared_ptr<CubicSpline<TerrainShaper::Point>> cubicspline1 =
            CubicSpline<TerrainShaper::Point>::builder(CoordinateGetters[WEIRDNESS], transformer)
                .addPoint(0.0F, p_187308_, 0.0F)
                .addPoint(0.1F, 0.625F, 0.0F)
                .build();
        shared_ptr<CubicSpline<TerrainShaper::Point>> cubicspline2 =
            CubicSpline<TerrainShaper::Point>::builder(CoordinateGetters[RIDGES], transformer)
                .addPoint(-0.9F, p_187308_, 0.0F)
                .addPoint(-0.69F, cubicspline1, 0.0F)
                .build();
        builder.addPoint(0.35F, p_187308_, 0.0F)
            .addPoint(0.45F, cubicspline2, 0.0F)
            .addPoint(0.55F, cubicspline2, 0.0F)
            .addPoint(0.62F, p_187308_, 0.0F);
    } else {
        shared_ptr<CubicSpline<TerrainShaper::Point>> cubicspline3 =
            CubicSpline<TerrainShaper::Point>::builder(CoordinateGetters[RIDGES], transformer)
                .addPoint(-0.7F, cubicspline, 0.0F)
                .addPoint(-0.15F, 1.37F, 0.0F)
                .build();
        shared_ptr<CubicSpline<TerrainShaper::Point>> cubicspline4 =
            CubicSpline<TerrainShaper::Point>::builder(CoordinateGetters[RIDGES], transformer)
                .addPoint(0.45F, cubicspline, 0.0F)
                .addPoint(0.7F, 1.56F, 0.0F)
                .build();
        builder.addPoint(0.05F, cubicspline4, 0.0F)
            .addPoint(0.4F, cubicspline4, 0.0F)
            .addPoint(0.45F, cubicspline3, 0.0F)
            .addPoint(0.55F, cubicspline3, 0.0F)
            .addPoint(0.58F, p_187308_, 0.0F);
    }

    return builder.build();
}

shared_ptr<CubicSpline<TerrainShaper::Point>> TerrainShaper::buildMountainRidgeSplineWithPoints(
    float p_187331_, bool p_187332_, ToFloatFunction<float> p_187333_) {
    CubicSpline<TerrainShaper::Point>::Builder builder =
        CubicSpline<TerrainShaper::Point>::builder(CoordinateGetters[RIDGES], p_187333_);
    float f2 = mountainContinentalness(-1.0F, p_187331_, -0.7F);
    float f4 = mountainContinentalness(1.0F, p_187331_, -0.7F);
    float f5 = calculateMountainRidgeZeroContinentalnessPoint(p_187331_);
    if (-0.65F < f5 && f5 < 1.0F) {
        float f14 = mountainContinentalness(-0.65F, p_187331_, -0.7F);
        float f9 = mountainContinentalness(-0.75F, p_187331_, -0.7F);
        float f10 = calculateSlope(f2, f9, -1.0F, -0.75F);
        builder.addPoint(-1.0F, f2, f10);
        builder.addPoint(-0.75F, f9, 0.0F);
        builder.addPoint(-0.65F, f14, 0.0F);
        float f11 = mountainContinentalness(f5, p_187331_, -0.7F);
        float f12 = calculateSlope(f11, f4, f5, 1.0F);
        builder.addPoint(f5 - 0.01F, f11, 0.0F);
        builder.addPoint(f5, f11, f12);
        builder.addPoint(1.0F, f4, f12);
    } else {
        float f7 = calculateSlope(f2, f4, -1.0F, 1.0F);
        if (p_187332_) {
            builder.addPoint(-1.0F, max(0.2F, f2), 0.0F);
            builder.addPoint(0.0F, Mth::lerp(0.5F, f2, f4), f7);
        } else {
            builder.addPoint(-1.0F, f2, f7);
        }

        builder.addPoint(1.0F, f4, f7);
    }

    return builder.build();
}

shared_ptr<CubicSpline<TerrainShaper::Point>> TerrainShaper::buildErosionOffsetSpline(
    float p_187285_, float p_187286_, float p_187287_, float p_187288_, float p_187289_, float p_187290_,
    bool p_187291_, bool p_187292_, ToFloatFunction<float> p_187293_) {
    shared_ptr<CubicSpline<TerrainShaper::Point>> cubicspline =
        buildMountainRidgeSplineWithPoints(Mth::lerp(p_187288_, 0.6F, 1.5F), p_187292_, p_187293_);
    shared_ptr<CubicSpline<TerrainShaper::Point>> cubicspline1 =
        buildMountainRidgeSplineWithPoints(Mth::lerp(p_187288_, 0.6F, 1.0F), p_187292_, p_187293_);
    shared_ptr<CubicSpline<TerrainShaper::Point>> cubicspline2 =
        buildMountainRidgeSplineWithPoints(p_187288_, p_187292_, p_187293_);
    shared_ptr<CubicSpline<TerrainShaper::Point>> cubicspline3 =
        ridgeSpline(p_187285_ - 0.15F, 0.5F * p_187288_, Mth::lerp(0.5F, 0.5F, 0.5F) * p_187288_, 0.5F * p_187288_,
                    0.6F * p_187288_, 0.5F, p_187293_);
    shared_ptr<CubicSpline<TerrainShaper::Point>> cubicspline4 = ridgeSpline(
        p_187285_, p_187289_ * p_187288_, p_187286_ * p_187288_, 0.5F * p_187288_, 0.6F * p_187288_, 0.5F, p_187293_);
    shared_ptr<CubicSpline<TerrainShaper::Point>> cubicspline5 =
        ridgeSpline(p_187285_, p_187289_, p_187289_, p_187286_, p_187287_, 0.5F, p_187293_);
    shared_ptr<CubicSpline<TerrainShaper::Point>> cubicspline6 =
        ridgeSpline(p_187285_, p_187289_, p_187289_, p_187286_, p_187287_, 0.5F, p_187293_);
    shared_ptr<CubicSpline<TerrainShaper::Point>> cubicspline7 =
        CubicSpline<TerrainShaper::Point>::builder(CoordinateGetters[RIDGES], p_187293_)
            .addPoint(-1.0F, p_187285_, 0.0F)
            .addPoint(-0.4F, cubicspline5, 0.0F)
            .addPoint(0.0F, p_187287_ + 0.07F, 0.0F)
            .build();
    shared_ptr<CubicSpline<TerrainShaper::Point>> cubicspline8 =
        ridgeSpline(-0.02F, p_187290_, p_187290_, p_187286_, p_187287_, 0.0F, p_187293_);
    CubicSpline<TerrainShaper::Point>::Builder builder =
        CubicSpline<TerrainShaper::Point>::builder(CoordinateGetters[EROSION], p_187293_)
            .addPoint(-0.85F, cubicspline, 0.0F)
            .addPoint(-0.7F, cubicspline1, 0.0F)
            .addPoint(-0.4F, cubicspline2, 0.0F)
            .addPoint(-0.35F, cubicspline3, 0.0F)
            .addPoint(-0.1F, cubicspline4, 0.0F)
            .addPoint(0.2F, cubicspline5, 0.0F);
    if (p_187291_) {
        builder.addPoint(0.4F, cubicspline6, 0.0F)
            .addPoint(0.45F, cubicspline7, 0.0F)
            .addPoint(0.55F, cubicspline7, 0.0F)
            .addPoint(0.58F, cubicspline6, 0.0F);
    }

    builder.addPoint(0.7F, cubicspline8, 0.0F);
    return builder.build();
}

shared_ptr<CubicSpline<TerrainShaper::Point>> TerrainShaper::ridgeSpline(float p_187277_, float p_187278_,
                                                                         float p_187279_, float p_187280_,
                                                                         float p_187281_, float p_187282_,
                                                                         ToFloatFunction<float> p_187283_) {
    float f = max(0.5F * (p_187278_ - p_187277_), p_187282_);
    float f1 = 5.0F * (p_187279_ - p_187278_);
    return CubicSpline<TerrainShaper::Point>::builder(CoordinateGetters[RIDGES], p_187283_)
        .addPoint(-1.0F, p_187277_, f)
        .addPoint(-0.4F, p_187278_, min(f, f1))
        .addPoint(0.0F, p_187279_, f1)
        .addPoint(0.4F, p_187280_, 2.0F * (p_187280_ - p_187279_))
        .addPoint(1.0F, p_187281_, 0.7F * (p_187281_ - p_187280_))
        .build();
}

shared_ptr<CubicSpline<TerrainShaper::Point>> TerrainShaper::offsetSampler() {
    return this->_offsetSampler;
}

shared_ptr<CubicSpline<TerrainShaper::Point>> TerrainShaper::factorSampler() {
    return this->_factorSampler;
}

shared_ptr<CubicSpline<TerrainShaper::Point>> TerrainShaper::jaggednessSampler() {
    return this->_jaggednessSampler;
}

float TerrainShaper::offset(Point const &value) const {
    return this->_offsetSampler->apply(value) + -0.50375F;
}

float TerrainShaper::factor(Point const &value) const {
    return this->_factorSampler->apply(value);
}

float TerrainShaper::jaggedness(Point const &value) const {
    return this->_jaggednessSampler->apply(value);
}

TerrainShaper::Point const TerrainShaper::makePoint(float continents, float erosion, float weirdness) const {
    return Point(continents, erosion, peaksAndValleys(weirdness), weirdness);
}

// TerrainProvider

TerrainShaper TerrainProvider::overworld(bool isAmplified) {
    return TerrainShaper::overworld(isAmplified);
}

TerrainShaper TerrainProvider::nether() {
    return TerrainShaper(CubicSpline<TerrainShaper::Point>::constant(0.0F),
                         CubicSpline<TerrainShaper::Point>::constant(0.0F),
                         CubicSpline<TerrainShaper::Point>::constant(0.0F));
}

TerrainShaper TerrainProvider::end() {
    return TerrainShaper(CubicSpline<TerrainShaper::Point>::constant(0.0F),
                         CubicSpline<TerrainShaper::Point>::constant(1.0F),
                         CubicSpline<TerrainShaper::Point>::constant(0.0F));
}