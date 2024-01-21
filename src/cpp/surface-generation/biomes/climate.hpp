#pragma once

#include <algorithm>
#include <utility>

#include <cstdint>
#include <stdexcept>

#include "../../utils/memory-debug.hpp"
#include "biomes.hpp"
#include "mth.hpp"

using namespace std;

inline int64_t my_abs(int64_t x) {
    int64_t s = x >> 63;
    return (x ^ s) - s;
}

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

        vector<int64_t> toParameterArray() const {
            return {this->temperature,
                    this->humidity,
                    this->continentalness,
                    this->erosion,
                    this->depth,
                    this->weirdness,
                    0L};
        }
    };

    class Parameter {
    public:
        int64_t min, max;

        Parameter() : min(numeric_limits<int64_t>::max()), max(numeric_limits<int64_t>::min()){};
        Parameter(int64_t min, int64_t max);

        static Climate::Parameter const point(float value);

        static Climate::Parameter const span(float min, float max);
        static Climate::Parameter const span(Climate::Parameter const &minParameter,
                                             Climate::Parameter const &maxParameter);

        int64_t distance(int64_t value) const;
        int64_t distance(Climate::Parameter const &parameter) const;

        Climate::Parameter const span(Climate::Parameter const &parameterToMerge) const;

        bool isNull() const;
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

        const vector<Climate::Parameter> parameterSpace() const {
            return {this->temperature,
                    this->humidity,
                    this->continentalness,
                    this->erosion,
                    this->depth,
                    this->weirdness,
                    Climate::Parameter(this->offset, this->offset)};
        }
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

    class Sampler {
    public:
        virtual Climate::TargetPoint const sample(int32_t x, int32_t y, int32_t z) const = 0;
        virtual ~Sampler() {
            objectFreed("Climate::Sampler");
        }
    };

    // RTree

    class RTree {
    private:
        class Leaf;

        class Node {
            friend class RTree;

        protected:
            vector<Climate::Parameter> parameterSpace;

            Node(vector<Climate::Parameter> parameters) : parameterSpace(parameters) {
            }

            virtual ~Node() {
                //
            }

            virtual shared_ptr<Climate::RTree::Leaf> search(const vector<int64_t> &pointParameters,
                                                            shared_ptr<Climate::RTree::Leaf> leaf) = 0;

            int64_t distance(const vector<int64_t> &pointParameters) {
                int64_t sumSq = 0L;

                for (int32_t j = 0; j < 7; ++j) {
                    sumSq += Mth::square(this->parameterSpace[j].distance(pointParameters[j]));
                }

                return sumSq;
            }
        };

        class Leaf : public Climate::RTree::Node, public enable_shared_from_this<Climate::RTree::Leaf> {
        public:
            Biomes value;

            Leaf(Climate::ParameterPoint paramPoint, Biomes value) : Node(paramPoint.parameterSpace()), value(value) {
            }

        protected:
            virtual shared_ptr<Climate::RTree::Leaf> search(const vector<int64_t> &pointParameters,
                                                            shared_ptr<Climate::RTree::Leaf> leaf) override {
                return this->shared_from_this();
            }
        };

        class SubTree : public Climate::RTree::Node {
        public:
            vector<shared_ptr<Climate::RTree::Node>> children;

            SubTree(vector<shared_ptr<Climate::RTree::Node>> nodes)
                : SubTree(Climate::RTree::buildParameterSpace(nodes), nodes) {
            }

            SubTree(vector<Climate::Parameter> parameters, const vector<shared_ptr<Climate::RTree::Node>> &children)
                : Node(parameters), children(children) {
            }

            virtual shared_ptr<Climate::RTree::Leaf> search(const vector<int64_t> &pointParameters,
                                                            shared_ptr<Climate::RTree::Leaf> leaf) override {
                int64_t minDistance =
                    leaf == nullptr ? numeric_limits<int64_t>::max() : leaf->distance(pointParameters);
                shared_ptr<Climate::RTree::Leaf> result = leaf;

                for (shared_ptr<Climate::RTree::Node> child : this->children) {
                    int64_t childDistance = child->distance(pointParameters);
                    if (minDistance > childDistance) {
                        shared_ptr<Climate::RTree::Leaf> subLeaf = child->search(pointParameters, result);
                        int64_t subLeafDistance = child == subLeaf ? childDistance : subLeaf->distance(pointParameters);
                        if (minDistance > subLeafDistance) {
                            minDistance = subLeafDistance;
                            result = subLeaf;
                        }
                    }
                }

                return result;
            }
        };

    private:
        static const int32_t CHILDREN_PER_NODE = 10;
        shared_ptr<Climate::RTree::Node> root;
        shared_ptr<Climate::RTree::Leaf> lastResult;

        RTree(shared_ptr<Climate::RTree::Node> root) : root(root) {
        }

    public:
        static Climate::RTree create(const vector<pair<Climate::ParameterPoint, Biomes>> &data) {
            if (data.empty()) {
                throw new runtime_error("Need at least one value to build the search tree.");
            } else {
                int32_t dataSize = (int32_t)data[0].first.parameterSpace().size();
                if (dataSize != 7) {
                    throw new runtime_error("Expecting parameter space to be 7");
                } else {
                    vector<shared_ptr<Climate::RTree::Node>> list(data.size());
                    transform(
                        data.begin(), data.end(), list.begin(),
                        [](const pair<Climate::ParameterPoint, Biomes> &pair) -> shared_ptr<Climate::RTree::Leaf> {
                            return make_shared<Climate::RTree::Leaf>(pair.first, pair.second);
                        });
                    return Climate::RTree(build(dataSize, list));
                }
            }
        }

    private:
        static shared_ptr<Climate::RTree::Node> build(int32_t nodeCount,
                                                      vector<shared_ptr<Climate::RTree::Node>> &nodes) {
            if (nodes.empty()) {
                throw new runtime_error("Need at least one child to build a node");
            } else if (nodes.size() == 1) {
                return nodes[0];
            } else if (nodes.size() <= 10) {
                auto computeNodeValue = [nodeCount](const shared_ptr<Climate::RTree::Node> node) -> int64_t {
                    int64_t sum = 0L;

                    for (int32_t i = 0; i < nodeCount; ++i) {
                        Climate::Parameter parameter = node->parameterSpace[i];
                        sum += my_abs((parameter.min + parameter.max) / 2L);
                    }

                    return sum;
                };

                std::sort(nodes.begin(), nodes.end(),
                          [computeNodeValue](const shared_ptr<Climate::RTree::Node> left,
                                             const shared_ptr<Climate::RTree::Node> right) -> bool {
                              return computeNodeValue(left) < computeNodeValue(right);
                          });

                return make_shared<Climate::RTree::SubTree>(nodes);
            } else {
                int64_t minCost = numeric_limits<int64_t>::max();
                int32_t minCostIndex = -1;

                vector<shared_ptr<Climate::RTree::SubTree>> minCostList;

                for (int32_t k = 0; k < nodeCount; ++k) {
                    sort(nodes, nodeCount, k, false);
                    vector<shared_ptr<Climate::RTree::SubTree>> list = bucketize(nodes);
                    int64_t costSum = 0L;

                    for (shared_ptr<Climate::RTree::SubTree> subtree : list) {
                        costSum += cost(subtree->parameterSpace);
                    }

                    if (minCost > costSum) {
                        minCost = costSum;
                        minCostIndex = k;
                        minCostList = list;
                    }
                }

                sort_subtree(minCostList, nodeCount, minCostIndex, true);

                vector<shared_ptr<Climate::RTree::Node>> mappedList(minCostList.size());
                transform(minCostList.begin(), minCostList.end(), mappedList.begin(),
                          [nodeCount](const shared_ptr<Climate::RTree::SubTree> &subtree)
                              -> shared_ptr<Climate::RTree::Node> { return build(nodeCount, subtree->children); });

                return make_shared<Climate::RTree::SubTree>(mappedList);
            }
        }

        inline static int64_t getNodeValueForSort(shared_ptr<Climate::RTree::Node> node, int32_t index, bool doAbs) {
            Climate::Parameter parameter = node->parameterSpace[index];
            int64_t mean = (parameter.min + parameter.max) / 2L;
            return doAbs ? my_abs(mean) : mean;
        }

        static bool compareTwoNodesRecursive(shared_ptr<Climate::RTree::Node> left,
                                             shared_ptr<Climate::RTree::Node> right, int32_t index, int32_t nodeCount,
                                             bool doAbs) {
            for (int i = 0; i < nodeCount; i++) {
                int indexToCompare = (index + i) % nodeCount;
                int64_t leftValue = getNodeValueForSort(left, indexToCompare, doAbs);
                int64_t rightValue = getNodeValueForSort(right, indexToCompare, doAbs);

                if (leftValue < rightValue) {
                    return true;
                }
                if (leftValue > rightValue) {
                    return false;
                }
            }
            return false;
        }

        static void sort(vector<shared_ptr<Climate::RTree::Node>> &nodes, int32_t nodeCount, int32_t index,
                         bool doAbs) {
            std::sort(nodes.begin(), nodes.end(),
                      [doAbs, index, nodeCount](shared_ptr<Climate::RTree::Node> left,
                                                shared_ptr<Climate::RTree::Node> right) -> bool {
                          return compareTwoNodesRecursive(left, right, index, nodeCount, doAbs);
                      });
        }

        static void sort_subtree(vector<shared_ptr<Climate::RTree::SubTree>> &nodes, int32_t nodeCount, int32_t index,
                                 bool doAbs) {
            std::sort(nodes.begin(), nodes.end(),
                      [doAbs, index, nodeCount](shared_ptr<Climate::RTree::SubTree> left,
                                                shared_ptr<Climate::RTree::SubTree> right) -> bool {
                          return compareTwoNodesRecursive(left, right, index, nodeCount, doAbs);
                      });
        }

        static vector<shared_ptr<Climate::RTree::SubTree>> bucketize(vector<shared_ptr<Climate::RTree::Node>> nodes) {
            vector<shared_ptr<Climate::RTree::SubTree>> list;
            vector<shared_ptr<Climate::RTree::Node>> list1;

            int32_t i = (int32_t)pow(10.0, floor(log((double)nodes.size() - 0.01) / log(10.0)));

            for (shared_ptr<Climate::RTree::Node> node : nodes) {
                list1.push_back(node);
                if (list1.size() >= i) {
                    list.push_back(make_shared<Climate::RTree::SubTree>(list1));
                    list1 = {};
                }
            }

            if (!list1.empty()) {
                list.push_back(make_shared<Climate::RTree::SubTree>(list1));
            }

            return list;
        }

        static int64_t cost(const vector<Climate::Parameter> &parameters) {
            int64_t sum = 0L;

            for (Climate::Parameter parameter : parameters) {
                sum += my_abs(parameter.max - parameter.min);
            }

            return sum;
        }

        static vector<Climate::Parameter> buildParameterSpace(vector<shared_ptr<Climate::RTree::Node>> nodes) {
            if (nodes.empty()) {
                throw new runtime_error("SubTree needs at least one child");
            } else {
                vector<Climate::Parameter> list(7);

                for (shared_ptr<Climate::RTree::Node> node : nodes) {
                    for (int32_t i = 0; i < 7; ++i) {
                        list[i] = node->parameterSpace[i].span(list[i]);
                    }
                }

                return list;
            }
        }

    public:
        Biomes search(Climate::TargetPoint const &targetPoint) {
            vector<int64_t> pointParameters = targetPoint.toParameterArray();
            shared_ptr<Climate::RTree::Leaf> leaf = this->root->search(pointParameters, this->lastResult);
            this->lastResult = leaf;
            return leaf->value;
        }
    };

    class ParameterList {
    public:
        vector<pair<Climate::ParameterPoint, Biomes>> values;
        Climate::RTree index;

        // ParameterList

        ParameterList(vector<pair<Climate::ParameterPoint, Biomes>> const &values)
            : values(values), index(RTree::create(values)) {
        }

        Biomes findValue(Climate::TargetPoint const &targetPoint, Biomes defaultValue) {
            return this->index.search(targetPoint);
            // return this->findValueBruteForce(targetPoint, defaultValue);
        }

        Biomes findValueBruteForce(Climate::TargetPoint const &targetPoint, Biomes defaultValue) const {
            int64_t minDistance = numeric_limits<int64_t>::max();
            Biomes result = defaultValue;

            for (const pair<Climate::ParameterPoint, Biomes> &pair : this->values) {
                int64_t distance = pair.first.fitness(targetPoint);
                if (distance < minDistance) {
                    minDistance = distance;
                    result = pair.second;
                }
            }

            return result;
        }
    };
};