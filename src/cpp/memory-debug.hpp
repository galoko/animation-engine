#pragma once

#include <map>
#include <string>

using namespace std;

#define ENABLE_MEMORY_DEBUG

#ifdef ENABLE_MEMORY_DEBUG
#define objectCreated(name) _objectCreated(name)
#define objectFreed(name) _objectFreed(name)
#else
#define objectCreated(name)
#define objectFreed(name)
#endif

void _objectCreated(string name);
void _objectFreed(string name);
void printMemoryStats();