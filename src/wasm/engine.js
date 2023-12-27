
var Module = (() => {
  var _scriptDir = import.meta.url;
  
  return (
function(Module) {
  Module = Module || {};

var Module = typeof Module != "undefined" ? Module : {};

var readyPromiseResolve, readyPromiseReject;

Module["ready"] = new Promise(function(resolve, reject) {
 readyPromiseResolve = resolve;
 readyPromiseReject = reject;
});

[ "_malloc", "_free", "_test", "_check", "_init", "_tick", "_finalize", "_print_exception", "_print_memory_stats", "_get_input_queue_ptr", "_get_output_queue_ptr", "_fflush", "onRuntimeInitialized" ].forEach(prop => {
 if (!Object.getOwnPropertyDescriptor(Module["ready"], prop)) {
  Object.defineProperty(Module["ready"], prop, {
   get: () => abort("You are getting " + prop + " on the Promise object, instead of the instance. Use .then() to get called back with the instance, see the MODULARIZE docs in src/settings.js"),
   set: () => abort("You are setting " + prop + " on the Promise object, instead of the instance. Use .then() to get called back with the instance, see the MODULARIZE docs in src/settings.js")
  });
 }
});

var moduleOverrides = Object.assign({}, Module);

var arguments_ = [];

var thisProgram = "./this.program";

var quit_ = (status, toThrow) => {
 throw toThrow;
};

var ENVIRONMENT_IS_WEB = typeof window == "object";

var ENVIRONMENT_IS_WORKER = typeof importScripts == "function";

var ENVIRONMENT_IS_NODE = typeof process == "object" && typeof process.versions == "object" && typeof process.versions.node == "string";

var ENVIRONMENT_IS_SHELL = !ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_NODE && !ENVIRONMENT_IS_WORKER;

if (Module["ENVIRONMENT"]) {
 throw new Error("Module.ENVIRONMENT has been deprecated. To force the environment, use the ENVIRONMENT compile-time option (for example, -sENVIRONMENT=web or -sENVIRONMENT=node)");
}

var scriptDirectory = "";

function locateFile(path) {
 if (Module["locateFile"]) {
  return Module["locateFile"](path, scriptDirectory);
 }
 return scriptDirectory + path;
}

var read_, readAsync, readBinary, setWindowTitle;

function logExceptionOnExit(e) {
 if (e instanceof ExitStatus) return;
 let toLog = e;
 if (e && typeof e == "object" && e.stack) {
  toLog = [ e, e.stack ];
 }
 err("exiting due to exception: " + toLog);
}

if (ENVIRONMENT_IS_NODE) {
 if (typeof process == "undefined" || !process.release || process.release.name !== "node") throw new Error("not compiled for this environment (did you build to HTML and try to run it not on the web, or set ENVIRONMENT to something - like node - and run it someplace else - like on the web?)");
 if (ENVIRONMENT_IS_WORKER) {
  scriptDirectory = require("path").dirname(scriptDirectory) + "/";
 } else {
  scriptDirectory = __dirname + "/";
 }
 var fs, nodePath;
 if (typeof require === "function") {
  fs = require("fs");
  nodePath = require("path");
 }
 read_ = (filename, binary) => {
  filename = nodePath["normalize"](filename);
  return fs.readFileSync(filename, binary ? undefined : "utf8");
 };
 readBinary = filename => {
  var ret = read_(filename, true);
  if (!ret.buffer) {
   ret = new Uint8Array(ret);
  }
  assert(ret.buffer);
  return ret;
 };
 readAsync = (filename, onload, onerror) => {
  filename = nodePath["normalize"](filename);
  fs.readFile(filename, function(err, data) {
   if (err) onerror(err); else onload(data.buffer);
  });
 };
 if (process["argv"].length > 1) {
  thisProgram = process["argv"][1].replace(/\\/g, "/");
 }
 arguments_ = process["argv"].slice(2);
 process["on"]("uncaughtException", function(ex) {
  if (!(ex instanceof ExitStatus)) {
   throw ex;
  }
 });
 process["on"]("unhandledRejection", function(reason) {
  throw reason;
 });
 quit_ = (status, toThrow) => {
  if (keepRuntimeAlive()) {
   process["exitCode"] = status;
   throw toThrow;
  }
  logExceptionOnExit(toThrow);
  process["exit"](status);
 };
 Module["inspect"] = function() {
  return "[Emscripten Module object]";
 };
} else if (ENVIRONMENT_IS_SHELL) {
 if (typeof process == "object" && typeof require === "function" || typeof window == "object" || typeof importScripts == "function") throw new Error("not compiled for this environment (did you build to HTML and try to run it not on the web, or set ENVIRONMENT to something - like node - and run it someplace else - like on the web?)");
 if (typeof read != "undefined") {
  read_ = function shell_read(f) {
   return read(f);
  };
 }
 readBinary = function readBinary(f) {
  let data;
  if (typeof readbuffer == "function") {
   return new Uint8Array(readbuffer(f));
  }
  data = read(f, "binary");
  assert(typeof data == "object");
  return data;
 };
 readAsync = function readAsync(f, onload, onerror) {
  setTimeout(() => onload(readBinary(f)), 0);
 };
 if (typeof scriptArgs != "undefined") {
  arguments_ = scriptArgs;
 } else if (typeof arguments != "undefined") {
  arguments_ = arguments;
 }
 if (typeof quit == "function") {
  quit_ = (status, toThrow) => {
   logExceptionOnExit(toThrow);
   quit(status);
  };
 }
 if (typeof print != "undefined") {
  if (typeof console == "undefined") console = {};
  console.log = print;
  console.warn = console.error = typeof printErr != "undefined" ? printErr : print;
 }
} else if (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) {
 if (ENVIRONMENT_IS_WORKER) {
  scriptDirectory = self.location.href;
 } else if (typeof document != "undefined" && document.currentScript) {
  scriptDirectory = document.currentScript.src;
 }
 if (_scriptDir) {
  scriptDirectory = _scriptDir;
 }
 if (scriptDirectory.indexOf("blob:") !== 0) {
  scriptDirectory = scriptDirectory.substr(0, scriptDirectory.replace(/[?#].*/, "").lastIndexOf("/") + 1);
 } else {
  scriptDirectory = "";
 }
 if (!(typeof window == "object" || typeof importScripts == "function")) throw new Error("not compiled for this environment (did you build to HTML and try to run it not on the web, or set ENVIRONMENT to something - like node - and run it someplace else - like on the web?)");
 {
  read_ = url => {
   var xhr = new XMLHttpRequest();
   xhr.open("GET", url, false);
   xhr.send(null);
   return xhr.responseText;
  };
  if (ENVIRONMENT_IS_WORKER) {
   readBinary = url => {
    var xhr = new XMLHttpRequest();
    xhr.open("GET", url, false);
    xhr.responseType = "arraybuffer";
    xhr.send(null);
    return new Uint8Array(xhr.response);
   };
  }
  readAsync = (url, onload, onerror) => {
   var xhr = new XMLHttpRequest();
   xhr.open("GET", url, true);
   xhr.responseType = "arraybuffer";
   xhr.onload = () => {
    if (xhr.status == 200 || xhr.status == 0 && xhr.response) {
     onload(xhr.response);
     return;
    }
    onerror();
   };
   xhr.onerror = onerror;
   xhr.send(null);
  };
 }
 setWindowTitle = title => document.title = title;
} else {
 throw new Error("environment detection error");
}

var out = Module["print"] || console.log.bind(console);

var err = Module["printErr"] || console.warn.bind(console);

Object.assign(Module, moduleOverrides);

moduleOverrides = null;

checkIncomingModuleAPI();

if (Module["arguments"]) arguments_ = Module["arguments"];

legacyModuleProp("arguments", "arguments_");

if (Module["thisProgram"]) thisProgram = Module["thisProgram"];

legacyModuleProp("thisProgram", "thisProgram");

if (Module["quit"]) quit_ = Module["quit"];

legacyModuleProp("quit", "quit_");

assert(typeof Module["memoryInitializerPrefixURL"] == "undefined", "Module.memoryInitializerPrefixURL option was removed, use Module.locateFile instead");

assert(typeof Module["pthreadMainPrefixURL"] == "undefined", "Module.pthreadMainPrefixURL option was removed, use Module.locateFile instead");

assert(typeof Module["cdInitializerPrefixURL"] == "undefined", "Module.cdInitializerPrefixURL option was removed, use Module.locateFile instead");

assert(typeof Module["filePackagePrefixURL"] == "undefined", "Module.filePackagePrefixURL option was removed, use Module.locateFile instead");

assert(typeof Module["read"] == "undefined", "Module.read option was removed (modify read_ in JS)");

assert(typeof Module["readAsync"] == "undefined", "Module.readAsync option was removed (modify readAsync in JS)");

assert(typeof Module["readBinary"] == "undefined", "Module.readBinary option was removed (modify readBinary in JS)");

assert(typeof Module["setWindowTitle"] == "undefined", "Module.setWindowTitle option was removed (modify setWindowTitle in JS)");

assert(typeof Module["TOTAL_MEMORY"] == "undefined", "Module.TOTAL_MEMORY has been renamed Module.INITIAL_MEMORY");

legacyModuleProp("read", "read_");

legacyModuleProp("readAsync", "readAsync");

legacyModuleProp("readBinary", "readBinary");

legacyModuleProp("setWindowTitle", "setWindowTitle");

var IDBFS = "IDBFS is no longer included by default; build with -lidbfs.js";

var PROXYFS = "PROXYFS is no longer included by default; build with -lproxyfs.js";

var WORKERFS = "WORKERFS is no longer included by default; build with -lworkerfs.js";

var NODEFS = "NODEFS is no longer included by default; build with -lnodefs.js";

assert(!ENVIRONMENT_IS_SHELL, "shell environment detected but not enabled at build time.  Add 'shell' to `-sENVIRONMENT` to enable.");

var STACK_ALIGN = 16;

var POINTER_SIZE = 4;

function getNativeTypeSize(type) {
 switch (type) {
 case "i1":
 case "i8":
 case "u8":
  return 1;

 case "i16":
 case "u16":
  return 2;

 case "i32":
 case "u32":
  return 4;

 case "i64":
 case "u64":
  return 8;

 case "float":
  return 4;

 case "double":
  return 8;

 default:
  {
   if (type[type.length - 1] === "*") {
    return POINTER_SIZE;
   }
   if (type[0] === "i") {
    const bits = Number(type.substr(1));
    assert(bits % 8 === 0, "getNativeTypeSize invalid bits " + bits + ", type " + type);
    return bits / 8;
   }
   return 0;
  }
 }
}

function legacyModuleProp(prop, newName) {
 if (!Object.getOwnPropertyDescriptor(Module, prop)) {
  Object.defineProperty(Module, prop, {
   configurable: true,
   get: function() {
    abort("Module." + prop + " has been replaced with plain " + newName + " (the initial value can be provided on Module, but after startup the value is only looked for on a local variable of that name)");
   }
  });
 }
}

function ignoredModuleProp(prop) {
 if (Object.getOwnPropertyDescriptor(Module, prop)) {
  abort("`Module." + prop + "` was supplied but `" + prop + "` not included in INCOMING_MODULE_JS_API");
 }
}

function isExportedByForceFilesystem(name) {
 return name === "FS_createPath" || name === "FS_createDataFile" || name === "FS_createPreloadedFile" || name === "FS_unlink" || name === "addRunDependency" || name === "FS_createLazyFile" || name === "FS_createDevice" || name === "removeRunDependency";
}

function missingLibrarySymbol(sym) {
 if (typeof globalThis !== "undefined" && !Object.getOwnPropertyDescriptor(globalThis, sym)) {
  Object.defineProperty(globalThis, sym, {
   configurable: true,
   get: function() {
    var msg = "`" + sym + "` is a library symbol and not included by default; add it to your library.js __deps or to DEFAULT_LIBRARY_FUNCS_TO_INCLUDE on the command line";
    var librarySymbol = sym;
    if (!librarySymbol.startsWith("_")) {
     librarySymbol = "$" + sym;
    }
    msg += " (e.g. -sDEFAULT_LIBRARY_FUNCS_TO_INCLUDE=" + librarySymbol + ")";
    if (isExportedByForceFilesystem(sym)) {
     msg += ". Alternatively, forcing filesystem support (-sFORCE_FILESYSTEM) can export this for you";
    }
    warnOnce(msg);
    return undefined;
   }
  });
 }
}

function unexportedRuntimeSymbol(sym) {
 if (!Object.getOwnPropertyDescriptor(Module, sym)) {
  Object.defineProperty(Module, sym, {
   configurable: true,
   get: function() {
    var msg = "'" + sym + "' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)";
    if (isExportedByForceFilesystem(sym)) {
     msg += ". Alternatively, forcing filesystem support (-sFORCE_FILESYSTEM) can export this for you";
    }
    abort(msg);
   }
  });
 }
}

var wasmBinary;

if (Module["wasmBinary"]) wasmBinary = Module["wasmBinary"];

legacyModuleProp("wasmBinary", "wasmBinary");

var noExitRuntime = Module["noExitRuntime"] || true;

legacyModuleProp("noExitRuntime", "noExitRuntime");

if (typeof WebAssembly != "object") {
 abort("no native wasm support detected");
}

function getSafeHeapType(bytes, isFloat) {
 switch (bytes) {
 case 1:
  return "i8";

 case 2:
  return "i16";

 case 4:
  return isFloat ? "float" : "i32";

 case 8:
  return isFloat ? "double" : "i64";

 default:
  assert(0);
 }
}

function SAFE_HEAP_STORE(dest, value, bytes, isFloat) {
 if (dest <= 0) abort("segmentation fault storing " + bytes + " bytes to address " + dest);
 if (dest % bytes !== 0) abort("alignment error storing to address " + dest + ", which was expected to be aligned to a multiple of " + bytes);
 if (runtimeInitialized) {
  var brk = _sbrk() >>> 0;
  if (dest + bytes > brk) abort("segmentation fault, exceeded the top of the available dynamic heap when storing " + bytes + " bytes to address " + dest + ". DYNAMICTOP=" + brk);
  assert(brk >= _emscripten_stack_get_base());
  assert(brk <= HEAP8.length);
 }
 setValue_safe(dest, value, getSafeHeapType(bytes, isFloat));
 return value;
}

function SAFE_HEAP_STORE_D(dest, value, bytes) {
 return SAFE_HEAP_STORE(dest, value, bytes, true);
}

function SAFE_HEAP_LOAD(dest, bytes, unsigned, isFloat) {
 if (dest <= 0) abort("segmentation fault loading " + bytes + " bytes from address " + dest);
 if (dest % bytes !== 0) abort("alignment error loading from address " + dest + ", which was expected to be aligned to a multiple of " + bytes);
 if (runtimeInitialized) {
  var brk = _sbrk() >>> 0;
  if (dest + bytes > brk) abort("segmentation fault, exceeded the top of the available dynamic heap when loading " + bytes + " bytes from address " + dest + ". DYNAMICTOP=" + brk);
  assert(brk >= _emscripten_stack_get_base());
  assert(brk <= HEAP8.length);
 }
 var type = getSafeHeapType(bytes, isFloat);
 var ret = getValue_safe(dest, type);
 if (unsigned) ret = unSign(ret, parseInt(type.substr(1), 10));
 return ret;
}

function SAFE_HEAP_LOAD_D(dest, bytes, unsigned) {
 return SAFE_HEAP_LOAD(dest, bytes, unsigned, true);
}

function SAFE_FT_MASK(value, mask) {
 var ret = value & mask;
 if (ret !== value) {
  abort("Function table mask error: function pointer is " + value + " which is masked by " + mask + ", the likely cause of this is that the function pointer is being called by the wrong type.");
 }
 return ret;
}

function segfault() {
 abort("segmentation fault");
}

function alignfault() {
 abort("alignment fault");
}

var wasmMemory;

var ABORT = false;

var EXITSTATUS;

function assert(condition, text) {
 if (!condition) {
  abort("Assertion failed" + (text ? ": " + text : ""));
 }
}

var UTF8Decoder = typeof TextDecoder != "undefined" ? new TextDecoder("utf8") : undefined;

function UTF8ArrayToString(heapOrArray, idx, maxBytesToRead) {
 var endIdx = idx + maxBytesToRead;
 var endPtr = idx;
 while (heapOrArray[endPtr] && !(endPtr >= endIdx)) ++endPtr;
 if (endPtr - idx > 16 && heapOrArray.buffer && UTF8Decoder) {
  return UTF8Decoder.decode(heapOrArray.subarray(idx, endPtr));
 }
 var str = "";
 while (idx < endPtr) {
  var u0 = heapOrArray[idx++];
  if (!(u0 & 128)) {
   str += String.fromCharCode(u0);
   continue;
  }
  var u1 = heapOrArray[idx++] & 63;
  if ((u0 & 224) == 192) {
   str += String.fromCharCode((u0 & 31) << 6 | u1);
   continue;
  }
  var u2 = heapOrArray[idx++] & 63;
  if ((u0 & 240) == 224) {
   u0 = (u0 & 15) << 12 | u1 << 6 | u2;
  } else {
   if ((u0 & 248) != 240) warnOnce("Invalid UTF-8 leading byte 0x" + u0.toString(16) + " encountered when deserializing a UTF-8 string in wasm memory to a JS string!");
   u0 = (u0 & 7) << 18 | u1 << 12 | u2 << 6 | heapOrArray[idx++] & 63;
  }
  if (u0 < 65536) {
   str += String.fromCharCode(u0);
  } else {
   var ch = u0 - 65536;
   str += String.fromCharCode(55296 | ch >> 10, 56320 | ch & 1023);
  }
 }
 return str;
}

function UTF8ToString(ptr, maxBytesToRead) {
 return ptr ? UTF8ArrayToString(HEAPU8, ptr, maxBytesToRead) : "";
}

function stringToUTF8Array(str, heap, outIdx, maxBytesToWrite) {
 if (!(maxBytesToWrite > 0)) return 0;
 var startIdx = outIdx;
 var endIdx = outIdx + maxBytesToWrite - 1;
 for (var i = 0; i < str.length; ++i) {
  var u = str.charCodeAt(i);
  if (u >= 55296 && u <= 57343) {
   var u1 = str.charCodeAt(++i);
   u = 65536 + ((u & 1023) << 10) | u1 & 1023;
  }
  if (u <= 127) {
   if (outIdx >= endIdx) break;
   heap[outIdx++] = u;
  } else if (u <= 2047) {
   if (outIdx + 1 >= endIdx) break;
   heap[outIdx++] = 192 | u >> 6;
   heap[outIdx++] = 128 | u & 63;
  } else if (u <= 65535) {
   if (outIdx + 2 >= endIdx) break;
   heap[outIdx++] = 224 | u >> 12;
   heap[outIdx++] = 128 | u >> 6 & 63;
   heap[outIdx++] = 128 | u & 63;
  } else {
   if (outIdx + 3 >= endIdx) break;
   if (u > 1114111) warnOnce("Invalid Unicode code point 0x" + u.toString(16) + " encountered when serializing a JS string to a UTF-8 string in wasm memory! (Valid unicode code points should be in range 0-0x10FFFF).");
   heap[outIdx++] = 240 | u >> 18;
   heap[outIdx++] = 128 | u >> 12 & 63;
   heap[outIdx++] = 128 | u >> 6 & 63;
   heap[outIdx++] = 128 | u & 63;
  }
 }
 heap[outIdx] = 0;
 return outIdx - startIdx;
}

function stringToUTF8(str, outPtr, maxBytesToWrite) {
 assert(typeof maxBytesToWrite == "number", "stringToUTF8(str, outPtr, maxBytesToWrite) is missing the third parameter that specifies the length of the output buffer!");
 return stringToUTF8Array(str, HEAPU8, outPtr, maxBytesToWrite);
}

function lengthBytesUTF8(str) {
 var len = 0;
 for (var i = 0; i < str.length; ++i) {
  var c = str.charCodeAt(i);
  if (c <= 127) {
   len++;
  } else if (c <= 2047) {
   len += 2;
  } else if (c >= 55296 && c <= 57343) {
   len += 4;
   ++i;
  } else {
   len += 3;
  }
 }
 return len;
}

var HEAP, buffer, HEAP8, HEAPU8, HEAP16, HEAPU16, HEAP32, HEAPU32, HEAPF32, HEAPF64;

function updateGlobalBufferAndViews(buf) {
 buffer = buf;
 Module["HEAP8"] = HEAP8 = new Int8Array(buf);
 Module["HEAP16"] = HEAP16 = new Int16Array(buf);
 Module["HEAP32"] = HEAP32 = new Int32Array(buf);
 Module["HEAPU8"] = HEAPU8 = new Uint8Array(buf);
 Module["HEAPU16"] = HEAPU16 = new Uint16Array(buf);
 Module["HEAPU32"] = HEAPU32 = new Uint32Array(buf);
 Module["HEAPF32"] = HEAPF32 = new Float32Array(buf);
 Module["HEAPF64"] = HEAPF64 = new Float64Array(buf);
}

var TOTAL_STACK = 5242880;

if (Module["TOTAL_STACK"]) assert(TOTAL_STACK === Module["TOTAL_STACK"], "the stack size can no longer be determined at runtime");

var INITIAL_MEMORY = Module["INITIAL_MEMORY"] || 16777216;

legacyModuleProp("INITIAL_MEMORY", "INITIAL_MEMORY");

assert(INITIAL_MEMORY >= TOTAL_STACK, "INITIAL_MEMORY should be larger than TOTAL_STACK, was " + INITIAL_MEMORY + "! (TOTAL_STACK=" + TOTAL_STACK + ")");

assert(typeof Int32Array != "undefined" && typeof Float64Array !== "undefined" && Int32Array.prototype.subarray != undefined && Int32Array.prototype.set != undefined, "JS engine does not provide full typed array support");

assert(!Module["wasmMemory"], "Use of `wasmMemory` detected.  Use -sIMPORTED_MEMORY to define wasmMemory externally");

assert(INITIAL_MEMORY == 16777216, "Detected runtime INITIAL_MEMORY setting.  Use -sIMPORTED_MEMORY to define wasmMemory dynamically");

var wasmTable;

function writeStackCookie() {
 var max = _emscripten_stack_get_end();
 assert((max & 3) == 0);
 SAFE_HEAP_STORE((max >> 2) * 4, 34821223, 4);
 SAFE_HEAP_STORE((max + 4 >> 2) * 4, 2310721022, 4);
}

function checkStackCookie() {
 if (ABORT) return;
 var max = _emscripten_stack_get_end();
 var cookie1 = SAFE_HEAP_LOAD((max >> 2) * 4, 4, 1);
 var cookie2 = SAFE_HEAP_LOAD((max + 4 >> 2) * 4, 4, 1);
 if (cookie1 != 34821223 || cookie2 != 2310721022) {
  abort("Stack overflow! Stack cookie has been overwritten at 0x" + max.toString(16) + ", expected hex dwords 0x89BACDFE and 0x2135467, but received 0x" + cookie2.toString(16) + " 0x" + cookie1.toString(16));
 }
}

(function() {
 var h16 = new Int16Array(1);
 var h8 = new Int8Array(h16.buffer);
 h16[0] = 25459;
 if (h8[0] !== 115 || h8[1] !== 99) throw "Runtime error: expected the system to be little-endian! (Run with -sSUPPORT_BIG_ENDIAN to bypass)";
})();

var __ATPRERUN__ = [];

var __ATINIT__ = [];

var __ATEXIT__ = [];

var __ATPOSTRUN__ = [];

var runtimeInitialized = false;

function keepRuntimeAlive() {
 return noExitRuntime;
}

function preRun() {
 if (Module["preRun"]) {
  if (typeof Module["preRun"] == "function") Module["preRun"] = [ Module["preRun"] ];
  while (Module["preRun"].length) {
   addOnPreRun(Module["preRun"].shift());
  }
 }
 callRuntimeCallbacks(__ATPRERUN__);
}

function initRuntime() {
 assert(!runtimeInitialized);
 runtimeInitialized = true;
 checkStackCookie();
 callRuntimeCallbacks(__ATINIT__);
}

function postRun() {
 checkStackCookie();
 if (Module["postRun"]) {
  if (typeof Module["postRun"] == "function") Module["postRun"] = [ Module["postRun"] ];
  while (Module["postRun"].length) {
   addOnPostRun(Module["postRun"].shift());
  }
 }
 callRuntimeCallbacks(__ATPOSTRUN__);
}

function addOnPreRun(cb) {
 __ATPRERUN__.unshift(cb);
}

function addOnInit(cb) {
 __ATINIT__.unshift(cb);
}

function addOnExit(cb) {}

function addOnPostRun(cb) {
 __ATPOSTRUN__.unshift(cb);
}

assert(Math.imul, "This browser does not support Math.imul(), build with LEGACY_VM_SUPPORT or POLYFILL_OLD_MATH_FUNCTIONS to add in a polyfill");

assert(Math.fround, "This browser does not support Math.fround(), build with LEGACY_VM_SUPPORT or POLYFILL_OLD_MATH_FUNCTIONS to add in a polyfill");

assert(Math.clz32, "This browser does not support Math.clz32(), build with LEGACY_VM_SUPPORT or POLYFILL_OLD_MATH_FUNCTIONS to add in a polyfill");

assert(Math.trunc, "This browser does not support Math.trunc(), build with LEGACY_VM_SUPPORT or POLYFILL_OLD_MATH_FUNCTIONS to add in a polyfill");

var runDependencies = 0;

var runDependencyWatcher = null;

var dependenciesFulfilled = null;

var runDependencyTracking = {};

function getUniqueRunDependency(id) {
 var orig = id;
 while (1) {
  if (!runDependencyTracking[id]) return id;
  id = orig + Math.random();
 }
}

function addRunDependency(id) {
 runDependencies++;
 if (Module["monitorRunDependencies"]) {
  Module["monitorRunDependencies"](runDependencies);
 }
 if (id) {
  assert(!runDependencyTracking[id]);
  runDependencyTracking[id] = 1;
  if (runDependencyWatcher === null && typeof setInterval != "undefined") {
   runDependencyWatcher = setInterval(function() {
    if (ABORT) {
     clearInterval(runDependencyWatcher);
     runDependencyWatcher = null;
     return;
    }
    var shown = false;
    for (var dep in runDependencyTracking) {
     if (!shown) {
      shown = true;
      err("still waiting on run dependencies:");
     }
     err("dependency: " + dep);
    }
    if (shown) {
     err("(end of list)");
    }
   }, 1e4);
  }
 } else {
  err("warning: run dependency added without ID");
 }
}

function removeRunDependency(id) {
 runDependencies--;
 if (Module["monitorRunDependencies"]) {
  Module["monitorRunDependencies"](runDependencies);
 }
 if (id) {
  assert(runDependencyTracking[id]);
  delete runDependencyTracking[id];
 } else {
  err("warning: run dependency removed without ID");
 }
 if (runDependencies == 0) {
  if (runDependencyWatcher !== null) {
   clearInterval(runDependencyWatcher);
   runDependencyWatcher = null;
  }
  if (dependenciesFulfilled) {
   var callback = dependenciesFulfilled;
   dependenciesFulfilled = null;
   callback();
  }
 }
}

function abort(what) {
 {
  if (Module["onAbort"]) {
   Module["onAbort"](what);
  }
 }
 what = "Aborted(" + what + ")";
 err(what);
 ABORT = true;
 EXITSTATUS = 1;
 var e = new WebAssembly.RuntimeError(what);
 readyPromiseReject(e);
 throw e;
}

var emscriptenMemoryProfiler = {
 detailedHeapUsage: true,
 trackedCallstackMinSizeBytes: typeof new Error().stack == "undefined" ? Infinity : 16 * 1024 * 1024,
 trackedCallstackMinAllocCount: typeof new Error().stack == "undefined" ? Infinity : 1e4,
 hookStackAlloc: true,
 uiUpdateIntervalMsecs: 2e3,
 allocationsAtLoc: {},
 allocationSitePtrs: {},
 sizeOfAllocatedPtr: {},
 sizeOfPreRunAllocatedPtr: {},
 resizeMemorySources: [],
 sbrkSources: [],
 pagePreRunIsFinished: false,
 totalMemoryAllocated: 0,
 totalTimesMallocCalled: 0,
 totalTimesFreeCalled: 0,
 stackTopWatermark: Infinity,
 canvas: null,
 drawContext: null,
 truncDec: function truncDec(f) {
  f = f || 0;
  var str = f.toFixed(2);
  if (str.includes(".00", str.length - 3)) return str.substr(0, str.length - 3); else if (str.includes("0", str.length - 1)) return str.substr(0, str.length - 1); else return str;
 },
 formatBytes: function formatBytes(bytes) {
  if (bytes >= 1e3 * 1024 * 1024) return emscriptenMemoryProfiler.truncDec(bytes / (1024 * 1024 * 1024)) + " GB"; else if (bytes >= 1e3 * 1024) return emscriptenMemoryProfiler.truncDec(bytes / (1024 * 1024)) + " MB"; else if (bytes >= 1e3) return emscriptenMemoryProfiler.truncDec(bytes / 1024) + " KB"; else return emscriptenMemoryProfiler.truncDec(bytes) + " B";
 },
 hsvToRgb: function hsvToRgb(h, s, v) {
  var h_i = h * 6 | 0;
  var f = h * 6 - h_i;
  var p = v * (1 - s);
  var q = v * (1 - f * s);
  var t = v * (1 - (1 - f) * s);
  var r, g, b;
  switch (h_i) {
  case 0:
   r = v;
   g = t;
   b = p;
   break;

  case 1:
   r = q;
   g = v;
   b = p;
   break;

  case 2:
   r = p;
   g = v;
   b = t;
   break;

  case 3:
   r = p;
   g = q;
   b = v;
   break;

  case 4:
   r = t;
   g = p;
   b = v;
   break;

  case 5:
   r = v;
   g = p;
   b = q;
   break;
  }
  function toHex(v) {
   v = (v * 255 | 0).toString(16);
   return v.length == 1 ? "0" + v : v;
  }
  return "#" + toHex(r) + toHex(g) + toHex(b);
 },
 onSbrkGrow: function onSbrkGrow(oldLimit, newLimit) {
  var self = emscriptenMemoryProfiler;
  if (self.sbrkSources.length == 0) {
   self.sbrkSources.push({
    stack: "initial heap sbrk limit<br>",
    begin: 0,
    end: oldLimit,
    color: self.hsvToRgb(self.sbrkSources.length * .618033988749895 % 1, .5, .95)
   });
  }
  if (newLimit <= oldLimit) return;
  self.sbrkSources.push({
   stack: self.filterCallstackForHeapResize(new Error().stack.toString()),
   begin: oldLimit,
   end: newLimit,
   color: self.hsvToRgb(self.sbrkSources.length * .618033988749895 % 1, .5, .95)
  });
 },
 onMemoryResize: function onMemoryResize(oldSize, newSize) {
  var self = emscriptenMemoryProfiler;
  if (self.resizeMemorySources.length == 0) {
   self.resizeMemorySources.push({
    stack: "initial heap size<br>",
    begin: 0,
    end: oldSize,
    color: self.resizeMemorySources.length % 2 ? "#ff00ff" : "#ff80ff"
   });
  }
  if (newSize <= oldSize) return;
  self.resizeMemorySources.push({
   stack: self.filterCallstackForHeapResize(new Error().stack.toString()),
   begin: oldSize,
   end: newSize,
   color: self.resizeMemorySources.length % 2 ? "#ff00ff" : "#ff80ff"
  });
  console.log("memory resize: " + oldSize + " " + newSize);
 },
 recordStackWatermark: function() {
  if (typeof runtimeInitialized == "undefined" || runtimeInitialized) {
   var self = emscriptenMemoryProfiler;
   self.stackTopWatermark = Math.min(self.stackTopWatermark, _emscripten_stack_get_current());
  }
 },
 onMalloc: function onMalloc(ptr, size) {
  if (!ptr) return;
  if (emscriptenMemoryProfiler.sizeOfAllocatedPtr[ptr]) {
   return;
  }
  var self = emscriptenMemoryProfiler;
  self.totalMemoryAllocated += size;
  ++self.totalTimesMallocCalled;
  self.recordStackWatermark();
  self.sizeOfAllocatedPtr[ptr] = size;
  if (!self.pagePreRunIsFinished) self.sizeOfPreRunAllocatedPtr[ptr] = size;
  var loc = new Error().stack.toString();
  if (!self.allocationsAtLoc[loc]) self.allocationsAtLoc[loc] = [ 0, 0, self.filterCallstackForMalloc(loc) ];
  self.allocationsAtLoc[loc][0] += 1;
  self.allocationsAtLoc[loc][1] += size;
  self.allocationSitePtrs[ptr] = loc;
 },
 onFree: function onFree(ptr) {
  if (!ptr) return;
  var self = emscriptenMemoryProfiler;
  var sz = self.sizeOfAllocatedPtr[ptr];
  if (!isNaN(sz)) self.totalMemoryAllocated -= sz; else {
   return;
  }
  self.recordStackWatermark();
  var loc = self.allocationSitePtrs[ptr];
  if (loc) {
   var allocsAtThisLoc = self.allocationsAtLoc[loc];
   if (allocsAtThisLoc) {
    allocsAtThisLoc[0] -= 1;
    allocsAtThisLoc[1] -= sz;
    if (allocsAtThisLoc[0] <= 0) delete self.allocationsAtLoc[loc];
   }
  }
  delete self.allocationSitePtrs[ptr];
  delete self.sizeOfAllocatedPtr[ptr];
  delete self.sizeOfPreRunAllocatedPtr[ptr];
  ++self.totalTimesFreeCalled;
 },
 onRealloc: function onRealloc(oldAddress, newAddress, size) {
  emscriptenMemoryProfiler.onFree(oldAddress);
  emscriptenMemoryProfiler.onMalloc(newAddress, size);
 },
 onPreloadComplete: function onPreloadComplete() {
  emscriptenMemoryProfiler.pagePreRunIsFinished = true;
 },
 initialize: function initialize() {
  Module["onMalloc"] = function onMalloc(ptr, size) {
   emscriptenMemoryProfiler.onMalloc(ptr, size);
  };
  Module["onRealloc"] = function onRealloc(oldAddress, newAddress, size) {
   emscriptenMemoryProfiler.onRealloc(oldAddress, newAddress, size);
  };
  Module["onFree"] = function onFree(ptr) {
   emscriptenMemoryProfiler.onFree(ptr);
  };
  emscriptenMemoryProfiler.recordStackWatermark();
  if (!Module["preRun"]) Module["preRun"] = [];
  Module["preRun"].push(function() {
   emscriptenMemoryProfiler.onPreloadComplete();
  });
  if (emscriptenMemoryProfiler.hookStackAlloc && typeof stackAlloc == "function") {
   var prevStackAlloc = stackAlloc;
   var hookedStackAlloc = function(size) {
    var ptr = prevStackAlloc(size);
    emscriptenMemoryProfiler.recordStackWatermark();
    return ptr;
   };
   stackAlloc = hookedStackAlloc;
  }
  if (location.search.toLowerCase().includes("trackbytes=")) {
   emscriptenMemoryProfiler.trackedCallstackMinSizeBytes = parseInt(location.search.substr(location.search.toLowerCase().indexOf("trackbytes=") + "trackbytes=".length), undefined);
  }
  if (location.search.toLowerCase().includes("trackcount=")) {
   emscriptenMemoryProfiler.trackedCallstackMinAllocCount = parseInt(location.search.substr(location.search.toLowerCase().indexOf("trackcount=") + "trackcount=".length), undefined);
  }
  emscriptenMemoryProfiler.memoryprofiler_summary = document.getElementById("memoryprofiler_summary");
  var div;
  if (!emscriptenMemoryProfiler.memoryprofiler_summary) {
   div = document.createElement("div");
   div.innerHTML = "<div style='border: 2px solid black; padding: 2px;'><canvas style='border: 1px solid black; margin-left: auto; margin-right: auto; display: block;' id='memoryprofiler_canvas' width='100%' height='50'></canvas><input type='checkbox' id='showHeapResizes' onclick='emscriptenMemoryProfiler.updateUi()'>Display heap and sbrk() resizes. Filter sbrk() and heap resize callstacks by keywords: <input type='text' id='sbrkFilter'>(reopen page with ?sbrkFilter=foo,bar query params to prepopulate this list)<br/>Track all allocation sites larger than <input id='memoryprofiler_min_tracked_alloc_size' type=number value=" + emscriptenMemoryProfiler.trackedCallstackMinSizeBytes + "></input> bytes, and all allocation sites with more than <input id='memoryprofiler_min_tracked_alloc_count' type=number value=" + emscriptenMemoryProfiler.trackedCallstackMinAllocCount + "></input> outstanding allocations. (visit this page via URL query params foo.html?trackbytes=1000&trackcount=100 to apply custom thresholds starting from page load)<br/><div id='memoryprofiler_summary'></div><input id='memoryprofiler_clear_alloc_stats' type='button' value='Clear alloc stats' ></input><br />Sort allocations by:<select id='memoryProfilerSort'><option value='bytes'>Bytes</option><option value='count'>Count</option><option value='fixed'>Fixed</option></select><div id='memoryprofiler_ptrs'></div>";
  }
  var populateHtmlBody = function() {
   if (div) {
    document.body.appendChild(div);
    function getValueOfParam(key) {
     var results = new RegExp("[\\?&]" + key + "=([^&#]*)").exec(location.href);
     return results ? results[1] : "";
    }
    if (document.getElementById("sbrkFilter").value = getValueOfParam("sbrkFilter")) {
     document.getElementById("showHeapResizes").checked = true;
    }
   }
   var self = emscriptenMemoryProfiler;
   self.memoryprofiler_summary = document.getElementById("memoryprofiler_summary");
   self.memoryprofiler_ptrs = document.getElementById("memoryprofiler_ptrs");
   document.getElementById("memoryprofiler_min_tracked_alloc_size").addEventListener("change", function(e) {
    self.trackedCallstackMinSizeBytes = parseInt(this.value, undefined);
   });
   document.getElementById("memoryprofiler_min_tracked_alloc_count").addEventListener("change", function(e) {
    self.trackedCallstackMinAllocCount = parseInt(this.value, undefined);
   });
   document.getElementById("memoryprofiler_clear_alloc_stats").addEventListener("click", function(e) {
    self.allocationsAtLoc = {};
    self.allocationSitePtrs = {};
   });
   self.canvas = document.getElementById("memoryprofiler_canvas");
   self.canvas.width = document.documentElement.clientWidth - 32;
   self.drawContext = self.canvas.getContext("2d");
   self.updateUi();
   setInterval(function() {
    emscriptenMemoryProfiler.updateUi();
   }, self.uiUpdateIntervalMsecs);
  };
  if (document.body) populateHtmlBody(); else setTimeout(populateHtmlBody, 1e3);
 },
 bytesToPixelsRoundedDown: function bytesToPixelsRoundedDown(bytes) {
  return bytes * emscriptenMemoryProfiler.canvas.width * emscriptenMemoryProfiler.canvas.height / HEAP8.length | 0;
 },
 bytesToPixelsRoundedUp: function bytesToPixelsRoundedUp(bytes) {
  return (bytes * emscriptenMemoryProfiler.canvas.width * emscriptenMemoryProfiler.canvas.height + HEAP8.length - 1) / HEAP8.length | 0;
 },
 fillLine: function fillLine(startBytes, endBytes) {
  var self = emscriptenMemoryProfiler;
  var startPixels = self.bytesToPixelsRoundedDown(startBytes);
  var endPixels = self.bytesToPixelsRoundedUp(endBytes);
  var x0 = startPixels / self.canvas.height | 0;
  var y0 = startPixels - x0 * self.canvas.height;
  var x1 = endPixels / self.canvas.height | 0;
  var y1 = endPixels - x1 * self.canvas.height;
  if (y0 > 0 && x0 < x1) {
   self.drawContext.fillRect(x0, y0, 1, self.canvas.height - y0);
   y0 = 0;
   ++x0;
  }
  if (y1 < self.canvas.height && x0 < x1) {
   self.drawContext.fillRect(x1, 0, 1, y1);
   y1 = self.canvas.height - 1;
   --x1;
  }
  self.drawContext.fillRect(x0, 0, x1 - x0 + 1, self.canvas.height);
 },
 fillRect: function fillRect(startBytes, endBytes, heightPercentage) {
  var self = emscriptenMemoryProfiler;
  var startPixels = self.bytesToPixelsRoundedDown(startBytes);
  var endPixels = self.bytesToPixelsRoundedUp(endBytes);
  var x0 = startPixels / self.canvas.height | 0;
  var x1 = endPixels / self.canvas.height | 0;
  self.drawContext.fillRect(x0, self.canvas.height * (1 - heightPercentage), x1 - x0 + 1, self.canvas.height);
 },
 countOpenALAudioDataSize: function countOpenALAudioDataSize() {
  if (typeof AL == "undefined" || !AL.currentContext) return 0;
  var totalMemory = 0;
  for (var i in AL.currentContext.buf) {
   var buffer = AL.currentContext.buf[i];
   for (var channel = 0; channel < buffer.numberOfChannels; ++channel) totalMemory += buffer.getChannelData(channel).length * 4;
  }
  return totalMemory;
 },
 printAllocsWithCyclingColors: function printAllocsWithCyclingColors(colors, allocs) {
  var colorIndex = 0;
  for (var i in allocs) {
   emscriptenMemoryProfiler.drawContext.fillStyle = colors[colorIndex];
   colorIndex = (colorIndex + 1) % colors.length;
   var start = i | 0;
   var sz = allocs[start] | 0;
   emscriptenMemoryProfiler.fillLine(start, start + sz);
  }
 },
 filterURLsFromCallstack: function(callstack) {
  callstack = callstack.replace(/@((file)|(http))[\w:\/\.]*\/([\w\.]*)/g, "@$4");
  callstack = callstack.replace(/\n/g, "<br />");
  return callstack;
 },
 filterCallstackAfterFunctionName: function(callstack, func) {
  var i = callstack.indexOf(func);
  if (i != -1) {
   var end = callstack.indexOf("<br />", i);
   if (end != -1) {
    return callstack.substr(0, end);
   }
  }
  return callstack;
 },
 filterCallstackForMalloc: function(callstack) {
  var i = callstack.indexOf("emscripten_trace_record_");
  if (i != -1) {
   callstack = callstack.substr(callstack.indexOf("\n", i) + 1);
  }
  return emscriptenMemoryProfiler.filterURLsFromCallstack(callstack);
 },
 filterCallstackForHeapResize: function(callstack) {
  var i = callstack.indexOf("emscripten_asm_const_iii");
  var j = callstack.indexOf("emscripten_realloc_buffer");
  i = i == -1 ? j : j == -1 ? i : Math.min(i, j);
  if (i != -1) {
   callstack = callstack.substr(callstack.indexOf("\n", i) + 1);
  }
  callstack = callstack.replace(/(wasm-function\[\d+\]):0x[0-9a-f]+/g, "$1");
  return emscriptenMemoryProfiler.filterURLsFromCallstack(callstack);
 },
 printHeapResizeLog: function(heapResizes) {
  var demangler = typeof demangleAll != "undefined" ? demangleAll : function(x) {
   return x;
  };
  var html = "";
  for (var i = 0; i < heapResizes.length; ++i) {
   var j = i + 1;
   while (j < heapResizes.length) {
    if ((heapResizes[j].filteredStack || heapResizes[j].stack) == (heapResizes[i].filteredStack || heapResizes[i].stack)) {
     ++j;
    } else {
     break;
    }
   }
   var resizeFirst = heapResizes[i];
   var resizeLast = heapResizes[j - 1];
   var count = j - i;
   html += '<div style="background-color: ' + resizeFirst.color + '"><b>' + resizeFirst.begin + "-" + resizeLast.end + " (" + count + " times, " + emscriptenMemoryProfiler.formatBytes(resizeLast.end - resizeFirst.begin) + ")</b>:" + demangler(resizeFirst.filteredStack || resizeFirst.stack) + "</div><br>";
   i = j - 1;
  }
  return html;
 },
 updateUi: function updateUi() {
  if (document.body.style.overflow != "") document.body.style.overflow = "";
  function colorBar(color) {
   return '<span style="padding:0px; border:solid 1px black; width:28px;height:14px; vertical-align:middle; display:inline-block; background-color:' + color + ';"></span>';
  }
  function nBits(n) {
   var i = 0;
   while (n >= 1) {
    ++i;
    n /= 2;
   }
   return i;
  }
  function toHex(i, width) {
   var str = i.toString(16);
   while (str.length < width) str = "0" + str;
   return "0x" + str;
  }
  var self = emscriptenMemoryProfiler;
  if (self.canvas.width != document.documentElement.clientWidth - 32) {
   self.canvas.width = document.documentElement.clientWidth - 32;
  }
  if (typeof runtimeInitialized != "undefined" && !runtimeInitialized) {
   return;
  }
  var stackBase = _emscripten_stack_get_base();
  var stackMax = _emscripten_stack_get_end();
  var stackCurrent = _emscripten_stack_get_current();
  var width = (nBits(HEAP8.length) + 3) / 4;
  var html = "Total HEAP size: " + self.formatBytes(HEAP8.length) + ".";
  html += "<br />" + colorBar("#202020") + "STATIC memory area size: " + self.formatBytes(stackMax - 1024);
  html += ". 1024: " + toHex(1024, width);
  html += "<br />" + colorBar("#FF8080") + "STACK memory area size: " + self.formatBytes(stackBase - stackMax);
  html += ". STACK_BASE: " + toHex(stackBase, width);
  html += ". STACKTOP: " + toHex(stackCurrent, width);
  html += ". STACK_MAX: " + toHex(stackMax, width) + ".";
  html += "<br />STACK memory area used now (should be zero): " + self.formatBytes(stackBase - stackCurrent) + "." + colorBar("#FFFF00") + " STACK watermark highest seen usage (approximate lower-bound!): " + self.formatBytes(stackBase - self.stackTopWatermark);
  var heap_base = Module["___heap_base"];
  var heap_end = _sbrk();
  html += "<br />DYNAMIC memory area size: " + self.formatBytes(heap_end - heap_base);
  html += ". start: " + toHex(heap_base, width);
  html += ". end: " + toHex(heap_end, width) + ".";
  html += "<br />" + colorBar("#6699CC") + colorBar("#003366") + colorBar("#0000FF") + "DYNAMIC memory area used: " + self.formatBytes(self.totalMemoryAllocated) + " (" + (self.totalMemoryAllocated * 100 / (HEAP8.length - heap_base)).toFixed(2) + "% of all dynamic memory and unallocated heap)";
  html += "<br />Free memory: " + colorBar("#70FF70") + "DYNAMIC: " + self.formatBytes(heap_end - heap_base - self.totalMemoryAllocated) + ", " + colorBar("#FFFFFF") + "Unallocated HEAP: " + self.formatBytes(HEAP8.length - heap_end) + " (" + ((HEAP8.length - heap_base - self.totalMemoryAllocated) * 100 / (HEAP8.length - heap_base)).toFixed(2) + "% of all dynamic memory and unallocated heap)";
  var preloadedMemoryUsed = 0;
  for (var i in self.sizeOfPreRunAllocatedPtr) preloadedMemoryUsed += self.sizeOfPreRunAllocatedPtr[i] | 0;
  html += "<br />" + colorBar("#FF9900") + colorBar("#FFDD33") + "Preloaded memory used, most likely memory reserved by files in the virtual filesystem : " + self.formatBytes(preloadedMemoryUsed);
  html += "<br />OpenAL audio data: " + self.formatBytes(self.countOpenALAudioDataSize()) + " (outside HEAP)";
  html += "<br /># of total malloc()s/free()s performed in app lifetime: " + self.totalTimesMallocCalled + "/" + self.totalTimesFreeCalled + " (currently alive pointers: " + (self.totalTimesMallocCalled - self.totalTimesFreeCalled) + ")";
  self.drawContext.fillStyle = "#FFFFFF";
  self.drawContext.fillRect(0, 0, self.canvas.width, self.canvas.height);
  self.drawContext.fillStyle = "#FF8080";
  self.fillLine(stackMax, stackBase);
  self.drawContext.fillStyle = "#FFFF00";
  self.fillLine(self.stackTopWatermark, stackBase);
  self.drawContext.fillStyle = "#FF0000";
  self.fillLine(stackCurrent, stackBase);
  self.drawContext.fillStyle = "#70FF70";
  self.fillLine(heap_base, heap_end);
  if (self.detailedHeapUsage) {
   self.printAllocsWithCyclingColors([ "#6699CC", "#003366", "#0000FF" ], self.sizeOfAllocatedPtr);
   self.printAllocsWithCyclingColors([ "#FF9900", "#FFDD33" ], self.sizeOfPreRunAllocatedPtr);
  } else {
   self.drawContext.fillStyle = "#0000FF";
   self.fillLine(heap_base, heap_base + self.totalMemoryAllocated);
  }
  if (document.getElementById("showHeapResizes").checked) {
   for (var i in self.resizeMemorySources) {
    var resize = self.resizeMemorySources[i];
    self.drawContext.fillStyle = resize.color;
    self.fillRect(resize.begin, resize.end, .5);
   }
   var uniqueSources = {};
   var filterWords = document.getElementById("sbrkFilter").value.split(",");
   for (var i in self.sbrkSources) {
    var sbrk = self.sbrkSources[i];
    var stack = sbrk.stack;
    for (var j in filterWords) {
     var s = filterWords[j].trim();
     if (s.length > 0) stack = self.filterCallstackAfterFunctionName(stack, s);
    }
    sbrk.filteredStack = stack;
    if (!uniqueSources[stack]) {
     uniqueSources[stack] = self.hsvToRgb(Object.keys(uniqueSources).length * .618033988749895 % 1, .5, .95);
    }
    self.drawContext.fillStyle = sbrk.color = uniqueSources[stack];
    self.fillRect(sbrk.begin, sbrk.end, .25);
   }
   function line(x0, y0, x1, y1) {
    self.drawContext.beginPath();
    self.drawContext.moveTo(x0, y0);
    self.drawContext.lineTo(x1, y1);
    self.drawContext.lineWidth = 2;
    self.drawContext.stroke();
   }
   if (self.sbrkSources.length > 0) line(0, .75 * self.canvas.height, self.canvas.width, .75 * self.canvas.height);
   if (self.resizeMemorySources.length > 0) line(0, .5 * self.canvas.height, self.canvas.width, .5 * self.canvas.height);
  }
  self.memoryprofiler_summary.innerHTML = html;
  var sort = document.getElementById("memoryProfilerSort");
  var sortOrder = sort.options[sort.selectedIndex].value;
  html = "";
  if (document.getElementById("showHeapResizes").checked) {
   html += '<div style="background-color: #c0c0c0"><h4>Heap resize locations:</h4>';
   html += self.printHeapResizeLog(self.resizeMemorySources);
   html += "</div>";
   html += '<div style="background-color: #c0c0ff"><h4>Memory sbrk() locations:</h4>';
   html += self.printHeapResizeLog(self.sbrkSources);
   html += "</div>";
  } else {
   var demangler = typeof demangleAll != "undefined" ? demangleAll : function(x) {
    return x;
   };
   if (Object.keys(self.allocationsAtLoc).length > 0) {
    var calls = [];
    for (var i in self.allocationsAtLoc) {
     if (self.allocationsAtLoc[i][0] >= self.trackedCallstackMinAllocCount || self.allocationsAtLoc[i][1] >= self.trackedCallstackMinSizeBytes) {
      calls.push(self.allocationsAtLoc[i]);
     }
    }
    if (calls.length > 0) {
     if (sortOrder != "fixed") {
      var sortIdx = sortOrder == "count" ? 0 : 1;
      calls.sort(function(a, b) {
       return b[sortIdx] - a[sortIdx];
      });
     }
     html += "<h4>Allocation sites with more than " + self.formatBytes(self.trackedCallstackMinSizeBytes) + " of accumulated allocations, or more than " + self.trackedCallstackMinAllocCount + " simultaneously outstanding allocations:</h4>";
     for (var i in calls) {
      if (calls[i].length == 3) calls[i] = [ calls[i][0], calls[i][1], calls[i][2], demangler(calls[i][2]) ];
      html += "<b>" + self.formatBytes(calls[i][1]) + "/" + calls[i][0] + " allocs</b>: " + calls[i][3] + "<br />";
     }
    }
   }
  }
  self.memoryprofiler_ptrs.innerHTML = html;
 }
};

function memoryprofiler_add_hooks() {
 emscriptenMemoryProfiler.initialize();
}

if (typeof Module != "undefined" && typeof document != "undefined" && typeof window != "undefined" && typeof process == "undefined") emscriptenMemoryProfiler.initialize();

var FS = {
 error: function() {
  abort("Filesystem support (FS) was not included. The problem is that you are using files from JS, but files were not used from C/C++, so filesystem support was not auto-included. You can force-include filesystem support with -sFORCE_FILESYSTEM");
 },
 init: function() {
  FS.error();
 },
 createDataFile: function() {
  FS.error();
 },
 createPreloadedFile: function() {
  FS.error();
 },
 createLazyFile: function() {
  FS.error();
 },
 open: function() {
  FS.error();
 },
 mkdev: function() {
  FS.error();
 },
 registerDevice: function() {
  FS.error();
 },
 analyzePath: function() {
  FS.error();
 },
 loadFilesFromDB: function() {
  FS.error();
 },
 ErrnoError: function ErrnoError() {
  FS.error();
 }
};

Module["FS_createDataFile"] = FS.createDataFile;

Module["FS_createPreloadedFile"] = FS.createPreloadedFile;

var dataURIPrefix = "data:application/octet-stream;base64,";

function isDataURI(filename) {
 return filename.startsWith(dataURIPrefix);
}

function isFileURI(filename) {
 return filename.startsWith("file://");
}

function createExportWrapper(name, fixedasm) {
 return function() {
  var displayName = name;
  var asm = fixedasm;
  if (!fixedasm) {
   asm = Module["asm"];
  }
  assert(runtimeInitialized, "native function `" + displayName + "` called before runtime initialization");
  if (!asm[name]) {
   assert(asm[name], "exported native function `" + displayName + "` not found");
  }
  return asm[name].apply(null, arguments);
 };
}

var wasmBinaryFile;

if (Module["locateFile"]) {
 wasmBinaryFile = "engine.wasm";
 if (!isDataURI(wasmBinaryFile)) {
  wasmBinaryFile = locateFile(wasmBinaryFile);
 }
} else {
 wasmBinaryFile = new URL("engine.wasm", import.meta.url).toString();
}

function getBinary(file) {
 try {
  if (file == wasmBinaryFile && wasmBinary) {
   return new Uint8Array(wasmBinary);
  }
  if (readBinary) {
   return readBinary(file);
  }
  throw "both async and sync fetching of the wasm failed";
 } catch (err) {
  abort(err);
 }
}

function getBinaryPromise() {
 if (!wasmBinary && (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER)) {
  if (typeof fetch == "function" && !isFileURI(wasmBinaryFile)) {
   return fetch(wasmBinaryFile, {
    credentials: "same-origin"
   }).then(function(response) {
    if (!response["ok"]) {
     throw "failed to load wasm binary file at '" + wasmBinaryFile + "'";
    }
    return response["arrayBuffer"]();
   }).catch(function() {
    return getBinary(wasmBinaryFile);
   });
  } else {
   if (readAsync) {
    return new Promise(function(resolve, reject) {
     readAsync(wasmBinaryFile, function(response) {
      resolve(new Uint8Array(response));
     }, reject);
    });
   }
  }
 }
 return Promise.resolve().then(function() {
  return getBinary(wasmBinaryFile);
 });
}

function createWasm() {
 var info = {
  "env": asmLibraryArg,
  "wasi_snapshot_preview1": asmLibraryArg
 };
 function receiveInstance(instance, module) {
  var exports = instance.exports;
  Module["asm"] = exports;
  wasmMemory = Module["asm"]["memory"];
  assert(wasmMemory, "memory not found in wasm exports");
  updateGlobalBufferAndViews(wasmMemory.buffer);
  wasmTable = Module["asm"]["__indirect_function_table"];
  assert(wasmTable, "table not found in wasm exports");
  addOnInit(Module["asm"]["__wasm_call_ctors"]);
  removeRunDependency("wasm-instantiate");
 }
 addRunDependency("wasm-instantiate");
 var trueModule = Module;
 function receiveInstantiationResult(result) {
  assert(Module === trueModule, "the Module object should not be replaced during async compilation - perhaps the order of HTML elements is wrong?");
  trueModule = null;
  receiveInstance(result["instance"]);
 }
 function instantiateArrayBuffer(receiver) {
  return getBinaryPromise().then(function(binary) {
   return WebAssembly.instantiate(binary, info);
  }).then(function(instance) {
   return instance;
  }).then(receiver, function(reason) {
   err("failed to asynchronously prepare wasm: " + reason);
   if (isFileURI(wasmBinaryFile)) {
    err("warning: Loading from a file URI (" + wasmBinaryFile + ") is not supported in most browsers. See https://emscripten.org/docs/getting_started/FAQ.html#how-do-i-run-a-local-webserver-for-testing-why-does-my-program-stall-in-downloading-or-preparing");
   }
   abort(reason);
  });
 }
 function instantiateAsync() {
  if (!wasmBinary && typeof WebAssembly.instantiateStreaming == "function" && !isDataURI(wasmBinaryFile) && !isFileURI(wasmBinaryFile) && !ENVIRONMENT_IS_NODE && typeof fetch == "function") {
   return fetch(wasmBinaryFile, {
    credentials: "same-origin"
   }).then(function(response) {
    var result = WebAssembly.instantiateStreaming(response, info);
    return result.then(receiveInstantiationResult, function(reason) {
     err("wasm streaming compile failed: " + reason);
     err("falling back to ArrayBuffer instantiation");
     return instantiateArrayBuffer(receiveInstantiationResult);
    });
   });
  } else {
   return instantiateArrayBuffer(receiveInstantiationResult);
  }
 }
 if (Module["instantiateWasm"]) {
  try {
   var exports = Module["instantiateWasm"](info, receiveInstance);
   return exports;
  } catch (e) {
   err("Module.instantiateWasm callback failed with error: " + e);
   readyPromiseReject(e);
  }
 }
 instantiateAsync().catch(readyPromiseReject);
 return {};
}

var tempDouble;

var tempI64;

var ASM_CONSTS = {};

function ExitStatus(status) {
 this.name = "ExitStatus";
 this.message = "Program terminated with exit(" + status + ")";
 this.status = status;
}

function callRuntimeCallbacks(callbacks) {
 while (callbacks.length > 0) {
  callbacks.shift()(Module);
 }
}

function withStackSave(f) {
 var stack = stackSave();
 var ret = f();
 stackRestore(stack);
 return ret;
}

function demangle(func) {
 demangle.recursionGuard = (demangle.recursionGuard | 0) + 1;
 if (demangle.recursionGuard > 1) return func;
 assert(___cxa_demangle);
 return withStackSave(function() {
  try {
   var s = func;
   if (s.startsWith("__Z")) s = s.substr(1);
   var len = lengthBytesUTF8(s) + 1;
   var buf = stackAlloc(len);
   stringToUTF8(s, buf, len);
   var status = stackAlloc(4);
   var ret = ___cxa_demangle(buf, 0, 0, status);
   if (SAFE_HEAP_LOAD((status >> 2) * 4, 4, 0) === 0 && ret) {
    return UTF8ToString(ret);
   }
  } catch (e) {} finally {
   _free(ret);
   if (demangle.recursionGuard < 2) --demangle.recursionGuard;
  }
  return func;
 });
}

function getValue(ptr, type = "i8") {
 if (type.endsWith("*")) type = "*";
 switch (type) {
 case "i1":
  return SAFE_HEAP_LOAD(ptr >> 0, 1, 0);

 case "i8":
  return SAFE_HEAP_LOAD(ptr >> 0, 1, 0);

 case "i16":
  return SAFE_HEAP_LOAD((ptr >> 1) * 2, 2, 0);

 case "i32":
  return SAFE_HEAP_LOAD((ptr >> 2) * 4, 4, 0);

 case "i64":
  return SAFE_HEAP_LOAD((ptr >> 2) * 4, 4, 0);

 case "float":
  return SAFE_HEAP_LOAD_D((ptr >> 2) * 4, 4, 0);

 case "double":
  return SAFE_HEAP_LOAD_D((ptr >> 3) * 8, 8, 0);

 case "*":
  return SAFE_HEAP_LOAD((ptr >> 2) * 4, 4, 1);

 default:
  abort("invalid type for getValue: " + type);
 }
 return null;
}

function getValue_safe(ptr, type) {
 switch (type) {
 case "i1":
  return HEAP8[ptr >> 0];

 case "i8":
  return HEAP8[ptr >> 0];

 case "i16":
  return HEAP16[ptr >> 1];

 case "i32":
  return HEAP32[ptr >> 2];

 case "i64":
  return HEAP32[ptr >> 2];

 case "float":
  return HEAPF32[ptr >> 2];

 case "double":
  return HEAPF64[ptr >> 3];

 default:
  abort("invalid type for getValue: " + type);
 }
}

function setValue(ptr, value, type = "i8") {
 if (type.endsWith("*")) type = "*";
 switch (type) {
 case "i1":
  SAFE_HEAP_STORE(ptr >> 0, value, 1);
  break;

 case "i8":
  SAFE_HEAP_STORE(ptr >> 0, value, 1);
  break;

 case "i16":
  SAFE_HEAP_STORE((ptr >> 1) * 2, value, 2);
  break;

 case "i32":
  SAFE_HEAP_STORE((ptr >> 2) * 4, value, 4);
  break;

 case "i64":
  tempI64 = [ value >>> 0, (tempDouble = value, +Math.abs(tempDouble) >= 1 ? tempDouble > 0 ? (Math.min(+Math.floor(tempDouble / 4294967296), 4294967295) | 0) >>> 0 : ~~+Math.ceil((tempDouble - +(~~tempDouble >>> 0)) / 4294967296) >>> 0 : 0) ], 
  SAFE_HEAP_STORE((ptr >> 2) * 4, tempI64[0], 4), SAFE_HEAP_STORE((ptr + 4 >> 2) * 4, tempI64[1], 4);
  break;

 case "float":
  SAFE_HEAP_STORE_D((ptr >> 2) * 4, value, 4);
  break;

 case "double":
  SAFE_HEAP_STORE_D((ptr >> 3) * 8, value, 8);
  break;

 case "*":
  SAFE_HEAP_STORE((ptr >> 2) * 4, value, 4);
  break;

 default:
  abort("invalid type for setValue: " + type);
 }
}

function setValue_safe(ptr, value, type) {
 switch (type) {
 case "i1":
  HEAP8[ptr >> 0] = value;
  break;

 case "i8":
  HEAP8[ptr >> 0] = value;
  break;

 case "i16":
  HEAP16[ptr >> 1] = value;
  break;

 case "i32":
  HEAP32[ptr >> 2] = value;
  break;

 case "i64":
  tempI64 = [ value >>> 0, (tempDouble = value, +Math.abs(tempDouble) >= 1 ? tempDouble > 0 ? (Math.min(+Math.floor(tempDouble / 4294967296), 4294967295) | 0) >>> 0 : ~~+Math.ceil((tempDouble - +(~~tempDouble >>> 0)) / 4294967296) >>> 0 : 0) ], 
  HEAP32[ptr >> 2] = tempI64[0], HEAP32[ptr + 4 >> 2] = tempI64[1];
  break;

 case "float":
  HEAPF32[ptr >> 2] = value;
  break;

 case "double":
  HEAPF64[ptr >> 3] = value;
  break;

 default:
  abort("invalid type for setValue: " + type);
 }
}

function jsStackTrace() {
 var error = new Error();
 if (!error.stack) {
  try {
   throw new Error();
  } catch (e) {
   error = e;
  }
  if (!error.stack) {
   return "(no stack trace available)";
  }
 }
 return error.stack.toString();
}

function demangleAll(text) {
 var regex = /\b_Z[\w\d_]+/g;
 return text.replace(regex, function(x) {
  var y = demangle(x);
  return x === y ? x : y + " [" + x + "]";
 });
}

function stackTrace() {
 var js = jsStackTrace();
 if (Module["extraStackTrace"]) js += "\n" + Module["extraStackTrace"]();
 return demangleAll(js);
}

function unSign(value, bits) {
 if (value >= 0) {
  return value;
 }
 return bits <= 32 ? 2 * Math.abs(1 << bits - 1) + value : Math.pow(2, bits) + value;
}

function warnOnce(text) {
 if (!warnOnce.shown) warnOnce.shown = {};
 if (!warnOnce.shown[text]) {
  warnOnce.shown[text] = 1;
  if (ENVIRONMENT_IS_NODE) text = "warning: " + text;
  err(text);
 }
}

function ___assert_fail(condition, filename, line, func) {
 abort("Assertion failed: " + UTF8ToString(condition) + ", at: " + [ filename ? UTF8ToString(filename) : "unknown filename", line, func ? UTF8ToString(func) : "unknown function" ]);
}

function ___cxa_allocate_exception(size) {
 return _malloc(size + 24) + 24;
}

var exceptionCaught = [];

function exception_addRef(info) {
 info.add_ref();
}

var uncaughtExceptionCount = 0;

function ___cxa_begin_catch(ptr) {
 var info = new ExceptionInfo(ptr);
 if (!info.get_caught()) {
  info.set_caught(true);
  uncaughtExceptionCount--;
 }
 info.set_rethrown(false);
 exceptionCaught.push(info);
 exception_addRef(info);
 return info.get_exception_ptr();
}

var exceptionLast = 0;

function ExceptionInfo(excPtr) {
 this.excPtr = excPtr;
 this.ptr = excPtr - 24;
 this.set_type = function(type) {
  SAFE_HEAP_STORE((this.ptr + 4 >> 2) * 4, type, 4);
 };
 this.get_type = function() {
  return SAFE_HEAP_LOAD((this.ptr + 4 >> 2) * 4, 4, 1);
 };
 this.set_destructor = function(destructor) {
  SAFE_HEAP_STORE((this.ptr + 8 >> 2) * 4, destructor, 4);
 };
 this.get_destructor = function() {
  return SAFE_HEAP_LOAD((this.ptr + 8 >> 2) * 4, 4, 1);
 };
 this.set_refcount = function(refcount) {
  SAFE_HEAP_STORE((this.ptr >> 2) * 4, refcount, 4);
 };
 this.set_caught = function(caught) {
  caught = caught ? 1 : 0;
  SAFE_HEAP_STORE(this.ptr + 12 >> 0, caught, 1);
 };
 this.get_caught = function() {
  return SAFE_HEAP_LOAD(this.ptr + 12 >> 0, 1, 0) != 0;
 };
 this.set_rethrown = function(rethrown) {
  rethrown = rethrown ? 1 : 0;
  SAFE_HEAP_STORE(this.ptr + 13 >> 0, rethrown, 1);
 };
 this.get_rethrown = function() {
  return SAFE_HEAP_LOAD(this.ptr + 13 >> 0, 1, 0) != 0;
 };
 this.init = function(type, destructor) {
  this.set_adjusted_ptr(0);
  this.set_type(type);
  this.set_destructor(destructor);
  this.set_refcount(0);
  this.set_caught(false);
  this.set_rethrown(false);
 };
 this.add_ref = function() {
  var value = SAFE_HEAP_LOAD((this.ptr >> 2) * 4, 4, 0);
  SAFE_HEAP_STORE((this.ptr >> 2) * 4, value + 1, 4);
 };
 this.release_ref = function() {
  var prev = SAFE_HEAP_LOAD((this.ptr >> 2) * 4, 4, 0);
  SAFE_HEAP_STORE((this.ptr >> 2) * 4, prev - 1, 4);
  assert(prev > 0);
  return prev === 1;
 };
 this.set_adjusted_ptr = function(adjustedPtr) {
  SAFE_HEAP_STORE((this.ptr + 16 >> 2) * 4, adjustedPtr, 4);
 };
 this.get_adjusted_ptr = function() {
  return SAFE_HEAP_LOAD((this.ptr + 16 >> 2) * 4, 4, 1);
 };
 this.get_exception_ptr = function() {
  var isPointer = ___cxa_is_pointer_type(this.get_type());
  if (isPointer) {
   return SAFE_HEAP_LOAD((this.excPtr >> 2) * 4, 4, 1);
  }
  var adjusted = this.get_adjusted_ptr();
  if (adjusted !== 0) return adjusted;
  return this.excPtr;
 };
}

function ___cxa_free_exception(ptr) {
 try {
  return _free(new ExceptionInfo(ptr).ptr);
 } catch (e) {
  err("exception during __cxa_free_exception: " + e);
 }
}

var wasmTableMirror = [];

function getWasmTableEntry(funcPtr) {
 var func = wasmTableMirror[funcPtr];
 if (!func) {
  if (funcPtr >= wasmTableMirror.length) wasmTableMirror.length = funcPtr + 1;
  wasmTableMirror[funcPtr] = func = wasmTable.get(funcPtr);
 }
 assert(wasmTable.get(funcPtr) == func, "JavaScript-side Wasm function table mirror is out of date!");
 return func;
}

function exception_decRef(info) {
 if (info.release_ref() && !info.get_rethrown()) {
  var destructor = info.get_destructor();
  if (destructor) {
   getWasmTableEntry(destructor)(info.excPtr);
  }
  ___cxa_free_exception(info.excPtr);
 }
}

function ___cxa_end_catch() {
 _setThrew(0);
 assert(exceptionCaught.length > 0);
 var info = exceptionCaught.pop();
 exception_decRef(info);
 exceptionLast = 0;
}

function ___resumeException(ptr) {
 if (!exceptionLast) {
  exceptionLast = ptr;
 }
 throw ptr;
}

function ___cxa_find_matching_catch_2() {
 var thrown = exceptionLast;
 if (!thrown) {
  setTempRet0(0);
  return 0;
 }
 var info = new ExceptionInfo(thrown);
 info.set_adjusted_ptr(thrown);
 var thrownType = info.get_type();
 if (!thrownType) {
  setTempRet0(0);
  return thrown;
 }
 for (var i = 0; i < arguments.length; i++) {
  var caughtType = arguments[i];
  if (caughtType === 0 || caughtType === thrownType) {
   break;
  }
  var adjusted_ptr_addr = info.ptr + 16;
  if (___cxa_can_catch(caughtType, thrownType, adjusted_ptr_addr)) {
   setTempRet0(caughtType);
   return thrown;
  }
 }
 setTempRet0(thrownType);
 return thrown;
}

function ___cxa_find_matching_catch_3() {
 var thrown = exceptionLast;
 if (!thrown) {
  setTempRet0(0);
  return 0;
 }
 var info = new ExceptionInfo(thrown);
 info.set_adjusted_ptr(thrown);
 var thrownType = info.get_type();
 if (!thrownType) {
  setTempRet0(0);
  return thrown;
 }
 for (var i = 0; i < arguments.length; i++) {
  var caughtType = arguments[i];
  if (caughtType === 0 || caughtType === thrownType) {
   break;
  }
  var adjusted_ptr_addr = info.ptr + 16;
  if (___cxa_can_catch(caughtType, thrownType, adjusted_ptr_addr)) {
   setTempRet0(caughtType);
   return thrown;
  }
 }
 setTempRet0(thrownType);
 return thrown;
}

function ___cxa_rethrow() {
 var info = exceptionCaught.pop();
 if (!info) {
  abort("no exception to throw");
 }
 var ptr = info.excPtr;
 if (!info.get_rethrown()) {
  exceptionCaught.push(info);
  info.set_rethrown(true);
  info.set_caught(false);
  uncaughtExceptionCount++;
 }
 exceptionLast = ptr;
 throw ptr;
}

function ___cxa_throw(ptr, type, destructor) {
 var info = new ExceptionInfo(ptr);
 info.init(type, destructor);
 exceptionLast = ptr;
 uncaughtExceptionCount++;
 throw ptr;
}

function _abort() {
 abort("native code called abort()");
}

function _emscripten_memcpy_big(dest, src, num) {
 HEAPU8.copyWithin(dest, src, src + num);
}

function _emscripten_memprof_sbrk_grow(old_brk, new_brk) {
 emscriptenMemoryProfiler.onSbrkGrow(old_brk, new_brk);
}

function getHeapMax() {
 return HEAPU8.length;
}

function abortOnCannotGrowMemory(requestedSize) {
 abort("Cannot enlarge memory arrays to size " + requestedSize + " bytes (OOM). Either (1) compile with -sINITIAL_MEMORY=X with X higher than the current value " + HEAP8.length + ", (2) compile with -sALLOW_MEMORY_GROWTH which allows increasing the size at runtime, or (3) if you want malloc to return NULL (0) instead of this abort, compile with -sABORTING_MALLOC=0");
}

function _emscripten_resize_heap(requestedSize) {
 var oldSize = HEAPU8.length;
 requestedSize = requestedSize >>> 0;
 abortOnCannotGrowMemory(requestedSize);
}

function _emscripten_trace_js_configure(collector_url, application) {
 EmscriptenTrace.configure(collector_url, application);
}

function _emscripten_trace_configure_for_google_wtf() {
 EmscriptenTrace.configureForGoogleWTF();
}

function _emscripten_trace_js_enter_context(name) {
 if (EmscriptenTrace.postEnabled) {
  var now = EmscriptenTrace.now();
  EmscriptenTrace.post([ EmscriptenTrace.EVENT_ENTER_CONTEXT, now, name ]);
 }
 if (EmscriptenTrace.googleWTFEnabled) {
  EmscriptenTrace.googleWTFEnterScope(name);
 }
}

function _emscripten_trace_exit_context() {
 if (EmscriptenTrace.postEnabled) {
  var now = EmscriptenTrace.now();
  EmscriptenTrace.post([ EmscriptenTrace.EVENT_EXIT_CONTEXT, now ]);
 }
 if (EmscriptenTrace.googleWTFEnabled) {
  EmscriptenTrace.googleWTFExitScope();
 }
}

function _emscripten_trace_js_log_message(channel, message) {
 if (EmscriptenTrace.postEnabled) {
  var now = EmscriptenTrace.now();
  EmscriptenTrace.post([ EmscriptenTrace.EVENT_LOG_MESSAGE, now, channel, message ]);
 }
}

function _emscripten_trace_js_mark(message) {
 if (EmscriptenTrace.postEnabled) {
  var now = EmscriptenTrace.now();
  EmscriptenTrace.post([ EmscriptenTrace.EVENT_LOG_MESSAGE, now, "MARK", message ]);
 }
 if (EmscriptenTrace.googleWTFEnabled) {
  window["wtf"].trace.mark(message);
 }
}

var _emscripten_get_now;

if (ENVIRONMENT_IS_NODE) {
 _emscripten_get_now = () => {
  var t = process["hrtime"]();
  return t[0] * 1e3 + t[1] / 1e6;
 };
} else _emscripten_get_now = () => performance.now();

var EmscriptenTrace = {
 worker: null,
 collectorEnabled: false,
 googleWTFEnabled: false,
 testingEnabled: false,
 googleWTFData: {
  scopeStack: [],
  cachedScopes: {}
 },
 DATA_VERSION: 1,
 EVENT_ALLOCATE: "allocate",
 EVENT_ANNOTATE_TYPE: "annotate-type",
 EVENT_APPLICATION_NAME: "application-name",
 EVENT_ASSOCIATE_STORAGE_SIZE: "associate-storage-size",
 EVENT_ENTER_CONTEXT: "enter-context",
 EVENT_EXIT_CONTEXT: "exit-context",
 EVENT_FRAME_END: "frame-end",
 EVENT_FRAME_RATE: "frame-rate",
 EVENT_FRAME_START: "frame-start",
 EVENT_FREE: "free",
 EVENT_LOG_MESSAGE: "log-message",
 EVENT_MEMORY_LAYOUT: "memory-layout",
 EVENT_OFF_HEAP: "off-heap",
 EVENT_REALLOCATE: "reallocate",
 EVENT_REPORT_ERROR: "report-error",
 EVENT_SESSION_NAME: "session-name",
 EVENT_TASK_ASSOCIATE_DATA: "task-associate-data",
 EVENT_TASK_END: "task-end",
 EVENT_TASK_RESUME: "task-resume",
 EVENT_TASK_START: "task-start",
 EVENT_TASK_SUSPEND: "task-suspend",
 EVENT_USER_NAME: "user-name",
 init: function() {
  Module["emscripten_trace_configure"] = _emscripten_trace_js_configure;
  Module["emscripten_trace_configure_for_google_wtf"] = _emscripten_trace_configure_for_google_wtf;
  Module["emscripten_trace_enter_context"] = _emscripten_trace_js_enter_context;
  Module["emscripten_trace_exit_context"] = _emscripten_trace_exit_context;
  Module["emscripten_trace_log_message"] = _emscripten_trace_js_log_message;
  Module["emscripten_trace_mark"] = _emscripten_trace_js_mark;
 },
 loadWorkerViaXHR: function(url, ready, scope) {
  var req = new XMLHttpRequest();
  req.addEventListener("load", function() {
   var blob = new Blob([ this.responseText ], {
    type: "text/javascript"
   });
   var worker = new Worker(window.URL.createObjectURL(blob));
   if (ready) {
    ready.call(scope, worker);
   }
  }, req);
  req.open("get", url, false);
  req.send();
 },
 configure: function(collector_url, application) {
  EmscriptenTrace.now = _emscripten_get_now;
  var now = new Date();
  var session_id = now.getTime().toString() + "_" + Math.floor(Math.random() * 100 + 1).toString();
  EmscriptenTrace.loadWorkerViaXHR(collector_url + "worker.js", function(worker) {
   EmscriptenTrace.worker = worker;
   EmscriptenTrace.worker.addEventListener("error", function(e) {
    out("TRACE WORKER ERROR:");
    out(e);
   }, false);
   EmscriptenTrace.worker.postMessage({
    "cmd": "configure",
    "data_version": EmscriptenTrace.DATA_VERSION,
    "session_id": session_id,
    "url": collector_url
   });
   EmscriptenTrace.configured = true;
   EmscriptenTrace.collectorEnabled = true;
   EmscriptenTrace.postEnabled = true;
  });
  EmscriptenTrace.post([ EmscriptenTrace.EVENT_APPLICATION_NAME, application ]);
  EmscriptenTrace.post([ EmscriptenTrace.EVENT_SESSION_NAME, now.toISOString() ]);
 },
 configureForTest: function() {
  EmscriptenTrace.postEnabled = true;
  EmscriptenTrace.testingEnabled = true;
  EmscriptenTrace.now = function() {
   return 0;
  };
 },
 configureForGoogleWTF: function() {
  if (window && window["wtf"]) {
   EmscriptenTrace.googleWTFEnabled = true;
  } else {
   out("GOOGLE WTF NOT AVAILABLE TO ENABLE");
  }
 },
 post: function(entry) {
  if (EmscriptenTrace.postEnabled && EmscriptenTrace.collectorEnabled) {
   EmscriptenTrace.worker.postMessage({
    "cmd": "post",
    "entry": entry
   });
  } else if (EmscriptenTrace.postEnabled && EmscriptenTrace.testingEnabled) {
   out("Tracing " + entry);
  }
 },
 googleWTFEnterScope: function(name) {
  var scopeEvent = EmscriptenTrace.googleWTFData["cachedScopes"][name];
  if (!scopeEvent) {
   scopeEvent = window["wtf"].trace.events.createScope(name);
   EmscriptenTrace.googleWTFData["cachedScopes"][name] = scopeEvent;
  }
  var scope = scopeEvent();
  EmscriptenTrace.googleWTFData["scopeStack"].push(scope);
 },
 googleWTFExitScope: function() {
  var scope = EmscriptenTrace.googleWTFData["scopeStack"].pop();
  window["wtf"].trace.leaveScope(scope);
 }
};

function _emscripten_trace_record_allocation(address, size) {
 if (typeof Module["onMalloc"] == "function") Module["onMalloc"](address, size);
 if (EmscriptenTrace.postEnabled) {
  var now = EmscriptenTrace.now();
  EmscriptenTrace.post([ EmscriptenTrace.EVENT_ALLOCATE, now, address, size ]);
 }
}

function _emscripten_trace_record_free(address) {
 if (typeof Module["onFree"] == "function") Module["onFree"](address);
 if (EmscriptenTrace.postEnabled) {
  var now = EmscriptenTrace.now();
  EmscriptenTrace.post([ EmscriptenTrace.EVENT_FREE, now, address ]);
 }
}

function _emscripten_trace_record_reallocation(old_address, new_address, size) {
 if (typeof Module["onRealloc"] == "function") Module["onRealloc"](old_address, new_address, size);
 if (EmscriptenTrace.postEnabled) {
  var now = EmscriptenTrace.now();
  EmscriptenTrace.post([ EmscriptenTrace.EVENT_REALLOCATE, now, old_address, new_address, size ]);
 }
}

var SYSCALLS = {
 varargs: undefined,
 get: function() {
  assert(SYSCALLS.varargs != undefined);
  SYSCALLS.varargs += 4;
  var ret = SAFE_HEAP_LOAD((SYSCALLS.varargs - 4 >> 2) * 4, 4, 0);
  return ret;
 },
 getStr: function(ptr) {
  var ret = UTF8ToString(ptr);
  return ret;
 }
};

function _fd_close(fd) {
 abort("fd_close called without SYSCALLS_REQUIRE_FILESYSTEM");
}

function convertI32PairToI53Checked(lo, hi) {
 assert(lo == lo >>> 0 || lo == (lo | 0));
 assert(hi === (hi | 0));
 return hi + 2097152 >>> 0 < 4194305 - !!lo ? (lo >>> 0) + hi * 4294967296 : NaN;
}

function _fd_seek(fd, offset_low, offset_high, whence, newOffset) {
 return 70;
}

var printCharBuffers = [ null, [], [] ];

function printChar(stream, curr) {
 var buffer = printCharBuffers[stream];
 assert(buffer);
 if (curr === 0 || curr === 10) {
  (stream === 1 ? out : err)(UTF8ArrayToString(buffer, 0));
  buffer.length = 0;
 } else {
  buffer.push(curr);
 }
}

function flush_NO_FILESYSTEM() {
 _fflush(0);
 if (printCharBuffers[1].length) printChar(1, 10);
 if (printCharBuffers[2].length) printChar(2, 10);
}

function _fd_write(fd, iov, iovcnt, pnum) {
 var num = 0;
 for (var i = 0; i < iovcnt; i++) {
  var ptr = SAFE_HEAP_LOAD((iov >> 2) * 4, 4, 1);
  var len = SAFE_HEAP_LOAD((iov + 4 >> 2) * 4, 4, 1);
  iov += 8;
  for (var j = 0; j < len; j++) {
   printChar(fd, SAFE_HEAP_LOAD(ptr + j, 1, 1));
  }
  num += len;
 }
 SAFE_HEAP_STORE((pnum >> 2) * 4, num, 4);
 return 0;
}

EmscriptenTrace.init();

var ASSERTIONS = true;

function checkIncomingModuleAPI() {
 ignoredModuleProp("fetchSettings");
}

var asmLibraryArg = {
 "__assert_fail": ___assert_fail,
 "__cxa_allocate_exception": ___cxa_allocate_exception,
 "__cxa_begin_catch": ___cxa_begin_catch,
 "__cxa_end_catch": ___cxa_end_catch,
 "__cxa_find_matching_catch_2": ___cxa_find_matching_catch_2,
 "__cxa_find_matching_catch_3": ___cxa_find_matching_catch_3,
 "__cxa_free_exception": ___cxa_free_exception,
 "__cxa_rethrow": ___cxa_rethrow,
 "__cxa_throw": ___cxa_throw,
 "__resumeException": ___resumeException,
 "abort": _abort,
 "alignfault": alignfault,
 "emscripten_memcpy_big": _emscripten_memcpy_big,
 "emscripten_memprof_sbrk_grow": _emscripten_memprof_sbrk_grow,
 "emscripten_resize_heap": _emscripten_resize_heap,
 "emscripten_trace_record_allocation": _emscripten_trace_record_allocation,
 "emscripten_trace_record_free": _emscripten_trace_record_free,
 "emscripten_trace_record_reallocation": _emscripten_trace_record_reallocation,
 "fd_close": _fd_close,
 "fd_seek": _fd_seek,
 "fd_write": _fd_write,
 "invoke_dd": invoke_dd,
 "invoke_dddddd": invoke_dddddd,
 "invoke_di": invoke_di,
 "invoke_diddd": invoke_diddd,
 "invoke_diddddd": invoke_diddddd,
 "invoke_diiii": invoke_diiii,
 "invoke_diiiiii": invoke_diiiiii,
 "invoke_ffff": invoke_ffff,
 "invoke_fi": invoke_fi,
 "invoke_fii": invoke_fii,
 "invoke_i": invoke_i,
 "invoke_ii": invoke_ii,
 "invoke_iidd": invoke_iidd,
 "invoke_iiddd": invoke_iiddd,
 "invoke_iifff": invoke_iifff,
 "invoke_iiffff": invoke_iiffff,
 "invoke_iifif": invoke_iifif,
 "invoke_iii": invoke_iii,
 "invoke_iiidi": invoke_iiidi,
 "invoke_iiii": invoke_iiii,
 "invoke_iiiii": invoke_iiiii,
 "invoke_iiiiidd": invoke_iiiiidd,
 "invoke_iiiiii": invoke_iiiiii,
 "invoke_iiiiiii": invoke_iiiiiii,
 "invoke_iiiiiiiii": invoke_iiiiiiiii,
 "invoke_iiiiiiiiiii": invoke_iiiiiiiiiii,
 "invoke_iiiiiiiiiiii": invoke_iiiiiiiiiiii,
 "invoke_iiiiiiiiiiiiii": invoke_iiiiiiiiiiiiii,
 "invoke_iiiiij": invoke_iiiiij,
 "invoke_iiiiji": invoke_iiiiji,
 "invoke_iij": invoke_iij,
 "invoke_iijj": invoke_iijj,
 "invoke_ji": invoke_ji,
 "invoke_jii": invoke_jii,
 "invoke_jiii": invoke_jiii,
 "invoke_jj": invoke_jj,
 "invoke_jjj": invoke_jjj,
 "invoke_v": invoke_v,
 "invoke_vi": invoke_vi,
 "invoke_vid": invoke_vid,
 "invoke_vif": invoke_vif,
 "invoke_viff": invoke_viff,
 "invoke_viffffffi": invoke_viffffffi,
 "invoke_viffffffiii": invoke_viffffffiii,
 "invoke_viffffi": invoke_viffffi,
 "invoke_viffi": invoke_viffi,
 "invoke_vifi": invoke_vifi,
 "invoke_vifii": invoke_vifii,
 "invoke_vii": invoke_vii,
 "invoke_viidi": invoke_viidi,
 "invoke_viiffff": invoke_viiffff,
 "invoke_viii": invoke_viii,
 "invoke_viiii": invoke_viiii,
 "invoke_viiiii": invoke_viiiii,
 "invoke_viiiiid": invoke_viiiiid,
 "invoke_viiiiii": invoke_viiiiii,
 "invoke_viiiiiii": invoke_viiiiiii,
 "invoke_viiiiiiii": invoke_viiiiiiii,
 "invoke_viiiiiiiiiii": invoke_viiiiiiiiiii,
 "invoke_viiiiiiiiiiii": invoke_viiiiiiiiiiii,
 "invoke_viiiji": invoke_viiiji,
 "invoke_viiji": invoke_viiji,
 "invoke_vij": invoke_vij,
 "segfault": segfault
};

var asm = createWasm();

var ___wasm_call_ctors = Module["___wasm_call_ctors"] = createExportWrapper("__wasm_call_ctors");

var getTempRet0 = Module["getTempRet0"] = createExportWrapper("getTempRet0");

var _test = Module["_test"] = createExportWrapper("test");

var _check = Module["_check"] = createExportWrapper("check");

var _init = Module["_init"] = createExportWrapper("init");

var _tick = Module["_tick"] = createExportWrapper("tick");

var _finalize = Module["_finalize"] = createExportWrapper("finalize");

var _get_input_queue_ptr = Module["_get_input_queue_ptr"] = createExportWrapper("get_input_queue_ptr");

var _get_output_queue_ptr = Module["_get_output_queue_ptr"] = createExportWrapper("get_output_queue_ptr");

var _print_memory_stats = Module["_print_memory_stats"] = createExportWrapper("print_memory_stats");

var _print_exception = Module["_print_exception"] = createExportWrapper("print_exception");

var ___errno_location = Module["___errno_location"] = createExportWrapper("__errno_location");

var _fflush = Module["_fflush"] = createExportWrapper("fflush");

var _malloc = Module["_malloc"] = createExportWrapper("malloc");

var _free = Module["_free"] = createExportWrapper("free");

var _emscripten_get_sbrk_ptr = Module["_emscripten_get_sbrk_ptr"] = createExportWrapper("emscripten_get_sbrk_ptr");

var _sbrk = Module["_sbrk"] = createExportWrapper("sbrk");

var _setThrew = Module["_setThrew"] = createExportWrapper("setThrew");

var setTempRet0 = Module["setTempRet0"] = createExportWrapper("setTempRet0");

var _emscripten_stack_init = Module["_emscripten_stack_init"] = function() {
 return (_emscripten_stack_init = Module["_emscripten_stack_init"] = Module["asm"]["emscripten_stack_init"]).apply(null, arguments);
};

var _emscripten_stack_get_free = Module["_emscripten_stack_get_free"] = function() {
 return (_emscripten_stack_get_free = Module["_emscripten_stack_get_free"] = Module["asm"]["emscripten_stack_get_free"]).apply(null, arguments);
};

var _emscripten_stack_get_base = Module["_emscripten_stack_get_base"] = function() {
 return (_emscripten_stack_get_base = Module["_emscripten_stack_get_base"] = Module["asm"]["emscripten_stack_get_base"]).apply(null, arguments);
};

var _emscripten_stack_get_end = Module["_emscripten_stack_get_end"] = function() {
 return (_emscripten_stack_get_end = Module["_emscripten_stack_get_end"] = Module["asm"]["emscripten_stack_get_end"]).apply(null, arguments);
};

var stackSave = Module["stackSave"] = createExportWrapper("stackSave");

var stackRestore = Module["stackRestore"] = createExportWrapper("stackRestore");

var stackAlloc = Module["stackAlloc"] = createExportWrapper("stackAlloc");

var _emscripten_stack_get_current = Module["_emscripten_stack_get_current"] = function() {
 return (_emscripten_stack_get_current = Module["_emscripten_stack_get_current"] = Module["asm"]["emscripten_stack_get_current"]).apply(null, arguments);
};

var ___cxa_demangle = Module["___cxa_demangle"] = createExportWrapper("__cxa_demangle");

var ___cxa_can_catch = Module["___cxa_can_catch"] = createExportWrapper("__cxa_can_catch");

var ___cxa_is_pointer_type = Module["___cxa_is_pointer_type"] = createExportWrapper("__cxa_is_pointer_type");

var dynCall_jii = Module["dynCall_jii"] = createExportWrapper("dynCall_jii");

var dynCall_viiji = Module["dynCall_viiji"] = createExportWrapper("dynCall_viiji");

var dynCall_ji = Module["dynCall_ji"] = createExportWrapper("dynCall_ji");

var dynCall_jjj = Module["dynCall_jjj"] = createExportWrapper("dynCall_jjj");

var dynCall_jiii = Module["dynCall_jiii"] = createExportWrapper("dynCall_jiii");

var dynCall_viij = Module["dynCall_viij"] = createExportWrapper("dynCall_viij");

var dynCall_iij = Module["dynCall_iij"] = createExportWrapper("dynCall_iij");

var dynCall_iiiiji = Module["dynCall_iiiiji"] = createExportWrapper("dynCall_iiiiji");

var dynCall_iiiiij = Module["dynCall_iiiiij"] = createExportWrapper("dynCall_iiiiij");

var dynCall_viiiji = Module["dynCall_viiiji"] = createExportWrapper("dynCall_viiiji");

var dynCall_jj = Module["dynCall_jj"] = createExportWrapper("dynCall_jj");

var dynCall_iijj = Module["dynCall_iijj"] = createExportWrapper("dynCall_iijj");

var dynCall_iijjjjjj = Module["dynCall_iijjjjjj"] = createExportWrapper("dynCall_iijjjjjj");

var dynCall_iiiiiiiij = Module["dynCall_iiiiiiiij"] = createExportWrapper("dynCall_iiiiiiiij");

var dynCall_vij = Module["dynCall_vij"] = createExportWrapper("dynCall_vij");

var dynCall_jiji = Module["dynCall_jiji"] = createExportWrapper("dynCall_jiji");

var ___heap_base = Module["___heap_base"] = 12032720;

function invoke_iii(index, a1, a2) {
 var sp = stackSave();
 try {
  return getWasmTableEntry(index)(a1, a2);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0) throw e;
  _setThrew(1, 0);
 }
}

function invoke_viiii(index, a1, a2, a3, a4) {
 var sp = stackSave();
 try {
  getWasmTableEntry(index)(a1, a2, a3, a4);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0) throw e;
  _setThrew(1, 0);
 }
}

function invoke_viii(index, a1, a2, a3) {
 var sp = stackSave();
 try {
  getWasmTableEntry(index)(a1, a2, a3);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0) throw e;
  _setThrew(1, 0);
 }
}

function invoke_vii(index, a1, a2) {
 var sp = stackSave();
 try {
  getWasmTableEntry(index)(a1, a2);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0) throw e;
  _setThrew(1, 0);
 }
}

function invoke_ii(index, a1) {
 var sp = stackSave();
 try {
  return getWasmTableEntry(index)(a1);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0) throw e;
  _setThrew(1, 0);
 }
}

function invoke_iiii(index, a1, a2, a3) {
 var sp = stackSave();
 try {
  return getWasmTableEntry(index)(a1, a2, a3);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0) throw e;
  _setThrew(1, 0);
 }
}

function invoke_vi(index, a1) {
 var sp = stackSave();
 try {
  getWasmTableEntry(index)(a1);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0) throw e;
  _setThrew(1, 0);
 }
}

