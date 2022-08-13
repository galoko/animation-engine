import { RenderContext } from "../render/render-context"
import { Mesh, RefCountingResource, Texture } from "../render/render-data"
import { loadMeshFromURL, loadTexture } from "./loaders"

export class ResourceManager {
    static readonly meshes = new Map<string, Mesh>()
    static readonly textures = new Map<string, Texture>()

    static init(): void {
        //
    }

    // mesh

    static async requestMesh(meshName: string): Promise<Mesh> {
        return ResourceManager.request(
            meshName,
            this.meshes,
            (name: string): Promise<RefCountingResource> =>
                loadMeshFromURL(RenderContext.gl, `/build/${name}.mdl`)
        ) as unknown as Promise<Mesh>
    }

    static freeMesh(meshName: string): void {
        ResourceManager.free(meshName, this.meshes)
    }

    // texture

    static async requestTexture(textureName: string): Promise<Texture> {
        return ResourceManager.request(
            textureName,
            this.textures,
            (name: string): Promise<RefCountingResource> =>
                loadTexture(RenderContext.gl, `/build/${name}`)
        ) as unknown as Promise<Texture>
    }

    static freeTexture(textureName: string): void {
        ResourceManager.free(textureName, this.textures)
    }

    // generic request/free

    private static async request(
        name: string,
        map: Map<string, RefCountingResource>,
        promiseSupplier: (name: string) => Promise<RefCountingResource>
    ): Promise<RefCountingResource> {
        let res = map.get(name)
        if (res === undefined) {
            res = await promiseSupplier(name)
            map.set(name, res)
        }
        res.incRef()

        return res
    }

    private static free(name: string, map: Map<string, RefCountingResource>): void {
        const res = map.get(name)
        if (res === undefined) {
            throw new Error(`Resource ${name} is not loaded and can't be freed.`)
        }

        if (res.decRef() === 0) {
            map.delete(name)
        }
    }

    static finalize(): void {
        //
    }
}
