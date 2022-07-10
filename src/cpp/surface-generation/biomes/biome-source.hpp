#pragma once

#include "biomes.hpp"
#include "climate.hpp"

#include <functional>
#include <set>
#include <vector>

using namespace std;

class BiomeResolver {
public:
    virtual Biomes getNoiseBiome(int32_t x, int32_t y, int32_t z, Climate::Sampler *sampler) = 0;
};

class PlacedFeature {};

class BiomeSource : public BiomeResolver {
private:
    class StepFeatureData {
        vector<PlacedFeature *> *features;
        function<int32_t(PlacedFeature)> indexMapping;
        StepFeatureData(vector<PlacedFeature *> *features, function<int32_t(PlacedFeature)> indexMapping) {
            this->features = features;
            this->indexMapping = indexMapping;
        };
    };

public:
    set<Biomes> *possibleBiomes;
    vector<BiomeSource::StepFeatureData *> *featuresPerStep;

    BiomeSource(vector<function<Biomes(void)>> *biomes) {
        this->possibleBiomes = new set<Biomes>();
        for (function<Biomes(void)> &biomeSupplier : *biomes) {
            this->possibleBiomes->insert(biomeSupplier());
        }
        // this->featuresPerStep = this->buildFeaturesPerStep(biomes, true);
    }

    BiomeSource(vector<Biomes> *biomes) {
        this->possibleBiomes = new set<Biomes>(make_move_iterator(biomes->begin()), make_move_iterator(biomes->end()));
        // this->featuresPerStep = this->buildFeaturesPerStep(biomes, true);
    }

private:
    /*
    List<BiomeSource.StepFeatureData> buildFeaturesPerStep(List<Biome> p_186728_, bool p_186729_) {
        Object2IntMap<PlacedFeature> object2intmap = new Object2IntOpenHashMap<>();
        MutableInt mutableint = new MutableInt(0);

        record FeatureData(int32_t featureIndex, int32_t step, PlacedFeature feature) {
        }

        Comparator<FeatureData> comparator =
            Comparator.comparingInt(FeatureData::step).thenComparingInt(FeatureData::featureIndex);
        Map<FeatureData, Set<FeatureData>> map = new TreeMap<>(comparator);
        int32_t i = 0;

        for (Biome biome : p_186728_) {
            List<FeatureData> list = Lists.newArrayList();
            List<List<Supplier<PlacedFeature>>> list1 = biome.getGenerationSettings().features();
            i = Math.max(i, list1.size());

            for (int32_t j = 0; j < list1.size(); ++j) {
                for (Supplier<PlacedFeature> supplier : list1.get(j)) {
                    PlacedFeature placedfeature = supplier.get();
                    list.add(new FeatureData(object2intmap.computeIfAbsent(
                                                 placedfeature, (p_186732_)->{ return mutableint.getAndIncrement(); }),
                                             j, placedfeature));
                }
            }

            for (int32_t l = 0; l < list.size(); ++l) {
                Set<FeatureData> set2 = map.computeIfAbsent(
                    list.get(l), (p_186723_)->{ return new TreeSet<>(comparator); });
                if (l < list.size() - 1) {
                    set2.add(list.get(l + 1));
                }
            }
        }

        Set<FeatureData> set = new TreeSet<>(comparator);
        Set<FeatureData> set1 = new TreeSet<>(comparator);
        List<FeatureData> list2 = Lists.newArrayList();

        for (FeatureData biomesource$1featuredata : map.keySet()) {
            if (!set1.isEmpty()) {
                throw new IllegalStateException("You somehow broke the universe; DFS bork (iteration finished with "
                                                "non-empty in-progress vertex set");
            }

            if (!set.contains(biomesource$1featuredata) &&
                Graph.depthFirstSearch(map, set, set1, list2::add, biomesource$1featuredata)) {
                if (!p_186729_) {
                    throw new IllegalStateException("Feature order cycle found");
                }

                List<Biome> list3 = new ArrayList<>(p_186728_);

                int32_t k1;
                do {
                    k1 = list3.size();
                    ListIterator<Biome> listiterator = list3.listIterator();

                    while (listiterator.hasNext()) {
                        Biome biome1 = listiterator.next();
                        listiterator.remove();

                        try {
                            this->buildFeaturesPerStep(list3, false);
                        } catch (IllegalStateException illegalstateexception) {
                            continue;
                        }

                        listiterator.add(biome1);
                    }
                } while (k1 != list3.size());

                throw new IllegalStateException("Feature order cycle found, involved biomes: " + list3);
            }
        }

        Collections.reverse(list2);
        Builder<BiomeSource.StepFeatureData> builder = ImmutableList.builder();

        for (int32_t i1 = 0; i1 < i; ++i1) {
            int32_t j1 = i1;
            List<PlacedFeature> list4 = list2.stream()
                                            .filter((p_186720_)->{ return p_186720_.step() == j1; })
                                            .map(FeatureData::feature)
                                            .collect(Collectors.toList());
            int32_t l1 = list4.size();
            Object2IntMap<PlacedFeature> object2intmap1 =
                new Object2IntOpenCustomHashMap<>(l1, Util.identityStrategy());

            for (int32_t k = 0; k < l1; ++k) {
                object2intmap1.put(list4.get(k), k);
            }

            builder.add(new BiomeSource.StepFeatureData(list4, object2intmap1));
        }

        return builder.build();
    }
    */

