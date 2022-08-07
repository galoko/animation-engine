export class Pair<T, K> {
    constructor(public first: T, public second: K) {}

    static of<T, K>(first: T, second: K): Pair<T, K> {
        return new Pair(first, second)
    }
}

export type Supplier<T> = () => T
