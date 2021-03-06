interface EmscriptenModule {
    HEAP8: Int8Array
    HEAP16: Int16Array
    HEAP32: Int32Array
    HEAPF32: Float32Array
    HEAPF64: Float64Array
    HEAPU8: Uint8Array
    HEAPU16: Uint16Array
    HEAPU32: Uint32Array

    _malloc(size: number): number
    _free(ptr: number): void
    _init(): void
    _test(): number
    _print_exception(ptr: number): void
    _print_memory_stats(): void
    _finalize(): void
}

export default function Module(...args: unknown[]): Promise<EmscriptenModule>