    /*
    set<Biome> getBiomesWithin(int32_t p_186705_, int32_t p_186706_, int32_t p_186707_, int32_t p_186708_,
                               Climate.Sampler p_186709_) {
        int32_t i = QuartPos.fromBlock(p_186705_ - p_186708_);
        int32_t j = QuartPos.fromBlock(p_186706_ - p_186708_);
        int32_t k = QuartPos.fromBlock(p_186707_ - p_186708_);
        int32_t l = QuartPos.fromBlock(p_186705_ + p_186708_);
        int32_t i1 = QuartPos.fromBlock(p_186706_ + p_186708_);
        int32_t j1 = QuartPos.fromBlock(p_186707_ + p_186708_);
        int32_t k1 = l - i + 1;
        int32_t l1 = i1 - j + 1;
        int32_t i2 = j1 - k + 1;
        Set<Biome> set = Sets.newHashSet();

        for (int32_t j2 = 0; j2 < i2; ++j2) {
            for (int32_t k2 = 0; k2 < k1; ++k2) {
                for (int32_t l2 = 0; l2 < l1; ++l2) {
                    int32_t i3 = i + k2;
                    int32_t j3 = j + l2;
                    int32_t k3 = k + j2;
                    set.add(this->getNoiseBiome(i3, j3, k3, p_186709_));
                }
            }
        }

        return set;
    }

    BlockPos *findBiomeHorizontal(int32_t p_186711_, int32_t p_186712_, int32_t p_186713_, int32_t p_186714_,
                                  Predicate<Biome> p_186715_, Random p_186716_, Climate.Sampler p_186717_) {
        return this->findBiomeHorizontal(p_186711_, p_186712_, p_186713_, p_186714_, 1, p_186715_, p_186716_, false,
                                        p_186717_);
    }

    BlockPos *findBiomeHorizontal(int32_t p_186696_, int32_t p_186697_, int32_t p_186698_, int32_t p_186699_,
                                  int32_t p_186700_, Predicate<Biome> p_186701_, Random p_186702_, bool p_186703_,
                                  Climate.Sampler p_186704_) {
        int32_t i = QuartPos.fromBlock(p_186696_);
        int32_t j = QuartPos.fromBlock(p_186698_);
        int32_t k = QuartPos.fromBlock(p_186699_);
        int32_t l = QuartPos.fromBlock(p_186697_);
        BlockPos blockpos = null;
        int32_t i1 = 0;
        int32_t j1 = p_186703_ ? 0 : k;

        for (int32_t k1 = j1; k1 <= k; k1 += p_186700_) {
            for (int32_t l1 = SharedConstants.debugGenerateSquareTerrainWithoutNoise ? 0 : -k1; l1 <= k1;
                 l1 += p_186700_) {
                bool flag = Math.abs(l1) == k1;

                for (int32_t i2 = -k1; i2 <= k1; i2 += p_186700_) {
                    if (p_186703_) {
                        bool flag1 = Math.abs(i2) == k1;
                        if (!flag1 && !flag) {
                            continue;
                        }
                    }

                    int32_t k2 = i + i2;
                    int32_t j2 = j + l1;
                    if (p_186701_.test(this->getNoiseBiome(k2, l, j2, p_186704_))) {
                        if (blockpos == null || p_186702_.nextInt(i1 + 1) == 0) {
                            blockpos = new BlockPos(QuartPos.toBlock(k2), p_186697_, QuartPos.toBlock(j2));
                            if (p_186703_) {
                                return blockpos;
                            }
                        }

                        ++i1;
                    }
                }
            }
        }

        return blockpos;
    }
    */

public:
    virtual BiomeSource *withSeed(int64_t seed) = 0;

