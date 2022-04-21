export type PhysicsOptions = {
    isStatic?: boolean
    noRotation?: boolean
    mass?: number
}

export class PhysicsDef {
    constructor(public readonly options: PhysicsOptions) {
        //
    }
}
