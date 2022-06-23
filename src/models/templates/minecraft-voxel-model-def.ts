import { cloneTransform, TransformData } from "../../components/transformComponent"
import { Model } from "../model"
import { ModelDef, ModelDefEntry } from "../model-def"
import { UP as RendererUP } from "../../managers/render"

import { Mth } from "../../surface-generation/biomes/mth"
import { hashCode } from "../../surface-generation/biomes/random"
import { OverworldBiomeBuilder } from "../../surface-generation/biomes/overworld-biome-builder"
import { Pair } from "../../surface-generation/biomes/consumer"
import { Climate } from "../../surface-generation/biomes/climate"
import { Biomes } from "../../surface-generation/biomes/biomes"
import { MultiNoiseBiomeSource } from "../../surface-generation/biomes/biome-source"
import {
    ChunkPos,
    NoiseBasedChunkGenerator,
    NoiseGeneratorSettings,
} from "../../surface-generation/biomes/chunk-generator"
import {
    ChunkAccess,
    LevelHeightAccessor,
    ProtoChunk,
} from "../../surface-generation/biomes/chunks"
import { ChunkStatus } from "../../surface-generation/biomes/chunk-status"
import { BlockPos, MutableBlockPos } from "../../surface-generation/biomes/pos"
import { Services } from "../../managers/services"
import { quat, vec2, vec3, vec4 } from "gl-matrix"
import { Blocks } from "../../surface-generation/biomes/blocks"

class ChunkMap {
    readonly startPos: ChunkPos
    readonly endPos: ChunkPos
    readonly heightAccessor: LevelHeightAccessor
    private readonly chunks: ChunkAccess[]

    constructor(startX: number, startZ: number, endX: number, endZ: number) {
        const seed = Mth.toLong(hashCode("test"))

        // get list of biomes
        const builder = new OverworldBiomeBuilder()
        const biomes = [] as Pair<Climate.ParameterPoint, Biomes>[]
        builder.addBiomes(biomes)

        const biomeSource = new MultiNoiseBiomeSource(biomes)
        const settings = NoiseGeneratorSettings.OVERWORLD
        const chunkGenerator = new NoiseBasedChunkGenerator(biomeSource, seed, settings)

        this.heightAccessor = new LevelHeightAccessor()

        const startPos = new ChunkPos(new BlockPos(startX, 0, startZ))
        const endPos = new ChunkPos(new BlockPos(endX, 0, endZ))

        this.startPos = startPos
        this.endPos = endPos

        this.chunks = new Array(this.xLength * this.zLength)

        for (let chunkX = startPos.x; chunkX <= endPos.x; chunkX++) {
            for (let chunkZ = startPos.z; chunkZ <= endPos.z; chunkZ++) {
                const chunkPos = new ChunkPos(chunkX, chunkZ)
                const chunk = new ProtoChunk(chunkPos, this.heightAccessor)

                ChunkStatus.BIOMES.generate(null!, chunkGenerator, chunkAccess => chunkAccess, [
                    chunk,
                ])
                ChunkStatus.NOISE.generate(null!, chunkGenerator, chunkAccess => chunkAccess, [
                    chunk,
                ])

                const chunkIndex = this.getChunkIndex(chunkX, chunkZ)
                this.chunks[chunkIndex] = chunk
            }
        }
    }

    private getChunkIndex(chunkX: number, chunkZ: number): number {
        const x = chunkX - this.startPos.x
        const z = chunkZ - this.startPos.z
        return z * this.xLength + x
    }

    getBlock(pos: BlockPos, offset: vec3): Blocks | undefined {
        const shiftedPos = new BlockPos(pos.x + offset[0], pos.y + offset[1], pos.z + offset[2])

        const chunkPos = new ChunkPos(shiftedPos)

        if (
            chunkPos.x < this.startPos.x ||
            chunkPos.x > this.endPos.x ||
            chunkPos.z < this.startPos.z ||
            chunkPos.z > this.endPos.z
        ) {
            return undefined
        }

        const chunkIndex = this.getChunkIndex(chunkPos.x, chunkPos.z)
        const chunk = this.chunks[chunkIndex]

        return chunk && chunk.getBlockState(shiftedPos)
    }

    get xLength(): number {
        return this.endPos.x - this.startPos.x
    }

    get zLength(): number {
        return this.endPos.z - this.startPos.z
    }
}

function isTransparent(block: Blocks): boolean {
    return block === Blocks.AIR || block == Blocks.WATER
}

function rotate(pos: vec3, srcNormal: vec3, dstNormal: vec3): void {
    const cross = vec3.create()
    vec3.cross(cross, srcNormal, dstNormal)

    const cos = vec3.dot(srcNormal, dstNormal)
    const sin = vec3.len(cross)

    if (cos >= 1 - 1e-4) {
        return
    }

    if (cos <= -1 + 1e-4) {
        vec3.scale(pos, pos, -1)
        return
    }

    const a = Math.atan2(sin, cos) * 0.5

    const c = Math.cos(a)
    const s = Math.sin(a)

    vec3.scale(cross, cross, c / sin)

    const q = quat.fromValues(cross[0], cross[1], cross[2], s)

    vec3.transformQuat(pos, pos, q)
}

const BLOCK_TO_TEXTURE_PIXEL: { [key in Blocks]?: number | number[] } = {}
BLOCK_TO_TEXTURE_PIXEL[Blocks.STONE] = 1
BLOCK_TO_TEXTURE_PIXEL[Blocks.SAND] = 2
BLOCK_TO_TEXTURE_PIXEL[Blocks.DIRT] = 3
BLOCK_TO_TEXTURE_PIXEL[Blocks.WATER] = 4
BLOCK_TO_TEXTURE_PIXEL[Blocks.GRASS] = [5, 3, 6, 6, 6, 6]

