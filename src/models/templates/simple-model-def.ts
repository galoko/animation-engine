import { TransformData } from "../../components/transformComponent"
import { Services } from "../../managers/services"
import { Model } from "../model"
import { ModelDef, ModelDefEntry } from "../model-def"

export class SimpleModelDef implements ModelDef {
    private model: Model | undefined
    private transform: TransformData | undefined

    constructor(modelName: string) {
        this.loadModel(modelName)
    }

    async loadModel(modelName: string): Promise<void> {
        this.model = await Services.resources.requireModel(modelName)
    }

    update(transform: TransformData) {
        this.transform = transform
    }

    getEntries(): ModelDefEntry[] {
        if (this.model === undefined || this.transform === undefined) {
            throw new Error("Model is not loaded.")
        }

        return [{ model: this.model, transform: this.transform }]
    }
}
