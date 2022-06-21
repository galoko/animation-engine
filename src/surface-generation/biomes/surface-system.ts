import { Blocks } from "./blocks"
import {
    Algorithm,
    Algorithm_newInstance,
    PositionalRandomFactory,
    toResourceLocation,
} from "./random"
import { Noises_instantiate, Noises } from "./noise-data"
import { NormalNoise } from "./noise/normal-noise"
import { Mth } from "./mth"
import { BiomeManager } from "./biome-source"
import { ChunkAccess, LevelHeightAccessor } from "./chunks"
import { ChunkGenerator, NoiseChunk } from "./chunk-generator"
import { BlockPos, MutableBlockPos } from "./pos"
import { SurfaceRules } from "./surface-rules"
import { Heightmap } from "./heightmap"

class WorldGenerationContext {
    readonly minY: number
    readonly height: number

    constructor(chunkGenerator: ChunkGenerator, heightAccessor: LevelHeightAccessor) {
        this.minY = Math.max(heightAccessor.getMinBuildHeight(), chunkGenerator.getMinY())
        this.height = Math.min(heightAccessor.getHeight(), chunkGenerator.getGenDepth())
    }
}

interface BlockColumn {
    getBlock(y: number): Blocks
    setBlock(y: number, block: Blocks): void
}

export class SurfaceSystem {
    private readonly noiseIntances = new Map<Noises, NormalNoise>()
    private readonly positionalRandoms = new Map<string, PositionalRandomFactory>()
    private readonly randomFactory: PositionalRandomFactory
    private readonly surfaceNoise: NormalNoise
    private readonly surfaceSecondaryNoise: NormalNoise

    constructor(
        private readonly defaultBlock: Blocks,
        private readonly seaLevel: number,
        seed: bigint,
        algorithm: Algorithm
    ) {
        this.randomFactory = Algorithm_newInstance(algorithm, seed).forkPositional()

        this.surfaceNoise = Noises_instantiate(this.randomFactory, Noises.SURFACE)
        this.surfaceSecondaryNoise = Noises_instantiate(
            this.randomFactory,
            Noises.SURFACE_SECONDARY
        )
    }

    protected getOrCreateNoise(noise: Noises): NormalNoise {
        return Mth.computeIfAbsent(this.noiseIntances, noise, () => {
            return Noises_instantiate(this.randomFactory, noise)
        })
    }

    protected getOrCreateRandomFactory(name: string): PositionalRandomFactory {
        return Mth.computeIfAbsent(this.positionalRandoms, name, () => {
            return this.randomFactory.fromHashOf(toResourceLocation(name)).forkPositional()
        })
    }

