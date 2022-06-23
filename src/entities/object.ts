import { ModelComponent } from "../components/modelComponent"
import { CollisionComponent } from "../components/collisionComponent"
import { TextureComponent } from "../components/textureComponent"
import { TransformComponent, TransformData } from "../components/transformComponent"
import { CollisionPrimitive } from "../models/collision-primitives"
import { ModelDef } from "../models/model-def"
import { PhysicsDef } from "../models/physics-def"
import { Entity } from "./entity"
import { PhysicsComponent } from "../components/phyicsComponent"
import { TextureDef } from "../models/texture-def"

export class SimpleObject extends Entity {
    constructor(
        transform: TransformData,
        modelDef: ModelDef,
        textureDef: TextureDef | string,
        physicsDef?: PhysicsDef,
        collisionPrimitive?: CollisionPrimitive
    ) {
        super()

        if (typeof textureDef === "string") {
            textureDef = new TextureDef({ name: textureDef })
        }

        this.registerComponent(new TransformComponent(transform))
        this.registerComponent(new ModelComponent(modelDef))
        this.registerComponent(new TextureComponent(textureDef))
        if (physicsDef && collisionPrimitive) {
            this.registerComponent(new PhysicsComponent(physicsDef))
            this.registerComponent(new CollisionComponent(collisionPrimitive))
        }
    }
}
