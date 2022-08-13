import objectsVert from "../../shaders/objects.vert"
import objectsFrag from "../../shaders/objects.frag"

import { mat4, vec3 } from "gl-matrix"
import {
    ColorComponent,
    MeshComponent,
    RenderableComponent,
    TextureComponent,
    TransformComponent,
} from "../ecs/components/render-components"
import { Entity } from "../ecs/entity"
import { AttributeDef, Mesh } from "./render-data"
import { CompiledShader, compileShader } from "./render-utils"
import { RenderContext } from "./render-context"
export class Render {
    private static mvp: mat4
    private static viewMatrix: mat4
    private static projectionMatrix: mat4

    private static objectsShader: CompiledShader

    private static scene: Entity[] = []

    static init(): void {
        const { gl } = RenderContext

        Render.mvp = mat4.create()
        Render.projectionMatrix = mat4.create()
        Render.viewMatrix = mat4.create()

        Render.objectsShader = compileShader(gl, objectsVert, objectsFrag, [
            // attributes
            "p", // position
            "n", // normal
            "uv", // texture coordinates

            // uniforms
            "mvp", // model * view * projection
            "model", // for normals
            "texture", // texture num to use
            "texMul", // multiplier for texture coordinates to tile textures
            "useTexture", // use texture or color
            "color", // color if there is no texture
        ])

        Render.setupWebGL()
    }

    private static setupWebGL(): void {
        const { gl } = RenderContext

        gl.clearColor(0.3, 0.4, 1.0, 1.0)

        gl.disable(gl.CULL_FACE)
        gl.enable(gl.DEPTH_TEST)

        gl.enable(gl.BLEND)
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
    }

    // entities

    static addEntity(entity: Entity): void {
        const renderable = entity.getComponent(RenderableComponent)
        if (renderable) {
            for (const entity of renderable.getRenderableEntities()) {
                Render.scene.push(entity)
            }
        } else {
            Render.scene.push(entity)
        }
    }

    static setTransform(entity: Entity, transform: mat4): void {
        const transformComponent = entity.getComponentOrError(TransformComponent)
        transformComponent.setTransform(transform)
    }

    // camera

    static UP = vec3.fromValues(0, 0, 1)

    static setCamera(pos: vec3, lookAt: vec3): void {
        mat4.lookAt(Render.viewMatrix, pos, lookAt, Render.UP)
    }

    // utils

    static handleResize(): void {
        const { canvasWebGL, canvas2D, gl, ctx } = RenderContext

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

        ctx.resetTransform()
        ctx.scale(dpr, dpr)

        gl.viewport(0, 0, canvasWebGL.width, canvasWebGL.height)

        mat4.perspective(
            Render.projectionMatrix,
            (45 * Math.PI) / 180,
            canvasWebGL.width / canvasWebGL.height,
            0.1,
            100
        )
    }

    private static defineVertexBuffer(
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

    static render(): void {
        Render.handleResize()

        const { gl } = RenderContext
        const { objectsShader } = Render

        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

        gl.useProgram(objectsShader.program)

        for (const entity of Render.scene) {
            const mesh = entity.getComponentOrError(MeshComponent)
            const texture = entity.getComponent(TextureComponent)
            const color = entity.getComponent(ColorComponent)
            const transform = entity.getComponentOrError(TransformComponent)

            if (!texture && !color) {
                throw new Error("TODO")
            }

            gl.bindBuffer(gl.ARRAY_BUFFER, mesh.mesh.vertices)
            if (mesh.mesh.indices) {
                gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, mesh.mesh.indices)
            }

            Render.defineVertexBuffer(gl, objectsShader, Mesh.ATTRIBUTES, Mesh.STRIDE)

            const mvp = Render.mvp
            mat4.identity(mvp)
            mat4.multiply(mvp, mvp, Render.projectionMatrix)
            mat4.multiply(mvp, mvp, Render.viewMatrix)
            mat4.multiply(mvp, mvp, transform.transform)

            gl.uniformMatrix4fv(objectsShader.mvp, false, mvp)
            gl.uniformMatrix4fv(objectsShader.model, false, transform.transform)
            gl.uniform1i(objectsShader.texture, 0)

            if (texture) {
                gl.uniform1f(objectsShader.useTexture, 1)

                gl.activeTexture(gl.TEXTURE0)
                gl.bindTexture(gl.TEXTURE_2D, texture.texture.texture)
                gl.uniform1f(objectsShader.texMul, texture.texture.options.texMul)
            } else if (color) {
                gl.uniform1f(objectsShader.useTexture, 0)

                gl.uniform4fv(objectsShader.color, color.color)
            }

            if (mesh.mesh.indices && mesh.mesh.indexCount) {
                gl.drawElements(gl.TRIANGLES, mesh.mesh.indexCount, gl.UNSIGNED_SHORT, 0)
            } else {
                gl.drawArrays(gl.TRIANGLES, 0, mesh.mesh.vertexCount)
            }
        }
    }

    static finalize(): void {
        //
    }
}
