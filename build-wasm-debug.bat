call emsdk_env

call emcc -c ^
src/cpp/thirdparty/md5.c ^
-o ./lib/md5.o

call emcc -c ^
src/cpp/thirdparty/sha256.c ^
-o ./lib/sha256.o

call em++ ^
-s WASM=1 -s MODULARIZE=1 -O0 ^
-sWASM_WORKERS ^
-g3 ^
-std=c++1z ^
-Wall ^
--memoryprofiler ^
-s DISABLE_EXCEPTION_CATCHING=0 ^
-s "EXPORTED_FUNCTIONS=['_malloc', '_free', '_init']" ^
src/cpp/main.cpp ^
lib/md5.o ^
lib/sha256.o ^
-o src/wasm/cpp.js
