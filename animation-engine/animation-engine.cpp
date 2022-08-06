// animation-engine.cpp : This file contains the 'main' function. Program execution begins and ends there.
//

#include <iostream>
#include <chrono>

#include "../src/cpp/main.hpp"
#include "../src/cpp/surface-generation//biomes/blocks.hpp"
#include "./template-1-0.hpp"

using namespace std;
using namespace std::chrono;

int main()
{
    auto startTime = high_resolution_clock::now();
    uint8_t* blocks = test();
    auto endTime = high_resolution_clock::now();

    auto ms_int = duration_cast<milliseconds>(endTime - startTime);

    cout << ms_int.count() << "ms\n";
    
    bool ok = true;
    int i = 0;
    for (int y = -64; y < 256; y++) {
        for (int x = 0; x < 16; x++) {
            for (int z = 0; z < 16; z++) {
                    auto block = BLOCKS[i];
                    auto templateBlock = blockToStr((BlockState)blocks[i]);
                    i++;
                    if (strcmp(block, templateBlock) != 0) {
                        ok = false;
                        break;
                    }
            }
        }
    }


    cout << (ok ? "ok" : "NOT OK") << "\n";

    cin.get();
}