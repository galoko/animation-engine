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

import coloredVert from "../shaders/colored.vert"
import coloredFrag from "../shaders/colored.frag"

import skinningVert from "../shaders/skinning.vert"
import skinningFrag from "../shaders/skinning.frag"

import { mat4, vec3, vec4 } from "gl-matrix"
import { calculateSkinningMatrices } from "./animation-processor"
import { Skin } from "../models/skin"
import { Model } from "../models/model"
import { Animation } from "../models/animation"
import { Entity } from "../entities/entity"
import { TransformComponent, TransformData } from "../components/transformComponent"
import { ModelComponent } from "../components/modelComponent"
import { TextureComponent } from "../components/textureComponent"
import { getModelOptions, ModelDefEntry, ModelOptions } from "../models/model-def"
import { DebugLine } from "../models/debug-line"

const ANIMATION_TEXTURE_SIZE = 1024

const UP = vec3.fromValues(0, 0, 1)

export type AttributeDef = {
    name: string
    size: number
}

type DebugRect = {
    start: vec3
    end: vec3
    vertical: number
    horizontal: number
    depth: number
}

type Text = {
    text: string
    pos: vec3
}

export function colorToRGBA(color: number) {
    return [((color >> 16) & 0xff) / 0xff, ((color >> 8) & 0xff) / 0xff, (color & 0xff) / 0xff]
}
export class Render {
    public readonly gl: WebGLRenderingContext
    public readonly anisotropic: EXT_texture_filter_anisotropic | null

    public readonly ctx: CanvasRenderingContext2D

    private readonly generalShader: CompiledShader
    private readonly objectsShader: CompiledShader
    private readonly coloredShader: CompiledShader
    private readonly skinningShader: CompiledShader

    private readonly matrices: WebGLTexture
    private readonly matricesBuffer: Float32Array

    private readonly viewMatrix: mat4
    private readonly projectionMatrix: mat4

    private readonly models: Set<Entity>
    private readonly skins: Set<Entity>

    private readonly debugLinesData: Float32Array
    private debugLinesDataIndex: number
    private readonly debugLineBuffer: WebGLBuffer

    private readonly persistentDebugRects: DebugRect[] = []
    private readonly texts: Text[] = []

