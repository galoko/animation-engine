import { ModelComponent } from "../components/modelComponent"
import { CollisionComponent } from "../components/collisionComponent"
import { TextureComponent } from "../components/textureComponent"
import { TransformComponent, TransformData } from "../components/transformComponent"
import { CollisionPrimitive } from "../models/collision-primitives"
import { ModelDef } from "../models/model-def"
import { PhysicsDef } from "../models/physics-def"
import { Entity } from "./entity"
import { PhysicsComponent } from "../components/phyicsComponent"

export class SimpleObject extends Entity {
    constructor(
        transform: TransformData,
        modelDef: ModelDef,
        textureName: string,
        physicsDef?: PhysicsDef,
        collisionPrimitive?: CollisionPrimitive
    ) {
        super()

        this.registerComponent(new TransformComponent(transform))
        this.registerComponent(new ModelComponent(modelDef))
        this.registerComponent(new TextureComponent(textureName))
        if (physicsDef && collisionPrimitive) {
            this.registerComponent(new PhysicsComponent(physicsDef))
            this.registerComponent(new CollisionComponent(collisionPrimitive))
        }
    }
}
