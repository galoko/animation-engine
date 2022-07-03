#pragma once

class NoiseChunk {
public:
    class NoiseFiller {
    public:
        virtual double calculateNoise(int x, int y, int z) = 0;
    };
};