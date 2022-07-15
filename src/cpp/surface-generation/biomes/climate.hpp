#pragma once

#include <algorithm>
#include <utility>

#include <cstdint>

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

        static Climate::Parameter *point(float value);

        static Climate::Parameter *span(float min, float max);
        static Climate::Parameter *span(Climate::Parameter *minParameter, Climate::Parameter *maxParameter);

        int64_t distance(int64_t value);
        int64_t distance(Climate::Parameter *parameter);

        Climate::Parameter *span(Climate::Parameter *parameterToMerge);
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
                       Climate::Parameter *weirdness, int64_t offset);

        int64_t fitness(Climate::TargetPoint *otherPoint);
    };

    static Climate::TargetPoint *target(float temperature, float humidity, float continentalness, float erosion,
                                        float depth, float weirdness);

    static Climate::ParameterPoint *parameters(float temperature, float humidity, float continentalness, float erosion,
                                               float depth, float weirdness, float offset);
    static Climate::ParameterPoint *parameters(Climate::Parameter *temperature, Climate::Parameter *humidity,
                                               Climate::Parameter *continentalness, Climate::Parameter *erosion,
                                               Climate::Parameter *depth, Climate::Parameter *weirdness, float offset);

    static constexpr inline int64_t quantizeCoord(float coord) {
        return (int64_t)(coord * QUANTIZATION_FACTOR);
    }

    static constexpr inline float unquantizeCoord(int64_t coord) {
        return (float)coord / QUANTIZATION_FACTOR;
    }

    template <typename T> class ParameterList {
    public:
        vector<pair<Climate::ParameterPoint *, T>> *values;

        // ParameterList

        ParameterList(vector<pair<Climate::ParameterPoint *, T>> *values) {
            this->values = values;
        }

        T findValueBruteForce(Climate::TargetPoint *targetPoint, T defaultValue) {
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
    };

    class Sampler {
    public:
        virtual Climate::TargetPoint *sample(int32_t x, int32_t y, int32_t z) = 0;
    };
};