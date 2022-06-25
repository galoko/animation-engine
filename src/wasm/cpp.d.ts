interface EmscriptenModule {
    HEAP8: Int8Array

    _malloc(size: number): number
    _test(value: number): number

    _test_memory_leaks(): void
    _free_memory_leaks(): void
}

export default function Module(...args: unknown[]): Promise<EmscriptenModule>
