#pragma once

#include <cstdint>

#include "external-services.hpp"

extern "C" {
    void init();

    void test();
    bool check();

    void finalize();

    void print_memory_stats();

    // queue api
    ServicesQueue *get_input_queue_ptr();

    // sync api
    extern void test_api();
}