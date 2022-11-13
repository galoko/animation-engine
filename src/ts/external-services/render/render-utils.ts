import { gl } from "./render-context"

export interface WebGLProgramWithUniforms extends WebGLProgram {
    [key: string]: WebGLUniformLocation
}

export function compileShader(
    vertText: string,
    fragText: string,
    uboMap: {
        [key: string]: number
    },
    unifroms: Array<string>
): WebGLProgramWithUniforms {
    const vertexShader = gl.createShader(gl.VERTEX_SHADER)
    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER)

    if (!vertexShader || !fragmentShader) {
        throw new Error("Cannot create shaders.")
    }

    gl.shaderSource(vertexShader, vertText)
    gl.shaderSource(fragmentShader, fragText)

    gl.compileShader(vertexShader)
    if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
        throw new Error(
            `ERROR compiling vertex shader for ${name}! ${gl.getShaderInfoLog(vertexShader)}`
        )
    }

    gl.compileShader(fragmentShader)
    if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
        throw new Error(
            `ERROR compiling fragment shader for ${name}! ${gl.getShaderInfoLog(fragmentShader)}`
        )
    }

    const program = gl.createProgram() as WebGLProgramWithUniforms
    if (!program) {
        throw new Error("Cannot create program")
    }

    gl.attachShader(program, vertexShader)
    gl.attachShader(program, fragmentShader)
    gl.linkProgram(program)
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        throw new Error(`ERROR linking program! ${gl.getProgramInfoLog(program)}`)
    }
    gl.validateProgram(program)
    if (!gl.getProgramParameter(program, gl.VALIDATE_STATUS)) {
        throw new Error(`ERROR validating program! ${gl.getProgramInfoLog(program)}`)
    }

    for (const [name, index] of Object.entries(uboMap)) {
        const uboIndex = gl.getUniformBlockIndex(program, name)
        gl.uniformBlockBinding(program, uboIndex, index)
    }

    for (const uniform of unifroms) {
        const uniformLocation = gl.getUniformLocation(program, uniform)
        if (uniformLocation) {
            program[uniform] = uniformLocation
        }
    }

    return program
}

type Context = {
    [key: string]: unknown
} & WebGL2RenderingContext

type ContextMethod = (...args: unknown[]) => unknown

function glEnumToString(gl: Context, value: number): string {
    // Optimization for the most common enum:
    if (value === gl.NO_ERROR) {
        return "NO_ERROR"
    }
    for (const p in gl) {
        if (gl[p] === value) {
            return p
        }
    }
    return "0x" + value.toString(16)
}

function createGLErrorWrapper(context: WebGL2RenderingContext, fname: string) {
    return (...args: unknown[]) => {
        const ctx = context as unknown as Context
        const f = ctx[fname] as ContextMethod
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        const rv = f.apply(ctx, args)
        const err = context.getError()
        if (err !== context.NO_ERROR) throw "GL error " + glEnumToString(ctx, err) + " in " + fname
        return rv
    }
}

export function create3DContextWithWrapperThatThrowsOnGLError(
    gl: WebGL2RenderingContext
): WebGL2RenderingContext {
    const context = gl as Context

    const wrap = {
        getError: function () {
            return context.getError()
        },
    } as Context

    for (const i in context) {
        if (typeof context[i] === "function") {
            wrap[i] = createGLErrorWrapper(context, i)
        } else {
            wrap[i] = context[i]
        }
    }

    return wrap as WebGL2RenderingContext
}

;(window as any).saveTexture = (texture: WebGLTexture): void => {
    const w = 2048
    const h = 2048

    const canvas = document.createElement("canvas")
    canvas.width = w
    canvas.height = h

    const ctx = canvas.getContext("2d")!
    const data = ctx.createImageData(w, h)

    // make a framebuffer
    const fb = gl.createFramebuffer()
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb)
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0)

    gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, data.data)

    gl.bindFramebuffer(gl.FRAMEBUFFER, null)

    ctx.putImageData(data, 0, 0)

    const url = canvas.toDataURL("image/png")

    const link = document.createElement("a")
    link.href = url
    link.download = "tex.png"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
}
