#include <emscripten.h>
#include <emscripten/wasm_worker.h>
#include <iostream>
#include <memory>
#include <stdint.h>
#include <stdio.h>
#include <string>

int32_t shared_variable = 0;

void test_strings() {
    std::string s = "Hello";
    std::string greet = s + " World"; // concatenation easy!
    std::cout << greet << "\n";
    const char *test = greet.c_str();
}

void test_exceptions() {
    throw "test";
}

int *p = nullptr;

class Rectangle {
    int length;
    int breadth;

  public:
    Rectangle(int l, int b) {
        length = l;
        breadth = b;
    }

    int area() {
        return length * breadth;
    }
};

using namespace std;

shared_ptr<Rectangle> P3;

void test_smart_pointers() {
    shared_ptr<Rectangle> P1(new Rectangle(10, 5));
    // This'll print 50
    cout << P1->area() << endl;

    shared_ptr<Rectangle> P2;
    P2 = P1;

    // This'll print 50
    cout << P2->area() << endl;

    // This'll now not give an error,
    cout << P1->area() << endl;

    // This'll also print 50 now
    // This'll print 2 as Reference Counter is 2
    cout << P1.use_count() << endl;

    P3 = P2;
}

extern "C" {
    void run_in_worker() {
        int i = shared_variable;

        for (int j = 0; j < 2 * 1000 * 1000 * 1000; j++) {
            i = i * 33 + 6 + j;
        }

        printf("Hello from wasm worker! %d\n", i);
    }

    void test_memory_leaks() {
        p = (int *)malloc(54);
    }

    void free_memory_leaks() {
        free(p);
        p = nullptr;
    }

    int32_t test(int32_t value) {
        shared_variable = value;

        // run_in_worker();

        // test_strings();
        // test_exceptions();
        test_smart_pointers();

        // test_memory_leaks();

        /*
        for (int i = 1; i <= 4; i++) {
            emscripten_wasm_worker_t worker = emscripten_malloc_wasm_worker(1024);
            emscripten_wasm_worker_post_function_v(worker, run_in_worker);
        }
        */

        return -2;
    }
}