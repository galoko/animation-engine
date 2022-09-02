import { mat4, vec4 } from "gl-matrix"
import { Mesh, Texture } from "../../render/render-data"
import { Component, Entity } from "../entity"

export class TransformComponent extends Component {
    public transform = mat4.create()
    constructor(transform: mat4) {
        super()
        this.setTransform(transform)
    }

    setTransform(transform: mat4) {
        mat4.copy(this.transform, transform)
    }
}

export class RenderableComponent extends Component {
    constructor(private readonly renderableEntities: Entity[]) {
        super()
    }

    getRenderableEntities(): Entity[] {
        return this.renderableEntities
    }
}

export class MeshComponent extends Component {
    constructor(readonly mesh: Mesh) {
        super()
    }
}

export class TextureComponent extends Component {
    constructor(readonly texture: Texture) {
        super()
    }
}

export class ColorComponent extends Component {
    constructor(readonly color: vec4) {
        super()
    }

    setColor(color: vec4): void {
        vec4.copy(this.color, color)
    }
}

export class AnimationComponent extends Component {
    //
}

export class TextComponent extends Component {
    //
}
