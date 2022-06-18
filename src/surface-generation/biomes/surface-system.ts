import { Blocks } from "./blocks"
import {
    Algorithm,
    Algorithm_newInstance,
    PositionalRandomFactory,
    toResourceLocation,
} from "./random"
import { Noises_instantiate, Noises } from "./noise-data"
import { NormalNoise } from "./noise/normal-noise"
import * as Mth from "./mth"

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

    /*
    protected getOrCreateNoise(noise: Noises): NormalNoise {
        return Mth.computeIfAbsent(this.noiseIntances, noise, () => {
           return Noises_instantiate(this.randomFactory, noise);
        });
     }
  
     protected  getOrCreateRandomFactory(name: string): PositionalRandomFactory {
        return Mth.computeIfAbsent(this.positionalRandoms, name, () => {
           return this.randomFactory.fromHashOf(toResourceLocation(name)).forkPositional();
        });
     }
  
     public  buildSurface( p_189945_: BiomeManager,  p_189947_: boolean,  generationContext: WorldGenerationContext,   chunkAccess: ChunkAccess,  noiseChunk: NoiseChunk,  p_189951_: RuleSource): void {
        const blockpos$mutableblockpos = new BlockPos.MutableBlockPos();
        const chunkpos = chunkAccess.getPos();
        const startX = chunkpos.getMinBlockX();
        const startZ = chunkpos.getMinBlockZ();
        const blockcolumn = new BlockColumn() {
           public BlockState getBlock(int y) {
              return chunkAccess.getBlockState(blockpos$mutableblockpos.setY(y));
           }
  
           public void setBlock(int y, BlockState blockState) {
              LevelHeightAccessor levelheightaccessor = chunkAccess.getHeightAccessorForGeneration();
              if (y >= levelheightaccessor.getMinBuildHeight() && y < levelheightaccessor.getMaxBuildHeight()) {
                 chunkAccess.setBlockState(blockpos$mutableblockpos.setY(y), blockState, false);
                 if (!blockState.getFluidState().isEmpty()) {
                    chunkAccess.markPosForPostprocessing(blockpos$mutableblockpos);
                 }
              }
  
           }
  
           public String toString() {
              return "ChunkBlockColumn " + chunkpos;
           }
        };
        SurfaceRules.Context surfacerules$context = new SurfaceRules.Context(this, chunkAccess, noiseChunk, p_189945_::getBiome, biomeRegistry, generationContext);
        SurfaceRules.SurfaceRule surfacerules$surfacerule = p_189951_.apply(surfacerules$context);
        BlockPos.MutableBlockPos blockpos$mutableblockpos1 = new BlockPos.MutableBlockPos();
  
        for(int offsetX = 0; offsetX < 16; ++offsetX) {
           for(int offsetZ = 0; offsetZ < 16; ++offsetZ) {
              int x = startX + offsetX;
              int z = startZ + offsetZ;
              int initialY = chunkAccess.getHeight(Heightmap.Types.WORLD_SURFACE_WG, offsetX, offsetZ) + 1;
              blockpos$mutableblockpos.setX(x).setZ(z);
              Biome biome = p_189945_.getBiome(blockpos$mutableblockpos1.set(x, p_189947_ ? 0 : initialY, z));
              ResourceKey<Biome> resourcekey = biomeRegistry.getResourceKey(biome).orElseThrow(() -> {
                 return new IllegalStateException("Unregistered biome: " + biome);
              });
              if (resourcekey == Biomes.ERODED_BADLANDS) {
                 this.erodedBadlandsExtension(blockcolumn, x, z, initialY, chunkAccess);
              }
  
              int maxY = chunkAccess.getHeight(Heightmap.Types.WORLD_SURFACE_WG, offsetX, offsetZ) + 1;
              surfacerules$context.updateXZ(x, z);
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
                    surfacerules$context.updateY(startY, countY, waterY, x, y, z);
                    if (blockstate == this.defaultBlock) {
                       BlockState blockstate2 = surfacerules$surfacerule.tryApply(x, y, z);
                       if (blockstate2 != null) {
                          blockcolumn.setBlock(y, blockstate2);
                       }
                    }
                 }
              }
  
              if (resourcekey == Biomes.FROZEN_OCEAN || resourcekey == Biomes.DEEP_FROZEN_OCEAN) {
                 this.frozenOceanExtension(surfacerules$context.getMinSurfaceLevel(), biome, blockcolumn, blockpos$mutableblockpos1, x, z, initialY);
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
