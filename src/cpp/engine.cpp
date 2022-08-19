#ifdef __EMSCRIPTEN__
#include <emscripten.h>
#endif
#include <memory>
#include <stdio.h>

#include "engine.hpp"
#include "test/test.hpp"

#include "surface-generation/biomes/chunk-generator.hpp"
#include "surface-generation/biomes/chunk-status.hpp"
#include "surface-generation/biomes/worldgen-settings.hpp"

#include "memory-debug.hpp"

#include "btBulletDynamicsCommon.h"

using namespace std;

#ifndef _MSC_VER
#pragma GCC diagnostic push
#pragma GCC diagnostic ignored "-Wunused-variable"
#endif

const char *TEST_STR = "TESTINAS";

int test_callback() {
    return 6;
}

void testPhysics() {
    btBroadphaseInterface *Broadphase = new btDbvtBroadphase();
}

extern "C" {
    void test() {
        doTest();
    }

    bool check() {
        bool result = compareChunkWithTemplate();
        return result;
    }

    void init() {
        // testPhysics();
    }

    void tick(double dt) {
        printf("tick\n");
    }

    void finalize() {
        ChunkStatus::finalize();
        NoiseGeneratorSettings::finalize();
        MultiNoiseBiomeSource::Preset::finalize();
        Noises_finalize();
    }

    ServicesQueue *get_input_queue_ptr() {
        return getInputQueue();
    }

    ServicesQueue *get_output_queue_ptr() {
        return getOutputQueue();
    }

    void print_memory_stats() {
        printMemoryStats();
    }

#ifdef __EMSCRIPTEN__
    // gets an exception object, and prints it out.
    void print_exception(int32_t exceptionPtr) {
        auto e = reinterpret_cast<exception *>(exceptionPtr);
        printf("%s\n", e->what());
    }
#endif
}

#ifndef _MSC_VER
#pragma GCC diagnostic pop
#endif