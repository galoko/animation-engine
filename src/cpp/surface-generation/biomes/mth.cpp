#include "mth.hpp"

template <typename K, typename T> T computeIfAbsent(std::map<K, T> &m, K key, function<T(K)> computor) {
    if (m.find(key) == m.end()) {
        T value = computor(key);
        m.insert({key, value});
        return value;
    } else {
        return m.at(key);
    }
}

namespace Mth {
    int32_t binarySearch(int32_t startIndex, int32_t endIndex, IntPredicate predicate) {
        int32_t i = endIndex - startIndex;

        while (i > 0) {
            int32_t j = i / 2;
            int32_t k = startIndex + j;
            if (predicate(k)) {
                i = j;
            } else {
                startIndex = k + 1;
                i -= j + 1;
            }
        }

        return startIndex;
    }
} // namespace Mth