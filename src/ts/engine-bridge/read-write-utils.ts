import { Engine } from "./module"

export function writeU32(ptr: number, value: number): void {
    if (ptr % 4 !== 0) {
        throw new Error("TODO implement not aligned writeU32")
    }
    Engine.HEAPU32[ptr / 4] = value
}

export function readU32(ptr: number): number {
    if (ptr % 4 !== 0) {
        throw new Error("TODO implement not aligned readU32")
    }
    return Engine.HEAPU32[ptr / 4]
}
