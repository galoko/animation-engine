import { vec4 } from "gl-matrix"
import { TransformData } from "../components/transformComponent"
import { Model } from "./model"

export type ModelOptions = {
    texMul: number
    colorOverride: vec4
    alpha: boolean
}

export type ModelDefEntry = {
    model: Model
    transform: TransformData
    options?: Partial<ModelOptions>
}

const DEFAULT_MODEL_OPTIONS = {
    texMul: 1,
    alpha: false,
} as ModelOptions

export function getModelOptions(options?: Partial<ModelOptions>): ModelOptions {
    return Object.assign({ ...DEFAULT_MODEL_OPTIONS }, options || {})
}

export abstract class ModelDef {
    abstract update(transform: Readonly<TransformData>): void
    abstract getEntries(): ModelDefEntry[]
}
