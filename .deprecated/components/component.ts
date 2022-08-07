import { Entity } from "../entities/entity"
export abstract class Component {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    static ID: string = undefined!
    owner: Entity

    constructor() {
        //
    }
}
