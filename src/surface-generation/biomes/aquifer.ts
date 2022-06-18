import { Blocks } from "./blocks"
import { ChunkPos, NoiseChunk } from "./chunk-generator"
import { NormalNoise } from "./noise/normal-noise"
import { PositionalRandomFactory } from "./random"
import * as Mth from "./mth"
import { BlockPos, SectionPos } from "./pos"

class DimensionType {
    static readonly BITS_FOR_Y = Number(BlockPos.PACKED_Y_LENGTH)
    static readonly MIN_HEIGHT = 16
    static readonly Y_SIZE = (1 << DimensionType.BITS_FOR_Y) - 32
    static readonly MAX_Y = (DimensionType.Y_SIZE >> 1) - 1
    static readonly MIN_Y = DimensionType.MAX_Y - DimensionType.Y_SIZE + 1
    static readonly WAY_ABOVE_MAX_Y = DimensionType.MAX_Y << 4
    static readonly WAY_BELOW_MIN_Y = DimensionType.MIN_Y << 4
}

export class FluidStatus {
    constructor(readonly fluidLevel: number, readonly fluidType: Blocks) {}

    at(y: number): Blocks {
        return y < this.fluidLevel ? this.fluidType : Blocks.AIR
    }
}

export interface FluidPicker {
    computeFluid(x: number, y: number, z: number): FluidStatus
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
const Integer_MAX_VALUE = 2 ** 31 - 1

class MutableDouble {
    constructor(private value: number) {}

    setValue(value: number): void {
        this.value = value
    }

    getValue(): number {
        return this.value
    }
}

class NoiseBasedAquifer implements Aquifer {
    private static readonly X_RANGE = 10
    private static readonly Y_RANGE = 9
    private static readonly Z_RANGE = 10
    private static readonly X_SEPARATION = 6
    private static readonly Y_SEPARATION = 3
    private static readonly Z_SEPARATION = 6
    private static readonly X_SPACING = 16
    private static readonly Y_SPACING = 12
    private static readonly Z_SPACING = 16
    private static readonly MAX_REASONABLE_DISTANCE_TO_AQUIFER_CENTER = 11
    private static readonly FLOWING_UPDATE_SIMULARITY = NoiseBasedAquifer.similarity(
        Mth.square(10),
        Mth.square(12)
    )
    private static readonly SURFACE_SAMPLING_OFFSETS_IN_CHUNKS = [
        [-2, -1],
        [-1, -1],
        [0, -1],
        [1, -1],
        [-3, 0],
        [-2, 0],
        [-1, 0],
        [0, 0],
        [1, 0],
        [-2, 1],
        [-1, 1],
        [0, 1],
        [1, 1],
    ]

    private readonly minGridX: number
    private readonly minGridY: number
    private readonly minGridZ: number
    private readonly gridSizeX: number
    private readonly gridSizeZ: number

    private readonly aquiferCache: FluidStatus[]
    private readonly aquiferLocationCache: bigint[]

    private _shouldScheduleFluidUpdate: boolean

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

    private getIndex(x: number, y: number, z: number): number {
        const gridX = x - this.minGridX
        const gridY = y - this.minGridY
        const gridZ = z - this.minGridZ
        return (gridY * this.gridSizeZ + gridZ) * this.gridSizeX + gridX
    }

