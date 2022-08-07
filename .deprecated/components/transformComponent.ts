import { quat, vec3, vec4 } from "gl-matrix"
import { Component } from "./component"

export interface TransformData {
    pos: vec3
    size: vec3
    rotation: quat
}

export function cloneTransform(transform: TransformData): TransformData {
    return {
        pos: vec3.clone(transform.pos),
        size: vec3.clone(transform.size),
        rotation: quat.clone(transform.rotation),
    }
}

export class TransformComponent extends Component {
    static ID = "transform"

    constructor(public transform: TransformData) {
        super()
    }
}
