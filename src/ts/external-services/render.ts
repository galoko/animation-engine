import generalVert from "../shaders/general.vert"
import generalFrag from "../shaders/general.frag"

import objectsVert from "../shaders/objects.vert"
import objectsFrag from "../shaders/objects.frag"

import coloredVert from "../shaders/colored.vert"
import coloredFrag from "../shaders/colored.frag"

import skinningVert from "../shaders/skinning.vert"
import skinningFrag from "../shaders/skinning.frag"

import { ResourseManager } from "./resource-manager"

export class Render {
    private static canvasWebGL: HTMLCanvasElement
    private static canvas2D: HTMLCanvasElement

    private static gl: WebGLRenderingContext
    private static anisotropic: EXT_texture_filter_anisotropic | null
    private static ctx: CanvasRenderingContext2D

    static init(): void {
        this.canvasWebGL = ResourseManager.canvasWebGL
        this.canvas2D = ResourseManager.canvas2D

        this.gl = this.canvasWebGL.getContext("webgl", {
            antialias: true,
            powerPreference: "high-performance",
        })!
        this.anisotropic = this.gl.getExtension("EXT_texture_filter_anisotropic")

        this.ctx = this.canvas2D.getContext("2d")!
    }

    static finalize(): void {
        //
    }
}
