// rollup.config.js
import serve from "rollup-plugin-serve"
import livereload from "rollup-plugin-livereload"
import typescript from "@rollup/plugin-typescript"
import commonjs from "@rollup/plugin-commonjs"
import nodeResolve from "rollup-plugin-node-resolve"
import { string } from "rollup-plugin-string"
import arraybuffer from "@wemap/rollup-plugin-arraybuffer"
import copy from "rollup-plugin-copy"
import * as insert from "rollup-plugin-insert"

export default {
    input: "src/ts/browser-main.ts",
    output: {
        file: "build/index.js",
        useStrict: false,
        format: "cjs",
        sourcemap: "true",
    },
    plugins: [
        typescript({
            sourceMap: true,
            inlineSources: true,
        }),
        string({
            // Required to be specified
            include: ["**/*.frag", "**/*.vert"],
        }),
        nodeResolve({
            jsnext: true,
            main: true,
        }),
        commonjs({
            include: ["node_modules/**"],
        }),
        arraybuffer({ include: "**/*.wasm" }),
        copy({
            targets: [
                { src: "src/wasm/engine.js", dest: "build/wasm" },
                { src: "src/wasm/engine.ww.js", dest: "build/wasm" },
            ],
        }),
        serve({
            contentBase: ".",
            headers: {
                "Cross-Origin-Opener-Policy": "same-origin",
                "Cross-Origin-Embedder-Policy": "require-corp",
            },
        }),
        livereload({ watch: "build", delay: 2000 }),
    ],
}
