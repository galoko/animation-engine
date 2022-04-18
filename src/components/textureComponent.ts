import { Entity } from "../entities/entity"
import { Services } from "../managers/services"
import { Component } from "./component"

export class TextureComponent extends Component {
    static ID = "texture"

    texture: WebGLTexture | undefined

    constructor(entity: Entity, texName: string) {
        super(entity)
        this.loadTexture(texName)
    }

    private async loadTexture(texName: string): Promise<void> {
        this.texture = await Services.resources.requireTexture(texName)
    }
}
