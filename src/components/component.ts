import { Entity } from "../entities/entity"

export enum ComponentID {
    TRANSFORM,
    PHYSICS,
    VISUAL,
}

export class Component {
    static readonly MAX_COMPONENT = 3

    id: ComponentID
    owner: Entity
}
