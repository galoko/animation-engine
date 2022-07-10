#pragma once

#include <functional>
#include <string>
#include <vector>

#include "chunk-generator.fwd.hpp"
#include "chunk-status.fwd.hpp"
#include "chunks.fwd.hpp"
#include "heightmap.fwd.hpp"

using namespace std;

class ChunkStatus {
public:
    enum ChunkType
    {
        PROTOCHUNK,
        LEVELCHUNK,
    };

    using ChunkConverter = function<ChunkAccess *(ChunkAccess *)>;

    using GenerationTask =
        function<ChunkAccess *(ChunkStatus *chunkStatus, ChunkGenerator *generator, ChunkConverter converter,
                               vector<ChunkAccess *> neighbors, ChunkAccess *chunkAccess)>;

    using SimpleGenerationTask = function<void(ChunkStatus *chunkStatus, ChunkGenerator *generator,
                                               vector<ChunkAccess *> neighbors, ChunkAccess *chunkAccess)>;

    using LoadingTask = ChunkAccess *(*)(ChunkStatus *chunkStatus, ChunkAccess *chunkAccess);

    static GenerationTask makeGenerationTask(SimpleGenerationTask simpleTask) {
        return [simpleTask](ChunkStatus *chunkStatus, ChunkGenerator *generator, ChunkConverter converter,
                            vector<ChunkAccess *> neighbors, ChunkAccess *chunkAccess) -> ChunkAccess * {
            // TODO status progress
            simpleTask(chunkStatus, generator, neighbors, chunkAccess);
            return chunkAccess;
        };
    }

    static constexpr auto EMPTY_CONVERTER = [](ChunkAccess *chunkAccess) -> ChunkAccess * { return chunkAccess; };

public:
    static const int32_t MAX_STRUCTURE_DISTANCE = 8;

public:
    static vector<HeightmapTypes> PRE_FEATURES;
    static vector<HeightmapTypes> POST_FEATURES;

private:
    static constexpr ChunkStatus::LoadingTask PASSTHROUGH_LOAD_TASK = [](ChunkStatus *chunkStatus,
                                                                         ChunkAccess *chunkAccess) -> ChunkAccess * {
        // TODO status progress
        return chunkAccess;
    };

public:
    static ChunkStatus *EMPTY;
    static ChunkStatus *STRUCTURE_STARTS;
    static ChunkStatus *STRUCTURE_REFERENCES;
    static ChunkStatus *BIOMES;
    static ChunkStatus *NOISE;
    static ChunkStatus *SURFACE;
    static ChunkStatus *CARVERS;
    static ChunkStatus *LIQUID_CARVERS;
    static ChunkStatus *FEATURES;
    static ChunkStatus *LIGHT;
    static ChunkStatus *SPAWN;
    static ChunkStatus *HEIGHTMAPS;
    static ChunkStatus *FULL;

    static vector<ChunkStatus> STATUS_BY_RANGE;

private:
    string name;
    int32_t index;
    ChunkStatus *parent;
    ChunkStatus::GenerationTask generationTask;
    ChunkStatus::LoadingTask loadingTask;
    int32_t range;
    ChunkStatus::ChunkType chunkType;

public:
    vector<HeightmapTypes> heightmapsAfter;

public:
    static ChunkStatus *registerSimple(string name, ChunkStatus *chunkStatus, int32_t index,
                                       vector<HeightmapTypes> heightmapsAfter, ChunkStatus::ChunkType chunkType,
                                       ChunkStatus::SimpleGenerationTask generationTask) {
        return _register(name, chunkStatus, index, heightmapsAfter, chunkType, makeGenerationTask(generationTask));
    }

    static ChunkStatus *_register(string name, ChunkStatus *chunkStatus, int32_t index,
                                  vector<HeightmapTypes> heightmapsAfter, ChunkStatus::ChunkType chunkType,
                                  ChunkStatus::GenerationTask generationTask) {
        return _register(name, chunkStatus, index, heightmapsAfter, chunkType, generationTask, PASSTHROUGH_LOAD_TASK);
    }

    static ChunkStatus *_register(string name, ChunkStatus *chunkStatus, int32_t index,
                                  vector<HeightmapTypes> heightmapsAfter, ChunkStatus::ChunkType chunkType,
                                  ChunkStatus::GenerationTask generationTask, ChunkStatus::LoadingTask loadingTask) {
        return new ChunkStatus(name, chunkStatus, index, heightmapsAfter, chunkType, generationTask, loadingTask);
    }

public:
    static vector<ChunkStatus *> *getStatusList() {
        vector<ChunkStatus *> *list = new vector<ChunkStatus *>();

        ChunkStatus *chunkstatus;
        for (chunkstatus = FULL; chunkstatus->getParent() != chunkstatus; chunkstatus = chunkstatus->getParent()) {
            list->push_back(chunkstatus);
        }

        list->push_back(chunkstatus);
        reverse(list->begin(), list->end());

        return list;
    }

private:
    static bool isLighted(ChunkStatus *chunkStatus, ChunkAccess *chunkAccess);

    ChunkStatus(string name, ChunkStatus *parent, int32_t range, vector<HeightmapTypes> heightmapsAfter,
                ChunkStatus::ChunkType chunkType, ChunkStatus::GenerationTask generationTask,
                ChunkStatus::LoadingTask loadingTask) {
        this->name = name;
        this->parent = parent == nullptr ? this : parent;
        this->generationTask = generationTask;
        this->loadingTask = loadingTask;
        this->range = range;
        this->chunkType = chunkType;
        this->heightmapsAfter = heightmapsAfter;
        this->index = parent == nullptr ? 0 : parent->getIndex() + 1;
    }

    int32_t getIndex() {
        return this->index;
    }

    string getName() {
        return this->name;
    }

    ChunkStatus *getParent() {
        return this->parent;
    }

public:
    ChunkAccess *generate(ChunkGenerator *generator, ChunkConverter converter, vector<ChunkAccess *> chunks) {
        ChunkAccess *chunkaccess = chunks.at(chunks.size() / 2);

        return this->generationTask(this, generator, converter, chunks, chunkaccess);
    }

    int32_t getRange() {
        return this->range;
    }

    ChunkStatus::ChunkType getChunkType() {
        return this->chunkType;
    }

    bool isOrAfter(ChunkStatus *chunkStatus) {
        return this->getIndex() >= chunkStatus->getIndex();
    }
};