    virtual Biomes getNoiseBiome(int32_t x, int32_t y, int32_t z, Climate::Sampler *sampler) = 0;
};

class MultiNoiseBiomeSource : public BiomeSource {
public:
    class Preset;

    class PresetInstance {
    public:
        MultiNoiseBiomeSource::Preset *preset;

        PresetInstance(MultiNoiseBiomeSource::Preset *preset) {
            this->preset = preset;
        }

        MultiNoiseBiomeSource *biomeSource() {
            return this->preset->biomeSource(this, true);
        }
    };

    class Preset {
    public:
        static MultiNoiseBiomeSource::Preset *OVERWORLD;
        static MultiNoiseBiomeSource::Preset *NETHER;
        string name;

    private:
        function<Climate::ParameterList<function<Biomes(void)>> *(void)> parameterSource;

    public:
        Preset(string name, function<Climate::ParameterList<function<Biomes(void)>> *(void)> parameterSource) {
            this->name = name;
            this->parameterSource = parameterSource;
        }

        MultiNoiseBiomeSource *biomeSource(MultiNoiseBiomeSource::PresetInstance *presetInstance,
                                           bool usePresetInstance) {
            Climate::ParameterList<function<Biomes(void)>> *parameterlist = this->parameterSource();
            return new MultiNoiseBiomeSource(parameterlist, usePresetInstance ? presetInstance : nullptr);
        }

        MultiNoiseBiomeSource *biomeSource(bool usePresetInstance) {
            return this->biomeSource(new MultiNoiseBiomeSource::PresetInstance(this), usePresetInstance);
        }

        MultiNoiseBiomeSource *biomeSource() {
            return this->biomeSource(true);
        }
    };

private:
    Climate::ParameterList<function<Biomes(void)>> *parameters;

    MultiNoiseBiomeSource::PresetInstance *preset;

    MultiNoiseBiomeSource(Climate::ParameterList<function<Biomes(void)>> *parameters)
        : MultiNoiseBiomeSource(parameters, nullptr) {
    }

    static vector<function<Biomes(void)>> *getBiomes(Climate::ParameterList<function<Biomes(void)>> *parameters) {
        vector<function<Biomes(void)>> *biomes = new vector<function<Biomes(void)>>();
        for (pair<Climate::ParameterPoint *, function<Biomes(void)>> &pair : *parameters->values) {
            biomes->push_back(pair.second);
        }

        return biomes;
    }

    MultiNoiseBiomeSource(Climate::ParameterList<function<Biomes(void)>> *parameters,
                          MultiNoiseBiomeSource::PresetInstance *preset)
        : BiomeSource(getBiomes(parameters)) {
        this->preset = preset;
        this->parameters = parameters;
    }

public:
    BiomeSource *withSeed(int64_t seed) override {
        return this;
    }

    bool stable(MultiNoiseBiomeSource::Preset *preset) {
        return this->preset != nullptr && this->preset->preset == preset;
    }

    Biomes getNoiseBiome(int32_t x, int32_t y, int32_t z, Climate::Sampler *sampler) override {
        return this->getNoiseBiome(sampler->sample(x, y, z));
    }

    Biomes getNoiseBiome(Climate::TargetPoint *targetPoint) {
        return this->parameters->findValueBruteForce(targetPoint, []() -> Biomes { return Biomes::THE_VOID; })();
    }
};