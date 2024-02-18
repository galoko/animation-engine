#pragma once

#include <concepts>
#include <memory>
#include <type_traits>

#include "random.hpp"
#include "vertical-anchor.hpp"
#include "world-generation-context.hpp"

using namespace std;

class FeatureConfiguration;

template <typename FC> class Feature {};

template <typename FC>
concept IsFeatureConfiguration = is_base_of_v<FeatureConfiguration, FC>;

template <typename F>
concept IsFeature = requires {
                        typename F::ConfigurationType;
                        requires IsFeatureConfiguration<typename F::ConfigurationType>;
                    };

template <IsFeatureConfiguration FC> class SpecificFeature : public Feature<FC> {
public:
    using ConfigurationType = FC;
};

class AbstractConfiguredFeature {
    //
};

template <IsFeatureConfiguration FC, IsFeature F> class ConfiguredFeature : public AbstractConfiguredFeature {
    //
};

class FeatureConfiguration {
public:
    vector<shared_ptr<AbstractConfiguredFeature>> getFeatures() {
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

// Providers

class HeightProvider {
public:
    virtual int sample(shared_ptr<Random> random, WorldGenerationContext context) = 0;
};

class FloatProvider {
public:
    virtual float sample(Random random) = 0;
    virtual float getMinValue() = 0;
    virtual float getMaxValue() = 0;
};

// ...

class CarverConfiguration : public ProbabilityFeatureConfiguration {
public:
    shared_ptr<HeightProvider> y;
    shared_ptr<FloatProvider> yScale;
    shared_ptr<VerticalAnchor> lavaLevel;

    CarverConfiguration(float probability, shared_ptr<HeightProvider> y, shared_ptr<FloatProvider> yScale,
                        shared_ptr<VerticalAnchor> lavaLevel)
        : ProbabilityFeatureConfiguration(probability), y(y), yScale(yScale), lavaLevel(lavaLevel) {
    }
};

class CaveCarverConfiguration : public CarverConfiguration {
public:
    shared_ptr<FloatProvider> horizontalRadiusMultiplier;
    shared_ptr<FloatProvider> verticalRadiusMultiplier;
    shared_ptr<FloatProvider> floorLevel;

    CaveCarverConfiguration(float probability, shared_ptr<HeightProvider> y, shared_ptr<FloatProvider> yScale,
                            shared_ptr<VerticalAnchor> lavaLevel, shared_ptr<FloatProvider> horizontalRadiusMultiplier,
                            shared_ptr<FloatProvider> verticalRadiusMultiplier, shared_ptr<FloatProvider> floorLevel)
        : CarverConfiguration(probability, y, yScale, lavaLevel),
          horizontalRadiusMultiplier(horizontalRadiusMultiplier), verticalRadiusMultiplier(verticalRadiusMultiplier),
          floorLevel(floorLevel) {
    }

    CaveCarverConfiguration(float probability, shared_ptr<HeightProvider> y, shared_ptr<FloatProvider> yScale,
                            shared_ptr<VerticalAnchor> lavaLevel, bool unused,
                            shared_ptr<FloatProvider> horizontalRadiusMultiplier,
                            shared_ptr<FloatProvider> verticalRadiusMultiplier, shared_ptr<FloatProvider> floorLevel)
        : CaveCarverConfiguration(probability, y, yScale, lavaLevel, horizontalRadiusMultiplier,
                                  verticalRadiusMultiplier, floorLevel) {
    }

    CaveCarverConfiguration(shared_ptr<CarverConfiguration> config,
                            shared_ptr<FloatProvider> horizontalRadiusMultiplier,
                            shared_ptr<FloatProvider> verticalRadiusMultiplier, shared_ptr<FloatProvider> floorLevel)
        : CaveCarverConfiguration(config->probability, config->y, config->yScale, config->lavaLevel,
                                  horizontalRadiusMultiplier, verticalRadiusMultiplier, floorLevel) {
    }
};

class ConfiguredWorldCarver {
    //
};

class BiomeGenerationSettings {
    //
};