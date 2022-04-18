// rollup.config.js
import serve from "rollup-plugin-serve"
import livereload from "rollup-plugin-livereload"
import typescript from "@rollup/plugin-typescript"
import commonjs from "@rollup/plugin-commonjs"
import nodeResolve from "rollup-plugin-node-resolve"
import { string } from "rollup-plugin-string"

export default {
    input: "src/index.ts",
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
        commonjs({ include: ["node_modules/**"] }),
        serve("."),
        livereload("build"),
    ],
}
