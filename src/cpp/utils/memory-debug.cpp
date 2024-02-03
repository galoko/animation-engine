#include "memory-debug.hpp"

#include <map>
#include <memory>
#include <stdio.h>

unique_ptr<map<string, int32_t>> counters = nullptr;

void _objectCreated(string name) {
    if (counters == nullptr) {
        counters = make_unique<map<string, int32_t>>();
    }

    (*counters)[name] = (*counters)[name] + 1;
}

void _objectFreed(string name) {
    if (counters == nullptr) {
        counters = make_unique<map<string, int32_t>>();
    }

    (*counters)[name] = (*counters)[name] - 1;
    if ((*counters)[name] < 0) {
        printf("%s is negative\n", name.c_str());
    }
}

void printMemoryStats() {
    if (counters) {
        bool isEmpty = true;
        for (auto it = counters->begin(); it != counters->end(); it++) {
            auto name = it->first;
            auto count = it->second;
            if (count != 0) {
                printf("%s = %d\n", name.c_str(), count);
                isEmpty = false;
            }
        }
        if (isEmpty) {
            printf("empty\n");
        }
        counters = nullptr;
    }
}