    /*
     public  buildSurface( biomeManager: BiomeManager,  useLegacyRandomSource: boolean,  generationContext: WorldGenerationContext,   chunkAccess: ChunkAccess,  noiseChunk: NoiseChunk,  surfaceRule: RuleSource): void {
        const blockPos = new MutableBlockPos();
        const chunkpos = chunkAccess.getPos();
        const startX = chunkpos.getMinBlockX();
        const startZ = chunkpos.getMinBlockZ();
        const blockcolumn = {
             getBlock: (y: number) => chunkAccess.getBlockState(blockPos.setY(y)),
             
  
            setBlock: (y: number,  blockState: Blocks) => {
              const heightAccessor = chunkAccess.getHeightAccessorForGeneration();
              if (y >= heightAccessor.getMinBuildHeight() && y < heightAccessor.getMaxBuildHeight()) {
                 chunkAccess.setBlockState(blockPos.setY(y), blockState, false);
                 
                 if (!blockState.getFluidState().isEmpty()) {
                    chunkAccess.markPosForPostprocessing(blockPos);
                 }
                 
              }
  
           }
        };
        const surfaceContext = new SurfaceRules.Context(this, chunkAccess, noiseChunk, p_189945_::getBiome, biomeRegistry, generationContext);
        const surfacerules$surfacerule = surfaceRule.apply(surfaceContext);
        const blockpos$mutableblockpos1 = new MutableBlockPos();
  
        for(let offsetX = 0; offsetX < 16; ++offsetX) {
           for(let offsetZ = 0; offsetZ < 16; ++offsetZ) {
              const x = startX + offsetX;
              const z = startZ + offsetZ;
              const initialY = chunkAccess.getHeight(Heightmap.Types.WORLD_SURFACE_WG, offsetX, offsetZ) + 1;
              blockpos$mutableblockpos.setX(x).setZ(z);
              Biome biome = p_189945_.getBiome(blockpos$mutableblockpos1.set(x, p_189947_ ? 0 : initialY, z));
              ResourceKey<Biome> resourcekey = biomeRegistry.getResourceKey(biome).orElseThrow(() -> {
                 return new IllegalStateException("Unregistered biome: " + biome);
              });
              if (resourcekey == Biomes.ERODED_BADLANDS) {
                 this.erodedBadlandsExtension(blockcolumn, x, z, initialY, chunkAccess);
              }
  
              int maxY = chunkAccess.getHeight(Heightmap.Types.WORLD_SURFACE_WG, offsetX, offsetZ) + 1;
              surfaceContext.updateXZ(x, z);
              int startY = 0;
              int waterY = Integer.MIN_VALUE;
              int beforeStoneY = Integer.MAX_VALUE;
              int minY = chunkAccess.getMinBuildHeight();
  
              for(int y = maxY; y >= minY; --y) {
                 BlockState blockstate = blockcolumn.getBlock(y);
                 if (blockstate.isAir()) {
                    startY = 0;
                    waterY = Integer.MIN_VALUE;
                 } else if (!blockstate.getFluidState().isEmpty()) {
                    if (waterY == Integer.MIN_VALUE) {
                       waterY = y + 1;
                    }
                 } else {
                    if (beforeStoneY >= y) {
                       beforeStoneY = DimensionType.WAY_BELOW_MIN_Y;
  
                       for(int currentY = y - 1; currentY >= minY - 1; --currentY) {
                          BlockState blockstate1 = blockcolumn.getBlock(currentY);
                          if (!this.isStone(blockstate1)) {
                             beforeStoneY = currentY + 1;
                             break;
                          }
                       }
                    }
  
                    ++startY;
                    int countY = y - beforeStoneY + 1;
                    surfaceContext.updateY(startY, countY, waterY, x, y, z);
                    if (blockstate == this.defaultBlock) {
                       BlockState blockstate2 = surfacerules$surfacerule.tryApply(x, y, z);
                       if (blockstate2 != null) {
                          blockcolumn.setBlock(y, blockstate2);
                       }
                    }
                 }
              }
  
              if (resourcekey == Biomes.FROZEN_OCEAN || resourcekey == Biomes.DEEP_FROZEN_OCEAN) {
                 this.frozenOceanExtension(surfaceContext.getMinSurfaceLevel(), biome, blockcolumn, blockpos$mutableblockpos1, x, z, initialY);
              }
           }
        }
  
     }
  
     protected int getSurfaceDepth(int p_189928_, int p_189929_) {
        return this.getSurfaceDepth(this.surfaceNoise, p_189928_, p_189929_);
     }
  
     protected int getSurfaceSecondaryDepth(int p_189994_, int p_189995_) {
        return this.getSurfaceDepth(this.surfaceSecondaryNoise, p_189994_, p_189995_);
     }
  
     private int getSurfaceDepth(NormalNoise p_189980_, int p_189981_, int p_189982_) {
        return (int)(p_189980_.getValue((double)p_189981_, 0.0D, (double)p_189982_) * 2.75D + 3.0D + this.randomFactory.at(p_189981_, 0, p_189982_).nextDouble() * 0.25D);
     }
  
     private boolean isStone(BlockState p_189953_) {
        return !p_189953_.isAir() && p_189953_.getFluidState().isEmpty();
     }
     */
}
