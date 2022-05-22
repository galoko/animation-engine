import { RandomSource } from "../random"
import { SimplexNoise } from "./simplex-noise"
import * as Mth from "../mth"

export class ImprovedNoise {
    private static readonly SHIFT_UP_EPSILON = 1.0e-7
    private readonly p: Int8Array
    public readonly xo: number
    public readonly yo: number
    public readonly zo: number

    constructor(randomSource: RandomSource) {
        this.xo = randomSource.nextDouble() * 256.0
        this.yo = randomSource.nextDouble() * 256.0
        this.zo = randomSource.nextDouble() * 256.0
        this.p = new Int8Array(256)

        for (let i = 0; i < 256; ++i) {
            this.p[i] = i
        }

        for (let i = 0; i < 256; ++i) {
            const value = randomSource.nextInt(256 - i)
            const temp = this.p[i]
            this.p[i] = this.p[i + value]
            this.p[i + value] = temp
        }
    }

    noise(x: number, y: number, z: number, yFractStep = 0, maxYfract = 0): number {
        const xWithOffset = x + this.xo
        const yWithOffset = y + this.yo
        const zWithOffset = z + this.zo
        const intX = Mth.floor(xWithOffset)
        const intY = Mth.floor(yWithOffset)
        const intZ = Mth.floor(zWithOffset)
        const xFract = xWithOffset - intX
        const yFract = yWithOffset - intY
        const zFract = zWithOffset - intZ
        let yFractOffset
        if (yFractStep != 0.0) {
            let yFractToUse
            if (maxYfract >= 0.0 && maxYfract < yFract) {
                yFractToUse = maxYfract
            } else {
                yFractToUse = yFract
            }

            yFractOffset =
                Mth.floor(yFractToUse / yFractStep + ImprovedNoise.SHIFT_UP_EPSILON) * yFractStep
        } else {
            yFractOffset = 0.0
        }

        return this.sampleAndLerp(intX, intY, intZ, xFract, yFract - yFractOffset, zFract, yFract)
    }

    private static gradDot(gradintIndex: number, x: number, y: number, z: number): number {
        return SimplexNoise.dot(SimplexNoise.GRADIENT[gradintIndex & 15], x, y, z)
    }

    private get_p(index: number): number {
        return this.p[index & 255] & 255
    }

    private sampleAndLerp(
        x: number,
        y: number,
        z: number,
        xt: number,
        yt: number,
        zt: number,
        yt2: number
    ): number {
        const noiseX0 = this.get_p(x)
        const noiseX1 = this.get_p(x + 1)
        const noiseY00 = this.get_p(noiseX0 + y)
        const noiseY01 = this.get_p(noiseX0 + y + 1)
        const noiseY10 = this.get_p(noiseX1 + y)
        const noiseY11 = this.get_p(noiseX1 + y + 1)
        // cube 2x2x2
        const len0 = ImprovedNoise.gradDot(this.get_p(noiseY00 + z), xt, yt, zt)
        const len1 = ImprovedNoise.gradDot(this.get_p(noiseY10 + z), xt - 1.0, yt, zt)
        const len2 = ImprovedNoise.gradDot(this.get_p(noiseY01 + z), xt, yt - 1.0, zt)
        const len3 = ImprovedNoise.gradDot(this.get_p(noiseY11 + z), xt - 1.0, yt - 1.0, zt)
        const len4 = ImprovedNoise.gradDot(this.get_p(noiseY00 + z + 1), xt, yt, zt - 1.0)
        const len5 = ImprovedNoise.gradDot(this.get_p(noiseY10 + z + 1), xt - 1.0, yt, zt - 1.0)
        const len6 = ImprovedNoise.gradDot(this.get_p(noiseY01 + z + 1), xt, yt - 1.0, zt - 1.0)
        const len7 = ImprovedNoise.gradDot(
            this.get_p(noiseY11 + z + 1),
            xt - 1.0,
            yt - 1.0,
            zt - 1.0
        )
        const smoothXt = Mth.smoothstep(xt)
        const smoothYt = Mth.smoothstep(yt2)
        const smoothZt = Mth.smoothstep(zt)
        return Mth.lerp3(
            smoothXt,
            smoothYt,
            smoothZt,
            len0,
            len1,
            len2,
            len3,
            len4,
            len5,
            len6,
            len7
        )
    }

    // unused

    noiseWithDerivative(x: number, y: number, z: number, output: number[]): number {
        const xWithOffset = x + this.xo
        const yWithOffset = y + this.yo
        const zWithOffset = z + this.zo
        const intXwithOffset = Mth.floor(xWithOffset)
        const intYwithOffset = Mth.floor(yWithOffset)
        const intZwithOffset = Mth.floor(zWithOffset)
        const xFract = xWithOffset - intXwithOffset
        const yFract = yWithOffset - intYwithOffset
        const zFract = zWithOffset - intZwithOffset
        return this.sampleWithDerivative(
            intXwithOffset,
            intYwithOffset,
            intZwithOffset,
            xFract,
            yFract,
            zFract,
            output
        )
    }

