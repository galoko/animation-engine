import { Pair } from "./consumer"

export interface Sampler {
    sample(x: number, y: number, z: number): TargetPoint
}

export class Parameter {
    constructor(public min: number, public max: number) {}

    static span(min: Parameter, max: Parameter): Parameter
    static span(min: number, max: number): Parameter
    static span(min: number | Parameter, max: number | Parameter): Parameter {
        if (typeof min === "number") {
            if (typeof max !== "number") {
                throw new Error("")
            }
            return new Parameter(quantizeCoord(min), quantizeCoord(max))
        } else {
            if (typeof max === "number") {
                throw new Error("")
            }
            return new Parameter(min.min, max.max)
        }
    }

    static point(value: number): Parameter {
        return Parameter.span(value, value)
    }

    distance(value: number): number {
        const v0 = value - this.max
        const v1 = this.min - value
        return v0 > 0 ? v0 : Math.max(v1, 0)
    }

    get center(): number {
        return (this.min + this.max) * 0.5
    }

    get length(): number {
        return this.max - this.min
    }
}

export class TargetPoint {
    constructor(
        public temperature: number,
        public humidity: number,
        public continentalness: number,
        public erosion: number,
        public depth: number,
        public weirdness: number
    ) {}
}

export class ParameterPoint {
    constructor(
        public temperature: Parameter,
        public humidity: Parameter,
        public continentalness: Parameter,
        public erosion: Parameter,
        public depth: Parameter,
        public weirdness: Parameter,
        public offset: number
    ) {}

    fitness(targetPoint: TargetPoint): number {
        const temperatureDistance = this.temperature.distance(targetPoint.temperature)
        const humidityDistance = this.humidity.distance(targetPoint.humidity)
        const continentalnessDistance = this.continentalness.distance(targetPoint.continentalness)
        const erosionDistance = this.erosion.distance(targetPoint.erosion)
        const depthDistance = this.depth.distance(targetPoint.depth)
        const weirdnessDistance = this.weirdness.distance(targetPoint.weirdness)
        const offsetDistance = 0 - this.offset

        return (
            temperatureDistance * temperatureDistance +
            humidityDistance * humidityDistance +
            continentalnessDistance * continentalnessDistance +
            erosionDistance * erosionDistance +
            depthDistance * depthDistance +
            weirdnessDistance * weirdnessDistance +
            offsetDistance * offsetDistance
        )
    }
}

const QUANTIZATION_FACTOR = 10000

export function quantizeCoord(coord: number): number {
    return Math.trunc(coord * QUANTIZATION_FACTOR)
}

export function unquantizeCoord(coord: number): number {
    return coord / QUANTIZATION_FACTOR
}

export function parameters(
    temperature: number,
    humidity: number,
    continentalness: number,
    erosion: number,
    depth: number,
    weirdness: number,
    offset: number
): ParameterPoint

export function parameters(
    temperature: Parameter | number,
    humidity: Parameter | number,
    continentalness: Parameter | number,
    erosion: Parameter | number,
    depth: Parameter | number,
    weirdness: Parameter | number,
    offset: number
): ParameterPoint

export function parameters(
    temperature: Parameter | number,
    humidity: Parameter | number,
    continentalness: Parameter | number,
    erosion: Parameter | number,
    depth: Parameter | number,
    weirdness: Parameter | number,
    offset: number
): ParameterPoint {
    if (typeof temperature === "number") {
        if (
            typeof temperature !== "number" ||
            typeof humidity !== "number" ||
            typeof continentalness !== "number" ||
            typeof erosion !== "number" ||
            typeof depth !== "number" ||
            typeof weirdness !== "number"
        ) {
            throw new Error("")
        }

        return new ParameterPoint(
            Parameter.point(temperature),
            Parameter.point(humidity),
            Parameter.point(continentalness),
            Parameter.point(erosion),
            Parameter.point(depth),
            Parameter.point(weirdness),
            quantizeCoord(offset)
        )
    } else {
        if (
            typeof temperature === "number" ||
            typeof humidity === "number" ||
            typeof continentalness === "number" ||
            typeof erosion === "number" ||
            typeof depth === "number" ||
            typeof weirdness === "number"
        ) {
            throw new Error("")
        }

        return new ParameterPoint(
            temperature,
            humidity,
            continentalness,
            erosion,
            depth,
            weirdness,
            quantizeCoord(offset)
        )
    }
}

export function findValueBruteForce<T>(
    targetPoint: TargetPoint,
    values: Pair<ParameterPoint, T>[]
): T {
    let minDistance = Infinity
    let result: T | undefined

    for (const pair of values) {
        const distance = pair.first.fitness(targetPoint)
        if (distance < minDistance) {
            minDistance = distance
            result = pair.second
        }
    }

    if (result === undefined) {
        throw new Error("Result not found.")
    }

    return result
}

export function target(
    temperature: number,
    humidity: number,
    continentalness: number,
    erosion: number,
    depth: number,
    weirdness: number
): TargetPoint {
    return new TargetPoint(
        quantizeCoord(temperature),
        quantizeCoord(humidity),
        quantizeCoord(continentalness),
        quantizeCoord(erosion),
        quantizeCoord(depth),
        quantizeCoord(weirdness)
    )
}
