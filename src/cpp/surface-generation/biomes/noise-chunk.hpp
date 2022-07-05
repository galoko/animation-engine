#pragma once

class NoiseChunk {
public:
    class NoiseFiller {
    public:
        virtual double calculateNoise(int32_t x, int32_t y, int32_t z) = 0;
    };

    int32_t preliminarySurfaceLevel(int32_t x, int32_t z) {
        // TODO
        return 0;
    }
};