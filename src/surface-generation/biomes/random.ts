import * as Mth from "./mth"
import {
    unsignedShift64,
    clamp64,
    rotateLeft64,
    toUnsignedLong,
    toLong,
    toInt,
    remainderUnsigned32,
    fromBytes64,
} from "./mth"
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import md5 from "md5"

export function toResourceLocation(path: string): string {
    const namespace = "minecraft"

    return namespace + ":" + path
}

export abstract class PositionalRandomFactory {
    abstract fromHashOf(s: string): RandomSource
    abstract at(x: number, y: number, z: number): RandomSource
}

// abstract

export abstract class RandomSource {
    abstract fork(): RandomSource
    abstract forkPositional(): PositionalRandomFactory

    abstract setSeed(seed: bigint): void

    abstract nextInt(bound?: number): number
    abstract nextLong(): bigint
    abstract nextBoolean(): boolean
    abstract nextFloat(): number
    abstract nextDouble(): number
    abstract nextGaussian(): number
}

export class Seed128bit {
    constructor(readonly seedLo: bigint, readonly seedHi: bigint) {}
}

export class RandomSupport {
    public static readonly GOLDEN_RATIO_64 = -7046029254386353131n
    public static readonly SILVER_RATIO_64 = 7640891576956012809n
    private static SEED_UNIQUIFIER = 8682522807148012n

    public static mixStafford13(seed: bigint): bigint {
        seed = clamp64((seed ^ unsignedShift64(seed, 30n)) * -4658895280553007687n)
        seed = clamp64((seed ^ unsignedShift64(seed, 27n)) * -7723592293110705685n)
        return clamp64(seed ^ unsignedShift64(seed, 31n))
    }

    public static upgradeSeedTo128bit(seed: bigint): Seed128bit {
        const lo = seed ^ RandomSupport.SILVER_RATIO_64
        const hi = clamp64(lo + RandomSupport.GOLDEN_RATIO_64)
        return new Seed128bit(RandomSupport.mixStafford13(lo), RandomSupport.mixStafford13(hi))
    }

    public static seedUniquifier(): bigint {
        RandomSupport.SEED_UNIQUIFIER = clamp64(
            RandomSupport.SEED_UNIQUIFIER * 1181783497276652981n
        )

        return RandomSupport.SEED_UNIQUIFIER ^ (BigInt(performance.now()) * 1000000n)
    }

    public static nextIntBetweenInclusive(
        randomSource: RandomSource,
        min: number,
        max: number
    ): number {
        return randomSource.nextInt(max - min + 1) + min
    }

    public static consumeCount(randomSource: RandomSource, count: number): void {
        for (let i = 0; i < count; ++i) {
            randomSource.nextInt()
        }
    }
}

// implementations

export class Xoroshiro128PlusPlus {
    private seedLo: bigint
    private seedHi: bigint

    constructor(lo: bigint | Seed128bit, hi?: bigint) {
        if (lo instanceof Seed128bit) {
            hi = lo.seedHi
            lo = lo.seedLo
        }

        if (hi === undefined) {
            throw new Error()
        }

        this.seedLo = lo
        this.seedHi = hi

        if ((this.seedLo | this.seedHi) == 0n) {
            this.seedLo = RandomSupport.GOLDEN_RATIO_64
            this.seedHi = RandomSupport.SILVER_RATIO_64
        }
    }

    public nextLong(): bigint {
        const i = this.seedLo
        let j = this.seedHi
        const k = clamp64(rotateLeft64(clamp64(i + j), 17n) + i)
        j ^= i
        this.seedLo = rotateLeft64(i, 49n) ^ j ^ clamp64(j << 21n)
        this.seedHi = rotateLeft64(j, 28n)
        return k
    }
}

export class MarsagliaPolarGaussian {
    private nextNextGaussian: number
    private haveNextNextGaussian: boolean

    constructor(readonly randomSource: RandomSource) {}

    public reset(): void {
        this.haveNextNextGaussian = false
    }

    public nextGaussian(): number {
        if (this.haveNextNextGaussian) {
            this.haveNextNextGaussian = false
            return this.nextNextGaussian
        } else {
            // eslint-disable-next-line no-constant-condition
            while (true) {
                const d0 = 2.0 * this.randomSource.nextDouble() - 1.0
                const d1 = 2.0 * this.randomSource.nextDouble() - 1.0
                const d2 = Mth.square(d0) + Mth.square(d1)
                if (!(d2 >= 1.0)) {
                    if (d2 != 0.0) {
                        const d3 = Math.sqrt((-2.0 * Math.log(d2)) / d2)
                        this.nextNextGaussian = d1 * d3
                        this.haveNextNextGaussian = true
                        return d0 * d3
                    }
                }
            }
        }
    }
}

