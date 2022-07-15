#include "cubic-spline.hpp"

// Builder

template <typename C>
CubicSpline<C>::Builder::Builder(ToFloatFunction<C> coordinate)
    : CubicSpline<C>::Builder::Builder(coordinate, [](float value) { return value; }) {
}

template <typename C>
CubicSpline<C>::Builder::Builder(ToFloatFunction<C> coordinate, ToFloatFunction<float> valueTransformer) {
    this->coordinate = coordinate;
    this->valueTransformer = valueTransformer;
}

template <typename C>
typename CubicSpline<C>::Builder *CubicSpline<C>::Builder::addPoint(float loc, float value, float derivative) {
    return this->addPoint(loc, new CubicSpline::Constant(this->valueTransformer(value)), derivative);
}

template <typename C>
typename CubicSpline<C>::Builder *CubicSpline<C>::Builder::addPoint(float loc, CubicSpline<C> *value,
                                                                    float derivative) {
    this->locations->push_back(loc);
    this->values->push_back(value);
    this->derivatives->push_back(derivative);
    return this;
}

template <typename C> CubicSpline<C> *CubicSpline<C>::Builder::build() {
    return new CubicSpline<C>::Multipoint(this->coordinate, this->locations, this->values, this->derivatives);
}

template <typename C> CubicSpline<C> *CubicSpline<C>::constant(float value) {
    return new CubicSpline::Constant(value);
}

template <typename C> typename CubicSpline<C>::Builder *CubicSpline<C>::builder(ToFloatFunction<C> coordinate) {
    return new CubicSpline<C>::Builder(coordinate);
}

template <typename C>
typename CubicSpline<C>::Builder *CubicSpline<C>::builder(ToFloatFunction<C> coordinate,
                                                          ToFloatFunction<float> valueTransformer) {
    return new CubicSpline<C>::Builder(coordinate, valueTransformer);
}

// Constant

template <typename C> CubicSpline<C>::Constant::Constant(float value) : value(value) {
}

template <typename C> float CubicSpline<C>::Constant::apply(C value) {
    return this->value;
}

// Multipoint

template <typename C>
CubicSpline<C>::Multipoint::Multipoint(ToFloatFunction<C> coordinate, vector<float> *locations,
                                       vector<CubicSpline<C> *> *values, vector<float> *derivatives) {
    this->coordinate = coordinate;
    this->locations = locations;
    this->values = values;
    this->derivatives = derivatives;
}

template <typename C> float CubicSpline<C>::Multipoint::apply(C value) {
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