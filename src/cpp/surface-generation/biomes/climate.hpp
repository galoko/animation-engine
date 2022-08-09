#pragma once

#include <algorithm>
#include <utility>

#include <cstdint>

#include "../../memory-debug.hpp"
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
                    int64_t weirdness);
    };

    class Parameter {
    public:
        int64_t min, max;

        Parameter(int64_t min, int64_t max);

        static Climate::Parameter const point(float value);

        static Climate::Parameter const span(float min, float max);
        static Climate::Parameter const span(Climate::Parameter const &minParameter,
                                             Climate::Parameter const &maxParameter);

        int64_t distance(int64_t value) const;
        int64_t distance(Climate::Parameter const &parameter) const;

        Climate::Parameter const span(Climate::Parameter const &parameterToMerge) const;
    };

    class ParameterPoint {
    public:
        Climate::Parameter temperature;
        Climate::Parameter humidity;
        Climate::Parameter continentalness;
        Climate::Parameter erosion;
        Climate::Parameter depth;
        Climate::Parameter weirdness;
        int64_t offset;

        ParameterPoint(Climate::Parameter const &temperature, Climate::Parameter const &humidity,
                       Climate::Parameter const &continentalness, Climate::Parameter const &erosion,
                       Climate::Parameter const &depth, Climate::Parameter const &weirdness, int64_t offset);

        int64_t fitness(Climate::TargetPoint const &otherPoint) const;
    };

    static Climate::TargetPoint const target(float temperature, float humidity, float continentalness, float erosion,
                                             float depth, float weirdness);

    static Climate::ParameterPoint const parameters(float temperature, float humidity, float continentalness,
                                                    float erosion, float depth, float weirdness, float offset);
    static Climate::ParameterPoint const parameters(Climate::Parameter const &temperature,
                                                    Climate::Parameter const &humidity,
                                                    Climate::Parameter const &continentalness,
                                                    Climate::Parameter const &erosion, Climate::Parameter const &depth,
                                                    Climate::Parameter const &weirdness, float offset);

    static constexpr inline int64_t quantizeCoord(float coord) {
        return (int64_t)(coord * QUANTIZATION_FACTOR);
    }

    static constexpr inline float unquantizeCoord(int64_t coord) {
        return (float)coord / QUANTIZATION_FACTOR;
    }

    template <typename T> class ParameterList {
    public:
        vector<pair<Climate::ParameterPoint, T>> values;

        // ParameterList

        ParameterList(vector<pair<Climate::ParameterPoint, T>> const &values) : values(values) {
        }

        T findValueBruteForce(Climate::TargetPoint const &targetPoint, T defaultValue) const {
            int64_t minDistance = numeric_limits<int64_t>::max();
            T result = defaultValue;

            for (const pair<Climate::ParameterPoint, T> &pair : this->values) {
                int64_t distance = pair.first.fitness(targetPoint);
                if (distance < minDistance) {
                    minDistance = distance;
                    result = pair.second;
                }
            }

            return result;
        }
    };

    class Sampler {
    public:
        virtual Climate::TargetPoint const sample(int32_t x, int32_t y, int32_t z) const = 0;
        virtual ~Sampler() {
            objectFreed("Climate::Sampler");
        }
    };
};