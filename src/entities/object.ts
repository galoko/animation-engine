import { ModelComponent } from "../components/modelComponent"
import { CollisionComponent } from "../components/physicsComponent"
import { TextureComponent } from "../components/textureComponent"
import { TransformComponent, TransformData } from "../components/transformComponent"
import { CollisionPrimitive } from "../models/collision-primitives"
import { Entity } from "./entity"

export class Object extends Entity {
    constructor(
        transform: TransformData,
        modelName: string,
        textureName: string,
        collisionPrimitive: CollisionPrimitive
    ) {
        super()

        this.registerComponent(new TransformComponent(transform))
        this.registerComponent(new ModelComponent(modelName))
        this.registerComponent(new TextureComponent(textureName))
        this.registerComponent(new CollisionComponent(collisionPrimitive))
    }
}
