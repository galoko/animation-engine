call emsdk_env

call emcc -c ^
src/cpp/thirdparty/md5.c ^
-o ./lib/md5.o

call emcc -c ^
src/cpp/thirdparty/sha256.c ^
-o ./lib/sha256.o

call em++ ^
-s WASM=1 -s MODULARIZE=1 -O0 ^
-g3 ^
-std=c++1z ^
-Wall ^
--memoryprofiler ^
-fexceptions ^
-s DISABLE_EXCEPTION_CATCHING=0 ^
-sASSERTIONS=1 ^
-sSAFE_HEAP=1 ^
-s "EXPORTED_FUNCTIONS=['_malloc', '_free', '_init', '_test', '_print_exception']" ^
src/cpp/main.cpp ^
src/cpp/surface-generation/biomes/aquifer.cpp ^
src/cpp/surface-generation/biomes/biome-source.cpp ^
src/cpp/surface-generation/biomes/chunk-generator.cpp ^
src/cpp/surface-generation/biomes/chunk-status.cpp ^
src/cpp/surface-generation/biomes/chunks.cpp ^
src/cpp/surface-generation/biomes/climate.cpp ^
src/cpp/surface-generation/biomes/heightmap.cpp ^
src/cpp/surface-generation/biomes/mth.cpp ^
src/cpp/surface-generation/biomes/noise-chunk.cpp ^
src/cpp/surface-generation/biomes/noise-data.cpp ^
src/cpp/surface-generation/biomes/noise/blended-noise.cpp ^
src/cpp/surface-generation/biomes/noise/improved-noise.cpp ^
src/cpp/surface-generation/biomes/noise/normal-noise.cpp ^
src/cpp/surface-generation/biomes/noise/perlin-noise.cpp ^
src/cpp/surface-generation/biomes/noise/perlin-simplex-noise.cpp ^
src/cpp/surface-generation/biomes/noise/simplex-noise.cpp ^
src/cpp/surface-generation/biomes/overworld-biome-builder.cpp ^
src/cpp/surface-generation/biomes/pos.cpp ^
src/cpp/surface-generation/biomes/random.cpp ^
src/cpp/surface-generation/biomes/surface-rules.cpp ^
src/cpp/surface-generation/biomes/terrain-shaper.cpp ^
src/cpp/surface-generation/biomes/worldgen-settings.cpp ^
src/cpp/surface-generation/biomes/biomes.cpp ^
lib/md5.o ^
lib/sha256.o ^
-o src/wasm/cpp.js
