import * as fs from "fs"
import * as path from "path"
import { execSync } from "child_process"

const getAllFiles = (dirPath, ext, arrayOfFiles) => {
    const files = fs.readdirSync(dirPath)

    arrayOfFiles = arrayOfFiles || []

    files.forEach(file => {
        if (fs.statSync(`${dirPath}/${file}`).isDirectory()) {
            arrayOfFiles = getAllFiles(dirPath + "/" + file, ext, arrayOfFiles)
        } else {
            if (path.extname(file) === ext) {
                arrayOfFiles.push(path.join(dirPath, "/", file))
            }
        }
    })

    return arrayOfFiles
}

const cpp_files = getAllFiles(".", ".cpp")
const c_files = getAllFiles(".", ".c")
const o_files = []

function silentExecSync(line) {
    try {
        execSync(line)
    } catch (e) {
        //
    }
}

const EXPORTED_FUNCTIONS = ["_malloc", "_free", "_init", "_test", "_print_exception"]

const FLAGS = ["-s WASM=1", "-s MODULARIZE=1", "-std=c++1z", "-Wall"]

const DEBUG_FLAGS = ["-O0", "-g3", "-sASSERTIONS=1"]

const FULL_DEBUG_FLAGS = [
    "--memoryprofiler",
    "-fexceptions",
    "-s DISABLE_EXCEPTION_CATCHING=0",
    "-sSAFE_HEAP=1",
]

const RELEASE_FLAGS = ["-O3"]

// eslint-disable-next-line no-undef
const BUILD_TYPE = process.argv[2] ?? "debug"

const buildCommandLines = []

buildCommandLines.push("em++")
buildCommandLines.push(...FLAGS)

switch (BUILD_TYPE) {
    case "full-debug": {
        buildCommandLines.push(...DEBUG_FLAGS)
        buildCommandLines.push(...FULL_DEBUG_FLAGS)
        break
    }
    case "debug": {
        buildCommandLines.push(...DEBUG_FLAGS)
        break
    }
    case "release": {
        buildCommandLines.push(...RELEASE_FLAGS)
        break
    }
}

const exportedFunctionsLine = `-s "EXPORTED_FUNCTIONS=['${EXPORTED_FUNCTIONS.join("', '")}']"`
buildCommandLines.push(exportedFunctionsLine)

buildCommandLines.push(...cpp_files)

console.time("Compilation")

for (const c_file of c_files) {
    const o_file = `./lib/${path.basename(c_file, ".c")}.o`
    silentExecSync(`emcc -c ${c_file} -o ${o_file}`)
    o_files.push(o_file)
}

buildCommandLines.push(...o_files)

buildCommandLines.push("-o src/wasm/cpp.js")

const buildCommand = buildCommandLines.join(" ")

silentExecSync(buildCommand)

console.timeEnd("Compilation")
