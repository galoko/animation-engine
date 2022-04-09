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
import { defineModelVertexBuffer, Model } from "./model-loader"
import { mat4, vec3 } from "gl-matrix"

export class Render {
    private readonly canvas: HTMLCanvasElement
    public readonly gl: WebGLRenderingContext

    private generalShader: CompiledShader

    private readonly projectionMatrix: mat4

    constructor() {
        this.canvas = document.createElement("canvas")

        document.addEventListener("resize", this.handleResize.bind(this))
        document.body.appendChild(this.canvas)

        this.gl = create3DContextWithWrapperThatThrowsOnGLError(this.canvas.getContext("webgl"))

        this.projectionMatrix = mat4.create()
        this.generalShader = compileShader(this.gl, generalVert, generalFrag, ["p", "n", "mvp"])

        this.gl.clearColor(0.0, 0.0, 0.0, 1.0)

        this.handleResize()
    }

    handleResize() {
        const { canvas } = this

        canvas.style.width = document.body.clientWidth + "px"
        canvas.style.height = document.body.clientHeight + "px"

        canvas.width = document.body.clientWidth * devicePixelRatio
        canvas.height = document.body.clientHeight * devicePixelRatio

        this.gl.viewport(0, 0, canvas.width, canvas.height)

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

    drawModel(model: Model) {
        const { gl, generalShader } = this

        gl.bindBuffer(gl.ARRAY_BUFFER, model.vertices)
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, model.indices)

        defineModelVertexBuffer(gl, generalShader)

        gl.useProgram(generalShader.program)

        const viewMatrix = mat4.create()
        mat4.lookAt(
            viewMatrix,
            vec3.fromValues(3, -3, 3),
            vec3.fromValues(0, 0, 1),
            vec3.fromValues(0, 0, 1)
        )

        const mvp = mat4.create()
        mat4.multiply(mvp, this.projectionMatrix, viewMatrix)

        gl.uniformMatrix4fv(generalShader.mvp, false, mvp)

        gl.drawElements(gl.TRIANGLES, model.indexCount, gl.UNSIGNED_SHORT, 0)
    }
}
