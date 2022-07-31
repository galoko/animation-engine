#include "chunk-status.hpp"
#include "chunk-generator.hpp"
#include "chunks.hpp"

#include <vector>

using namespace std;

// ChunkStatus

ChunkStatus::GenerationTask ChunkStatus::makeGenerationTask(SimpleGenerationTask simpleTask) {
    return [simpleTask](ChunkStatus const &chunkStatus, shared_ptr<ChunkGenerator> generator, ChunkConverter converter,
                        vector<shared_ptr<ChunkAccess>> neighbors,
                        shared_ptr<ChunkAccess> chunkAccess) -> shared_ptr<ChunkAccess> {
        // TODO status progress
        simpleTask(chunkStatus, generator, neighbors, chunkAccess);
        return chunkAccess;
    };
}

ChunkStatus ChunkStatus::registerSimple(string name, ChunkStatus *chunkStatus, int32_t index,
                                        vector<HeightmapTypes> heightmapsAfter, ChunkStatus::ChunkType chunkType,
                                        ChunkStatus::SimpleGenerationTask generationTask) {
    return _register(name, chunkStatus, index, heightmapsAfter, chunkType, makeGenerationTask(generationTask));
}

ChunkStatus ChunkStatus::_register(string name, ChunkStatus *chunkStatus, int32_t index,
                                   vector<HeightmapTypes> heightmapsAfter, ChunkStatus::ChunkType chunkType,
                                   ChunkStatus::GenerationTask generationTask) {
    return _register(name, chunkStatus, index, heightmapsAfter, chunkType, generationTask, PASSTHROUGH_LOAD_TASK);
}

ChunkStatus ChunkStatus::_register(string name, ChunkStatus *chunkStatus, int32_t index,
                                   vector<HeightmapTypes> heightmapsAfter, ChunkStatus::ChunkType chunkType,
                                   ChunkStatus::GenerationTask generationTask, ChunkStatus::LoadingTask loadingTask) {
    return ChunkStatus(name, chunkStatus, index, heightmapsAfter, chunkType, generationTask, loadingTask);
}

vector<ChunkStatus const *> ChunkStatus::getStatusList() {
    vector<ChunkStatus const *> list = vector<ChunkStatus const *>();

    ChunkStatus const *chunkstatus;
    for (chunkstatus = &FULL; &chunkstatus->getParent() != chunkstatus; chunkstatus = &chunkstatus->getParent()) {
        list.push_back(chunkstatus);
    }

    list.push_back(chunkstatus);
    reverse(list.begin(), list.end());

    return list;
}

bool ChunkStatus::isLighted(ChunkStatus const &chunkStatus, shared_ptr<ChunkAccess> chunkAccess) {
    return chunkAccess->getStatus()->isOrAfter(chunkStatus) && chunkAccess->isLightCorrect;
}

ChunkStatus::ChunkStatus(string name, ChunkStatus *parent, int32_t range, vector<HeightmapTypes> heightmapsAfter,
                         ChunkStatus::ChunkType chunkType, ChunkStatus::GenerationTask generationTask,
                         ChunkStatus::LoadingTask loadingTask)
    : parent(parent == nullptr ? *this : *parent) {
    this->name = name;
    this->generationTask = generationTask;
    this->loadingTask = loadingTask;
    this->range = range;
    this->chunkType = chunkType;
    this->heightmapsAfter = heightmapsAfter;
    this->index = parent == nullptr ? 0 : parent->getIndex() + 1;
}

int32_t ChunkStatus::getIndex() const {
    return this->index;
}

string ChunkStatus::getName() const {
    return this->name;
}

ChunkStatus const &ChunkStatus::getParent() const {
    return this->parent;
}

shared_ptr<ChunkAccess> ChunkStatus::generate(shared_ptr<ChunkGenerator> generator, ChunkConverter converter,
                                              vector<shared_ptr<ChunkAccess>> chunks) {
    shared_ptr<ChunkAccess> chunkaccess = chunks.at(chunks.size() / 2);

    return this->generationTask(*this, generator, converter, chunks, chunkaccess);
}

int32_t ChunkStatus::getRange() const {
    return this->range;
}

ChunkStatus::ChunkType ChunkStatus::getChunkType() const {
    return this->chunkType;
}

