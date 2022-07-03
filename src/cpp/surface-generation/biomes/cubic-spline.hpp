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
        Builder(ToFloatFunction<C> coordinate) {
            this(coordinate, [](float value) { return value; });
        }

        Builder(ToFloatFunction<C> coordinate, ToFloatFunction<float> valueTransformer) {
            this->coordinate = coordinate;
            this->valueTransformer = valueTransformer;
        }

    public:
        CubicSpline<C>::Builder *addPoint(float loc, float value, float derivative) {
            return this->addPoint(loc, new CubicSpline::Constant(this->valueTransformer(value)), derivative);
        }

        CubicSpline<C>::Builder *addPoint(float loc, CubicSpline<C> *value, float derivative) {
            this->locations->push_back(loc);
            this->values->push_back(value);
            this->derivatives->push_back(derivative);
            return this;
        }

        CubicSpline<C> *build() {
            return new CubicSpline<C>::Multipoint(this->coordinate, this->locations, this->values, this->derivatives);
        }
    };

    static CubicSpline<C> *constant(float value) {
        return new CubicSpline::Constant(value);
    }

    static CubicSpline<C>::Builder *builder(ToFloatFunction<C> coordinate) {
        return new CubicSpline<C>::Builder(coordinate);
    }

    static CubicSpline<C>::Builder *builder(ToFloatFunction<C> coordinate, ToFloatFunction<float> valueTransformer) {
        return new CubicSpline<C>::Builder(coordinate, valueTransformer);
    }

    virtual float apply(C value) = 0;

    class Constant : public CubicSpline {
    private:
        float value;

    public:
        Constant(float value) : value(value) {
        }

        float apply(C value) {
            return this->value;
        }
    };

    class Multipoint : public CubicSpline {
    private:
        ToFloatFunction<C> coordinate;
        vector<float> *locations;
        vector<CubicSpline<C> *> *values;
        vector<float> *derivatives;

    public:
        Multipoint(ToFloatFunction<C> coordinate, vector<float> *locations, vector<CubicSpline<C> *> *values,
                   vector<float> *derivatives) {
            this->coordinate = coordinate;
            this->locations = locations;
            this->values = values;
            this->derivatives = derivatives;
        }

        float apply(C value) {
            float loc = this->coordinate(value);
            int32_t index = Mth::binarySearch(0, this->locations->size(),
                                              [this, loc](int32_t index) { return loc < this->locations->at(index); }) -
                            1;
            int32_t lastIndex = this->locations->size() - 1;
            if (index < 0) {
                return this->values->at(0)->apply(value) + this->derivatives->at(0) * (loc - this->locations->at(0));
            } else if (index == lastIndex) {
                return this->values->at(lastIndex)->apply(value) +
                       this->derivatives->at(lastIndex) * (loc - this->locations->at(lastIndex));
            } else {
                float prevLoc = this->locations->at(index);
                float nextLoc = this->locations->at(index + 1);
                float t = (loc - prevLoc) / (nextLoc - prevLoc);
                CubicSpline<C> *valueGetter0 = this->values->at(index);
                CubicSpline<C> *valueGetter1 = this->values->at(index + 1);
                float d0 = this->derivatives->at(index);
                float d1 = this->derivatives->at(index + 1);
                float v0 = valueGetter0->apply(value);
                float v1 = valueGetter1->apply(value);
                float v2 = d0 * (nextLoc - prevLoc) - (v1 - v0);
                float v3 = -d1 * (nextLoc - prevLoc) + (v1 - v0);
                return Mth::lerp(t, v0, v1) + t * (1.0F - t) * Mth::lerp(t, v2, v3);
            }
        }
    };
};
