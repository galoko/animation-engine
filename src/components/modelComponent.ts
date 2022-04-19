import { Services } from "../managers/services"
import { Model } from "../models/model"
import { Component } from "./component"

export class ModelComponent extends Component {
    static ID = "model"

    model: Model | undefined

    constructor(texName: string) {
        super()
        this.loadModel(texName)
    }

    private async loadModel(texName: string): Promise<void> {
        this.model = await Services.resources.requireModel(texName)
    }
}
