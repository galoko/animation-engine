import { PhysicsDef } from "../models/physics-def"
import { Component } from "./component"

export class PhysicsComponent extends Component {
    static ID = "physics"

    body: Ammo.btRigidBody | undefined

    constructor(readonly physicsDef: PhysicsDef) {
        super()
    }
}
