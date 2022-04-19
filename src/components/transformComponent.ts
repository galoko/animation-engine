import { quat, vec3 } from "gl-matrix"
import { Component } from "./component"

export interface TransformData {
    pos: vec3
    size: vec3
    rotation: quat
}

export class TransformComponent extends Component {
    static ID = "transform"

    constructor(public transform: TransformData) {
        super()
    }
}
