#include "providers.hpp"

shared_ptr<ConstantFloat> ConstantFloat::ZERO;

void ConstantFloat::init() {
    ConstantFloat::ZERO = make_shared<ConstantFloat>(0.0F);
}

void ConstantFloat::free() {
    ConstantFloat::ZERO = nullptr;
}