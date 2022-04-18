import { quat } from "gl-matrix"

export class Animation {
    constructor(readonly timings: number[], readonly values: Map<number, quat[]>) {}

    private findTimingNextIndex(s: number): number {
        let index = 1
        while (this.timings[index] <= s && index < this.timings.length) {
            index++
        }

        console.assert(index < this.timings.length)

        return index
    }

    getRotation(boneId: number, s: number): quat {
        const first = this.timings[0]
        const last = this.timings[this.timings.length - 1]
        const duration = last - first

        s = first + ((s - first) % duration)

        const rotation = quat.create()

        const rotations = this.values.get(boneId)

        if (rotations !== undefined) {
            const nextIndex = this.findTimingNextIndex(s)
            const prevIndex = nextIndex - 1

            const s0 = this.timings[prevIndex]
            const s1 = this.timings[nextIndex]

            const t = (s - s0) / (s1 - s0)

            const r0 = rotations[prevIndex]
            const r1 = rotations[nextIndex]

            quat.slerp(rotation, r0, r1, t)
        }

        return rotation
    }
}
