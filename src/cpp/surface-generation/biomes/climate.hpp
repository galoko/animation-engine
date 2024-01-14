#pragma once

#include <algorithm>
#include <utility>

#include <cstdint>

#include "../../utils/memory-debug.hpp"
#include "mth.hpp"

using namespace std;

class Climate {
private:
    static constexpr float QUANTIZATION_FACTOR = 10000.0F;

public:
    class TargetPoint {
    public:
        int64_t temperature;
        int64_t humidity;
        int64_t continentalness;
        int64_t erosion;
        int64_t depth;
        int64_t weirdness;
        TargetPoint(int64_t temperature, int64_t humidity, int64_t continentalness, int64_t erosion, int64_t depth,
                    int64_t weirdness);
    };

    class Parameter {
    public:
        int64_t min, max;

        Parameter(int64_t min, int64_t max);

        static Climate::Parameter const point(float value);

        static Climate::Parameter const span(float min, float max);
        static Climate::Parameter const span(Climate::Parameter const &minParameter,
                                             Climate::Parameter const &maxParameter);

        int64_t distance(int64_t value) const;
        int64_t distance(Climate::Parameter const &parameter) const;

        Climate::Parameter const span(Climate::Parameter const &parameterToMerge) const;
    };

    class ParameterPoint {
    public:
        Climate::Parameter temperature;
        Climate::Parameter humidity;
        Climate::Parameter continentalness;
        Climate::Parameter erosion;
        Climate::Parameter depth;
        Climate::Parameter weirdness;
        int64_t offset;

        ParameterPoint(Climate::Parameter const &temperature, Climate::Parameter const &humidity,
                       Climate::Parameter const &continentalness, Climate::Parameter const &erosion,
                       Climate::Parameter const &depth, Climate::Parameter const &weirdness, int64_t offset);

        int64_t fitness(Climate::TargetPoint const &otherPoint) const;
    };

    static Climate::TargetPoint const target(float temperature, float humidity, float continentalness, float erosion,
                                             float depth, float weirdness);

    static Climate::ParameterPoint const parameters(float temperature, float humidity, float continentalness,
                                                    float erosion, float depth, float weirdness, float offset);
    static Climate::ParameterPoint const parameters(Climate::Parameter const &temperature,
                                                    Climate::Parameter const &humidity,
                                                    Climate::Parameter const &continentalness,
                                                    Climate::Parameter const &erosion, Climate::Parameter const &depth,
                                                    Climate::Parameter const &weirdness, float offset);

    static constexpr inline int64_t quantizeCoord(float coord) {
        return (int64_t)(coord * QUANTIZATION_FACTOR);
    }

    static constexpr inline float unquantizeCoord(int64_t coord) {
        return (float)coord / QUANTIZATION_FACTOR;
    }

    template <typename T> class ParameterList {
    public:
        vector<pair<Climate::ParameterPoint, T>> values;

        // ParameterList

        ParameterList(vector<pair<Climate::ParameterPoint, T>> const &values) : values(values) {
        }

        T findValueBruteForce(Climate::TargetPoint const &targetPoint, T defaultValue) const {
            int64_t minDistance = numeric_limits<int64_t>::max();
            T result = defaultValue;

            for (const pair<Climate::ParameterPoint, T> &pair : this->values) {
                int64_t distance = pair.first.fitness(targetPoint);
                if (distance < minDistance) {
                    minDistance = distance;
                    result = pair.second;
                }
            }

            return result;
        }
    };

    class Sampler {
    public:
        virtual Climate::TargetPoint const sample(int32_t x, int32_t y, int32_t z) const = 0;
        virtual ~Sampler() {
            objectFreed("Climate::Sampler");
        }
    };

    // RTree

