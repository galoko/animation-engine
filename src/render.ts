import {
    CompiledShader,
    compileShader,
    create3DContextWithWrapperThatThrowsOnGLError,
} from "./render-utils"
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import generalVert from "./shaders/general.vert"
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import generalFrag from "./shaders/general.frag"
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import skinningVert from "./shaders/skinning.vert"
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import skinningFrag from "./shaders/skinning.frag"
import { defineModelVertexBuffer, Model, Animation } from "./model-loader"
import { mat4, vec3 } from "gl-matrix"
import { calculateSkinningMatrices } from "./animation-processor"

const ANIMATION_TEXTURE_SIZE = 1024

export class Render {
    private readonly canvas: HTMLCanvasElement
    public readonly gl: WebGLRenderingContext

    private readonly generalShader: CompiledShader
    private readonly skinningShader: CompiledShader

    private readonly matrices: WebGLTexture
    private readonly matricesBuffer: Float32Array

    private readonly projectionMatrix: mat4

    constructor() {
        this.canvas = document.createElement("canvas")

        document.addEventListener("resize", this.handleResize.bind(this))
        document.body.appendChild(this.canvas)

        this.gl = create3DContextWithWrapperThatThrowsOnGLError(
            this.canvas.getContext("webgl", {
                antialias: true,
                powerPreference: "high-performance",
            })!
        )
        this.matrices = this.gl.createTexture()!
        this.matricesBuffer = new Float32Array(ANIMATION_TEXTURE_SIZE * 1 * 4)

        const { gl, matrices } = this
        gl.getExtension("OES_texture_float")

        gl.bindTexture(gl.TEXTURE_2D, matrices)
        gl.texImage2D(
            gl.TEXTURE_2D,
            0,
            gl.RGBA,
            ANIMATION_TEXTURE_SIZE,
            1,
            0,
            gl.RGBA,
            gl.FLOAT,
            null
        )
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)

        this.projectionMatrix = mat4.create()
        this.generalShader = compileShader(gl, generalVert, generalFrag, ["p", "n", "mvp"])
        this.skinningShader = compileShader(gl, skinningVert, skinningFrag, [
            "p",
            "n",
            "uv",
            "w",
            "j",
            "mvp",
            "matrices",
            "texture",
        ])

        gl.clearColor(0.0, 0.0, 0.0, 1.0)

        this.handleResize()
    }

    handleResize() {
        const { canvas, gl } = this

        canvas.style.width = document.body.clientWidth + "px"
        canvas.style.height = document.body.clientHeight + "px"

        canvas.width = document.body.clientWidth * 1
        canvas.height = document.body.clientHeight * 1

        gl.viewport(0, 0, canvas.width, canvas.height)

        mat4.perspective(
            this.projectionMatrix,
            (45 * Math.PI) / 180,
            canvas.width / canvas.height,
            0.1,
            100
        )
    }

    beginRender() {
        const { gl } = this

        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
        gl.disable(gl.CULL_FACE)
        gl.enable(gl.DEPTH_TEST)
    }

    drawModel(model: Model, tex: WebGLTexture, animation: Animation, s: number, position: vec3) {
        const { gl, skinningShader } = this

        gl.bindBuffer(gl.ARRAY_BUFFER, model.vertices)
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, model.indices)

        defineModelVertexBuffer(gl, skinningShader)

        gl.useProgram(skinningShader.program)

        const viewMatrix = mat4.create()
        mat4.lookAt(
            viewMatrix,
            vec3.fromValues(3, -3, 1),
            vec3.fromValues(0, 0, 1),
            vec3.fromValues(0, 0, 1)
        )

        const mvp = mat4.create()
        mat4.multiply(mvp, mvp, this.projectionMatrix)
        mat4.multiply(mvp, mvp, viewMatrix)
        mat4.translate(mvp, mvp, position)

        gl.activeTexture(gl.TEXTURE0)
        gl.bindTexture(gl.TEXTURE_2D, tex)

        gl.activeTexture(gl.TEXTURE1)
        gl.bindTexture(gl.TEXTURE_2D, this.matrices)

        const matricesData = calculateSkinningMatrices(
            model,
            animation,
            s,
            this.matricesBuffer.buffer
        )
        gl.texSubImage2D(
            gl.TEXTURE_2D,
            0,
            0,
            0,
            matricesData.length / 4,
            1,
            gl.RGBA,
            gl.FLOAT,
            matricesData
        )

        gl.uniformMatrix4fv(skinningShader.mvp, false, mvp)
        gl.uniform1i(skinningShader.texture, 0)
        gl.uniform1i(skinningShader.matrices, 1)

        gl.drawElements(gl.TRIANGLES, model.indexCount, gl.UNSIGNED_SHORT, 0)
    }
}
