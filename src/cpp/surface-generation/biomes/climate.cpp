#include "climate.hpp"

// TargetPoint

Climate::TargetPoint::TargetPoint(int64_t temperature, int64_t humidity, int64_t continentalness, int64_t erosion,
                                  int64_t depth, int64_t weirdness) {
    this->temperature = temperature;
    this->humidity = humidity;
    this->continentalness = continentalness;
    this->erosion = erosion;
    this->depth = depth;
    this->weirdness = weirdness;
}

// Parameter

Climate::Parameter::Parameter(int64_t min, int64_t max) : min(min), max(max) {
}

Climate::Parameter const Climate::Parameter::point(float value) {
    return span(value, value);
}

Climate::Parameter const Climate::Parameter::span(float min, float max) {
    return Climate::Parameter(Climate::quantizeCoord(min), Climate::quantizeCoord(max));
}

Climate::Parameter const Climate::Parameter::span(Climate::Parameter const &minParameter,
                                                  Climate::Parameter const &maxParameter) {
    return Climate::Parameter(minParameter.min, maxParameter.max);
}

int64_t Climate::Parameter::distance(int64_t value) const {
    int64_t distanceFromMax = value - this->max;
    int64_t distanceFromMin = this->min - value;
    return distanceFromMax > 0LL ? distanceFromMax : std::max(distanceFromMin, 0LL);
}

int64_t Climate::Parameter::distance(Climate::Parameter const &parameter) const {
    int64_t distanceFromMax = parameter.min - this->max;
    int64_t distanceFromMin = this->min - parameter.max;
    return distanceFromMax > 0LL ? distanceFromMax : std::max(distanceFromMin, 0LL);
}

Climate::Parameter const Climate::Parameter::span(Climate::Parameter const &parameterToMerge) const {
    return parameterToMerge.isNull() ? *this : Climate::Parameter(std::min(this->min, parameterToMerge.min), std::max(this->max, parameterToMerge.max));
}

bool Climate::Parameter::isNull() const {
    return this->min > this->max;
}

// ParameterPoint

Climate::ParameterPoint::ParameterPoint(Climate::Parameter const &temperature, Climate::Parameter const &humidity,
                                        Climate::Parameter const &continentalness, Climate::Parameter const &erosion,
                                        Climate::Parameter const &depth, Climate::Parameter const &weirdness,
                                        int64_t offset)
    : temperature(temperature), humidity(humidity), continentalness(continentalness), erosion(erosion), depth(depth),
      weirdness(weirdness), offset(offset) {
}

int64_t Climate::ParameterPoint::fitness(Climate::TargetPoint const &otherPoint) const {
    return Mth::square(this->temperature.distance(otherPoint.temperature)) +
           Mth::square(this->humidity.distance(otherPoint.humidity)) +
           Mth::square(this->continentalness.distance(otherPoint.continentalness)) +
           Mth::square(this->erosion.distance(otherPoint.erosion)) +
           Mth::square(this->depth.distance(otherPoint.depth)) +
           Mth::square(this->weirdness.distance(otherPoint.weirdness)) + Mth::square(this->offset);
}

// Climate

Climate::TargetPoint const Climate::target(float temperature, float humidity, float continentalness, float erosion,
                                           float depth, float weirdness) {
    return Climate::TargetPoint(quantizeCoord(temperature), quantizeCoord(humidity), quantizeCoord(continentalness),
                                quantizeCoord(erosion), quantizeCoord(depth), quantizeCoord(weirdness));
}

Climate::ParameterPoint const Climate::parameters(float temperature, float humidity, float continentalness,
                                                  float erosion, float depth, float weirdness, float offset) {
    return Climate::ParameterPoint(Climate::Parameter::point(temperature), Climate::Parameter::point(humidity),
                                   Climate::Parameter::point(continentalness), Climate::Parameter::point(erosion),
                                   Climate::Parameter::point(depth), Climate::Parameter::point(weirdness),
                                   quantizeCoord(offset));
}

Climate::ParameterPoint const Climate::parameters(Climate::Parameter const &temperature,
                                                  Climate::Parameter const &humidity,
                                                  Climate::Parameter const &continentalness,
                                                  Climate::Parameter const &erosion, Climate::Parameter const &depth,
                                                  Climate::Parameter const &weirdness, float offset) {
    return Climate::ParameterPoint(temperature, humidity, continentalness, erosion, depth, weirdness,
                                   quantizeCoord(offset));
}