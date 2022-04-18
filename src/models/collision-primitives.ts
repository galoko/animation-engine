import { vec3 } from "gl-matrix"

export class CollisionPrimitive {
    protected ammoShape: Ammo.btCollisionShape

    getAmmoShape(): Ammo.btCollisionShape {
        return this.ammoShape
    }
}

export class Capsule extends CollisionPrimitive {
    constructor(radius: number, height: number) {
        super()
        this.ammoShape = new Ammo.btCapsuleShape(radius, height)
    }
}

export class Plane extends CollisionPrimitive {
    constructor(pos: vec3) {
        super()

        const p0 = new Ammo.btVector3(pos[0] - 0.5, pos[1] - 0.5, pos[2])
        const p1 = new Ammo.btVector3(pos[0] + 0.5, pos[1] - 0.5, pos[2])
        const p2 = new Ammo.btVector3(pos[0] - 0.5, pos[1] + 0.5, pos[2])
        const p3 = new Ammo.btVector3(pos[0] + 0.5, pos[1] + 0.5, pos[2])

        const trimesh = new Ammo.btTriangleMesh()

        trimesh.addTriangle(p0, p1, p2, true)
        trimesh.addTriangle(p1, p2, p3, true)

        this.ammoShape = new Ammo.btBvhTriangleMeshShape(trimesh, true)
    }
}
