#include "carvers.hpp"
#include "chunk-generator.hpp"
#include "providers.hpp"

CarvingContext::CarvingContext(shared_ptr<ChunkGenerator> chunkGenerator, const LevelHeightAccessor &heightAccessor,
                               shared_ptr<NoiseChunk> noiseChunk)
    : WorldGenerationContext(chunkGenerator, heightAccessor), generator(chunkGenerator), noiseChunk(noiseChunk) {
}

Blocks CarvingContext::topMaterial(shared_ptr<BiomeManager> biomeManager, shared_ptr<ChunkAccess> chunk,
                                   BlockPos blockPos, bool useWaterHeight) const {
    return this->generator->topMaterial(*this, biomeManager, chunk, this->noiseChunk, blockPos, useWaterHeight);
}

shared_ptr<ConfiguredWorldCarver> Carvers::CAVE;
shared_ptr<ConfiguredWorldCarver> Carvers::CAVE_EXTRA_UNDERGROUND;
shared_ptr<ConfiguredWorldCarver> Carvers::CANYON;

void Carvers::init() {
    Carvers::CAVE = WorldCarver::CAVE->configured(make_shared<CaveCarverConfiguration>(
        0.15F, UniformHeight::of(VerticalAnchor::aboveBottom(8), VerticalAnchor::absolute(180)),
        UniformFloat::of(0.1F, 0.9F), VerticalAnchor::aboveBottom(8), UniformFloat::of(0.7F, 1.4F),
        UniformFloat::of(0.8F, 1.3F), UniformFloat::of(-1.0F, -0.4F)));

    Carvers::CAVE_EXTRA_UNDERGROUND = WorldCarver::CAVE->configured(make_shared<CaveCarverConfiguration>(
        0.07F, UniformHeight::of(VerticalAnchor::aboveBottom(8), VerticalAnchor::absolute(47)),
        UniformFloat::of(0.1F, 0.9F), VerticalAnchor::aboveBottom(8), UniformFloat::of(0.7F, 1.4F),
        UniformFloat::of(0.8F, 1.3F), UniformFloat::of(-1.0F, -0.4F)));

    Carvers::CANYON = WorldCarver::CANYON->configured(make_shared<CanyonCarverConfiguration>(
        0.01F, UniformHeight::of(VerticalAnchor::absolute(10), VerticalAnchor::absolute(67)), ConstantFloat::of(3.0F),
        VerticalAnchor::aboveBottom(8), UniformFloat::of(-0.125F, 0.125F),
        make_shared<CanyonCarverConfiguration::CanyonShapeConfiguration>(UniformFloat::of(0.75F, 1.0F),
                                                                         TrapezoidFloat::of(0.0F, 6.0F, 2.0F), 3,
                                                                         UniformFloat::of(0.75F, 1.0F), 1.0F, 0.0F)));
}

void Carvers::free() {
    Carvers::CAVE = nullptr;
    Carvers::CAVE_EXTRA_UNDERGROUND = nullptr;
    Carvers::CANYON = nullptr;
}