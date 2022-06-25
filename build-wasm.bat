call emsdk_env
em++ ^
-s WASM=1 -s MODULARIZE=1 -O3 ^
-sWASM_WORKERS ^
-s "EXPORTED_FUNCTIONS=['_malloc', '_free', '_test']" ^
src/cpp/main.cpp ^
-o src/wasm/cpp.js
