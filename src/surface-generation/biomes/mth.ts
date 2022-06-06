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

export function clamp(value: number, min: number, max: number): number {
    if (value < min) {
        return min
    } else {
        return value > max ? max : value
    }
}

export function toUnsignedLong(n: number): bigint {
    return BigInt.asUintN(64, BigInt(n)) & 0xffffffffn
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

export function lerp2(
    xt: number,
    yt: number,
    x0: number,
    x1: number,
    y0: number,
    y1: number
): number {
    return lerp(yt, lerp(xt, x0, x1), lerp(xt, y0, y1))
}

export function lerp3(
    xt: number,
    yt: number,
    zt: number,
    x0: number,
    x1: number,
    y0: number,
    y1: number,
    x2: number,
    x3: number,
    y2: number,
    y3: number
): number {
    return lerp(zt, lerp2(xt, yt, x0, x1, y0, y1), lerp2(xt, yt, x2, x3, y2, y3))
}

export function smoothstep(v: number): number {
    return v * v * v * (v * (v * 6.0 - 15.0) + 10.0)
}

export function smoothstepDerivative(v: number): number {
    return 30.0 * v * v * (v - 1.0) * (v - 1.0)
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

export function floor(num: number): number {
    return Math.floor(num)
}

export function lfloor(num: number): number {
    return Math.floor(num)
}

export function floorDiv(x: number, y: number): number {
    return Math.floor(x / y)
}

export function intFloorDiv(x: number, y: number): number {
    return Math.floor(x / y)
}

export function clampedLerp(v0: number, v1: number, t: number): number {
    if (t < 0.0) {
        return v0
    } else {
        return t > 1.0 ? v1 : lerp(t, v0, v1)
    }
}
