import { RandomSource } from "../random"
import { Mth } from "../mth"

export class SimplexNoise {
    static readonly GRADIENT = [
        [1, 1, 0],
        [-1, 1, 0],
        [1, -1, 0],
        [-1, -1, 0],
        [1, 0, 1],
        [-1, 0, 1],
        [1, 0, -1],
        [-1, 0, -1],
        [0, 1, 1],
        [0, -1, 1],
        [0, 1, -1],
        [0, -1, -1],
        [1, 1, 0],
        [0, -1, 1],
        [-1, 1, 0],
        [0, -1, -1],
    ]
    private static readonly SQRT_3 = Math.sqrt(3.0)
    private static readonly F2 = 0.5 * (SimplexNoise.SQRT_3 - 1.0)
    private static readonly G2 = (3.0 - SimplexNoise.SQRT_3) / 6.0
    private readonly p: number[] = new Array(512).fill(0)
    public readonly xo: number
    public readonly yo: number
    public readonly zo: number

    constructor(randomSource: RandomSource) {
        this.xo = randomSource.nextDouble() * 256.0
        this.yo = randomSource.nextDouble() * 256.0
        this.zo = randomSource.nextDouble() * 256.0

        for (let i = 0; i < 256; i++) {
            this.p[i] = i
        }

        for (let i = 0; i < 256; ++i) {
            const value = randomSource.nextInt(256 - i)
            const temp = this.p[i]
            this.p[i] = this.p[value + i]
            this.p[value + i] = temp
        }
    }

    private get_p(index: number): number {
        return this.p[index & 255]
    }

    static dot(v: number[], x: number, y: number, z: number): number {
        return v[0] * x + v[1] * y + v[2] * z
    }

    private getCornerNoise3D(
        gradintIndex: number,
        x: number,
        y: number,
        z: number,
        maxLengthSq: number
    ): number {
        let lengthDiff = maxLengthSq - x * x - y * y - z * z
        let result
        if (lengthDiff < 0.0) {
            result = 0.0
        } else {
            lengthDiff *= lengthDiff
            result =
                lengthDiff *
                lengthDiff *
                SimplexNoise.dot(SimplexNoise.GRADIENT[gradintIndex], x, y, z)
        }

        return result
    }

    public getValue(x: number, y: number, z?: number): number {
        if (z === undefined) {
            const someLength1 = (x + y) * SimplexNoise.F2
            const intX = Mth.floor(x + someLength1)
            const intY = Mth.floor(y + someLength1)
            const someLength2 = (intX + intY) * SimplexNoise.G2
            const d2 = intX - someLength2
            const d3 = intY - someLength2
            const d4 = x - d2
            const d5 = y - d3
            let k
            let l
            if (d4 > d5) {
                k = 1
                l = 0
            } else {
                k = 0
                l = 1
            }

            const d6 = d4 - k + SimplexNoise.G2
            const d7 = d5 - l + SimplexNoise.G2
            const d8 = d4 - 1.0 + 2.0 * SimplexNoise.G2
            const d9 = d5 - 1.0 + 2.0 * SimplexNoise.G2
            const clampedIntX = intX & 255
            const clampedIntY = intY & 255
            const k1 = this.get_p(clampedIntX + this.get_p(clampedIntY)) % 12
            const l1 = this.get_p(clampedIntX + k + this.get_p(clampedIntY + l)) % 12
            const i2 = this.get_p(clampedIntX + 1 + this.get_p(clampedIntY + 1)) % 12
            const d10 = this.getCornerNoise3D(k1, d4, d5, 0.0, 0.5)
            const d11 = this.getCornerNoise3D(l1, d6, d7, 0.0, 0.5)
            const d12 = this.getCornerNoise3D(i2, d8, d9, 0.0, 0.5)
            return 70.0 * (d10 + d11 + d12)
        } else {
            const ONE_THIRD = 0.3333333333333333
            const ONE_SIXTH = 0.16666666666666666

            const avgCoord = (x + y + z) * ONE_THIRD

            const avgIntX = Mth.floor(x + avgCoord)
            const avgIntY = Mth.floor(y + avgCoord)
            const avgIntZ = Mth.floor(z + avgCoord)
            const avgCoord2 = (avgIntX + avgIntY + avgIntZ) * ONE_SIXTH

            const d4 = avgIntX - avgCoord2
            const d5 = avgIntY - avgCoord2
            const d6 = avgIntZ - avgCoord2

            const d7 = x - d4
            const d8 = y - d5
            const d9 = z - d6

            let l
            let i1
            let j1
            let k1
            let l1
            let i2
            if (d7 >= d8) {
                if (d8 >= d9) {
                    l = 1
                    i1 = 0
                    j1 = 0
                    k1 = 1
                    l1 = 1
                    i2 = 0
                } else if (d7 >= d9) {
                    l = 1
                    i1 = 0
                    j1 = 0
                    k1 = 1
                    l1 = 0
                    i2 = 1
                } else {
                    l = 0
                    i1 = 0
                    j1 = 1
                    k1 = 1
                    l1 = 0
                    i2 = 1
                }
            } else if (d8 < d9) {
                l = 0
                i1 = 0
                j1 = 1
                k1 = 0
                l1 = 1
                i2 = 1
            } else if (d7 < d9) {
                l = 0
                i1 = 1
                j1 = 0
                k1 = 0
                l1 = 1
                i2 = 1
            } else {
                l = 0
                i1 = 1
                j1 = 0
                k1 = 1
                l1 = 1
                i2 = 0
            }

            const d10 = d7 - l + ONE_SIXTH
            const d11 = d8 - i1 + ONE_SIXTH
            const d12 = d9 - j1 + ONE_SIXTH
            const d13 = d7 - k1 + ONE_THIRD
            const d14 = d8 - l1 + ONE_THIRD
            const d15 = d9 - i2 + ONE_THIRD
            const d16 = d7 - 1.0 + 0.5
            const d17 = d8 - 1.0 + 0.5
            const d18 = d9 - 1.0 + 0.5
            const j2 = avgIntX & 255
            const k2 = avgIntY & 255
            const l2 = avgIntZ & 255
            const i3 = this.get_p(j2 + this.get_p(k2 + this.get_p(l2))) % 12
            const j3 = this.get_p(j2 + l + this.get_p(k2 + i1 + this.get_p(l2 + j1))) % 12
            const k3 = this.get_p(j2 + k1 + this.get_p(k2 + l1 + this.get_p(l2 + i2))) % 12
            const l3 = this.get_p(j2 + 1 + this.get_p(k2 + 1 + this.get_p(l2 + 1))) % 12
            const d19 = this.getCornerNoise3D(i3, d7, d8, d9, 0.6)
            const d20 = this.getCornerNoise3D(j3, d10, d11, d12, 0.6)
            const d21 = this.getCornerNoise3D(k3, d13, d14, d15, 0.6)
            const d22 = this.getCornerNoise3D(l3, d16, d17, d18, 0.6)
            return 32.0 * (d19 + d20 + d21 + d22)
        }
    }
}
