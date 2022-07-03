#include "biome-source.hpp"
#include "biomes.hpp"
#include "climate.hpp"
#include "overworld-biome-builder.hpp"

using namespace std;

MultiNoiseBiomeSource::Preset *MultiNoiseBiomeSource::Preset::OVERWORLD =
    new MultiNoiseBiomeSource::Preset("overworld", []() -> Climate::ParameterList<function<Biomes(void)>> * {
        vector<pair<Climate::ParameterPoint *, function<Biomes(void)>>> *builder =
            new vector<pair<Climate::ParameterPoint *, function<Biomes(void)>>>();

        OverworldBiomeBuilder().addBiomes([builder](pair<Climate::ParameterPoint *, Biomes> *biomePair) -> void {
            Biomes biome = biomePair->second;
            builder->push_back(pair(biomePair->first, [biome]() -> Biomes { return biome; }));
        });
        return new Climate::ParameterList<function<Biomes(void)>>(builder);
    });

MultiNoiseBiomeSource::Preset *MultiNoiseBiomeSource::Preset::NETHER =
    new MultiNoiseBiomeSource::Preset("nether", []() -> Climate::ParameterList<function<Biomes(void)>> * {
        return new Climate::ParameterList<function<Biomes(void)>>(
            new vector<pair<Climate::ParameterPoint *, function<Biomes(void)>>>(
                {pair(Climate::parameters(0.0F, 0.0F, 0.0F, 0.0F, 0.0F, 0.0F, 0.0F),
                      []() -> Biomes { return Biomes::NETHER_WASTES; }),
                 pair(Climate::parameters(0.0F, -0.5F, 0.0F, 0.0F, 0.0F, 0.0F, 0.0F),
                      []() -> Biomes { return Biomes::SOUL_SAND_VALLEY; }),
                 pair(Climate::parameters(0.4F, 0.0F, 0.0F, 0.0F, 0.0F, 0.0F, 0.0F),
                      []() -> Biomes { return Biomes::CRIMSON_FOREST; }),
                 pair(Climate::parameters(0.0F, 0.5F, 0.0F, 0.0F, 0.0F, 0.0F, 0.375F),
                      []() -> Biomes { return Biomes::WARPED_FOREST; }),
                 pair(Climate::parameters(-0.5F, 0.0F, 0.0F, 0.0F, 0.0F, 0.0F, 0.175F),
                      []() -> Biomes { return Biomes::BASALT_DELTAS; })}));
    });