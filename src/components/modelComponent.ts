import { ModelDef } from "../models/model-def"
import { Component } from "./component"

export class ModelComponent extends Component {
    static ID = "model"

    constructor(public modelDef: ModelDef) {
        super()
    }
}
