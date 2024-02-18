#include "vertical-anchor.hpp"

shared_ptr<VerticalAnchor> VerticalAnchor::BOTTOM;
shared_ptr<VerticalAnchor> VerticalAnchor::TOP;

void VerticalAnchor::initialize() {
    VerticalAnchor::BOTTOM = VerticalAnchor::aboveBottom(0);
    VerticalAnchor::TOP = VerticalAnchor::belowTop(0);
}

void VerticalAnchor::finalize() {
    VerticalAnchor::BOTTOM = nullptr;
    VerticalAnchor::TOP = nullptr;
}

class AbsoluteVerticalAnchor : public VerticalAnchor {
public:
    AbsoluteVerticalAnchor(int32_t value) : VerticalAnchor(value) {
    }

    virtual ~AbsoluteVerticalAnchor() {
    }

    int32_t resolveY(const WorldGenerationContext &ctx) {
        return this->value;
    }
};

class AboveBottomVerticalAnchor : public VerticalAnchor {
public:
    AboveBottomVerticalAnchor(int32_t value)
        : VerticalAnchor(value){

          };

    virtual ~AboveBottomVerticalAnchor() {
    }

    int32_t resolveY(const WorldGenerationContext &ctx) {
        return ctx.getMinGenY() + this->value;
    }
};

class BelowTopVerticalAnchor : public VerticalAnchor {
public:
    BelowTopVerticalAnchor(int32_t value)
        : VerticalAnchor(value){

          };

    virtual ~BelowTopVerticalAnchor() {
    }

    int32_t resolveY(const WorldGenerationContext &ctx) {
        return ctx.getGenDepth() - 1 + ctx.getMinGenY() - this->value;
    }
};

shared_ptr<VerticalAnchor> makeAbsolute(int32_t value) {
    return make_shared<AbsoluteVerticalAnchor>(value);
}

shared_ptr<VerticalAnchor> makeAboveBottom(int32_t value) {
    return make_shared<AboveBottomVerticalAnchor>(value);
}

shared_ptr<VerticalAnchor> makeBelowTop(int32_t value) {
    return make_shared<BelowTopVerticalAnchor>(value);
}