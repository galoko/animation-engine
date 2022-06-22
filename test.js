function rotateLeft64(n, bits) {
    const b = BigInt.asUintN(64, n)

    const shifted = b << bits

    const lo = BigInt.asIntN(64, shifted >> 64n)
    const hi = BigInt.asIntN(64, shifted)

    return lo | hi
}

function unsignedShift64(num, shift) {
    return BigInt.asUintN(64, num) >> shift
}

function signedShift64(num, shift) {
    return BigInt.asIntN(64, num) >> shift
}

function toInt(n) {
    return Number(BigInt.asIntN(32, n))
}

function smallestEncompassingPowerOfTwo(num) {
    let result = num - 1
    result |= result >> 1
    result |= result >> 2
    result |= result >> 4
    result |= result >> 8
    result |= result >> 16
    return result + 1
}

const MULTIPLY_DE_BRUIJN_BIT_POSITION = [
    0, 1, 28, 2, 29, 14, 24, 3, 30, 22, 20, 15, 25, 17, 4, 8, 31, 27, 13, 23, 21, 19, 16, 7, 26, 12,
    18, 6, 11, 5, 10, 9,
]

function isPowerOfTwo(num) {
    return num != 0 && (num & (num - 1)) == 0
}

function toLong(n) {
    return BigInt(n)
}

function ceillog2(num) {
    num = isPowerOfTwo(num) ? num : smallestEncompassingPowerOfTwo(num)
    return MULTIPLY_DE_BRUIJN_BIT_POSITION[toInt((toLong(num) * 125613361n) >> 27n) & 31]
}

function log2(num) {
    return ceillog2(num) - (isPowerOfTwo(num) ? 0 : 1)
}

const PACKED_X_LENGTH = BigInt(1 + log2(smallestEncompassingPowerOfTwo(30000000)))
const PACKED_Z_LENGTH = PACKED_X_LENGTH
const PACKED_Y_LENGTH = 64n - PACKED_X_LENGTH - PACKED_Z_LENGTH
const Z_OFFSET = PACKED_Y_LENGTH

function getZ(num) {
    return toInt((num << (64n - Z_OFFSET - PACKED_Z_LENGTH)) >> (64n - PACKED_Z_LENGTH))
}

console.log(signedShift64(-1n, 1n))
console.log(getZ(1374389489694n))
