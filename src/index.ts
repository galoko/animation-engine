import { Model, Animation, loadModelFromURL, loadAnimationFromURL } from "./model-loader"
import { Render } from "./render"

let render: Render
let model: Model
let animation: Animation

async function main() {
    render = new Render()
    model = await loadModelFromURL(render.gl, "/man.bin")
    animation = await loadAnimationFromURL("/run.bin")

    requestAnimationFrame(tick)
}

function tick() {
    render.beginRender()
    render.drawModel(model)

    requestAnimationFrame(tick)
}

main()
