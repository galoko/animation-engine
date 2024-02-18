#pragma once

#include <cinttypes>
#include <memory>

#include "world-generation-context.hpp"

using namespace std;

class VerticalAnchor;

shared_ptr<VerticalAnchor> makeAbsolute(int32_t value);
shared_ptr<VerticalAnchor> makeAboveBottom(int32_t value);
shared_ptr<VerticalAnchor> makeBelowTop(int32_t value);

class VerticalAnchor {
private:
    static shared_ptr<VerticalAnchor> BOTTOM;
    static shared_ptr<VerticalAnchor> TOP;

protected:
    int32_t value;

    VerticalAnchor(int32_t value) : value(value) {
    }

public:
    virtual int32_t resolveY(const WorldGenerationContext &ctx) = 0;

    static shared_ptr<VerticalAnchor> absolute(int32_t value) {
        return makeAbsolute(value);
    }

    static shared_ptr<VerticalAnchor> aboveBottom(int32_t value) {
        return makeAboveBottom(value);
    }

    static shared_ptr<VerticalAnchor> belowTop(int32_t value) {
        return makeBelowTop(value);
    }

    static shared_ptr<VerticalAnchor> bottom() {
        return BOTTOM;
    }

    static shared_ptr<VerticalAnchor> top() {
        return TOP;
    }

    static void initialize();
    static void finalize();
};