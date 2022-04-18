import { CollisionPrimitive } from "./collision-primitives"

export class CollisionModel {
    constructor(readonly primitives: CollisionPrimitive[]) {}
}
