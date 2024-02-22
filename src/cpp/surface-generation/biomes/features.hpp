#pragma once

#include <memory>
#include <vector>

using namespace std;

class ConfiguredFeature {
    //
};

class FeatureConfiguration {
public:
    vector<shared_ptr<ConfiguredFeature>> getFeatures() {
        return {};
    }
};

class ProbabilityFeatureConfiguration : public FeatureConfiguration {
public:
    float probability;

    ProbabilityFeatureConfiguration(float probability) : probability(probability) {
        //
    }
};
