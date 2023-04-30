import {
    CODE_TO_BUTTON,
    CODE_TO_KEY,
    KeyboardKeyMessage,
    MouseButtonMessage,
} from "../engine-bridge/messages/input-messages"
import { InputMessageId } from "../engine-bridge/queue-messages"
import { Queues } from "../engine-bridge/queues"
import { canvasWebGPU } from "./render/render-context"

export class InputManager {
    static init(): void {
        InputManager.attachEvents()
    }

    static finalize(): void {
        //
    }

    private static attachEvents() {
        canvasWebGPU.addEventListener("click", InputManager.clickHandler)

        canvasWebGPU.addEventListener("mousemove", InputManager.mouseHandler, { passive: true })
        canvasWebGPU.addEventListener("mouseup", InputManager.mouseHandler, { passive: true })
        canvasWebGPU.addEventListener("mousedown", InputManager.mouseHandler, { passive: true })

        window.addEventListener("keyup", InputManager.keyHandler)
        window.addEventListener("keydown", InputManager.keyHandler)
    }

    private static clickHandler(): void {
        canvasWebGPU.requestPointerLock()
    }

    private static mouseHandler(e: MouseEvent): void {
        const button = CODE_TO_BUTTON[e.button]
        if (button === undefined) {
            // button is not supported
            return
        }

        const x = e.clientX * devicePixelRatio
        const y = e.clientY * devicePixelRatio

        const dx = e.movementX * devicePixelRatio
        const dy = e.movementY * devicePixelRatio

        const isCaptured = document.pointerLockElement === canvasWebGPU

        const id = {
            mousedown: InputMessageId.MOUSE_DOWN,
            mousemove: InputMessageId.MOUSE_MOVE,
            mouseup: InputMessageId.MOUSE_UP,
        }[e.type]

        if (id !== undefined) {
            Queues.pushMessage(id, MouseButtonMessage, button, x, y, dx, dy, isCaptured)
        }
    }

    private static keyHandler(e: KeyboardEvent): void {
        const key = CODE_TO_KEY[e.code]
        if (key === undefined) {
            // key is not supported
            return
        }

        const id = {
            keydown: InputMessageId.KEY_DOWN,
            keyup: InputMessageId.KEY_UP,
        }[e.type]

        if (id !== undefined) {
            Queues.pushMessage(id, KeyboardKeyMessage, key)
        }
    }
}
