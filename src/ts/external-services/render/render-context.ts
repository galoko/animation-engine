/* eslint-disable @typescript-eslint/no-non-null-assertion */

export class RenderContext {
    static readonly canvasWebGL = document.createElement("canvas")
    static readonly canvas2D = document.createElement("canvas")

    static readonly gl = this.canvasWebGL.getContext("webgl", {
        antialias: true,
        powerPreference: "high-performance",
    })!
    static readonly anisotropic = this.gl.getExtension("EXT_texture_filter_anisotropic")
    static readonly ctx = this.canvas2D.getContext("2d")!

    static {
        RenderContext.canvas2D.style.pointerEvents = "none"

        document.body.appendChild(RenderContext.canvasWebGL)
        document.body.appendChild(RenderContext.canvas2D)
    }
}
