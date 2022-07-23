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

    using ChunkConverter = function<ChunkAccess *(ChunkAccess *)>;

    using GenerationTask =
        function<ChunkAccess *(ChunkStatus const &chunkStatus, ChunkGenerator *generator, ChunkConverter converter,
                               vector<ChunkAccess *> neighbors, ChunkAccess *chunkAccess)>;

    using SimpleGenerationTask = function<void(ChunkStatus const &chunkStatus, ChunkGenerator *generator,
                                               vector<ChunkAccess *> neighbors, ChunkAccess *chunkAccess)>;

    using LoadingTask = ChunkAccess *(*)(ChunkStatus const &chunkStatus, ChunkAccess *chunkAccess);

    static GenerationTask makeGenerationTask(SimpleGenerationTask simpleTask);

    static constexpr auto EMPTY_CONVERTER = [](ChunkAccess *chunkAccess) -> ChunkAccess * { return chunkAccess; };

public:
    static const int32_t MAX_STRUCTURE_DISTANCE = 8;

public:
    static vector<HeightmapTypes> PRE_FEATURES;
    static vector<HeightmapTypes> POST_FEATURES;

private:
    static constexpr ChunkStatus::LoadingTask PASSTHROUGH_LOAD_TASK = [](ChunkStatus const &chunkStatus,
                                                                         ChunkAccess *chunkAccess) -> ChunkAccess * {
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
    static bool isLighted(ChunkStatus const &chunkStatus, ChunkAccess *chunkAccess);

    ChunkStatus(string name, ChunkStatus *parent, int32_t range, vector<HeightmapTypes> heightmapsAfter,
                ChunkStatus::ChunkType chunkType, ChunkStatus::GenerationTask generationTask,
                ChunkStatus::LoadingTask loadingTask);

    int32_t getIndex() const;
    string getName() const;
    ChunkStatus const &getParent() const;

public:
    ChunkAccess *generate(ChunkGenerator *generator, ChunkConverter converter, vector<ChunkAccess *> chunks);

    int32_t getRange() const;

    ChunkStatus::ChunkType getChunkType() const;

    bool isOrAfter(ChunkStatus const &chunkStatus) const;
};