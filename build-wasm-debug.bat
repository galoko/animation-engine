call emsdk_env
em++ ^
-s WASM=1 -s MODULARIZE=1 -O0 ^
-sWASM_WORKERS ^
-g3 ^
--memoryprofiler ^
-s DISABLE_EXCEPTION_CATCHING=0 ^
-s "EXPORTED_FUNCTIONS=['_malloc', '_free', '_test', '_test_memory_leaks', '_free_memory_leaks']" ^
src/cpp/main.cpp ^
-o src/wasm/cpp.js
