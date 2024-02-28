#pragma once

#include <concepts>
#include <map>
#include <memory>
#include <set>
#include <type_traits>
#include <vector>

#include "aquifer.hpp"
#include "biome-manager.hpp"
#include "blocks.hpp"
#include "carvers.fwd.hpp"
#include "carvers.hpp"
#include "chunks.fwd.hpp"
#include "features.hpp"
#include "random.hpp"
#include "vertical-anchor.hpp"
#include "world-generation-context.hpp"

using namespace std;

// Configurations

// Functional classes

class BiomeGenerationSettings {
private:
    map<GenerationStep::Carving, vector<shared_ptr<ConfiguredWorldCarver>>> carvers;
    // vector<vector<PlacedFeature>> features;

public:
    BiomeGenerationSettings(map<GenerationStep::Carving, vector<shared_ptr<ConfiguredWorldCarver>>> carvers)
        : carvers(carvers) {
    }

    class Builder {
    private:
        map<GenerationStep::Carving, vector<shared_ptr<ConfiguredWorldCarver>>> carvers;
        // vector<vector<PlacedFeature>> features;

    public:
        Builder *addCarver(GenerationStep::Carving carvingBlock, shared_ptr<ConfiguredWorldCarver> configuredCarver) {
            auto it = this->carvers.find(carvingBlock);
            if (it == this->carvers.end()) {
                vector<shared_ptr<ConfiguredWorldCarver>> newList({configuredCarver});
                this->carvers.emplace(carvingBlock, newList);
                it = this->carvers.find(carvingBlock);
            } else {
                it->second.push_back(configuredCarver);
            }

            return this;
        }

        shared_ptr<BiomeGenerationSettings> build() {
            return make_shared<BiomeGenerationSettings>(this->carvers);
        }
    };

    vector<shared_ptr<ConfiguredWorldCarver>> getCarvers(GenerationStep::Carving carvingBlock) {
        vector<shared_ptr<ConfiguredWorldCarver>> emptyVector;

        auto it = this->carvers.find(carvingBlock);
        return it != this->carvers.end() ? it->second : emptyVector;
    }
};