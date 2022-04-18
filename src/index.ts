import { vec3 } from "gl-matrix"
import {
    Skin,
    Animation,
    loadSkinFromURL,
    loadAnimationFromURL,
    loadTexture,
    Model,
    loadModelFromURL,
} from "./loaders"
import { Render } from "./render"

let render: Render
let skin1: Skin
let skin2: Skin
let tex1: WebGLTexture
let tex2: WebGLTexture
let blank: WebGLTexture
let animation: Animation
let halfSphere: Model
let cylinder: Model
let capsule: Model

async function main() {
    render = new Render()
    skin1 = await loadSkinFromURL(render.gl, "build/chel.bin")
    tex1 = await loadTexture(render.gl, "build/chel.png")
    skin2 = await loadSkinFromURL(render.gl, "build/man.bin")
    tex2 = await loadTexture(render.gl, "build/man.png")
    animation = await loadAnimationFromURL("build/run.bin")

    blank = await loadTexture(render.gl, "build/blank.png")
    halfSphere = await loadModelFromURL(render.gl, "build/half_sphere.mdl")
    cylinder = await loadModelFromURL(render.gl, "build/cylinder.mdl")
    capsule = await loadModelFromURL(render.gl, "build/capsule.mdl")

    requestAnimationFrame(tick)
}

let a = 0

document.body.onmousemove = e => (a = (e.clientX / document.body.clientWidth) * 3.14)

function tick(time) {
    render.setCamera(
        vec3.fromValues(0, 0, 1),
        vec3.fromValues(Math.cos(a) * 5, Math.sin(a) * -5, 1)
    )

    const t = time / 10000

    render.beginRender()
    render.drawSkin(skin1, tex1, animation, t, vec3.fromValues(1, 0, 0))
    render.drawSkin(skin2, tex2, animation, t, vec3.fromValues(-1, 0, 0))

    render.drawModel(halfSphere, blank, vec3.fromValues(0, -1, 0))
    render.drawModel(cylinder, blank, vec3.fromValues(0, -1, -0.5))
    render.drawModel(capsule, blank, vec3.fromValues(0, 0, -0.5))

    requestAnimationFrame(tick)
}

main()
