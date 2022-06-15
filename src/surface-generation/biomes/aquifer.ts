import { Blocks } from "./blocks"
import { ChunkPos, NoiseChunk } from "./chunk-generator"
import { NormalNoise } from "./noise/normal-noise"
import { PositionalRandomFactory } from "./random"
import * as Mth from "./mth"

export class FluidStatus {
    constructor(readonly fluidLevel: number, readonly fluidType: Blocks) {}

    at(y: number): Blocks {
        return y < this.fluidLevel ? this.fluidType : Blocks.AIR
    }
}

export interface FluidPicker {
    computeFluid(p_188397_: number, p_188398_: number, p_188399_: number): FluidStatus
}

export interface Aquifer {
    computeSubstance(
        x: number,
        y: number,
        z: number,
        baseNoise: number,
        clampedBaseNoise: number
    ): Blocks | null
    shouldScheduleFluidUpdate(): boolean
}

const Long_MAX_VALUE = 2n ** 63n - 1n

class NoiseBasedAquifer implements Aquifer {
    private readonly minGridX: number
    private readonly minGridY: number
    private readonly minGridZ: number
    private readonly gridSizeX: number
    private readonly gridSizeZ: number

    private readonly aquiferCache: FluidStatus[]
    private readonly aquiferLocationCache: bigint[]

    constructor(
        readonly noiseChunk: NoiseChunk,
        chunkPos: ChunkPos,
        readonly barrierNoise: NormalNoise,
        readonly fluidLevelFloodednessNoise: NormalNoise,
        readonly fluidLevelSpreadNoise: NormalNoise,
        readonly lavaNoise: NormalNoise,
        readonly positionalRandomFactory: PositionalRandomFactory,
        y: number,
        height: number,
        readonly globalFluidPicker: FluidPicker
    ) {
        this.minGridX = this.gridX(chunkPos.getMinBlockX()) - 1
        this.minGridY = this.gridY(y) - 1
        this.minGridZ = this.gridZ(chunkPos.getMinBlockZ()) - 1

        const maxGridX = this.gridX(chunkPos.getMaxBlockX()) + 1
        const maxGridY = this.gridY(y + height) + 1
        const maxGridZ = this.gridZ(chunkPos.getMaxBlockZ()) + 1

        this.gridSizeX = maxGridX - this.minGridX + 1
        const gridSizeY = maxGridY - this.minGridY + 1
        this.gridSizeZ = maxGridZ - this.minGridZ + 1

        const gridSize = this.gridSizeX * gridSizeY * this.gridSizeZ

        this.aquiferCache = new Array(gridSize) as FluidStatus[]
        this.aquiferLocationCache = new Array(gridSize) as bigint[]
        this.aquiferLocationCache.fill(Long_MAX_VALUE)
    }

    private gridX(x: number): number {
        return Mth.floorDiv(x, 16)
    }

    private gridY(y: number): number {
        return Mth.floorDiv(y, 12)
    }

    private gridZ(z: number): number {
        return Mth.floorDiv(z, 16)
    }

    computeSubstance(
        x: number,
        y: number,
        z: number,
        baseNoise: number,
        clampedBaseNoise: number
    ): Blocks | null {
        throw new Error("Method not implemented.")
    }

    shouldScheduleFluidUpdate(): boolean {
        throw new Error("Method not implemented.")
    }
}

export class Aquifer {
    static create(
        noiseChunk: NoiseChunk,
        chunkPos: ChunkPos,
        p_198195_: NormalNoise,
        p_198196_: NormalNoise,
        p_198197_: NormalNoise,
        p_198198_: NormalNoise,
        p_198199_: PositionalRandomFactory,
        p_198200_: number,
        p_198201_: number,
        picker: FluidPicker
    ): Aquifer {
        return new NoiseBasedAquifer(
            noiseChunk,
            chunkPos,
            p_198195_,
            p_198196_,
            p_198197_,
            p_198198_,
            p_198199_,
            p_198200_,
            p_198201_,
            picker
        )
    }

    static createDisabled(picker: FluidPicker): Aquifer {
        return {
            computeSubstance: (
                x: number,
                y: number,
                z: number,
                baseNoise: number,
                clampedBaseNoise: number
            ): Blocks | null => {
                return clampedBaseNoise > 0 ? null : picker.computeFluid(x, y, z).at(y)
            },

            shouldScheduleFluidUpdate: (): boolean => {
                return false
            },
        }
    }
}