function invoke_viiiiii(index, a1, a2, a3, a4, a5, a6) {
 var sp = stackSave();
 try {
  getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0) throw e;
  _setThrew(1, 0);
 }
}

function invoke_iiiii(index, a1, a2, a3, a4) {
 var sp = stackSave();
 try {
  return getWasmTableEntry(index)(a1, a2, a3, a4);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0) throw e;
  _setThrew(1, 0);
 }
}

function invoke_v(index) {
 var sp = stackSave();
 try {
  getWasmTableEntry(index)();
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0) throw e;
  _setThrew(1, 0);
 }
}

function invoke_iiffff(index, a1, a2, a3, a4, a5) {
 var sp = stackSave();
 try {
  return getWasmTableEntry(index)(a1, a2, a3, a4, a5);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0) throw e;
  _setThrew(1, 0);
 }
}

function invoke_viiffff(index, a1, a2, a3, a4, a5, a6) {
 var sp = stackSave();
 try {
  getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0) throw e;
  _setThrew(1, 0);
 }
}

function invoke_viiiii(index, a1, a2, a3, a4, a5) {
 var sp = stackSave();
 try {
  getWasmTableEntry(index)(a1, a2, a3, a4, a5);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0) throw e;
  _setThrew(1, 0);
 }
}

function invoke_iiiiiiiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10) {
 var sp = stackSave();
 try {
  return getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7, a8, a9, a10);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0) throw e;
  _setThrew(1, 0);
 }
}

