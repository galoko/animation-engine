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
lib/md5.o ^
lib/sha256.o ^
-o src/wasm/cpp.js