bool ChunkStatus::isOrAfter(ChunkStatus const &chunkStatus) const {
    return this->getIndex() >= chunkStatus.getIndex();
}

vector<HeightmapTypes> ChunkStatus::PRE_FEATURES = {HeightmapTypes::OCEAN_FLOOR_WG, HeightmapTypes::WORLD_SURFACE_WG};

vector<HeightmapTypes> ChunkStatus::POST_FEATURES = {HeightmapTypes::OCEAN_FLOOR, HeightmapTypes::WORLD_SURFACE,
                                                     HeightmapTypes::MOTION_BLOCKING,
                                                     HeightmapTypes::MOTION_BLOCKING_NO_LEAVES};

ChunkStatus ChunkStatus::EMPTY =
    registerSimple("empty", nullptr, -1, PRE_FEATURES, ChunkType::PROTOCHUNK,
                   [](ChunkStatus const &chunkStatus, shared_ptr<ChunkGenerator> generator,
                      vector<shared_ptr<ChunkAccess>> neighbors, shared_ptr<ChunkAccess> chunkAccess) -> void {});

ChunkStatus ChunkStatus::STRUCTURE_STARTS =
    _register("structure_starts", &EMPTY, 0, PRE_FEATURES, ChunkStatus::ChunkType::PROTOCHUNK,
              [](ChunkStatus const &chunkStatus, shared_ptr<ChunkGenerator> generator, ChunkConverter converter,
                 vector<shared_ptr<ChunkAccess>> neighbors,
                 shared_ptr<ChunkAccess> chunkAccess) -> shared_ptr<ChunkAccess> { return chunkAccess; });

ChunkStatus ChunkStatus::STRUCTURE_REFERENCES =
    registerSimple("structure_references", &STRUCTURE_STARTS, 8, PRE_FEATURES, ChunkStatus::ChunkType::PROTOCHUNK,
                   [](ChunkStatus const &chunkStatus, shared_ptr<ChunkGenerator> generator,
                      vector<shared_ptr<ChunkAccess>> neighbors, shared_ptr<ChunkAccess> chunkAccess) -> void {});

ChunkStatus ChunkStatus::BIOMES = _register("biomes", &STRUCTURE_REFERENCES, 8, PRE_FEATURES, ChunkType::PROTOCHUNK,
                                            [](ChunkStatus const &chunkStatus, shared_ptr<ChunkGenerator> generator,
                                               ChunkConverter converter, vector<shared_ptr<ChunkAccess>> neighbors,
                                               shared_ptr<ChunkAccess> chunkAccess) -> shared_ptr<ChunkAccess> {
                                                return generator->createBiomes(Blender::empty(), chunkAccess);
                                            });

ChunkStatus ChunkStatus::NOISE = _register("noise", &BIOMES, 8, PRE_FEATURES, ChunkStatus::ChunkType::PROTOCHUNK,
                                           [](ChunkStatus const &chunkStatus, shared_ptr<ChunkGenerator> generator,
                                              ChunkConverter converter, vector<shared_ptr<ChunkAccess>> neighbors,
                                              shared_ptr<ChunkAccess> chunkAccess) -> shared_ptr<ChunkAccess> {
                                               return generator->fillFromNoise(Blender::empty(), chunkAccess);
                                           });

void ChunkStatus::finalize() {
    ChunkStatus::PRE_FEATURES.~vector();
    ChunkStatus::POST_FEATURES.~vector();
    ChunkStatus::EMPTY.~ChunkStatus();
    ChunkStatus::STRUCTURE_STARTS.~ChunkStatus();
    ChunkStatus::STRUCTURE_REFERENCES.~ChunkStatus();
    ChunkStatus::BIOMES.~ChunkStatus();
    ChunkStatus::NOISE.~ChunkStatus();
    // ChunkStatus::SURFACE.~ChunkStatus();
    // ChunkStatus::CARVERS.~ChunkStatus();
    // ChunkStatus::LIQUID_CARVERS.~ChunkStatus();
    // ChunkStatus::FEATURES.~ChunkStatus();
    // ChunkStatus::LIGHT.~ChunkStatus();
    // ChunkStatus::SPAWN.~ChunkStatus();
    // ChunkStatus::HEIGHTMAPS.~ChunkStatus();
    // ChunkStatus::FULL.~ChunkStatus();
    // ChunkStatus::STATUS_BY_RANGE.~vector();
}