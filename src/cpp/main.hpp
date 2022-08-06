#include <cstdint>

extern "C" {
    void init();

    uint8_t* test();

    void print_memory_stats();

    void finalize();
}