function invoke_iiiiiiiiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11) {
 var sp = stackSave();
 try {
  return getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0) throw e;
  _setThrew(1, 0);
 }
}

function invoke_iiiiii(index, a1, a2, a3, a4, a5) {
 var sp = stackSave();
 try {
  return getWasmTableEntry(index)(a1, a2, a3, a4, a5);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0) throw e;
  _setThrew(1, 0);
 }
}

function invoke_viff(index, a1, a2, a3) {
 var sp = stackSave();
 try {
  getWasmTableEntry(index)(a1, a2, a3);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0) throw e;
  _setThrew(1, 0);
 }
}

function invoke_viiiiiiiiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12) {
 var sp = stackSave();
 try {
  getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0) throw e;
  _setThrew(1, 0);
 }
}

function invoke_iiiiiiiiiiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13) {
 var sp = stackSave();
 try {
  return getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0) throw e;
  _setThrew(1, 0);
 }
}

function invoke_iiidi(index, a1, a2, a3, a4) {
 var sp = stackSave();
 try {
  return getWasmTableEntry(index)(a1, a2, a3, a4);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0) throw e;
  _setThrew(1, 0);
 }
}

function invoke_viiiiid(index, a1, a2, a3, a4, a5, a6) {
 var sp = stackSave();
 try {
  getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0) throw e;
  _setThrew(1, 0);
 }
}

