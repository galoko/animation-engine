import { InputMessageId } from "../queue-messages"
import { SeekablePtr, writeFloat, writeU32 } from "../read-write-utils"

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

export const CODE_TO_KEY: {
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

export function KeyboardKeyMessage(id: InputMessageId, ptr: SeekablePtr, key: KeyboardKey): void {
    writeU32(ptr, key as number)
}

enum MouseButton {
    NONE = 0,
    LEFT,
    MIDDLE,
    RIGHT,
}

export const CODE_TO_BUTTON: {
    [key: string]: MouseButton | undefined
} = {
    0: MouseButton.LEFT,
    1: MouseButton.MIDDLE,
    2: MouseButton.RIGHT,
}

export function MouseButtonMessage(
    id: InputMessageId,
    ptr: SeekablePtr,
    button: MouseButton,
    x: number,
    y: number,
    dx: number,
    dy: number,
    isCaptured: boolean
): void {
    writeU32(ptr, button)
    writeFloat(ptr, x)
    writeFloat(ptr, y)
    writeFloat(ptr, dx)
    writeFloat(ptr, dy)
    writeU32(ptr, isCaptured ? 1 : 0)
}
