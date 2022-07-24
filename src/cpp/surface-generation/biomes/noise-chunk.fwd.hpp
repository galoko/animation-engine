#pragma once

#include <functional>
#include <memory>

#include "blocks.hpp"

using namespace std;

class Sampler;
class NoiseChunk;

using InterpolatableNoise = function<shared_ptr<Sampler>(shared_ptr<NoiseChunk>)>;
using NoiseFiller = function<double(int32_t x, int32_t y, int32_t z)>;
using BlockStateFiller = function<BlockState(int32_t x, int32_t y, int32_t z)>;