// source implementations

export class XoroshiroRandomSource implements RandomSource {
    private static readonly FLOAT_UNIT = 5.9604645e-8
    private static readonly DOUBLE_UNIT = 1.1102230246251565e-16
    private randomNumberGenerator: Xoroshiro128PlusPlus
    private readonly gaussianSource = new MarsagliaPolarGaussian(this)

    constructor(lo: bigint, hi?: bigint) {
        if (hi === undefined) {
            this.randomNumberGenerator = new Xoroshiro128PlusPlus(
                RandomSupport.upgradeSeedTo128bit(lo)
            )
        } else {
            this.randomNumberGenerator = new Xoroshiro128PlusPlus(lo, hi)
        }
    }

    public fork(): RandomSource {
        return new XoroshiroRandomSource(
            this.randomNumberGenerator.nextLong(),
            this.randomNumberGenerator.nextLong()
        )
    }

    public forkPositional(): PositionalRandomFactory {
        return new XoroshiroPositionalRandomFactory(
            this.randomNumberGenerator.nextLong(),
            this.randomNumberGenerator.nextLong()
        )
    }

    public setSeed(seed: bigint): void {
        this.randomNumberGenerator = new Xoroshiro128PlusPlus(
            RandomSupport.upgradeSeedTo128bit(seed)
        )
        this.gaussianSource.reset()
    }

    public nextInt(bound?: number): number {
        if (bound !== undefined) {
            let i = toUnsignedLong(this.nextInt())
            let j = clamp64(i * toLong(bound))
            let k = j & 4294967295n
            if (k < toLong(bound)) {
                for (
                    let l = remainderUnsigned32(~bound + 1, bound);
                    k < toLong(l);
                    k = j & 4294967295n
                ) {
                    i = toUnsignedLong(this.nextInt())
                    j = i * toLong(bound)
                }
            }

            const i1 = j >> 32n
            return toInt(i1)
        } else {
            return Number(BigInt.asIntN(32, this.randomNumberGenerator.nextLong()))
        }
    }

    public nextLong(): bigint {
        return this.randomNumberGenerator.nextLong()
    }

    public nextBoolean(): boolean {
        return (this.randomNumberGenerator.nextLong() & 1n) != 0n
    }

    public nextFloat(): number {
        return Number(this.nextBits(24)) * XoroshiroRandomSource.FLOAT_UNIT
    }

    public nextDouble(): number {
        return Number(this.nextBits(53)) * XoroshiroRandomSource.DOUBLE_UNIT
    }

    public nextGaussian(): number {
        return this.gaussianSource.nextGaussian()
    }

    public consumeCount(count: number): void {
        for (let i = 0; i < count; ++i) {
            this.randomNumberGenerator.nextLong()
        }
    }

    private nextBits(bits: number): bigint {
        return unsignedShift64(this.randomNumberGenerator.nextLong(), toLong(64 - bits))
    }
}

class XoroshiroPositionalRandomFactory extends PositionalRandomFactory {
    constructor(private readonly seedLo: bigint, private readonly seedHi: bigint) {
        super()
    }

    public at(x: number, y: number, z: number): RandomSource {
        const coordinateSeed = Mth.getSeed(x, y, z)
        const finalSeedLo = coordinateSeed ^ this.seedLo
        return new XoroshiroRandomSource(finalSeedLo, this.seedHi)
    }

    public fromHashOf(s: string): RandomSource {
        const abyte = md5(s, {
            encoding: "utf8",
            asBytes: true,
        })
        const i = fromBytes64(
            abyte[0],
            abyte[1],
            abyte[2],
            abyte[3],
            abyte[4],
            abyte[5],
            abyte[6],
            abyte[7]
        )
        const j = fromBytes64(
            abyte[8],
            abyte[9],
            abyte[10],
            abyte[11],
            abyte[12],
            abyte[13],
            abyte[14],
            abyte[15]
        )
        return new XoroshiroRandomSource(i ^ this.seedLo, j ^ this.seedHi)
    }
}

export abstract class BitRandomSource implements RandomSource {
    private static readonly FLOAT_MULTIPLIER = 5.9604645e-8
    private static readonly DOUBLE_MULTIPLIER = 1.1102230246251565e-16

    abstract next(bits: number): number

