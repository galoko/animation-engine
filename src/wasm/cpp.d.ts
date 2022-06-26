interface EmscriptenModule {
    HEAP8: Int8Array

    _malloc(size: number): number
    _init(): void
}

export default function Module(...args: unknown[]): Promise<EmscriptenModule>
