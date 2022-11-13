/* eslint-disable @typescript-eslint/no-non-null-assertion */

import { anisotropic, gl } from "./render-context"
import { Texture } from "./render-data"

export const ATLAS_SIZE = 2048

export class Atlas {
    private hasChanges = false

    texture: WebGLTexture

    constructor(readonly num: number) {
        this.texture = gl.createTexture()!
        gl.activeTexture(gl.TEXTURE1 + this.num)
        gl.bindTexture(gl.TEXTURE_2D, this.texture)

        const debugData = new Uint8Array(ATLAS_SIZE * ATLAS_SIZE * 4)
        for (let i = 0; i < debugData.length; i += 4) {
            debugData[i + 0] = 255
            debugData[i + 1] = 0
            debugData[i + 2] = 255
            debugData[i + 3] = 255
        }

        gl.texImage2D(
            gl.TEXTURE_2D,
            0,
            gl.RGBA,
            ATLAS_SIZE,
            ATLAS_SIZE,
            0,
            gl.RGBA,
            gl.UNSIGNED_BYTE,
            debugData
        )

        if (anisotropic) {
            const max = gl.getParameter(anisotropic.MAX_TEXTURE_MAX_ANISOTROPY_EXT)
            gl.texParameterf(gl.TEXTURE_2D, anisotropic.TEXTURE_MAX_ANISOTROPY_EXT, max)
        }

        gl.generateMipmap(gl.TEXTURE_2D)

        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR)

        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT)
    }

    tryAddTexture(texture: Texture): [number, number] | undefined {
        return [0, 0]
    }

    update() {
        if (this.hasChanges) {
            this.hasChanges = false

            gl.activeTexture(gl.TEXTURE1 + this.num)
            gl.bindTexture(gl.TEXTURE_2D, this.texture)
            gl.generateMipmap(gl.TEXTURE_2D)
        }
    }
}
