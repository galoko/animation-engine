import { vec3 } from "gl-matrix"
import {
    Model,
    Animation,
    loadModelFromURL,
    loadAnimationFromURL,
    loadTexture,
} from "./model-loader"
import { Render } from "./render"

let render: Render
let model: Model
let model2: Model
let tex: WebGLTexture
let tex2: WebGLTexture
let animation: Animation

async function main() {
    render = new Render()
    model = await loadModelFromURL(render.gl, "/chel.bin")
    tex = await loadTexture(render.gl, "/chel.png")
    model2 = await loadModelFromURL(render.gl, "/man.bin")
    tex2 = await loadTexture(render.gl, "/man.png")
    animation = await loadAnimationFromURL("/run.bin")

    requestAnimationFrame(tick)
}

function tick(time) {
    render.beginRender()
    render.drawModel(model, tex, animation, time / 10000, vec3.fromValues(1, 0, 0))
    render.drawModel(model2, tex2, animation, time / 10000, vec3.fromValues(-1, 0, 0))

    requestAnimationFrame(tick)
}

main()
