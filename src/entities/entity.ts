import { Component } from "../components/component"

export class Entity {
    private components: Component[] = []

    protected registerComponent(component: Component): void {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        const id = component.constructor.ID

        if (this.components[id] != null) {
            throw new Error("Component is already registered.")
        }
        this.components[id] = component
    }

    get<T extends Component>(c: typeof Component): T | null {
        const id = c.ID

        return (this.components[id] as T) || null
    }
}
