/* eslint-disable @typescript-eslint/no-non-null-assertion */
import {
    CompiledShader,
    compileShader,
    create3DContextWithWrapperThatThrowsOnGLError,
} from "../utils/render-utils"

import generalVert from "../shaders/general.vert"
import generalFrag from "../shaders/general.frag"

import objectsVert from "../shaders/objects.vert"
import objectsFrag from "../shaders/objects.frag"

import skinningVert from "../shaders/skinning.vert"
import skinningFrag from "../shaders/skinning.frag"

import { mat4, vec3 } from "gl-matrix"
import { calculateSkinningMatrices } from "./animation-processor"
import { Skin } from "../models/skin"
import { Model } from "../models/model"
import { Animation } from "../models/animation"
import { Entity } from "../entities/entity"
import { TransformComponent, TransformData } from "../components/transformComponent"
import { ModelComponent } from "../components/modelComponent"
import { TextureComponent } from "../components/textureComponent"

const ANIMATION_TEXTURE_SIZE = 1024

const UP = vec3.fromValues(0, 0, 1)

export type AttributeDef = {
    name: string
    size: number
}

export class Render {
    public readonly gl: WebGLRenderingContext

    private readonly generalShader: CompiledShader
    private readonly objectsShader: CompiledShader
    private readonly skinningShader: CompiledShader

    private readonly matrices: WebGLTexture
    private readonly matricesBuffer: Float32Array

    private readonly viewMatrix: mat4
    private readonly projectionMatrix: mat4

    private readonly models: Set<Entity>
    private readonly skins: Set<Entity>

    constructor(private readonly canvas: HTMLCanvasElement) {
        this.models = new Set()
        this.skins = new Set()

        this.gl = this.canvas.getContext("webgl", {
            antialias: true,
            powerPreference: "high-performance",
        })!
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
        this.viewMatrix = mat4.create()

        this.generalShader = compileShader(gl, generalVert, generalFrag, ["p", "n", "mvp"])
        this.objectsShader = compileShader(gl, objectsVert, objectsFrag, [
            "p",
            "n",
            "uv",
            "mvp",
            "texture",
        ])
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

        gl.disable(gl.CULL_FACE)
        gl.enable(gl.DEPTH_TEST)
    }

    private handleResize() {
        const { canvas, gl } = this

        const dpr = 1

        const newWidth = Math.floor(document.body.clientWidth * dpr)
        const newHeight = Math.floor(document.body.clientHeight * dpr)

        if (canvas.width === newWidth && canvas.height === newHeight) {
            return
        }

        canvas.style.width = newWidth / dpr + "px"
        canvas.style.height = newHeight / dpr + "px"

        canvas.width = newWidth
        canvas.height = newHeight

        gl.viewport(0, 0, canvas.width, canvas.height)

        mat4.perspective(
            this.projectionMatrix,
            (45 * Math.PI) / 180,
            canvas.width / canvas.height,
            0.1,
            100
        )
    }

    private defineVertexBuffer(
        gl: WebGLRenderingContext,
        shader: CompiledShader,
        attributes: AttributeDef[],
        stride: number
    ): void {
        let offset = 0
        for (const attr of attributes) {
            const attrNum = shader[attr.name] as number
            if (attrNum !== undefined) {
                gl.vertexAttribPointer(
                    attrNum,
                    attr.size,
                    gl.FLOAT,
                    false,
                    stride * Float32Array.BYTES_PER_ELEMENT,
                    offset * Float32Array.BYTES_PER_ELEMENT
                )
                gl.enableVertexAttribArray(attrNum)
            }

            offset += attr.size
        }
    }

    setCamera(pos: vec3, lookAt: vec3): void {
        mat4.lookAt(this.viewMatrix, pos, lookAt, UP)
    }

    private drawModel(model: Model, tex: WebGLTexture, transform: TransformData) {
        const { gl, objectsShader } = this

        gl.bindBuffer(gl.ARRAY_BUFFER, model.vertices)
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, model.indices)

        this.defineVertexBuffer(gl, objectsShader, Model.ATTRIBUTES, Model.STRIDE)

        gl.useProgram(objectsShader.program)

        const modelMatrix = mat4.create()
        mat4.fromRotationTranslationScale(
            modelMatrix,
            transform.rotation,
            transform.pos,
            transform.size
        )

        const mvp = mat4.create()
        mat4.multiply(mvp, mvp, this.projectionMatrix)
        mat4.multiply(mvp, mvp, this.viewMatrix)
        mat4.multiply(mvp, mvp, modelMatrix)

        gl.activeTexture(gl.TEXTURE0)
        gl.bindTexture(gl.TEXTURE_2D, tex)

        gl.uniformMatrix4fv(objectsShader.mvp, false, mvp)
        gl.uniform1i(objectsShader.texture, 0)

        gl.drawElements(gl.TRIANGLES, model.indexCount, gl.UNSIGNED_SHORT, 0)
    }

    private drawSkin(
        skin: Skin,
        tex: WebGLTexture,
        animation: Animation,
        s: number,
        position: vec3
    ) {
        const { gl, skinningShader } = this

        gl.bindBuffer(gl.ARRAY_BUFFER, skin.vertices)
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, skin.indices)

        this.defineVertexBuffer(gl, skinningShader, Skin.ATTRIBUTES, Skin.STRIDE)

        gl.useProgram(skinningShader.program)

        const mvp = mat4.create()
        mat4.multiply(mvp, mvp, this.projectionMatrix)
        mat4.multiply(mvp, mvp, this.viewMatrix)
        mat4.translate(mvp, mvp, position)

        gl.activeTexture(gl.TEXTURE0)
        gl.bindTexture(gl.TEXTURE_2D, tex)

        gl.activeTexture(gl.TEXTURE1)
        gl.bindTexture(gl.TEXTURE_2D, this.matrices)

        const matricesData = calculateSkinningMatrices(
            skin,
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

        gl.drawElements(gl.TRIANGLES, skin.indexCount, gl.UNSIGNED_SHORT, 0)
    }

    add(entity: Entity): void {
        const transform = entity.get(TransformComponent)
        const model = entity.get(ModelComponent)
        const texture = entity.get(TextureComponent)

        if (transform && model && texture) {
            this.models.add(entity)
        }
    }

    draw(): void {
        const { gl } = this

        this.handleResize()

        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

        for (const entity of this.models) {
            const transform = entity.get(TransformComponent)!
            const model = entity.get(ModelComponent)!
            const texture = entity.get(TextureComponent)!

            model.modelDef.update(transform.transform)

            const modelEntities = model.modelDef.getEntries()

            for (const modelEntry of modelEntities) {
                this.drawModel(modelEntry.model, texture.texture!, modelEntry.transform)
            }
        }
    }
}
