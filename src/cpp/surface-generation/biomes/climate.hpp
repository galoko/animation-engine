#pragma once

#include <algorithm>
#include <utility>

#include <stdint.h>

#include "mth.hpp"

using namespace std;

class Climate {
private:
    static constexpr float QUANTIZATION_FACTOR = 10000.0F;

public:
    class TargetPoint {
    public:
        int64_t temperature;
        int64_t humidity;
        int64_t continentalness;
        int64_t erosion;
        int64_t depth;
        int64_t weirdness;
        TargetPoint(int64_t temperature, int64_t humidity, int64_t continentalness, int64_t erosion, int64_t depth,
                    int64_t weirdness) {
            this->temperature = temperature;
            this->humidity = humidity;
            this->continentalness = continentalness;
            this->erosion = erosion;
            this->depth = depth;
            this->weirdness = weirdness;
        }
    };

    class Parameter {
    private:
        int64_t min, max;

    public:
        Parameter(int64_t min, int64_t max) : min(min), max(max) {
        }

        static Climate::Parameter *point(float value) {
            return span(value, value);
        }

        static Climate::Parameter *span(float min, float max) {
            return new Climate::Parameter(Climate::quantizeCoord(min), Climate::quantizeCoord(max));
        }

        static Climate::Parameter *span(Climate::Parameter *minParameter, Climate::Parameter *maxParameter) {
            return new Climate::Parameter(minParameter->min, maxParameter->max);
        }

        int64_t distance(int64_t value) {
            int64_t distanceFromMax = value - this->max;
            int64_t distanceFromMin = this->min - value;
            return distanceFromMax > 0LL ? distanceFromMax : std::max(distanceFromMin, 0LL);
        }

        int64_t distance(Climate::Parameter *parameter) {
            int64_t distanceFromMax = parameter->min - this->max;
            int64_t distanceFromMin = this->min - parameter->max;
            return distanceFromMax > 0LL ? distanceFromMax : std::max(distanceFromMin, 0LL);
        }

        Climate::Parameter *span(Climate::Parameter *parameterToMerge) {
            return parameterToMerge == nullptr ? this
                                               : new Climate::Parameter(std::min(this->min, parameterToMerge->min),
                                                                        std::max(this->max, parameterToMerge->max));
        }
    };

    class ParameterPoint {
    public:
        Climate::Parameter *temperature;
        Climate::Parameter *humidity;
        Climate::Parameter *continentalness;
        Climate::Parameter *erosion;
        Climate::Parameter *depth;
        Climate::Parameter *weirdness;
        int64_t offset;

        ParameterPoint(Climate::Parameter *temperature, Climate::Parameter *humidity,
                       Climate::Parameter *continentalness, Climate::Parameter *erosion, Climate::Parameter *depth,
                       Climate::Parameter *weirdness, int64_t offset) {
            this->temperature = temperature;
            this->humidity = humidity;
            this->continentalness = continentalness;
            this->erosion = erosion;
            this->depth = depth;
            this->weirdness = weirdness;
            this->offset = offset;
        }

        int64_t fitness(Climate::TargetPoint *otherPoint) {
            return Mth::square(this->temperature->distance(otherPoint->temperature)) +
                   Mth::square(this->humidity->distance(otherPoint->humidity)) +
                   Mth::square(this->continentalness->distance(otherPoint->continentalness)) +
                   Mth::square(this->erosion->distance(otherPoint->erosion)) +
                   Mth::square(this->depth->distance(otherPoint->depth)) +
                   Mth::square(this->weirdness->distance(otherPoint->weirdness)) + Mth::square(this->offset);
        }
    };

    static Climate::TargetPoint *target(float temperature, float humidity, float continentalness, float erosion,
                                        float depth, float weirdness) {
        return new Climate::TargetPoint(quantizeCoord(temperature), quantizeCoord(humidity),
                                        quantizeCoord(continentalness), quantizeCoord(erosion), quantizeCoord(depth),
                                        quantizeCoord(weirdness));
    }

    static Climate::ParameterPoint *parameters(float temperature, float humidity, float continentalness, float erosion,
                                               float depth, float weirdness, float offset) {
        return new Climate::ParameterPoint(Climate::Parameter::point(temperature), Climate::Parameter::point(humidity),
                                           Climate::Parameter::point(continentalness),
                                           Climate::Parameter::point(erosion), Climate::Parameter::point(depth),
                                           Climate::Parameter::point(weirdness), quantizeCoord(offset));
    }

    static Climate::ParameterPoint *parameters(Climate::Parameter *temperature, Climate::Parameter *humidity,
                                               Climate::Parameter *continentalness, Climate::Parameter *erosion,
                                               Climate::Parameter *depth, Climate::Parameter *weirdness, float offset) {
        return new Climate::ParameterPoint(temperature, humidity, continentalness, erosion, depth, weirdness,
                                           quantizeCoord(offset));
    }

    static int64_t quantizeCoord(float coord) {
        return (int64_t)(coord * QUANTIZATION_FACTOR);
    }

    static float unquantizeCoord(int64_t coord) {
        return (float)coord / QUANTIZATION_FACTOR;
    }

    template <typename T> class ParameterList {
    private:
        vector<pair<Climate::ParameterPoint *, T>> *values;

    public:
        ParameterList(vector<pair<Climate::ParameterPoint *, T>> *values) {
            this->values = values;
        }

        T findValueBruteForce(Climate::TargetPoint *targetPoint, T defaultValue) {
            int64_t minDistance = LLONG_MAX;
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
    };

    class Sampler {
        virtual Climate::TargetPoint *sample(int32_t x, int32_t y, int32_t z) = 0;
    };
};