    computeSubstance(
        x: number,
        y: number,
        z: number,
        baseNoise: number,
        clampedBaseNoise: number
    ): Blocks | null {
        if (baseNoise <= -64) {
            return this.globalFluidPicker.computeFluid(x, y, z).at(y)
        } else {
            if (clampedBaseNoise <= 0) {
                const fluidStatus = this.globalFluidPicker.computeFluid(x, y, z)
                let clampedMaxPressureMulBySim: number
                let blockstate: Blocks
                let shouldScheduleFluidUpdate: boolean
                if (fluidStatus.at(y) === Blocks.LAVA) {
                    blockstate = Blocks.LAVA
                    clampedMaxPressureMulBySim = 0
                    shouldScheduleFluidUpdate = false
                } else {
                    const someX = Mth.floorDiv(x - 5, 16)
                    const someY = Mth.floorDiv(y + 1, 12)
                    const someZ = Mth.floorDiv(z - 5, 16)

                    let minDistanceSq0 = Integer_MAX_VALUE
                    let minDistanceSq1 = Integer_MAX_VALUE
                    let minDistanceSq2 = Integer_MAX_VALUE

                    let minLocation0 = 0n
                    let minLocation1 = 0n
                    let minLocation2 = 0n

                    for (let xOffset = 0; xOffset <= 1; ++xOffset) {
                        for (let yOffset = -1; yOffset <= 1; ++yOffset) {
                            for (let zOffset = 0; zOffset <= 1; ++zOffset) {
                                const currentX = someX + xOffset
                                const currentY = someY + yOffset
                                const currentZ = someZ + zOffset
                                const gridIndex = this.getIndex(currentX, currentY, currentZ)
                                const cachedLocation = this.aquiferLocationCache[gridIndex]
                                let location: bigint
                                if (cachedLocation != Long_MAX_VALUE) {
                                    location = cachedLocation
                                } else {
                                    const randomSource = this.positionalRandomFactory.at(
                                        currentX,
                                        currentY,
                                        currentZ
                                    )
                                    location = BlockPos.asLong(
                                        currentX * 16 + randomSource.nextInt(10),
                                        currentY * 12 + randomSource.nextInt(9),
                                        currentZ * 16 + randomSource.nextInt(10)
                                    )
                                    this.aquiferLocationCache[gridIndex] = location
                                }

                                const dx = BlockPos.getX(location) - x
                                const dy = BlockPos.getY(location) - y
                                const dz = BlockPos.getZ(location) - z

                                const distanceSq = dx * dx + dy * dy + dz * dz

                                if (minDistanceSq0 >= distanceSq) {
                                    minLocation2 = minLocation1
                                    minLocation1 = minLocation0
                                    minLocation0 = location
                                    minDistanceSq2 = minDistanceSq1
                                    minDistanceSq1 = minDistanceSq0
                                    minDistanceSq0 = distanceSq
                                } else if (minDistanceSq1 >= distanceSq) {
                                    minLocation2 = minLocation1
                                    minLocation1 = location
                                    minDistanceSq2 = minDistanceSq1
                                    minDistanceSq1 = distanceSq
                                } else if (minDistanceSq2 >= distanceSq) {
                                    minLocation2 = location
                                    minDistanceSq2 = distanceSq
                                }
                            }
                        }
                    }

                    const minFluidStatus0 = this.getAquiferStatus(minLocation0)
                    const minFluidStatus1 = this.getAquiferStatus(minLocation1)
                    const minFluidStatus2 = this.getAquiferStatus(minLocation2)

                    const sim01 = NoiseBasedAquifer.similarity(minDistanceSq0, minDistanceSq1)
                    const sim02 = NoiseBasedAquifer.similarity(minDistanceSq0, minDistanceSq2)
                    const sim12 = NoiseBasedAquifer.similarity(minDistanceSq1, minDistanceSq2)

                    shouldScheduleFluidUpdate = sim01 >= NoiseBasedAquifer.FLOWING_UPDATE_SIMULARITY
                    if (
                        minFluidStatus0.at(y) === Blocks.WATER &&
                        this.globalFluidPicker.computeFluid(x, y - 1, z).at(y - 1) === Blocks.LAVA
                    ) {
                        clampedMaxPressureMulBySim = 1
                    } else if (sim01 > -1) {
                        const barrierNoise = new MutableDouble(NaN)
                        const pressure01 = this.calculatePressure(
                            x,
                            y,
                            z,
                            barrierNoise,
                            minFluidStatus0,
                            minFluidStatus1
                        )
                        const pressure02 = this.calculatePressure(
                            x,
                            y,
                            z,
                            barrierNoise,
                            minFluidStatus0,
                            minFluidStatus2
                        )
                        const pressure12 = this.calculatePressure(
                            x,
                            y,
                            z,
                            barrierNoise,
                            minFluidStatus1,
                            minFluidStatus2
                        )
                        const clampedSim01 = Math.max(0, sim01)
                        const clampedSim02 = Math.max(0, sim02)
                        const clampedSim12 = Math.max(0, sim12)
                        const maxPressureMulBySim =
                            2 *
                            clampedSim01 *
                            Math.max(
                                pressure01,
                                Math.max(pressure02 * clampedSim02, pressure12 * clampedSim12)
                            )
                        clampedMaxPressureMulBySim = Math.max(0, maxPressureMulBySim)
                    } else {
                        clampedMaxPressureMulBySim = 0
                    }

                    blockstate = minFluidStatus0.at(y)
                }

                if (clampedBaseNoise + clampedMaxPressureMulBySim <= 0) {
                    this._shouldScheduleFluidUpdate = shouldScheduleFluidUpdate
                    return blockstate
                }
            }

            this._shouldScheduleFluidUpdate = false
            return null
        }
    }

