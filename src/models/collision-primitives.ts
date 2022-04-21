import { TransformData } from "../components/transformComponent"

export abstract class CollisionPrimitive {
    private ammoShape: Ammo.btCollisionShape

    getAmmoShape(transform: TransformData): Ammo.btCollisionShape {
        if (this.ammoShape === undefined) {
            this.ammoShape = this.update(transform)
        }
        return this.ammoShape
    }

    protected abstract update(transform: Readonly<TransformData>): Ammo.btCollisionShape
}

export class Capsule extends CollisionPrimitive {
    update(transform: Readonly<TransformData>): Ammo.btCollisionShape {
        const { size } = transform

        return new Ammo.btCapsuleShape(0.5 * size[0], 1 * size[2])
    }
}

export class Plane extends CollisionPrimitive {
    update(transform: Readonly<TransformData>): Ammo.btCollisionShape {
        const { pos, size } = transform

        const p0 = new Ammo.btVector3(pos[0] - 0.5 * size[0], pos[1] - 0.5 * size[1], pos[2])
        const p1 = new Ammo.btVector3(pos[0] + 0.5 * size[0], pos[1] - 0.5 * size[1], pos[2])
        const p2 = new Ammo.btVector3(pos[0] - 0.5 * size[0], pos[1] + 0.5 * size[1], pos[2])
        const p3 = new Ammo.btVector3(pos[0] + 0.5 * size[0], pos[1] + 0.5 * size[1], pos[2])

        const trimesh = new Ammo.btTriangleMesh()

        trimesh.addTriangle(p0, p1, p2, true)
        trimesh.addTriangle(p1, p2, p3, true)

        return new Ammo.btBvhTriangleMeshShape(trimesh, true)
    }
}
