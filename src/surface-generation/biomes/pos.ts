import { Mth } from "./mth"

export class BlockPos {
    private static readonly PACKED_X_LENGTH = BigInt(
        1 + Mth.log2(Mth.smallestEncompassingPowerOfTwo(30000000))
    )
    private static readonly PACKED_Z_LENGTH = BlockPos.PACKED_X_LENGTH
    public static readonly PACKED_Y_LENGTH =
        64n - BlockPos.PACKED_X_LENGTH - BlockPos.PACKED_Z_LENGTH
    private static readonly PACKED_X_MASK = (1n << BigInt(BlockPos.PACKED_X_LENGTH)) - 1n
    private static readonly PACKED_Y_MASK = (1n << BigInt(BlockPos.PACKED_Y_LENGTH)) - 1n
    private static readonly PACKED_Z_MASK = (1n << BigInt(BlockPos.PACKED_Z_LENGTH)) - 1n
    private static readonly Y_OFFSET = 0n
    private static readonly Z_OFFSET = BlockPos.PACKED_Y_LENGTH
    private static readonly X_OFFSET = BlockPos.PACKED_Y_LENGTH + BlockPos.PACKED_Z_LENGTH

    constructor(public x: number, public y: number, public z: number) {}

    public static getX(num: bigint): number {
        return Mth.toInt(
            (num << (64n - BlockPos.X_OFFSET - BlockPos.PACKED_X_LENGTH)) >>
                (64n - BlockPos.PACKED_X_LENGTH)
        )
    }

    public static getY(num: bigint): number {
        return Mth.toInt(
            (num << (64n - BlockPos.PACKED_Y_LENGTH)) >> (64n - BlockPos.PACKED_Y_LENGTH)
        )
    }

    public static getZ(num: bigint): number {
        return Mth.toInt(
            (num << (64n - BlockPos.Z_OFFSET - BlockPos.PACKED_Z_LENGTH)) >>
                (64n - BlockPos.PACKED_Z_LENGTH)
        )
    }

    public static asLong(x: number, y: number, z: number): bigint {
        let result = 0n
        result |= (Mth.toLong(x) & BlockPos.PACKED_X_MASK) << BlockPos.X_OFFSET
        result |= (Mth.toLong(y) & BlockPos.PACKED_Y_MASK) << BlockPos.Y_OFFSET
        return result | ((Mth.toLong(z) & BlockPos.PACKED_Z_MASK) << BlockPos.Z_OFFSET)
    }
}

export abstract class SectionPos {
    public static blockToSectionCoord(coord: number): number {
        return coord >> 4
    }

    public static sectionToBlockCoord(coord: number, offset?: number): number {
        return (coord << 4) + (offset ?? 0)
    }
}

export class MutableBlockPos extends BlockPos {
    constructor(x = 0, y = 0, z = 0) {
        super(x, y, z)
    }

    setY(y: number): MutableBlockPos {
        this.y = y
        return this
    }

    set(x: number, y: number, z: number): MutableBlockPos {
        this.x = x
        this.y = y
        this.z = z
        return this
    }
}
