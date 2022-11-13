import { mat4, quat, vec3 } from "gl-matrix"
import { Mesh, Texture } from "./render-data"

// pos, normal, uv, pos in per object data
export const VERTEX_SIZE = 3 + 3 + 2 + 1

export const SKINNED_VERTEX_SIZE = 3 + 3 + 2 + 4 + 4

export class Renderable {
    rotation = quat.create()
    scale = 1
    position = vec3.create()

    perObjectDataIndex: number | undefined = undefined
    atlasNum: number | undefined = undefined

    constructor(readonly mesh: Mesh, readonly texture: Texture) {
        mesh.incRef()
        texture.incRef()
    }
}