    shouldScheduleFluidUpdate(): boolean {
        return this._shouldScheduleFluidUpdate
    }

    private static similarity(distanceSq0: number, distanceSq1: number): number {
        return 1 - Math.abs(distanceSq1 - distanceSq0) / 25
    }

    private calculatePressure(
        x: number,
        y: number,
        z: number,
        savedBarrierNoise: MutableDouble,
        fluidStart: FluidStatus,
        fluidEnd: FluidStatus
    ): number {
        const startBlock = fluidStart.at(y)
        const endBlock = fluidEnd.at(y)
        if (
            (startBlock !== Blocks.LAVA || endBlock !== Blocks.WATER) &&
            (startBlock !== Blocks.WATER || endBlock !== Blocks.LAVA)
        ) {
            const fluidDistance = Math.abs(fluidStart.fluidLevel - fluidEnd.fluidLevel)
            if (fluidDistance == 0) {
                return 0
            } else {
                const fluidMiddleLevel = 0.5 * (fluidStart.fluidLevel + fluidEnd.fluidLevel)
                const distanceAboveFluidMiddleLevel = y + 0.5 - fluidMiddleLevel
                const halfFluidDistance = fluidDistance / 2
                const distanceToFluidEdge =
                    halfFluidDistance - Math.abs(distanceAboveFluidMiddleLevel)
                let pressure: number
                // above middle level
                if (distanceAboveFluidMiddleLevel > 0) {
                    const shiftedDistanceToFluidEdge = 0 + distanceToFluidEdge
                    // before the edge
                    if (shiftedDistanceToFluidEdge > 0) {
                        pressure = shiftedDistanceToFluidEdge / 1.5
                    } else {
                        // past the edge
                        pressure = shiftedDistanceToFluidEdge / 2.5
                    }
                } else {
                    // below middle level
                    const shiftedDistanceToFluidEdge = 3 + distanceToFluidEdge
                    // before the edge
                    if (shiftedDistanceToFluidEdge > 0) {
                        pressure = shiftedDistanceToFluidEdge / 3
                    } else {
                        // past the edge
                        pressure = shiftedDistanceToFluidEdge / 10
                    }
                }

                if (!(pressure < -2) && !(pressure > 2)) {
                    const currentBarrierNoise = savedBarrierNoise.getValue()
                    if (isNaN(currentBarrierNoise)) {
                        const barrierNoise = this.barrierNoise.getValue(x, y * 0.5, z)
                        savedBarrierNoise.setValue(barrierNoise)
                        return barrierNoise + pressure
                    } else {
                        return currentBarrierNoise + pressure
                    }
                } else {
                    return pressure
                }
            }
        } else {
            return 1
        }
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

    private getAquiferStatus(coord: bigint): FluidStatus {
        const x = BlockPos.getX(coord)
        const y = BlockPos.getY(coord)
        const z = BlockPos.getZ(coord)
        const gridX = this.gridX(x)
        const gridY = this.gridY(y)
        const gridZ = this.gridZ(z)
        const gridIndex = this.getIndex(gridX, gridY, gridZ)
        const fluidStatus = this.aquiferCache[gridIndex]
        if (fluidStatus != null) {
            return fluidStatus
        } else {
            const fluidStatus = this.computeFluid(x, y, z)
            this.aquiferCache[gridIndex] = fluidStatus
            return fluidStatus
        }
    }

    public computeFluid(x: number, y: number, z: number): FluidStatus {
        const fluidStatus = this.globalFluidPicker.computeFluid(x, y, z)
        let minSurfaceY = Integer_MAX_VALUE
        const maxY = y + 12
        const minY = y - 12
        let haveFluidAtMaxSurfaceYinPlace = false

        for (const offset of NoiseBasedAquifer.SURFACE_SAMPLING_OFFSETS_IN_CHUNKS) {
            const shiftedX = x + SectionPos.sectionToBlockCoord(offset[0])
            const shiftedZ = z + SectionPos.sectionToBlockCoord(offset[1])
            const surfaceY = this.noiseChunk.preliminarySurfaceLevel(shiftedX, shiftedZ)
            const maxSurfaceY = surfaceY + 8
            const isOffsetInPlace = offset[0] == 0 && offset[1] == 0
            if (isOffsetInPlace && minY > maxSurfaceY) {
                return fluidStatus
            }

            const isMaxSurfaceYinYRange = maxY > maxSurfaceY
            if (isMaxSurfaceYinYRange || isOffsetInPlace) {
                const fluidStatus = this.globalFluidPicker.computeFluid(
                    shiftedX,
                    maxSurfaceY,
                    shiftedZ
                )
                if (fluidStatus.at(maxSurfaceY) !== Blocks.AIR) {
                    if (isOffsetInPlace) {
                        haveFluidAtMaxSurfaceYinPlace = true
                    }

                    if (isMaxSurfaceYinYRange) {
                        return fluidStatus
                    }
                }
            }

            minSurfaceY = Math.min(minSurfaceY, surfaceY)
        }

        const distanceBetweenMinSurfaceYandYPlus8 = minSurfaceY + 8 - y
        const t = haveFluidAtMaxSurfaceYinPlace
            ? Mth.clampedMap(distanceBetweenMinSurfaceYandYPlus8, 0, 64, 1, 0)
            : 0
        const floodedness = Mth.clamp(
            this.fluidLevelFloodednessNoise.getValue(x, y * 0.67, z),
            -1,
            1
        )
        const minFloodedness = Mth.map(t, 1, 0, -0.3, 0.8)
        if (floodedness > minFloodedness) {
            return fluidStatus
        } else {
            const d5 = Mth.map(t, 1, 0, -0.8, 0.4)
            if (floodedness <= d5) {
                return new FluidStatus(DimensionType.WAY_BELOW_MIN_Y, fluidStatus.fluidType)
            } else {
                const scaledX = Mth.floorDiv(x, 16)
                const scaledY = Mth.floorDiv(y, 40)
                const scaledZ = Mth.floorDiv(z, 16)
                const fluidBaseY = scaledY * 40 + 20
                const fluidLevelSpread =
                    this.fluidLevelSpreadNoise.getValue(scaledX, scaledY / 1.4, scaledZ) * 10
                const quantizedFluidLevelSpread = Mth.quantize(fluidLevelSpread, 3)
                const fluidY = fluidBaseY + quantizedFluidLevelSpread
                const fluidLevel = Math.min(minSurfaceY, fluidY)
                const blockState = this.getFluidType(x, y, z, fluidStatus, fluidY)
                return new FluidStatus(fluidLevel, blockState)
            }
        }
    }

    private getFluidType(
        x: number,
        y: number,
        z: number,
        fluidStatus: FluidStatus,
        fluidY: number
    ): Blocks {
        if (fluidY <= -10) {
            const scaledX = Mth.floorDiv(x, 64)
            const scaledY = Mth.floorDiv(y, 40)
            const scaledZ = Mth.floorDiv(z, 64)
            const lavaNoise = this.lavaNoise.getValue(scaledX, scaledY, scaledZ)
            if (Math.abs(lavaNoise) > 0.3) {
                return Blocks.LAVA
            }
        }

        return fluidStatus.fluidType
    }
}

export class Aquifer {
    static create(
        noiseChunk: NoiseChunk,
        chunkPos: ChunkPos,
        barrierNoise: NormalNoise,
        fluidLevelFloodednessNoise: NormalNoise,
        fluidLevelSpreadNoise: NormalNoise,
        lavaNoise: NormalNoise,
        positionalRandomFactory: PositionalRandomFactory,
        y: number,
        height: number,
        picker: FluidPicker
    ): Aquifer {
        return new NoiseBasedAquifer(
            noiseChunk,
            chunkPos,
            barrierNoise,
            fluidLevelFloodednessNoise,
            fluidLevelSpreadNoise,
            lavaNoise,
            positionalRandomFactory,
            y,
            height,
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
