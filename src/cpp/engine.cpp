#ifdef __EMSCRIPTEN__
#include <emscripten.h>
#endif
#include <memory>
#include <stdio.h>

#include "engine.hpp"

#include "external-services/external-services.hpp"
#include "services.hpp"
#include "utils/memory-debug.hpp"

#include "test/test.hpp"

// for finalize
#include "surface-generation/biomes/carvers.hpp"
#include "surface-generation/biomes/chunk-generator.hpp"
#include "surface-generation/biomes/chunk-status.hpp"
#include "surface-generation/biomes/mth.hpp"
#include "surface-generation/biomes/overworld-biomes.hpp"
#include "surface-generation/biomes/providers.hpp"
#include "surface-generation/biomes/worldgen-settings.hpp"

#include "surface-generation/biomes/noise-data.hpp"

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
        Mth::init();
        // GrassColor::init(...);
        // FoliageColor::init(...);
        ConstantFloat::init();
        Noises_initialize();
        ChunkStatus::initialize();
        SurfaceRules::initialize();
        SurfaceRulesData::initialize();
        NoiseGeneratorSettings::initialize();
        WorldCarver::init();
        Carvers::init();
        BiomeInstances::init();

        Services = make_unique<ServicesManager>();

        Services->cameraManager.init();
        Services->worldManager.init();
    }

    void tick(double dt) {
        // printf("tick\n");
        processInputQueue();

        Services->tick(dt);
    }

    void finalize() {
        Noises_finalize();
        ChunkStatus::finalize();
        SurfaceRules::finalize();
        SurfaceRulesData::finalize();
        NoiseGeneratorSettings::finalize();
        BiomeSource::Preset::finalize();
        Services = nullptr;
        unregisterAll();
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

#ifdef _MSC_VER
int32_t main(int32_t argc, char *argv[]) {
    init();
    test();
    bool ok = check();
    printf(ok ? "ok\n" : "NOT OK\n");
    finalize();
}
#endif

#ifndef _MSC_VER
#pragma GCC diagnostic pop
#endif