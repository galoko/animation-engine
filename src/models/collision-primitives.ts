import { vec3 } from "gl-matrix"
import { TransformData } from "../components/transformComponent"

export abstract class CollisionPrimitive {
    private ammoShape: Ammo.btCollisionShape | undefined

    getAmmoShape(transform: TransformData): Ammo.btCollisionShape {
        if (this.ammoShape === undefined) {
            this.ammoShape = this.update(transform)
        }
        return this.ammoShape
    }

    getTransfrom(): Ammo.btTransform | undefined {
        return undefined
    }

    protected abstract update(transform: Readonly<TransformData>): Ammo.btCollisionShape
}

export class Capsule extends CollisionPrimitive {
    update(transform: Readonly<TransformData>): Ammo.btCollisionShape {
        const { size } = transform

        return new Ammo.btCapsuleShapeZ(0.5 * size[0], size[2] - size[0])
    }
}

export class Box extends CollisionPrimitive {
    update(transform: Readonly<TransformData>): Ammo.btCollisionShape {
        const { size } = transform

        const ammoSize = new Ammo.btVector3(size[0] * 0.5, size[1] * 0.5, size[2] * 0.5)

        return new Ammo.btBoxShape(ammoSize)
    }
}

export class Sphere extends CollisionPrimitive {
    update(transform: Readonly<TransformData>): Ammo.btCollisionShape {
        const { size } = transform

        return new Ammo.btSphereShape(0.5 * size[0])
    }
}

export class Plane extends CollisionPrimitive {
    update(transform: Readonly<TransformData>): Ammo.btCollisionShape {
        const { pos, size, rotation } = transform

        const p0 = vec3.fromValues(-0.5 * size[0], -0.5 * size[1], 0)
        const p1 = vec3.fromValues(+0.5 * size[0], -0.5 * size[1], 0)
        const p2 = vec3.fromValues(-0.5 * size[0], +0.5 * size[1], 0)
        const p3 = vec3.fromValues(+0.5 * size[0], +0.5 * size[1], 0)

        vec3.transformQuat(p0, p0, rotation)
        vec3.transformQuat(p1, p1, rotation)
        vec3.transformQuat(p2, p2, rotation)
        vec3.transformQuat(p3, p3, rotation)

        vec3.add(p0, p0, pos)
        vec3.add(p1, p1, pos)
        vec3.add(p2, p2, pos)
        vec3.add(p3, p3, pos)

        const p0a = new Ammo.btVector3(p0[0], p0[1], p0[2])
        const p1a = new Ammo.btVector3(p1[0], p1[1], p1[2])
        const p2a = new Ammo.btVector3(p2[0], p2[1], p2[2])
        const p3a = new Ammo.btVector3(p3[0], p3[1], p3[2])

        const trimesh = new Ammo.btTriangleMesh()

        trimesh.addTriangle(p0a, p1a, p2a, true)
        trimesh.addTriangle(p1a, p2a, p3a, true)

        return new Ammo.btBvhTriangleMeshShape(trimesh, true)
    }
}
