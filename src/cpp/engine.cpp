#ifdef __EMSCRIPTEN__
#include <emscripten.h>
#endif
#include <memory>
#include <stdio.h>

#include "engine.hpp"

#include "external-services/external-services.hpp"
#include "memory-debug.hpp"
#include "services/services.hpp"

#include "test/test.hpp"

// for finalize
#include "surface-generation/biomes/chunk-generator.hpp"
#include "surface-generation/biomes/chunk-status.hpp"
#include "surface-generation/biomes/worldgen-settings.hpp"

using namespace std;

#ifndef _MSC_VER
#pragma GCC diagnostic push
#pragma GCC diagnostic ignored "-Wunused-variable"
#endif

extern "C" {
    // debug

    void test() {
        doTest();
    }

    bool check() {
        bool result = compareChunkWithTemplate();
        return result;
    }

    // life cycle

    void init() {
        Services = make_unique<ServicesManager>();

        Services->worldManager.loadTestMap();
    }

    void tick(double dt) {
        // printf("tick\n");
        processInputQueue();
    }

    void finalize() {
        ChunkStatus::finalize();
        NoiseGeneratorSettings::finalize();
        MultiNoiseBiomeSource::Preset::finalize();
        Noises_finalize();
        Services = nullptr;
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