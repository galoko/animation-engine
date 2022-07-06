#include "chunk-status.hpp"
#include "chunk-generator.hpp"
#include "chunks.hpp"

#include <vector>

using namespace std;

bool ChunkStatus::isLighted(ChunkStatus *chunkStatus, ChunkAccess *chunkAccess) {
    return chunkAccess->getStatus()->isOrAfter(chunkStatus) && chunkAccess->isLightCorrect;
}

vector<HeightmapTypes> ChunkStatus::PRE_FEATURES = {HeightmapTypes::OCEAN_FLOOR_WG, HeightmapTypes::WORLD_SURFACE_WG};

vector<HeightmapTypes> ChunkStatus::POST_FEATURES = {HeightmapTypes::OCEAN_FLOOR, HeightmapTypes::WORLD_SURFACE,
                                                     HeightmapTypes::MOTION_BLOCKING,
                                                     HeightmapTypes::MOTION_BLOCKING_NO_LEAVES};

ChunkStatus *ChunkStatus::EMPTY =
    registerSimple("empty", nullptr, -1, PRE_FEATURES, ChunkType::PROTOCHUNK,
                   [](ChunkStatus *chunkStatus, ChunkGenerator *generator, vector<ChunkAccess *> neighbors,
                      ChunkAccess *chunkAccess) -> void {});

ChunkStatus *ChunkStatus::STRUCTURE_STARTS =
    _register("structure_starts", EMPTY, 0, PRE_FEATURES, ChunkStatus::ChunkType::PROTOCHUNK,
              [](ChunkStatus *chunkStatus, ChunkGenerator *generator, ChunkConverter converter,
                 vector<ChunkAccess *> neighbors, ChunkAccess *chunkAccess) -> ChunkAccess * { return chunkAccess; });

ChunkStatus *ChunkStatus::STRUCTURE_REFERENCES =
    registerSimple("structure_references", STRUCTURE_STARTS, 8, PRE_FEATURES, ChunkStatus::ChunkType::PROTOCHUNK,
                   [](ChunkStatus *chunkStatus, ChunkGenerator *generator, vector<ChunkAccess *> neighbors,
                      ChunkAccess *chunkAccess) -> void {});

ChunkStatus *ChunkStatus::BIOMES = _register(
    "biomes", STRUCTURE_REFERENCES, 8, PRE_FEATURES, ChunkType::PROTOCHUNK,
    [](ChunkStatus *chunkStatus, ChunkGenerator *generator, ChunkConverter converter, vector<ChunkAccess *> neighbors,
       ChunkAccess *chunkAccess) -> ChunkAccess * { return generator->createBiomes(Blender::empty(), chunkAccess); });

ChunkStatus *ChunkStatus::NOISE = _register(
    "noise", BIOMES, 8, PRE_FEATURES, ChunkStatus::ChunkType::PROTOCHUNK,
    [](ChunkStatus *chunkStatus, ChunkGenerator *generator, ChunkConverter converter, vector<ChunkAccess *> neighbors,
       ChunkAccess *chunkAccess) -> ChunkAccess * { return generator->fillFromNoise(Blender::empty(), chunkAccess); });