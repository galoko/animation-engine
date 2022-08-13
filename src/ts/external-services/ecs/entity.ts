export class Component {
    //
}

interface Type<T> extends Function {
    new (...args: any[]): T
}

const objProto = Object.getPrototypeOf(Object)
const componentProto = Component

function getFirstClass(obj: any): any {
    let result = obj
    while (obj !== objProto && obj !== componentProto) {
        result = obj
        obj = Object.getPrototypeOf(obj)
    }
    return result
}

export class Entity {
    private component = new Map<Type<Component>, Component>()

    addComponent<T extends Component>(component: T): void {
        this.component.set(getFirstClass(component.constructor) as Type<T>, component)
    }

    getComponent<T extends Component>(clazz: Type<T>): T | undefined {
        return this.component.get(getFirstClass(clazz)) as T | undefined
    }

    getComponentOrError<T extends Component>(clazz: Type<T>): T {
        const result = this.getComponent(clazz)
        if (result === undefined) {
            throw new Error("Component is not registered")
        }
        return result
    }
}
