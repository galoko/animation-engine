import { TransformData } from "../components/transformComponent"
import { Model } from "./model"

export type ModelDefEntry = {
    model: Model
    transform: TransformData
}

export abstract class ModelDef {
    abstract update(transform: Readonly<TransformData>): void
    abstract getEntries(): ModelDefEntry[]
}