function invoke_viiiiiii(index, a1, a2, a3, a4, a5, a6, a7) {
 var sp = stackSave();
 try {
  getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0) throw e;
  _setThrew(1, 0);
 }
}

function invoke_vid(index, a1, a2) {
 var sp = stackSave();
 try {
  getWasmTableEntry(index)(a1, a2);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0) throw e;
  _setThrew(1, 0);
 }
}

function invoke_iiiiiii(index, a1, a2, a3, a4, a5, a6) {
 var sp = stackSave();
 try {
  return getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0) throw e;
  _setThrew(1, 0);
 }
}

function invoke_diiiiii(index, a1, a2, a3, a4, a5, a6) {
 var sp = stackSave();
 try {
  return getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0) throw e;
  _setThrew(1, 0);
 }
}

function invoke_iiiiidd(index, a1, a2, a3, a4, a5, a6) {
 var sp = stackSave();
 try {
  return getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0) throw e;
  _setThrew(1, 0);
 }
}

function invoke_di(index, a1) {
 var sp = stackSave();
 try {
  return getWasmTableEntry(index)(a1);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0) throw e;
  _setThrew(1, 0);
 }
}

function invoke_fi(index, a1) {
 var sp = stackSave();
 try {
  return getWasmTableEntry(index)(a1);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0) throw e;
  _setThrew(1, 0);
 }
}

