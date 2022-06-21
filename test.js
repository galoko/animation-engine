function rotateLeft64(n, bits) {
    const b = BigInt.asUintN(64, n)

    const shifted = b << bits

    const lo = BigInt.asIntN(64, shifted >> 64n)
    const hi = BigInt.asIntN(64, shifted)

    return lo | hi
}

console.log(rotateLeft64(-4507586311731050385n, 49n))
