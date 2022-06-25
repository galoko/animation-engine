export enum CollisionGroups {
    STATIC = 2,
    PLAYER = 4,
}

export type PhysicsOptions = {
    isStatic: boolean
    noRotation: boolean
    mass: number
    friction: number
    bakedTransform: boolean
    collisionGroup: number
}

const DEFAULT_PHYSICS_OPTIONS = {
    isStatic: false,
    noRotation: false,
    mass: 1,
    friction: 0.5,
    bakedTransform: false,
    collisionGroup: CollisionGroups.STATIC,
} as PhysicsOptions

export function getPhysicsOptions(options: Partial<PhysicsOptions>): PhysicsOptions {
    return Object.assign({ ...DEFAULT_PHYSICS_OPTIONS }, options || {})
}

export class PhysicsDef {
    constructor(public readonly options: Partial<PhysicsOptions>) {
        //
    }
}
