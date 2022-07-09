#include "chunks.hpp"
#include "chunk-generator.hpp"
#include "chunk-status.hpp"
#include "heightmap.hpp"
#include "noise-chunk.hpp"

Heightmap *ChunkAccess::getOrCreateHeightmapUnprimed(HeightmapTypes type) {
    return computeIfAbsent<HeightmapTypes, Heightmap *>(
        *this->heightmaps, type, [this](HeightmapTypes type) -> Heightmap * { return new Heightmap(this, type); });
}

int32_t ChunkAccess::getHeight(HeightmapTypes type, int32_t x, int32_t z) {
    Heightmap *heightmap = this->heightmaps->find(type)->second;
    if (heightmap == nullptr) {
        Heightmap::primeHeightmaps(this, {type});
        heightmap = this->heightmaps->at(type);
    }

    return heightmap->getFirstAvailable(x & 15, z & 15) - 1;
}

NoiseChunk *ChunkAccess::getOrCreateNoiseChunk(NoiseSampler *sampler, function<NoiseFiller(void)> filler,
                                               NoiseGeneratorSettings *settings, Aquifer::FluidPicker *fluidPicker,
                                               Blender *blender) {
    if (this->noiseChunk == nullptr) {
        this->noiseChunk = NoiseChunk::forChunk(this, sampler, filler, settings, fluidPicker, blender);
    }

    return this->noiseChunk;
}

BlockState ChunkAccess::setBlockState(BlockPos *pos, BlockState blockState, bool checked) {
    int32_t x = pos->getX();
    int32_t y = pos->getY();
    int32_t z = pos->getZ();
    if (y >= this->getMinBuildHeight() && y < this->getMaxBuildHeight()) {
        int32_t sectionIndex = this->getSectionIndex(y);
        if (this->sections->at(sectionIndex)->hasOnlyAir() && blockState == Blocks::AIR) {
            return blockState;
        } else {
            /*
            if (blockState.getLightEmission() > 0) {
                this->lights->add(new BlockPos((x & 15) + this->getPos()->getMinBlockX(), y,
                                               (z & 15) + this->getPos()->getMinBlockZ()));
            }
            */

            LevelChunkSection *section = this->getSection(sectionIndex);

            BlockState prevBlockState = section->setBlockState(x & 15, y & 15, z & 15, blockState);
            /*
            if (this->status->isOrAfter(ChunkStatus::FEATURES) && blockState != prevBlockState &&
                (blockState.getLightBlock(this, pos) != prevBlockState.getLightBlock(this, pos) ||
                 blockState.getLightEmission() != prevBlockState.getLightEmission() ||
                 blockState.useShapeForLightOcclusion() || prevBlockState.useShapeForLightOcclusion())) {
                this->lightEngine->checkBlock(pos);
            }
            */

            vector<HeightmapTypes> &heightmapsAfter = this->getStatus()->heightmapsAfter;
            vector<HeightmapTypes> createdHeightmaps = vector<HeightmapTypes>();

            for (HeightmapTypes &type : heightmapsAfter) {
                Heightmap *heightmap = this->heightmaps->find(type)->second;
                if (heightmap == nullptr) {
                    createdHeightmaps.push_back(type);
                }
            }

            if (createdHeightmaps.size() > 0) {
                Heightmap::primeHeightmaps(this, createdHeightmaps);
            }

            for (HeightmapTypes &type : heightmapsAfter) {
                this->heightmaps->at(type)->update(x & 15, y, z & 15, blockState);
            }

            return prevBlockState;
        }
    } else {
        return Blocks::VOID_AIR;
    }
}