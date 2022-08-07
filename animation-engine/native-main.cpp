// animation-engine.cpp : This file contains the 'main' function. Program execution begins and ends there.
//

#include <chrono>
#include <iostream>

#include "../src/cpp/engine.hpp"

using namespace std;
using namespace std::chrono;

int main() {
    init();

    auto startTime = high_resolution_clock::now();
    test();
    auto endTime = high_resolution_clock::now();

    bool ok = check();

    auto ms_int = duration_cast<milliseconds>(endTime - startTime);
    cout << ms_int.count() << "ms\n";

    cout << (ok ? "ok" : "NOT OK") << "\n";

    finalize();

    print_memory_stats();

    cin.get();
}