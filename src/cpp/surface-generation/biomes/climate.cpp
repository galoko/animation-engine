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

Climate::Parameter *Climate::Parameter::point(float value) {
    return span(value, value);
}

Climate::Parameter *Climate::Parameter::span(float min, float max) {
    return new Climate::Parameter(Climate::quantizeCoord(min), Climate::quantizeCoord(max));
}

Climate::Parameter *Climate::Parameter::span(Climate::Parameter *minParameter, Climate::Parameter *maxParameter) {
    return new Climate::Parameter(minParameter->min, maxParameter->max);
}

int64_t Climate::Parameter::distance(int64_t value) {
    int64_t distanceFromMax = value - this->max;
    int64_t distanceFromMin = this->min - value;
    return distanceFromMax > 0LL ? distanceFromMax : std::max(distanceFromMin, 0LL);
}

int64_t Climate::Parameter::distance(Climate::Parameter *parameter) {
    int64_t distanceFromMax = parameter->min - this->max;
    int64_t distanceFromMin = this->min - parameter->max;
    return distanceFromMax > 0LL ? distanceFromMax : std::max(distanceFromMin, 0LL);
}

Climate::Parameter *Climate::Parameter::span(Climate::Parameter *parameterToMerge) {
    return parameterToMerge == nullptr ? this
                                       : new Climate::Parameter(std::min(this->min, parameterToMerge->min),
                                                                std::max(this->max, parameterToMerge->max));
}

// ParameterPoint

Climate::ParameterPoint::ParameterPoint(Climate::Parameter *temperature, Climate::Parameter *humidity,
                                        Climate::Parameter *continentalness, Climate::Parameter *erosion,
                                        Climate::Parameter *depth, Climate::Parameter *weirdness, int64_t offset) {
    this->temperature = temperature;
    this->humidity = humidity;
    this->continentalness = continentalness;
    this->erosion = erosion;
    this->depth = depth;
    this->weirdness = weirdness;
    this->offset = offset;
}

int64_t Climate::ParameterPoint::fitness(Climate::TargetPoint *otherPoint) {
    return Mth::square(this->temperature->distance(otherPoint->temperature)) +
           Mth::square(this->humidity->distance(otherPoint->humidity)) +
           Mth::square(this->continentalness->distance(otherPoint->continentalness)) +
           Mth::square(this->erosion->distance(otherPoint->erosion)) +
           Mth::square(this->depth->distance(otherPoint->depth)) +
           Mth::square(this->weirdness->distance(otherPoint->weirdness)) + Mth::square(this->offset);
}

// Climate

Climate::TargetPoint *Climate::target(float temperature, float humidity, float continentalness, float erosion,
                                      float depth, float weirdness) {
    return new Climate::TargetPoint(quantizeCoord(temperature), quantizeCoord(humidity), quantizeCoord(continentalness),
                                    quantizeCoord(erosion), quantizeCoord(depth), quantizeCoord(weirdness));
}

Climate::ParameterPoint *Climate::parameters(float temperature, float humidity, float continentalness, float erosion,
                                             float depth, float weirdness, float offset) {
    return new Climate::ParameterPoint(Climate::Parameter::point(temperature), Climate::Parameter::point(humidity),
                                       Climate::Parameter::point(continentalness), Climate::Parameter::point(erosion),
                                       Climate::Parameter::point(depth), Climate::Parameter::point(weirdness),
                                       quantizeCoord(offset));
}

Climate::ParameterPoint *Climate::parameters(Climate::Parameter *temperature, Climate::Parameter *humidity,
                                             Climate::Parameter *continentalness, Climate::Parameter *erosion,
                                             Climate::Parameter *depth, Climate::Parameter *weirdness, float offset) {
    return new Climate::ParameterPoint(temperature, humidity, continentalness, erosion, depth, weirdness,
                                       quantizeCoord(offset));
}

// ParameterList

template <typename T> Climate::ParameterList<T>::ParameterList(vector<pair<Climate::ParameterPoint *, T>> *values) {
    this->values = values;
}

template <typename T>
T Climate::ParameterList<T>::findValueBruteForce(Climate::TargetPoint *targetPoint, T defaultValue) {
    int64_t minDistance = numeric_limits<int64_t>::max();
    T result = defaultValue;

    for (pair<Climate::ParameterPoint *, T> &pair : *this->values) {
        int64_t distance = pair.first->fitness(targetPoint);
        if (distance < minDistance) {
            minDistance = distance;
            result = pair.second;
        }
    }

    return result;
}