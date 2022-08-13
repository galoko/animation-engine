import { mat4, quat, vec3, vec4 } from "gl-matrix"
import {
    ColorComponent,
    MeshComponent,
    RenderableComponent,
    TextureComponent,
    TransformComponent,
} from "../ecs/components/render-components"
import { Entity } from "../ecs/entity"
import { ResourceManager } from "../resources/resource-manager"
import { Mesh, Texture } from "./render-data"

export enum PrimitiveType {
    Plane,
    Cube,
    Sphere,
    Capsule,
    Line,
    Text,
}

class CapsuleTransformPrimitive extends TransformComponent {
    private rotation = quat.create()
    private position = vec3.create()
    private size = vec3.create()
    private temp = mat4.create()

    constructor(private readonly capsule: Entity, transform: mat4) {
        super(transform)
        this.applyTransform(transform)
    }

    setTransform(transform: mat4) {
        this.applyTransform(transform)
    }

    private applyTransform(transform: mat4) {
        const renderable = this.capsule.getComponentOrError(RenderableComponent)
        const [top, body, bottom] = renderable.getRenderableEntities()
        const { rotation, position, size, temp } = this

        mat4.getRotation(rotation, transform)
        mat4.getTranslation(position, transform)
        mat4.getScaling(size, transform)

        const width = Math.max(size[0], size[1])
        const height = Math.max(1.25, size[2])

        mat4.fromRotationTranslationScale(
            temp,
            rotation,
            vec3.fromValues(position[0], position[1], position[2] + (height - width) / 2),
            vec3.fromValues(width, width, width)
        )
        top.getComponentOrError(TransformComponent).setTransform(temp)

        mat4.fromRotationTranslationScale(
            temp,
            rotation,
            position,
            vec3.fromValues(width, width, Math.max(0, height - width))
        )
        body.getComponentOrError(TransformComponent).setTransform(temp)

        const q = quat.create()
        quat.fromEuler(q, 180, 0, 0)
        quat.mul(rotation, rotation, q)

        mat4.fromRotationTranslationScale(
            temp,
            rotation,
            vec3.fromValues(position[0], position[1], position[2] - (height - width) / 2),
            vec3.fromValues(width, width, width)
        )
        bottom.getComponentOrError(TransformComponent).setTransform(temp)
    }
}

export function createObject(mesh: Mesh, textureOrColor: Texture | vec4, transform: mat4): Entity {
    const entity = new Entity()
    entity.addComponent(new MeshComponent(mesh))
    if (textureOrColor instanceof Texture) {
        entity.addComponent(new TextureComponent(textureOrColor))
    } else {
        entity.addComponent(new ColorComponent(textureOrColor))
    }
    entity.addComponent(new TransformComponent(transform))
    return entity
}

export async function createCapsulePrimitive(color: vec4, transform: mat4): Promise<Entity> {
    const halfSphere = await ResourceManager.requestMesh("half_sphere")
    const cylinder = await ResourceManager.requestMesh("cylinder")

    const top = createObject(halfSphere, color, mat4.create())
    const body = createObject(cylinder, color, mat4.create())
    const bottom = createObject(halfSphere, color, mat4.create())

    const capsule = new Entity()
    capsule.addComponent(new RenderableComponent([top, body, bottom]))
    capsule.addComponent(new CapsuleTransformPrimitive(capsule, transform))

    return capsule
}

export async function createPrimitive(
    primitiveType: PrimitiveType,
    color: vec4,
    transform: mat4
): Promise<Entity> {
    let primitive: Entity
    switch (primitiveType) {
        case PrimitiveType.Plane: {
            primitive = createObject(await ResourceManager.requestMesh("plane"), color, transform)
            break
        }
        case PrimitiveType.Cube: {
            primitive = createObject(await ResourceManager.requestMesh("cube"), color, transform)
            break
        }
        case PrimitiveType.Sphere: {
            primitive = createObject(await ResourceManager.requestMesh("sphere"), color, transform)
            break
        }
        case PrimitiveType.Capsule: {
            primitive = await createCapsulePrimitive(color, transform)
            break
        }
        case PrimitiveType.Line: {
            primitive = new LinePrimitive()
            break
        }
        default: {
            throw new Error("Unsupported primitive type.")
        }
    }

    return primitive
}
