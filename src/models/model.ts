import type { AttributeDef } from "../managers/render"

const ATTRIBUTES: AttributeDef[] = [
    {
        name: "p",
        size: 3,
    },
    {
        name: "n",
        size: 3,
    },
    {
        name: "uv",
        size: 2,
    },
]
const STRIDE = ATTRIBUTES.reduce((acum, value) => acum + value.size, 0)

export class Model {
    static readonly ATTRIBUTES = ATTRIBUTES
    static readonly STRIDE = STRIDE

    constructor(
        readonly vertices: WebGLBuffer,
        readonly vertexCount: number,
        readonly indices: WebGLBuffer,
        readonly indexCount: number
    ) {}
}