    abstract fork(): RandomSource
    abstract forkPositional(): PositionalRandomFactory

    abstract setSeed(seed: bigint): void

    abstract nextGaussian(): number

    nextInt(bound?: number): number {
        if (bound !== undefined) {
            if ((bound & (bound - 1)) == 0) {
                return toInt((toLong(bound) * toLong(this.next(31))) >> 31n)
            } else {
                let i, clapmedI
                do {
                    i = this.next(31)
                    clapmedI = i % bound
                } while (i - clapmedI + (bound - 1) < 0)

                return clapmedI
            }
        } else {
            return this.next(32)
        }
    }

    nextLong(): bigint {
        const i = this.next(32)
        const j = this.next(32)
        const k = toLong(i) << 32n
        return clamp64(k + toLong(j))
    }

    nextBoolean(): boolean {
        return this.next(1) != 0
    }

    nextFloat(): number {
        return this.next(24) * BitRandomSource.FLOAT_MULTIPLIER
    }

    nextDouble(): number {
        const i = this.next(26)
        const j = this.next(27)
        const k = clamp64((toLong(i) << 27n) + toLong(j))
        return Number(k) * BitRandomSource.DOUBLE_MULTIPLIER
    }
}

export class LegacyRandomSource extends BitRandomSource {
    private static readonly MODULUS_BITS = 48n
    private static readonly MODULUS_MASK = 281474976710655n
    private static readonly MULTIPLIER = 25214903917n
    private static readonly INCREMENT = 11n
    private seed: bigint
    private readonly gaussianSource = new MarsagliaPolarGaussian(this)

    constructor(seed: bigint) {
        super()
        this.setSeed(seed)
    }

    public fork(): RandomSource {
        return new LegacyRandomSource(this.nextLong())
    }

    public forkPositional(): PositionalRandomFactory {
        return new LegacyPositionalRandomFactory(this.nextLong())
    }

    public setSeed(seed: bigint): void {
        this.seed = (seed ^ LegacyRandomSource.MULTIPLIER) & LegacyRandomSource.MODULUS_MASK
        this.gaussianSource.reset()
    }

    public next(bits: number): number {
        this.seed = clamp64(
            (this.seed * LegacyRandomSource.MULTIPLIER + LegacyRandomSource.INCREMENT) &
                LegacyRandomSource.MODULUS_MASK
        )
        return toInt(this.seed >> (LegacyRandomSource.MODULUS_BITS - toLong(bits)))
    }

    public nextGaussian(): number {
        return this.gaussianSource.nextGaussian()
    }
}

export function hashCode(s: string): number {
    let h = 0
    for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0
    return h
}

class LegacyPositionalRandomFactory extends PositionalRandomFactory {
    constructor(private readonly seed: bigint) {
        super()
    }

    public at(x: number, y: number, z: number): RandomSource {
        const coordinateSeed = Mth.getSeed(x, y, z)
        const finalSeed = coordinateSeed ^ this.seed
        return new LegacyRandomSource(finalSeed)
    }

    public fromHashOf(s: string): RandomSource {
        const i = hashCode(s)
        return new LegacyRandomSource(toLong(i) ^ this.seed)
    }
}

// random

class Random {
    private static readonly multiplier = 0x5deece66dn
    private static readonly addend = 0xbn
    private static readonly mask = (1n << 48n) - 1n

    private static readonly FLOAT_UNIT = 1.0 / Number(1n << 24n)
    private static readonly DOUBLE_UNIT = 1.0 / Number(1n << 53n)

    private seed: bigint

    private nextNextGaussian: number
    private haveNextNextGaussian = false

    constructor(seed: bigint) {
        this.setSeed(seed)
    }

    public setSeed(seed: bigint): void {
        this.seed = Random.initialScramble(seed)
        this.haveNextNextGaussian = false
    }

    private static initialScramble(seed: bigint): bigint {
        return (seed ^ Random.multiplier) & Random.mask
    }

    next(bits: number): number {
        const oldseed = this.seed
        const nextseed = (oldseed * Random.multiplier + Random.addend) & Random.mask
        this.seed = nextseed
        return toInt(unsignedShift64(nextseed, toLong(48 - bits)))
    }

    nextInt(bound?: number): number {
        if (bound === undefined) {
            return this.next(32)
        } else {
            let r = this.next(31)
            const m = bound - 1
            if ((bound & m) == 0)
                // i.e., bound is a power of 2
                r = toInt((toLong(bound) * toLong(r)) >> 31n)
            else {
                // reject over-represented candidates
                for (let u = r; u - (r = u % bound) + m < 0; u = this.next(31));
            }
            return r
        }
    }