function invoke_iidd(index, a1, a2, a3) {
 var sp = stackSave();
 try {
  return getWasmTableEntry(index)(a1, a2, a3);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0) throw e;
  _setThrew(1, 0);
 }
}

function invoke_dddddd(index, a1, a2, a3, a4, a5) {
 var sp = stackSave();
 try {
  return getWasmTableEntry(index)(a1, a2, a3, a4, a5);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0) throw e;
  _setThrew(1, 0);
 }
}

function invoke_diddd(index, a1, a2, a3, a4) {
 var sp = stackSave();
 try {
  return getWasmTableEntry(index)(a1, a2, a3, a4);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0) throw e;
  _setThrew(1, 0);
 }
}

function invoke_viiiiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8) {
 var sp = stackSave();
 try {
  getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7, a8);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0) throw e;
  _setThrew(1, 0);
 }
}

function invoke_iiiiiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8) {
 var sp = stackSave();
 try {
  return getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7, a8);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0) throw e;
  _setThrew(1, 0);
 }
}

function invoke_i(index) {
 var sp = stackSave();
 try {
  return getWasmTableEntry(index)();
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0) throw e;
  _setThrew(1, 0);
 }
}

function invoke_iiddd(index, a1, a2, a3, a4) {
 var sp = stackSave();
 try {
  return getWasmTableEntry(index)(a1, a2, a3, a4);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0) throw e;
  _setThrew(1, 0);
 }
}

