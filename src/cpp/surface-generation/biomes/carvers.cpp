#include "carvers.hpp"
#include "chunk-generator.hpp"
#include "chunks.hpp"
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

void Carvers::initialize() {
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

void Carvers::finalize() {
    Carvers::CAVE = nullptr;
    Carvers::CAVE_EXTRA_UNDERGROUND = nullptr;
    Carvers::CANYON = nullptr;
}

// CaveWorldCarver

bool CaveWorldCarver::carve(CarvingContext &context, shared_ptr<CarverConfiguration> config,
                            shared_ptr<ChunkAccess> chunk, shared_ptr<BiomeManager> biomeManager,
                            shared_ptr<Random> random, shared_ptr<Aquifer> aquifer, ChunkPos startChunkPos,
                            shared_ptr<CarvingMask> mask) {
    shared_ptr<CaveCarverConfiguration> carverConfig = static_pointer_cast<CaveCarverConfiguration>(config);

    int32_t diameter = SectionPos::sectionToBlockCoord(this->getRange() * 2 - 1);
    int32_t carvingsCount = random->nextInt(random->nextInt(random->nextInt(this->getCaveBound()) + 1) + 1);

    for (int32_t carvingIndex = 0; carvingIndex < carvingsCount; ++carvingIndex) {
        double blockX = (double)startChunkPos.getBlockX(random->nextInt(16));
        double blockY = (double)carverConfig->y->sample(random, context);
        double blockZ = (double)startChunkPos.getBlockZ(random->nextInt(16));

        double horizontalRadiusMultiplier = (double)carverConfig->horizontalRadiusMultiplier->sample(random);
        double verticalRadiusMultiplier = (double)carverConfig->verticalRadiusMultiplier->sample(random);
        double floorLevel = (double)carverConfig->floorLevel->sample(random);

        CarveSkipChecker checker = [floorLevel](CarvingContext &unused0, double normalizedX, double normalizedY,
                                                double normalizedZ, int32_t unused1) -> bool {
            return shouldSkip(normalizedX, normalizedY, normalizedZ, floorLevel);
        };

        int32_t tunnelCount = 1;
        if (random->nextInt(4) == 0) {
            double yScale = (double)carverConfig->yScale->sample(random);
            float rangeMul = 1.0F + random->nextFloat() * 6.0F;
            this->createRoom(context, carverConfig, chunk, biomeManager, aquifer, blockX, blockY, blockZ, rangeMul,
                             yScale, mask, checker);
            tunnelCount += random->nextInt(4);
        }

        for (int32_t tunnelIndex = 0; tunnelIndex < tunnelCount; ++tunnelIndex) {
            float horizontalRotation = random->nextFloat() * ((float)M_PI * 2.0F);
            float verticalRotation = (random->nextFloat() - 0.5F) / 4.0F;
            float thickness = this->getThickness(random);
            int32_t yFrom = 0;
            int32_t yTo = diameter - random->nextInt(diameter / 4);
            this->createTunnel(context, carverConfig, chunk, biomeManager, random->nextLong(), aquifer, blockX, blockY,
                               blockZ, horizontalRadiusMultiplier, verticalRadiusMultiplier, thickness,
                               horizontalRotation, verticalRotation, yFrom, yTo, this->getYScale(), mask, checker);
        }
    }

    return true;
}

void CaveWorldCarver::createRoom(CarvingContext &context, shared_ptr<CaveCarverConfiguration> config,
                                 shared_ptr<ChunkAccess> chunk, shared_ptr<BiomeManager> biomeManager,
                                 shared_ptr<Aquifer> aquifer, double ellipseX, double ellipseY, double ellipseZ,
                                 float rangeMul, double yScale, shared_ptr<CarvingMask> mask,
                                 CarveSkipChecker checker) {
    double range = 1.5 + (double)(Mth::sin(((float)M_PI / 2.0F)) * rangeMul);
    double heightRange = range * yScale;
    this->carveEllipsoid(context, config, chunk, biomeManager, aquifer, ellipseX + 1.0, ellipseY, ellipseZ, range,
                         heightRange, mask, checker);
}

void CaveWorldCarver::createTunnel(CarvingContext &context, shared_ptr<CaveCarverConfiguration> config,
                                   shared_ptr<ChunkAccess> chunk, shared_ptr<BiomeManager> biomeManager, int64_t seed,
                                   shared_ptr<Aquifer> aquifer, double ellipseX, double ellipseY, double ellipseZ,
                                   double horizontalRadiusMultiplier, double verticalRadiusMultiplier, float thickness,
                                   float horizontalRotation, float verticalRotation, int32_t yFrom, int32_t yTo,
                                   double yScale, shared_ptr<CarvingMask> mask, CarveSkipChecker checker) {
    shared_ptr<Random> random = make_shared<Random>(seed);
    int32_t branchingY = random->nextInt(yTo / 2) + yTo / 4;
    bool largeVerticalIncrement = random->nextInt(6) == 0;
    float horizontalAngleIncrement = 0.0F;
    float verticalAngleIncrement = 0.0F;

    for (int32_t y = yFrom; y < yTo; ++y) {
        double horizontalRadius = 1.5 + (double)(Mth::sin((float)M_PI * (float)y / (float)yTo) * thickness);
        double verticalRadius = horizontalRadius * yScale;

        float horizontalOffset = Mth::cos(verticalRotation);
        ellipseX += (double)(Mth::cos(horizontalRotation) * horizontalOffset);
        ellipseY += (double)Mth::sin(verticalRotation);
        ellipseZ += (double)(Mth::sin(horizontalRotation) * horizontalOffset);

        verticalRotation *= largeVerticalIncrement ? 0.92F : 0.7F;
        verticalRotation += verticalAngleIncrement * 0.1F;
        horizontalRotation += horizontalAngleIncrement * 0.1F;

        verticalAngleIncrement *= 0.9F;
        horizontalAngleIncrement *= 0.75F;

        float unknown_0 = random->nextFloat();
        float unknown_1 = random->nextFloat();
        float unknown_2 = random->nextFloat();

        verticalAngleIncrement += (unknown_0 - unknown_1) * unknown_2 * 2.0F;

        float unknown_3 = random->nextFloat();
        float unknown_4 = random->nextFloat();
        float unknown_5 = random->nextFloat();

        horizontalAngleIncrement += (unknown_3 - unknown_4) * unknown_5 * 4.0F;

        if (y == branchingY && thickness > 1.0F) {
            int64_t seed_0 = random->nextLong();
            float thickness_0 = random->nextFloat();
            this->createTunnel(context, config, chunk, biomeManager, seed_0, aquifer, ellipseX, ellipseY,
                               ellipseZ, horizontalRadiusMultiplier, verticalRadiusMultiplier,
                                thickness_0 * 0.5F + 0.5F, horizontalRotation - ((float)M_PI / 2.0F),
                               verticalRotation / 3.0F, y, yTo, 1.0, mask, checker);
            int64_t seed_1 = random->nextLong();
            float thickness_1 = random->nextFloat();
            this->createTunnel(context, config, chunk, biomeManager, seed_1, aquifer, ellipseX, ellipseY,
                               ellipseZ, horizontalRadiusMultiplier, verticalRadiusMultiplier,
                                thickness_1 * 0.5F + 0.5F, horizontalRotation + ((float)M_PI / 2.0F),
                               verticalRotation / 3.0F, y, yTo, 1.0, mask, checker);
            return;
        }

        if (random->nextInt(4) != 0) {
            if (!canReach(chunk->getPos(), ellipseX, ellipseZ, y, yTo, thickness)) {
                return;
            }

            this->carveEllipsoid(context, config, chunk, biomeManager, aquifer, ellipseX, ellipseY, ellipseZ,
                                 horizontalRadius * horizontalRadiusMultiplier,
                                 verticalRadius * verticalRadiusMultiplier, mask, checker);
        }
    }
}

// CanyonWorldCarver

bool CanyonWorldCarver::carve(CarvingContext &context, shared_ptr<CarverConfiguration> config,
                              shared_ptr<ChunkAccess> chunk, shared_ptr<BiomeManager> biomeManager,
                              shared_ptr<Random> random, shared_ptr<Aquifer> aquifer, ChunkPos startChunkPos,
                              shared_ptr<CarvingMask> mask) {
    shared_ptr<CanyonCarverConfiguration> carverConfig = static_pointer_cast<CanyonCarverConfiguration>(config);
    int32_t diameter = (this->getRange() * 2 - 1) * 16;

    double blockX = (double)startChunkPos.getBlockX(random->nextInt(16));
    int32_t blockY = carverConfig->y->sample(random, context);
    double blockZ = (double)startChunkPos.getBlockZ(random->nextInt(16));

    float horizontalRotation = random->nextFloat() * ((float)M_PI * 2.0F);
    float verticalRotation = carverConfig->verticalRotation->sample(random);
    double yScale = (double)carverConfig->yScale->sample(random);
    float thickness = carverConfig->shape->thickness->sample(random);

    int32_t yFrom = 0;
    int32_t yTo = (int32_t)((float)diameter * carverConfig->shape->distanceFactor->sample(random));

    this->doCarve(context, carverConfig, chunk, biomeManager, random->nextLong(), aquifer, blockX, (double)blockY,
                  blockZ, thickness, horizontalRotation, verticalRotation, yFrom, yTo, yScale, mask);
    return true;
}

void CanyonWorldCarver::doCarve(CarvingContext context, shared_ptr<CanyonCarverConfiguration> config,
                                shared_ptr<ChunkAccess> chunk, shared_ptr<BiomeManager> biomeManager, int64_t seed,
                                shared_ptr<Aquifer> aquifer, double blockX, double blockY, double blockZ,
                                float thickness, float horizontalRotation, float verticalRotation, int32_t yFrom,
                                int32_t yTo, double yScale, shared_ptr<CarvingMask> mask) {
    shared_ptr<Random> random = make_shared<Random>(seed);
    vector<float> widthFactors = this->initWidthFactors(context, config, random);
    CarveSkipChecker checker = [this, &widthFactors](CarvingContext &_context, double x, double _y, double z,
                                                     int32_t floorLevel) -> bool {
        return this->shouldSkip(_context, widthFactors, x, _y, z, floorLevel);
    };

    float horizontalAngleIncrement = 0.0F;
    float verticalAngleIncrement = 0.0F;
    for (int32_t y = yFrom; y < yTo; ++y) {
        double horizontalRadius = 1.5 + (double)(Mth::sin((float)y * (float)M_PI / (float)yTo) * thickness);
        double verticalRadius = horizontalRadius * yScale;

        horizontalRadius *= (double)config->shape->horizontalRadiusFactor->sample(random);
        verticalRadius = this->updateVerticalRadius(config, random, verticalRadius, (float)yTo, (float)y);

        float verticalCos = Mth::cos(verticalRotation);
        float verticalSin = Mth::sin(verticalRotation);

        blockX += (double)(Mth::cos(horizontalRotation) * verticalCos);
        blockY += (double)verticalSin;
        blockZ += (double)(Mth::sin(horizontalRotation) * verticalCos);

        verticalRotation *= 0.7F;
        verticalRotation += verticalAngleIncrement * 0.05F;
        horizontalRotation += horizontalAngleIncrement * 0.05F;

        verticalAngleIncrement *= 0.8F;
        horizontalAngleIncrement *= 0.5F;

        float unknown_0 = random->nextFloat();
        float unknown_1 = random->nextFloat();
        float unknown_2 = random->nextFloat();
        verticalAngleIncrement += (unknown_0 - unknown_1) * unknown_2 * 2.0F;

        float unknown_3 = random->nextFloat();
        float unknown_4 = random->nextFloat();
        float unknown_5 = random->nextFloat();
        horizontalAngleIncrement += (unknown_3 - unknown_4) * unknown_5 * 4.0F;

        if (random->nextInt(4) != 0) {
            if (!canReach(chunk->getPos(), blockX, blockZ, y, yTo, thickness)) {
                return;
            }

            this->carveEllipsoid(context, config, chunk, biomeManager, aquifer, blockX, blockY, blockZ,
                                 horizontalRadius, verticalRadius, mask, checker);
        }
    }
}