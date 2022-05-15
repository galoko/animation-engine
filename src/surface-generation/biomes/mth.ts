export function unsignedShift64(num: bigint, shift: bigint) {
    return BigInt.asUintN(64, num) >> shift
}

export function clamp64(num: bigint): bigint {
    return BigInt.asIntN(64, num)
}

export function rotateLeft64(n: bigint, bits: bigint) {
    const b = BigInt.asUintN(64, n)

    const shifted = b << bits

    const lo = BigInt.asUintN(64, shifted >> 64n)
    const hi = BigInt.asUintN(64, shifted)

    return lo | hi
}

export function toUnsignedLong(n: number): bigint {
    return BigInt.asUintN(64, BigInt(n))
}

export function toUnsignedInt(n: number): bigint {
    return BigInt.asUintN(32, BigInt(n))
}

export function toLong(n: number): bigint {
    return BigInt(n)
}

export function toInt(n: bigint): number {
    return Number(BigInt.asIntN(32, n))
}

export function remainderUnsigned32(divident: number, divisor: number): number {
    const result = toUnsignedInt(divident) % toUnsignedInt(divisor)

    return toInt(result)
}

export function fromBytes64(
    b1: number,
    b2: number,
    b3: number,
    b4: number,
    b5: number,
    b6: number,
    b7: number,
    b8: number
) {
    return clamp64(
        (BigInt(b1) << 56n) |
            (BigInt(b2) << 48n) |
            (BigInt(b3) << 40n) |
            (BigInt(b4) << 32n) |
            (BigInt(b5) << 24n) |
            (BigInt(b6) << 16n) |
            (BigInt(b7) << 8n) |
            BigInt(b8)
    )
}

export function binarySearch(
    startIndex: number,
    endIndex: number,
    predicate: (index: number) => boolean
): number {
    let i = endIndex - startIndex

    while (i > 0) {
        const j = Math.trunc(i / 2)
        const k = startIndex + j
        if (predicate(k)) {
            i = j
        } else {
            startIndex = k + 1
            i -= j + 1
        }
    }

    return startIndex
}

export function lerp(t: number, v0: number, v1: number): number {
    return v0 + t * (v1 - v0)
}

export function square(num: number): number {
    return num * num
}

export function getSeed(p_14131_: number, p_14132_: number, p_14133_: number): bigint {
    let i =
        toLong(toInt(toLong(p_14131_) * 3129871n)) ^
        clamp64(toLong(p_14133_) * 116129781n) ^
        toLong(p_14132_)
    i = clamp64(i * i * 42317861n + i * 11n)
    return i >> 16n
}