function invoke_viiiiiiiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11) {
 var sp = stackSave();
 try {
  getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0) throw e;
  _setThrew(1, 0);
 }
}

function invoke_diiii(index, a1, a2, a3, a4) {
 var sp = stackSave();
 try {
  return getWasmTableEntry(index)(a1, a2, a3, a4);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0) throw e;
  _setThrew(1, 0);
 }
}

function invoke_viidi(index, a1, a2, a3, a4) {
 var sp = stackSave();
 try {
  getWasmTableEntry(index)(a1, a2, a3, a4);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0) throw e;
  _setThrew(1, 0);
 }
}

function invoke_dd(index, a1) {
 var sp = stackSave();
 try {
  return getWasmTableEntry(index)(a1);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0) throw e;
  _setThrew(1, 0);
 }
}

function invoke_diddddd(index, a1, a2, a3, a4, a5, a6) {
 var sp = stackSave();
 try {
  return getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0) throw e;
  _setThrew(1, 0);
 }
}

function invoke_viffffffiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10) {
 var sp = stackSave();
 try {
  getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7, a8, a9, a10);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0) throw e;
  _setThrew(1, 0);
 }
}

function invoke_iifff(index, a1, a2, a3, a4) {
 var sp = stackSave();
 try {
  return getWasmTableEntry(index)(a1, a2, a3, a4);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0) throw e;
  _setThrew(1, 0);
 }
}

