#include <emscripten.h>
#include <iostream>
#include <stdio.h>

#include "surface-generation/biomes/random.hpp"

using namespace Mth;
using namespace std;

extern "C" {
    void init() {
        // ResourceLocation *r = new ResourceLocation();
        // printf("%d\n", -2);
        XoroshiroRandomSource *s = new XoroshiroRandomSource(5L, 6L);
        PositionalRandomFactory *f = s->forkPositional();
        XoroshiroRandomSource *r = (XoroshiroRandomSource *)f->fromHashOf("padloid");

        cout << "test";
    }
}