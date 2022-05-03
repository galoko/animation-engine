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
    private pendingList: Map<string, Promise<unknown>> = new Map()

    private getUrl(name: string, ext: string): string {
        return `build/${name}.${ext}`
    }

    async require<T>(url: string, requestMaker: () => Promise<T>): Promise<T> {
        let promise = this.pendingList.get(url)
        if (promise === undefined) {
            promise = requestMaker()
            this.pendingList.set(url, promise)
        }

        return promise as Promise<T>
    }

    async requireTexture(name: string): Promise<WebGLTexture> {
        let ext = "png"

        const extIndex = name.lastIndexOf(".")
        if (extIndex !== -1) {
            ext = name.slice(extIndex + 1)
            name = name.slice(0, extIndex)
        }

        const url = this.getUrl(name, ext)

        return this.require(url, () =>
            loadTexture(Services.render.gl, Services.render.anisotropic, url)
        )
    }

    async requireModel(name: string): Promise<Model> {
        const url = this.getUrl(name, "mdl")
        return this.require(url, () => loadModelFromURL(Services.render.gl, url))
    }

    async requireSkin(name: string): Promise<Skin> {
        const url = this.getUrl(name, "skn")
        return this.require(url, () => loadSkinFromURL(Services.render.gl, url))
    }

    async requireAnimation(name: string): Promise<Animation> {
        const url = this.getUrl(name, "anm")
        return this.require(url, () => loadAnimationFromURL(url))
    }

    async waitForLoading(): Promise<void> {
        return Promise.all(this.pendingList.values()) as unknown as Promise<void>
    }
}
