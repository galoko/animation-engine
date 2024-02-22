#pragma once

#include <memory>

using namespace std;

class MobSpawnSettings {
public:
    class Builder {
    public:
        shared_ptr<MobSpawnSettings> build() {
            return make_shared<MobSpawnSettings>();
        }
    };
};