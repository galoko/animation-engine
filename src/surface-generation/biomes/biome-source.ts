import { Biomes } from "./biomes"
import { NoiseBiomeSource, QuartPos } from "./chunk-generator"
import * as Climate from "./climate"
import { ParameterPoint, TargetPoint, findValueBruteForce } from "./climate"
import { Pair } from "./consumer"
import { sha256 } from "js-sha256"
import { BlockPos } from "./pos"
import * as Mth from "./mth"
import { LinearCongruentialGenerator } from "./random"

export interface BiomeResolver {
    getNoiseBiome(x: number, y: number, z: number, sampler: Climate.Sampler): Biomes
}

export abstract class BiomeSource implements BiomeResolver {
    private readonly biomes: Set<Biomes>

    constructor(biomes: Biomes[]) {
        this.biomes = new Set(biomes)
    }

    abstract getNoiseBiome(x: number, y: number, z: number, sampler: Climate.Sampler): Biomes
}

export class MultiNoiseBiomeSource extends BiomeSource {
    constructor(private readonly parameters: Pair<ParameterPoint, Biomes>[]) {
        super(parameters.map(e => e.second))
    }

    getNoiseBiome(x: number, y: number, z: number, sampler: Climate.Sampler): Biomes
    getNoiseBiome(targetPoint: TargetPoint): Biomes
    getNoiseBiome(
        x: TargetPoint | number,
        y?: number,
        z?: number,
        sampler?: Climate.Sampler
    ): Biomes {
        if (typeof x === "number") {
            if (y === undefined || z === undefined || !sampler) {
                throw new Error()
            }
            x = sampler.sample(x, y, z)
        }

        return findValueBruteForce(x, this.parameters)
    }
}

function toBytes(str: string): Uint8Array {
    const length = str.length
    const bArr = new Uint8Array(length / 2)
    for (let i = 0; i < length; i += 2) {
        bArr[i / 2] = parseInt(str.charAt(i + 1), 16) + (parseInt(str.charAt(i), 16) << 4)
    }
    return bArr
}

export class BiomeManager {
    public static readonly CHUNK_CENTER_QUART = QuartPos.fromBlock(8)
    private static readonly ZOOM_BITS = 2
    private static readonly ZOOM = 4
    private static readonly ZOOM_MASK = 3

    constructor(
        private readonly noiseBiomeSource: NoiseBiomeSource,
        private readonly biomeZoomSeed: bigint
    ) {}

    public static obfuscateSeed(seed: bigint): bigint {
        const input = new Uint8Array(BigInt64Array.from([seed]).buffer)
        const output = sha256.digest(input)
        return new BigInt64Array(Uint8Array.from(output).buffer)[0]
    }

    public withDifferentSource(biomeSource: NoiseBiomeSource): BiomeManager {
        return new BiomeManager(biomeSource, this.biomeZoomSeed)
    }

    public getBiome(pos: BlockPos): Biomes {
        const x = pos.x - 2
        const y = pos.y - 2
        const z = pos.z - 2
        const shiftedX = x >> 2
        const shiftedY = y >> 2
        const shiftedZ = z >> 2
        const fracX = (x & 3) / 4
        const fracY = (y & 3) / 4
        const fracZ = (z & 3) / 4
        let minIndex = 0
        let minDistance = Infinity

        for (let index = 0; index < 8; ++index) {
            const shouldUseNextX = (index & 4) == 0
            const shouldUseNextY = (index & 2) == 0
            const shouldUseNextZ = (index & 1) == 0
            const xToUse = shouldUseNextX ? shiftedX : shiftedX + 1
            const yToUse = shouldUseNextY ? shiftedY : shiftedY + 1
            const zToUse = shouldUseNextZ ? shiftedZ : shiftedZ + 1
            const xFractToUse = shouldUseNextX ? fracX : fracX - 1
            const yFractToUse = shouldUseNextY ? fracY : fracY - 1
            const zFractToUse = shouldUseNextZ ? fracZ : fracZ - 1
            const distance = BiomeManager.getFiddledDistance(
                this.biomeZoomSeed,
                xToUse,
                yToUse,
                zToUse,
                xFractToUse,
                yFractToUse,
                zFractToUse
            )
            if (minDistance > distance) {
                minIndex = index
                minDistance = distance
            }
        }

        const resultX = (minIndex & 4) == 0 ? shiftedX : shiftedX + 1
        const resultY = (minIndex & 2) == 0 ? shiftedY : shiftedY + 1
        const resultZ = (minIndex & 1) == 0 ? shiftedZ : shiftedZ + 1

        return this.noiseBiomeSource.getNoiseBiome(resultX, resultY, resultZ)
    }

    public getNoiseBiomeAtPosition(x: number, y: number, z: number): Biomes
    public getNoiseBiomeAtPosition(pos: BlockPos): Biomes
    public getNoiseBiomeAtPosition(x: number | BlockPos, y?: number, z?: number): Biomes {
        if (typeof x === "number") {
            const qx = QuartPos.fromBlock(Mth.floor(x))
            const qy = QuartPos.fromBlock(Mth.floor(y!))
            const qz = QuartPos.fromBlock(Mth.floor(z!))
            return this.getNoiseBiomeAtQuart(qx, qy, qz)
        } else {
            const pos = x
            const qx = QuartPos.fromBlock(pos.x)
            const qy = QuartPos.fromBlock(pos.y)
            const qz = QuartPos.fromBlock(pos.z)
            return this.getNoiseBiomeAtQuart(qx, qy, qz)
        }
    }

    public getNoiseBiomeAtQuart(qx: number, qy: number, qz: number): Biomes {
        return this.noiseBiomeSource.getNoiseBiome(qx, qy, qz)
    }

    private static getFiddledDistance(
        initialSeed: bigint,
        x: number,
        y: number,
        z: number,
        xFract: number,
        yFract: number,
        zFract: number
    ): number {
        let seed = LinearCongruentialGenerator.next(initialSeed, Mth.toLong(x))
        seed = LinearCongruentialGenerator.next(seed, Mth.toLong(y))
        seed = LinearCongruentialGenerator.next(seed, Mth.toLong(z))
        seed = LinearCongruentialGenerator.next(seed, Mth.toLong(x))
        seed = LinearCongruentialGenerator.next(seed, Mth.toLong(y))
        seed = LinearCongruentialGenerator.next(seed, Mth.toLong(z))
        const xOffset = BiomeManager.getFiddle(seed)
        seed = LinearCongruentialGenerator.next(seed, initialSeed)
        const yOffset = BiomeManager.getFiddle(seed)
        seed = LinearCongruentialGenerator.next(seed, initialSeed)
        const zOffset = BiomeManager.getFiddle(seed)
        return (
            Mth.square(zFract + zOffset) +
            Mth.square(yFract + yOffset) +
            Mth.square(xFract + xOffset)
        )
    }

    private static getFiddle(seed: bigint): number {
        const r = Mth.floorMod(seed >> 24n, 1024) / 1024
        return (r - 0.5) * 0.9
    }
}
