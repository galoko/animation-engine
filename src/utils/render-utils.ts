export type CompiledShader = {
    program: WebGLProgram
    [key: string]: WebGLUniformLocation | number
}

export function compileShader(
    gl: WebGLRenderingContext,
    vertText: string,
    fragText: string,
    parameters: Array<string>
): CompiledShader {
    const vertexShader = gl.createShader(gl.VERTEX_SHADER)!
    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER)!

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

    const program = gl.createProgram()!
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

    const result = { program }

    parameters.forEach((parameter: string): void => {
        const uniformLocation = gl.getUniformLocation(program, parameter)
        if (uniformLocation !== null) {
            result[parameter] = uniformLocation
        } else {
            const attributeLocation = gl.getAttribLocation(program, parameter)
            if (attributeLocation !== -1) {
                result[parameter] = attributeLocation
            } else {
                console.warn(`${parameter} is not found in shader.`)
            }
        }
    })

    return result
}

function glEnumToString(gl: WebGLRenderingContext, value: number): string {
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

function createGLErrorWrapper(context: WebGLRenderingContext, fname: string) {
    return function (...rest) {
        // eslint-disable-next-line prefer-spread
        const rv = context[fname].apply(context, rest)
        const err = context.getError()
        if (err !== context.NO_ERROR)
            throw "GL error " + glEnumToString(context, err) + " in " + fname
        return rv
    }
}

export function create3DContextWithWrapperThatThrowsOnGLError(
    context: WebGLRenderingContext
): WebGLRenderingContext {
    const wrap = {
        getError: function () {
            return context.getError()
        },
    }
    for (const i in context) {
        if (typeof context[i] === "function") {
            wrap[i] = createGLErrorWrapper(context, i)
        } else {
            wrap[i] = context[i]
        }
    }

    return wrap as WebGLRenderingContext
}
