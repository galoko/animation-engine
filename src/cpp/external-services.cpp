#include "external-services.hpp"

ServicesQueue inputQueue, outputQueue;

ServicesQueue *getInputQueue() {
    return &inputQueue;
}

ServicesQueue *getOutputQueue() {
    return &outputQueue;
}