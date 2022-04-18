import type { ServicesClass } from "./services-class"

export let Services: ServicesClass

export function setServices(value: ServicesClass): void {
    if (Services != null) {
        throw new Error("Services are set twice.")
    }
    Services = value
}
