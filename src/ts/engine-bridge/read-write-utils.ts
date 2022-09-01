import { Engine } from "./module"

export class SeekablePtr {
    constructor(public value: number) {}
}

function getAndSeekPtr(ptr: SeekablePtr | number, size: number): number {
    if (typeof ptr === "object") {
        const value = ptr.value
        ptr.value += size
        return value
    } else {
        return ptr
    }
}

export function writeU32(ptr: SeekablePtr | number, value: number): void {
    ptr = getAndSeekPtr(ptr, 4)

    if (ptr % 4 !== 0) {
        throw new Error("TODO implement not aligned writeU32")
    }
    Engine.HEAPU32[ptr / 4] = value
}

export function writeU64(ptr: SeekablePtr | number, value: number): void {
    ptr = getAndSeekPtr(ptr, 8)

    if (ptr % 4 !== 0) {
        throw new Error("TODO implement not aligned writeU64")
    }

    const low = value % 4294967296
    const high = Math.trunc(value / 4294967296)

    Engine.HEAPU32[ptr / 4] = low
    Engine.HEAPU32[ptr / 4 + 1] = high
}

export function writeFloat(ptr: SeekablePtr | number, value: number): void {
    ptr = getAndSeekPtr(ptr, 4)

    if (ptr % 4 !== 0) {
        throw new Error("TODO implement not aligned writeU32")
    }
    Engine.HEAPF32[ptr / 4] = value
}

export function readU32(ptr: SeekablePtr | number): number {
    ptr = getAndSeekPtr(ptr, 4)

    if (ptr % 4 !== 0) {
        throw new Error("TODO implement not aligned readU32")
    }

    return Engine.HEAPU32[ptr / 4]
}

export function readU64(ptr: SeekablePtr | number): number {
    ptr = getAndSeekPtr(ptr, 8)

    if (ptr % 4 !== 0) {
        throw new Error("TODO implement not aligned readU64")
    }

    return Engine.HEAPU32[ptr / 4] + Engine.HEAPU32[ptr / 4 + 1] * 4294967296
}

export function readFloat(ptr: SeekablePtr | number): number {
    ptr = getAndSeekPtr(ptr, 4)

    if (ptr % 4 !== 0) {
        throw new Error("TODO implement not aligned readFloat")
    }

    return Engine.HEAPF32[ptr / 4]
}
