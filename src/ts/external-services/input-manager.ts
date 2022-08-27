import { InputMessage, InputMessageId } from "../engine-bridge/queue-messages"
import { Queues } from "../engine-bridge/queues"
import { RenderContext } from "./render/render-context"

enum MouseButton {
    NONE = 0,
    LEFT,
    MIDDLE,
    RIGHT,
}

const CODE_TO_BUTTON: {
    [key: string]: MouseButton | undefined
} = {
    0: MouseButton.LEFT,
    1: MouseButton.MIDDLE,
    2: MouseButton.RIGHT,
}

enum KeyboardKey {
    KEY_0 = 1,
    KEY_1,
    KEY_2,
    KEY_3,
    KEY_4,
    KEY_5,
    KEY_6,
    KEY_7,
    KEY_8,
    KEY_9,
    KEY_A,
    KEY_B,
    KEY_C,
    KEY_D,
    KEY_E,
    KEY_F,
    KEY_G,
    KEY_H,
    KEY_I,
    KEY_J,
    KEY_K,
    KEY_L,
    KEY_M,
    KEY_N,
    KEY_O,
    KEY_P,
    KEY_Q,
    KEY_R,
    KEY_S,
    KEY_T,
    KEY_U,
    KEY_V,
    KEY_W,
    KEY_X,
    KEY_Y,
    KEY_Z,
    KEY_SPACE,
    KEY_LSHIFT,
    KEY_RSHIFT,
    KEY_LCONTROL,
    KEY_RCONTROL,
}

const CODE_TO_KEY: {
    [key: string]: KeyboardKey | undefined
} = {
    Digit0: KeyboardKey.KEY_0,
    Digit1: KeyboardKey.KEY_1,
    Digit2: KeyboardKey.KEY_2,
    Digit3: KeyboardKey.KEY_3,
    Digit4: KeyboardKey.KEY_4,
    Digit5: KeyboardKey.KEY_5,
    Digit6: KeyboardKey.KEY_6,
    Digit7: KeyboardKey.KEY_7,
    Digit8: KeyboardKey.KEY_8,
    Digit9: KeyboardKey.KEY_9,
    KeyA: KeyboardKey.KEY_A,
    KeyB: KeyboardKey.KEY_B,
    KeyC: KeyboardKey.KEY_C,
    KeyD: KeyboardKey.KEY_D,
    KeyE: KeyboardKey.KEY_E,
    KeyF: KeyboardKey.KEY_F,
    KeyG: KeyboardKey.KEY_G,
    KeyH: KeyboardKey.KEY_H,
    KeyI: KeyboardKey.KEY_I,
    KeyJ: KeyboardKey.KEY_J,
    KeyK: KeyboardKey.KEY_K,
    KeyL: KeyboardKey.KEY_L,
    KeyM: KeyboardKey.KEY_M,
    KeyN: KeyboardKey.KEY_N,
    KeyO: KeyboardKey.KEY_O,
    KeyP: KeyboardKey.KEY_P,
    KeyQ: KeyboardKey.KEY_Q,
    KeyR: KeyboardKey.KEY_R,
    KeyS: KeyboardKey.KEY_S,
    KeyT: KeyboardKey.KEY_T,
    KeyU: KeyboardKey.KEY_U,
    KeyV: KeyboardKey.KEY_V,
    KeyW: KeyboardKey.KEY_W,
    KeyX: KeyboardKey.KEY_X,
    KeyY: KeyboardKey.KEY_Y,
    KeyZ: KeyboardKey.KEY_Z,
    Space: KeyboardKey.KEY_SPACE,
    ShiftLeft: KeyboardKey.KEY_LSHIFT,
    ShiftRight: KeyboardKey.KEY_RSHIFT,
    ControlLeft: KeyboardKey.KEY_LCONTROL,
    ControlRight: KeyboardKey.KEY_RCONTROL,
}

abstract class KeyboardKeyMessage extends InputMessage {
    constructor(readonly key: KeyboardKey) {
        super()
    }

    public serialize(): void {
        this.writeU32(this.key)
    }
}

class KeyboardDownMessage extends KeyboardKeyMessage {
    static ID = InputMessageId.KEY_DOWN
}

class KeyboardUpMessage extends KeyboardKeyMessage {
    static ID = InputMessageId.KEY_UP
}

abstract class MouseButtonMessage extends InputMessage {
    constructor(
        readonly button: MouseButton,
        readonly x: number,
        readonly y: number,
        readonly dx: number,
        readonly dy: number,
        readonly isCaptured: boolean
    ) {
        super()
    }

    public serialize(): void {
        this.writeU32(this.button)
        this.writeFloat(this.x)
        this.writeFloat(this.y)
        this.writeFloat(this.dx)
        this.writeFloat(this.dy)
        this.writeU32(this.isCaptured ? 1 : 0)
    }
}

class MouseDownMessage extends MouseButtonMessage {
    static ID = InputMessageId.MOUSE_DOWN
}

class MouseMoveMessage extends MouseButtonMessage {
    static ID = InputMessageId.MOUSE_MOVE
}

class MouseUpMessage extends MouseButtonMessage {
    static ID = InputMessageId.MOUSE_UP
}

export class InputManager {
    private static readonly canvas = RenderContext.canvasWebGL

    static init(): void {
        InputManager.attachEvents()
    }

    static finalize(): void {
        //
    }

    private static attachEvents() {
        const { canvas } = InputManager

        canvas.addEventListener("click", InputManager.clickHandler)

        canvas.addEventListener("mousemove", InputManager.mouseHandler, { passive: true })
        canvas.addEventListener("mouseup", InputManager.mouseHandler, { passive: true })
        canvas.addEventListener("mousedown", InputManager.mouseHandler, { passive: true })

        window.addEventListener("keyup", InputManager.keyHandler)
        window.addEventListener("keydown", InputManager.keyHandler)
    }

    private static clickHandler(): void {
        InputManager.canvas.requestPointerLock()
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

        const isCaptured = document.pointerLockElement === InputManager.canvas

        const clazz = {
            mousedown: MouseDownMessage,
            mousemove: MouseMoveMessage,
            mouseup: MouseUpMessage,
        }[e.type]

        if (clazz) {
            Queues.pushMessage(new clazz(button, x, y, dx, dy, isCaptured))
        }
    }

    private static keyHandler(e: KeyboardEvent): void {
        const key = CODE_TO_KEY[e.code]
        if (key === undefined) {
            // key is not supported
            return
        }

        const clazz = {
            keydown: KeyboardDownMessage,
            keyup: KeyboardUpMessage,
        }[e.type]

        if (clazz) {
            Queues.pushMessage(new clazz(key))
        }
    }
}
