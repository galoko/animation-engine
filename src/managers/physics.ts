import { CollisionComponent } from "../components/collisionComponent"
import { PhysicsComponent } from "../components/phyicsComponent"
import { TransformComponent } from "../components/transformComponent"
import { Entity } from "../entities/entity"
import { getPhysicsOptions } from "../models/physics-def"

export class Physics {
    private dynamicsWorld: Ammo.btDiscreteDynamicsWorld
    private entities: Set<Entity> = new Set()
    private readonly tempTransform = new Ammo.btTransform()

    constructor(private ammo: typeof Ammo) {
        // ammo init (wow)
        const collisionConfiguration = new Ammo.btDefaultCollisionConfiguration()
        const dispatcher = new Ammo.btCollisionDispatcher(collisionConfiguration)
        const overlappingPairCache = new Ammo.btDbvtBroadphase()
        const solver = new Ammo.btSequentialImpulseConstraintSolver()

        this.dynamicsWorld = new Ammo.btDiscreteDynamicsWorld(
            dispatcher,
            overlappingPairCache,
            solver,
            collisionConfiguration
        )
        this.dynamicsWorld.setGravity(new Ammo.btVector3(0, 0, -9.8))
    }

    add(entity: Entity): void {
        const physics = entity.get(PhysicsComponent)
        const collision = entity.get(CollisionComponent)
        const transfrom = entity.get(TransformComponent)

        if (physics && collision && transfrom) {
            const shape = collision.collisionPrimitive.getAmmoShape(transfrom.transform)

            const options = getPhysicsOptions(physics.physicsDef.options)
            const { isStatic, noRotation } = options

            const localInertia = new Ammo.btVector3(0, 0, 0)
            const mass = isStatic ? 0 : options.mass

            if (!isStatic && !noRotation) {
                shape.calculateLocalInertia(mass, localInertia)
            }

            let bodyTransform = new Ammo.btTransform()
            bodyTransform.setIdentity()
            bodyTransform.setOrigin(
                new Ammo.btVector3(
                    transfrom.transform.pos[0],
                    transfrom.transform.pos[1],
                    transfrom.transform.pos[2]
                )
            )
            bodyTransform.setRotation(
                new Ammo.btQuaternion(
                    transfrom.transform.rotation[0],
                    transfrom.transform.rotation[1],
                    transfrom.transform.rotation[2],
                    transfrom.transform.rotation[3]
                )
            )

            const additionalTransform = collision.collisionPrimitive.getTransfrom()
            if (additionalTransform) {
                bodyTransform = bodyTransform.op_mul(additionalTransform)
            }

            const myMotionState = new Ammo.btDefaultMotionState(bodyTransform)

            const rbInfo = new Ammo.btRigidBodyConstructionInfo(
                mass,
                myMotionState,
                shape,
                localInertia
            )
            const body = new Ammo.btRigidBody(rbInfo)
            body.setFriction(options.friction)

            this.dynamicsWorld.addRigidBody(body)

            this.entities.add(entity)

            physics.body = body
        }
    }

    private syncBodies() {
        for (const entity of this.entities) {
            const physics = entity.get(PhysicsComponent)
            const transfrom = entity.get(TransformComponent)
            if (physics && transfrom) {
                const body = physics.body!

                body.getMotionState().getWorldTransform(this.tempTransform)
                const origin = this.tempTransform.getOrigin()
                transfrom.transform.pos[0] = origin.x()
                transfrom.transform.pos[1] = origin.y()
                transfrom.transform.pos[2] = origin.z()
                const rotation = this.tempTransform.getRotation()
                transfrom.transform.rotation[0] = rotation.x()
                transfrom.transform.rotation[1] = rotation.y()
                transfrom.transform.rotation[2] = rotation.z()
                transfrom.transform.rotation[3] = rotation.w()
            }
        }
    }

    tick(dt: number): void {
        this.dynamicsWorld.stepSimulation(dt, 2)

        this.syncBodies()
    }
}
