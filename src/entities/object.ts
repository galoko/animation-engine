import { CollisionModel } from "../models/collision-model"
import { Model } from "../models/model"
import { Entity } from "./entity"

export class Object extends Entity {
    constructor(model: Model, collisionModel: CollisionModel) {
        super()
    }
}
