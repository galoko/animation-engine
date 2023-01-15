/* eslint-disable @typescript-eslint/no-non-null-assertion */

import { create3DContextWithWrapperThatThrowsOnGLError } from "./render-utils"

const canvasWebGL = document.createElement("canvas")
const canvas2D = document.createElement("canvas")

export const gl = create3DContextWithWrapperThatThrowsOnGLError(
    canvasWebGL.getContext("webgl2", {
        antialias: false,
        alpha: false,
        powerPreference: "high-performance",
    })!
)

export const anisotropic = gl.getExtension("EXT_texture_filter_anisotropic")
export const ctx = canvas2D.getContext("2d")!

canvasWebGL.style.position = "fixed"
document.body.insertBefore(canvas2D, null)

canvas2D.style.pointerEvents = "none"
canvas2D.style.position = "fixed"
document.body.insertBefore(canvasWebGL, null)
