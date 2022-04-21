export type PhysicsOptions = {
    isStatic: boolean
    noRotation: boolean
    mass: number
    friction: number
}

const DEFAULT_PHYSICS_OPTIONS = {
    isStatic: false,
    noRotation: false,
    mass: 1,
    friction: 0.5,
} as PhysicsOptions

export function getPhysicsOptions(options: Partial<PhysicsOptions>): PhysicsOptions {
    return Object.assign({ ...DEFAULT_PHYSICS_OPTIONS }, options || {})
}

export class PhysicsDef {
    constructor(public readonly options: Partial<PhysicsOptions>) {
        //
    }
}
