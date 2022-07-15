#pragma once

#include <vector>

#include "mth.hpp"

using namespace std;

template <typename T> using ToFloatFunction = float (*)(T);

template <typename C> class CubicSpline {
private:
public:
    class Builder {
    private:
        ToFloatFunction<C> coordinate;
        ToFloatFunction<float> valueTransformer;
        vector<float> *locations = new vector<float>();
        vector<CubicSpline<C> *> *values = new vector<CubicSpline<C> *>();
        vector<float> *derivatives = new vector<float>();

    public:
        Builder(ToFloatFunction<C> coordinate);
        Builder(ToFloatFunction<C> coordinate, ToFloatFunction<float> valueTransformer);

    public:
        CubicSpline<C>::Builder *addPoint(float loc, float value, float derivative);
        CubicSpline<C>::Builder *addPoint(float loc, CubicSpline<C> *value, float derivative);

        CubicSpline<C> *build();
    };

    static CubicSpline<C> *constant(float value);

    static CubicSpline<C>::Builder *builder(ToFloatFunction<C> coordinate);
    static CubicSpline<C>::Builder *builder(ToFloatFunction<C> coordinate, ToFloatFunction<float> valueTransformer);

    virtual float apply(C value) = 0;

    class Constant : public CubicSpline {
    private:
        float value;

    public:
        Constant(float value);

        float apply(C value) override;
    };

    class Multipoint : public CubicSpline {
    private:
        ToFloatFunction<C> coordinate;
        vector<float> *locations;
        vector<CubicSpline<C> *> *values;
        vector<float> *derivatives;

    public:
        Multipoint(ToFloatFunction<C> coordinate, vector<float> *locations, vector<CubicSpline<C> *> *values,
                   vector<float> *derivatives);

        float apply(C value) override;
    };
};
