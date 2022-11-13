/* eslint-disable @typescript-eslint/no-non-null-assertion */

import { anisotropic, gl } from "./render-context"
import { Texture } from "./render-data"

export const ATLAS_SIZE = 2048

class AtlasRow {
    nextX = 0
    constructor(readonly y: number, readonly height: number) {}
}

export class Atlas {
    private hasChanges = false

    texture: WebGLTexture

    private nextY = 0
    private rows: AtlasRow[] = []

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

    private findRowForTexture(texture: Texture): AtlasRow | undefined {
        let smallestRowToFit: AtlasRow | undefined = undefined

        // TODO use binary search

        for (const row of this.rows) {
            if (
                row.height >= texture.height &&
                row.nextX + texture.width <= ATLAS_SIZE &&
                (smallestRowToFit === undefined || smallestRowToFit.height > row.height)
            ) {
                smallestRowToFit = row
            }
        }

        // can't fit texture in existing rows
        if (smallestRowToFit === undefined) {
            const rowHeight = texture.height
            if (this.nextY + rowHeight > ATLAS_SIZE) {
                // can't allocate new row this size
                return undefined
            }

            smallestRowToFit = new AtlasRow(this.nextY, rowHeight)
            this.rows.push(smallestRowToFit)

            this.nextY += rowHeight
        }

        return smallestRowToFit
    }

    tryAddTexture(texture: Texture): [number, number] | undefined {
        if (texture.width > ATLAS_SIZE || texture.height > ATLAS_SIZE) {
            throw new Error("Texture is larger than Atlas size.")
        }

        const row = this.findRowForTexture(texture)
        if (!row) {
            return undefined
        }

        gl.activeTexture(gl.TEXTURE1 + this.num)
        gl.bindTexture(gl.TEXTURE_2D, this.texture)
        const x = row.nextX
        const y = row.y

        gl.texSubImage2D(
            gl.TEXTURE_2D,
            0,
            x,
            y,
            texture.width,
            texture.height,
            gl.RGBA,
            gl.UNSIGNED_BYTE,
            texture.pixels
        )

        this.hasChanges = true

        row.nextX += texture.width

        return [x / ATLAS_SIZE, y / ATLAS_SIZE]
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
