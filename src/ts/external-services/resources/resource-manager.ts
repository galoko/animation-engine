import { mat4, vec3, vec4 } from "gl-matrix"
import { wg } from "../render/render-context"
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
            (name: string): Promise<RefCountingResource> => loadMeshFromURL(`build/${name}.mdl`)
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
            (name: string): Promise<RefCountingResource> => loadTexture(`build/${name}`)
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

    static generatePlane(x: number, y: number, width: number, height: number): Mesh {
        const left = (x / wg.canvas.width) * 2 - 1
        const right = ((x + width - 1) / wg.canvas.width) * 2 - 1
        const top = (y / wg.canvas.height) * 2 - 1
        const bottom = ((y + height - 1) / wg.canvas.height) * 2 - 1

        const indices = new Uint16Array([0, 2, 1, 1, 2, 3])
        const vertices = new Float32Array([
            left,
            -top,
            0,
            0,
            0,
            1,
            0,
            0,

            right,
            -top,
            0,
            0,
            0,
            1,
            1,
            0,

            left,
            -bottom,
            0,
            0,
            0,
            1,
            0,
            1,

            right,
            -bottom,
            0,
            0,
            0,
            1,
            1,
            1,
        ])

        const model = new Mesh(vertices, indices)

        return model
    }

    static generateCubeFromTransform(
        transform: mat4,
        r: number,
        b: number,
        min_z = 0,
        max_z = 1
    ): Mesh {
        const templateVertices = [
            1, -1, 1, 0, 1, -1, -1, 0, 1, 0, 1, -1, 0, 0, 0, -1, -1, 1, 0, 1, -1, 1, 0, 1, 0, -1,
            -1, 0, 0, 0, -1, 1, 1, 1, 1, 1, 1, 0, 0, 0, -1, 1, 0, 1, 0, 1, 1, 1, 1, 1, 1, -1, 0, 0,
            0, 1, 1, 0, 1, 0, -1, 1, 0, 1, 1, 1, -1, 0, 0, 0, -1, -1, 0, 0, 1, -1, -1, 1, 0, 1, 1,
            1, 1, 1, 0, -1, 1, 1, 1, 1, -1, -1, 1, 1, 1, -1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, -1, 1, 0,
            1, 1, 1, 0, 1, 0, 1, -1, 1, 0, 0,
        ]
        const vertices = [] as number[]

        const vec = vec4.create()
        for (let i = 0; i < templateVertices.length; i += 5) {
            const x = templateVertices[i + 0]
            const y = templateVertices[i + 1]
            const z = min_z + templateVertices[i + 2] * (max_z - min_z)

            vec4.set(vec, -x, -y, max_z - z, 1)

            vec4.transformMat4(vec, vec, transform)
            vec4.scale(vec, vec, 1 / vec[3])

            vertices.push(vec[0], vec[1], vec[2], 0, 0, 0, r, b)
        }

        const indices = new Uint16Array([
            0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 0, 18, 1, 3, 19, 4, 6, 20,
            7, 9, 21, 10, 12, 22, 13, 15, 23, 16,
        ])

        const getPoint = (i: number) =>
            vec3.fromValues(vertices[i * 8 + 0], vertices[i * 8 + 1], vertices[i * 8 + 2])

        const setNormal = (i: number, n: vec3) => {
            vertices[i * 8 + 3] = n[0]
            vertices[i * 8 + 4] = n[1]
            vertices[i * 8 + 5] = n[2]
        }

        // calc normals
        for (let faceIndex = 0; faceIndex < indices.length; faceIndex += 3) {
            const p1 = getPoint(indices[faceIndex + 0])
            const p2 = getPoint(indices[faceIndex + 1])
            const p3 = getPoint(indices[faceIndex + 2])

            const u = vec3.sub(vec3.create(), p2, p1)
            const v = vec3.sub(vec3.create(), p3, p1)

            const n = vec3.create()
            n[0] = u[1] * v[2] - u[2] * v[1]
            n[1] = u[2] * v[0] - u[0] * v[2]
            n[2] = u[0] * v[1] - u[1] * v[0]

            setNormal(indices[faceIndex + 0], n)
            setNormal(indices[faceIndex + 1], n)
            setNormal(indices[faceIndex + 2], n)
        }

        const model = new Mesh(new Float32Array(vertices), indices)

        return model
    }
}
