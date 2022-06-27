#include <emscripten.h>
#include <iostream>
#include <stdio.h>

#include "surface-generation/biomes/climate.hpp"
#include "surface-generation/biomes/cubic-spline.hpp"
#include "surface-generation/biomes/random.hpp"
#include "surface-generation/biomes/terrain-shaper.hpp"


using namespace Mth;
using namespace std;

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

extern "C" {
    void init() {
        // ResourceLocation *r = new ResourceLocation();
        // printf("%d\n", -2);
        XoroshiroRandomSource *s = new XoroshiroRandomSource(5L, 6L);
        PositionalRandomFactory *f = s->forkPositional();
        XoroshiroRandomSource *r = (XoroshiroRandomSource *)f->fromHashOf("padloid");

        Test *t = new Child();

        cout << "enter" << endl;

        testSpline();

        cout << "exit" << endl;
    }
}