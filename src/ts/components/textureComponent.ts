import { Services } from "../managers/services"
import { TextureDef } from "../models/texture-def"
import { Component } from "./component"

export class TextureComponent extends Component {
    static ID = "texture"

    texture: WebGLTexture | undefined

    constructor(textureDef: TextureDef) {
        super()
        this.loadTexture(textureDef)
    }

    private async loadTexture(textureDef: TextureDef): Promise<void> {
        this.texture = await Services.resources.requireTexture(
            textureDef.options?.name ?? "",
            textureDef.options.nn ?? false
        )
    }
}