export class MinecraftModelDef extends ModelDef {
    private entries: ModelDefEntry[] = []

    constructor() {
        super()
        this.generateModels()
    }

    generateModels(): void {
        const vertices = [] as number[]
        const transparentVertices = [] as number[]

        const INPLACE = vec3.fromValues(0, 0, 0)

        const UP = vec3.fromValues(0, 1, 0)
        const DOWN = vec3.fromValues(0, -1, 0)
        const LEFT = vec3.fromValues(-1, 0, 0)
        const RIGHT = vec3.fromValues(1, 0, 0)
        const FRONT = vec3.fromValues(0, 0, 1)
        const BACK = vec3.fromValues(0, 0, -1)

        const SIDES = [UP, DOWN, LEFT, RIGHT, FRONT, BACK]

        const DEFAULT_VERTICES = [
            vec3.fromValues(-0.5, 0.5, -0.5),
            vec3.fromValues(0.5, 0.5, -0.5),
            vec3.fromValues(-0.5, 0.5, 0.5),
            vec3.fromValues(0.5, 0.5, -0.5),
            vec3.fromValues(-0.5, 0.5, 0.5),
            vec3.fromValues(0.5, 0.5, 0.5),
        ]
        const DEFAULT_UV = [
            vec2.fromValues(0, 0),
            vec2.fromValues(1, 0),
            vec2.fromValues(0, 1),
            vec2.fromValues(1, 0),
            vec2.fromValues(0, 1),
            vec2.fromValues(1, 1),
        ]
        const DEFAULT_NORMAL = vec3.fromValues(0, 1, 0)

        const renderPos = vec3.create()
        const renderNormal = vec3.create()
        const vert = vec3.create()

        const addPlane = (
            pos: vec3,
            normal: vec3,
            textureIndex: number,
            isTransparent: boolean
        ) => {
            const dst = isTransparent ? transparentVertices : vertices

            const uOffset = (textureIndex * 16) / 256
            const vOffset = 0 / 16

            for (let vertIndex = 0; vertIndex < DEFAULT_VERTICES.length; vertIndex++) {
                const DEFAULT_VERT = DEFAULT_VERTICES[vertIndex]
                const uv = DEFAULT_UV[vertIndex]

                vec3.copy(vert, DEFAULT_VERT)
                rotate(vert, DEFAULT_NORMAL, normal)
                vec3.add(vert, vert, pos)
                vec3.add(vert, vert, vec3.fromValues(0, 0, 0.5))

                dst.push(...vert, ...normal, uv[0] / 16 + uOffset, uv[1] + vOffset)
            }
        }

        const chunkMap = new ChunkMap(0, 0, 16 * 4, 16 * 4)

        const blockPos = new MutableBlockPos()
        for (
            let y = chunkMap.heightAccessor.getMinBuildHeight();
            y <= chunkMap.heightAccessor.getMaxBuildHeight();
            y++
        ) {
            for (
                let x = chunkMap.startPos.getMinBlockX();
                x <= chunkMap.endPos.getMaxBlockX();
                x++
            ) {
                for (
                    let z = chunkMap.startPos.getMinBlockZ();
                    z <= chunkMap.endPos.getMaxBlockZ();
                    z++
                ) {
                    blockPos.set(x, y, z)

                    const block = chunkMap.getBlock(blockPos, INPLACE)
                    if (!block || block === Blocks.AIR) {
                        continue
                    }

                    const transparent = isTransparent(block)

                    for (let sideIndex = 0; sideIndex < SIDES.length; sideIndex++) {
                        if (sideIndex !== 5) {
                            // continue
                        }

                        const normal = SIDES[sideIndex]
                        const neighbor = chunkMap.getBlock(blockPos, normal)

                        if (neighbor !== block && (!neighbor || isTransparent(neighbor))) {
                            vec3.set(renderPos, x, y - 37, z)
                            rotate(renderPos, UP, RendererUP)

                            vec3.copy(renderNormal, normal)
                            rotate(renderNormal, UP, RendererUP)

                            let textureIndex = BLOCK_TO_TEXTURE_PIXEL[block] ?? 0
                            if (typeof textureIndex !== "number") {
                                textureIndex = textureIndex[sideIndex]
                            }

                            addPlane(renderPos, renderNormal, textureIndex, transparent)
                        }
                    }
                }
            }
        }

        // debugger

        const gl = Services.render.gl

        const vertexBuffer = gl.createBuffer()!
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer)
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW)

        const transparentBuffer = gl.createBuffer()!
        gl.bindBuffer(gl.ARRAY_BUFFER, transparentBuffer)
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(transparentVertices), gl.STATIC_DRAW)

        const model = new Model(vertexBuffer, vertices.length / Model.STRIDE)
        const transparentModel = new Model(
            transparentBuffer,
            transparentVertices.length / Model.STRIDE
        )

        this.entries = [
            { model: model, transform: undefined! },
            { model: transparentModel, transform: undefined! },
        ]
    }

    update(transform: TransformData): void {
        for (const entry of this.entries) {
            entry.transform = cloneTransform(transform)
        }
    }

    getEntries(): ModelDefEntry[] {
        if (this.entries === undefined) {
            throw new Error("Models are not loaded.")
        }

        return this.entries
    }
}