    template <typename T> class RTree {
    private:
        static const int CHILDREN_PER_NODE = 10;
        Climate::RTree::Node<T> root;
        Climate::RTree::Leaf<T> lastResult

        RTree(Climate::RTree::Node<T> root)
            : root(root) {
            this.root = p_186913_;
        }

    public:
        static<T> Climate::RTree<T> create(List<Pair<Climate::ParameterPoint, T>> p_186936_) {
            if (p_186936_.isEmpty()) {
                throw new IllegalArgumentException("Need at least one value to build the search tree.");
            } else {
                int i = p_186936_.get(0).getFirst().parameterSpace().size();
                if (i != 7) {
                    throw new IllegalStateException("Expecting parameter space to be 7, got " + i);
                } else {
                    List<Climate::RTree.Leaf<T>> list =
                        p_186936_.stream()
                            .map((p_186934_)->{
                                return new Climate::RTree.Leaf<T>(p_186934_.getFirst(), p_186934_.getSecond());
                            })
                            .collect(Collectors.toCollection(ArrayList::new));
                    return new Climate::RTree<>(build(i, list));
                }
            }
        }

    private static <T> Climate::RTree.Node<T> build(int p_186921_, List<? extends Climate::RTree.Node<T>> p_186922_) {
            if (p_186922_.isEmpty()) {
                throw new IllegalStateException("Need at least one child to build a node");
            } else if (p_186922_.size() == 1) {
                return p_186922_.get(0);
            } else if (p_186922_.size() <= 10) {
                p_186922_.sort(Comparator.comparingLong((p_186916_)->{
                    long i1 = 0L;

                    for (int j1 = 0; j1 < p_186921_; ++j1) {
                        Climate::Parameter climate$parameter = p_186916_.parameterSpace[j1];
                        i1 += Math.abs((climate$parameter.min() + climate$parameter.max()) / 2L);
                    }

                    return i1;
                }));
                return new Climate::RTree.SubTree<>(p_186922_);
            } else {
                long i = Long.MAX_VALUE;
                int j = -1;
                List<Climate::RTree.SubTree<T>> list = null;

                for (int k = 0; k < p_186921_; ++k) {
                    sort(p_186922_, p_186921_, k, false);
                    List<Climate::RTree.SubTree<T>> list1 = bucketize(p_186922_);
                    long l = 0L;

                    for (Climate::RTree.SubTree<T> subtree : list1) {
                        l += cost(subtree.parameterSpace);
                    }

                    if (i > l) {
                        i = l;
                        j = k;
                        list = list1;
                    }
                }

                sort(list, p_186921_, j, true);
                return new Climate::RTree.SubTree<>(
                    list.stream()
                        .map((p_186919_)->{ return build(p_186921_, Arrays.asList(p_186919_.children)); })
                        .collect(Collectors.toList()));
            }
        }

    private static <T> void sort(List<? extends Climate::RTree.Node<T>> p_186938_, int p_186939_, int p_186940_, boolean p_186941_) {
            Comparator<Climate::RTree.Node<T>> comparator = comparator(p_186940_, p_186941_);

            for (int i = 1; i < p_186939_; ++i) {
                comparator = comparator.thenComparing(comparator((p_186940_ + i) % p_186939_, p_186941_));
            }

            p_186938_.sort(comparator);
        }

    private
        static<T> Comparator<Climate::RTree.Node<T>> comparator(int p_186924_, boolean p_186925_) {
            return Comparator.comparingLong((p_186929_)->{
                Climate::Parameter climate$parameter = p_186929_.parameterSpace[p_186924_];
                long i = (climate$parameter.min() + climate$parameter.max()) / 2L;
                return p_186925_ ? Math.abs(i) : i;
            });
        }

    private static <T> List<Climate::RTree.SubTree<T>> bucketize(List<? extends Climate::RTree.Node<T>> p_186945_) {
            List<Climate::RTree.SubTree<T>> list = Lists.newArrayList();
            List<Climate::RTree.Node<T>> list1 = Lists.newArrayList();
            int i = (int)Math.pow(10.0D, Math.floor(Math.log((double)p_186945_.size() - 0.01D) / Math.log(10.0D)));

            for (Climate::RTree.Node<T> node : p_186945_) {
                list1.add(node);
                if (list1.size() >= i) {
                    list.add(new Climate::RTree.SubTree<>(list1));
                    list1 = Lists.newArrayList();
                }
            }

            if (!list1.isEmpty()) {
                list.add(new Climate::RTree.SubTree<>(list1));
            }

            return list;
        }

    private
        static long cost(Climate::Parameter[] p_186943_) {
            long i = 0L;

            for (Climate::Parameter climate$parameter : p_186943_) {
                i += Math.abs(climate$parameter.max() - climate$parameter.min());
            }

            return i;
        }

        static <T> List<Climate::Parameter> buildParameterSpace(List<? extends Climate::RTree.Node<T>> p_186947_) {
            if (p_186947_.isEmpty()) {
                throw new IllegalArgumentException("SubTree needs at least one child");
            } else {
                int i = 7;
                List<Climate::Parameter> list = Lists.newArrayList();

                for (int j = 0; j < 7; ++j) {
                    list.add((Climate::Parameter)null);
                }

                for (Climate::RTree.Node<T> node : p_186947_) {
                    for (int k = 0; k < 7; ++k) {
                        list.set(k, node.parameterSpace[k].span(list.get(k)));
                    }
                }

                return list;
            }
        }

    public
        T search(Climate::TargetPoint p_186931_, Climate::DistanceMetric<T> p_186932_) {
            long[] along = p_186931_.toParameterArray();
            Climate::RTree.Leaf<T> leaf = this.root.search(along, this.lastResult.get(), p_186932_);
            this.lastResult.set(leaf);
            return leaf.value;
        }

        static final class Leaf<T> extends Climate::RTree.Node<T> {
            final T value;

            Leaf(Climate::ParameterPoint p_186950_, T p_186951_) {
                super(p_186950_.parameterSpace());
                this.value = p_186951_;
            }

        protected
            Climate::RTree.Leaf<T> search(long[] p_186953_, @Nullable Climate::RTree.Leaf<T> p_186954_,
                                          Climate::DistanceMetric<T> p_186955_) {
                return this;
            }
        }

        abstract static class Node<T> {
        protected
            final Climate::Parameter[] parameterSpace;

        protected
            Node(List<Climate::Parameter> parameters) {
                this.parameterSpace = parameters.toArray(new Climate::Parameter[0]);
            }

        protected
            abstract Climate::RTree.Leaf<T> search(long[] p_186961_, @Nullable Climate::RTree.Leaf<T> p_186962_,
                                                   Climate::DistanceMetric<T> p_186963_);

        protected
            long distance(long[] values) {
                long i = 0L;

                for (int j = 0; j < 7; ++j) {
                    i += Mth.square(this.parameterSpace[j].distance(values[j]));
                }

                return i;
            }

        public
            String toString() {
                return Arrays.toString((Object[])this.parameterSpace);
            }
        }

        static final class SubTree<T>
            extends Climate::RTree.Node<T> {
            final Climate::RTree.Node<T>[] children;

        protected SubTree(List<? extends Climate::RTree.Node<T>> p_186967_) {
                this(Climate::RTree.buildParameterSpace(p_186967_), p_186967_);
            }

        protected SubTree(List<Climate::Parameter> p_186969_, List<? extends Climate::RTree.Node<T>> p_186970_) {
                super(p_186969_);
                this.children = p_186970_.toArray(new Climate::RTree.Node[0]);
            }

        protected
            Climate::RTree.Leaf<T> search(long[] p_186972_, @Nullable Climate::RTree.Leaf<T> p_186973_,
                                          Climate::DistanceMetric<T> p_186974_) {
                long i = p_186973_ == null ? Long.MAX_VALUE : p_186974_.distance(p_186973_, p_186972_);
                Climate::RTree.Leaf<T> leaf = p_186973_;

                for (Climate::RTree.Node<T> node : this.children) {
                    long j = p_186974_.distance(node, p_186972_);
                    if (i > j) {
                        Climate::RTree.Leaf<T> leaf1 = node.search(p_186972_, leaf, p_186974_);
                        long k = node == leaf1 ? j : p_186974_.distance(leaf1, p_186972_);
                        if (i > k) {
                            i = k;
                            leaf = leaf1;
                        }
                    }
                }

                return leaf;
            }
        }
    };
};