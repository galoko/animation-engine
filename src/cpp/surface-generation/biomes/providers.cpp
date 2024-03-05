#include "providers.hpp"

shared_ptr<ConstantFloat> ConstantFloat::ZERO;

void ConstantFloat::initialize() {
    ConstantFloat::ZERO = make_shared<ConstantFloat>(0.0F);
}

void ConstantFloat::finalize() {
    ConstantFloat::ZERO = nullptr;
}