import { TransformData } from "../components/transformComponent"
import { Model } from "./model"

export type ModelOptions = {
    texMul: number
}

export type ModelDefEntry = {
    model: Model
    transform: TransformData
    options?: Partial<ModelOptions>
}

const DEFAULT_MODEL_OPTIONS = {
    texMul: 1,
} as ModelOptions

export function getModelOptions(options?: Partial<ModelOptions>): ModelOptions {
    return Object.assign({ ...DEFAULT_MODEL_OPTIONS }, options || {})
}

export abstract class ModelDef {
    abstract update(transform: Readonly<TransformData>): void
    abstract getEntries(): ModelDefEntry[]
}