function invoke_iifif(index, a1, a2, a3, a4) {
 var sp = stackSave();
 try {
  return getWasmTableEntry(index)(a1, a2, a3, a4);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0) throw e;
  _setThrew(1, 0);
 }
}

function invoke_vifii(index, a1, a2, a3, a4) {
 var sp = stackSave();
 try {
  getWasmTableEntry(index)(a1, a2, a3, a4);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0) throw e;
  _setThrew(1, 0);
 }
}

function invoke_viffffi(index, a1, a2, a3, a4, a5, a6) {
 var sp = stackSave();
 try {
  getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0) throw e;
  _setThrew(1, 0);
 }
}

function invoke_viffffffi(index, a1, a2, a3, a4, a5, a6, a7, a8) {
 var sp = stackSave();
 try {
  getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7, a8);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0) throw e;
  _setThrew(1, 0);
 }
}

function invoke_viffi(index, a1, a2, a3, a4) {
 var sp = stackSave();
 try {
  getWasmTableEntry(index)(a1, a2, a3, a4);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0) throw e;
  _setThrew(1, 0);
 }
}

function invoke_vifi(index, a1, a2, a3) {
 var sp = stackSave();
 try {
  getWasmTableEntry(index)(a1, a2, a3);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0) throw e;
  _setThrew(1, 0);
 }
}

function invoke_ffff(index, a1, a2, a3) {
 var sp = stackSave();
 try {
  return getWasmTableEntry(index)(a1, a2, a3);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0) throw e;
  _setThrew(1, 0);
 }
}

function invoke_vif(index, a1, a2) {
 var sp = stackSave();
 try {
  getWasmTableEntry(index)(a1, a2);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0) throw e;
  _setThrew(1, 0);
 }
}

function invoke_fii(index, a1, a2) {
 var sp = stackSave();
 try {
  return getWasmTableEntry(index)(a1, a2);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0) throw e;
  _setThrew(1, 0);
 }
}

