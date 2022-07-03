#include <emscripten.h>
#include <iostream>
#include <stdio.h>

#include "surface-generation/biomes/biome-source.cpp"
#include "surface-generation/biomes/biome-source.hpp"
#include "surface-generation/biomes/chunk-generator.cpp"
#include "surface-generation/biomes/chunk-generator.hpp"
#include "surface-generation/biomes/climate.hpp"
#include "surface-generation/biomes/cubic-spline.hpp"
#include "surface-generation/biomes/noise-data.cpp"
#include "surface-generation/biomes/noise-data.hpp"
#include "surface-generation/biomes/noise/blended-noise.hpp"
#include "surface-generation/biomes/noise/improved-noise.hpp"
#include "surface-generation/biomes/noise/normal-noise.hpp"
#include "surface-generation/biomes/noise/perlin-noise.hpp"
#include "surface-generation/biomes/noise/perlin-simplex-noise.hpp"
#include "surface-generation/biomes/noise/simplex-noise.hpp"
#include "surface-generation/biomes/overworld-biome-builder.hpp"
#include "surface-generation/biomes/random.hpp"
#include "surface-generation/biomes/terrain-shaper.hpp"

using namespace Mth;
using namespace std;

#pragma GCC diagnostic push
#pragma GCC diagnostic ignored "-Wunused-variable"

class Test {
    void test() {
    }
};

class Child : public Test {
    void test() {
    }
};

class Point {
public:
    float continents;
    float erosion;
    float ridges;
    float weirdness;
};

void testSpline() {
    CubicSpline<Point *> *spline =
        CubicSpline<Point *>::builder([](Point *p) { return p->ridges; }, [](float value) { return value; })
            ->addPoint(-1.0F, 10, 15)
            ->addPoint(-0.4F, 18, 25)
            ->addPoint(0.0F, 27, 30)
            ->addPoint(0.4F, 60, 90)
            ->addPoint(1.0F, 100, 150)
            ->build();

    Point *p = new Point();
    p->ridges = 0.2F;

    float value = spline->apply(p);

    cout << value << endl;
}

void testBiomes() {
    OverworldBiomeBuilder builder = OverworldBiomeBuilder();

    vector<pair<Climate::ParameterPoint *, Biomes> *> *v = new vector<pair<Climate::ParameterPoint *, Biomes> *>();
    builder.addBiomes([v](pair<Climate::ParameterPoint *, Biomes> *pair) { v->push_back(pair); });

    cout << v->size() << endl;
    for (pair<Climate::ParameterPoint *, Biomes> *pair : *v) {
        cout << getBiomeName(pair->second) << endl;
    }

    cout << "done" << endl;
};

extern "C" {
    void init() {
        // ResourceLocation *r = new ResourceLocation();
        // printf("%d\n", -2);

        /*
        XoroshiroRandomSource *s = new XoroshiroRandomSource(5LL, 6LL);
        PositionalRandomFactory *f = s->forkPositional();
        XoroshiroRandomSource *r = (XoroshiroRandomSource *)f->fromHashOf("padloid");

        Test *t = new Child();

        cout << "enter" << endl;

        Climate::ParameterList<int> *i =
            new Climate::ParameterList<int>(new vector<pair<Climate::ParameterPoint *, int>>());

        i->findValueBruteForce(new Climate::TargetPoint(0LL, 0LL, 0LL, 0LL, 0LL, 0LL), 9);

        testSpline();
        */

        testBiomes();

        cout << "exit" << endl;
    }
}

#pragma GCC diagnostic pop