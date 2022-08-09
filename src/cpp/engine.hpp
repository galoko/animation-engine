#pragma once

#include <cstdint>

#include "external-services/external-services.hpp"

extern "C" {
    // debug
    void test();
    bool check();

    // life cycle
    void init();
    void tick(double dt);
    void finalize();

    // queue api
    ServicesQueue *get_input_queue_ptr();
    ServicesQueue *get_output_queue_ptr();

    void print_memory_stats();
#ifdef __EMSCRIPTEN__
    // gets an exception object, and prints it out.
    void print_exception(int32_t exceptionPtr);
#endif

    // sync api
    extern void test_api();
}