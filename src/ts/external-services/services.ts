import { Queues } from "../engine-bridge/queues"

export class Services {
    static init(): void {
        Queues.init()
    }

    static process(dt: number): void {
        Queues.processOutputQueue()
    }
}
