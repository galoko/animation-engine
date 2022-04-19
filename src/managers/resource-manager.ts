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
    private pendingList: Promise<unknown>[] = []

    private getUrl(name: string, ext: string): string {
        return `build/${name}.${ext}`
    }

    async requireTexture(name: string): Promise<WebGLTexture> {
        let ext = "png"

        const extIndex = name.lastIndexOf(".")
        if (extIndex !== -1) {
            ext = name.slice(extIndex + 1)
            name = name.slice(0, extIndex)
        }

        const promise = loadTexture(Services.render.gl, this.getUrl(name, ext))
        this.pendingList.push(promise)
        return promise
    }

    async requireModel(name: string): Promise<Model> {
        const promise = loadModelFromURL(Services.render.gl, this.getUrl(name, "mdl"))
        this.pendingList.push(promise)
        return promise
    }

    async requireSkin(name: string): Promise<Skin> {
        const promise = loadSkinFromURL(Services.render.gl, this.getUrl(name, "skn"))
        this.pendingList.push(promise)
        return promise
    }

    async requireAnimation(name: string): Promise<Animation> {
        const promise = loadAnimationFromURL(this.getUrl(name, "anm"))
        this.pendingList.push(promise)
        return promise
    }

    async waitForLoading(): Promise<void> {
        return Promise.all(this.pendingList) as unknown as Promise<void>
    }
}
