#pragma once

#include <functional>
#include <string>
#include <vector>

#include "chunk-generator.hpp"
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

    using ChunkConverter = function<shared_ptr<ChunkAccess>(shared_ptr<ChunkAccess>)>;

    using GenerationTask = function<shared_ptr<ChunkAccess>(
        ChunkStatus const &chunkStatus, shared_ptr<ChunkGenerator> generator, ChunkConverter converter,
        vector<shared_ptr<ChunkAccess>> neighbors, shared_ptr<ChunkAccess> chunkAccess)>;

    using SimpleGenerationTask =
        function<void(ChunkStatus const &chunkStatus, shared_ptr<ChunkGenerator> generator,
                      vector<shared_ptr<ChunkAccess>> neighbors, shared_ptr<ChunkAccess> chunkAccess)>;

    using LoadingTask = shared_ptr<ChunkAccess> (*)(ChunkStatus const &chunkStatus,
                                                    shared_ptr<ChunkAccess> chunkAccess);

    static GenerationTask makeGenerationTask(SimpleGenerationTask simpleTask);

    static constexpr auto EMPTY_CONVERTER = [](shared_ptr<ChunkAccess> chunkAccess) -> shared_ptr<ChunkAccess> {
        return chunkAccess;
    };

public:
    static const int32_t MAX_STRUCTURE_DISTANCE = 8;

public:
    static vector<HeightmapTypes> PRE_FEATURES;
    static vector<HeightmapTypes> POST_FEATURES;

private:
    static constexpr ChunkStatus::LoadingTask PASSTHROUGH_LOAD_TASK =
        [](ChunkStatus const &chunkStatus, shared_ptr<ChunkAccess> chunkAccess) -> shared_ptr<ChunkAccess> {
        // TODO status progress
        return chunkAccess;
    };

public:
    static ChunkStatus EMPTY;
    static ChunkStatus STRUCTURE_STARTS;
    static ChunkStatus STRUCTURE_REFERENCES;
    static ChunkStatus BIOMES;
    static ChunkStatus NOISE;
    static ChunkStatus SURFACE;
    static ChunkStatus CARVERS;
    static ChunkStatus LIQUID_CARVERS;
    static ChunkStatus FEATURES;
    static ChunkStatus LIGHT;
    static ChunkStatus SPAWN;
    static ChunkStatus HEIGHTMAPS;
    static ChunkStatus FULL;

    static vector<ChunkStatus> STATUS_BY_RANGE;

private:
    string name;
    int32_t index;
    ChunkStatus const &parent;
    ChunkStatus::GenerationTask generationTask;
    ChunkStatus::LoadingTask loadingTask;
    int32_t range;
    ChunkStatus::ChunkType chunkType;

public:
    vector<HeightmapTypes> heightmapsAfter;

public:
    static ChunkStatus registerSimple(string name, ChunkStatus *chunkStatus, int32_t index,
                                      vector<HeightmapTypes> heightmapsAfter, ChunkStatus::ChunkType chunkType,
                                      ChunkStatus::SimpleGenerationTask generationTask);
    static ChunkStatus _register(string name, ChunkStatus *chunkStatus, int32_t index,
                                 vector<HeightmapTypes> heightmapsAfter, ChunkStatus::ChunkType chunkType,
                                 ChunkStatus::GenerationTask generationTask);
    static ChunkStatus _register(string name, ChunkStatus *chunkStatus, int32_t index,
                                 vector<HeightmapTypes> heightmapsAfter, ChunkStatus::ChunkType chunkType,
                                 ChunkStatus::GenerationTask generationTask, ChunkStatus::LoadingTask loadingTask);

public:
    static vector<ChunkStatus const *> getStatusList();

private:
    static bool isLighted(ChunkStatus const &chunkStatus, shared_ptr<ChunkAccess> chunkAccess);

    ChunkStatus(string name, ChunkStatus *parent, int32_t range, vector<HeightmapTypes> heightmapsAfter,
                ChunkStatus::ChunkType chunkType, ChunkStatus::GenerationTask generationTask,
                ChunkStatus::LoadingTask loadingTask);

    int32_t getIndex() const;
    string getName() const;
    ChunkStatus const &getParent() const;

public:
    shared_ptr<ChunkAccess> generate(shared_ptr<ChunkGenerator> generator, ChunkConverter converter,
                                     vector<shared_ptr<ChunkAccess>> chunks);

    int32_t getRange() const;

    ChunkStatus::ChunkType getChunkType() const;

    bool isOrAfter(ChunkStatus const &chunkStatus) const;
};