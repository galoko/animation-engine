/* eslint-disable @typescript-eslint/no-non-null-assertion */

import { wd } from "./render-context"
import { Texture } from "./render-data"

export const MAX_ATLASES_COUNT = 16
export const ATLAS_SIZE = 2048

class AtlasRow {
    nextX = 0
    constructor(readonly y: number, readonly height: number) {}
}

export class Atlas {
    private nextY = 0
    private rows: AtlasRow[] = []

    constructor(readonly num: number, readonly atlasTexture: GPUTexture) {}

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

        const x = row.nextX
        const y = row.y

        // TODO generate mipmaps somehow
        wd.queue.writeTexture(
            {
                texture: this.atlasTexture,
                origin: [x, y, this.num],
            },
            texture.pixels,
            {
                offset: 0,
                bytesPerRow: texture.width * 4,
                rowsPerImage: texture.height,
            },
            {
                width: texture.width,
                height: texture.height,
            }
        )

        row.nextX += texture.width

        return [x / ATLAS_SIZE, y / ATLAS_SIZE]
    }
}
