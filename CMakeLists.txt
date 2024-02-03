set(CMAKE_CXX_STANDARD 20)

if(CMAKE_SYSTEM_NAME MATCHES "Emscripten")
set(CMAKE_CONFIGURATION_TYPES "Debug;FullDebug;Release;ReleaseMem")
else()
set(CMAKE_CONFIGURATION_TYPES "Debug;Release")
endif()

cmake_minimum_required (VERSION 3.12)
project (ENGINE)

if(CMAKE_SYSTEM_NAME MATCHES "Emscripten")
    link_directories("thirdparty/bullet3/out/build/Emscripten-Release/lib")
    set(CMAKE_RUNTIME_OUTPUT_DIRECTORY "../../src/wasm")
else()
    link_directories("thirdparty/bullet3/out/build/x64-Release/lib")
    set(CMAKE_RUNTIME_OUTPUT_DIRECTORY "../../out/native")
endif()

file(GLOB_RECURSE ENGINE_SRC CONFIGURE_DEPENDS 
     "src/cpp/*.h"
     "src/cpp/*.c"
     "src/cpp/*.hpp"
     "src/cpp/*.cpp"
)

file(GLOB_RECURSE NATIVE_SRC CONFIGURE_DEPENDS 
     "native-test/*.h"
     "native-test/*.c"
     "native-test/*.hpp"
     "native-test/*.cpp"
)

if(CMAKE_SYSTEM_NAME MATCHES "Emscripten")
    add_executable (engine ${ENGINE_SRC})

    add_definitions( -D__EMSCRIPTEN__=1 )

    set(CMAKE_CXX_FLAGS_RELEASE "-O3")
    set(CMAKE_CXX_FLAGS_RELEASEMEM "${CMAKE_CXX_FLAGS_RELEASE}")
    
    set(CMAKE_CXX_FLAGS_DEBUG "-O0 -g3")
    set(CMAKE_CXX_FLAGS_FULLDEBUG "-fexceptions ${CMAKE_CXX_FLAGS_DEBUG}")

    list(APPEND EXPORTED_FUNCTIONS
        "_malloc"
        "_free"
        "_test"
        "_check"
        "_init"
        "_tick"
        "_finalize"
        "_print_exception"
        "_print_memory_stats"
        "_get_input_queue_ptr"
        "_get_output_queue_ptr"
    )
    list(JOIN EXPORTED_FUNCTIONS "', '" EXPORTED_FUNCTIONS_JOIN)
    set(EXPORTED_FUNCTIONS_LINE "-s \"EXPORTED_FUNCTIONS=['${EXPORTED_FUNCTIONS_JOIN}']\"")
    
    set(COMMON_LINKER_FLAGS "-s WASM=1 -s TOTAL_MEMORY=512MB -s MODULARIZE=1 -s EXPORT_ES6=1 --js-library ../../src/ts/lib.js ${EXPORTED_FUNCTIONS_LINE}")

    set(CMAKE_EXE_LINKER_FLAGS_RELEASE "-O3 ${COMMON_LINKER_FLAGS}")
    set(CMAKE_EXE_LINKER_FLAGS_RELEASEMEM "--memoryprofiler ${CMAKE_EXE_LINKER_FLAGS_RELEASE}")

    set(CMAKE_EXE_LINKER_FLAGS_DEBUG "-O0 -g3 -sASSERTIONS=1 ${COMMON_LINKER_FLAGS} -sDEMANGLE_SUPPORT")
    set(CMAKE_EXE_LINKER_FLAGS_FULLDEBUG "--memoryprofiler -sNO_DISABLE_EXCEPTION_CATCHING -sSAFE_HEAP=1 ${CMAKE_EXE_LINKER_FLAGS_DEBUG}")
else()
    add_executable (engine ${ENGINE_SRC})
endif()

target_include_directories(engine PUBLIC "thirdparty/bullet3/src")
target_include_directories(engine PUBLIC "thirdparty/glm/glm")
target_include_directories(engine PUBLIC "thirdparty/entt/single_include")

target_compile_options(engine PRIVATE
  $<$<NOT:$<CXX_COMPILER_ID:MSVC>>:-Wall -Wno-deprecated-volatile>
)

target_link_libraries(engine LinearMath BulletCollision BulletDynamics)