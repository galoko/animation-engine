/* eslint-disable @typescript-eslint/no-non-null-assertion */

export const canvasWebGPU = document.createElement("canvas")
export const canvas2D = document.createElement("canvas")

export const wg = canvasWebGPU.getContext("webgpu") as GPUCanvasContext
export let wd: GPUDevice
export const ctx = canvas2D.getContext("2d")!

//"rgba16float"
export const presentationFormat = "rgba16float" // navigator.gpu.getPreferredCanvasFormat()

export async function initWebGPU() {
    const adapter = await navigator.gpu.requestAdapter()
    if (!adapter) {
        return
    }
    wd = await adapter.requestDevice({
        requiredFeatures: ["depth-clip-control", "rg11b10ufloat-renderable"],
        requiredLimits: {
            maxComputeInvocationsPerWorkgroup: 1024,
            maxComputeWorkgroupSizeX: 1024,
            maxComputeWorkgroupSizeY: 1024,
        },
    })

    wg.configure({
        device: wd,
        format: presentationFormat,
        colorSpace: "display-p3",
        alphaMode: "opaque",
    })
}

canvasWebGPU.style.position = "fixed"
document.body.insertBefore(canvas2D, null)

canvas2D.style.pointerEvents = "none"
canvas2D.style.position = "fixed"
document.body.insertBefore(canvasWebGPU, null)
