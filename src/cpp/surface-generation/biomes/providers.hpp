#pragma once

#include <memory>
#include <stdexcept>

#include "random.hpp"
#include "vertical-anchor.hpp"
#include "world-generation-context.hpp"

// Providers

class HeightProvider {
public:
    virtual int32_t sample(shared_ptr<Random> random, WorldGenerationContext context) = 0;

    virtual ~HeightProvider() {
        //
    }
};

class UniformHeight : public HeightProvider {
private:
    shared_ptr<VerticalAnchor> minInclusive;
    shared_ptr<VerticalAnchor> maxInclusive;

public:
    UniformHeight(shared_ptr<VerticalAnchor> minInclusive, shared_ptr<VerticalAnchor> maxInclusive)
        : minInclusive(minInclusive), maxInclusive(maxInclusive) {
    }

    static shared_ptr<UniformHeight> of(shared_ptr<VerticalAnchor> minInclusive,
                                        shared_ptr<VerticalAnchor> maxInclusive) {
        return make_shared<UniformHeight>(minInclusive, maxInclusive);
    }

    virtual int32_t sample(shared_ptr<Random> random, WorldGenerationContext context) {
        int32_t minY = this->minInclusive->resolveY(context);
        int32_t maxY = this->maxInclusive->resolveY(context);
        if (minY > maxY) {
            return minY;
        } else {
            return Rnd::randomBetweenInclusive(random, minY, maxY);
        }
    }
};

class FloatProvider {
public:
    virtual float sample(shared_ptr<Random> random) = 0;
    virtual float getMinValue() = 0;
    virtual float getMaxValue() = 0;

    virtual ~FloatProvider() {
        //
    }
};

class UniformFloat : public FloatProvider {
private:
    float minInclusive;
    float maxExclusive;

public:
    UniformFloat(float minInclusive, float maxExclusive) : minInclusive(minInclusive), maxExclusive(maxExclusive) {
    }
    static shared_ptr<UniformFloat> of(float minInclusive, float maxExclusive) {
        if (maxExclusive <= minInclusive) {
            throw new runtime_error("Max must exceed min");
        } else {
            return make_shared<UniformFloat>(minInclusive, maxExclusive);
        }
    }

    virtual float sample(shared_ptr<Random> random) {
        return Rnd::randomBetween(random, this->minInclusive, this->maxExclusive);
    }

    virtual float getMinValue() {
        return this->minInclusive;
    }

    virtual float getMaxValue() {
        return this->maxExclusive;
    }
};

class ConstantFloat : public FloatProvider {
private:
    float value;

public:
    ConstantFloat(float value) : value(value) {
    }

    static shared_ptr<ConstantFloat> ZERO;

    static shared_ptr<ConstantFloat> of(float value) {
        return value == 0.0F ? ZERO : make_shared<ConstantFloat>(value);
    }

    float getValue() {
        return this->value;
    }

    virtual float sample(shared_ptr<Random> unused) {
        return this->value;
    }

    virtual float getMinValue() {
        return this->value;
    }

    virtual float getMaxValue() {
        return this->value + 1.0F;
    }

    static void initialize();
    static void finalize();
};

class TrapezoidFloat : public FloatProvider {
private:
    float min;
    float max;
    float plateau;

public:
    TrapezoidFloat(float min, float max, float plateau) {
        this->min = min;
        this->max = max;
        this->plateau = plateau;
    }

    static shared_ptr<TrapezoidFloat> of(float min, float max, float plateau) {
        return make_shared<TrapezoidFloat>(min, max, plateau);
    }

    virtual float sample(shared_ptr<Random> random) {
        float range = this->max - this->min;
        float halfRangeMinusPlateau = (range - this->plateau) / 2.0F;
        float halfRangePlusPlateau = range - halfRangeMinusPlateau;

        float unknown_0 = random->nextFloat();
        float unknown_1 = random->nextFloat();
        return this->min + unknown_0 * halfRangePlusPlateau + unknown_1 * halfRangeMinusPlateau;
    }

    virtual float getMinValue() {
        return this->min;
    }

    virtual float getMaxValue() {
        return this->max;
    }
};