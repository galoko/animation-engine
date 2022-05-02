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
