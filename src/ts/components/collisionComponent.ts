import { CollisionPrimitive } from "../models/collision-primitives"
import { Component } from "./component"

export class CollisionComponent extends Component {
    static ID = "collision"

    constructor(readonly collisionPrimitive: CollisionPrimitive) {
        super()
    }
}