    private sampleWithDerivative(
        x: number,
        y: number,
        z: number,
        xFract: number,
        yFract: number,
        zFract: number,
        output: number[]
    ): number {
        const noiseX0 = this.get_p(x)
        const noiseX1 = this.get_p(x + 1)
        const noiseY00 = this.get_p(noiseX0 + y)
        const noiseY01 = this.get_p(noiseX0 + y + 1)
        const noiseY10 = this.get_p(noiseX1 + y)
        const noiseY11 = this.get_p(noiseX1 + y + 1)
        const noiseZ000 = this.get_p(noiseY00 + z)
        const noiseZ100 = this.get_p(noiseY10 + z)
        const noiseZ010 = this.get_p(noiseY01 + z)
        const noiseZ110 = this.get_p(noiseY11 + z)
        const noiseZ001 = this.get_p(noiseY00 + z + 1)
        const noiseZ101 = this.get_p(noiseY10 + z + 1)
        const noiseZ011 = this.get_p(noiseY01 + z + 1)
        const noiseZ111 = this.get_p(noiseY11 + z + 1)
        // here we have 2x2x2 cube
        const gradient0 = SimplexNoise.GRADIENT[noiseZ000 & 15]
        const gradient1 = SimplexNoise.GRADIENT[noiseZ100 & 15]
        const gradient2 = SimplexNoise.GRADIENT[noiseZ010 & 15]
        const gradient3 = SimplexNoise.GRADIENT[noiseZ110 & 15]
        const gradient4 = SimplexNoise.GRADIENT[noiseZ001 & 15]
        const gradient5 = SimplexNoise.GRADIENT[noiseZ101 & 15]
        const gradient6 = SimplexNoise.GRADIENT[noiseZ011 & 15]
        const gradient7 = SimplexNoise.GRADIENT[noiseZ111 & 15]
        const len0 = SimplexNoise.dot(gradient0, xFract, yFract, zFract)
        const len1 = SimplexNoise.dot(gradient1, xFract - 1.0, yFract, zFract)
        const len2 = SimplexNoise.dot(gradient2, xFract, yFract - 1.0, zFract)
        const len3 = SimplexNoise.dot(gradient3, xFract - 1.0, yFract - 1.0, zFract)
        const len4 = SimplexNoise.dot(gradient4, xFract, yFract, zFract - 1.0)
        const len5 = SimplexNoise.dot(gradient5, xFract - 1.0, yFract, zFract - 1.0)
        const len6 = SimplexNoise.dot(gradient6, xFract, yFract - 1.0, zFract - 1.0)
        const len7 = SimplexNoise.dot(gradient7, xFract - 1.0, yFract - 1.0, zFract - 1.0)
        const smoothXfract = Mth.smoothstep(xFract)
        const smoothYfract = Mth.smoothstep(yFract)
        const smoothZfract = Mth.smoothstep(zFract)
        const interpolatedGradientX = Mth.lerp3(
            smoothXfract,
            smoothYfract,
            smoothZfract,
            gradient0[0],
            gradient1[0],
            gradient2[0],
            gradient3[0],
            gradient4[0],
            gradient5[0],
            gradient6[0],
            gradient7[0]
        )
        const interpolatedGradientY = Mth.lerp3(
            smoothXfract,
            smoothYfract,
            smoothZfract,
            gradient0[1],
            gradient1[1],
            gradient2[1],
            gradient3[1],
            gradient4[1],
            gradient5[1],
            gradient6[1],
            gradient7[1]
        )
        const interpolatedGradientZ = Mth.lerp3(
            smoothXfract,
            smoothYfract,
            smoothZfract,
            gradient0[2],
            gradient1[2],
            gradient2[2],
            gradient3[2],
            gradient4[2],
            gradient5[2],
            gradient6[2],
            gradient7[2]
        )
        const xLen = Mth.lerp2(
            smoothYfract,
            smoothZfract,
            len1 - len0,
            len3 - len2,
            len5 - len4,
            len7 - len6
        )
        const yLen = Mth.lerp2(
            smoothZfract,
            smoothXfract,
            len2 - len0,
            len6 - len4,
            len3 - len1,
            len7 - len5
        )
        const zLen = Mth.lerp2(
            smoothXfract,
            smoothYfract,
            len4 - len0,
            len5 - len1,
            len6 - len2,
            len7 - len3
        )
        const xDerivSmooth = Mth.smoothstepDerivative(xFract)
        const yDerivSmooth = Mth.smoothstepDerivative(yFract)
        const zDerivSmooth = Mth.smoothstepDerivative(zFract)
        const outputX = interpolatedGradientX + xDerivSmooth * xLen
        const outputY = interpolatedGradientY + yDerivSmooth * yLen
        const outputZ = interpolatedGradientZ + zDerivSmooth * zLen
        output[0] += outputX
        output[1] += outputY
        output[2] += outputZ
        return Mth.lerp3(
            smoothXfract,
            smoothYfract,
            smoothZfract,
            len0,
            len1,
            len2,
            len3,
            len4,
            len5,
            len6,
            len7
        )
    }
}