    constructor(
        private readonly canvasWebGL: HTMLCanvasElement,
        private readonly canvas2D: HTMLCanvasElement
    ) {
        this.models = new Set()
        this.skins = new Set()

        this.gl = this.canvasWebGL.getContext("webgl", {
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
            "model",
            "texMul",
            "useTexture",
            "color",
        ])
        this.coloredShader = compileShader(gl, coloredVert, coloredFrag, [
            "p",
            "c",
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

        gl.clearColor(0.3, 0.4, 1.0, 1.0)

        gl.enable(gl.CULL_FACE)
        gl.enable(gl.DEPTH_TEST)

        gl.enable(gl.BLEND)
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)

        this.anisotropic = gl.getExtension("EXT_texture_filter_anisotropic")

        this.debugLinesData = new Float32Array(DebugLine.MAX_DEBUG_LINES * DebugLine.STRIDE)

        this.debugLineBuffer = gl.createBuffer()!
        gl.bindBuffer(gl.ARRAY_BUFFER, this.debugLineBuffer)
        gl.bufferData(gl.ARRAY_BUFFER, this.debugLinesData.byteLength, gl.DYNAMIC_DRAW)

        this.debugLinesDataIndex = 0

        this.ctx = this.canvas2D.getContext("2d")!
    }

    private handleResize() {
        const { canvasWebGL, canvas2D, gl } = this

        const dpr = devicePixelRatio

        const newWidth = Math.floor(document.body.clientWidth * dpr)
        const newHeight = Math.floor(document.body.clientHeight * dpr)

        if (canvasWebGL.width === newWidth && canvasWebGL.height === newHeight) {
            return
        }

        canvas2D.style.width = newWidth / dpr + "px"
        canvas2D.style.height = newHeight / dpr + "px"
        canvas2D.width = newWidth
        canvas2D.height = newHeight

        canvasWebGL.style.width = newWidth / dpr + "px"
        canvasWebGL.style.height = newHeight / dpr + "px"
        canvasWebGL.width = newWidth
        canvasWebGL.height = newHeight

        this.ctx.resetTransform()
        this.ctx.scale(dpr, dpr)

        gl.viewport(0, 0, canvasWebGL.width, canvasWebGL.height)

        mat4.perspective(
            this.projectionMatrix,
            (45 * Math.PI) / 180,
            canvasWebGL.width / canvasWebGL.height,
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

    private drawModel(
        model: Model,
        tex: WebGLTexture,
        options: ModelOptions,
        transform: TransformData
    ) {
        const { gl, objectsShader } = this

        gl.bindBuffer(gl.ARRAY_BUFFER, model.vertices)
        if (model.indices) {
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, model.indices)
        }

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
        gl.uniformMatrix4fv(objectsShader.model, false, modelMatrix)
        gl.uniform1i(objectsShader.texture, 0)
        gl.uniform1f(objectsShader.texMul, options.texMul)
        if (options.colorOverride) {
            gl.uniform1f(objectsShader.useTexture, 0)
            gl.uniform4fv(objectsShader.color, options.colorOverride)
        } else {
            gl.uniform1f(objectsShader.useTexture, 1)
        }

        if (model.indices && model.indexCount) {
            gl.drawElements(gl.TRIANGLES, model.indexCount, gl.UNSIGNED_SHORT, 0)
        } else {
            gl.drawArrays(gl.TRIANGLES, 0, model.vertexCount)
        }
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

    addDebugRect(
        start: vec3,
        end: vec3,
        vertical: number,
        horizontal: number,
        depth: number
    ): void {
        this.persistentDebugRects.push({
            start,
            end,
            vertical,
            horizontal,
            depth,
        })
    }

    addText(text: string, pos: vec3) {
        this.texts.push({
            text,
            pos,
        })
    }

    drawDebugRect(start: vec3, end: vec3, v: number, h: number, d: number): void {
        const points = [
            start, // 0
            vec3.fromValues(start[0], start[1], end[2]), // 1
            vec3.fromValues(start[0], end[1], start[2]), // 2
            vec3.fromValues(end[0], start[1], start[2]), // 3

            end, // 4
            vec3.fromValues(end[0], end[1], start[2]), // 5
            vec3.fromValues(end[0], start[1], end[2]), // 6
            vec3.fromValues(start[0], end[1], end[2]), // 7
        ]

        this.drawDebugLine(points[0], points[1], v, v)
        this.drawDebugLine(points[0], points[2], d, d)
        this.drawDebugLine(points[0], points[3], h, h)

        this.drawDebugLine(points[2], points[7], v, v)
        this.drawDebugLine(points[3], points[6], v, v)
        this.drawDebugLine(points[1], points[6], h, h)
        this.drawDebugLine(points[2], points[5], h, h)
        this.drawDebugLine(points[1], points[7], d, d)
        this.drawDebugLine(points[3], points[5], d, d)

        this.drawDebugLine(points[4], points[5], v, v)
        this.drawDebugLine(points[4], points[6], d, d)
        this.drawDebugLine(points[4], points[7], h, h)
    }

    drawDebugLine(start: vec3, end: vec3, color1: number, color2: number): void {
        if (this.debugLinesDataIndex + 2 > DebugLine.MAX_DEBUG_LINES) {
            throw new Error("Too many debug lines.")
        }

        const [r1, g1, b1] = colorToRGBA(color1)
        const [r2, g2, b2] = colorToRGBA(color2)

        const i = this.debugLinesDataIndex * DebugLine.STRIDE

        this.debugLinesData[i + 0] = start[0]
        this.debugLinesData[i + 1] = start[1]
        this.debugLinesData[i + 2] = start[2]
        this.debugLinesData[i + 3] = r1
        this.debugLinesData[i + 4] = g1
        this.debugLinesData[i + 5] = b1

        this.debugLinesData[i + 6] = end[0]
        this.debugLinesData[i + 7] = end[1]
        this.debugLinesData[i + 8] = end[2]
        this.debugLinesData[i + 9] = r2
        this.debugLinesData[i + 10] = g2
        this.debugLinesData[i + 11] = b2

        this.debugLinesDataIndex += 2
    }

    draw(): void {
        const { ctx, gl } = this

        this.handleResize()

        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

        const mvp = mat4.create()
        mat4.multiply(mvp, mvp, this.projectionMatrix)
        mat4.multiply(mvp, mvp, this.viewMatrix)
        const pos = vec4.create()

        const transparentModels = [] as { entity: Entity; modelEntry: ModelDefEntry }[]

        for (const entity of this.models) {
            const transform = entity.get(TransformComponent)!
            const model = entity.get(ModelComponent)!
            const texture = entity.get(TextureComponent)!

            model.modelDef.update(transform.transform)

            const modelEntities = model.modelDef.getEntries()

            // first draw all opaque objects
            for (const modelEntry of modelEntities) {
                if (modelEntry.options?.alpha !== true) {
                    this.drawModel(
                        modelEntry.model,
                        texture.texture!,
                        getModelOptions(modelEntry.options),
                        modelEntry.transform
                    )
                } else {
                    transparentModels.push({ entity, modelEntry })
                }
            }
        }

        // then sort all transparent objects by depth

        for (const entry of transparentModels) {
            const p = entry.modelEntry.transform.pos
            vec4.transformMat4(pos, vec4.fromValues(p[0], p[1], p[2], 1), mvp)
            const z = pos[2] / pos[3]

            entry.modelEntry.tempZ = z
        }

        transparentModels.sort((a, b) => b.modelEntry.tempZ! - a.modelEntry.tempZ!)

        // then draw all transparent objects from far to near
        for (const entry of transparentModels) {
            const { entity, modelEntry } = entry

            const texture = entity.get(TextureComponent)!

            this.drawModel(
                modelEntry.model,
                texture.texture!,
                getModelOptions(modelEntry.options),
                modelEntry.transform
            )
        }

        for (const debugRect of this.persistentDebugRects) {
            this.drawDebugRect(
                debugRect.start,
                debugRect.end,
                debugRect.vertical,
                debugRect.horizontal,
                debugRect.depth
            )
        }

        if (this.debugLinesDataIndex > 0) {
            // gl.disable(gl.DEPTH_TEST)

            const { coloredShader } = this

            gl.bindBuffer(gl.ARRAY_BUFFER, this.debugLineBuffer)

            this.defineVertexBuffer(gl, coloredShader, DebugLine.ATTRIBUTES, DebugLine.STRIDE)

            gl.useProgram(coloredShader.program)

            const mvp = mat4.create()
            mat4.multiply(mvp, mvp, this.projectionMatrix)
            mat4.multiply(mvp, mvp, this.viewMatrix)

            gl.uniformMatrix4fv(coloredShader.mvp, false, mvp)

            const filledDebugLinesData = new Float32Array(
                this.debugLinesData.buffer,
                0,
                this.debugLinesDataIndex * DebugLine.STRIDE
            )
            gl.bufferSubData(gl.ARRAY_BUFFER, 0, filledDebugLinesData)

            gl.drawArrays(gl.LINES, 0, this.debugLinesDataIndex)

            this.debugLinesDataIndex = 0

            // gl.enable(gl.DEPTH_TEST)
        }

        ctx.clearRect(0, 0, this.canvas2D.width, this.canvas2D.height)
        ctx.textAlign = "center"
        ctx.textBaseline = "middle"
        ctx.strokeStyle = "white"
        ctx.lineWidth = 3
        ctx.font = "25px Roboto"
        ctx.globalAlpha = 0.5
        for (const text of this.texts) {
            const p = text.pos
            vec4.transformMat4(pos, vec4.fromValues(p[0], p[1], p[2], 1), mvp)

            let x = pos[0] / pos[3]
            let y = pos[1] / pos[3]

            y = (-y + 1) / 2
            x = (x + 1) / 2

            ctx.strokeText(text.text, x * this.canvas2D.clientWidth, y * this.canvas2D.clientHeight)
            ctx.fillText(text.text, x * this.canvas2D.clientWidth, y * this.canvas2D.clientHeight)
        }
    }
}
