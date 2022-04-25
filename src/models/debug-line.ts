import type { AttributeDef } from "../managers/render"

const ATTRIBUTES: AttributeDef[] = [
    {
        name: "p",
        size: 3,
    },
    {
        name: "c",
        size: 3,
    },
]
const STRIDE = ATTRIBUTES.reduce((acum, value) => acum + value.size, 0)

export abstract class DebugLine {
    static readonly ATTRIBUTES = ATTRIBUTES
    static readonly STRIDE = STRIDE
    static readonly MAX_DEBUG_LINES = 1000
}
