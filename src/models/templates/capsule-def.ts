import { quat } from "gl-matrix"
import { cloneTransform, TransformData } from "../../components/transformComponent"
import { Services } from "../../managers/services"
import { Model } from "../model"
import { ModelDef, ModelDefEntry } from "../model-def"

export class CapsuleModelDef extends ModelDef {
    private halfSphere: Model | undefined
    private cylinder: Model | undefined

    private entries: ModelDefEntry[]

    constructor() {
        super()
        this.loadModels()
    }

    async loadModels(): Promise<void> {
        const [halfSphere, cylinder] = await Promise.all([
            Services.resources.requireModel("half_sphere"),
            Services.resources.requireModel("cylinder"),
        ])

        this.entries = [
            { model: halfSphere, transform: undefined! },
            { model: cylinder, transform: undefined! },
            { model: halfSphere, transform: undefined! },
        ]
    }

    update(transform: TransformData): void {
        const height = transform.size[2]

        this.entries[0].transform = cloneTransform(transform)
        this.entries[0].transform.size[2] = 1
        this.entries[0].transform.pos[2] += (height - 1) / 2

        this.entries[1].transform = cloneTransform(transform)
        this.entries[1].transform.size[2] -= 1

        this.entries[2].transform = cloneTransform(transform)
        this.entries[2].transform.size[2] = 1

        const q = quat.create()
        quat.fromEuler(q, 180, 0, 0)
        quat.mul(this.entries[2].transform.rotation, this.entries[2].transform.rotation, q)

        this.entries[2].transform.pos[2] -= (height - 1) / 2
    }

    getEntries(): ModelDefEntry[] {
        if (this.entries === undefined) {
            throw new Error("Models are not loaded.")
        }

        return this.entries
    }
}
