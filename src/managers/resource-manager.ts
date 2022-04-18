import { Model } from "../models/model"
import { Skin } from "../models/skin"
import { Animation } from "../models/animation"
import { loadAnimationFromURL, loadModelFromURL, loadSkinFromURL, loadTexture } from "./loaders"
import { Services } from "./services"

export enum ResourceType {
    Texture,
    Model,
    Skin,
    Animation,
}

// TODO implement cache
export class ResourceManager {
    private getUrl(name: string, ext: string): string {
        return `build/${name}.${ext}`
    }

    async requireTexture(name: string): Promise<WebGLTexture> {
        return loadTexture(Services.render.gl, this.getUrl(name, "png"))
    }

    async requireModel(name: string): Promise<Model> {
        return loadModelFromURL(Services.render.gl, this.getUrl(name, "mdl"))
    }

    async requireSkin(name: string): Promise<Skin> {
        return loadSkinFromURL(Services.render.gl, this.getUrl(name, "skn"))
    }

    async requireAnimation(name: string): Promise<Animation> {
        return loadAnimationFromURL(this.getUrl(name, "anm"))
    }
}