function invoke_jii(index, a1, a2) {
 var sp = stackSave();
 try {
  return dynCall_jii(index, a1, a2);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0) throw e;
  _setThrew(1, 0);
 }
}

function invoke_viiji(index, a1, a2, a3, a4, a5) {
 var sp = stackSave();
 try {
  dynCall_viiji(index, a1, a2, a3, a4, a5);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0) throw e;
  _setThrew(1, 0);
 }
}

function invoke_ji(index, a1) {
 var sp = stackSave();
 try {
  return dynCall_ji(index, a1);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0) throw e;
  _setThrew(1, 0);
 }
}

function invoke_jjj(index, a1, a2, a3, a4) {
 var sp = stackSave();
 try {
  return dynCall_jjj(index, a1, a2, a3, a4);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0) throw e;
  _setThrew(1, 0);
 }
}

function invoke_jiii(index, a1, a2, a3) {
 var sp = stackSave();
 try {
  return dynCall_jiii(index, a1, a2, a3);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0) throw e;
  _setThrew(1, 0);
 }
}

function invoke_iij(index, a1, a2, a3) {
 var sp = stackSave();
 try {
  return dynCall_iij(index, a1, a2, a3);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0) throw e;
  _setThrew(1, 0);
 }
}

function invoke_iiiiij(index, a1, a2, a3, a4, a5, a6) {
 var sp = stackSave();
 try {
  return dynCall_iiiiij(index, a1, a2, a3, a4, a5, a6);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0) throw e;
  _setThrew(1, 0);
 }
}

function invoke_iiiiji(index, a1, a2, a3, a4, a5, a6) {
 var sp = stackSave();
 try {
  return dynCall_iiiiji(index, a1, a2, a3, a4, a5, a6);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0) throw e;
  _setThrew(1, 0);
 }
}

function invoke_viiiji(index, a1, a2, a3, a4, a5, a6) {
 var sp = stackSave();
 try {
  dynCall_viiiji(index, a1, a2, a3, a4, a5, a6);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0) throw e;
  _setThrew(1, 0);
 }
}

function invoke_jj(index, a1, a2) {
 var sp = stackSave();
 try {
  return dynCall_jj(index, a1, a2);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0) throw e;
  _setThrew(1, 0);
 }
}

function invoke_vij(index, a1, a2, a3) {
 var sp = stackSave();
 try {
  dynCall_vij(index, a1, a2, a3);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0) throw e;
  _setThrew(1, 0);
 }
}

function invoke_iijj(index, a1, a2, a3, a4, a5) {
 var sp = stackSave();
 try {
  return dynCall_iijj(index, a1, a2, a3, a4, a5);
 } catch (e) {
  stackRestore(sp);
  if (e !== e + 0) throw e;
  _setThrew(1, 0);
 }
}

var unexportedRuntimeSymbols = [ "run", "UTF8ArrayToString", "UTF8ToString", "stringToUTF8Array", "stringToUTF8", "lengthBytesUTF8", "addOnPreRun", "addOnInit", "addOnPreMain", "addOnExit", "addOnPostRun", "addRunDependency", "removeRunDependency", "FS_createFolder", "FS_createPath", "FS_createDataFile", "FS_createPreloadedFile", "FS_createLazyFile", "FS_createLink", "FS_createDevice", "FS_unlink", "getLEB", "getFunctionTables", "alignFunctionTables", "registerFunctions", "prettyPrint", "getCompilerSetting", "print", "printErr", "callMain", "abort", "keepRuntimeAlive", "wasmMemory", "stackAlloc", "stackSave", "stackRestore", "getTempRet0", "setTempRet0", "writeStackCookie", "checkStackCookie", "ptrToString", "zeroMemory", "stringToNewUTF8", "exitJS", "getHeapMax", "abortOnCannotGrowMemory", "emscripten_realloc_buffer", "ENV", "ERRNO_CODES", "ERRNO_MESSAGES", "setErrNo", "inetPton4", "inetNtop4", "inetPton6", "inetNtop6", "readSockaddr", "writeSockaddr", "DNS", "getHostByName", "Protocols", "Sockets", "getRandomDevice", "warnOnce", "traverseStack", "UNWIND_CACHE", "convertPCtoSourceLocation", "readAsmConstArgsArray", "readAsmConstArgs", "mainThreadEM_ASM", "jstoi_q", "jstoi_s", "getExecutableName", "listenOnce", "autoResumeAudioContext", "dynCallLegacy", "getDynCaller", "dynCall", "handleException", "runtimeKeepalivePush", "runtimeKeepalivePop", "callUserCallback", "maybeExit", "safeSetTimeout", "asmjsMangle", "asyncLoad", "alignMemory", "mmapAlloc", "writeI53ToI64", "writeI53ToI64Clamped", "writeI53ToI64Signaling", "writeI53ToU64Clamped", "writeI53ToU64Signaling", "readI53FromI64", "readI53FromU64", "convertI32PairToI53", "convertI32PairToI53Checked", "convertU32PairToI53", "getCFunc", "ccall", "cwrap", "uleb128Encode", "sigToWasmTypes", "generateFuncType", "convertJsFunctionToWasm", "freeTableIndexes", "functionsInTableMap", "getEmptyTableSlot", "updateTableMap", "addFunction", "removeFunction", "reallyNegative", "unSign", "strLen", "reSign", "formatString", "setValue", "getValue", "PATH", "PATH_FS", "intArrayFromString", "intArrayToString", "AsciiToString", "stringToAscii", "UTF16Decoder", "UTF16ToString", "stringToUTF16", "lengthBytesUTF16", "UTF32ToString", "stringToUTF32", "lengthBytesUTF32", "allocateUTF8", "allocateUTF8OnStack", "writeStringToMemory", "writeArrayToMemory", "writeAsciiToMemory", "SYSCALLS", "getSocketFromFD", "getSocketAddress", "JSEvents", "registerKeyEventCallback", "specialHTMLTargets", "maybeCStringToJsString", "findEventTarget", "findCanvasEventTarget", "getBoundingClientRect", "fillMouseEventData", "registerMouseEventCallback", "registerWheelEventCallback", "registerUiEventCallback", "registerFocusEventCallback", "fillDeviceOrientationEventData", "registerDeviceOrientationEventCallback", "fillDeviceMotionEventData", "registerDeviceMotionEventCallback", "screenOrientation", "fillOrientationChangeEventData", "registerOrientationChangeEventCallback", "fillFullscreenChangeEventData", "registerFullscreenChangeEventCallback", "JSEvents_requestFullscreen", "JSEvents_resizeCanvasForFullscreen", "registerRestoreOldStyle", "hideEverythingExceptGivenElement", "restoreHiddenElements", "setLetterbox", "currentFullscreenStrategy", "restoreOldWindowedStyle", "softFullscreenResizeWebGLRenderTarget", "doRequestFullscreen", "fillPointerlockChangeEventData", "registerPointerlockChangeEventCallback", "registerPointerlockErrorEventCallback", "requestPointerLock", "fillVisibilityChangeEventData", "registerVisibilityChangeEventCallback", "registerTouchEventCallback", "fillGamepadEventData", "registerGamepadEventCallback", "registerBeforeUnloadEventCallback", "fillBatteryEventData", "battery", "registerBatteryEventCallback", "setCanvasElementSize", "getCanvasElementSize", "demangle", "demangleAll", "jsStackTrace", "stackTrace", "ExitStatus", "getEnvStrings", "checkWasiClock", "flush_NO_FILESYSTEM", "dlopenMissingError", "createDyncallWrapper", "setImmediateWrapped", "clearImmediateWrapped", "polyfillSetImmediate", "uncaughtExceptionCount", "exceptionLast", "exceptionCaught", "ExceptionInfo", "exception_addRef", "exception_decRef", "getExceptionMessageCommon", "incrementExceptionRefcount", "decrementExceptionRefcount", "getExceptionMessage", "Browser", "setMainLoop", "wget", "FS", "MEMFS", "TTY", "PIPEFS", "SOCKFS", "_setNetworkCallback", "tempFixedLengthArray", "miniTempWebGLFloatBuffers", "heapObjectForWebGLType", "heapAccessShiftForWebGLHeap", "GL", "emscriptenWebGLGet", "computeUnpackAlignedImageSize", "emscriptenWebGLGetTexPixelData", "emscriptenWebGLGetUniform", "webglGetUniformLocation", "webglPrepareUniformLocationsBeforeFirstUse", "webglGetLeftBracePos", "emscriptenWebGLGetVertexAttrib", "writeGLArray", "AL", "SDL_unicode", "SDL_ttfContext", "SDL_audio", "SDL", "SDL_gfx", "GLUT", "EGL", "GLFW_Window", "GLFW", "GLEW", "IDBStore", "runAndAbortIfError", "ALLOC_NORMAL", "ALLOC_STACK", "allocate", "EmscriptenTrace" ];

unexportedRuntimeSymbols.forEach(unexportedRuntimeSymbol);

var missingLibrarySymbols = [ "ptrToString", "zeroMemory", "stringToNewUTF8", "exitJS", "emscripten_realloc_buffer", "setErrNo", "inetPton4", "inetNtop4", "inetPton6", "inetNtop6", "readSockaddr", "writeSockaddr", "getHostByName", "getRandomDevice", "traverseStack", "convertPCtoSourceLocation", "readAsmConstArgs", "mainThreadEM_ASM", "jstoi_q", "jstoi_s", "getExecutableName", "listenOnce", "autoResumeAudioContext", "dynCallLegacy", "getDynCaller", "dynCall", "handleException", "runtimeKeepalivePush", "runtimeKeepalivePop", "callUserCallback", "maybeExit", "safeSetTimeout", "asmjsMangle", "asyncLoad", "alignMemory", "mmapAlloc", "writeI53ToI64", "writeI53ToI64Clamped", "writeI53ToI64Signaling", "writeI53ToU64Clamped", "writeI53ToU64Signaling", "readI53FromI64", "readI53FromU64", "convertI32PairToI53", "convertU32PairToI53", "getCFunc", "ccall", "cwrap", "uleb128Encode", "sigToWasmTypes", "generateFuncType", "convertJsFunctionToWasm", "getEmptyTableSlot", "updateTableMap", "addFunction", "removeFunction", "reallyNegative", "strLen", "reSign", "formatString", "intArrayFromString", "intArrayToString", "AsciiToString", "stringToAscii", "UTF16ToString", "stringToUTF16", "lengthBytesUTF16", "UTF32ToString", "stringToUTF32", "lengthBytesUTF32", "allocateUTF8", "allocateUTF8OnStack", "writeStringToMemory", "writeArrayToMemory", "writeAsciiToMemory", "getSocketFromFD", "getSocketAddress", "registerKeyEventCallback", "maybeCStringToJsString", "findEventTarget", "findCanvasEventTarget", "getBoundingClientRect", "fillMouseEventData", "registerMouseEventCallback", "registerWheelEventCallback", "registerUiEventCallback", "registerFocusEventCallback", "fillDeviceOrientationEventData", "registerDeviceOrientationEventCallback", "fillDeviceMotionEventData", "registerDeviceMotionEventCallback", "screenOrientation", "fillOrientationChangeEventData", "registerOrientationChangeEventCallback", "fillFullscreenChangeEventData", "registerFullscreenChangeEventCallback", "JSEvents_requestFullscreen", "JSEvents_resizeCanvasForFullscreen", "registerRestoreOldStyle", "hideEverythingExceptGivenElement", "restoreHiddenElements", "setLetterbox", "softFullscreenResizeWebGLRenderTarget", "doRequestFullscreen", "fillPointerlockChangeEventData", "registerPointerlockChangeEventCallback", "registerPointerlockErrorEventCallback", "requestPointerLock", "fillVisibilityChangeEventData", "registerVisibilityChangeEventCallback", "registerTouchEventCallback", "fillGamepadEventData", "registerGamepadEventCallback", "registerBeforeUnloadEventCallback", "fillBatteryEventData", "battery", "registerBatteryEventCallback", "setCanvasElementSize", "getCanvasElementSize", "getEnvStrings", "checkWasiClock", "createDyncallWrapper", "setImmediateWrapped", "clearImmediateWrapped", "polyfillSetImmediate", "getExceptionMessageCommon", "incrementExceptionRefcount", "decrementExceptionRefcount", "getExceptionMessage", "setMainLoop", "_setNetworkCallback", "heapObjectForWebGLType", "heapAccessShiftForWebGLHeap", "emscriptenWebGLGet", "computeUnpackAlignedImageSize", "emscriptenWebGLGetTexPixelData", "emscriptenWebGLGetUniform", "webglGetUniformLocation", "webglPrepareUniformLocationsBeforeFirstUse", "webglGetLeftBracePos", "emscriptenWebGLGetVertexAttrib", "writeGLArray", "SDL_unicode", "SDL_ttfContext", "SDL_audio", "GLFW_Window", "runAndAbortIfError", "ALLOC_NORMAL", "ALLOC_STACK", "allocate" ];

missingLibrarySymbols.forEach(missingLibrarySymbol);

var calledRun;

dependenciesFulfilled = function runCaller() {
 if (!calledRun) run();
 if (!calledRun) dependenciesFulfilled = runCaller;
};

function stackCheckInit() {
 _emscripten_stack_init();
 writeStackCookie();
}

function run(args) {
 args = args || arguments_;
 if (runDependencies > 0) {
  return;
 }
 stackCheckInit();
 preRun();
 if (runDependencies > 0) {
  return;
 }
 function doRun() {
  if (calledRun) return;
  calledRun = true;
  Module["calledRun"] = true;
  if (ABORT) return;
  initRuntime();
  readyPromiseResolve(Module);
  if (Module["onRuntimeInitialized"]) Module["onRuntimeInitialized"]();
  assert(!Module["_main"], 'compiled without a main, but one is present. if you added it from JS, use Module["onRuntimeInitialized"]');
  postRun();
 }
 if (Module["setStatus"]) {
  Module["setStatus"]("Running...");
  setTimeout(function() {
   setTimeout(function() {
    Module["setStatus"]("");
   }, 1);
   doRun();
  }, 1);
 } else {
  doRun();
 }
 checkStackCookie();
}

function checkUnflushedContent() {
 var oldOut = out;
 var oldErr = err;
 var has = false;
 out = err = x => {
  has = true;
 };
 try {
  flush_NO_FILESYSTEM();
 } catch (e) {}
 out = oldOut;
 err = oldErr;
 if (has) {
  warnOnce("stdio streams had content in them that was not flushed. you should set EXIT_RUNTIME to 1 (see the FAQ), or make sure to emit a newline when you printf etc.");
  warnOnce("(this may also be due to not including full filesystem support - try building with -sFORCE_FILESYSTEM)");
 }
}

if (Module["preInit"]) {
 if (typeof Module["preInit"] == "function") Module["preInit"] = [ Module["preInit"] ];
 while (Module["preInit"].length > 0) {
  Module["preInit"].pop()();
 }
}

run();


  return Module.ready
}
);
})();
export default Module;