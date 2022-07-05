#pragma once

#include "chunks.fwd.hpp"
#include "heightmap.fwd.hpp"
#include "pos.hpp"

class LevelHeightAccessor {
public:
    virtual int32_t getHeight() = 0;

    virtual int32_t getMinBuildHeight() = 0;

    int32_t getMaxBuildHeight() {
        return this->getMinBuildHeight() + this->getHeight();
    }

    int32_t getSectionsCount() {
        return this->getMaxSection() - this->getMinSection();
    }

    int32_t getMinSection() {
        return SectionPos::blockToSectionCoord(this->getMinBuildHeight());
    }

    int32_t getMaxSection() {
        return SectionPos::blockToSectionCoord(this->getMaxBuildHeight() - 1) + 1;
    }

    bool isOutsideBuildHeight(BlockPos *pos) {
        return this->isOutsideBuildHeight(pos->getY());
    }

    bool isOutsideBuildHeight(int32_t y) {
        return y < this->getMinBuildHeight() || y >= this->getMaxBuildHeight();
    }

    int32_t getSectionIndex(int32_t y) {
        return this->getSectionIndexFromSectionY(SectionPos::blockToSectionCoord(y));
    }

    int32_t getSectionIndexFromSectionY(int32_t sectionY) {
        return sectionY - this->getMinSection();
    }

    int32_t getSectionYFromSectionIndex(int32_t sectionIndex) {
        return sectionIndex + this->getMinSection();
    }
};

class BlockGetter : public LevelHeightAccessor {
public:
    virtual BlockState getBlockState(BlockPos *p_45571_) = 0;
};

class ChunkAccess : public BlockGetter {
public:
    // TODO
    int getHighestSectionPosition() {
        return 0;
    }

    Heightmap *getOrCreateHeightmapUnprimed(HeightmapTypes p_62079_) {
        return nullptr;
    }
};