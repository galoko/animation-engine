import { Mth } from "./mth"

export type ToFloatFunction<C> = (p: C) => number

export abstract class CubicSpline<C> {
    abstract apply(value: C): number

    static constant(value: number): Constant {
        return new Constant(value)
    }

    static builder<C>(
        coordinate: ToFloatFunction<C>,
        valueTransformer?: ToFloatFunction<number>
    ): CubicSplineBuilder<C> {
        return new CubicSplineBuilder<C>(coordinate, valueTransformer)
    }
}

class CubicSplineBuilder<C> {
    private readonly valueTransformer: ToFloatFunction<number>

    private readonly locations: number[] = []
    private readonly values: CubicSpline<C>[] = []
    private readonly derivatives: number[] = []

    constructor(
        private readonly coordinate: ToFloatFunction<C>,
        valueTransformer?: ToFloatFunction<number>
    ) {
        this.valueTransformer = valueTransformer ? valueTransformer : value => value
    }

    addPoint(t: number, value: CubicSpline<C> | number, derivative: number): CubicSplineBuilder<C> {
        if (typeof value === "number") {
            value = new Constant(this.valueTransformer(value))
        }

        this.locations.push(t)
        this.values.push(value)
        this.derivatives.push(derivative)

        return this
    }

    build(): CubicSpline<C> {
        return new Multipoint<C>(
            this.coordinate,
            this.locations,
            this.values.slice(),
            this.derivatives
        )
    }
}

class Constant extends CubicSpline<any> {
    constructor(private readonly value: number) {
        super()
    }

    apply(): number {
        return this.value
    }
}

class Multipoint<C> extends CubicSpline<C> {
    constructor(
        private readonly coordinate: ToFloatFunction<C>,
        private readonly locations: number[],
        private readonly values: CubicSpline<C>[],
        private readonly derivatives: number[]
    ) {
        super()
    }

    apply(value: C): number {
        const loc = this.coordinate(value)
        const index =
            Mth.binarySearch(0, this.locations.length, index => loc < this.locations[index]) - 1

        const j = this.locations.length - 1
        if (index < 0) {
            return this.values[0].apply(value) + this.derivatives[0] * (loc - this.locations[0])
        } else if (index == j) {
            return this.values[j].apply(value) + this.derivatives[j] * (loc - this.locations[j])
        } else {
            const prevLoc = this.locations[index]
            const nextLoc = this.locations[index + 1]

            const t = (loc - prevLoc) / (nextLoc - prevLoc)

            const tofloatfunction = this.values[index]
            const tofloatfunction1 = this.values[index + 1]

            const d0 = this.derivatives[index]
            const d1 = this.derivatives[index + 1]

            const v0 = tofloatfunction.apply(value)
            const v1 = tofloatfunction1.apply(value)

            const v2 = d0 * (nextLoc - prevLoc) - (v1 - v0)
            const v3 = -d1 * (nextLoc - prevLoc) + (v1 - v0)

            return Mth.lerp(t, v0, v1) + t * (1 - t) * Mth.lerp(t, v2, v3)
        }
    }
}
