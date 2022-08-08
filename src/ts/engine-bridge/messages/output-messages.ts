import { OutputMessage, OutputMessageId, registerOutputClass } from "../queue-messages"

class TestCallback extends OutputMessage {
    static ID = OutputMessageId.TEST_CALLBACK

    test_num: number | undefined
    test_str_ptr: number | undefined
    test_callback_ptr: number | undefined

    deserialize(): void {
        this.test_num = this.readU32()
        this.test_str_ptr = this.readU32()
        this.test_callback_ptr = this.readU32()
    }

    apply(): void {
        debugger
    }
}

registerOutputClass(TestCallback)
