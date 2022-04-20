import { ModelComponent } from "../components/modelComponent"
import { CollisionComponent } from "../components/physicsComponent"
import { TextureComponent } from "../components/textureComponent"
import { TransformComponent, TransformData } from "../components/transformComponent"
import { CollisionPrimitive } from "../models/collision-primitives"
import { ModelDef } from "../models/model-def"
import { Entity } from "./entity"

export class Object extends Entity {
    constructor(
        transform: TransformData,
        modelDef: ModelDef,
        textureName: string,
        collisionPrimitive: CollisionPrimitive
    ) {
        super()

        this.registerComponent(new TransformComponent(transform))
        this.registerComponent(new ModelComponent(modelDef))
        this.registerComponent(new TextureComponent(textureName))
        this.registerComponent(new CollisionComponent(collisionPrimitive))
    }
}
