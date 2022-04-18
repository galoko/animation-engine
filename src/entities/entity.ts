import { Component, ComponentID } from "../components/component"

export class Entity {
    private components: Component[] = new Array(Component.MAX_COMPONENT)

    protected registerComponent(id: ComponentID, component: Component): void {
        if (this.components[id] != null) {
            throw new Error("Component is already registered.")
        }
        this.components[id] = component
    }

    get<T extends Component>(id: ComponentID): T | null {
        return (this.components[id] as T) || null
    }
}