    nextLong(): bigint {
        // it's okay that the bottom word remains signed.
        return (toLong(this.next(32)) << 32n) + toLong(this.next(32))
    }

    nextBoolean(): boolean {
        return this.next(1) != 0
    }

    nextFloat(): number {
        return this.next(24) / Random.FLOAT_UNIT
    }

    nextDouble(): number {
        return Number((toLong(this.next(26)) << 27n) + toLong(this.next(27))) * Random.DOUBLE_UNIT
    }

    nextGaussian(): number {
        // See Knuth, TAOCP, Vol. 2, 3rd edition, Section 3.4.1 Algorithm C.
        if (this.haveNextNextGaussian) {
            this.haveNextNextGaussian = false
            return this.nextNextGaussian
        } else {
            let v1, v2, s
            do {
                v1 = 2 * this.nextDouble() - 1 // between -1 and 1
                v2 = 2 * this.nextDouble() - 1 // between -1 and 1
                s = v1 * v1 + v2 * v2
            } while (s >= 1 || s == 0)
            const multiplier = Math.sqrt((-2 * Math.log(s)) / s)
            this.nextNextGaussian = v2 * multiplier
            this.haveNextNextGaussian = true
            return v1 * multiplier
        }
    }
}

// world gen
export class WorldgenRandom extends Random {
    private count: number

    constructor(private readonly randomSource: RandomSource) {
        super(0n)
        this.count = 0
    }

    getCount(): number {
        return this.count
    }

    fork(): RandomSource {
        return this.randomSource.fork()
    }

    forkPositional(): PositionalRandomFactory {
        return this.randomSource.forkPositional()
    }

    next(bits: number): number {
        ++this.count
        const randomsource = this.randomSource
        if (randomsource instanceof LegacyRandomSource) {
            const legacyrandomsource = randomsource
            return legacyrandomsource.next(bits)
        } else {
            return toInt(unsignedShift64(this.randomSource.nextLong(), toLong(64 - bits)))
        }
    }

    setSeed(seed: bigint): void {
        if (this.randomSource != null) {
            this.randomSource.setSeed(seed)
        }
    }

    setDecorationSeed(seed: bigint, x: number, y: number): bigint {
        this.setSeed(seed)
        const xSeed = this.nextLong() | 1n
        const ySeed = this.nextLong() | 1n
        const finalSeed = (clamp64(toLong(x) * xSeed) + clamp64(toLong(y) * ySeed)) ^ seed
        this.setSeed(finalSeed)
        return finalSeed
    }

    setFeatureSeed(seed: bigint, x: number, y: number): void {
        const finalSeed = clamp64(seed + toLong(x) + toLong(toInt(10000n * toLong(y))))
        this.setSeed(finalSeed)
    }

    setLargeFeatureSeed(seed: bigint, x: number, y: number): void {
        this.setSeed(seed)
        const xSeed = this.nextLong()
        const ySeed = this.nextLong()
        const finalSeed = clamp64(toLong(x) * xSeed) ^ clamp64(toLong(y) * ySeed) ^ seed
        this.setSeed(finalSeed)
    }

    setLargeFeatureWithSalt(salt: bigint, x: number, y: number, z: number): void {
        const finalSeed = clamp64(
            clamp64(toLong(x) * 341873128712n) +
                clamp64(toLong(y) * 132897987541n) +
                salt +
                toLong(z)
        )
        this.setSeed(finalSeed)
    }

    public static seedSlimeChunk(x: number, y: number, seed: bigint, salt: bigint): Random {
        return new Random(
            (seed +
                toLong(toInt(toLong(x) * toLong(x) * 4987142n)) +
                toLong(toInt(toLong(x) * 5947611n)) +
                toLong(toInt(toLong(y) * toLong(y))) * 4392871n +
                toLong(toInt(toLong(y) * 389711n))) ^
                salt
        )
    }
}

export enum Algorithm {
    LEGACY,
    XOROSHIRO,
}

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
const AlgorithmClasses: { [key in Algorithm]: new (seed: bigint) => RandomSource } = {}
AlgorithmClasses[Algorithm.LEGACY] = LegacyRandomSource
AlgorithmClasses[Algorithm.XOROSHIRO] = XoroshiroRandomSource

export function Algorithm_newInstance(algorithm: Algorithm, seed: bigint): RandomSource {
    return new AlgorithmClasses[algorithm](seed)
}
