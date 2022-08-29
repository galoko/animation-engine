import { Engine } from "./module"

export function writeU32(ptr: number, value: number): number {
    if (ptr % 4 !== 0) {
        throw new Error("TODO implement not aligned writeU32")
    }
    Engine.HEAPU32[ptr / 4] = value

    return ptr + 4
}

export function writeU64(ptr: number, value: number): number {
    if (ptr % 4 !== 0) {
        throw new Error("TODO implement not aligned writeU64")
    }

    const low = value % 4294967296
    const high = Math.trunc(value / 4294967296)

    Engine.HEAPU32[ptr / 4] = low
    Engine.HEAPU32[ptr / 4 + 1] = high

    return ptr + 8
}

export function writeFloat(ptr: number, value: number): number {
    if (ptr % 4 !== 0) {
        throw new Error("TODO implement not aligned writeU32")
    }
    Engine.HEAPF32[ptr / 4] = value

    return ptr + 4
}

export function readU32(ptr: number): number {
    if (ptr % 4 !== 0) {
        throw new Error("TODO implement not aligned readU32")
    }
    return Engine.HEAPU32[ptr / 4]
}

export function readU64(ptr: number): number {
    if (ptr % 4 !== 0) {
        throw new Error("TODO implement not aligned readU64")
    }
    return Engine.HEAPU32[ptr / 4] + Engine.HEAPU32[ptr / 4 + 1] * 4294967296
}
