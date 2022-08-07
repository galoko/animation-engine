import { Component } from "../components/component"

interface ComponentClass<T> {
    new (...args: never[]): T
    ID: string
}

export class Entity {
    private components: { [key: string]: Component } = {}

    protected registerComponent(component: Component): void {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        const id = component.constructor.ID as string

        if (this.components[id] != null) {
            throw new Error("Component is already registered.")
        }
        this.components[id] = component
    }

    get<T extends Component>(c: ComponentClass<T>): T | null {
        const id = c.ID

        return (this.components[id] as T) || null
    }
}
