export class Physics {
    dynamicsWorld: Ammo.btDiscreteDynamicsWorld

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

    tick(dt: number): void {
        //
    }
}
