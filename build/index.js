
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
'use strict';

function compileShader(gl, vertText, fragText, parameters) {
    const vertexShader = gl.createShader(gl.VERTEX_SHADER);
    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(vertexShader, vertText);
    gl.shaderSource(fragmentShader, fragText);
    gl.compileShader(vertexShader);
    if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
        throw new Error(`ERROR compiling vertex shader for ${name}! ${gl.getShaderInfoLog(vertexShader)}`);
    }
    gl.compileShader(fragmentShader);
    if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
        throw new Error(`ERROR compiling fragment shader for ${name}! ${gl.getShaderInfoLog(fragmentShader)}`);
    }
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        throw new Error(`ERROR linking program! ${gl.getProgramInfoLog(program)}`);
    }
    gl.validateProgram(program);
    if (!gl.getProgramParameter(program, gl.VALIDATE_STATUS)) {
        throw new Error(`ERROR validating program! ${gl.getProgramInfoLog(program)}`);
    }
    const result = { program };
    parameters.forEach((parameter) => {
        const uniformLocation = gl.getUniformLocation(program, parameter);
        if (uniformLocation !== null) {
            result[parameter] = uniformLocation;
        }
        else {
            const attributeLocation = gl.getAttribLocation(program, parameter);
            if (attributeLocation !== -1) {
                result[parameter] = attributeLocation;
            }
            else {
                console.warn(`${parameter} is not found in shader.`);
            }
        }
    });
    return result;
}
function glEnumToString(gl, value) {
    // Optimization for the most common enum:
    if (value === gl.NO_ERROR) {
        return "NO_ERROR";
    }
    for (const p in gl) {
        if (gl[p] === value) {
            return p;
        }
    }
    return "0x" + value.toString(16);
}
function createGLErrorWrapper(context, fname) {
    return function (...rest) {
        // eslint-disable-next-line prefer-spread
        const rv = context[fname].apply(context, rest);
        const err = context.getError();
        if (err !== context.NO_ERROR)
            throw "GL error " + glEnumToString(context, err) + " in " + fname;
        return rv;
    };
}
function create3DContextWithWrapperThatThrowsOnGLError(context) {
    const wrap = {
        getError: function () {
            return context.getError();
        },
    };
    for (const i in context) {
        if (typeof context[i] === "function") {
            wrap[i] = createGLErrorWrapper(context, i);
        }
        else {
            wrap[i] = context[i];
        }
    }
    return wrap;
}

var generalVert = "attribute vec3 p;\r\nattribute vec3 n;\r\n\r\nuniform mat4 mvp;\r\n\r\nvarying highp vec3 normal;\r\n\r\nvoid main(void) {\r\n    gl_Position = mvp * vec4(p, 1.0);\r\n    normal = n;\r\n}";

var generalFrag = "varying lowp vec3 normal;\r\n\r\nvoid main(void) {\r\n    gl_FragColor = vec4(normal, 1.0);\r\n}";

var objectsVert = "attribute vec3 p;\r\nattribute vec3 n;\r\nattribute vec2 uv;\r\n\r\nuniform mat4 mvp;\r\nuniform mat4 model;\r\nuniform float texMul;\r\n\r\nvarying highp vec2 texCoord;\r\nvarying highp vec3 normal;\r\n\r\nvoid main(void) {\r\n    gl_Position = mvp * vec4(p, 1.0);\r\n\r\n    texCoord = uv * texMul;\r\n    normal = (model * vec4(n, 0.0)).xyz;\r\n}";

var objectsFrag = "precision highp float;\r\n\r\nvarying highp vec2 texCoord;\r\nvarying highp vec3 normal;\r\n\r\nuniform sampler2D texture;\r\nuniform float useTexture;\r\nuniform vec4 color;\r\n\r\nvoid main(void) {\r\n    vec3 lightDir = normalize(vec3(0.656, 0.3, 0.14));\r\n    vec3 lightColor = vec3(1.0);\r\n\r\n    float diff = max(dot(normal, lightDir), 0.0);\r\n    vec3 diffuse = diff * lightColor;\r\n\r\n    float ambient = 0.5;\r\n    vec4 objectColor = useTexture > 0.5 ? texture2D(texture, texCoord) : color;\r\n    gl_FragColor = vec4(min(ambient + diffuse, 1.0) * objectColor.rgb, objectColor.a);\r\n}";

var coloredVert = "attribute vec3 p;\r\nattribute vec3 c;\r\n\r\nuniform mat4 mvp;\r\nvarying highp vec3 color;\r\n\r\nvoid main(void) {\r\n    gl_Position = mvp * vec4(p, 1.0);\r\n\r\n    color = c;\r\n}";

var coloredFrag = "precision highp float;\r\n\r\nvarying highp vec3 color;\r\n\r\nvoid main(void) {\r\n    gl_FragColor = vec4(color, 1.0);\r\n}";

var skinningVert = "attribute vec3 p;\r\nattribute vec3 n;\r\nattribute vec2 uv;\r\n\r\nattribute vec4 w;\r\nattribute vec4 j;\r\n\r\nuniform mat4 mvp;\r\nuniform sampler2D matrices;\r\n\r\nvarying highp vec2 texCoord;\r\nvarying highp vec3 normal;\r\n\r\nmat4 getJointMatrix(float j) {\r\n    float v0 = (j * 4.0 + 0.5) / 1024.0;\r\n    float v1 = (j * 4.0 + 1.5) / 1024.0;\r\n    float v2 = (j * 4.0 + 2.5) / 1024.0;\r\n    float v3 = (j * 4.0 + 3.5) / 1024.0;\r\n\r\n    vec4 p0 = texture2D(matrices, vec2(v0, 0.5));\r\n    vec4 p1 = texture2D(matrices, vec2(v1, 0.5));\r\n    vec4 p2 = texture2D(matrices, vec2(v2, 0.5));\r\n    vec4 p3 = texture2D(matrices, vec2(v3, 0.5));\r\n\r\n    return mat4(p0, p1, p2, p3);\r\n}\r\n\r\nvoid main(void) {\r\n    mat4 skinningMatrix =\r\n        getJointMatrix(j[0]) * w[0] +\r\n        getJointMatrix(j[1]) * w[1] +\r\n        getJointMatrix(j[2]) * w[2] +\r\n        getJointMatrix(j[3]) * w[3];\r\n\r\n    gl_Position = mvp * skinningMatrix * vec4(p, 1.0);\r\n\r\n    texCoord = uv;\r\n    normal = (skinningMatrix * vec4(n, 0.0)).xyz;\r\n}";

var skinningFrag = "precision highp float;\r\n\r\nvarying highp vec2 texCoord;\r\nvarying highp vec3 normal;\r\n\r\nuniform sampler2D texture;\r\n\r\nvoid main(void) {\r\n    vec3 lightDir = vec3(0, 0, 1);\r\n    vec3 lightColor = vec3(1.0);\r\n\r\n    float diff = max(dot(normal, lightDir), 0.0);\r\n    vec3 diffuse = diff * lightColor;\r\n\r\n    float ambient = 0.5;\r\n    vec3 objectColor = texture2D(texture, texCoord).rgb;\r\n    vec3 result = min(ambient + diffuse, 1.0) * objectColor;\r\n\r\n    gl_FragColor = vec4(result, 1.0);\r\n}";

/**
 * Common utilities
 * @module glMatrix
 */
// Configuration Constants
var EPSILON = 0.000001;
var ARRAY_TYPE = typeof Float32Array !== 'undefined' ? Float32Array : Array;
var RANDOM = Math.random;
/**
 * Sets the type of array used when creating new vectors and matrices
 *
 * @param {Float32ArrayConstructor | ArrayConstructor} type Array type, such as Float32Array or Array
 */

function setMatrixArrayType(type) {
  ARRAY_TYPE = type;
}
var degree = Math.PI / 180;
/**
 * Convert Degree To Radian
 *
 * @param {Number} a Angle in Degrees
 */

function toRadian(a) {
  return a * degree;
}
/**
 * Tests whether or not the arguments have approximately the same value, within an absolute
 * or relative tolerance of glMatrix.EPSILON (an absolute tolerance is used for values less
 * than or equal to 1.0, and a relative tolerance is used for larger values)
 *
 * @param {Number} a The first number to test.
 * @param {Number} b The second number to test.
 * @returns {Boolean} True if the numbers are approximately equal, false otherwise.
 */

function equals$9(a, b) {
  return Math.abs(a - b) <= EPSILON * Math.max(1.0, Math.abs(a), Math.abs(b));
}
if (!Math.hypot) Math.hypot = function () {
  var y = 0,
      i = arguments.length;

  while (i--) {
    y += arguments[i] * arguments[i];
  }

  return Math.sqrt(y);
};

var common = /*#__PURE__*/Object.freeze({
    __proto__: null,
    EPSILON: EPSILON,
    get ARRAY_TYPE () { return ARRAY_TYPE; },
    RANDOM: RANDOM,
    setMatrixArrayType: setMatrixArrayType,
    toRadian: toRadian,
    equals: equals$9
});

/**
 * 2x2 Matrix
 * @module mat2
 */

/**
 * Creates a new identity mat2
 *
 * @returns {mat2} a new 2x2 matrix
 */

function create$8() {
  var out = new ARRAY_TYPE(4);

  if (ARRAY_TYPE != Float32Array) {
    out[1] = 0;
    out[2] = 0;
  }

  out[0] = 1;
  out[3] = 1;
  return out;
}
/**
 * Creates a new mat2 initialized with values from an existing matrix
 *
 * @param {ReadonlyMat2} a matrix to clone
 * @returns {mat2} a new 2x2 matrix
 */

function clone$8(a) {
  var out = new ARRAY_TYPE(4);
  out[0] = a[0];
  out[1] = a[1];
  out[2] = a[2];
  out[3] = a[3];
  return out;
}
/**
 * Copy the values from one mat2 to another
 *
 * @param {mat2} out the receiving matrix
 * @param {ReadonlyMat2} a the source matrix
 * @returns {mat2} out
 */

function copy$8(out, a) {
  out[0] = a[0];
  out[1] = a[1];
  out[2] = a[2];
  out[3] = a[3];
  return out;
}
/**
 * Set a mat2 to the identity matrix
 *
 * @param {mat2} out the receiving matrix
 * @returns {mat2} out
 */

function identity$5(out) {
  out[0] = 1;
  out[1] = 0;
  out[2] = 0;
  out[3] = 1;
  return out;
}
/**
 * Create a new mat2 with the given values
 *
 * @param {Number} m00 Component in column 0, row 0 position (index 0)
 * @param {Number} m01 Component in column 0, row 1 position (index 1)
 * @param {Number} m10 Component in column 1, row 0 position (index 2)
 * @param {Number} m11 Component in column 1, row 1 position (index 3)
 * @returns {mat2} out A new 2x2 matrix
 */

function fromValues$8(m00, m01, m10, m11) {
  var out = new ARRAY_TYPE(4);
  out[0] = m00;
  out[1] = m01;
  out[2] = m10;
  out[3] = m11;
  return out;
}
/**
 * Set the components of a mat2 to the given values
 *
 * @param {mat2} out the receiving matrix
 * @param {Number} m00 Component in column 0, row 0 position (index 0)
 * @param {Number} m01 Component in column 0, row 1 position (index 1)
 * @param {Number} m10 Component in column 1, row 0 position (index 2)
 * @param {Number} m11 Component in column 1, row 1 position (index 3)
 * @returns {mat2} out
 */

function set$8(out, m00, m01, m10, m11) {
  out[0] = m00;
  out[1] = m01;
  out[2] = m10;
  out[3] = m11;
  return out;
}
/**
 * Transpose the values of a mat2
 *
 * @param {mat2} out the receiving matrix
 * @param {ReadonlyMat2} a the source matrix
 * @returns {mat2} out
 */

function transpose$2(out, a) {
  // If we are transposing ourselves we can skip a few steps but have to cache
  // some values
  if (out === a) {
    var a1 = a[1];
    out[1] = a[2];
    out[2] = a1;
  } else {
    out[0] = a[0];
    out[1] = a[2];
    out[2] = a[1];
    out[3] = a[3];
  }

  return out;
}
/**
 * Inverts a mat2
 *
 * @param {mat2} out the receiving matrix
 * @param {ReadonlyMat2} a the source matrix
 * @returns {mat2} out
 */

function invert$5(out, a) {
  var a0 = a[0],
      a1 = a[1],
      a2 = a[2],
      a3 = a[3]; // Calculate the determinant

  var det = a0 * a3 - a2 * a1;

  if (!det) {
    return null;
  }

  det = 1.0 / det;
  out[0] = a3 * det;
  out[1] = -a1 * det;
  out[2] = -a2 * det;
  out[3] = a0 * det;
  return out;
}
/**
 * Calculates the adjugate of a mat2
 *
 * @param {mat2} out the receiving matrix
 * @param {ReadonlyMat2} a the source matrix
 * @returns {mat2} out
 */

function adjoint$2(out, a) {
  // Caching this value is nessecary if out == a
  var a0 = a[0];
  out[0] = a[3];
  out[1] = -a[1];
  out[2] = -a[2];
  out[3] = a0;
  return out;
}
/**
 * Calculates the determinant of a mat2
 *
 * @param {ReadonlyMat2} a the source matrix
 * @returns {Number} determinant of a
 */

function determinant$3(a) {
  return a[0] * a[3] - a[2] * a[1];
}
/**
 * Multiplies two mat2's
 *
 * @param {mat2} out the receiving matrix
 * @param {ReadonlyMat2} a the first operand
 * @param {ReadonlyMat2} b the second operand
 * @returns {mat2} out
 */

function multiply$8(out, a, b) {
  var a0 = a[0],
      a1 = a[1],
      a2 = a[2],
      a3 = a[3];
  var b0 = b[0],
      b1 = b[1],
      b2 = b[2],
      b3 = b[3];
  out[0] = a0 * b0 + a2 * b1;
  out[1] = a1 * b0 + a3 * b1;
  out[2] = a0 * b2 + a2 * b3;
  out[3] = a1 * b2 + a3 * b3;
  return out;
}
/**
 * Rotates a mat2 by the given angle
 *
 * @param {mat2} out the receiving matrix
 * @param {ReadonlyMat2} a the matrix to rotate
 * @param {Number} rad the angle to rotate the matrix by
 * @returns {mat2} out
 */

function rotate$4(out, a, rad) {
  var a0 = a[0],
      a1 = a[1],
      a2 = a[2],
      a3 = a[3];
  var s = Math.sin(rad);
  var c = Math.cos(rad);
  out[0] = a0 * c + a2 * s;
  out[1] = a1 * c + a3 * s;
  out[2] = a0 * -s + a2 * c;
  out[3] = a1 * -s + a3 * c;
  return out;
}
/**
 * Scales the mat2 by the dimensions in the given vec2
 *
 * @param {mat2} out the receiving matrix
 * @param {ReadonlyMat2} a the matrix to rotate
 * @param {ReadonlyVec2} v the vec2 to scale the matrix by
 * @returns {mat2} out
 **/

function scale$8(out, a, v) {
  var a0 = a[0],
      a1 = a[1],
      a2 = a[2],
      a3 = a[3];
  var v0 = v[0],
      v1 = v[1];
  out[0] = a0 * v0;
  out[1] = a1 * v0;
  out[2] = a2 * v1;
  out[3] = a3 * v1;
  return out;
}
/**
 * Creates a matrix from a given angle
 * This is equivalent to (but much faster than):
 *
 *     mat2.identity(dest);
 *     mat2.rotate(dest, dest, rad);
 *
 * @param {mat2} out mat2 receiving operation result
 * @param {Number} rad the angle to rotate the matrix by
 * @returns {mat2} out
 */

function fromRotation$4(out, rad) {
  var s = Math.sin(rad);
  var c = Math.cos(rad);
  out[0] = c;
  out[1] = s;
  out[2] = -s;
  out[3] = c;
  return out;
}
/**
 * Creates a matrix from a vector scaling
 * This is equivalent to (but much faster than):
 *
 *     mat2.identity(dest);
 *     mat2.scale(dest, dest, vec);
 *
 * @param {mat2} out mat2 receiving operation result
 * @param {ReadonlyVec2} v Scaling vector
 * @returns {mat2} out
 */

function fromScaling$3(out, v) {
  out[0] = v[0];
  out[1] = 0;
  out[2] = 0;
  out[3] = v[1];
  return out;
}
/**
 * Returns a string representation of a mat2
 *
 * @param {ReadonlyMat2} a matrix to represent as a string
 * @returns {String} string representation of the matrix
 */

function str$8(a) {
  return "mat2(" + a[0] + ", " + a[1] + ", " + a[2] + ", " + a[3] + ")";
}
/**
 * Returns Frobenius norm of a mat2
 *
 * @param {ReadonlyMat2} a the matrix to calculate Frobenius norm of
 * @returns {Number} Frobenius norm
 */

function frob$3(a) {
  return Math.hypot(a[0], a[1], a[2], a[3]);
}
/**
 * Returns L, D and U matrices (Lower triangular, Diagonal and Upper triangular) by factorizing the input matrix
 * @param {ReadonlyMat2} L the lower triangular matrix
 * @param {ReadonlyMat2} D the diagonal matrix
 * @param {ReadonlyMat2} U the upper triangular matrix
 * @param {ReadonlyMat2} a the input matrix to factorize
 */

function LDU(L, D, U, a) {
  L[2] = a[2] / a[0];
  U[0] = a[0];
  U[1] = a[1];
  U[3] = a[3] - L[2] * U[1];
  return [L, D, U];
}
/**
 * Adds two mat2's
 *
 * @param {mat2} out the receiving matrix
 * @param {ReadonlyMat2} a the first operand
 * @param {ReadonlyMat2} b the second operand
 * @returns {mat2} out
 */

function add$8(out, a, b) {
  out[0] = a[0] + b[0];
  out[1] = a[1] + b[1];
  out[2] = a[2] + b[2];
  out[3] = a[3] + b[3];
  return out;
}
/**
 * Subtracts matrix b from matrix a
 *
 * @param {mat2} out the receiving matrix
 * @param {ReadonlyMat2} a the first operand
 * @param {ReadonlyMat2} b the second operand
 * @returns {mat2} out
 */

function subtract$6(out, a, b) {
  out[0] = a[0] - b[0];
  out[1] = a[1] - b[1];
  out[2] = a[2] - b[2];
  out[3] = a[3] - b[3];
  return out;
}
/**
 * Returns whether or not the matrices have exactly the same elements in the same position (when compared with ===)
 *
 * @param {ReadonlyMat2} a The first matrix.
 * @param {ReadonlyMat2} b The second matrix.
 * @returns {Boolean} True if the matrices are equal, false otherwise.
 */

function exactEquals$8(a, b) {
  return a[0] === b[0] && a[1] === b[1] && a[2] === b[2] && a[3] === b[3];
}
/**
 * Returns whether or not the matrices have approximately the same elements in the same position.
 *
 * @param {ReadonlyMat2} a The first matrix.
 * @param {ReadonlyMat2} b The second matrix.
 * @returns {Boolean} True if the matrices are equal, false otherwise.
 */

function equals$8(a, b) {
  var a0 = a[0],
      a1 = a[1],
      a2 = a[2],
      a3 = a[3];
  var b0 = b[0],
      b1 = b[1],
      b2 = b[2],
      b3 = b[3];
  return Math.abs(a0 - b0) <= EPSILON * Math.max(1.0, Math.abs(a0), Math.abs(b0)) && Math.abs(a1 - b1) <= EPSILON * Math.max(1.0, Math.abs(a1), Math.abs(b1)) && Math.abs(a2 - b2) <= EPSILON * Math.max(1.0, Math.abs(a2), Math.abs(b2)) && Math.abs(a3 - b3) <= EPSILON * Math.max(1.0, Math.abs(a3), Math.abs(b3));
}
/**
 * Multiply each element of the matrix by a scalar.
 *
 * @param {mat2} out the receiving matrix
 * @param {ReadonlyMat2} a the matrix to scale
 * @param {Number} b amount to scale the matrix's elements by
 * @returns {mat2} out
 */

function multiplyScalar$3(out, a, b) {
  out[0] = a[0] * b;
  out[1] = a[1] * b;
  out[2] = a[2] * b;
  out[3] = a[3] * b;
  return out;
}
/**
 * Adds two mat2's after multiplying each element of the second operand by a scalar value.
 *
 * @param {mat2} out the receiving vector
 * @param {ReadonlyMat2} a the first operand
 * @param {ReadonlyMat2} b the second operand
 * @param {Number} scale the amount to scale b's elements by before adding
 * @returns {mat2} out
 */

function multiplyScalarAndAdd$3(out, a, b, scale) {
  out[0] = a[0] + b[0] * scale;
  out[1] = a[1] + b[1] * scale;
  out[2] = a[2] + b[2] * scale;
  out[3] = a[3] + b[3] * scale;
  return out;
}
/**
 * Alias for {@link mat2.multiply}
 * @function
 */

var mul$8 = multiply$8;
/**
 * Alias for {@link mat2.subtract}
 * @function
 */

var sub$6 = subtract$6;

var mat2 = /*#__PURE__*/Object.freeze({
    __proto__: null,
    create: create$8,
    clone: clone$8,
    copy: copy$8,
    identity: identity$5,
    fromValues: fromValues$8,
    set: set$8,
    transpose: transpose$2,
    invert: invert$5,
    adjoint: adjoint$2,
    determinant: determinant$3,
    multiply: multiply$8,
    rotate: rotate$4,
    scale: scale$8,
    fromRotation: fromRotation$4,
    fromScaling: fromScaling$3,
    str: str$8,
    frob: frob$3,
    LDU: LDU,
    add: add$8,
    subtract: subtract$6,
    exactEquals: exactEquals$8,
    equals: equals$8,
    multiplyScalar: multiplyScalar$3,
    multiplyScalarAndAdd: multiplyScalarAndAdd$3,
    mul: mul$8,
    sub: sub$6
});

/**
 * 2x3 Matrix
 * @module mat2d
 * @description
 * A mat2d contains six elements defined as:
 * <pre>
 * [a, b,
 *  c, d,
 *  tx, ty]
 * </pre>
 * This is a short form for the 3x3 matrix:
 * <pre>
 * [a, b, 0,
 *  c, d, 0,
 *  tx, ty, 1]
 * </pre>
 * The last column is ignored so the array is shorter and operations are faster.
 */

/**
 * Creates a new identity mat2d
 *
 * @returns {mat2d} a new 2x3 matrix
 */

function create$7() {
  var out = new ARRAY_TYPE(6);

  if (ARRAY_TYPE != Float32Array) {
    out[1] = 0;
    out[2] = 0;
    out[4] = 0;
    out[5] = 0;
  }

  out[0] = 1;
  out[3] = 1;
  return out;
}
/**
 * Creates a new mat2d initialized with values from an existing matrix
 *
 * @param {ReadonlyMat2d} a matrix to clone
 * @returns {mat2d} a new 2x3 matrix
 */

function clone$7(a) {
  var out = new ARRAY_TYPE(6);
  out[0] = a[0];
  out[1] = a[1];
  out[2] = a[2];
  out[3] = a[3];
  out[4] = a[4];
  out[5] = a[5];
  return out;
}
/**
 * Copy the values from one mat2d to another
 *
 * @param {mat2d} out the receiving matrix
 * @param {ReadonlyMat2d} a the source matrix
 * @returns {mat2d} out
 */

function copy$7(out, a) {
  out[0] = a[0];
  out[1] = a[1];
  out[2] = a[2];
  out[3] = a[3];
  out[4] = a[4];
  out[5] = a[5];
  return out;
}
/**
 * Set a mat2d to the identity matrix
 *
 * @param {mat2d} out the receiving matrix
 * @returns {mat2d} out
 */

function identity$4(out) {
  out[0] = 1;
  out[1] = 0;
  out[2] = 0;
  out[3] = 1;
  out[4] = 0;
  out[5] = 0;
  return out;
}
/**
 * Create a new mat2d with the given values
 *
 * @param {Number} a Component A (index 0)
 * @param {Number} b Component B (index 1)
 * @param {Number} c Component C (index 2)
 * @param {Number} d Component D (index 3)
 * @param {Number} tx Component TX (index 4)
 * @param {Number} ty Component TY (index 5)
 * @returns {mat2d} A new mat2d
 */

function fromValues$7(a, b, c, d, tx, ty) {
  var out = new ARRAY_TYPE(6);
  out[0] = a;
  out[1] = b;
  out[2] = c;
  out[3] = d;
  out[4] = tx;
  out[5] = ty;
  return out;
}
/**
 * Set the components of a mat2d to the given values
 *
 * @param {mat2d} out the receiving matrix
 * @param {Number} a Component A (index 0)
 * @param {Number} b Component B (index 1)
 * @param {Number} c Component C (index 2)
 * @param {Number} d Component D (index 3)
 * @param {Number} tx Component TX (index 4)
 * @param {Number} ty Component TY (index 5)
 * @returns {mat2d} out
 */

function set$7(out, a, b, c, d, tx, ty) {
  out[0] = a;
  out[1] = b;
  out[2] = c;
  out[3] = d;
  out[4] = tx;
  out[5] = ty;
  return out;
}
/**
 * Inverts a mat2d
 *
 * @param {mat2d} out the receiving matrix
 * @param {ReadonlyMat2d} a the source matrix
 * @returns {mat2d} out
 */

function invert$4(out, a) {
  var aa = a[0],
      ab = a[1],
      ac = a[2],
      ad = a[3];
  var atx = a[4],
      aty = a[5];
  var det = aa * ad - ab * ac;

  if (!det) {
    return null;
  }

  det = 1.0 / det;
  out[0] = ad * det;
  out[1] = -ab * det;
  out[2] = -ac * det;
  out[3] = aa * det;
  out[4] = (ac * aty - ad * atx) * det;
  out[5] = (ab * atx - aa * aty) * det;
  return out;
}
/**
 * Calculates the determinant of a mat2d
 *
 * @param {ReadonlyMat2d} a the source matrix
 * @returns {Number} determinant of a
 */

function determinant$2(a) {
  return a[0] * a[3] - a[1] * a[2];
}
/**
 * Multiplies two mat2d's
 *
 * @param {mat2d} out the receiving matrix
 * @param {ReadonlyMat2d} a the first operand
 * @param {ReadonlyMat2d} b the second operand
 * @returns {mat2d} out
 */

function multiply$7(out, a, b) {
  var a0 = a[0],
      a1 = a[1],
      a2 = a[2],
      a3 = a[3],
      a4 = a[4],
      a5 = a[5];
  var b0 = b[0],
      b1 = b[1],
      b2 = b[2],
      b3 = b[3],
      b4 = b[4],
      b5 = b[5];
  out[0] = a0 * b0 + a2 * b1;
  out[1] = a1 * b0 + a3 * b1;
  out[2] = a0 * b2 + a2 * b3;
  out[3] = a1 * b2 + a3 * b3;
  out[4] = a0 * b4 + a2 * b5 + a4;
  out[5] = a1 * b4 + a3 * b5 + a5;
  return out;
}
/**
 * Rotates a mat2d by the given angle
 *
 * @param {mat2d} out the receiving matrix
 * @param {ReadonlyMat2d} a the matrix to rotate
 * @param {Number} rad the angle to rotate the matrix by
 * @returns {mat2d} out
 */

function rotate$3(out, a, rad) {
  var a0 = a[0],
      a1 = a[1],
      a2 = a[2],
      a3 = a[3],
      a4 = a[4],
      a5 = a[5];
  var s = Math.sin(rad);
  var c = Math.cos(rad);
  out[0] = a0 * c + a2 * s;
  out[1] = a1 * c + a3 * s;
  out[2] = a0 * -s + a2 * c;
  out[3] = a1 * -s + a3 * c;
  out[4] = a4;
  out[5] = a5;
  return out;
}
/**
 * Scales the mat2d by the dimensions in the given vec2
 *
 * @param {mat2d} out the receiving matrix
 * @param {ReadonlyMat2d} a the matrix to translate
 * @param {ReadonlyVec2} v the vec2 to scale the matrix by
 * @returns {mat2d} out
 **/

function scale$7(out, a, v) {
  var a0 = a[0],
      a1 = a[1],
      a2 = a[2],
      a3 = a[3],
      a4 = a[4],
      a5 = a[5];
  var v0 = v[0],
      v1 = v[1];
  out[0] = a0 * v0;
  out[1] = a1 * v0;
  out[2] = a2 * v1;
  out[3] = a3 * v1;
  out[4] = a4;
  out[5] = a5;
  return out;
}
/**
 * Translates the mat2d by the dimensions in the given vec2
 *
 * @param {mat2d} out the receiving matrix
 * @param {ReadonlyMat2d} a the matrix to translate
 * @param {ReadonlyVec2} v the vec2 to translate the matrix by
 * @returns {mat2d} out
 **/

function translate$3(out, a, v) {
  var a0 = a[0],
      a1 = a[1],
      a2 = a[2],
      a3 = a[3],
      a4 = a[4],
      a5 = a[5];
  var v0 = v[0],
      v1 = v[1];
  out[0] = a0;
  out[1] = a1;
  out[2] = a2;
  out[3] = a3;
  out[4] = a0 * v0 + a2 * v1 + a4;
  out[5] = a1 * v0 + a3 * v1 + a5;
  return out;
}
/**
 * Creates a matrix from a given angle
 * This is equivalent to (but much faster than):
 *
 *     mat2d.identity(dest);
 *     mat2d.rotate(dest, dest, rad);
 *
 * @param {mat2d} out mat2d receiving operation result
 * @param {Number} rad the angle to rotate the matrix by
 * @returns {mat2d} out
 */

function fromRotation$3(out, rad) {
  var s = Math.sin(rad),
      c = Math.cos(rad);
  out[0] = c;
  out[1] = s;
  out[2] = -s;
  out[3] = c;
  out[4] = 0;
  out[5] = 0;
  return out;
}
/**
 * Creates a matrix from a vector scaling
 * This is equivalent to (but much faster than):
 *
 *     mat2d.identity(dest);
 *     mat2d.scale(dest, dest, vec);
 *
 * @param {mat2d} out mat2d receiving operation result
 * @param {ReadonlyVec2} v Scaling vector
 * @returns {mat2d} out
 */

function fromScaling$2(out, v) {
  out[0] = v[0];
  out[1] = 0;
  out[2] = 0;
  out[3] = v[1];
  out[4] = 0;
  out[5] = 0;
  return out;
}
/**
 * Creates a matrix from a vector translation
 * This is equivalent to (but much faster than):
 *
 *     mat2d.identity(dest);
 *     mat2d.translate(dest, dest, vec);
 *
 * @param {mat2d} out mat2d receiving operation result
 * @param {ReadonlyVec2} v Translation vector
 * @returns {mat2d} out
 */

function fromTranslation$3(out, v) {
  out[0] = 1;
  out[1] = 0;
  out[2] = 0;
  out[3] = 1;
  out[4] = v[0];
  out[5] = v[1];
  return out;
}
/**
 * Returns a string representation of a mat2d
 *
 * @param {ReadonlyMat2d} a matrix to represent as a string
 * @returns {String} string representation of the matrix
 */

function str$7(a) {
  return "mat2d(" + a[0] + ", " + a[1] + ", " + a[2] + ", " + a[3] + ", " + a[4] + ", " + a[5] + ")";
}
/**
 * Returns Frobenius norm of a mat2d
 *
 * @param {ReadonlyMat2d} a the matrix to calculate Frobenius norm of
 * @returns {Number} Frobenius norm
 */

function frob$2(a) {
  return Math.hypot(a[0], a[1], a[2], a[3], a[4], a[5], 1);
}
/**
 * Adds two mat2d's
 *
 * @param {mat2d} out the receiving matrix
 * @param {ReadonlyMat2d} a the first operand
 * @param {ReadonlyMat2d} b the second operand
 * @returns {mat2d} out
 */

function add$7(out, a, b) {
  out[0] = a[0] + b[0];
  out[1] = a[1] + b[1];
  out[2] = a[2] + b[2];
  out[3] = a[3] + b[3];
  out[4] = a[4] + b[4];
  out[5] = a[5] + b[5];
  return out;
}
/**
 * Subtracts matrix b from matrix a
 *
 * @param {mat2d} out the receiving matrix
 * @param {ReadonlyMat2d} a the first operand
 * @param {ReadonlyMat2d} b the second operand
 * @returns {mat2d} out
 */

function subtract$5(out, a, b) {
  out[0] = a[0] - b[0];
  out[1] = a[1] - b[1];
  out[2] = a[2] - b[2];
  out[3] = a[3] - b[3];
  out[4] = a[4] - b[4];
  out[5] = a[5] - b[5];
  return out;
}
/**
 * Multiply each element of the matrix by a scalar.
 *
 * @param {mat2d} out the receiving matrix
 * @param {ReadonlyMat2d} a the matrix to scale
 * @param {Number} b amount to scale the matrix's elements by
 * @returns {mat2d} out
 */

function multiplyScalar$2(out, a, b) {
  out[0] = a[0] * b;
  out[1] = a[1] * b;
  out[2] = a[2] * b;
  out[3] = a[3] * b;
  out[4] = a[4] * b;
  out[5] = a[5] * b;
  return out;
}
/**
 * Adds two mat2d's after multiplying each element of the second operand by a scalar value.
 *
 * @param {mat2d} out the receiving vector
 * @param {ReadonlyMat2d} a the first operand
 * @param {ReadonlyMat2d} b the second operand
 * @param {Number} scale the amount to scale b's elements by before adding
 * @returns {mat2d} out
 */

function multiplyScalarAndAdd$2(out, a, b, scale) {
  out[0] = a[0] + b[0] * scale;
  out[1] = a[1] + b[1] * scale;
  out[2] = a[2] + b[2] * scale;
  out[3] = a[3] + b[3] * scale;
  out[4] = a[4] + b[4] * scale;
  out[5] = a[5] + b[5] * scale;
  return out;
}
/**
 * Returns whether or not the matrices have exactly the same elements in the same position (when compared with ===)
 *
 * @param {ReadonlyMat2d} a The first matrix.
 * @param {ReadonlyMat2d} b The second matrix.
 * @returns {Boolean} True if the matrices are equal, false otherwise.
 */

function exactEquals$7(a, b) {
  return a[0] === b[0] && a[1] === b[1] && a[2] === b[2] && a[3] === b[3] && a[4] === b[4] && a[5] === b[5];
}
/**
 * Returns whether or not the matrices have approximately the same elements in the same position.
 *
 * @param {ReadonlyMat2d} a The first matrix.
 * @param {ReadonlyMat2d} b The second matrix.
 * @returns {Boolean} True if the matrices are equal, false otherwise.
 */

function equals$7(a, b) {
  var a0 = a[0],
      a1 = a[1],
      a2 = a[2],
      a3 = a[3],
      a4 = a[4],
      a5 = a[5];
  var b0 = b[0],
      b1 = b[1],
      b2 = b[2],
      b3 = b[3],
      b4 = b[4],
      b5 = b[5];
  return Math.abs(a0 - b0) <= EPSILON * Math.max(1.0, Math.abs(a0), Math.abs(b0)) && Math.abs(a1 - b1) <= EPSILON * Math.max(1.0, Math.abs(a1), Math.abs(b1)) && Math.abs(a2 - b2) <= EPSILON * Math.max(1.0, Math.abs(a2), Math.abs(b2)) && Math.abs(a3 - b3) <= EPSILON * Math.max(1.0, Math.abs(a3), Math.abs(b3)) && Math.abs(a4 - b4) <= EPSILON * Math.max(1.0, Math.abs(a4), Math.abs(b4)) && Math.abs(a5 - b5) <= EPSILON * Math.max(1.0, Math.abs(a5), Math.abs(b5));
}
/**
 * Alias for {@link mat2d.multiply}
 * @function
 */

var mul$7 = multiply$7;
/**
 * Alias for {@link mat2d.subtract}
 * @function
 */

var sub$5 = subtract$5;

var mat2d = /*#__PURE__*/Object.freeze({
    __proto__: null,
    create: create$7,
    clone: clone$7,
    copy: copy$7,
    identity: identity$4,
    fromValues: fromValues$7,
    set: set$7,
    invert: invert$4,
    determinant: determinant$2,
    multiply: multiply$7,
    rotate: rotate$3,
    scale: scale$7,
    translate: translate$3,
    fromRotation: fromRotation$3,
    fromScaling: fromScaling$2,
    fromTranslation: fromTranslation$3,
    str: str$7,
    frob: frob$2,
    add: add$7,
    subtract: subtract$5,
    multiplyScalar: multiplyScalar$2,
    multiplyScalarAndAdd: multiplyScalarAndAdd$2,
    exactEquals: exactEquals$7,
    equals: equals$7,
    mul: mul$7,
    sub: sub$5
});

/**
 * 3x3 Matrix
 * @module mat3
 */

/**
 * Creates a new identity mat3
 *
 * @returns {mat3} a new 3x3 matrix
 */

function create$6() {
  var out = new ARRAY_TYPE(9);

  if (ARRAY_TYPE != Float32Array) {
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    out[5] = 0;
    out[6] = 0;
    out[7] = 0;
  }

  out[0] = 1;
  out[4] = 1;
  out[8] = 1;
  return out;
}
/**
 * Copies the upper-left 3x3 values into the given mat3.
 *
 * @param {mat3} out the receiving 3x3 matrix
 * @param {ReadonlyMat4} a   the source 4x4 matrix
 * @returns {mat3} out
 */

function fromMat4$1(out, a) {
  out[0] = a[0];
  out[1] = a[1];
  out[2] = a[2];
  out[3] = a[4];
  out[4] = a[5];
  out[5] = a[6];
  out[6] = a[8];
  out[7] = a[9];
  out[8] = a[10];
  return out;
}
/**
 * Creates a new mat3 initialized with values from an existing matrix
 *
 * @param {ReadonlyMat3} a matrix to clone
 * @returns {mat3} a new 3x3 matrix
 */

function clone$6(a) {
  var out = new ARRAY_TYPE(9);
  out[0] = a[0];
  out[1] = a[1];
  out[2] = a[2];
  out[3] = a[3];
  out[4] = a[4];
  out[5] = a[5];
  out[6] = a[6];
  out[7] = a[7];
  out[8] = a[8];
  return out;
}
/**
 * Copy the values from one mat3 to another
 *
 * @param {mat3} out the receiving matrix
 * @param {ReadonlyMat3} a the source matrix
 * @returns {mat3} out
 */

function copy$6(out, a) {
  out[0] = a[0];
  out[1] = a[1];
  out[2] = a[2];
  out[3] = a[3];
  out[4] = a[4];
  out[5] = a[5];
  out[6] = a[6];
  out[7] = a[7];
  out[8] = a[8];
  return out;
}
/**
 * Create a new mat3 with the given values
 *
 * @param {Number} m00 Component in column 0, row 0 position (index 0)
 * @param {Number} m01 Component in column 0, row 1 position (index 1)
 * @param {Number} m02 Component in column 0, row 2 position (index 2)
 * @param {Number} m10 Component in column 1, row 0 position (index 3)
 * @param {Number} m11 Component in column 1, row 1 position (index 4)
 * @param {Number} m12 Component in column 1, row 2 position (index 5)
 * @param {Number} m20 Component in column 2, row 0 position (index 6)
 * @param {Number} m21 Component in column 2, row 1 position (index 7)
 * @param {Number} m22 Component in column 2, row 2 position (index 8)
 * @returns {mat3} A new mat3
 */

function fromValues$6(m00, m01, m02, m10, m11, m12, m20, m21, m22) {
  var out = new ARRAY_TYPE(9);
  out[0] = m00;
  out[1] = m01;
  out[2] = m02;
  out[3] = m10;
  out[4] = m11;
  out[5] = m12;
  out[6] = m20;
  out[7] = m21;
  out[8] = m22;
  return out;
}
/**
 * Set the components of a mat3 to the given values
 *
 * @param {mat3} out the receiving matrix
 * @param {Number} m00 Component in column 0, row 0 position (index 0)
 * @param {Number} m01 Component in column 0, row 1 position (index 1)
 * @param {Number} m02 Component in column 0, row 2 position (index 2)
 * @param {Number} m10 Component in column 1, row 0 position (index 3)
 * @param {Number} m11 Component in column 1, row 1 position (index 4)
 * @param {Number} m12 Component in column 1, row 2 position (index 5)
 * @param {Number} m20 Component in column 2, row 0 position (index 6)
 * @param {Number} m21 Component in column 2, row 1 position (index 7)
 * @param {Number} m22 Component in column 2, row 2 position (index 8)
 * @returns {mat3} out
 */

function set$6(out, m00, m01, m02, m10, m11, m12, m20, m21, m22) {
  out[0] = m00;
  out[1] = m01;
  out[2] = m02;
  out[3] = m10;
  out[4] = m11;
  out[5] = m12;
  out[6] = m20;
  out[7] = m21;
  out[8] = m22;
  return out;
}
/**
 * Set a mat3 to the identity matrix
 *
 * @param {mat3} out the receiving matrix
 * @returns {mat3} out
 */

function identity$3(out) {
  out[0] = 1;
  out[1] = 0;
  out[2] = 0;
  out[3] = 0;
  out[4] = 1;
  out[5] = 0;
  out[6] = 0;
  out[7] = 0;
  out[8] = 1;
  return out;
}
/**
 * Transpose the values of a mat3
 *
 * @param {mat3} out the receiving matrix
 * @param {ReadonlyMat3} a the source matrix
 * @returns {mat3} out
 */

function transpose$1(out, a) {
  // If we are transposing ourselves we can skip a few steps but have to cache some values
  if (out === a) {
    var a01 = a[1],
        a02 = a[2],
        a12 = a[5];
    out[1] = a[3];
    out[2] = a[6];
    out[3] = a01;
    out[5] = a[7];
    out[6] = a02;
    out[7] = a12;
  } else {
    out[0] = a[0];
    out[1] = a[3];
    out[2] = a[6];
    out[3] = a[1];
    out[4] = a[4];
    out[5] = a[7];
    out[6] = a[2];
    out[7] = a[5];
    out[8] = a[8];
  }

  return out;
}
/**
 * Inverts a mat3
 *
 * @param {mat3} out the receiving matrix
 * @param {ReadonlyMat3} a the source matrix
 * @returns {mat3} out
 */

function invert$3(out, a) {
  var a00 = a[0],
      a01 = a[1],
      a02 = a[2];
  var a10 = a[3],
      a11 = a[4],
      a12 = a[5];
  var a20 = a[6],
      a21 = a[7],
      a22 = a[8];
  var b01 = a22 * a11 - a12 * a21;
  var b11 = -a22 * a10 + a12 * a20;
  var b21 = a21 * a10 - a11 * a20; // Calculate the determinant

  var det = a00 * b01 + a01 * b11 + a02 * b21;

  if (!det) {
    return null;
  }

  det = 1.0 / det;
  out[0] = b01 * det;
  out[1] = (-a22 * a01 + a02 * a21) * det;
  out[2] = (a12 * a01 - a02 * a11) * det;
  out[3] = b11 * det;
  out[4] = (a22 * a00 - a02 * a20) * det;
  out[5] = (-a12 * a00 + a02 * a10) * det;
  out[6] = b21 * det;
  out[7] = (-a21 * a00 + a01 * a20) * det;
  out[8] = (a11 * a00 - a01 * a10) * det;
  return out;
}
/**
 * Calculates the adjugate of a mat3
 *
 * @param {mat3} out the receiving matrix
 * @param {ReadonlyMat3} a the source matrix
 * @returns {mat3} out
 */

function adjoint$1(out, a) {
  var a00 = a[0],
      a01 = a[1],
      a02 = a[2];
  var a10 = a[3],
      a11 = a[4],
      a12 = a[5];
  var a20 = a[6],
      a21 = a[7],
      a22 = a[8];
  out[0] = a11 * a22 - a12 * a21;
  out[1] = a02 * a21 - a01 * a22;
  out[2] = a01 * a12 - a02 * a11;
  out[3] = a12 * a20 - a10 * a22;
  out[4] = a00 * a22 - a02 * a20;
  out[5] = a02 * a10 - a00 * a12;
  out[6] = a10 * a21 - a11 * a20;
  out[7] = a01 * a20 - a00 * a21;
  out[8] = a00 * a11 - a01 * a10;
  return out;
}
/**
 * Calculates the determinant of a mat3
 *
 * @param {ReadonlyMat3} a the source matrix
 * @returns {Number} determinant of a
 */

function determinant$1(a) {
  var a00 = a[0],
      a01 = a[1],
      a02 = a[2];
  var a10 = a[3],
      a11 = a[4],
      a12 = a[5];
  var a20 = a[6],
      a21 = a[7],
      a22 = a[8];
  return a00 * (a22 * a11 - a12 * a21) + a01 * (-a22 * a10 + a12 * a20) + a02 * (a21 * a10 - a11 * a20);
}
/**
 * Multiplies two mat3's
 *
 * @param {mat3} out the receiving matrix
 * @param {ReadonlyMat3} a the first operand
 * @param {ReadonlyMat3} b the second operand
 * @returns {mat3} out
 */

function multiply$6(out, a, b) {
  var a00 = a[0],
      a01 = a[1],
      a02 = a[2];
  var a10 = a[3],
      a11 = a[4],
      a12 = a[5];
  var a20 = a[6],
      a21 = a[7],
      a22 = a[8];
  var b00 = b[0],
      b01 = b[1],
      b02 = b[2];
  var b10 = b[3],
      b11 = b[4],
      b12 = b[5];
  var b20 = b[6],
      b21 = b[7],
      b22 = b[8];
  out[0] = b00 * a00 + b01 * a10 + b02 * a20;
  out[1] = b00 * a01 + b01 * a11 + b02 * a21;
  out[2] = b00 * a02 + b01 * a12 + b02 * a22;
  out[3] = b10 * a00 + b11 * a10 + b12 * a20;
  out[4] = b10 * a01 + b11 * a11 + b12 * a21;
  out[5] = b10 * a02 + b11 * a12 + b12 * a22;
  out[6] = b20 * a00 + b21 * a10 + b22 * a20;
  out[7] = b20 * a01 + b21 * a11 + b22 * a21;
  out[8] = b20 * a02 + b21 * a12 + b22 * a22;
  return out;
}
/**
 * Translate a mat3 by the given vector
 *
 * @param {mat3} out the receiving matrix
 * @param {ReadonlyMat3} a the matrix to translate
 * @param {ReadonlyVec2} v vector to translate by
 * @returns {mat3} out
 */

function translate$2(out, a, v) {
  var a00 = a[0],
      a01 = a[1],
      a02 = a[2],
      a10 = a[3],
      a11 = a[4],
      a12 = a[5],
      a20 = a[6],
      a21 = a[7],
      a22 = a[8],
      x = v[0],
      y = v[1];
  out[0] = a00;
  out[1] = a01;
  out[2] = a02;
  out[3] = a10;
  out[4] = a11;
  out[5] = a12;
  out[6] = x * a00 + y * a10 + a20;
  out[7] = x * a01 + y * a11 + a21;
  out[8] = x * a02 + y * a12 + a22;
  return out;
}
/**
 * Rotates a mat3 by the given angle
 *
 * @param {mat3} out the receiving matrix
 * @param {ReadonlyMat3} a the matrix to rotate
 * @param {Number} rad the angle to rotate the matrix by
 * @returns {mat3} out
 */

function rotate$2(out, a, rad) {
  var a00 = a[0],
      a01 = a[1],
      a02 = a[2],
      a10 = a[3],
      a11 = a[4],
      a12 = a[5],
      a20 = a[6],
      a21 = a[7],
      a22 = a[8],
      s = Math.sin(rad),
      c = Math.cos(rad);
  out[0] = c * a00 + s * a10;
  out[1] = c * a01 + s * a11;
  out[2] = c * a02 + s * a12;
  out[3] = c * a10 - s * a00;
  out[4] = c * a11 - s * a01;
  out[5] = c * a12 - s * a02;
  out[6] = a20;
  out[7] = a21;
  out[8] = a22;
  return out;
}
/**
 * Scales the mat3 by the dimensions in the given vec2
 *
 * @param {mat3} out the receiving matrix
 * @param {ReadonlyMat3} a the matrix to rotate
 * @param {ReadonlyVec2} v the vec2 to scale the matrix by
 * @returns {mat3} out
 **/

function scale$6(out, a, v) {
  var x = v[0],
      y = v[1];
  out[0] = x * a[0];
  out[1] = x * a[1];
  out[2] = x * a[2];
  out[3] = y * a[3];
  out[4] = y * a[4];
  out[5] = y * a[5];
  out[6] = a[6];
  out[7] = a[7];
  out[8] = a[8];
  return out;
}
/**
 * Creates a matrix from a vector translation
 * This is equivalent to (but much faster than):
 *
 *     mat3.identity(dest);
 *     mat3.translate(dest, dest, vec);
 *
 * @param {mat3} out mat3 receiving operation result
 * @param {ReadonlyVec2} v Translation vector
 * @returns {mat3} out
 */

function fromTranslation$2(out, v) {
  out[0] = 1;
  out[1] = 0;
  out[2] = 0;
  out[3] = 0;
  out[4] = 1;
  out[5] = 0;
  out[6] = v[0];
  out[7] = v[1];
  out[8] = 1;
  return out;
}
/**
 * Creates a matrix from a given angle
 * This is equivalent to (but much faster than):
 *
 *     mat3.identity(dest);
 *     mat3.rotate(dest, dest, rad);
 *
 * @param {mat3} out mat3 receiving operation result
 * @param {Number} rad the angle to rotate the matrix by
 * @returns {mat3} out
 */

function fromRotation$2(out, rad) {
  var s = Math.sin(rad),
      c = Math.cos(rad);
  out[0] = c;
  out[1] = s;
  out[2] = 0;
  out[3] = -s;
  out[4] = c;
  out[5] = 0;
  out[6] = 0;
  out[7] = 0;
  out[8] = 1;
  return out;
}
/**
 * Creates a matrix from a vector scaling
 * This is equivalent to (but much faster than):
 *
 *     mat3.identity(dest);
 *     mat3.scale(dest, dest, vec);
 *
 * @param {mat3} out mat3 receiving operation result
 * @param {ReadonlyVec2} v Scaling vector
 * @returns {mat3} out
 */

function fromScaling$1(out, v) {
  out[0] = v[0];
  out[1] = 0;
  out[2] = 0;
  out[3] = 0;
  out[4] = v[1];
  out[5] = 0;
  out[6] = 0;
  out[7] = 0;
  out[8] = 1;
  return out;
}
/**
 * Copies the values from a mat2d into a mat3
 *
 * @param {mat3} out the receiving matrix
 * @param {ReadonlyMat2d} a the matrix to copy
 * @returns {mat3} out
 **/

function fromMat2d(out, a) {
  out[0] = a[0];
  out[1] = a[1];
  out[2] = 0;
  out[3] = a[2];
  out[4] = a[3];
  out[5] = 0;
  out[6] = a[4];
  out[7] = a[5];
  out[8] = 1;
  return out;
}
/**
 * Calculates a 3x3 matrix from the given quaternion
 *
 * @param {mat3} out mat3 receiving operation result
 * @param {ReadonlyQuat} q Quaternion to create matrix from
 *
 * @returns {mat3} out
 */

function fromQuat$1(out, q) {
  var x = q[0],
      y = q[1],
      z = q[2],
      w = q[3];
  var x2 = x + x;
  var y2 = y + y;
  var z2 = z + z;
  var xx = x * x2;
  var yx = y * x2;
  var yy = y * y2;
  var zx = z * x2;
  var zy = z * y2;
  var zz = z * z2;
  var wx = w * x2;
  var wy = w * y2;
  var wz = w * z2;
  out[0] = 1 - yy - zz;
  out[3] = yx - wz;
  out[6] = zx + wy;
  out[1] = yx + wz;
  out[4] = 1 - xx - zz;
  out[7] = zy - wx;
  out[2] = zx - wy;
  out[5] = zy + wx;
  out[8] = 1 - xx - yy;
  return out;
}
/**
 * Calculates a 3x3 normal matrix (transpose inverse) from the 4x4 matrix
 *
 * @param {mat3} out mat3 receiving operation result
 * @param {ReadonlyMat4} a Mat4 to derive the normal matrix from
 *
 * @returns {mat3} out
 */

function normalFromMat4(out, a) {
  var a00 = a[0],
      a01 = a[1],
      a02 = a[2],
      a03 = a[3];
  var a10 = a[4],
      a11 = a[5],
      a12 = a[6],
      a13 = a[7];
  var a20 = a[8],
      a21 = a[9],
      a22 = a[10],
      a23 = a[11];
  var a30 = a[12],
      a31 = a[13],
      a32 = a[14],
      a33 = a[15];
  var b00 = a00 * a11 - a01 * a10;
  var b01 = a00 * a12 - a02 * a10;
  var b02 = a00 * a13 - a03 * a10;
  var b03 = a01 * a12 - a02 * a11;
  var b04 = a01 * a13 - a03 * a11;
  var b05 = a02 * a13 - a03 * a12;
  var b06 = a20 * a31 - a21 * a30;
  var b07 = a20 * a32 - a22 * a30;
  var b08 = a20 * a33 - a23 * a30;
  var b09 = a21 * a32 - a22 * a31;
  var b10 = a21 * a33 - a23 * a31;
  var b11 = a22 * a33 - a23 * a32; // Calculate the determinant

  var det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;

  if (!det) {
    return null;
  }

  det = 1.0 / det;
  out[0] = (a11 * b11 - a12 * b10 + a13 * b09) * det;
  out[1] = (a12 * b08 - a10 * b11 - a13 * b07) * det;
  out[2] = (a10 * b10 - a11 * b08 + a13 * b06) * det;
  out[3] = (a02 * b10 - a01 * b11 - a03 * b09) * det;
  out[4] = (a00 * b11 - a02 * b08 + a03 * b07) * det;
  out[5] = (a01 * b08 - a00 * b10 - a03 * b06) * det;
  out[6] = (a31 * b05 - a32 * b04 + a33 * b03) * det;
  out[7] = (a32 * b02 - a30 * b05 - a33 * b01) * det;
  out[8] = (a30 * b04 - a31 * b02 + a33 * b00) * det;
  return out;
}
/**
 * Generates a 2D projection matrix with the given bounds
 *
 * @param {mat3} out mat3 frustum matrix will be written into
 * @param {number} width Width of your gl context
 * @param {number} height Height of gl context
 * @returns {mat3} out
 */

function projection(out, width, height) {
  out[0] = 2 / width;
  out[1] = 0;
  out[2] = 0;
  out[3] = 0;
  out[4] = -2 / height;
  out[5] = 0;
  out[6] = -1;
  out[7] = 1;
  out[8] = 1;
  return out;
}
/**
 * Returns a string representation of a mat3
 *
 * @param {ReadonlyMat3} a matrix to represent as a string
 * @returns {String} string representation of the matrix
 */

function str$6(a) {
  return "mat3(" + a[0] + ", " + a[1] + ", " + a[2] + ", " + a[3] + ", " + a[4] + ", " + a[5] + ", " + a[6] + ", " + a[7] + ", " + a[8] + ")";
}
/**
 * Returns Frobenius norm of a mat3
 *
 * @param {ReadonlyMat3} a the matrix to calculate Frobenius norm of
 * @returns {Number} Frobenius norm
 */

function frob$1(a) {
  return Math.hypot(a[0], a[1], a[2], a[3], a[4], a[5], a[6], a[7], a[8]);
}
/**
 * Adds two mat3's
 *
 * @param {mat3} out the receiving matrix
 * @param {ReadonlyMat3} a the first operand
 * @param {ReadonlyMat3} b the second operand
 * @returns {mat3} out
 */

function add$6(out, a, b) {
  out[0] = a[0] + b[0];
  out[1] = a[1] + b[1];
  out[2] = a[2] + b[2];
  out[3] = a[3] + b[3];
  out[4] = a[4] + b[4];
  out[5] = a[5] + b[5];
  out[6] = a[6] + b[6];
  out[7] = a[7] + b[7];
  out[8] = a[8] + b[8];
  return out;
}
/**
 * Subtracts matrix b from matrix a
 *
 * @param {mat3} out the receiving matrix
 * @param {ReadonlyMat3} a the first operand
 * @param {ReadonlyMat3} b the second operand
 * @returns {mat3} out
 */

function subtract$4(out, a, b) {
  out[0] = a[0] - b[0];
  out[1] = a[1] - b[1];
  out[2] = a[2] - b[2];
  out[3] = a[3] - b[3];
  out[4] = a[4] - b[4];
  out[5] = a[5] - b[5];
  out[6] = a[6] - b[6];
  out[7] = a[7] - b[7];
  out[8] = a[8] - b[8];
  return out;
}
/**
 * Multiply each element of the matrix by a scalar.
 *
 * @param {mat3} out the receiving matrix
 * @param {ReadonlyMat3} a the matrix to scale
 * @param {Number} b amount to scale the matrix's elements by
 * @returns {mat3} out
 */

function multiplyScalar$1(out, a, b) {
  out[0] = a[0] * b;
  out[1] = a[1] * b;
  out[2] = a[2] * b;
  out[3] = a[3] * b;
  out[4] = a[4] * b;
  out[5] = a[5] * b;
  out[6] = a[6] * b;
  out[7] = a[7] * b;
  out[8] = a[8] * b;
  return out;
}
/**
 * Adds two mat3's after multiplying each element of the second operand by a scalar value.
 *
 * @param {mat3} out the receiving vector
 * @param {ReadonlyMat3} a the first operand
 * @param {ReadonlyMat3} b the second operand
 * @param {Number} scale the amount to scale b's elements by before adding
 * @returns {mat3} out
 */

function multiplyScalarAndAdd$1(out, a, b, scale) {
  out[0] = a[0] + b[0] * scale;
  out[1] = a[1] + b[1] * scale;
  out[2] = a[2] + b[2] * scale;
  out[3] = a[3] + b[3] * scale;
  out[4] = a[4] + b[4] * scale;
  out[5] = a[5] + b[5] * scale;
  out[6] = a[6] + b[6] * scale;
  out[7] = a[7] + b[7] * scale;
  out[8] = a[8] + b[8] * scale;
  return out;
}
/**
 * Returns whether or not the matrices have exactly the same elements in the same position (when compared with ===)
 *
 * @param {ReadonlyMat3} a The first matrix.
 * @param {ReadonlyMat3} b The second matrix.
 * @returns {Boolean} True if the matrices are equal, false otherwise.
 */

function exactEquals$6(a, b) {
  return a[0] === b[0] && a[1] === b[1] && a[2] === b[2] && a[3] === b[3] && a[4] === b[4] && a[5] === b[5] && a[6] === b[6] && a[7] === b[7] && a[8] === b[8];
}
/**
 * Returns whether or not the matrices have approximately the same elements in the same position.
 *
 * @param {ReadonlyMat3} a The first matrix.
 * @param {ReadonlyMat3} b The second matrix.
 * @returns {Boolean} True if the matrices are equal, false otherwise.
 */

function equals$6(a, b) {
  var a0 = a[0],
      a1 = a[1],
      a2 = a[2],
      a3 = a[3],
      a4 = a[4],
      a5 = a[5],
      a6 = a[6],
      a7 = a[7],
      a8 = a[8];
  var b0 = b[0],
      b1 = b[1],
      b2 = b[2],
      b3 = b[3],
      b4 = b[4],
      b5 = b[5],
      b6 = b[6],
      b7 = b[7],
      b8 = b[8];
  return Math.abs(a0 - b0) <= EPSILON * Math.max(1.0, Math.abs(a0), Math.abs(b0)) && Math.abs(a1 - b1) <= EPSILON * Math.max(1.0, Math.abs(a1), Math.abs(b1)) && Math.abs(a2 - b2) <= EPSILON * Math.max(1.0, Math.abs(a2), Math.abs(b2)) && Math.abs(a3 - b3) <= EPSILON * Math.max(1.0, Math.abs(a3), Math.abs(b3)) && Math.abs(a4 - b4) <= EPSILON * Math.max(1.0, Math.abs(a4), Math.abs(b4)) && Math.abs(a5 - b5) <= EPSILON * Math.max(1.0, Math.abs(a5), Math.abs(b5)) && Math.abs(a6 - b6) <= EPSILON * Math.max(1.0, Math.abs(a6), Math.abs(b6)) && Math.abs(a7 - b7) <= EPSILON * Math.max(1.0, Math.abs(a7), Math.abs(b7)) && Math.abs(a8 - b8) <= EPSILON * Math.max(1.0, Math.abs(a8), Math.abs(b8));
}
/**
 * Alias for {@link mat3.multiply}
 * @function
 */

var mul$6 = multiply$6;
/**
 * Alias for {@link mat3.subtract}
 * @function
 */

var sub$4 = subtract$4;

var mat3 = /*#__PURE__*/Object.freeze({
    __proto__: null,
    create: create$6,
    fromMat4: fromMat4$1,
    clone: clone$6,
    copy: copy$6,
    fromValues: fromValues$6,
    set: set$6,
    identity: identity$3,
    transpose: transpose$1,
    invert: invert$3,
    adjoint: adjoint$1,
    determinant: determinant$1,
    multiply: multiply$6,
    translate: translate$2,
    rotate: rotate$2,
    scale: scale$6,
    fromTranslation: fromTranslation$2,
    fromRotation: fromRotation$2,
    fromScaling: fromScaling$1,
    fromMat2d: fromMat2d,
    fromQuat: fromQuat$1,
    normalFromMat4: normalFromMat4,
    projection: projection,
    str: str$6,
    frob: frob$1,
    add: add$6,
    subtract: subtract$4,
    multiplyScalar: multiplyScalar$1,
    multiplyScalarAndAdd: multiplyScalarAndAdd$1,
    exactEquals: exactEquals$6,
    equals: equals$6,
    mul: mul$6,
    sub: sub$4
});

/**
 * 4x4 Matrix<br>Format: column-major, when typed out it looks like row-major<br>The matrices are being post multiplied.
 * @module mat4
 */

/**
 * Creates a new identity mat4
 *
 * @returns {mat4} a new 4x4 matrix
 */

function create$5() {
  var out = new ARRAY_TYPE(16);

  if (ARRAY_TYPE != Float32Array) {
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    out[4] = 0;
    out[6] = 0;
    out[7] = 0;
    out[8] = 0;
    out[9] = 0;
    out[11] = 0;
    out[12] = 0;
    out[13] = 0;
    out[14] = 0;
  }

  out[0] = 1;
  out[5] = 1;
  out[10] = 1;
  out[15] = 1;
  return out;
}
/**
 * Creates a new mat4 initialized with values from an existing matrix
 *
 * @param {ReadonlyMat4} a matrix to clone
 * @returns {mat4} a new 4x4 matrix
 */

function clone$5(a) {
  var out = new ARRAY_TYPE(16);
  out[0] = a[0];
  out[1] = a[1];
  out[2] = a[2];
  out[3] = a[3];
  out[4] = a[4];
  out[5] = a[5];
  out[6] = a[6];
  out[7] = a[7];
  out[8] = a[8];
  out[9] = a[9];
  out[10] = a[10];
  out[11] = a[11];
  out[12] = a[12];
  out[13] = a[13];
  out[14] = a[14];
  out[15] = a[15];
  return out;
}
/**
 * Copy the values from one mat4 to another
 *
 * @param {mat4} out the receiving matrix
 * @param {ReadonlyMat4} a the source matrix
 * @returns {mat4} out
 */

function copy$5(out, a) {
  out[0] = a[0];
  out[1] = a[1];
  out[2] = a[2];
  out[3] = a[3];
  out[4] = a[4];
  out[5] = a[5];
  out[6] = a[6];
  out[7] = a[7];
  out[8] = a[8];
  out[9] = a[9];
  out[10] = a[10];
  out[11] = a[11];
  out[12] = a[12];
  out[13] = a[13];
  out[14] = a[14];
  out[15] = a[15];
  return out;
}
/**
 * Create a new mat4 with the given values
 *
 * @param {Number} m00 Component in column 0, row 0 position (index 0)
 * @param {Number} m01 Component in column 0, row 1 position (index 1)
 * @param {Number} m02 Component in column 0, row 2 position (index 2)
 * @param {Number} m03 Component in column 0, row 3 position (index 3)
 * @param {Number} m10 Component in column 1, row 0 position (index 4)
 * @param {Number} m11 Component in column 1, row 1 position (index 5)
 * @param {Number} m12 Component in column 1, row 2 position (index 6)
 * @param {Number} m13 Component in column 1, row 3 position (index 7)
 * @param {Number} m20 Component in column 2, row 0 position (index 8)
 * @param {Number} m21 Component in column 2, row 1 position (index 9)
 * @param {Number} m22 Component in column 2, row 2 position (index 10)
 * @param {Number} m23 Component in column 2, row 3 position (index 11)
 * @param {Number} m30 Component in column 3, row 0 position (index 12)
 * @param {Number} m31 Component in column 3, row 1 position (index 13)
 * @param {Number} m32 Component in column 3, row 2 position (index 14)
 * @param {Number} m33 Component in column 3, row 3 position (index 15)
 * @returns {mat4} A new mat4
 */

function fromValues$5(m00, m01, m02, m03, m10, m11, m12, m13, m20, m21, m22, m23, m30, m31, m32, m33) {
  var out = new ARRAY_TYPE(16);
  out[0] = m00;
  out[1] = m01;
  out[2] = m02;
  out[3] = m03;
  out[4] = m10;
  out[5] = m11;
  out[6] = m12;
  out[7] = m13;
  out[8] = m20;
  out[9] = m21;
  out[10] = m22;
  out[11] = m23;
  out[12] = m30;
  out[13] = m31;
  out[14] = m32;
  out[15] = m33;
  return out;
}
/**
 * Set the components of a mat4 to the given values
 *
 * @param {mat4} out the receiving matrix
 * @param {Number} m00 Component in column 0, row 0 position (index 0)
 * @param {Number} m01 Component in column 0, row 1 position (index 1)
 * @param {Number} m02 Component in column 0, row 2 position (index 2)
 * @param {Number} m03 Component in column 0, row 3 position (index 3)
 * @param {Number} m10 Component in column 1, row 0 position (index 4)
 * @param {Number} m11 Component in column 1, row 1 position (index 5)
 * @param {Number} m12 Component in column 1, row 2 position (index 6)
 * @param {Number} m13 Component in column 1, row 3 position (index 7)
 * @param {Number} m20 Component in column 2, row 0 position (index 8)
 * @param {Number} m21 Component in column 2, row 1 position (index 9)
 * @param {Number} m22 Component in column 2, row 2 position (index 10)
 * @param {Number} m23 Component in column 2, row 3 position (index 11)
 * @param {Number} m30 Component in column 3, row 0 position (index 12)
 * @param {Number} m31 Component in column 3, row 1 position (index 13)
 * @param {Number} m32 Component in column 3, row 2 position (index 14)
 * @param {Number} m33 Component in column 3, row 3 position (index 15)
 * @returns {mat4} out
 */

function set$5(out, m00, m01, m02, m03, m10, m11, m12, m13, m20, m21, m22, m23, m30, m31, m32, m33) {
  out[0] = m00;
  out[1] = m01;
  out[2] = m02;
  out[3] = m03;
  out[4] = m10;
  out[5] = m11;
  out[6] = m12;
  out[7] = m13;
  out[8] = m20;
  out[9] = m21;
  out[10] = m22;
  out[11] = m23;
  out[12] = m30;
  out[13] = m31;
  out[14] = m32;
  out[15] = m33;
  return out;
}
/**
 * Set a mat4 to the identity matrix
 *
 * @param {mat4} out the receiving matrix
 * @returns {mat4} out
 */

function identity$2(out) {
  out[0] = 1;
  out[1] = 0;
  out[2] = 0;
  out[3] = 0;
  out[4] = 0;
  out[5] = 1;
  out[6] = 0;
  out[7] = 0;
  out[8] = 0;
  out[9] = 0;
  out[10] = 1;
  out[11] = 0;
  out[12] = 0;
  out[13] = 0;
  out[14] = 0;
  out[15] = 1;
  return out;
}
/**
 * Transpose the values of a mat4
 *
 * @param {mat4} out the receiving matrix
 * @param {ReadonlyMat4} a the source matrix
 * @returns {mat4} out
 */

function transpose(out, a) {
  // If we are transposing ourselves we can skip a few steps but have to cache some values
  if (out === a) {
    var a01 = a[1],
        a02 = a[2],
        a03 = a[3];
    var a12 = a[6],
        a13 = a[7];
    var a23 = a[11];
    out[1] = a[4];
    out[2] = a[8];
    out[3] = a[12];
    out[4] = a01;
    out[6] = a[9];
    out[7] = a[13];
    out[8] = a02;
    out[9] = a12;
    out[11] = a[14];
    out[12] = a03;
    out[13] = a13;
    out[14] = a23;
  } else {
    out[0] = a[0];
    out[1] = a[4];
    out[2] = a[8];
    out[3] = a[12];
    out[4] = a[1];
    out[5] = a[5];
    out[6] = a[9];
    out[7] = a[13];
    out[8] = a[2];
    out[9] = a[6];
    out[10] = a[10];
    out[11] = a[14];
    out[12] = a[3];
    out[13] = a[7];
    out[14] = a[11];
    out[15] = a[15];
  }

  return out;
}
/**
 * Inverts a mat4
 *
 * @param {mat4} out the receiving matrix
 * @param {ReadonlyMat4} a the source matrix
 * @returns {mat4} out
 */

function invert$2(out, a) {
  var a00 = a[0],
      a01 = a[1],
      a02 = a[2],
      a03 = a[3];
  var a10 = a[4],
      a11 = a[5],
      a12 = a[6],
      a13 = a[7];
  var a20 = a[8],
      a21 = a[9],
      a22 = a[10],
      a23 = a[11];
  var a30 = a[12],
      a31 = a[13],
      a32 = a[14],
      a33 = a[15];
  var b00 = a00 * a11 - a01 * a10;
  var b01 = a00 * a12 - a02 * a10;
  var b02 = a00 * a13 - a03 * a10;
  var b03 = a01 * a12 - a02 * a11;
  var b04 = a01 * a13 - a03 * a11;
  var b05 = a02 * a13 - a03 * a12;
  var b06 = a20 * a31 - a21 * a30;
  var b07 = a20 * a32 - a22 * a30;
  var b08 = a20 * a33 - a23 * a30;
  var b09 = a21 * a32 - a22 * a31;
  var b10 = a21 * a33 - a23 * a31;
  var b11 = a22 * a33 - a23 * a32; // Calculate the determinant

  var det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;

  if (!det) {
    return null;
  }

  det = 1.0 / det;
  out[0] = (a11 * b11 - a12 * b10 + a13 * b09) * det;
  out[1] = (a02 * b10 - a01 * b11 - a03 * b09) * det;
  out[2] = (a31 * b05 - a32 * b04 + a33 * b03) * det;
  out[3] = (a22 * b04 - a21 * b05 - a23 * b03) * det;
  out[4] = (a12 * b08 - a10 * b11 - a13 * b07) * det;
  out[5] = (a00 * b11 - a02 * b08 + a03 * b07) * det;
  out[6] = (a32 * b02 - a30 * b05 - a33 * b01) * det;
  out[7] = (a20 * b05 - a22 * b02 + a23 * b01) * det;
  out[8] = (a10 * b10 - a11 * b08 + a13 * b06) * det;
  out[9] = (a01 * b08 - a00 * b10 - a03 * b06) * det;
  out[10] = (a30 * b04 - a31 * b02 + a33 * b00) * det;
  out[11] = (a21 * b02 - a20 * b04 - a23 * b00) * det;
  out[12] = (a11 * b07 - a10 * b09 - a12 * b06) * det;
  out[13] = (a00 * b09 - a01 * b07 + a02 * b06) * det;
  out[14] = (a31 * b01 - a30 * b03 - a32 * b00) * det;
  out[15] = (a20 * b03 - a21 * b01 + a22 * b00) * det;
  return out;
}
/**
 * Calculates the adjugate of a mat4
 *
 * @param {mat4} out the receiving matrix
 * @param {ReadonlyMat4} a the source matrix
 * @returns {mat4} out
 */

function adjoint(out, a) {
  var a00 = a[0],
      a01 = a[1],
      a02 = a[2],
      a03 = a[3];
  var a10 = a[4],
      a11 = a[5],
      a12 = a[6],
      a13 = a[7];
  var a20 = a[8],
      a21 = a[9],
      a22 = a[10],
      a23 = a[11];
  var a30 = a[12],
      a31 = a[13],
      a32 = a[14],
      a33 = a[15];
  out[0] = a11 * (a22 * a33 - a23 * a32) - a21 * (a12 * a33 - a13 * a32) + a31 * (a12 * a23 - a13 * a22);
  out[1] = -(a01 * (a22 * a33 - a23 * a32) - a21 * (a02 * a33 - a03 * a32) + a31 * (a02 * a23 - a03 * a22));
  out[2] = a01 * (a12 * a33 - a13 * a32) - a11 * (a02 * a33 - a03 * a32) + a31 * (a02 * a13 - a03 * a12);
  out[3] = -(a01 * (a12 * a23 - a13 * a22) - a11 * (a02 * a23 - a03 * a22) + a21 * (a02 * a13 - a03 * a12));
  out[4] = -(a10 * (a22 * a33 - a23 * a32) - a20 * (a12 * a33 - a13 * a32) + a30 * (a12 * a23 - a13 * a22));
  out[5] = a00 * (a22 * a33 - a23 * a32) - a20 * (a02 * a33 - a03 * a32) + a30 * (a02 * a23 - a03 * a22);
  out[6] = -(a00 * (a12 * a33 - a13 * a32) - a10 * (a02 * a33 - a03 * a32) + a30 * (a02 * a13 - a03 * a12));
  out[7] = a00 * (a12 * a23 - a13 * a22) - a10 * (a02 * a23 - a03 * a22) + a20 * (a02 * a13 - a03 * a12);
  out[8] = a10 * (a21 * a33 - a23 * a31) - a20 * (a11 * a33 - a13 * a31) + a30 * (a11 * a23 - a13 * a21);
  out[9] = -(a00 * (a21 * a33 - a23 * a31) - a20 * (a01 * a33 - a03 * a31) + a30 * (a01 * a23 - a03 * a21));
  out[10] = a00 * (a11 * a33 - a13 * a31) - a10 * (a01 * a33 - a03 * a31) + a30 * (a01 * a13 - a03 * a11);
  out[11] = -(a00 * (a11 * a23 - a13 * a21) - a10 * (a01 * a23 - a03 * a21) + a20 * (a01 * a13 - a03 * a11));
  out[12] = -(a10 * (a21 * a32 - a22 * a31) - a20 * (a11 * a32 - a12 * a31) + a30 * (a11 * a22 - a12 * a21));
  out[13] = a00 * (a21 * a32 - a22 * a31) - a20 * (a01 * a32 - a02 * a31) + a30 * (a01 * a22 - a02 * a21);
  out[14] = -(a00 * (a11 * a32 - a12 * a31) - a10 * (a01 * a32 - a02 * a31) + a30 * (a01 * a12 - a02 * a11));
  out[15] = a00 * (a11 * a22 - a12 * a21) - a10 * (a01 * a22 - a02 * a21) + a20 * (a01 * a12 - a02 * a11);
  return out;
}
/**
 * Calculates the determinant of a mat4
 *
 * @param {ReadonlyMat4} a the source matrix
 * @returns {Number} determinant of a
 */

function determinant(a) {
  var a00 = a[0],
      a01 = a[1],
      a02 = a[2],
      a03 = a[3];
  var a10 = a[4],
      a11 = a[5],
      a12 = a[6],
      a13 = a[7];
  var a20 = a[8],
      a21 = a[9],
      a22 = a[10],
      a23 = a[11];
  var a30 = a[12],
      a31 = a[13],
      a32 = a[14],
      a33 = a[15];
  var b00 = a00 * a11 - a01 * a10;
  var b01 = a00 * a12 - a02 * a10;
  var b02 = a00 * a13 - a03 * a10;
  var b03 = a01 * a12 - a02 * a11;
  var b04 = a01 * a13 - a03 * a11;
  var b05 = a02 * a13 - a03 * a12;
  var b06 = a20 * a31 - a21 * a30;
  var b07 = a20 * a32 - a22 * a30;
  var b08 = a20 * a33 - a23 * a30;
  var b09 = a21 * a32 - a22 * a31;
  var b10 = a21 * a33 - a23 * a31;
  var b11 = a22 * a33 - a23 * a32; // Calculate the determinant

  return b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;
}
/**
 * Multiplies two mat4s
 *
 * @param {mat4} out the receiving matrix
 * @param {ReadonlyMat4} a the first operand
 * @param {ReadonlyMat4} b the second operand
 * @returns {mat4} out
 */

function multiply$5(out, a, b) {
  var a00 = a[0],
      a01 = a[1],
      a02 = a[2],
      a03 = a[3];
  var a10 = a[4],
      a11 = a[5],
      a12 = a[6],
      a13 = a[7];
  var a20 = a[8],
      a21 = a[9],
      a22 = a[10],
      a23 = a[11];
  var a30 = a[12],
      a31 = a[13],
      a32 = a[14],
      a33 = a[15]; // Cache only the current line of the second matrix

  var b0 = b[0],
      b1 = b[1],
      b2 = b[2],
      b3 = b[3];
  out[0] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
  out[1] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
  out[2] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
  out[3] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;
  b0 = b[4];
  b1 = b[5];
  b2 = b[6];
  b3 = b[7];
  out[4] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
  out[5] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
  out[6] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
  out[7] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;
  b0 = b[8];
  b1 = b[9];
  b2 = b[10];
  b3 = b[11];
  out[8] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
  out[9] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
  out[10] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
  out[11] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;
  b0 = b[12];
  b1 = b[13];
  b2 = b[14];
  b3 = b[15];
  out[12] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
  out[13] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
  out[14] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
  out[15] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;
  return out;
}
/**
 * Translate a mat4 by the given vector
 *
 * @param {mat4} out the receiving matrix
 * @param {ReadonlyMat4} a the matrix to translate
 * @param {ReadonlyVec3} v vector to translate by
 * @returns {mat4} out
 */

function translate$1(out, a, v) {
  var x = v[0],
      y = v[1],
      z = v[2];
  var a00, a01, a02, a03;
  var a10, a11, a12, a13;
  var a20, a21, a22, a23;

  if (a === out) {
    out[12] = a[0] * x + a[4] * y + a[8] * z + a[12];
    out[13] = a[1] * x + a[5] * y + a[9] * z + a[13];
    out[14] = a[2] * x + a[6] * y + a[10] * z + a[14];
    out[15] = a[3] * x + a[7] * y + a[11] * z + a[15];
  } else {
    a00 = a[0];
    a01 = a[1];
    a02 = a[2];
    a03 = a[3];
    a10 = a[4];
    a11 = a[5];
    a12 = a[6];
    a13 = a[7];
    a20 = a[8];
    a21 = a[9];
    a22 = a[10];
    a23 = a[11];
    out[0] = a00;
    out[1] = a01;
    out[2] = a02;
    out[3] = a03;
    out[4] = a10;
    out[5] = a11;
    out[6] = a12;
    out[7] = a13;
    out[8] = a20;
    out[9] = a21;
    out[10] = a22;
    out[11] = a23;
    out[12] = a00 * x + a10 * y + a20 * z + a[12];
    out[13] = a01 * x + a11 * y + a21 * z + a[13];
    out[14] = a02 * x + a12 * y + a22 * z + a[14];
    out[15] = a03 * x + a13 * y + a23 * z + a[15];
  }

  return out;
}
/**
 * Scales the mat4 by the dimensions in the given vec3 not using vectorization
 *
 * @param {mat4} out the receiving matrix
 * @param {ReadonlyMat4} a the matrix to scale
 * @param {ReadonlyVec3} v the vec3 to scale the matrix by
 * @returns {mat4} out
 **/

function scale$5(out, a, v) {
  var x = v[0],
      y = v[1],
      z = v[2];
  out[0] = a[0] * x;
  out[1] = a[1] * x;
  out[2] = a[2] * x;
  out[3] = a[3] * x;
  out[4] = a[4] * y;
  out[5] = a[5] * y;
  out[6] = a[6] * y;
  out[7] = a[7] * y;
  out[8] = a[8] * z;
  out[9] = a[9] * z;
  out[10] = a[10] * z;
  out[11] = a[11] * z;
  out[12] = a[12];
  out[13] = a[13];
  out[14] = a[14];
  out[15] = a[15];
  return out;
}
/**
 * Rotates a mat4 by the given angle around the given axis
 *
 * @param {mat4} out the receiving matrix
 * @param {ReadonlyMat4} a the matrix to rotate
 * @param {Number} rad the angle to rotate the matrix by
 * @param {ReadonlyVec3} axis the axis to rotate around
 * @returns {mat4} out
 */

function rotate$1(out, a, rad, axis) {
  var x = axis[0],
      y = axis[1],
      z = axis[2];
  var len = Math.hypot(x, y, z);
  var s, c, t;
  var a00, a01, a02, a03;
  var a10, a11, a12, a13;
  var a20, a21, a22, a23;
  var b00, b01, b02;
  var b10, b11, b12;
  var b20, b21, b22;

  if (len < EPSILON) {
    return null;
  }

  len = 1 / len;
  x *= len;
  y *= len;
  z *= len;
  s = Math.sin(rad);
  c = Math.cos(rad);
  t = 1 - c;
  a00 = a[0];
  a01 = a[1];
  a02 = a[2];
  a03 = a[3];
  a10 = a[4];
  a11 = a[5];
  a12 = a[6];
  a13 = a[7];
  a20 = a[8];
  a21 = a[9];
  a22 = a[10];
  a23 = a[11]; // Construct the elements of the rotation matrix

  b00 = x * x * t + c;
  b01 = y * x * t + z * s;
  b02 = z * x * t - y * s;
  b10 = x * y * t - z * s;
  b11 = y * y * t + c;
  b12 = z * y * t + x * s;
  b20 = x * z * t + y * s;
  b21 = y * z * t - x * s;
  b22 = z * z * t + c; // Perform rotation-specific matrix multiplication

  out[0] = a00 * b00 + a10 * b01 + a20 * b02;
  out[1] = a01 * b00 + a11 * b01 + a21 * b02;
  out[2] = a02 * b00 + a12 * b01 + a22 * b02;
  out[3] = a03 * b00 + a13 * b01 + a23 * b02;
  out[4] = a00 * b10 + a10 * b11 + a20 * b12;
  out[5] = a01 * b10 + a11 * b11 + a21 * b12;
  out[6] = a02 * b10 + a12 * b11 + a22 * b12;
  out[7] = a03 * b10 + a13 * b11 + a23 * b12;
  out[8] = a00 * b20 + a10 * b21 + a20 * b22;
  out[9] = a01 * b20 + a11 * b21 + a21 * b22;
  out[10] = a02 * b20 + a12 * b21 + a22 * b22;
  out[11] = a03 * b20 + a13 * b21 + a23 * b22;

  if (a !== out) {
    // If the source and destination differ, copy the unchanged last row
    out[12] = a[12];
    out[13] = a[13];
    out[14] = a[14];
    out[15] = a[15];
  }

  return out;
}
/**
 * Rotates a matrix by the given angle around the X axis
 *
 * @param {mat4} out the receiving matrix
 * @param {ReadonlyMat4} a the matrix to rotate
 * @param {Number} rad the angle to rotate the matrix by
 * @returns {mat4} out
 */

function rotateX$3(out, a, rad) {
  var s = Math.sin(rad);
  var c = Math.cos(rad);
  var a10 = a[4];
  var a11 = a[5];
  var a12 = a[6];
  var a13 = a[7];
  var a20 = a[8];
  var a21 = a[9];
  var a22 = a[10];
  var a23 = a[11];

  if (a !== out) {
    // If the source and destination differ, copy the unchanged rows
    out[0] = a[0];
    out[1] = a[1];
    out[2] = a[2];
    out[3] = a[3];
    out[12] = a[12];
    out[13] = a[13];
    out[14] = a[14];
    out[15] = a[15];
  } // Perform axis-specific matrix multiplication


  out[4] = a10 * c + a20 * s;
  out[5] = a11 * c + a21 * s;
  out[6] = a12 * c + a22 * s;
  out[7] = a13 * c + a23 * s;
  out[8] = a20 * c - a10 * s;
  out[9] = a21 * c - a11 * s;
  out[10] = a22 * c - a12 * s;
  out[11] = a23 * c - a13 * s;
  return out;
}
/**
 * Rotates a matrix by the given angle around the Y axis
 *
 * @param {mat4} out the receiving matrix
 * @param {ReadonlyMat4} a the matrix to rotate
 * @param {Number} rad the angle to rotate the matrix by
 * @returns {mat4} out
 */

function rotateY$3(out, a, rad) {
  var s = Math.sin(rad);
  var c = Math.cos(rad);
  var a00 = a[0];
  var a01 = a[1];
  var a02 = a[2];
  var a03 = a[3];
  var a20 = a[8];
  var a21 = a[9];
  var a22 = a[10];
  var a23 = a[11];

  if (a !== out) {
    // If the source and destination differ, copy the unchanged rows
    out[4] = a[4];
    out[5] = a[5];
    out[6] = a[6];
    out[7] = a[7];
    out[12] = a[12];
    out[13] = a[13];
    out[14] = a[14];
    out[15] = a[15];
  } // Perform axis-specific matrix multiplication


  out[0] = a00 * c - a20 * s;
  out[1] = a01 * c - a21 * s;
  out[2] = a02 * c - a22 * s;
  out[3] = a03 * c - a23 * s;
  out[8] = a00 * s + a20 * c;
  out[9] = a01 * s + a21 * c;
  out[10] = a02 * s + a22 * c;
  out[11] = a03 * s + a23 * c;
  return out;
}
/**
 * Rotates a matrix by the given angle around the Z axis
 *
 * @param {mat4} out the receiving matrix
 * @param {ReadonlyMat4} a the matrix to rotate
 * @param {Number} rad the angle to rotate the matrix by
 * @returns {mat4} out
 */

function rotateZ$3(out, a, rad) {
  var s = Math.sin(rad);
  var c = Math.cos(rad);
  var a00 = a[0];
  var a01 = a[1];
  var a02 = a[2];
  var a03 = a[3];
  var a10 = a[4];
  var a11 = a[5];
  var a12 = a[6];
  var a13 = a[7];

  if (a !== out) {
    // If the source and destination differ, copy the unchanged last row
    out[8] = a[8];
    out[9] = a[9];
    out[10] = a[10];
    out[11] = a[11];
    out[12] = a[12];
    out[13] = a[13];
    out[14] = a[14];
    out[15] = a[15];
  } // Perform axis-specific matrix multiplication


  out[0] = a00 * c + a10 * s;
  out[1] = a01 * c + a11 * s;
  out[2] = a02 * c + a12 * s;
  out[3] = a03 * c + a13 * s;
  out[4] = a10 * c - a00 * s;
  out[5] = a11 * c - a01 * s;
  out[6] = a12 * c - a02 * s;
  out[7] = a13 * c - a03 * s;
  return out;
}
/**
 * Creates a matrix from a vector translation
 * This is equivalent to (but much faster than):
 *
 *     mat4.identity(dest);
 *     mat4.translate(dest, dest, vec);
 *
 * @param {mat4} out mat4 receiving operation result
 * @param {ReadonlyVec3} v Translation vector
 * @returns {mat4} out
 */

function fromTranslation$1(out, v) {
  out[0] = 1;
  out[1] = 0;
  out[2] = 0;
  out[3] = 0;
  out[4] = 0;
  out[5] = 1;
  out[6] = 0;
  out[7] = 0;
  out[8] = 0;
  out[9] = 0;
  out[10] = 1;
  out[11] = 0;
  out[12] = v[0];
  out[13] = v[1];
  out[14] = v[2];
  out[15] = 1;
  return out;
}
/**
 * Creates a matrix from a vector scaling
 * This is equivalent to (but much faster than):
 *
 *     mat4.identity(dest);
 *     mat4.scale(dest, dest, vec);
 *
 * @param {mat4} out mat4 receiving operation result
 * @param {ReadonlyVec3} v Scaling vector
 * @returns {mat4} out
 */

function fromScaling(out, v) {
  out[0] = v[0];
  out[1] = 0;
  out[2] = 0;
  out[3] = 0;
  out[4] = 0;
  out[5] = v[1];
  out[6] = 0;
  out[7] = 0;
  out[8] = 0;
  out[9] = 0;
  out[10] = v[2];
  out[11] = 0;
  out[12] = 0;
  out[13] = 0;
  out[14] = 0;
  out[15] = 1;
  return out;
}
/**
 * Creates a matrix from a given angle around a given axis
 * This is equivalent to (but much faster than):
 *
 *     mat4.identity(dest);
 *     mat4.rotate(dest, dest, rad, axis);
 *
 * @param {mat4} out mat4 receiving operation result
 * @param {Number} rad the angle to rotate the matrix by
 * @param {ReadonlyVec3} axis the axis to rotate around
 * @returns {mat4} out
 */

function fromRotation$1(out, rad, axis) {
  var x = axis[0],
      y = axis[1],
      z = axis[2];
  var len = Math.hypot(x, y, z);
  var s, c, t;

  if (len < EPSILON) {
    return null;
  }

  len = 1 / len;
  x *= len;
  y *= len;
  z *= len;
  s = Math.sin(rad);
  c = Math.cos(rad);
  t = 1 - c; // Perform rotation-specific matrix multiplication

  out[0] = x * x * t + c;
  out[1] = y * x * t + z * s;
  out[2] = z * x * t - y * s;
  out[3] = 0;
  out[4] = x * y * t - z * s;
  out[5] = y * y * t + c;
  out[6] = z * y * t + x * s;
  out[7] = 0;
  out[8] = x * z * t + y * s;
  out[9] = y * z * t - x * s;
  out[10] = z * z * t + c;
  out[11] = 0;
  out[12] = 0;
  out[13] = 0;
  out[14] = 0;
  out[15] = 1;
  return out;
}
/**
 * Creates a matrix from the given angle around the X axis
 * This is equivalent to (but much faster than):
 *
 *     mat4.identity(dest);
 *     mat4.rotateX(dest, dest, rad);
 *
 * @param {mat4} out mat4 receiving operation result
 * @param {Number} rad the angle to rotate the matrix by
 * @returns {mat4} out
 */

function fromXRotation(out, rad) {
  var s = Math.sin(rad);
  var c = Math.cos(rad); // Perform axis-specific matrix multiplication

  out[0] = 1;
  out[1] = 0;
  out[2] = 0;
  out[3] = 0;
  out[4] = 0;
  out[5] = c;
  out[6] = s;
  out[7] = 0;
  out[8] = 0;
  out[9] = -s;
  out[10] = c;
  out[11] = 0;
  out[12] = 0;
  out[13] = 0;
  out[14] = 0;
  out[15] = 1;
  return out;
}
/**
 * Creates a matrix from the given angle around the Y axis
 * This is equivalent to (but much faster than):
 *
 *     mat4.identity(dest);
 *     mat4.rotateY(dest, dest, rad);
 *
 * @param {mat4} out mat4 receiving operation result
 * @param {Number} rad the angle to rotate the matrix by
 * @returns {mat4} out
 */

function fromYRotation(out, rad) {
  var s = Math.sin(rad);
  var c = Math.cos(rad); // Perform axis-specific matrix multiplication

  out[0] = c;
  out[1] = 0;
  out[2] = -s;
  out[3] = 0;
  out[4] = 0;
  out[5] = 1;
  out[6] = 0;
  out[7] = 0;
  out[8] = s;
  out[9] = 0;
  out[10] = c;
  out[11] = 0;
  out[12] = 0;
  out[13] = 0;
  out[14] = 0;
  out[15] = 1;
  return out;
}
/**
 * Creates a matrix from the given angle around the Z axis
 * This is equivalent to (but much faster than):
 *
 *     mat4.identity(dest);
 *     mat4.rotateZ(dest, dest, rad);
 *
 * @param {mat4} out mat4 receiving operation result
 * @param {Number} rad the angle to rotate the matrix by
 * @returns {mat4} out
 */

function fromZRotation(out, rad) {
  var s = Math.sin(rad);
  var c = Math.cos(rad); // Perform axis-specific matrix multiplication

  out[0] = c;
  out[1] = s;
  out[2] = 0;
  out[3] = 0;
  out[4] = -s;
  out[5] = c;
  out[6] = 0;
  out[7] = 0;
  out[8] = 0;
  out[9] = 0;
  out[10] = 1;
  out[11] = 0;
  out[12] = 0;
  out[13] = 0;
  out[14] = 0;
  out[15] = 1;
  return out;
}
/**
 * Creates a matrix from a quaternion rotation and vector translation
 * This is equivalent to (but much faster than):
 *
 *     mat4.identity(dest);
 *     mat4.translate(dest, vec);
 *     let quatMat = mat4.create();
 *     quat4.toMat4(quat, quatMat);
 *     mat4.multiply(dest, quatMat);
 *
 * @param {mat4} out mat4 receiving operation result
 * @param {quat4} q Rotation quaternion
 * @param {ReadonlyVec3} v Translation vector
 * @returns {mat4} out
 */

function fromRotationTranslation$1(out, q, v) {
  // Quaternion math
  var x = q[0],
      y = q[1],
      z = q[2],
      w = q[3];
  var x2 = x + x;
  var y2 = y + y;
  var z2 = z + z;
  var xx = x * x2;
  var xy = x * y2;
  var xz = x * z2;
  var yy = y * y2;
  var yz = y * z2;
  var zz = z * z2;
  var wx = w * x2;
  var wy = w * y2;
  var wz = w * z2;
  out[0] = 1 - (yy + zz);
  out[1] = xy + wz;
  out[2] = xz - wy;
  out[3] = 0;
  out[4] = xy - wz;
  out[5] = 1 - (xx + zz);
  out[6] = yz + wx;
  out[7] = 0;
  out[8] = xz + wy;
  out[9] = yz - wx;
  out[10] = 1 - (xx + yy);
  out[11] = 0;
  out[12] = v[0];
  out[13] = v[1];
  out[14] = v[2];
  out[15] = 1;
  return out;
}
/**
 * Creates a new mat4 from a dual quat.
 *
 * @param {mat4} out Matrix
 * @param {ReadonlyQuat2} a Dual Quaternion
 * @returns {mat4} mat4 receiving operation result
 */

function fromQuat2(out, a) {
  var translation = new ARRAY_TYPE(3);
  var bx = -a[0],
      by = -a[1],
      bz = -a[2],
      bw = a[3],
      ax = a[4],
      ay = a[5],
      az = a[6],
      aw = a[7];
  var magnitude = bx * bx + by * by + bz * bz + bw * bw; //Only scale if it makes sense

  if (magnitude > 0) {
    translation[0] = (ax * bw + aw * bx + ay * bz - az * by) * 2 / magnitude;
    translation[1] = (ay * bw + aw * by + az * bx - ax * bz) * 2 / magnitude;
    translation[2] = (az * bw + aw * bz + ax * by - ay * bx) * 2 / magnitude;
  } else {
    translation[0] = (ax * bw + aw * bx + ay * bz - az * by) * 2;
    translation[1] = (ay * bw + aw * by + az * bx - ax * bz) * 2;
    translation[2] = (az * bw + aw * bz + ax * by - ay * bx) * 2;
  }

  fromRotationTranslation$1(out, a, translation);
  return out;
}
/**
 * Returns the translation vector component of a transformation
 *  matrix. If a matrix is built with fromRotationTranslation,
 *  the returned vector will be the same as the translation vector
 *  originally supplied.
 * @param  {vec3} out Vector to receive translation component
 * @param  {ReadonlyMat4} mat Matrix to be decomposed (input)
 * @return {vec3} out
 */

function getTranslation$1(out, mat) {
  out[0] = mat[12];
  out[1] = mat[13];
  out[2] = mat[14];
  return out;
}
/**
 * Returns the scaling factor component of a transformation
 *  matrix. If a matrix is built with fromRotationTranslationScale
 *  with a normalized Quaternion paramter, the returned vector will be
 *  the same as the scaling vector
 *  originally supplied.
 * @param  {vec3} out Vector to receive scaling factor component
 * @param  {ReadonlyMat4} mat Matrix to be decomposed (input)
 * @return {vec3} out
 */

function getScaling(out, mat) {
  var m11 = mat[0];
  var m12 = mat[1];
  var m13 = mat[2];
  var m21 = mat[4];
  var m22 = mat[5];
  var m23 = mat[6];
  var m31 = mat[8];
  var m32 = mat[9];
  var m33 = mat[10];
  out[0] = Math.hypot(m11, m12, m13);
  out[1] = Math.hypot(m21, m22, m23);
  out[2] = Math.hypot(m31, m32, m33);
  return out;
}
/**
 * Returns a quaternion representing the rotational component
 *  of a transformation matrix. If a matrix is built with
 *  fromRotationTranslation, the returned quaternion will be the
 *  same as the quaternion originally supplied.
 * @param {quat} out Quaternion to receive the rotation component
 * @param {ReadonlyMat4} mat Matrix to be decomposed (input)
 * @return {quat} out
 */

function getRotation(out, mat) {
  var scaling = new ARRAY_TYPE(3);
  getScaling(scaling, mat);
  var is1 = 1 / scaling[0];
  var is2 = 1 / scaling[1];
  var is3 = 1 / scaling[2];
  var sm11 = mat[0] * is1;
  var sm12 = mat[1] * is2;
  var sm13 = mat[2] * is3;
  var sm21 = mat[4] * is1;
  var sm22 = mat[5] * is2;
  var sm23 = mat[6] * is3;
  var sm31 = mat[8] * is1;
  var sm32 = mat[9] * is2;
  var sm33 = mat[10] * is3;
  var trace = sm11 + sm22 + sm33;
  var S = 0;

  if (trace > 0) {
    S = Math.sqrt(trace + 1.0) * 2;
    out[3] = 0.25 * S;
    out[0] = (sm23 - sm32) / S;
    out[1] = (sm31 - sm13) / S;
    out[2] = (sm12 - sm21) / S;
  } else if (sm11 > sm22 && sm11 > sm33) {
    S = Math.sqrt(1.0 + sm11 - sm22 - sm33) * 2;
    out[3] = (sm23 - sm32) / S;
    out[0] = 0.25 * S;
    out[1] = (sm12 + sm21) / S;
    out[2] = (sm31 + sm13) / S;
  } else if (sm22 > sm33) {
    S = Math.sqrt(1.0 + sm22 - sm11 - sm33) * 2;
    out[3] = (sm31 - sm13) / S;
    out[0] = (sm12 + sm21) / S;
    out[1] = 0.25 * S;
    out[2] = (sm23 + sm32) / S;
  } else {
    S = Math.sqrt(1.0 + sm33 - sm11 - sm22) * 2;
    out[3] = (sm12 - sm21) / S;
    out[0] = (sm31 + sm13) / S;
    out[1] = (sm23 + sm32) / S;
    out[2] = 0.25 * S;
  }

  return out;
}
/**
 * Creates a matrix from a quaternion rotation, vector translation and vector scale
 * This is equivalent to (but much faster than):
 *
 *     mat4.identity(dest);
 *     mat4.translate(dest, vec);
 *     let quatMat = mat4.create();
 *     quat4.toMat4(quat, quatMat);
 *     mat4.multiply(dest, quatMat);
 *     mat4.scale(dest, scale)
 *
 * @param {mat4} out mat4 receiving operation result
 * @param {quat4} q Rotation quaternion
 * @param {ReadonlyVec3} v Translation vector
 * @param {ReadonlyVec3} s Scaling vector
 * @returns {mat4} out
 */

function fromRotationTranslationScale(out, q, v, s) {
  // Quaternion math
  var x = q[0],
      y = q[1],
      z = q[2],
      w = q[3];
  var x2 = x + x;
  var y2 = y + y;
  var z2 = z + z;
  var xx = x * x2;
  var xy = x * y2;
  var xz = x * z2;
  var yy = y * y2;
  var yz = y * z2;
  var zz = z * z2;
  var wx = w * x2;
  var wy = w * y2;
  var wz = w * z2;
  var sx = s[0];
  var sy = s[1];
  var sz = s[2];
  out[0] = (1 - (yy + zz)) * sx;
  out[1] = (xy + wz) * sx;
  out[2] = (xz - wy) * sx;
  out[3] = 0;
  out[4] = (xy - wz) * sy;
  out[5] = (1 - (xx + zz)) * sy;
  out[6] = (yz + wx) * sy;
  out[7] = 0;
  out[8] = (xz + wy) * sz;
  out[9] = (yz - wx) * sz;
  out[10] = (1 - (xx + yy)) * sz;
  out[11] = 0;
  out[12] = v[0];
  out[13] = v[1];
  out[14] = v[2];
  out[15] = 1;
  return out;
}
/**
 * Creates a matrix from a quaternion rotation, vector translation and vector scale, rotating and scaling around the given origin
 * This is equivalent to (but much faster than):
 *
 *     mat4.identity(dest);
 *     mat4.translate(dest, vec);
 *     mat4.translate(dest, origin);
 *     let quatMat = mat4.create();
 *     quat4.toMat4(quat, quatMat);
 *     mat4.multiply(dest, quatMat);
 *     mat4.scale(dest, scale)
 *     mat4.translate(dest, negativeOrigin);
 *
 * @param {mat4} out mat4 receiving operation result
 * @param {quat4} q Rotation quaternion
 * @param {ReadonlyVec3} v Translation vector
 * @param {ReadonlyVec3} s Scaling vector
 * @param {ReadonlyVec3} o The origin vector around which to scale and rotate
 * @returns {mat4} out
 */

function fromRotationTranslationScaleOrigin(out, q, v, s, o) {
  // Quaternion math
  var x = q[0],
      y = q[1],
      z = q[2],
      w = q[3];
  var x2 = x + x;
  var y2 = y + y;
  var z2 = z + z;
  var xx = x * x2;
  var xy = x * y2;
  var xz = x * z2;
  var yy = y * y2;
  var yz = y * z2;
  var zz = z * z2;
  var wx = w * x2;
  var wy = w * y2;
  var wz = w * z2;
  var sx = s[0];
  var sy = s[1];
  var sz = s[2];
  var ox = o[0];
  var oy = o[1];
  var oz = o[2];
  var out0 = (1 - (yy + zz)) * sx;
  var out1 = (xy + wz) * sx;
  var out2 = (xz - wy) * sx;
  var out4 = (xy - wz) * sy;
  var out5 = (1 - (xx + zz)) * sy;
  var out6 = (yz + wx) * sy;
  var out8 = (xz + wy) * sz;
  var out9 = (yz - wx) * sz;
  var out10 = (1 - (xx + yy)) * sz;
  out[0] = out0;
  out[1] = out1;
  out[2] = out2;
  out[3] = 0;
  out[4] = out4;
  out[5] = out5;
  out[6] = out6;
  out[7] = 0;
  out[8] = out8;
  out[9] = out9;
  out[10] = out10;
  out[11] = 0;
  out[12] = v[0] + ox - (out0 * ox + out4 * oy + out8 * oz);
  out[13] = v[1] + oy - (out1 * ox + out5 * oy + out9 * oz);
  out[14] = v[2] + oz - (out2 * ox + out6 * oy + out10 * oz);
  out[15] = 1;
  return out;
}
/**
 * Calculates a 4x4 matrix from the given quaternion
 *
 * @param {mat4} out mat4 receiving operation result
 * @param {ReadonlyQuat} q Quaternion to create matrix from
 *
 * @returns {mat4} out
 */

function fromQuat(out, q) {
  var x = q[0],
      y = q[1],
      z = q[2],
      w = q[3];
  var x2 = x + x;
  var y2 = y + y;
  var z2 = z + z;
  var xx = x * x2;
  var yx = y * x2;
  var yy = y * y2;
  var zx = z * x2;
  var zy = z * y2;
  var zz = z * z2;
  var wx = w * x2;
  var wy = w * y2;
  var wz = w * z2;
  out[0] = 1 - yy - zz;
  out[1] = yx + wz;
  out[2] = zx - wy;
  out[3] = 0;
  out[4] = yx - wz;
  out[5] = 1 - xx - zz;
  out[6] = zy + wx;
  out[7] = 0;
  out[8] = zx + wy;
  out[9] = zy - wx;
  out[10] = 1 - xx - yy;
  out[11] = 0;
  out[12] = 0;
  out[13] = 0;
  out[14] = 0;
  out[15] = 1;
  return out;
}
/**
 * Generates a frustum matrix with the given bounds
 *
 * @param {mat4} out mat4 frustum matrix will be written into
 * @param {Number} left Left bound of the frustum
 * @param {Number} right Right bound of the frustum
 * @param {Number} bottom Bottom bound of the frustum
 * @param {Number} top Top bound of the frustum
 * @param {Number} near Near bound of the frustum
 * @param {Number} far Far bound of the frustum
 * @returns {mat4} out
 */

function frustum(out, left, right, bottom, top, near, far) {
  var rl = 1 / (right - left);
  var tb = 1 / (top - bottom);
  var nf = 1 / (near - far);
  out[0] = near * 2 * rl;
  out[1] = 0;
  out[2] = 0;
  out[3] = 0;
  out[4] = 0;
  out[5] = near * 2 * tb;
  out[6] = 0;
  out[7] = 0;
  out[8] = (right + left) * rl;
  out[9] = (top + bottom) * tb;
  out[10] = (far + near) * nf;
  out[11] = -1;
  out[12] = 0;
  out[13] = 0;
  out[14] = far * near * 2 * nf;
  out[15] = 0;
  return out;
}
/**
 * Generates a perspective projection matrix with the given bounds.
 * The near/far clip planes correspond to a normalized device coordinate Z range of [-1, 1],
 * which matches WebGL/OpenGL's clip volume.
 * Passing null/undefined/no value for far will generate infinite projection matrix.
 *
 * @param {mat4} out mat4 frustum matrix will be written into
 * @param {number} fovy Vertical field of view in radians
 * @param {number} aspect Aspect ratio. typically viewport width/height
 * @param {number} near Near bound of the frustum
 * @param {number} far Far bound of the frustum, can be null or Infinity
 * @returns {mat4} out
 */

function perspectiveNO(out, fovy, aspect, near, far) {
  var f = 1.0 / Math.tan(fovy / 2),
      nf;
  out[0] = f / aspect;
  out[1] = 0;
  out[2] = 0;
  out[3] = 0;
  out[4] = 0;
  out[5] = f;
  out[6] = 0;
  out[7] = 0;
  out[8] = 0;
  out[9] = 0;
  out[11] = -1;
  out[12] = 0;
  out[13] = 0;
  out[15] = 0;

  if (far != null && far !== Infinity) {
    nf = 1 / (near - far);
    out[10] = (far + near) * nf;
    out[14] = 2 * far * near * nf;
  } else {
    out[10] = -1;
    out[14] = -2 * near;
  }

  return out;
}
/**
 * Alias for {@link mat4.perspectiveNO}
 * @function
 */

var perspective = perspectiveNO;
/**
 * Generates a perspective projection matrix suitable for WebGPU with the given bounds.
 * The near/far clip planes correspond to a normalized device coordinate Z range of [0, 1],
 * which matches WebGPU/Vulkan/DirectX/Metal's clip volume.
 * Passing null/undefined/no value for far will generate infinite projection matrix.
 *
 * @param {mat4} out mat4 frustum matrix will be written into
 * @param {number} fovy Vertical field of view in radians
 * @param {number} aspect Aspect ratio. typically viewport width/height
 * @param {number} near Near bound of the frustum
 * @param {number} far Far bound of the frustum, can be null or Infinity
 * @returns {mat4} out
 */

function perspectiveZO(out, fovy, aspect, near, far) {
  var f = 1.0 / Math.tan(fovy / 2),
      nf;
  out[0] = f / aspect;
  out[1] = 0;
  out[2] = 0;
  out[3] = 0;
  out[4] = 0;
  out[5] = f;
  out[6] = 0;
  out[7] = 0;
  out[8] = 0;
  out[9] = 0;
  out[11] = -1;
  out[12] = 0;
  out[13] = 0;
  out[15] = 0;

  if (far != null && far !== Infinity) {
    nf = 1 / (near - far);
    out[10] = far * nf;
    out[14] = far * near * nf;
  } else {
    out[10] = -1;
    out[14] = -near;
  }

  return out;
}
/**
 * Generates a perspective projection matrix with the given field of view.
 * This is primarily useful for generating projection matrices to be used
 * with the still experiemental WebVR API.
 *
 * @param {mat4} out mat4 frustum matrix will be written into
 * @param {Object} fov Object containing the following values: upDegrees, downDegrees, leftDegrees, rightDegrees
 * @param {number} near Near bound of the frustum
 * @param {number} far Far bound of the frustum
 * @returns {mat4} out
 */

function perspectiveFromFieldOfView(out, fov, near, far) {
  var upTan = Math.tan(fov.upDegrees * Math.PI / 180.0);
  var downTan = Math.tan(fov.downDegrees * Math.PI / 180.0);
  var leftTan = Math.tan(fov.leftDegrees * Math.PI / 180.0);
  var rightTan = Math.tan(fov.rightDegrees * Math.PI / 180.0);
  var xScale = 2.0 / (leftTan + rightTan);
  var yScale = 2.0 / (upTan + downTan);
  out[0] = xScale;
  out[1] = 0.0;
  out[2] = 0.0;
  out[3] = 0.0;
  out[4] = 0.0;
  out[5] = yScale;
  out[6] = 0.0;
  out[7] = 0.0;
  out[8] = -((leftTan - rightTan) * xScale * 0.5);
  out[9] = (upTan - downTan) * yScale * 0.5;
  out[10] = far / (near - far);
  out[11] = -1.0;
  out[12] = 0.0;
  out[13] = 0.0;
  out[14] = far * near / (near - far);
  out[15] = 0.0;
  return out;
}
/**
 * Generates a orthogonal projection matrix with the given bounds.
 * The near/far clip planes correspond to a normalized device coordinate Z range of [-1, 1],
 * which matches WebGL/OpenGL's clip volume.
 *
 * @param {mat4} out mat4 frustum matrix will be written into
 * @param {number} left Left bound of the frustum
 * @param {number} right Right bound of the frustum
 * @param {number} bottom Bottom bound of the frustum
 * @param {number} top Top bound of the frustum
 * @param {number} near Near bound of the frustum
 * @param {number} far Far bound of the frustum
 * @returns {mat4} out
 */

function orthoNO(out, left, right, bottom, top, near, far) {
  var lr = 1 / (left - right);
  var bt = 1 / (bottom - top);
  var nf = 1 / (near - far);
  out[0] = -2 * lr;
  out[1] = 0;
  out[2] = 0;
  out[3] = 0;
  out[4] = 0;
  out[5] = -2 * bt;
  out[6] = 0;
  out[7] = 0;
  out[8] = 0;
  out[9] = 0;
  out[10] = 2 * nf;
  out[11] = 0;
  out[12] = (left + right) * lr;
  out[13] = (top + bottom) * bt;
  out[14] = (far + near) * nf;
  out[15] = 1;
  return out;
}
/**
 * Alias for {@link mat4.orthoNO}
 * @function
 */

var ortho = orthoNO;
/**
 * Generates a orthogonal projection matrix with the given bounds.
 * The near/far clip planes correspond to a normalized device coordinate Z range of [0, 1],
 * which matches WebGPU/Vulkan/DirectX/Metal's clip volume.
 *
 * @param {mat4} out mat4 frustum matrix will be written into
 * @param {number} left Left bound of the frustum
 * @param {number} right Right bound of the frustum
 * @param {number} bottom Bottom bound of the frustum
 * @param {number} top Top bound of the frustum
 * @param {number} near Near bound of the frustum
 * @param {number} far Far bound of the frustum
 * @returns {mat4} out
 */

function orthoZO(out, left, right, bottom, top, near, far) {
  var lr = 1 / (left - right);
  var bt = 1 / (bottom - top);
  var nf = 1 / (near - far);
  out[0] = -2 * lr;
  out[1] = 0;
  out[2] = 0;
  out[3] = 0;
  out[4] = 0;
  out[5] = -2 * bt;
  out[6] = 0;
  out[7] = 0;
  out[8] = 0;
  out[9] = 0;
  out[10] = nf;
  out[11] = 0;
  out[12] = (left + right) * lr;
  out[13] = (top + bottom) * bt;
  out[14] = near * nf;
  out[15] = 1;
  return out;
}
/**
 * Generates a look-at matrix with the given eye position, focal point, and up axis.
 * If you want a matrix that actually makes an object look at another object, you should use targetTo instead.
 *
 * @param {mat4} out mat4 frustum matrix will be written into
 * @param {ReadonlyVec3} eye Position of the viewer
 * @param {ReadonlyVec3} center Point the viewer is looking at
 * @param {ReadonlyVec3} up vec3 pointing up
 * @returns {mat4} out
 */

function lookAt(out, eye, center, up) {
  var x0, x1, x2, y0, y1, y2, z0, z1, z2, len;
  var eyex = eye[0];
  var eyey = eye[1];
  var eyez = eye[2];
  var upx = up[0];
  var upy = up[1];
  var upz = up[2];
  var centerx = center[0];
  var centery = center[1];
  var centerz = center[2];

  if (Math.abs(eyex - centerx) < EPSILON && Math.abs(eyey - centery) < EPSILON && Math.abs(eyez - centerz) < EPSILON) {
    return identity$2(out);
  }

  z0 = eyex - centerx;
  z1 = eyey - centery;
  z2 = eyez - centerz;
  len = 1 / Math.hypot(z0, z1, z2);
  z0 *= len;
  z1 *= len;
  z2 *= len;
  x0 = upy * z2 - upz * z1;
  x1 = upz * z0 - upx * z2;
  x2 = upx * z1 - upy * z0;
  len = Math.hypot(x0, x1, x2);

  if (!len) {
    x0 = 0;
    x1 = 0;
    x2 = 0;
  } else {
    len = 1 / len;
    x0 *= len;
    x1 *= len;
    x2 *= len;
  }

  y0 = z1 * x2 - z2 * x1;
  y1 = z2 * x0 - z0 * x2;
  y2 = z0 * x1 - z1 * x0;
  len = Math.hypot(y0, y1, y2);

  if (!len) {
    y0 = 0;
    y1 = 0;
    y2 = 0;
  } else {
    len = 1 / len;
    y0 *= len;
    y1 *= len;
    y2 *= len;
  }

  out[0] = x0;
  out[1] = y0;
  out[2] = z0;
  out[3] = 0;
  out[4] = x1;
  out[5] = y1;
  out[6] = z1;
  out[7] = 0;
  out[8] = x2;
  out[9] = y2;
  out[10] = z2;
  out[11] = 0;
  out[12] = -(x0 * eyex + x1 * eyey + x2 * eyez);
  out[13] = -(y0 * eyex + y1 * eyey + y2 * eyez);
  out[14] = -(z0 * eyex + z1 * eyey + z2 * eyez);
  out[15] = 1;
  return out;
}
/**
 * Generates a matrix that makes something look at something else.
 *
 * @param {mat4} out mat4 frustum matrix will be written into
 * @param {ReadonlyVec3} eye Position of the viewer
 * @param {ReadonlyVec3} center Point the viewer is looking at
 * @param {ReadonlyVec3} up vec3 pointing up
 * @returns {mat4} out
 */

function targetTo(out, eye, target, up) {
  var eyex = eye[0],
      eyey = eye[1],
      eyez = eye[2],
      upx = up[0],
      upy = up[1],
      upz = up[2];
  var z0 = eyex - target[0],
      z1 = eyey - target[1],
      z2 = eyez - target[2];
  var len = z0 * z0 + z1 * z1 + z2 * z2;

  if (len > 0) {
    len = 1 / Math.sqrt(len);
    z0 *= len;
    z1 *= len;
    z2 *= len;
  }

  var x0 = upy * z2 - upz * z1,
      x1 = upz * z0 - upx * z2,
      x2 = upx * z1 - upy * z0;
  len = x0 * x0 + x1 * x1 + x2 * x2;

  if (len > 0) {
    len = 1 / Math.sqrt(len);
    x0 *= len;
    x1 *= len;
    x2 *= len;
  }

  out[0] = x0;
  out[1] = x1;
  out[2] = x2;
  out[3] = 0;
  out[4] = z1 * x2 - z2 * x1;
  out[5] = z2 * x0 - z0 * x2;
  out[6] = z0 * x1 - z1 * x0;
  out[7] = 0;
  out[8] = z0;
  out[9] = z1;
  out[10] = z2;
  out[11] = 0;
  out[12] = eyex;
  out[13] = eyey;
  out[14] = eyez;
  out[15] = 1;
  return out;
}
/**
 * Returns a string representation of a mat4
 *
 * @param {ReadonlyMat4} a matrix to represent as a string
 * @returns {String} string representation of the matrix
 */

function str$5(a) {
  return "mat4(" + a[0] + ", " + a[1] + ", " + a[2] + ", " + a[3] + ", " + a[4] + ", " + a[5] + ", " + a[6] + ", " + a[7] + ", " + a[8] + ", " + a[9] + ", " + a[10] + ", " + a[11] + ", " + a[12] + ", " + a[13] + ", " + a[14] + ", " + a[15] + ")";
}
/**
 * Returns Frobenius norm of a mat4
 *
 * @param {ReadonlyMat4} a the matrix to calculate Frobenius norm of
 * @returns {Number} Frobenius norm
 */

function frob(a) {
  return Math.hypot(a[0], a[1], a[2], a[3], a[4], a[5], a[6], a[7], a[8], a[9], a[10], a[11], a[12], a[13], a[14], a[15]);
}
/**
 * Adds two mat4's
 *
 * @param {mat4} out the receiving matrix
 * @param {ReadonlyMat4} a the first operand
 * @param {ReadonlyMat4} b the second operand
 * @returns {mat4} out
 */

function add$5(out, a, b) {
  out[0] = a[0] + b[0];
  out[1] = a[1] + b[1];
  out[2] = a[2] + b[2];
  out[3] = a[3] + b[3];
  out[4] = a[4] + b[4];
  out[5] = a[5] + b[5];
  out[6] = a[6] + b[6];
  out[7] = a[7] + b[7];
  out[8] = a[8] + b[8];
  out[9] = a[9] + b[9];
  out[10] = a[10] + b[10];
  out[11] = a[11] + b[11];
  out[12] = a[12] + b[12];
  out[13] = a[13] + b[13];
  out[14] = a[14] + b[14];
  out[15] = a[15] + b[15];
  return out;
}
/**
 * Subtracts matrix b from matrix a
 *
 * @param {mat4} out the receiving matrix
 * @param {ReadonlyMat4} a the first operand
 * @param {ReadonlyMat4} b the second operand
 * @returns {mat4} out
 */

function subtract$3(out, a, b) {
  out[0] = a[0] - b[0];
  out[1] = a[1] - b[1];
  out[2] = a[2] - b[2];
  out[3] = a[3] - b[3];
  out[4] = a[4] - b[4];
  out[5] = a[5] - b[5];
  out[6] = a[6] - b[6];
  out[7] = a[7] - b[7];
  out[8] = a[8] - b[8];
  out[9] = a[9] - b[9];
  out[10] = a[10] - b[10];
  out[11] = a[11] - b[11];
  out[12] = a[12] - b[12];
  out[13] = a[13] - b[13];
  out[14] = a[14] - b[14];
  out[15] = a[15] - b[15];
  return out;
}
/**
 * Multiply each element of the matrix by a scalar.
 *
 * @param {mat4} out the receiving matrix
 * @param {ReadonlyMat4} a the matrix to scale
 * @param {Number} b amount to scale the matrix's elements by
 * @returns {mat4} out
 */

function multiplyScalar(out, a, b) {
  out[0] = a[0] * b;
  out[1] = a[1] * b;
  out[2] = a[2] * b;
  out[3] = a[3] * b;
  out[4] = a[4] * b;
  out[5] = a[5] * b;
  out[6] = a[6] * b;
  out[7] = a[7] * b;
  out[8] = a[8] * b;
  out[9] = a[9] * b;
  out[10] = a[10] * b;
  out[11] = a[11] * b;
  out[12] = a[12] * b;
  out[13] = a[13] * b;
  out[14] = a[14] * b;
  out[15] = a[15] * b;
  return out;
}
/**
 * Adds two mat4's after multiplying each element of the second operand by a scalar value.
 *
 * @param {mat4} out the receiving vector
 * @param {ReadonlyMat4} a the first operand
 * @param {ReadonlyMat4} b the second operand
 * @param {Number} scale the amount to scale b's elements by before adding
 * @returns {mat4} out
 */

function multiplyScalarAndAdd(out, a, b, scale) {
  out[0] = a[0] + b[0] * scale;
  out[1] = a[1] + b[1] * scale;
  out[2] = a[2] + b[2] * scale;
  out[3] = a[3] + b[3] * scale;
  out[4] = a[4] + b[4] * scale;
  out[5] = a[5] + b[5] * scale;
  out[6] = a[6] + b[6] * scale;
  out[7] = a[7] + b[7] * scale;
  out[8] = a[8] + b[8] * scale;
  out[9] = a[9] + b[9] * scale;
  out[10] = a[10] + b[10] * scale;
  out[11] = a[11] + b[11] * scale;
  out[12] = a[12] + b[12] * scale;
  out[13] = a[13] + b[13] * scale;
  out[14] = a[14] + b[14] * scale;
  out[15] = a[15] + b[15] * scale;
  return out;
}
/**
 * Returns whether or not the matrices have exactly the same elements in the same position (when compared with ===)
 *
 * @param {ReadonlyMat4} a The first matrix.
 * @param {ReadonlyMat4} b The second matrix.
 * @returns {Boolean} True if the matrices are equal, false otherwise.
 */

function exactEquals$5(a, b) {
  return a[0] === b[0] && a[1] === b[1] && a[2] === b[2] && a[3] === b[3] && a[4] === b[4] && a[5] === b[5] && a[6] === b[6] && a[7] === b[7] && a[8] === b[8] && a[9] === b[9] && a[10] === b[10] && a[11] === b[11] && a[12] === b[12] && a[13] === b[13] && a[14] === b[14] && a[15] === b[15];
}
/**
 * Returns whether or not the matrices have approximately the same elements in the same position.
 *
 * @param {ReadonlyMat4} a The first matrix.
 * @param {ReadonlyMat4} b The second matrix.
 * @returns {Boolean} True if the matrices are equal, false otherwise.
 */

function equals$5(a, b) {
  var a0 = a[0],
      a1 = a[1],
      a2 = a[2],
      a3 = a[3];
  var a4 = a[4],
      a5 = a[5],
      a6 = a[6],
      a7 = a[7];
  var a8 = a[8],
      a9 = a[9],
      a10 = a[10],
      a11 = a[11];
  var a12 = a[12],
      a13 = a[13],
      a14 = a[14],
      a15 = a[15];
  var b0 = b[0],
      b1 = b[1],
      b2 = b[2],
      b3 = b[3];
  var b4 = b[4],
      b5 = b[5],
      b6 = b[6],
      b7 = b[7];
  var b8 = b[8],
      b9 = b[9],
      b10 = b[10],
      b11 = b[11];
  var b12 = b[12],
      b13 = b[13],
      b14 = b[14],
      b15 = b[15];
  return Math.abs(a0 - b0) <= EPSILON * Math.max(1.0, Math.abs(a0), Math.abs(b0)) && Math.abs(a1 - b1) <= EPSILON * Math.max(1.0, Math.abs(a1), Math.abs(b1)) && Math.abs(a2 - b2) <= EPSILON * Math.max(1.0, Math.abs(a2), Math.abs(b2)) && Math.abs(a3 - b3) <= EPSILON * Math.max(1.0, Math.abs(a3), Math.abs(b3)) && Math.abs(a4 - b4) <= EPSILON * Math.max(1.0, Math.abs(a4), Math.abs(b4)) && Math.abs(a5 - b5) <= EPSILON * Math.max(1.0, Math.abs(a5), Math.abs(b5)) && Math.abs(a6 - b6) <= EPSILON * Math.max(1.0, Math.abs(a6), Math.abs(b6)) && Math.abs(a7 - b7) <= EPSILON * Math.max(1.0, Math.abs(a7), Math.abs(b7)) && Math.abs(a8 - b8) <= EPSILON * Math.max(1.0, Math.abs(a8), Math.abs(b8)) && Math.abs(a9 - b9) <= EPSILON * Math.max(1.0, Math.abs(a9), Math.abs(b9)) && Math.abs(a10 - b10) <= EPSILON * Math.max(1.0, Math.abs(a10), Math.abs(b10)) && Math.abs(a11 - b11) <= EPSILON * Math.max(1.0, Math.abs(a11), Math.abs(b11)) && Math.abs(a12 - b12) <= EPSILON * Math.max(1.0, Math.abs(a12), Math.abs(b12)) && Math.abs(a13 - b13) <= EPSILON * Math.max(1.0, Math.abs(a13), Math.abs(b13)) && Math.abs(a14 - b14) <= EPSILON * Math.max(1.0, Math.abs(a14), Math.abs(b14)) && Math.abs(a15 - b15) <= EPSILON * Math.max(1.0, Math.abs(a15), Math.abs(b15));
}
/**
 * Alias for {@link mat4.multiply}
 * @function
 */

var mul$5 = multiply$5;
/**
 * Alias for {@link mat4.subtract}
 * @function
 */

var sub$3 = subtract$3;

var mat4 = /*#__PURE__*/Object.freeze({
    __proto__: null,
    create: create$5,
    clone: clone$5,
    copy: copy$5,
    fromValues: fromValues$5,
    set: set$5,
    identity: identity$2,
    transpose: transpose,
    invert: invert$2,
    adjoint: adjoint,
    determinant: determinant,
    multiply: multiply$5,
    translate: translate$1,
    scale: scale$5,
    rotate: rotate$1,
    rotateX: rotateX$3,
    rotateY: rotateY$3,
    rotateZ: rotateZ$3,
    fromTranslation: fromTranslation$1,
    fromScaling: fromScaling,
    fromRotation: fromRotation$1,
    fromXRotation: fromXRotation,
    fromYRotation: fromYRotation,
    fromZRotation: fromZRotation,
    fromRotationTranslation: fromRotationTranslation$1,
    fromQuat2: fromQuat2,
    getTranslation: getTranslation$1,
    getScaling: getScaling,
    getRotation: getRotation,
    fromRotationTranslationScale: fromRotationTranslationScale,
    fromRotationTranslationScaleOrigin: fromRotationTranslationScaleOrigin,
    fromQuat: fromQuat,
    frustum: frustum,
    perspectiveNO: perspectiveNO,
    perspective: perspective,
    perspectiveZO: perspectiveZO,
    perspectiveFromFieldOfView: perspectiveFromFieldOfView,
    orthoNO: orthoNO,
    ortho: ortho,
    orthoZO: orthoZO,
    lookAt: lookAt,
    targetTo: targetTo,
    str: str$5,
    frob: frob,
    add: add$5,
    subtract: subtract$3,
    multiplyScalar: multiplyScalar,
    multiplyScalarAndAdd: multiplyScalarAndAdd,
    exactEquals: exactEquals$5,
    equals: equals$5,
    mul: mul$5,
    sub: sub$3
});

/**
 * 3 Dimensional Vector
 * @module vec3
 */

/**
 * Creates a new, empty vec3
 *
 * @returns {vec3} a new 3D vector
 */

function create$4() {
  var out = new ARRAY_TYPE(3);

  if (ARRAY_TYPE != Float32Array) {
    out[0] = 0;
    out[1] = 0;
    out[2] = 0;
  }

  return out;
}
/**
 * Creates a new vec3 initialized with values from an existing vector
 *
 * @param {ReadonlyVec3} a vector to clone
 * @returns {vec3} a new 3D vector
 */

function clone$4(a) {
  var out = new ARRAY_TYPE(3);
  out[0] = a[0];
  out[1] = a[1];
  out[2] = a[2];
  return out;
}
/**
 * Calculates the length of a vec3
 *
 * @param {ReadonlyVec3} a vector to calculate length of
 * @returns {Number} length of a
 */

function length$4(a) {
  var x = a[0];
  var y = a[1];
  var z = a[2];
  return Math.hypot(x, y, z);
}
/**
 * Creates a new vec3 initialized with the given values
 *
 * @param {Number} x X component
 * @param {Number} y Y component
 * @param {Number} z Z component
 * @returns {vec3} a new 3D vector
 */

function fromValues$4(x, y, z) {
  var out = new ARRAY_TYPE(3);
  out[0] = x;
  out[1] = y;
  out[2] = z;
  return out;
}
/**
 * Copy the values from one vec3 to another
 *
 * @param {vec3} out the receiving vector
 * @param {ReadonlyVec3} a the source vector
 * @returns {vec3} out
 */

function copy$4(out, a) {
  out[0] = a[0];
  out[1] = a[1];
  out[2] = a[2];
  return out;
}
/**
 * Set the components of a vec3 to the given values
 *
 * @param {vec3} out the receiving vector
 * @param {Number} x X component
 * @param {Number} y Y component
 * @param {Number} z Z component
 * @returns {vec3} out
 */

function set$4(out, x, y, z) {
  out[0] = x;
  out[1] = y;
  out[2] = z;
  return out;
}
/**
 * Adds two vec3's
 *
 * @param {vec3} out the receiving vector
 * @param {ReadonlyVec3} a the first operand
 * @param {ReadonlyVec3} b the second operand
 * @returns {vec3} out
 */

function add$4(out, a, b) {
  out[0] = a[0] + b[0];
  out[1] = a[1] + b[1];
  out[2] = a[2] + b[2];
  return out;
}
/**
 * Subtracts vector b from vector a
 *
 * @param {vec3} out the receiving vector
 * @param {ReadonlyVec3} a the first operand
 * @param {ReadonlyVec3} b the second operand
 * @returns {vec3} out
 */

function subtract$2(out, a, b) {
  out[0] = a[0] - b[0];
  out[1] = a[1] - b[1];
  out[2] = a[2] - b[2];
  return out;
}
/**
 * Multiplies two vec3's
 *
 * @param {vec3} out the receiving vector
 * @param {ReadonlyVec3} a the first operand
 * @param {ReadonlyVec3} b the second operand
 * @returns {vec3} out
 */

function multiply$4(out, a, b) {
  out[0] = a[0] * b[0];
  out[1] = a[1] * b[1];
  out[2] = a[2] * b[2];
  return out;
}
/**
 * Divides two vec3's
 *
 * @param {vec3} out the receiving vector
 * @param {ReadonlyVec3} a the first operand
 * @param {ReadonlyVec3} b the second operand
 * @returns {vec3} out
 */

function divide$2(out, a, b) {
  out[0] = a[0] / b[0];
  out[1] = a[1] / b[1];
  out[2] = a[2] / b[2];
  return out;
}
/**
 * Math.ceil the components of a vec3
 *
 * @param {vec3} out the receiving vector
 * @param {ReadonlyVec3} a vector to ceil
 * @returns {vec3} out
 */

function ceil$2(out, a) {
  out[0] = Math.ceil(a[0]);
  out[1] = Math.ceil(a[1]);
  out[2] = Math.ceil(a[2]);
  return out;
}
/**
 * Math.floor the components of a vec3
 *
 * @param {vec3} out the receiving vector
 * @param {ReadonlyVec3} a vector to floor
 * @returns {vec3} out
 */

function floor$3(out, a) {
  out[0] = Math.floor(a[0]);
  out[1] = Math.floor(a[1]);
  out[2] = Math.floor(a[2]);
  return out;
}
/**
 * Returns the minimum of two vec3's
 *
 * @param {vec3} out the receiving vector
 * @param {ReadonlyVec3} a the first operand
 * @param {ReadonlyVec3} b the second operand
 * @returns {vec3} out
 */

function min$2(out, a, b) {
  out[0] = Math.min(a[0], b[0]);
  out[1] = Math.min(a[1], b[1]);
  out[2] = Math.min(a[2], b[2]);
  return out;
}
/**
 * Returns the maximum of two vec3's
 *
 * @param {vec3} out the receiving vector
 * @param {ReadonlyVec3} a the first operand
 * @param {ReadonlyVec3} b the second operand
 * @returns {vec3} out
 */

function max$2(out, a, b) {
  out[0] = Math.max(a[0], b[0]);
  out[1] = Math.max(a[1], b[1]);
  out[2] = Math.max(a[2], b[2]);
  return out;
}
/**
 * Math.round the components of a vec3
 *
 * @param {vec3} out the receiving vector
 * @param {ReadonlyVec3} a vector to round
 * @returns {vec3} out
 */

function round$2(out, a) {
  out[0] = Math.round(a[0]);
  out[1] = Math.round(a[1]);
  out[2] = Math.round(a[2]);
  return out;
}
/**
 * Scales a vec3 by a scalar number
 *
 * @param {vec3} out the receiving vector
 * @param {ReadonlyVec3} a the vector to scale
 * @param {Number} b amount to scale the vector by
 * @returns {vec3} out
 */

function scale$4(out, a, b) {
  out[0] = a[0] * b;
  out[1] = a[1] * b;
  out[2] = a[2] * b;
  return out;
}
/**
 * Adds two vec3's after scaling the second operand by a scalar value
 *
 * @param {vec3} out the receiving vector
 * @param {ReadonlyVec3} a the first operand
 * @param {ReadonlyVec3} b the second operand
 * @param {Number} scale the amount to scale b by before adding
 * @returns {vec3} out
 */

function scaleAndAdd$2(out, a, b, scale) {
  out[0] = a[0] + b[0] * scale;
  out[1] = a[1] + b[1] * scale;
  out[2] = a[2] + b[2] * scale;
  return out;
}
/**
 * Calculates the euclidian distance between two vec3's
 *
 * @param {ReadonlyVec3} a the first operand
 * @param {ReadonlyVec3} b the second operand
 * @returns {Number} distance between a and b
 */

function distance$2(a, b) {
  var x = b[0] - a[0];
  var y = b[1] - a[1];
  var z = b[2] - a[2];
  return Math.hypot(x, y, z);
}
/**
 * Calculates the squared euclidian distance between two vec3's
 *
 * @param {ReadonlyVec3} a the first operand
 * @param {ReadonlyVec3} b the second operand
 * @returns {Number} squared distance between a and b
 */

function squaredDistance$2(a, b) {
  var x = b[0] - a[0];
  var y = b[1] - a[1];
  var z = b[2] - a[2];
  return x * x + y * y + z * z;
}
/**
 * Calculates the squared length of a vec3
 *
 * @param {ReadonlyVec3} a vector to calculate squared length of
 * @returns {Number} squared length of a
 */

function squaredLength$4(a) {
  var x = a[0];
  var y = a[1];
  var z = a[2];
  return x * x + y * y + z * z;
}
/**
 * Negates the components of a vec3
 *
 * @param {vec3} out the receiving vector
 * @param {ReadonlyVec3} a vector to negate
 * @returns {vec3} out
 */

function negate$2(out, a) {
  out[0] = -a[0];
  out[1] = -a[1];
  out[2] = -a[2];
  return out;
}
/**
 * Returns the inverse of the components of a vec3
 *
 * @param {vec3} out the receiving vector
 * @param {ReadonlyVec3} a vector to invert
 * @returns {vec3} out
 */

function inverse$2(out, a) {
  out[0] = 1.0 / a[0];
  out[1] = 1.0 / a[1];
  out[2] = 1.0 / a[2];
  return out;
}
/**
 * Normalize a vec3
 *
 * @param {vec3} out the receiving vector
 * @param {ReadonlyVec3} a vector to normalize
 * @returns {vec3} out
 */

function normalize$4(out, a) {
  var x = a[0];
  var y = a[1];
  var z = a[2];
  var len = x * x + y * y + z * z;

  if (len > 0) {
    //TODO: evaluate use of glm_invsqrt here?
    len = 1 / Math.sqrt(len);
  }

  out[0] = a[0] * len;
  out[1] = a[1] * len;
  out[2] = a[2] * len;
  return out;
}
/**
 * Calculates the dot product of two vec3's
 *
 * @param {ReadonlyVec3} a the first operand
 * @param {ReadonlyVec3} b the second operand
 * @returns {Number} dot product of a and b
 */

function dot$4(a, b) {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}
/**
 * Computes the cross product of two vec3's
 *
 * @param {vec3} out the receiving vector
 * @param {ReadonlyVec3} a the first operand
 * @param {ReadonlyVec3} b the second operand
 * @returns {vec3} out
 */

function cross$2(out, a, b) {
  var ax = a[0],
      ay = a[1],
      az = a[2];
  var bx = b[0],
      by = b[1],
      bz = b[2];
  out[0] = ay * bz - az * by;
  out[1] = az * bx - ax * bz;
  out[2] = ax * by - ay * bx;
  return out;
}
/**
 * Performs a linear interpolation between two vec3's
 *
 * @param {vec3} out the receiving vector
 * @param {ReadonlyVec3} a the first operand
 * @param {ReadonlyVec3} b the second operand
 * @param {Number} t interpolation amount, in the range [0-1], between the two inputs
 * @returns {vec3} out
 */

function lerp$5(out, a, b, t) {
  var ax = a[0];
  var ay = a[1];
  var az = a[2];
  out[0] = ax + t * (b[0] - ax);
  out[1] = ay + t * (b[1] - ay);
  out[2] = az + t * (b[2] - az);
  return out;
}
/**
 * Performs a hermite interpolation with two control points
 *
 * @param {vec3} out the receiving vector
 * @param {ReadonlyVec3} a the first operand
 * @param {ReadonlyVec3} b the second operand
 * @param {ReadonlyVec3} c the third operand
 * @param {ReadonlyVec3} d the fourth operand
 * @param {Number} t interpolation amount, in the range [0-1], between the two inputs
 * @returns {vec3} out
 */

function hermite(out, a, b, c, d, t) {
  var factorTimes2 = t * t;
  var factor1 = factorTimes2 * (2 * t - 3) + 1;
  var factor2 = factorTimes2 * (t - 2) + t;
  var factor3 = factorTimes2 * (t - 1);
  var factor4 = factorTimes2 * (3 - 2 * t);
  out[0] = a[0] * factor1 + b[0] * factor2 + c[0] * factor3 + d[0] * factor4;
  out[1] = a[1] * factor1 + b[1] * factor2 + c[1] * factor3 + d[1] * factor4;
  out[2] = a[2] * factor1 + b[2] * factor2 + c[2] * factor3 + d[2] * factor4;
  return out;
}
/**
 * Performs a bezier interpolation with two control points
 *
 * @param {vec3} out the receiving vector
 * @param {ReadonlyVec3} a the first operand
 * @param {ReadonlyVec3} b the second operand
 * @param {ReadonlyVec3} c the third operand
 * @param {ReadonlyVec3} d the fourth operand
 * @param {Number} t interpolation amount, in the range [0-1], between the two inputs
 * @returns {vec3} out
 */

function bezier(out, a, b, c, d, t) {
  var inverseFactor = 1 - t;
  var inverseFactorTimesTwo = inverseFactor * inverseFactor;
  var factorTimes2 = t * t;
  var factor1 = inverseFactorTimesTwo * inverseFactor;
  var factor2 = 3 * t * inverseFactorTimesTwo;
  var factor3 = 3 * factorTimes2 * inverseFactor;
  var factor4 = factorTimes2 * t;
  out[0] = a[0] * factor1 + b[0] * factor2 + c[0] * factor3 + d[0] * factor4;
  out[1] = a[1] * factor1 + b[1] * factor2 + c[1] * factor3 + d[1] * factor4;
  out[2] = a[2] * factor1 + b[2] * factor2 + c[2] * factor3 + d[2] * factor4;
  return out;
}
/**
 * Generates a random vector with the given scale
 *
 * @param {vec3} out the receiving vector
 * @param {Number} [scale] Length of the resulting vector. If ommitted, a unit vector will be returned
 * @returns {vec3} out
 */

function random$3(out, scale) {
  scale = scale || 1.0;
  var r = RANDOM() * 2.0 * Math.PI;
  var z = RANDOM() * 2.0 - 1.0;
  var zScale = Math.sqrt(1.0 - z * z) * scale;
  out[0] = Math.cos(r) * zScale;
  out[1] = Math.sin(r) * zScale;
  out[2] = z * scale;
  return out;
}
/**
 * Transforms the vec3 with a mat4.
 * 4th vector component is implicitly '1'
 *
 * @param {vec3} out the receiving vector
 * @param {ReadonlyVec3} a the vector to transform
 * @param {ReadonlyMat4} m matrix to transform with
 * @returns {vec3} out
 */

function transformMat4$2(out, a, m) {
  var x = a[0],
      y = a[1],
      z = a[2];
  var w = m[3] * x + m[7] * y + m[11] * z + m[15];
  w = w || 1.0;
  out[0] = (m[0] * x + m[4] * y + m[8] * z + m[12]) / w;
  out[1] = (m[1] * x + m[5] * y + m[9] * z + m[13]) / w;
  out[2] = (m[2] * x + m[6] * y + m[10] * z + m[14]) / w;
  return out;
}
/**
 * Transforms the vec3 with a mat3.
 *
 * @param {vec3} out the receiving vector
 * @param {ReadonlyVec3} a the vector to transform
 * @param {ReadonlyMat3} m the 3x3 matrix to transform with
 * @returns {vec3} out
 */

function transformMat3$1(out, a, m) {
  var x = a[0],
      y = a[1],
      z = a[2];
  out[0] = x * m[0] + y * m[3] + z * m[6];
  out[1] = x * m[1] + y * m[4] + z * m[7];
  out[2] = x * m[2] + y * m[5] + z * m[8];
  return out;
}
/**
 * Transforms the vec3 with a quat
 * Can also be used for dual quaternions. (Multiply it with the real part)
 *
 * @param {vec3} out the receiving vector
 * @param {ReadonlyVec3} a the vector to transform
 * @param {ReadonlyQuat} q quaternion to transform with
 * @returns {vec3} out
 */

function transformQuat$1(out, a, q) {
  // benchmarks: https://jsperf.com/quaternion-transform-vec3-implementations-fixed
  var qx = q[0],
      qy = q[1],
      qz = q[2],
      qw = q[3];
  var x = a[0],
      y = a[1],
      z = a[2]; // var qvec = [qx, qy, qz];
  // var uv = vec3.cross([], qvec, a);

  var uvx = qy * z - qz * y,
      uvy = qz * x - qx * z,
      uvz = qx * y - qy * x; // var uuv = vec3.cross([], qvec, uv);

  var uuvx = qy * uvz - qz * uvy,
      uuvy = qz * uvx - qx * uvz,
      uuvz = qx * uvy - qy * uvx; // vec3.scale(uv, uv, 2 * w);

  var w2 = qw * 2;
  uvx *= w2;
  uvy *= w2;
  uvz *= w2; // vec3.scale(uuv, uuv, 2);

  uuvx *= 2;
  uuvy *= 2;
  uuvz *= 2; // return vec3.add(out, a, vec3.add(out, uv, uuv));

  out[0] = x + uvx + uuvx;
  out[1] = y + uvy + uuvy;
  out[2] = z + uvz + uuvz;
  return out;
}
/**
 * Rotate a 3D vector around the x-axis
 * @param {vec3} out The receiving vec3
 * @param {ReadonlyVec3} a The vec3 point to rotate
 * @param {ReadonlyVec3} b The origin of the rotation
 * @param {Number} rad The angle of rotation in radians
 * @returns {vec3} out
 */

function rotateX$2(out, a, b, rad) {
  var p = [],
      r = []; //Translate point to the origin

  p[0] = a[0] - b[0];
  p[1] = a[1] - b[1];
  p[2] = a[2] - b[2]; //perform rotation

  r[0] = p[0];
  r[1] = p[1] * Math.cos(rad) - p[2] * Math.sin(rad);
  r[2] = p[1] * Math.sin(rad) + p[2] * Math.cos(rad); //translate to correct position

  out[0] = r[0] + b[0];
  out[1] = r[1] + b[1];
  out[2] = r[2] + b[2];
  return out;
}
/**
 * Rotate a 3D vector around the y-axis
 * @param {vec3} out The receiving vec3
 * @param {ReadonlyVec3} a The vec3 point to rotate
 * @param {ReadonlyVec3} b The origin of the rotation
 * @param {Number} rad The angle of rotation in radians
 * @returns {vec3} out
 */

function rotateY$2(out, a, b, rad) {
  var p = [],
      r = []; //Translate point to the origin

  p[0] = a[0] - b[0];
  p[1] = a[1] - b[1];
  p[2] = a[2] - b[2]; //perform rotation

  r[0] = p[2] * Math.sin(rad) + p[0] * Math.cos(rad);
  r[1] = p[1];
  r[2] = p[2] * Math.cos(rad) - p[0] * Math.sin(rad); //translate to correct position

  out[0] = r[0] + b[0];
  out[1] = r[1] + b[1];
  out[2] = r[2] + b[2];
  return out;
}
/**
 * Rotate a 3D vector around the z-axis
 * @param {vec3} out The receiving vec3
 * @param {ReadonlyVec3} a The vec3 point to rotate
 * @param {ReadonlyVec3} b The origin of the rotation
 * @param {Number} rad The angle of rotation in radians
 * @returns {vec3} out
 */

function rotateZ$2(out, a, b, rad) {
  var p = [],
      r = []; //Translate point to the origin

  p[0] = a[0] - b[0];
  p[1] = a[1] - b[1];
  p[2] = a[2] - b[2]; //perform rotation

  r[0] = p[0] * Math.cos(rad) - p[1] * Math.sin(rad);
  r[1] = p[0] * Math.sin(rad) + p[1] * Math.cos(rad);
  r[2] = p[2]; //translate to correct position

  out[0] = r[0] + b[0];
  out[1] = r[1] + b[1];
  out[2] = r[2] + b[2];
  return out;
}
/**
 * Get the angle between two 3D vectors
 * @param {ReadonlyVec3} a The first operand
 * @param {ReadonlyVec3} b The second operand
 * @returns {Number} The angle in radians
 */

function angle$1(a, b) {
  var ax = a[0],
      ay = a[1],
      az = a[2],
      bx = b[0],
      by = b[1],
      bz = b[2],
      mag1 = Math.sqrt(ax * ax + ay * ay + az * az),
      mag2 = Math.sqrt(bx * bx + by * by + bz * bz),
      mag = mag1 * mag2,
      cosine = mag && dot$4(a, b) / mag;
  return Math.acos(Math.min(Math.max(cosine, -1), 1));
}
/**
 * Set the components of a vec3 to zero
 *
 * @param {vec3} out the receiving vector
 * @returns {vec3} out
 */

function zero$2(out) {
  out[0] = 0.0;
  out[1] = 0.0;
  out[2] = 0.0;
  return out;
}
/**
 * Returns a string representation of a vector
 *
 * @param {ReadonlyVec3} a vector to represent as a string
 * @returns {String} string representation of the vector
 */

function str$4(a) {
  return "vec3(" + a[0] + ", " + a[1] + ", " + a[2] + ")";
}
/**
 * Returns whether or not the vectors have exactly the same elements in the same position (when compared with ===)
 *
 * @param {ReadonlyVec3} a The first vector.
 * @param {ReadonlyVec3} b The second vector.
 * @returns {Boolean} True if the vectors are equal, false otherwise.
 */

function exactEquals$4(a, b) {
  return a[0] === b[0] && a[1] === b[1] && a[2] === b[2];
}
/**
 * Returns whether or not the vectors have approximately the same elements in the same position.
 *
 * @param {ReadonlyVec3} a The first vector.
 * @param {ReadonlyVec3} b The second vector.
 * @returns {Boolean} True if the vectors are equal, false otherwise.
 */

function equals$4(a, b) {
  var a0 = a[0],
      a1 = a[1],
      a2 = a[2];
  var b0 = b[0],
      b1 = b[1],
      b2 = b[2];
  return Math.abs(a0 - b0) <= EPSILON * Math.max(1.0, Math.abs(a0), Math.abs(b0)) && Math.abs(a1 - b1) <= EPSILON * Math.max(1.0, Math.abs(a1), Math.abs(b1)) && Math.abs(a2 - b2) <= EPSILON * Math.max(1.0, Math.abs(a2), Math.abs(b2));
}
/**
 * Alias for {@link vec3.subtract}
 * @function
 */

var sub$2 = subtract$2;
/**
 * Alias for {@link vec3.multiply}
 * @function
 */

var mul$4 = multiply$4;
/**
 * Alias for {@link vec3.divide}
 * @function
 */

var div$2 = divide$2;
/**
 * Alias for {@link vec3.distance}
 * @function
 */

var dist$2 = distance$2;
/**
 * Alias for {@link vec3.squaredDistance}
 * @function
 */

var sqrDist$2 = squaredDistance$2;
/**
 * Alias for {@link vec3.length}
 * @function
 */

var len$4 = length$4;
/**
 * Alias for {@link vec3.squaredLength}
 * @function
 */

var sqrLen$4 = squaredLength$4;
/**
 * Perform some operation over an array of vec3s.
 *
 * @param {Array} a the array of vectors to iterate over
 * @param {Number} stride Number of elements between the start of each vec3. If 0 assumes tightly packed
 * @param {Number} offset Number of elements to skip at the beginning of the array
 * @param {Number} count Number of vec3s to iterate over. If 0 iterates over entire array
 * @param {Function} fn Function to call for each vector in the array
 * @param {Object} [arg] additional argument to pass to fn
 * @returns {Array} a
 * @function
 */

var forEach$2 = function () {
  var vec = create$4();
  return function (a, stride, offset, count, fn, arg) {
    var i, l;

    if (!stride) {
      stride = 3;
    }

    if (!offset) {
      offset = 0;
    }

    if (count) {
      l = Math.min(count * stride + offset, a.length);
    } else {
      l = a.length;
    }

    for (i = offset; i < l; i += stride) {
      vec[0] = a[i];
      vec[1] = a[i + 1];
      vec[2] = a[i + 2];
      fn(vec, vec, arg);
      a[i] = vec[0];
      a[i + 1] = vec[1];
      a[i + 2] = vec[2];
    }

    return a;
  };
}();

var vec3 = /*#__PURE__*/Object.freeze({
    __proto__: null,
    create: create$4,
    clone: clone$4,
    length: length$4,
    fromValues: fromValues$4,
    copy: copy$4,
    set: set$4,
    add: add$4,
    subtract: subtract$2,
    multiply: multiply$4,
    divide: divide$2,
    ceil: ceil$2,
    floor: floor$3,
    min: min$2,
    max: max$2,
    round: round$2,
    scale: scale$4,
    scaleAndAdd: scaleAndAdd$2,
    distance: distance$2,
    squaredDistance: squaredDistance$2,
    squaredLength: squaredLength$4,
    negate: negate$2,
    inverse: inverse$2,
    normalize: normalize$4,
    dot: dot$4,
    cross: cross$2,
    lerp: lerp$5,
    hermite: hermite,
    bezier: bezier,
    random: random$3,
    transformMat4: transformMat4$2,
    transformMat3: transformMat3$1,
    transformQuat: transformQuat$1,
    rotateX: rotateX$2,
    rotateY: rotateY$2,
    rotateZ: rotateZ$2,
    angle: angle$1,
    zero: zero$2,
    str: str$4,
    exactEquals: exactEquals$4,
    equals: equals$4,
    sub: sub$2,
    mul: mul$4,
    div: div$2,
    dist: dist$2,
    sqrDist: sqrDist$2,
    len: len$4,
    sqrLen: sqrLen$4,
    forEach: forEach$2
});

/**
 * 4 Dimensional Vector
 * @module vec4
 */

/**
 * Creates a new, empty vec4
 *
 * @returns {vec4} a new 4D vector
 */

function create$3() {
  var out = new ARRAY_TYPE(4);

  if (ARRAY_TYPE != Float32Array) {
    out[0] = 0;
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
  }

  return out;
}
/**
 * Creates a new vec4 initialized with values from an existing vector
 *
 * @param {ReadonlyVec4} a vector to clone
 * @returns {vec4} a new 4D vector
 */

function clone$3(a) {
  var out = new ARRAY_TYPE(4);
  out[0] = a[0];
  out[1] = a[1];
  out[2] = a[2];
  out[3] = a[3];
  return out;
}
/**
 * Creates a new vec4 initialized with the given values
 *
 * @param {Number} x X component
 * @param {Number} y Y component
 * @param {Number} z Z component
 * @param {Number} w W component
 * @returns {vec4} a new 4D vector
 */

function fromValues$3(x, y, z, w) {
  var out = new ARRAY_TYPE(4);
  out[0] = x;
  out[1] = y;
  out[2] = z;
  out[3] = w;
  return out;
}
/**
 * Copy the values from one vec4 to another
 *
 * @param {vec4} out the receiving vector
 * @param {ReadonlyVec4} a the source vector
 * @returns {vec4} out
 */

function copy$3(out, a) {
  out[0] = a[0];
  out[1] = a[1];
  out[2] = a[2];
  out[3] = a[3];
  return out;
}
/**
 * Set the components of a vec4 to the given values
 *
 * @param {vec4} out the receiving vector
 * @param {Number} x X component
 * @param {Number} y Y component
 * @param {Number} z Z component
 * @param {Number} w W component
 * @returns {vec4} out
 */

function set$3(out, x, y, z, w) {
  out[0] = x;
  out[1] = y;
  out[2] = z;
  out[3] = w;
  return out;
}
/**
 * Adds two vec4's
 *
 * @param {vec4} out the receiving vector
 * @param {ReadonlyVec4} a the first operand
 * @param {ReadonlyVec4} b the second operand
 * @returns {vec4} out
 */

function add$3(out, a, b) {
  out[0] = a[0] + b[0];
  out[1] = a[1] + b[1];
  out[2] = a[2] + b[2];
  out[3] = a[3] + b[3];
  return out;
}
/**
 * Subtracts vector b from vector a
 *
 * @param {vec4} out the receiving vector
 * @param {ReadonlyVec4} a the first operand
 * @param {ReadonlyVec4} b the second operand
 * @returns {vec4} out
 */

function subtract$1(out, a, b) {
  out[0] = a[0] - b[0];
  out[1] = a[1] - b[1];
  out[2] = a[2] - b[2];
  out[3] = a[3] - b[3];
  return out;
}
/**
 * Multiplies two vec4's
 *
 * @param {vec4} out the receiving vector
 * @param {ReadonlyVec4} a the first operand
 * @param {ReadonlyVec4} b the second operand
 * @returns {vec4} out
 */

function multiply$3(out, a, b) {
  out[0] = a[0] * b[0];
  out[1] = a[1] * b[1];
  out[2] = a[2] * b[2];
  out[3] = a[3] * b[3];
  return out;
}
/**
 * Divides two vec4's
 *
 * @param {vec4} out the receiving vector
 * @param {ReadonlyVec4} a the first operand
 * @param {ReadonlyVec4} b the second operand
 * @returns {vec4} out
 */

function divide$1(out, a, b) {
  out[0] = a[0] / b[0];
  out[1] = a[1] / b[1];
  out[2] = a[2] / b[2];
  out[3] = a[3] / b[3];
  return out;
}
/**
 * Math.ceil the components of a vec4
 *
 * @param {vec4} out the receiving vector
 * @param {ReadonlyVec4} a vector to ceil
 * @returns {vec4} out
 */

function ceil$1(out, a) {
  out[0] = Math.ceil(a[0]);
  out[1] = Math.ceil(a[1]);
  out[2] = Math.ceil(a[2]);
  out[3] = Math.ceil(a[3]);
  return out;
}
/**
 * Math.floor the components of a vec4
 *
 * @param {vec4} out the receiving vector
 * @param {ReadonlyVec4} a vector to floor
 * @returns {vec4} out
 */

function floor$2(out, a) {
  out[0] = Math.floor(a[0]);
  out[1] = Math.floor(a[1]);
  out[2] = Math.floor(a[2]);
  out[3] = Math.floor(a[3]);
  return out;
}
/**
 * Returns the minimum of two vec4's
 *
 * @param {vec4} out the receiving vector
 * @param {ReadonlyVec4} a the first operand
 * @param {ReadonlyVec4} b the second operand
 * @returns {vec4} out
 */

function min$1(out, a, b) {
  out[0] = Math.min(a[0], b[0]);
  out[1] = Math.min(a[1], b[1]);
  out[2] = Math.min(a[2], b[2]);
  out[3] = Math.min(a[3], b[3]);
  return out;
}
/**
 * Returns the maximum of two vec4's
 *
 * @param {vec4} out the receiving vector
 * @param {ReadonlyVec4} a the first operand
 * @param {ReadonlyVec4} b the second operand
 * @returns {vec4} out
 */

function max$1(out, a, b) {
  out[0] = Math.max(a[0], b[0]);
  out[1] = Math.max(a[1], b[1]);
  out[2] = Math.max(a[2], b[2]);
  out[3] = Math.max(a[3], b[3]);
  return out;
}
/**
 * Math.round the components of a vec4
 *
 * @param {vec4} out the receiving vector
 * @param {ReadonlyVec4} a vector to round
 * @returns {vec4} out
 */

function round$1(out, a) {
  out[0] = Math.round(a[0]);
  out[1] = Math.round(a[1]);
  out[2] = Math.round(a[2]);
  out[3] = Math.round(a[3]);
  return out;
}
/**
 * Scales a vec4 by a scalar number
 *
 * @param {vec4} out the receiving vector
 * @param {ReadonlyVec4} a the vector to scale
 * @param {Number} b amount to scale the vector by
 * @returns {vec4} out
 */

function scale$3(out, a, b) {
  out[0] = a[0] * b;
  out[1] = a[1] * b;
  out[2] = a[2] * b;
  out[3] = a[3] * b;
  return out;
}
/**
 * Adds two vec4's after scaling the second operand by a scalar value
 *
 * @param {vec4} out the receiving vector
 * @param {ReadonlyVec4} a the first operand
 * @param {ReadonlyVec4} b the second operand
 * @param {Number} scale the amount to scale b by before adding
 * @returns {vec4} out
 */

function scaleAndAdd$1(out, a, b, scale) {
  out[0] = a[0] + b[0] * scale;
  out[1] = a[1] + b[1] * scale;
  out[2] = a[2] + b[2] * scale;
  out[3] = a[3] + b[3] * scale;
  return out;
}
/**
 * Calculates the euclidian distance between two vec4's
 *
 * @param {ReadonlyVec4} a the first operand
 * @param {ReadonlyVec4} b the second operand
 * @returns {Number} distance between a and b
 */

function distance$1(a, b) {
  var x = b[0] - a[0];
  var y = b[1] - a[1];
  var z = b[2] - a[2];
  var w = b[3] - a[3];
  return Math.hypot(x, y, z, w);
}
/**
 * Calculates the squared euclidian distance between two vec4's
 *
 * @param {ReadonlyVec4} a the first operand
 * @param {ReadonlyVec4} b the second operand
 * @returns {Number} squared distance between a and b
 */

function squaredDistance$1(a, b) {
  var x = b[0] - a[0];
  var y = b[1] - a[1];
  var z = b[2] - a[2];
  var w = b[3] - a[3];
  return x * x + y * y + z * z + w * w;
}
/**
 * Calculates the length of a vec4
 *
 * @param {ReadonlyVec4} a vector to calculate length of
 * @returns {Number} length of a
 */

function length$3(a) {
  var x = a[0];
  var y = a[1];
  var z = a[2];
  var w = a[3];
  return Math.hypot(x, y, z, w);
}
/**
 * Calculates the squared length of a vec4
 *
 * @param {ReadonlyVec4} a vector to calculate squared length of
 * @returns {Number} squared length of a
 */

function squaredLength$3(a) {
  var x = a[0];
  var y = a[1];
  var z = a[2];
  var w = a[3];
  return x * x + y * y + z * z + w * w;
}
/**
 * Negates the components of a vec4
 *
 * @param {vec4} out the receiving vector
 * @param {ReadonlyVec4} a vector to negate
 * @returns {vec4} out
 */

function negate$1(out, a) {
  out[0] = -a[0];
  out[1] = -a[1];
  out[2] = -a[2];
  out[3] = -a[3];
  return out;
}
/**
 * Returns the inverse of the components of a vec4
 *
 * @param {vec4} out the receiving vector
 * @param {ReadonlyVec4} a vector to invert
 * @returns {vec4} out
 */

function inverse$1(out, a) {
  out[0] = 1.0 / a[0];
  out[1] = 1.0 / a[1];
  out[2] = 1.0 / a[2];
  out[3] = 1.0 / a[3];
  return out;
}
/**
 * Normalize a vec4
 *
 * @param {vec4} out the receiving vector
 * @param {ReadonlyVec4} a vector to normalize
 * @returns {vec4} out
 */

function normalize$3(out, a) {
  var x = a[0];
  var y = a[1];
  var z = a[2];
  var w = a[3];
  var len = x * x + y * y + z * z + w * w;

  if (len > 0) {
    len = 1 / Math.sqrt(len);
  }

  out[0] = x * len;
  out[1] = y * len;
  out[2] = z * len;
  out[3] = w * len;
  return out;
}
/**
 * Calculates the dot product of two vec4's
 *
 * @param {ReadonlyVec4} a the first operand
 * @param {ReadonlyVec4} b the second operand
 * @returns {Number} dot product of a and b
 */

function dot$3(a, b) {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3];
}
/**
 * Returns the cross-product of three vectors in a 4-dimensional space
 *
 * @param {ReadonlyVec4} result the receiving vector
 * @param {ReadonlyVec4} U the first vector
 * @param {ReadonlyVec4} V the second vector
 * @param {ReadonlyVec4} W the third vector
 * @returns {vec4} result
 */

function cross$1(out, u, v, w) {
  var A = v[0] * w[1] - v[1] * w[0],
      B = v[0] * w[2] - v[2] * w[0],
      C = v[0] * w[3] - v[3] * w[0],
      D = v[1] * w[2] - v[2] * w[1],
      E = v[1] * w[3] - v[3] * w[1],
      F = v[2] * w[3] - v[3] * w[2];
  var G = u[0];
  var H = u[1];
  var I = u[2];
  var J = u[3];
  out[0] = H * F - I * E + J * D;
  out[1] = -(G * F) + I * C - J * B;
  out[2] = G * E - H * C + J * A;
  out[3] = -(G * D) + H * B - I * A;
  return out;
}
/**
 * Performs a linear interpolation between two vec4's
 *
 * @param {vec4} out the receiving vector
 * @param {ReadonlyVec4} a the first operand
 * @param {ReadonlyVec4} b the second operand
 * @param {Number} t interpolation amount, in the range [0-1], between the two inputs
 * @returns {vec4} out
 */

function lerp$4(out, a, b, t) {
  var ax = a[0];
  var ay = a[1];
  var az = a[2];
  var aw = a[3];
  out[0] = ax + t * (b[0] - ax);
  out[1] = ay + t * (b[1] - ay);
  out[2] = az + t * (b[2] - az);
  out[3] = aw + t * (b[3] - aw);
  return out;
}
/**
 * Generates a random vector with the given scale
 *
 * @param {vec4} out the receiving vector
 * @param {Number} [scale] Length of the resulting vector. If ommitted, a unit vector will be returned
 * @returns {vec4} out
 */

function random$2(out, scale) {
  scale = scale || 1.0; // Marsaglia, George. Choosing a Point from the Surface of a
  // Sphere. Ann. Math. Statist. 43 (1972), no. 2, 645--646.
  // http://projecteuclid.org/euclid.aoms/1177692644;

  var v1, v2, v3, v4;
  var s1, s2;

  do {
    v1 = RANDOM() * 2 - 1;
    v2 = RANDOM() * 2 - 1;
    s1 = v1 * v1 + v2 * v2;
  } while (s1 >= 1);

  do {
    v3 = RANDOM() * 2 - 1;
    v4 = RANDOM() * 2 - 1;
    s2 = v3 * v3 + v4 * v4;
  } while (s2 >= 1);

  var d = Math.sqrt((1 - s1) / s2);
  out[0] = scale * v1;
  out[1] = scale * v2;
  out[2] = scale * v3 * d;
  out[3] = scale * v4 * d;
  return out;
}
/**
 * Transforms the vec4 with a mat4.
 *
 * @param {vec4} out the receiving vector
 * @param {ReadonlyVec4} a the vector to transform
 * @param {ReadonlyMat4} m matrix to transform with
 * @returns {vec4} out
 */

function transformMat4$1(out, a, m) {
  var x = a[0],
      y = a[1],
      z = a[2],
      w = a[3];
  out[0] = m[0] * x + m[4] * y + m[8] * z + m[12] * w;
  out[1] = m[1] * x + m[5] * y + m[9] * z + m[13] * w;
  out[2] = m[2] * x + m[6] * y + m[10] * z + m[14] * w;
  out[3] = m[3] * x + m[7] * y + m[11] * z + m[15] * w;
  return out;
}
/**
 * Transforms the vec4 with a quat
 *
 * @param {vec4} out the receiving vector
 * @param {ReadonlyVec4} a the vector to transform
 * @param {ReadonlyQuat} q quaternion to transform with
 * @returns {vec4} out
 */

function transformQuat(out, a, q) {
  var x = a[0],
      y = a[1],
      z = a[2];
  var qx = q[0],
      qy = q[1],
      qz = q[2],
      qw = q[3]; // calculate quat * vec

  var ix = qw * x + qy * z - qz * y;
  var iy = qw * y + qz * x - qx * z;
  var iz = qw * z + qx * y - qy * x;
  var iw = -qx * x - qy * y - qz * z; // calculate result * inverse quat

  out[0] = ix * qw + iw * -qx + iy * -qz - iz * -qy;
  out[1] = iy * qw + iw * -qy + iz * -qx - ix * -qz;
  out[2] = iz * qw + iw * -qz + ix * -qy - iy * -qx;
  out[3] = a[3];
  return out;
}
/**
 * Set the components of a vec4 to zero
 *
 * @param {vec4} out the receiving vector
 * @returns {vec4} out
 */

function zero$1(out) {
  out[0] = 0.0;
  out[1] = 0.0;
  out[2] = 0.0;
  out[3] = 0.0;
  return out;
}
/**
 * Returns a string representation of a vector
 *
 * @param {ReadonlyVec4} a vector to represent as a string
 * @returns {String} string representation of the vector
 */

function str$3(a) {
  return "vec4(" + a[0] + ", " + a[1] + ", " + a[2] + ", " + a[3] + ")";
}
/**
 * Returns whether or not the vectors have exactly the same elements in the same position (when compared with ===)
 *
 * @param {ReadonlyVec4} a The first vector.
 * @param {ReadonlyVec4} b The second vector.
 * @returns {Boolean} True if the vectors are equal, false otherwise.
 */

function exactEquals$3(a, b) {
  return a[0] === b[0] && a[1] === b[1] && a[2] === b[2] && a[3] === b[3];
}
/**
 * Returns whether or not the vectors have approximately the same elements in the same position.
 *
 * @param {ReadonlyVec4} a The first vector.
 * @param {ReadonlyVec4} b The second vector.
 * @returns {Boolean} True if the vectors are equal, false otherwise.
 */

function equals$3(a, b) {
  var a0 = a[0],
      a1 = a[1],
      a2 = a[2],
      a3 = a[3];
  var b0 = b[0],
      b1 = b[1],
      b2 = b[2],
      b3 = b[3];
  return Math.abs(a0 - b0) <= EPSILON * Math.max(1.0, Math.abs(a0), Math.abs(b0)) && Math.abs(a1 - b1) <= EPSILON * Math.max(1.0, Math.abs(a1), Math.abs(b1)) && Math.abs(a2 - b2) <= EPSILON * Math.max(1.0, Math.abs(a2), Math.abs(b2)) && Math.abs(a3 - b3) <= EPSILON * Math.max(1.0, Math.abs(a3), Math.abs(b3));
}
/**
 * Alias for {@link vec4.subtract}
 * @function
 */

var sub$1 = subtract$1;
/**
 * Alias for {@link vec4.multiply}
 * @function
 */

var mul$3 = multiply$3;
/**
 * Alias for {@link vec4.divide}
 * @function
 */

var div$1 = divide$1;
/**
 * Alias for {@link vec4.distance}
 * @function
 */

var dist$1 = distance$1;
/**
 * Alias for {@link vec4.squaredDistance}
 * @function
 */

var sqrDist$1 = squaredDistance$1;
/**
 * Alias for {@link vec4.length}
 * @function
 */

var len$3 = length$3;
/**
 * Alias for {@link vec4.squaredLength}
 * @function
 */

var sqrLen$3 = squaredLength$3;
/**
 * Perform some operation over an array of vec4s.
 *
 * @param {Array} a the array of vectors to iterate over
 * @param {Number} stride Number of elements between the start of each vec4. If 0 assumes tightly packed
 * @param {Number} offset Number of elements to skip at the beginning of the array
 * @param {Number} count Number of vec4s to iterate over. If 0 iterates over entire array
 * @param {Function} fn Function to call for each vector in the array
 * @param {Object} [arg] additional argument to pass to fn
 * @returns {Array} a
 * @function
 */

var forEach$1 = function () {
  var vec = create$3();
  return function (a, stride, offset, count, fn, arg) {
    var i, l;

    if (!stride) {
      stride = 4;
    }

    if (!offset) {
      offset = 0;
    }

    if (count) {
      l = Math.min(count * stride + offset, a.length);
    } else {
      l = a.length;
    }

    for (i = offset; i < l; i += stride) {
      vec[0] = a[i];
      vec[1] = a[i + 1];
      vec[2] = a[i + 2];
      vec[3] = a[i + 3];
      fn(vec, vec, arg);
      a[i] = vec[0];
      a[i + 1] = vec[1];
      a[i + 2] = vec[2];
      a[i + 3] = vec[3];
    }

    return a;
  };
}();

var vec4 = /*#__PURE__*/Object.freeze({
    __proto__: null,
    create: create$3,
    clone: clone$3,
    fromValues: fromValues$3,
    copy: copy$3,
    set: set$3,
    add: add$3,
    subtract: subtract$1,
    multiply: multiply$3,
    divide: divide$1,
    ceil: ceil$1,
    floor: floor$2,
    min: min$1,
    max: max$1,
    round: round$1,
    scale: scale$3,
    scaleAndAdd: scaleAndAdd$1,
    distance: distance$1,
    squaredDistance: squaredDistance$1,
    length: length$3,
    squaredLength: squaredLength$3,
    negate: negate$1,
    inverse: inverse$1,
    normalize: normalize$3,
    dot: dot$3,
    cross: cross$1,
    lerp: lerp$4,
    random: random$2,
    transformMat4: transformMat4$1,
    transformQuat: transformQuat,
    zero: zero$1,
    str: str$3,
    exactEquals: exactEquals$3,
    equals: equals$3,
    sub: sub$1,
    mul: mul$3,
    div: div$1,
    dist: dist$1,
    sqrDist: sqrDist$1,
    len: len$3,
    sqrLen: sqrLen$3,
    forEach: forEach$1
});

/**
 * Quaternion
 * @module quat
 */

/**
 * Creates a new identity quat
 *
 * @returns {quat} a new quaternion
 */

function create$2() {
  var out = new ARRAY_TYPE(4);

  if (ARRAY_TYPE != Float32Array) {
    out[0] = 0;
    out[1] = 0;
    out[2] = 0;
  }

  out[3] = 1;
  return out;
}
/**
 * Set a quat to the identity quaternion
 *
 * @param {quat} out the receiving quaternion
 * @returns {quat} out
 */

function identity$1(out) {
  out[0] = 0;
  out[1] = 0;
  out[2] = 0;
  out[3] = 1;
  return out;
}
/**
 * Sets a quat from the given angle and rotation axis,
 * then returns it.
 *
 * @param {quat} out the receiving quaternion
 * @param {ReadonlyVec3} axis the axis around which to rotate
 * @param {Number} rad the angle in radians
 * @returns {quat} out
 **/

function setAxisAngle(out, axis, rad) {
  rad = rad * 0.5;
  var s = Math.sin(rad);
  out[0] = s * axis[0];
  out[1] = s * axis[1];
  out[2] = s * axis[2];
  out[3] = Math.cos(rad);
  return out;
}
/**
 * Gets the rotation axis and angle for a given
 *  quaternion. If a quaternion is created with
 *  setAxisAngle, this method will return the same
 *  values as providied in the original parameter list
 *  OR functionally equivalent values.
 * Example: The quaternion formed by axis [0, 0, 1] and
 *  angle -90 is the same as the quaternion formed by
 *  [0, 0, 1] and 270. This method favors the latter.
 * @param  {vec3} out_axis  Vector receiving the axis of rotation
 * @param  {ReadonlyQuat} q     Quaternion to be decomposed
 * @return {Number}     Angle, in radians, of the rotation
 */

function getAxisAngle(out_axis, q) {
  var rad = Math.acos(q[3]) * 2.0;
  var s = Math.sin(rad / 2.0);

  if (s > EPSILON) {
    out_axis[0] = q[0] / s;
    out_axis[1] = q[1] / s;
    out_axis[2] = q[2] / s;
  } else {
    // If s is zero, return any axis (no rotation - axis does not matter)
    out_axis[0] = 1;
    out_axis[1] = 0;
    out_axis[2] = 0;
  }

  return rad;
}
/**
 * Gets the angular distance between two unit quaternions
 *
 * @param  {ReadonlyQuat} a     Origin unit quaternion
 * @param  {ReadonlyQuat} b     Destination unit quaternion
 * @return {Number}     Angle, in radians, between the two quaternions
 */

function getAngle(a, b) {
  var dotproduct = dot$2(a, b);
  return Math.acos(2 * dotproduct * dotproduct - 1);
}
/**
 * Multiplies two quat's
 *
 * @param {quat} out the receiving quaternion
 * @param {ReadonlyQuat} a the first operand
 * @param {ReadonlyQuat} b the second operand
 * @returns {quat} out
 */

function multiply$2(out, a, b) {
  var ax = a[0],
      ay = a[1],
      az = a[2],
      aw = a[3];
  var bx = b[0],
      by = b[1],
      bz = b[2],
      bw = b[3];
  out[0] = ax * bw + aw * bx + ay * bz - az * by;
  out[1] = ay * bw + aw * by + az * bx - ax * bz;
  out[2] = az * bw + aw * bz + ax * by - ay * bx;
  out[3] = aw * bw - ax * bx - ay * by - az * bz;
  return out;
}
/**
 * Rotates a quaternion by the given angle about the X axis
 *
 * @param {quat} out quat receiving operation result
 * @param {ReadonlyQuat} a quat to rotate
 * @param {number} rad angle (in radians) to rotate
 * @returns {quat} out
 */

function rotateX$1(out, a, rad) {
  rad *= 0.5;
  var ax = a[0],
      ay = a[1],
      az = a[2],
      aw = a[3];
  var bx = Math.sin(rad),
      bw = Math.cos(rad);
  out[0] = ax * bw + aw * bx;
  out[1] = ay * bw + az * bx;
  out[2] = az * bw - ay * bx;
  out[3] = aw * bw - ax * bx;
  return out;
}
/**
 * Rotates a quaternion by the given angle about the Y axis
 *
 * @param {quat} out quat receiving operation result
 * @param {ReadonlyQuat} a quat to rotate
 * @param {number} rad angle (in radians) to rotate
 * @returns {quat} out
 */

function rotateY$1(out, a, rad) {
  rad *= 0.5;
  var ax = a[0],
      ay = a[1],
      az = a[2],
      aw = a[3];
  var by = Math.sin(rad),
      bw = Math.cos(rad);
  out[0] = ax * bw - az * by;
  out[1] = ay * bw + aw * by;
  out[2] = az * bw + ax * by;
  out[3] = aw * bw - ay * by;
  return out;
}
/**
 * Rotates a quaternion by the given angle about the Z axis
 *
 * @param {quat} out quat receiving operation result
 * @param {ReadonlyQuat} a quat to rotate
 * @param {number} rad angle (in radians) to rotate
 * @returns {quat} out
 */

function rotateZ$1(out, a, rad) {
  rad *= 0.5;
  var ax = a[0],
      ay = a[1],
      az = a[2],
      aw = a[3];
  var bz = Math.sin(rad),
      bw = Math.cos(rad);
  out[0] = ax * bw + ay * bz;
  out[1] = ay * bw - ax * bz;
  out[2] = az * bw + aw * bz;
  out[3] = aw * bw - az * bz;
  return out;
}
/**
 * Calculates the W component of a quat from the X, Y, and Z components.
 * Assumes that quaternion is 1 unit in length.
 * Any existing W component will be ignored.
 *
 * @param {quat} out the receiving quaternion
 * @param {ReadonlyQuat} a quat to calculate W component of
 * @returns {quat} out
 */

function calculateW(out, a) {
  var x = a[0],
      y = a[1],
      z = a[2];
  out[0] = x;
  out[1] = y;
  out[2] = z;
  out[3] = Math.sqrt(Math.abs(1.0 - x * x - y * y - z * z));
  return out;
}
/**
 * Calculate the exponential of a unit quaternion.
 *
 * @param {quat} out the receiving quaternion
 * @param {ReadonlyQuat} a quat to calculate the exponential of
 * @returns {quat} out
 */

function exp(out, a) {
  var x = a[0],
      y = a[1],
      z = a[2],
      w = a[3];
  var r = Math.sqrt(x * x + y * y + z * z);
  var et = Math.exp(w);
  var s = r > 0 ? et * Math.sin(r) / r : 0;
  out[0] = x * s;
  out[1] = y * s;
  out[2] = z * s;
  out[3] = et * Math.cos(r);
  return out;
}
/**
 * Calculate the natural logarithm of a unit quaternion.
 *
 * @param {quat} out the receiving quaternion
 * @param {ReadonlyQuat} a quat to calculate the exponential of
 * @returns {quat} out
 */

function ln(out, a) {
  var x = a[0],
      y = a[1],
      z = a[2],
      w = a[3];
  var r = Math.sqrt(x * x + y * y + z * z);
  var t = r > 0 ? Math.atan2(r, w) / r : 0;
  out[0] = x * t;
  out[1] = y * t;
  out[2] = z * t;
  out[3] = 0.5 * Math.log(x * x + y * y + z * z + w * w);
  return out;
}
/**
 * Calculate the scalar power of a unit quaternion.
 *
 * @param {quat} out the receiving quaternion
 * @param {ReadonlyQuat} a quat to calculate the exponential of
 * @param {Number} b amount to scale the quaternion by
 * @returns {quat} out
 */

function pow(out, a, b) {
  ln(out, a);
  scale$2(out, out, b);
  exp(out, out);
  return out;
}
/**
 * Performs a spherical linear interpolation between two quat
 *
 * @param {quat} out the receiving quaternion
 * @param {ReadonlyQuat} a the first operand
 * @param {ReadonlyQuat} b the second operand
 * @param {Number} t interpolation amount, in the range [0-1], between the two inputs
 * @returns {quat} out
 */

function slerp(out, a, b, t) {
  // benchmarks:
  //    http://jsperf.com/quaternion-slerp-implementations
  var ax = a[0],
      ay = a[1],
      az = a[2],
      aw = a[3];
  var bx = b[0],
      by = b[1],
      bz = b[2],
      bw = b[3];
  var omega, cosom, sinom, scale0, scale1; // calc cosine

  cosom = ax * bx + ay * by + az * bz + aw * bw; // adjust signs (if necessary)

  if (cosom < 0.0) {
    cosom = -cosom;
    bx = -bx;
    by = -by;
    bz = -bz;
    bw = -bw;
  } // calculate coefficients


  if (1.0 - cosom > EPSILON) {
    // standard case (slerp)
    omega = Math.acos(cosom);
    sinom = Math.sin(omega);
    scale0 = Math.sin((1.0 - t) * omega) / sinom;
    scale1 = Math.sin(t * omega) / sinom;
  } else {
    // "from" and "to" quaternions are very close
    //  ... so we can do a linear interpolation
    scale0 = 1.0 - t;
    scale1 = t;
  } // calculate final values


  out[0] = scale0 * ax + scale1 * bx;
  out[1] = scale0 * ay + scale1 * by;
  out[2] = scale0 * az + scale1 * bz;
  out[3] = scale0 * aw + scale1 * bw;
  return out;
}
/**
 * Generates a random unit quaternion
 *
 * @param {quat} out the receiving quaternion
 * @returns {quat} out
 */

function random$1(out) {
  // Implementation of http://planning.cs.uiuc.edu/node198.html
  // TODO: Calling random 3 times is probably not the fastest solution
  var u1 = RANDOM();
  var u2 = RANDOM();
  var u3 = RANDOM();
  var sqrt1MinusU1 = Math.sqrt(1 - u1);
  var sqrtU1 = Math.sqrt(u1);
  out[0] = sqrt1MinusU1 * Math.sin(2.0 * Math.PI * u2);
  out[1] = sqrt1MinusU1 * Math.cos(2.0 * Math.PI * u2);
  out[2] = sqrtU1 * Math.sin(2.0 * Math.PI * u3);
  out[3] = sqrtU1 * Math.cos(2.0 * Math.PI * u3);
  return out;
}
/**
 * Calculates the inverse of a quat
 *
 * @param {quat} out the receiving quaternion
 * @param {ReadonlyQuat} a quat to calculate inverse of
 * @returns {quat} out
 */

function invert$1(out, a) {
  var a0 = a[0],
      a1 = a[1],
      a2 = a[2],
      a3 = a[3];
  var dot = a0 * a0 + a1 * a1 + a2 * a2 + a3 * a3;
  var invDot = dot ? 1.0 / dot : 0; // TODO: Would be faster to return [0,0,0,0] immediately if dot == 0

  out[0] = -a0 * invDot;
  out[1] = -a1 * invDot;
  out[2] = -a2 * invDot;
  out[3] = a3 * invDot;
  return out;
}
/**
 * Calculates the conjugate of a quat
 * If the quaternion is normalized, this function is faster than quat.inverse and produces the same result.
 *
 * @param {quat} out the receiving quaternion
 * @param {ReadonlyQuat} a quat to calculate conjugate of
 * @returns {quat} out
 */

function conjugate$1(out, a) {
  out[0] = -a[0];
  out[1] = -a[1];
  out[2] = -a[2];
  out[3] = a[3];
  return out;
}
/**
 * Creates a quaternion from the given 3x3 rotation matrix.
 *
 * NOTE: The resultant quaternion is not normalized, so you should be sure
 * to renormalize the quaternion yourself where necessary.
 *
 * @param {quat} out the receiving quaternion
 * @param {ReadonlyMat3} m rotation matrix
 * @returns {quat} out
 * @function
 */

function fromMat3(out, m) {
  // Algorithm in Ken Shoemake's article in 1987 SIGGRAPH course notes
  // article "Quaternion Calculus and Fast Animation".
  var fTrace = m[0] + m[4] + m[8];
  var fRoot;

  if (fTrace > 0.0) {
    // |w| > 1/2, may as well choose w > 1/2
    fRoot = Math.sqrt(fTrace + 1.0); // 2w

    out[3] = 0.5 * fRoot;
    fRoot = 0.5 / fRoot; // 1/(4w)

    out[0] = (m[5] - m[7]) * fRoot;
    out[1] = (m[6] - m[2]) * fRoot;
    out[2] = (m[1] - m[3]) * fRoot;
  } else {
    // |w| <= 1/2
    var i = 0;
    if (m[4] > m[0]) i = 1;
    if (m[8] > m[i * 3 + i]) i = 2;
    var j = (i + 1) % 3;
    var k = (i + 2) % 3;
    fRoot = Math.sqrt(m[i * 3 + i] - m[j * 3 + j] - m[k * 3 + k] + 1.0);
    out[i] = 0.5 * fRoot;
    fRoot = 0.5 / fRoot;
    out[3] = (m[j * 3 + k] - m[k * 3 + j]) * fRoot;
    out[j] = (m[j * 3 + i] + m[i * 3 + j]) * fRoot;
    out[k] = (m[k * 3 + i] + m[i * 3 + k]) * fRoot;
  }

  return out;
}
/**
 * Creates a quaternion from the given euler angle x, y, z.
 *
 * @param {quat} out the receiving quaternion
 * @param {x} Angle to rotate around X axis in degrees.
 * @param {y} Angle to rotate around Y axis in degrees.
 * @param {z} Angle to rotate around Z axis in degrees.
 * @returns {quat} out
 * @function
 */

function fromEuler(out, x, y, z) {
  var halfToRad = 0.5 * Math.PI / 180.0;
  x *= halfToRad;
  y *= halfToRad;
  z *= halfToRad;
  var sx = Math.sin(x);
  var cx = Math.cos(x);
  var sy = Math.sin(y);
  var cy = Math.cos(y);
  var sz = Math.sin(z);
  var cz = Math.cos(z);
  out[0] = sx * cy * cz - cx * sy * sz;
  out[1] = cx * sy * cz + sx * cy * sz;
  out[2] = cx * cy * sz - sx * sy * cz;
  out[3] = cx * cy * cz + sx * sy * sz;
  return out;
}
/**
 * Returns a string representation of a quatenion
 *
 * @param {ReadonlyQuat} a vector to represent as a string
 * @returns {String} string representation of the vector
 */

function str$2(a) {
  return "quat(" + a[0] + ", " + a[1] + ", " + a[2] + ", " + a[3] + ")";
}
/**
 * Creates a new quat initialized with values from an existing quaternion
 *
 * @param {ReadonlyQuat} a quaternion to clone
 * @returns {quat} a new quaternion
 * @function
 */

var clone$2 = clone$3;
/**
 * Creates a new quat initialized with the given values
 *
 * @param {Number} x X component
 * @param {Number} y Y component
 * @param {Number} z Z component
 * @param {Number} w W component
 * @returns {quat} a new quaternion
 * @function
 */

var fromValues$2 = fromValues$3;
/**
 * Copy the values from one quat to another
 *
 * @param {quat} out the receiving quaternion
 * @param {ReadonlyQuat} a the source quaternion
 * @returns {quat} out
 * @function
 */

var copy$2 = copy$3;
/**
 * Set the components of a quat to the given values
 *
 * @param {quat} out the receiving quaternion
 * @param {Number} x X component
 * @param {Number} y Y component
 * @param {Number} z Z component
 * @param {Number} w W component
 * @returns {quat} out
 * @function
 */

var set$2 = set$3;
/**
 * Adds two quat's
 *
 * @param {quat} out the receiving quaternion
 * @param {ReadonlyQuat} a the first operand
 * @param {ReadonlyQuat} b the second operand
 * @returns {quat} out
 * @function
 */

var add$2 = add$3;
/**
 * Alias for {@link quat.multiply}
 * @function
 */

var mul$2 = multiply$2;
/**
 * Scales a quat by a scalar number
 *
 * @param {quat} out the receiving vector
 * @param {ReadonlyQuat} a the vector to scale
 * @param {Number} b amount to scale the vector by
 * @returns {quat} out
 * @function
 */

var scale$2 = scale$3;
/**
 * Calculates the dot product of two quat's
 *
 * @param {ReadonlyQuat} a the first operand
 * @param {ReadonlyQuat} b the second operand
 * @returns {Number} dot product of a and b
 * @function
 */

var dot$2 = dot$3;
/**
 * Performs a linear interpolation between two quat's
 *
 * @param {quat} out the receiving quaternion
 * @param {ReadonlyQuat} a the first operand
 * @param {ReadonlyQuat} b the second operand
 * @param {Number} t interpolation amount, in the range [0-1], between the two inputs
 * @returns {quat} out
 * @function
 */

var lerp$3 = lerp$4;
/**
 * Calculates the length of a quat
 *
 * @param {ReadonlyQuat} a vector to calculate length of
 * @returns {Number} length of a
 */

var length$2 = length$3;
/**
 * Alias for {@link quat.length}
 * @function
 */

var len$2 = length$2;
/**
 * Calculates the squared length of a quat
 *
 * @param {ReadonlyQuat} a vector to calculate squared length of
 * @returns {Number} squared length of a
 * @function
 */

var squaredLength$2 = squaredLength$3;
/**
 * Alias for {@link quat.squaredLength}
 * @function
 */

var sqrLen$2 = squaredLength$2;
/**
 * Normalize a quat
 *
 * @param {quat} out the receiving quaternion
 * @param {ReadonlyQuat} a quaternion to normalize
 * @returns {quat} out
 * @function
 */

var normalize$2 = normalize$3;
/**
 * Returns whether or not the quaternions have exactly the same elements in the same position (when compared with ===)
 *
 * @param {ReadonlyQuat} a The first quaternion.
 * @param {ReadonlyQuat} b The second quaternion.
 * @returns {Boolean} True if the vectors are equal, false otherwise.
 */

var exactEquals$2 = exactEquals$3;
/**
 * Returns whether or not the quaternions have approximately the same elements in the same position.
 *
 * @param {ReadonlyQuat} a The first vector.
 * @param {ReadonlyQuat} b The second vector.
 * @returns {Boolean} True if the vectors are equal, false otherwise.
 */

var equals$2 = equals$3;
/**
 * Sets a quaternion to represent the shortest rotation from one
 * vector to another.
 *
 * Both vectors are assumed to be unit length.
 *
 * @param {quat} out the receiving quaternion.
 * @param {ReadonlyVec3} a the initial vector
 * @param {ReadonlyVec3} b the destination vector
 * @returns {quat} out
 */

var rotationTo = function () {
  var tmpvec3 = create$4();
  var xUnitVec3 = fromValues$4(1, 0, 0);
  var yUnitVec3 = fromValues$4(0, 1, 0);
  return function (out, a, b) {
    var dot = dot$4(a, b);

    if (dot < -0.999999) {
      cross$2(tmpvec3, xUnitVec3, a);
      if (len$4(tmpvec3) < 0.000001) cross$2(tmpvec3, yUnitVec3, a);
      normalize$4(tmpvec3, tmpvec3);
      setAxisAngle(out, tmpvec3, Math.PI);
      return out;
    } else if (dot > 0.999999) {
      out[0] = 0;
      out[1] = 0;
      out[2] = 0;
      out[3] = 1;
      return out;
    } else {
      cross$2(tmpvec3, a, b);
      out[0] = tmpvec3[0];
      out[1] = tmpvec3[1];
      out[2] = tmpvec3[2];
      out[3] = 1 + dot;
      return normalize$2(out, out);
    }
  };
}();
/**
 * Performs a spherical linear interpolation with two control points
 *
 * @param {quat} out the receiving quaternion
 * @param {ReadonlyQuat} a the first operand
 * @param {ReadonlyQuat} b the second operand
 * @param {ReadonlyQuat} c the third operand
 * @param {ReadonlyQuat} d the fourth operand
 * @param {Number} t interpolation amount, in the range [0-1], between the two inputs
 * @returns {quat} out
 */

var sqlerp = function () {
  var temp1 = create$2();
  var temp2 = create$2();
  return function (out, a, b, c, d, t) {
    slerp(temp1, a, d, t);
    slerp(temp2, b, c, t);
    slerp(out, temp1, temp2, 2 * t * (1 - t));
    return out;
  };
}();
/**
 * Sets the specified quaternion with values corresponding to the given
 * axes. Each axis is a vec3 and is expected to be unit length and
 * perpendicular to all other specified axes.
 *
 * @param {ReadonlyVec3} view  the vector representing the viewing direction
 * @param {ReadonlyVec3} right the vector representing the local "right" direction
 * @param {ReadonlyVec3} up    the vector representing the local "up" direction
 * @returns {quat} out
 */

var setAxes = function () {
  var matr = create$6();
  return function (out, view, right, up) {
    matr[0] = right[0];
    matr[3] = right[1];
    matr[6] = right[2];
    matr[1] = up[0];
    matr[4] = up[1];
    matr[7] = up[2];
    matr[2] = -view[0];
    matr[5] = -view[1];
    matr[8] = -view[2];
    return normalize$2(out, fromMat3(out, matr));
  };
}();

var quat = /*#__PURE__*/Object.freeze({
    __proto__: null,
    create: create$2,
    identity: identity$1,
    setAxisAngle: setAxisAngle,
    getAxisAngle: getAxisAngle,
    getAngle: getAngle,
    multiply: multiply$2,
    rotateX: rotateX$1,
    rotateY: rotateY$1,
    rotateZ: rotateZ$1,
    calculateW: calculateW,
    exp: exp,
    ln: ln,
    pow: pow,
    slerp: slerp,
    random: random$1,
    invert: invert$1,
    conjugate: conjugate$1,
    fromMat3: fromMat3,
    fromEuler: fromEuler,
    str: str$2,
    clone: clone$2,
    fromValues: fromValues$2,
    copy: copy$2,
    set: set$2,
    add: add$2,
    mul: mul$2,
    scale: scale$2,
    dot: dot$2,
    lerp: lerp$3,
    length: length$2,
    len: len$2,
    squaredLength: squaredLength$2,
    sqrLen: sqrLen$2,
    normalize: normalize$2,
    exactEquals: exactEquals$2,
    equals: equals$2,
    rotationTo: rotationTo,
    sqlerp: sqlerp,
    setAxes: setAxes
});

/**
 * Dual Quaternion<br>
 * Format: [real, dual]<br>
 * Quaternion format: XYZW<br>
 * Make sure to have normalized dual quaternions, otherwise the functions may not work as intended.<br>
 * @module quat2
 */

/**
 * Creates a new identity dual quat
 *
 * @returns {quat2} a new dual quaternion [real -> rotation, dual -> translation]
 */

function create$1() {
  var dq = new ARRAY_TYPE(8);

  if (ARRAY_TYPE != Float32Array) {
    dq[0] = 0;
    dq[1] = 0;
    dq[2] = 0;
    dq[4] = 0;
    dq[5] = 0;
    dq[6] = 0;
    dq[7] = 0;
  }

  dq[3] = 1;
  return dq;
}
/**
 * Creates a new quat initialized with values from an existing quaternion
 *
 * @param {ReadonlyQuat2} a dual quaternion to clone
 * @returns {quat2} new dual quaternion
 * @function
 */

function clone$1(a) {
  var dq = new ARRAY_TYPE(8);
  dq[0] = a[0];
  dq[1] = a[1];
  dq[2] = a[2];
  dq[3] = a[3];
  dq[4] = a[4];
  dq[5] = a[5];
  dq[6] = a[6];
  dq[7] = a[7];
  return dq;
}
/**
 * Creates a new dual quat initialized with the given values
 *
 * @param {Number} x1 X component
 * @param {Number} y1 Y component
 * @param {Number} z1 Z component
 * @param {Number} w1 W component
 * @param {Number} x2 X component
 * @param {Number} y2 Y component
 * @param {Number} z2 Z component
 * @param {Number} w2 W component
 * @returns {quat2} new dual quaternion
 * @function
 */

function fromValues$1(x1, y1, z1, w1, x2, y2, z2, w2) {
  var dq = new ARRAY_TYPE(8);
  dq[0] = x1;
  dq[1] = y1;
  dq[2] = z1;
  dq[3] = w1;
  dq[4] = x2;
  dq[5] = y2;
  dq[6] = z2;
  dq[7] = w2;
  return dq;
}
/**
 * Creates a new dual quat from the given values (quat and translation)
 *
 * @param {Number} x1 X component
 * @param {Number} y1 Y component
 * @param {Number} z1 Z component
 * @param {Number} w1 W component
 * @param {Number} x2 X component (translation)
 * @param {Number} y2 Y component (translation)
 * @param {Number} z2 Z component (translation)
 * @returns {quat2} new dual quaternion
 * @function
 */

function fromRotationTranslationValues(x1, y1, z1, w1, x2, y2, z2) {
  var dq = new ARRAY_TYPE(8);
  dq[0] = x1;
  dq[1] = y1;
  dq[2] = z1;
  dq[3] = w1;
  var ax = x2 * 0.5,
      ay = y2 * 0.5,
      az = z2 * 0.5;
  dq[4] = ax * w1 + ay * z1 - az * y1;
  dq[5] = ay * w1 + az * x1 - ax * z1;
  dq[6] = az * w1 + ax * y1 - ay * x1;
  dq[7] = -ax * x1 - ay * y1 - az * z1;
  return dq;
}
/**
 * Creates a dual quat from a quaternion and a translation
 *
 * @param {ReadonlyQuat2} dual quaternion receiving operation result
 * @param {ReadonlyQuat} q a normalized quaternion
 * @param {ReadonlyVec3} t tranlation vector
 * @returns {quat2} dual quaternion receiving operation result
 * @function
 */

function fromRotationTranslation(out, q, t) {
  var ax = t[0] * 0.5,
      ay = t[1] * 0.5,
      az = t[2] * 0.5,
      bx = q[0],
      by = q[1],
      bz = q[2],
      bw = q[3];
  out[0] = bx;
  out[1] = by;
  out[2] = bz;
  out[3] = bw;
  out[4] = ax * bw + ay * bz - az * by;
  out[5] = ay * bw + az * bx - ax * bz;
  out[6] = az * bw + ax * by - ay * bx;
  out[7] = -ax * bx - ay * by - az * bz;
  return out;
}
/**
 * Creates a dual quat from a translation
 *
 * @param {ReadonlyQuat2} dual quaternion receiving operation result
 * @param {ReadonlyVec3} t translation vector
 * @returns {quat2} dual quaternion receiving operation result
 * @function
 */

function fromTranslation(out, t) {
  out[0] = 0;
  out[1] = 0;
  out[2] = 0;
  out[3] = 1;
  out[4] = t[0] * 0.5;
  out[5] = t[1] * 0.5;
  out[6] = t[2] * 0.5;
  out[7] = 0;
  return out;
}
/**
 * Creates a dual quat from a quaternion
 *
 * @param {ReadonlyQuat2} dual quaternion receiving operation result
 * @param {ReadonlyQuat} q the quaternion
 * @returns {quat2} dual quaternion receiving operation result
 * @function
 */

function fromRotation(out, q) {
  out[0] = q[0];
  out[1] = q[1];
  out[2] = q[2];
  out[3] = q[3];
  out[4] = 0;
  out[5] = 0;
  out[6] = 0;
  out[7] = 0;
  return out;
}
/**
 * Creates a new dual quat from a matrix (4x4)
 *
 * @param {quat2} out the dual quaternion
 * @param {ReadonlyMat4} a the matrix
 * @returns {quat2} dual quat receiving operation result
 * @function
 */

function fromMat4(out, a) {
  //TODO Optimize this
  var outer = create$2();
  getRotation(outer, a);
  var t = new ARRAY_TYPE(3);
  getTranslation$1(t, a);
  fromRotationTranslation(out, outer, t);
  return out;
}
/**
 * Copy the values from one dual quat to another
 *
 * @param {quat2} out the receiving dual quaternion
 * @param {ReadonlyQuat2} a the source dual quaternion
 * @returns {quat2} out
 * @function
 */

function copy$1(out, a) {
  out[0] = a[0];
  out[1] = a[1];
  out[2] = a[2];
  out[3] = a[3];
  out[4] = a[4];
  out[5] = a[5];
  out[6] = a[6];
  out[7] = a[7];
  return out;
}
/**
 * Set a dual quat to the identity dual quaternion
 *
 * @param {quat2} out the receiving quaternion
 * @returns {quat2} out
 */

function identity(out) {
  out[0] = 0;
  out[1] = 0;
  out[2] = 0;
  out[3] = 1;
  out[4] = 0;
  out[5] = 0;
  out[6] = 0;
  out[7] = 0;
  return out;
}
/**
 * Set the components of a dual quat to the given values
 *
 * @param {quat2} out the receiving quaternion
 * @param {Number} x1 X component
 * @param {Number} y1 Y component
 * @param {Number} z1 Z component
 * @param {Number} w1 W component
 * @param {Number} x2 X component
 * @param {Number} y2 Y component
 * @param {Number} z2 Z component
 * @param {Number} w2 W component
 * @returns {quat2} out
 * @function
 */

function set$1(out, x1, y1, z1, w1, x2, y2, z2, w2) {
  out[0] = x1;
  out[1] = y1;
  out[2] = z1;
  out[3] = w1;
  out[4] = x2;
  out[5] = y2;
  out[6] = z2;
  out[7] = w2;
  return out;
}
/**
 * Gets the real part of a dual quat
 * @param  {quat} out real part
 * @param  {ReadonlyQuat2} a Dual Quaternion
 * @return {quat} real part
 */

var getReal = copy$2;
/**
 * Gets the dual part of a dual quat
 * @param  {quat} out dual part
 * @param  {ReadonlyQuat2} a Dual Quaternion
 * @return {quat} dual part
 */

function getDual(out, a) {
  out[0] = a[4];
  out[1] = a[5];
  out[2] = a[6];
  out[3] = a[7];
  return out;
}
/**
 * Set the real component of a dual quat to the given quaternion
 *
 * @param {quat2} out the receiving quaternion
 * @param {ReadonlyQuat} q a quaternion representing the real part
 * @returns {quat2} out
 * @function
 */

var setReal = copy$2;
/**
 * Set the dual component of a dual quat to the given quaternion
 *
 * @param {quat2} out the receiving quaternion
 * @param {ReadonlyQuat} q a quaternion representing the dual part
 * @returns {quat2} out
 * @function
 */

function setDual(out, q) {
  out[4] = q[0];
  out[5] = q[1];
  out[6] = q[2];
  out[7] = q[3];
  return out;
}
/**
 * Gets the translation of a normalized dual quat
 * @param  {vec3} out translation
 * @param  {ReadonlyQuat2} a Dual Quaternion to be decomposed
 * @return {vec3} translation
 */

function getTranslation(out, a) {
  var ax = a[4],
      ay = a[5],
      az = a[6],
      aw = a[7],
      bx = -a[0],
      by = -a[1],
      bz = -a[2],
      bw = a[3];
  out[0] = (ax * bw + aw * bx + ay * bz - az * by) * 2;
  out[1] = (ay * bw + aw * by + az * bx - ax * bz) * 2;
  out[2] = (az * bw + aw * bz + ax * by - ay * bx) * 2;
  return out;
}
/**
 * Translates a dual quat by the given vector
 *
 * @param {quat2} out the receiving dual quaternion
 * @param {ReadonlyQuat2} a the dual quaternion to translate
 * @param {ReadonlyVec3} v vector to translate by
 * @returns {quat2} out
 */

function translate(out, a, v) {
  var ax1 = a[0],
      ay1 = a[1],
      az1 = a[2],
      aw1 = a[3],
      bx1 = v[0] * 0.5,
      by1 = v[1] * 0.5,
      bz1 = v[2] * 0.5,
      ax2 = a[4],
      ay2 = a[5],
      az2 = a[6],
      aw2 = a[7];
  out[0] = ax1;
  out[1] = ay1;
  out[2] = az1;
  out[3] = aw1;
  out[4] = aw1 * bx1 + ay1 * bz1 - az1 * by1 + ax2;
  out[5] = aw1 * by1 + az1 * bx1 - ax1 * bz1 + ay2;
  out[6] = aw1 * bz1 + ax1 * by1 - ay1 * bx1 + az2;
  out[7] = -ax1 * bx1 - ay1 * by1 - az1 * bz1 + aw2;
  return out;
}
/**
 * Rotates a dual quat around the X axis
 *
 * @param {quat2} out the receiving dual quaternion
 * @param {ReadonlyQuat2} a the dual quaternion to rotate
 * @param {number} rad how far should the rotation be
 * @returns {quat2} out
 */

function rotateX(out, a, rad) {
  var bx = -a[0],
      by = -a[1],
      bz = -a[2],
      bw = a[3],
      ax = a[4],
      ay = a[5],
      az = a[6],
      aw = a[7],
      ax1 = ax * bw + aw * bx + ay * bz - az * by,
      ay1 = ay * bw + aw * by + az * bx - ax * bz,
      az1 = az * bw + aw * bz + ax * by - ay * bx,
      aw1 = aw * bw - ax * bx - ay * by - az * bz;
  rotateX$1(out, a, rad);
  bx = out[0];
  by = out[1];
  bz = out[2];
  bw = out[3];
  out[4] = ax1 * bw + aw1 * bx + ay1 * bz - az1 * by;
  out[5] = ay1 * bw + aw1 * by + az1 * bx - ax1 * bz;
  out[6] = az1 * bw + aw1 * bz + ax1 * by - ay1 * bx;
  out[7] = aw1 * bw - ax1 * bx - ay1 * by - az1 * bz;
  return out;
}
/**
 * Rotates a dual quat around the Y axis
 *
 * @param {quat2} out the receiving dual quaternion
 * @param {ReadonlyQuat2} a the dual quaternion to rotate
 * @param {number} rad how far should the rotation be
 * @returns {quat2} out
 */

function rotateY(out, a, rad) {
  var bx = -a[0],
      by = -a[1],
      bz = -a[2],
      bw = a[3],
      ax = a[4],
      ay = a[5],
      az = a[6],
      aw = a[7],
      ax1 = ax * bw + aw * bx + ay * bz - az * by,
      ay1 = ay * bw + aw * by + az * bx - ax * bz,
      az1 = az * bw + aw * bz + ax * by - ay * bx,
      aw1 = aw * bw - ax * bx - ay * by - az * bz;
  rotateY$1(out, a, rad);
  bx = out[0];
  by = out[1];
  bz = out[2];
  bw = out[3];
  out[4] = ax1 * bw + aw1 * bx + ay1 * bz - az1 * by;
  out[5] = ay1 * bw + aw1 * by + az1 * bx - ax1 * bz;
  out[6] = az1 * bw + aw1 * bz + ax1 * by - ay1 * bx;
  out[7] = aw1 * bw - ax1 * bx - ay1 * by - az1 * bz;
  return out;
}
/**
 * Rotates a dual quat around the Z axis
 *
 * @param {quat2} out the receiving dual quaternion
 * @param {ReadonlyQuat2} a the dual quaternion to rotate
 * @param {number} rad how far should the rotation be
 * @returns {quat2} out
 */

function rotateZ(out, a, rad) {
  var bx = -a[0],
      by = -a[1],
      bz = -a[2],
      bw = a[3],
      ax = a[4],
      ay = a[5],
      az = a[6],
      aw = a[7],
      ax1 = ax * bw + aw * bx + ay * bz - az * by,
      ay1 = ay * bw + aw * by + az * bx - ax * bz,
      az1 = az * bw + aw * bz + ax * by - ay * bx,
      aw1 = aw * bw - ax * bx - ay * by - az * bz;
  rotateZ$1(out, a, rad);
  bx = out[0];
  by = out[1];
  bz = out[2];
  bw = out[3];
  out[4] = ax1 * bw + aw1 * bx + ay1 * bz - az1 * by;
  out[5] = ay1 * bw + aw1 * by + az1 * bx - ax1 * bz;
  out[6] = az1 * bw + aw1 * bz + ax1 * by - ay1 * bx;
  out[7] = aw1 * bw - ax1 * bx - ay1 * by - az1 * bz;
  return out;
}
/**
 * Rotates a dual quat by a given quaternion (a * q)
 *
 * @param {quat2} out the receiving dual quaternion
 * @param {ReadonlyQuat2} a the dual quaternion to rotate
 * @param {ReadonlyQuat} q quaternion to rotate by
 * @returns {quat2} out
 */

function rotateByQuatAppend(out, a, q) {
  var qx = q[0],
      qy = q[1],
      qz = q[2],
      qw = q[3],
      ax = a[0],
      ay = a[1],
      az = a[2],
      aw = a[3];
  out[0] = ax * qw + aw * qx + ay * qz - az * qy;
  out[1] = ay * qw + aw * qy + az * qx - ax * qz;
  out[2] = az * qw + aw * qz + ax * qy - ay * qx;
  out[3] = aw * qw - ax * qx - ay * qy - az * qz;
  ax = a[4];
  ay = a[5];
  az = a[6];
  aw = a[7];
  out[4] = ax * qw + aw * qx + ay * qz - az * qy;
  out[5] = ay * qw + aw * qy + az * qx - ax * qz;
  out[6] = az * qw + aw * qz + ax * qy - ay * qx;
  out[7] = aw * qw - ax * qx - ay * qy - az * qz;
  return out;
}
/**
 * Rotates a dual quat by a given quaternion (q * a)
 *
 * @param {quat2} out the receiving dual quaternion
 * @param {ReadonlyQuat} q quaternion to rotate by
 * @param {ReadonlyQuat2} a the dual quaternion to rotate
 * @returns {quat2} out
 */

function rotateByQuatPrepend(out, q, a) {
  var qx = q[0],
      qy = q[1],
      qz = q[2],
      qw = q[3],
      bx = a[0],
      by = a[1],
      bz = a[2],
      bw = a[3];
  out[0] = qx * bw + qw * bx + qy * bz - qz * by;
  out[1] = qy * bw + qw * by + qz * bx - qx * bz;
  out[2] = qz * bw + qw * bz + qx * by - qy * bx;
  out[3] = qw * bw - qx * bx - qy * by - qz * bz;
  bx = a[4];
  by = a[5];
  bz = a[6];
  bw = a[7];
  out[4] = qx * bw + qw * bx + qy * bz - qz * by;
  out[5] = qy * bw + qw * by + qz * bx - qx * bz;
  out[6] = qz * bw + qw * bz + qx * by - qy * bx;
  out[7] = qw * bw - qx * bx - qy * by - qz * bz;
  return out;
}
/**
 * Rotates a dual quat around a given axis. Does the normalisation automatically
 *
 * @param {quat2} out the receiving dual quaternion
 * @param {ReadonlyQuat2} a the dual quaternion to rotate
 * @param {ReadonlyVec3} axis the axis to rotate around
 * @param {Number} rad how far the rotation should be
 * @returns {quat2} out
 */

function rotateAroundAxis(out, a, axis, rad) {
  //Special case for rad = 0
  if (Math.abs(rad) < EPSILON) {
    return copy$1(out, a);
  }

  var axisLength = Math.hypot(axis[0], axis[1], axis[2]);
  rad = rad * 0.5;
  var s = Math.sin(rad);
  var bx = s * axis[0] / axisLength;
  var by = s * axis[1] / axisLength;
  var bz = s * axis[2] / axisLength;
  var bw = Math.cos(rad);
  var ax1 = a[0],
      ay1 = a[1],
      az1 = a[2],
      aw1 = a[3];
  out[0] = ax1 * bw + aw1 * bx + ay1 * bz - az1 * by;
  out[1] = ay1 * bw + aw1 * by + az1 * bx - ax1 * bz;
  out[2] = az1 * bw + aw1 * bz + ax1 * by - ay1 * bx;
  out[3] = aw1 * bw - ax1 * bx - ay1 * by - az1 * bz;
  var ax = a[4],
      ay = a[5],
      az = a[6],
      aw = a[7];
  out[4] = ax * bw + aw * bx + ay * bz - az * by;
  out[5] = ay * bw + aw * by + az * bx - ax * bz;
  out[6] = az * bw + aw * bz + ax * by - ay * bx;
  out[7] = aw * bw - ax * bx - ay * by - az * bz;
  return out;
}
/**
 * Adds two dual quat's
 *
 * @param {quat2} out the receiving dual quaternion
 * @param {ReadonlyQuat2} a the first operand
 * @param {ReadonlyQuat2} b the second operand
 * @returns {quat2} out
 * @function
 */

function add$1(out, a, b) {
  out[0] = a[0] + b[0];
  out[1] = a[1] + b[1];
  out[2] = a[2] + b[2];
  out[3] = a[3] + b[3];
  out[4] = a[4] + b[4];
  out[5] = a[5] + b[5];
  out[6] = a[6] + b[6];
  out[7] = a[7] + b[7];
  return out;
}
/**
 * Multiplies two dual quat's
 *
 * @param {quat2} out the receiving dual quaternion
 * @param {ReadonlyQuat2} a the first operand
 * @param {ReadonlyQuat2} b the second operand
 * @returns {quat2} out
 */

function multiply$1(out, a, b) {
  var ax0 = a[0],
      ay0 = a[1],
      az0 = a[2],
      aw0 = a[3],
      bx1 = b[4],
      by1 = b[5],
      bz1 = b[6],
      bw1 = b[7],
      ax1 = a[4],
      ay1 = a[5],
      az1 = a[6],
      aw1 = a[7],
      bx0 = b[0],
      by0 = b[1],
      bz0 = b[2],
      bw0 = b[3];
  out[0] = ax0 * bw0 + aw0 * bx0 + ay0 * bz0 - az0 * by0;
  out[1] = ay0 * bw0 + aw0 * by0 + az0 * bx0 - ax0 * bz0;
  out[2] = az0 * bw0 + aw0 * bz0 + ax0 * by0 - ay0 * bx0;
  out[3] = aw0 * bw0 - ax0 * bx0 - ay0 * by0 - az0 * bz0;
  out[4] = ax0 * bw1 + aw0 * bx1 + ay0 * bz1 - az0 * by1 + ax1 * bw0 + aw1 * bx0 + ay1 * bz0 - az1 * by0;
  out[5] = ay0 * bw1 + aw0 * by1 + az0 * bx1 - ax0 * bz1 + ay1 * bw0 + aw1 * by0 + az1 * bx0 - ax1 * bz0;
  out[6] = az0 * bw1 + aw0 * bz1 + ax0 * by1 - ay0 * bx1 + az1 * bw0 + aw1 * bz0 + ax1 * by0 - ay1 * bx0;
  out[7] = aw0 * bw1 - ax0 * bx1 - ay0 * by1 - az0 * bz1 + aw1 * bw0 - ax1 * bx0 - ay1 * by0 - az1 * bz0;
  return out;
}
/**
 * Alias for {@link quat2.multiply}
 * @function
 */

var mul$1 = multiply$1;
/**
 * Scales a dual quat by a scalar number
 *
 * @param {quat2} out the receiving dual quat
 * @param {ReadonlyQuat2} a the dual quat to scale
 * @param {Number} b amount to scale the dual quat by
 * @returns {quat2} out
 * @function
 */

function scale$1(out, a, b) {
  out[0] = a[0] * b;
  out[1] = a[1] * b;
  out[2] = a[2] * b;
  out[3] = a[3] * b;
  out[4] = a[4] * b;
  out[5] = a[5] * b;
  out[6] = a[6] * b;
  out[7] = a[7] * b;
  return out;
}
/**
 * Calculates the dot product of two dual quat's (The dot product of the real parts)
 *
 * @param {ReadonlyQuat2} a the first operand
 * @param {ReadonlyQuat2} b the second operand
 * @returns {Number} dot product of a and b
 * @function
 */

var dot$1 = dot$2;
/**
 * Performs a linear interpolation between two dual quats's
 * NOTE: The resulting dual quaternions won't always be normalized (The error is most noticeable when t = 0.5)
 *
 * @param {quat2} out the receiving dual quat
 * @param {ReadonlyQuat2} a the first operand
 * @param {ReadonlyQuat2} b the second operand
 * @param {Number} t interpolation amount, in the range [0-1], between the two inputs
 * @returns {quat2} out
 */

function lerp$2(out, a, b, t) {
  var mt = 1 - t;
  if (dot$1(a, b) < 0) t = -t;
  out[0] = a[0] * mt + b[0] * t;
  out[1] = a[1] * mt + b[1] * t;
  out[2] = a[2] * mt + b[2] * t;
  out[3] = a[3] * mt + b[3] * t;
  out[4] = a[4] * mt + b[4] * t;
  out[5] = a[5] * mt + b[5] * t;
  out[6] = a[6] * mt + b[6] * t;
  out[7] = a[7] * mt + b[7] * t;
  return out;
}
/**
 * Calculates the inverse of a dual quat. If they are normalized, conjugate is cheaper
 *
 * @param {quat2} out the receiving dual quaternion
 * @param {ReadonlyQuat2} a dual quat to calculate inverse of
 * @returns {quat2} out
 */

function invert(out, a) {
  var sqlen = squaredLength$1(a);
  out[0] = -a[0] / sqlen;
  out[1] = -a[1] / sqlen;
  out[2] = -a[2] / sqlen;
  out[3] = a[3] / sqlen;
  out[4] = -a[4] / sqlen;
  out[5] = -a[5] / sqlen;
  out[6] = -a[6] / sqlen;
  out[7] = a[7] / sqlen;
  return out;
}
/**
 * Calculates the conjugate of a dual quat
 * If the dual quaternion is normalized, this function is faster than quat2.inverse and produces the same result.
 *
 * @param {quat2} out the receiving quaternion
 * @param {ReadonlyQuat2} a quat to calculate conjugate of
 * @returns {quat2} out
 */

function conjugate(out, a) {
  out[0] = -a[0];
  out[1] = -a[1];
  out[2] = -a[2];
  out[3] = a[3];
  out[4] = -a[4];
  out[5] = -a[5];
  out[6] = -a[6];
  out[7] = a[7];
  return out;
}
/**
 * Calculates the length of a dual quat
 *
 * @param {ReadonlyQuat2} a dual quat to calculate length of
 * @returns {Number} length of a
 * @function
 */

var length$1 = length$2;
/**
 * Alias for {@link quat2.length}
 * @function
 */

var len$1 = length$1;
/**
 * Calculates the squared length of a dual quat
 *
 * @param {ReadonlyQuat2} a dual quat to calculate squared length of
 * @returns {Number} squared length of a
 * @function
 */

var squaredLength$1 = squaredLength$2;
/**
 * Alias for {@link quat2.squaredLength}
 * @function
 */

var sqrLen$1 = squaredLength$1;
/**
 * Normalize a dual quat
 *
 * @param {quat2} out the receiving dual quaternion
 * @param {ReadonlyQuat2} a dual quaternion to normalize
 * @returns {quat2} out
 * @function
 */

function normalize$1(out, a) {
  var magnitude = squaredLength$1(a);

  if (magnitude > 0) {
    magnitude = Math.sqrt(magnitude);
    var a0 = a[0] / magnitude;
    var a1 = a[1] / magnitude;
    var a2 = a[2] / magnitude;
    var a3 = a[3] / magnitude;
    var b0 = a[4];
    var b1 = a[5];
    var b2 = a[6];
    var b3 = a[7];
    var a_dot_b = a0 * b0 + a1 * b1 + a2 * b2 + a3 * b3;
    out[0] = a0;
    out[1] = a1;
    out[2] = a2;
    out[3] = a3;
    out[4] = (b0 - a0 * a_dot_b) / magnitude;
    out[5] = (b1 - a1 * a_dot_b) / magnitude;
    out[6] = (b2 - a2 * a_dot_b) / magnitude;
    out[7] = (b3 - a3 * a_dot_b) / magnitude;
  }

  return out;
}
/**
 * Returns a string representation of a dual quatenion
 *
 * @param {ReadonlyQuat2} a dual quaternion to represent as a string
 * @returns {String} string representation of the dual quat
 */

function str$1(a) {
  return "quat2(" + a[0] + ", " + a[1] + ", " + a[2] + ", " + a[3] + ", " + a[4] + ", " + a[5] + ", " + a[6] + ", " + a[7] + ")";
}
/**
 * Returns whether or not the dual quaternions have exactly the same elements in the same position (when compared with ===)
 *
 * @param {ReadonlyQuat2} a the first dual quaternion.
 * @param {ReadonlyQuat2} b the second dual quaternion.
 * @returns {Boolean} true if the dual quaternions are equal, false otherwise.
 */

function exactEquals$1(a, b) {
  return a[0] === b[0] && a[1] === b[1] && a[2] === b[2] && a[3] === b[3] && a[4] === b[4] && a[5] === b[5] && a[6] === b[6] && a[7] === b[7];
}
/**
 * Returns whether or not the dual quaternions have approximately the same elements in the same position.
 *
 * @param {ReadonlyQuat2} a the first dual quat.
 * @param {ReadonlyQuat2} b the second dual quat.
 * @returns {Boolean} true if the dual quats are equal, false otherwise.
 */

function equals$1(a, b) {
  var a0 = a[0],
      a1 = a[1],
      a2 = a[2],
      a3 = a[3],
      a4 = a[4],
      a5 = a[5],
      a6 = a[6],
      a7 = a[7];
  var b0 = b[0],
      b1 = b[1],
      b2 = b[2],
      b3 = b[3],
      b4 = b[4],
      b5 = b[5],
      b6 = b[6],
      b7 = b[7];
  return Math.abs(a0 - b0) <= EPSILON * Math.max(1.0, Math.abs(a0), Math.abs(b0)) && Math.abs(a1 - b1) <= EPSILON * Math.max(1.0, Math.abs(a1), Math.abs(b1)) && Math.abs(a2 - b2) <= EPSILON * Math.max(1.0, Math.abs(a2), Math.abs(b2)) && Math.abs(a3 - b3) <= EPSILON * Math.max(1.0, Math.abs(a3), Math.abs(b3)) && Math.abs(a4 - b4) <= EPSILON * Math.max(1.0, Math.abs(a4), Math.abs(b4)) && Math.abs(a5 - b5) <= EPSILON * Math.max(1.0, Math.abs(a5), Math.abs(b5)) && Math.abs(a6 - b6) <= EPSILON * Math.max(1.0, Math.abs(a6), Math.abs(b6)) && Math.abs(a7 - b7) <= EPSILON * Math.max(1.0, Math.abs(a7), Math.abs(b7));
}

var quat2 = /*#__PURE__*/Object.freeze({
    __proto__: null,
    create: create$1,
    clone: clone$1,
    fromValues: fromValues$1,
    fromRotationTranslationValues: fromRotationTranslationValues,
    fromRotationTranslation: fromRotationTranslation,
    fromTranslation: fromTranslation,
    fromRotation: fromRotation,
    fromMat4: fromMat4,
    copy: copy$1,
    identity: identity,
    set: set$1,
    getReal: getReal,
    getDual: getDual,
    setReal: setReal,
    setDual: setDual,
    getTranslation: getTranslation,
    translate: translate,
    rotateX: rotateX,
    rotateY: rotateY,
    rotateZ: rotateZ,
    rotateByQuatAppend: rotateByQuatAppend,
    rotateByQuatPrepend: rotateByQuatPrepend,
    rotateAroundAxis: rotateAroundAxis,
    add: add$1,
    multiply: multiply$1,
    mul: mul$1,
    scale: scale$1,
    dot: dot$1,
    lerp: lerp$2,
    invert: invert,
    conjugate: conjugate,
    length: length$1,
    len: len$1,
    squaredLength: squaredLength$1,
    sqrLen: sqrLen$1,
    normalize: normalize$1,
    str: str$1,
    exactEquals: exactEquals$1,
    equals: equals$1
});

/**
 * 2 Dimensional Vector
 * @module vec2
 */

/**
 * Creates a new, empty vec2
 *
 * @returns {vec2} a new 2D vector
 */

function create() {
  var out = new ARRAY_TYPE(2);

  if (ARRAY_TYPE != Float32Array) {
    out[0] = 0;
    out[1] = 0;
  }

  return out;
}
/**
 * Creates a new vec2 initialized with values from an existing vector
 *
 * @param {ReadonlyVec2} a vector to clone
 * @returns {vec2} a new 2D vector
 */

function clone(a) {
  var out = new ARRAY_TYPE(2);
  out[0] = a[0];
  out[1] = a[1];
  return out;
}
/**
 * Creates a new vec2 initialized with the given values
 *
 * @param {Number} x X component
 * @param {Number} y Y component
 * @returns {vec2} a new 2D vector
 */

function fromValues(x, y) {
  var out = new ARRAY_TYPE(2);
  out[0] = x;
  out[1] = y;
  return out;
}
/**
 * Copy the values from one vec2 to another
 *
 * @param {vec2} out the receiving vector
 * @param {ReadonlyVec2} a the source vector
 * @returns {vec2} out
 */

function copy(out, a) {
  out[0] = a[0];
  out[1] = a[1];
  return out;
}
/**
 * Set the components of a vec2 to the given values
 *
 * @param {vec2} out the receiving vector
 * @param {Number} x X component
 * @param {Number} y Y component
 * @returns {vec2} out
 */

function set(out, x, y) {
  out[0] = x;
  out[1] = y;
  return out;
}
/**
 * Adds two vec2's
 *
 * @param {vec2} out the receiving vector
 * @param {ReadonlyVec2} a the first operand
 * @param {ReadonlyVec2} b the second operand
 * @returns {vec2} out
 */

function add(out, a, b) {
  out[0] = a[0] + b[0];
  out[1] = a[1] + b[1];
  return out;
}
/**
 * Subtracts vector b from vector a
 *
 * @param {vec2} out the receiving vector
 * @param {ReadonlyVec2} a the first operand
 * @param {ReadonlyVec2} b the second operand
 * @returns {vec2} out
 */

function subtract(out, a, b) {
  out[0] = a[0] - b[0];
  out[1] = a[1] - b[1];
  return out;
}
/**
 * Multiplies two vec2's
 *
 * @param {vec2} out the receiving vector
 * @param {ReadonlyVec2} a the first operand
 * @param {ReadonlyVec2} b the second operand
 * @returns {vec2} out
 */

function multiply(out, a, b) {
  out[0] = a[0] * b[0];
  out[1] = a[1] * b[1];
  return out;
}
/**
 * Divides two vec2's
 *
 * @param {vec2} out the receiving vector
 * @param {ReadonlyVec2} a the first operand
 * @param {ReadonlyVec2} b the second operand
 * @returns {vec2} out
 */

function divide(out, a, b) {
  out[0] = a[0] / b[0];
  out[1] = a[1] / b[1];
  return out;
}
/**
 * Math.ceil the components of a vec2
 *
 * @param {vec2} out the receiving vector
 * @param {ReadonlyVec2} a vector to ceil
 * @returns {vec2} out
 */

function ceil(out, a) {
  out[0] = Math.ceil(a[0]);
  out[1] = Math.ceil(a[1]);
  return out;
}
/**
 * Math.floor the components of a vec2
 *
 * @param {vec2} out the receiving vector
 * @param {ReadonlyVec2} a vector to floor
 * @returns {vec2} out
 */

function floor$1(out, a) {
  out[0] = Math.floor(a[0]);
  out[1] = Math.floor(a[1]);
  return out;
}
/**
 * Returns the minimum of two vec2's
 *
 * @param {vec2} out the receiving vector
 * @param {ReadonlyVec2} a the first operand
 * @param {ReadonlyVec2} b the second operand
 * @returns {vec2} out
 */

function min(out, a, b) {
  out[0] = Math.min(a[0], b[0]);
  out[1] = Math.min(a[1], b[1]);
  return out;
}
/**
 * Returns the maximum of two vec2's
 *
 * @param {vec2} out the receiving vector
 * @param {ReadonlyVec2} a the first operand
 * @param {ReadonlyVec2} b the second operand
 * @returns {vec2} out
 */

function max(out, a, b) {
  out[0] = Math.max(a[0], b[0]);
  out[1] = Math.max(a[1], b[1]);
  return out;
}
/**
 * Math.round the components of a vec2
 *
 * @param {vec2} out the receiving vector
 * @param {ReadonlyVec2} a vector to round
 * @returns {vec2} out
 */

function round(out, a) {
  out[0] = Math.round(a[0]);
  out[1] = Math.round(a[1]);
  return out;
}
/**
 * Scales a vec2 by a scalar number
 *
 * @param {vec2} out the receiving vector
 * @param {ReadonlyVec2} a the vector to scale
 * @param {Number} b amount to scale the vector by
 * @returns {vec2} out
 */

function scale(out, a, b) {
  out[0] = a[0] * b;
  out[1] = a[1] * b;
  return out;
}
/**
 * Adds two vec2's after scaling the second operand by a scalar value
 *
 * @param {vec2} out the receiving vector
 * @param {ReadonlyVec2} a the first operand
 * @param {ReadonlyVec2} b the second operand
 * @param {Number} scale the amount to scale b by before adding
 * @returns {vec2} out
 */

function scaleAndAdd(out, a, b, scale) {
  out[0] = a[0] + b[0] * scale;
  out[1] = a[1] + b[1] * scale;
  return out;
}
/**
 * Calculates the euclidian distance between two vec2's
 *
 * @param {ReadonlyVec2} a the first operand
 * @param {ReadonlyVec2} b the second operand
 * @returns {Number} distance between a and b
 */

function distance(a, b) {
  var x = b[0] - a[0],
      y = b[1] - a[1];
  return Math.hypot(x, y);
}
/**
 * Calculates the squared euclidian distance between two vec2's
 *
 * @param {ReadonlyVec2} a the first operand
 * @param {ReadonlyVec2} b the second operand
 * @returns {Number} squared distance between a and b
 */

function squaredDistance(a, b) {
  var x = b[0] - a[0],
      y = b[1] - a[1];
  return x * x + y * y;
}
/**
 * Calculates the length of a vec2
 *
 * @param {ReadonlyVec2} a vector to calculate length of
 * @returns {Number} length of a
 */

function length(a) {
  var x = a[0],
      y = a[1];
  return Math.hypot(x, y);
}
/**
 * Calculates the squared length of a vec2
 *
 * @param {ReadonlyVec2} a vector to calculate squared length of
 * @returns {Number} squared length of a
 */

function squaredLength(a) {
  var x = a[0],
      y = a[1];
  return x * x + y * y;
}
/**
 * Negates the components of a vec2
 *
 * @param {vec2} out the receiving vector
 * @param {ReadonlyVec2} a vector to negate
 * @returns {vec2} out
 */

function negate(out, a) {
  out[0] = -a[0];
  out[1] = -a[1];
  return out;
}
/**
 * Returns the inverse of the components of a vec2
 *
 * @param {vec2} out the receiving vector
 * @param {ReadonlyVec2} a vector to invert
 * @returns {vec2} out
 */

function inverse(out, a) {
  out[0] = 1.0 / a[0];
  out[1] = 1.0 / a[1];
  return out;
}
/**
 * Normalize a vec2
 *
 * @param {vec2} out the receiving vector
 * @param {ReadonlyVec2} a vector to normalize
 * @returns {vec2} out
 */

function normalize(out, a) {
  var x = a[0],
      y = a[1];
  var len = x * x + y * y;

  if (len > 0) {
    //TODO: evaluate use of glm_invsqrt here?
    len = 1 / Math.sqrt(len);
  }

  out[0] = a[0] * len;
  out[1] = a[1] * len;
  return out;
}
/**
 * Calculates the dot product of two vec2's
 *
 * @param {ReadonlyVec2} a the first operand
 * @param {ReadonlyVec2} b the second operand
 * @returns {Number} dot product of a and b
 */

function dot(a, b) {
  return a[0] * b[0] + a[1] * b[1];
}
/**
 * Computes the cross product of two vec2's
 * Note that the cross product must by definition produce a 3D vector
 *
 * @param {vec3} out the receiving vector
 * @param {ReadonlyVec2} a the first operand
 * @param {ReadonlyVec2} b the second operand
 * @returns {vec3} out
 */

function cross(out, a, b) {
  var z = a[0] * b[1] - a[1] * b[0];
  out[0] = out[1] = 0;
  out[2] = z;
  return out;
}
/**
 * Performs a linear interpolation between two vec2's
 *
 * @param {vec2} out the receiving vector
 * @param {ReadonlyVec2} a the first operand
 * @param {ReadonlyVec2} b the second operand
 * @param {Number} t interpolation amount, in the range [0-1], between the two inputs
 * @returns {vec2} out
 */

function lerp$1(out, a, b, t) {
  var ax = a[0],
      ay = a[1];
  out[0] = ax + t * (b[0] - ax);
  out[1] = ay + t * (b[1] - ay);
  return out;
}
/**
 * Generates a random vector with the given scale
 *
 * @param {vec2} out the receiving vector
 * @param {Number} [scale] Length of the resulting vector. If ommitted, a unit vector will be returned
 * @returns {vec2} out
 */

function random(out, scale) {
  scale = scale || 1.0;
  var r = RANDOM() * 2.0 * Math.PI;
  out[0] = Math.cos(r) * scale;
  out[1] = Math.sin(r) * scale;
  return out;
}
/**
 * Transforms the vec2 with a mat2
 *
 * @param {vec2} out the receiving vector
 * @param {ReadonlyVec2} a the vector to transform
 * @param {ReadonlyMat2} m matrix to transform with
 * @returns {vec2} out
 */

function transformMat2(out, a, m) {
  var x = a[0],
      y = a[1];
  out[0] = m[0] * x + m[2] * y;
  out[1] = m[1] * x + m[3] * y;
  return out;
}
/**
 * Transforms the vec2 with a mat2d
 *
 * @param {vec2} out the receiving vector
 * @param {ReadonlyVec2} a the vector to transform
 * @param {ReadonlyMat2d} m matrix to transform with
 * @returns {vec2} out
 */

function transformMat2d(out, a, m) {
  var x = a[0],
      y = a[1];
  out[0] = m[0] * x + m[2] * y + m[4];
  out[1] = m[1] * x + m[3] * y + m[5];
  return out;
}
/**
 * Transforms the vec2 with a mat3
 * 3rd vector component is implicitly '1'
 *
 * @param {vec2} out the receiving vector
 * @param {ReadonlyVec2} a the vector to transform
 * @param {ReadonlyMat3} m matrix to transform with
 * @returns {vec2} out
 */

function transformMat3(out, a, m) {
  var x = a[0],
      y = a[1];
  out[0] = m[0] * x + m[3] * y + m[6];
  out[1] = m[1] * x + m[4] * y + m[7];
  return out;
}
/**
 * Transforms the vec2 with a mat4
 * 3rd vector component is implicitly '0'
 * 4th vector component is implicitly '1'
 *
 * @param {vec2} out the receiving vector
 * @param {ReadonlyVec2} a the vector to transform
 * @param {ReadonlyMat4} m matrix to transform with
 * @returns {vec2} out
 */

function transformMat4(out, a, m) {
  var x = a[0];
  var y = a[1];
  out[0] = m[0] * x + m[4] * y + m[12];
  out[1] = m[1] * x + m[5] * y + m[13];
  return out;
}
/**
 * Rotate a 2D vector
 * @param {vec2} out The receiving vec2
 * @param {ReadonlyVec2} a The vec2 point to rotate
 * @param {ReadonlyVec2} b The origin of the rotation
 * @param {Number} rad The angle of rotation in radians
 * @returns {vec2} out
 */

function rotate(out, a, b, rad) {
  //Translate point to the origin
  var p0 = a[0] - b[0],
      p1 = a[1] - b[1],
      sinC = Math.sin(rad),
      cosC = Math.cos(rad); //perform rotation and translate to correct position

  out[0] = p0 * cosC - p1 * sinC + b[0];
  out[1] = p0 * sinC + p1 * cosC + b[1];
  return out;
}
/**
 * Get the angle between two 2D vectors
 * @param {ReadonlyVec2} a The first operand
 * @param {ReadonlyVec2} b The second operand
 * @returns {Number} The angle in radians
 */

function angle(a, b) {
  var x1 = a[0],
      y1 = a[1],
      x2 = b[0],
      y2 = b[1],
      // mag is the product of the magnitudes of a and b
  mag = Math.sqrt(x1 * x1 + y1 * y1) * Math.sqrt(x2 * x2 + y2 * y2),
      // mag &&.. short circuits if mag == 0
  cosine = mag && (x1 * x2 + y1 * y2) / mag; // Math.min(Math.max(cosine, -1), 1) clamps the cosine between -1 and 1

  return Math.acos(Math.min(Math.max(cosine, -1), 1));
}
/**
 * Set the components of a vec2 to zero
 *
 * @param {vec2} out the receiving vector
 * @returns {vec2} out
 */

function zero(out) {
  out[0] = 0.0;
  out[1] = 0.0;
  return out;
}
/**
 * Returns a string representation of a vector
 *
 * @param {ReadonlyVec2} a vector to represent as a string
 * @returns {String} string representation of the vector
 */

function str(a) {
  return "vec2(" + a[0] + ", " + a[1] + ")";
}
/**
 * Returns whether or not the vectors exactly have the same elements in the same position (when compared with ===)
 *
 * @param {ReadonlyVec2} a The first vector.
 * @param {ReadonlyVec2} b The second vector.
 * @returns {Boolean} True if the vectors are equal, false otherwise.
 */

function exactEquals(a, b) {
  return a[0] === b[0] && a[1] === b[1];
}
/**
 * Returns whether or not the vectors have approximately the same elements in the same position.
 *
 * @param {ReadonlyVec2} a The first vector.
 * @param {ReadonlyVec2} b The second vector.
 * @returns {Boolean} True if the vectors are equal, false otherwise.
 */

function equals(a, b) {
  var a0 = a[0],
      a1 = a[1];
  var b0 = b[0],
      b1 = b[1];
  return Math.abs(a0 - b0) <= EPSILON * Math.max(1.0, Math.abs(a0), Math.abs(b0)) && Math.abs(a1 - b1) <= EPSILON * Math.max(1.0, Math.abs(a1), Math.abs(b1));
}
/**
 * Alias for {@link vec2.length}
 * @function
 */

var len = length;
/**
 * Alias for {@link vec2.subtract}
 * @function
 */

var sub = subtract;
/**
 * Alias for {@link vec2.multiply}
 * @function
 */

var mul = multiply;
/**
 * Alias for {@link vec2.divide}
 * @function
 */

var div = divide;
/**
 * Alias for {@link vec2.distance}
 * @function
 */

var dist = distance;
/**
 * Alias for {@link vec2.squaredDistance}
 * @function
 */

var sqrDist = squaredDistance;
/**
 * Alias for {@link vec2.squaredLength}
 * @function
 */

var sqrLen = squaredLength;
/**
 * Perform some operation over an array of vec2s.
 *
 * @param {Array} a the array of vectors to iterate over
 * @param {Number} stride Number of elements between the start of each vec2. If 0 assumes tightly packed
 * @param {Number} offset Number of elements to skip at the beginning of the array
 * @param {Number} count Number of vec2s to iterate over. If 0 iterates over entire array
 * @param {Function} fn Function to call for each vector in the array
 * @param {Object} [arg] additional argument to pass to fn
 * @returns {Array} a
 * @function
 */

var forEach = function () {
  var vec = create();
  return function (a, stride, offset, count, fn, arg) {
    var i, l;

    if (!stride) {
      stride = 2;
    }

    if (!offset) {
      offset = 0;
    }

    if (count) {
      l = Math.min(count * stride + offset, a.length);
    } else {
      l = a.length;
    }

    for (i = offset; i < l; i += stride) {
      vec[0] = a[i];
      vec[1] = a[i + 1];
      fn(vec, vec, arg);
      a[i] = vec[0];
      a[i + 1] = vec[1];
    }

    return a;
  };
}();

var vec2 = /*#__PURE__*/Object.freeze({
    __proto__: null,
    create: create,
    clone: clone,
    fromValues: fromValues,
    copy: copy,
    set: set,
    add: add,
    subtract: subtract,
    multiply: multiply,
    divide: divide,
    ceil: ceil,
    floor: floor$1,
    min: min,
    max: max,
    round: round,
    scale: scale,
    scaleAndAdd: scaleAndAdd,
    distance: distance,
    squaredDistance: squaredDistance,
    length: length,
    squaredLength: squaredLength,
    negate: negate,
    inverse: inverse,
    normalize: normalize,
    dot: dot,
    cross: cross,
    lerp: lerp$1,
    random: random,
    transformMat2: transformMat2,
    transformMat2d: transformMat2d,
    transformMat3: transformMat3,
    transformMat4: transformMat4,
    rotate: rotate,
    angle: angle,
    zero: zero,
    str: str,
    exactEquals: exactEquals,
    equals: equals,
    len: len,
    sub: sub,
    mul: mul,
    div: div,
    dist: dist,
    sqrDist: sqrDist,
    sqrLen: sqrLen,
    forEach: forEach
});

const STRIDE$3 = 1 + 3 + 4;
const HUMAN_BONES_START = 1000;
const HUMAN_BONES_COUNT = 13;
const BONE_NAME_TO_BONE_ID = [
    "Spine",
    "UpperSpine",
    "Neck",
    "UpperLeg.R",
    "LowerLeg.R",
    "Foot.R",
    "UpperLeg.L",
    "LowerLeg.L",
    "Foot.L",
    "UpperArm.R",
    "LowerArm.R",
    "UpperArm.L",
    "LowerArm.L",
];
const SPINE = boneNameToBoneId("Spine");
const UPPER_SPINE = boneNameToBoneId("UpperSpine");
const NECK = boneNameToBoneId("Neck");
const UPPER_LEG_R = boneNameToBoneId("UpperLeg.R");
const LOWER_LEG_R = boneNameToBoneId("LowerLeg.R");
const FOOT_R = boneNameToBoneId("Foot.R");
const UPPER_LEG_L = boneNameToBoneId("UpperLeg.L");
const LOWER_LEG_L = boneNameToBoneId("LowerLeg.L");
const FOOT_L = boneNameToBoneId("Foot.L");
const UPPER_ARM_R = boneNameToBoneId("UpperArm.R");
const LOWER_ARM_R = boneNameToBoneId("LowerArm.R");
const UPPER_ARM_L = boneNameToBoneId("UpperArm.L");
const LOWER_ARM_L = boneNameToBoneId("LowerArm.L");
function boneIdToBoneName(id) {
    return BONE_NAME_TO_BONE_ID[id - HUMAN_BONES_START];
}
function boneNameToBoneId(name) {
    const index = BONE_NAME_TO_BONE_ID.indexOf(name);
    if (index === -1) {
        throw new Error("Unknown bone");
    }
    return HUMAN_BONES_START + index;
}
const HUMAN_SKELETON = new Map();
HUMAN_SKELETON.set(UPPER_SPINE, SPINE);
HUMAN_SKELETON.set(NECK, UPPER_SPINE);
HUMAN_SKELETON.set(LOWER_LEG_R, UPPER_LEG_R);
HUMAN_SKELETON.set(FOOT_R, LOWER_LEG_R);
HUMAN_SKELETON.set(LOWER_LEG_L, UPPER_LEG_L);
HUMAN_SKELETON.set(FOOT_L, LOWER_LEG_L);
HUMAN_SKELETON.set(UPPER_ARM_R, UPPER_SPINE);
HUMAN_SKELETON.set(LOWER_ARM_R, UPPER_ARM_R);
HUMAN_SKELETON.set(UPPER_ARM_L, UPPER_SPINE);
HUMAN_SKELETON.set(LOWER_ARM_L, UPPER_ARM_L);
function getHumanBoneParent(id) {
    return HUMAN_SKELETON.get(id);
}
class Bone {
    static STRIDE = STRIDE$3;
    id;
    translation;
    rotation;
}

function calculateSkinningMatrices(skin, animation, s, buffer) {
    const worldMatrices = new Array(HUMAN_BONES_COUNT);
    const globalMatrices = new Array(HUMAN_BONES_COUNT);
    for (let boneId = HUMAN_BONES_START; boneId < HUMAN_BONES_START + HUMAN_BONES_COUNT; boneId++) {
        const boneParentIndex = skin.getBoneParentIndex(boneId);
        const boneIndex = skin.getBoneIndex(boneId);
        if (boneIndex === undefined) {
            throw new Error("Unknown bone");
        }
        const bone = skin.bones[boneIndex];
        const invMatrix = skin.inverseMatrices[boneIndex];
        const rotation = animation.getRotation(boneId, s);
        const worldMatrix = create$5();
        fromRotationTranslation$1(worldMatrix, rotation, bone.translation);
        if (boneParentIndex !== undefined) {
            const parentGlobalMatrix = globalMatrices[boneParentIndex];
            mul$5(worldMatrix, parentGlobalMatrix, worldMatrix);
        }
        globalMatrices[boneIndex] = clone$5(worldMatrix);
        mul$5(worldMatrix, worldMatrix, invMatrix);
        worldMatrices[boneIndex] = worldMatrix;
    }
    const result = new Float32Array(buffer, 0, skin.bones.length * 16);
    for (let boneIndex = 0; boneIndex < skin.bones.length; boneIndex++) {
        result.set(worldMatrices[boneIndex], boneIndex * 16);
    }
    return result;
}

const ATTRIBUTES$2 = [
    {
        name: "p",
        size: 3,
    },
    {
        name: "n",
        size: 3,
    },
    {
        name: "uv",
        size: 2,
    },
    {
        name: "w",
        size: 4,
    },
    {
        name: "j",
        size: 4,
    },
];
const STRIDE$2 = ATTRIBUTES$2.reduce((acum, value) => acum + value.size, 0);
class Skin {
    vertices;
    vertexCount;
    indices;
    indexCount;
    bones;
    static ATTRIBUTES = ATTRIBUTES$2;
    static STRIDE = STRIDE$2;
    inverseMatrices;
    boneIdToBoneIndex;
    constructor(vertices, vertexCount, indices, indexCount, bones) {
        this.vertices = vertices;
        this.vertexCount = vertexCount;
        this.indices = indices;
        this.indexCount = indexCount;
        this.bones = bones;
        this.inverseMatrices = new Array(bones.length);
        this.boneIdToBoneIndex = new Map();
        for (let i = 0; i < bones.length; i++) {
            this.boneIdToBoneIndex.set(bones[i].id, i);
        }
        this.buildInverseMatrices();
    }
    getBoneIndex(id) {
        return this.boneIdToBoneIndex.get(id);
    }
    getBone(id) {
        const index = this.getBoneIndex(id);
        if (index === undefined) {
            return null;
        }
        return this.bones[index];
    }
    getBoneParent(id) {
        const parentId = getHumanBoneParent(id);
        if (parentId === undefined) {
            return null;
        }
        const parentIndex = this.getBoneIndex(parentId);
        if (parentIndex === undefined) {
            throw new Error("Unknown bone");
        }
        return this.bones[parentIndex];
    }
    getBoneParentIndex(id) {
        const parentId = getHumanBoneParent(id);
        if (parentId === undefined) {
            return undefined;
        }
        return this.getBoneIndex(parentId);
    }
    buildInverseMatrices() {
        for (let boneId = HUMAN_BONES_START; boneId < HUMAN_BONES_START + HUMAN_BONES_COUNT; boneId++) {
            const boneIndex = this.getBoneIndex(boneId);
            if (boneIndex === undefined) {
                throw new Error("Unknown bone");
            }
            const parentBoneId = getHumanBoneParent(boneId);
            const parentBoneIndex = parentBoneId !== undefined ? this.boneIdToBoneIndex.get(parentBoneId) : undefined;
            const bone = this.bones[boneIndex];
            const invMatrix = create$5();
            fromRotationTranslation$1(invMatrix, bone.rotation, bone.translation);
            if (parentBoneIndex !== undefined) {
                const parentMatrix = clone$5(this.inverseMatrices[parentBoneIndex]);
                invert$2(parentMatrix, parentMatrix);
                mul$5(invMatrix, parentMatrix, invMatrix);
            }
            invert$2(invMatrix, invMatrix);
            this.inverseMatrices[boneIndex] = invMatrix;
        }
    }
}

const ATTRIBUTES$1 = [
    {
        name: "p",
        size: 3,
    },
    {
        name: "n",
        size: 3,
    },
    {
        name: "uv",
        size: 2,
    },
];
const STRIDE$1 = ATTRIBUTES$1.reduce((acum, value) => acum + value.size, 0);
class Model {
    vertices;
    vertexCount;
    indices;
    indexCount;
    static ATTRIBUTES = ATTRIBUTES$1;
    static STRIDE = STRIDE$1;
    constructor(vertices, vertexCount, indices, indexCount) {
        this.vertices = vertices;
        this.vertexCount = vertexCount;
        this.indices = indices;
        this.indexCount = indexCount;
    }
}

class Component {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    static ID = undefined;
    owner;
    constructor() {
        //
    }
}

function cloneTransform(transform) {
    return {
        pos: clone$4(transform.pos),
        size: clone$4(transform.size),
        rotation: clone$2(transform.rotation),
    };
}
class TransformComponent extends Component {
    transform;
    static ID = "transform";
    constructor(transform) {
        super();
        this.transform = transform;
    }
}

class ModelComponent extends Component {
    modelDef;
    static ID = "model";
    constructor(modelDef) {
        super();
        this.modelDef = modelDef;
    }
}

let Services;
function setServices(value) {
    if (Services != null) {
        throw new Error("Services are set twice.");
    }
    Services = value;
}

class TextureComponent extends Component {
    static ID = "texture";
    texture;
    constructor(texName) {
        super();
        this.loadTexture(texName);
    }
    async loadTexture(texName) {
        this.texture = await Services.resources.requireTexture(texName);
    }
}

const DEFAULT_MODEL_OPTIONS = {
    texMul: 1,
    alpha: false,
};
function getModelOptions(options) {
    return Object.assign({ ...DEFAULT_MODEL_OPTIONS }, options || {});
}
class ModelDef {
}

const ATTRIBUTES = [
    {
        name: "p",
        size: 3,
    },
    {
        name: "c",
        size: 3,
    },
];
const STRIDE = ATTRIBUTES.reduce((acum, value) => acum + value.size, 0);
class DebugLine {
    static ATTRIBUTES = ATTRIBUTES;
    static STRIDE = STRIDE;
    static MAX_DEBUG_LINES = 1000;
}

/* eslint-disable @typescript-eslint/no-non-null-assertion */
const ANIMATION_TEXTURE_SIZE = 1024;
const UP = fromValues$4(0, 0, 1);
function colorToRGBA(color) {
    return [((color >> 16) & 0xff) / 0xff, ((color >> 8) & 0xff) / 0xff, (color & 0xff) / 0xff];
}
class Render {
    canvasWebGL;
    canvas2D;
    gl;
    anisotropic;
    ctx;
    generalShader;
    objectsShader;
    coloredShader;
    skinningShader;
    matrices;
    matricesBuffer;
    viewMatrix;
    projectionMatrix;
    models;
    skins;
    debugLinesData;
    debugLinesDataIndex;
    debugLineBuffer;
    persistentDebugRects = [];
    texts = [];
    constructor(canvasWebGL, canvas2D) {
        this.canvasWebGL = canvasWebGL;
        this.canvas2D = canvas2D;
        this.models = new Set();
        this.skins = new Set();
        this.gl = this.canvasWebGL.getContext("webgl", {
            antialias: true,
            powerPreference: "high-performance",
        });
        this.matrices = this.gl.createTexture();
        this.matricesBuffer = new Float32Array(ANIMATION_TEXTURE_SIZE * 1 * 4);
        const { gl, matrices } = this;
        gl.getExtension("OES_texture_float");
        gl.bindTexture(gl.TEXTURE_2D, matrices);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, ANIMATION_TEXTURE_SIZE, 1, 0, gl.RGBA, gl.FLOAT, null);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        this.projectionMatrix = create$5();
        this.viewMatrix = create$5();
        this.generalShader = compileShader(gl, generalVert, generalFrag, ["p", "n", "mvp"]);
        this.objectsShader = compileShader(gl, objectsVert, objectsFrag, [
            "p",
            "n",
            "uv",
            "mvp",
            "texture",
            "model",
            "texMul",
            "useTexture",
            "color",
        ]);
        this.coloredShader = compileShader(gl, coloredVert, coloredFrag, [
            "p",
            "c",
            "mvp",
            "texture",
        ]);
        this.skinningShader = compileShader(gl, skinningVert, skinningFrag, [
            "p",
            "n",
            "uv",
            "w",
            "j",
            "mvp",
            "matrices",
            "texture",
        ]);
        gl.clearColor(0.3, 0.4, 1.0, 1.0);
        gl.enable(gl.CULL_FACE);
        gl.enable(gl.DEPTH_TEST);
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        this.anisotropic = gl.getExtension("EXT_texture_filter_anisotropic");
        this.debugLinesData = new Float32Array(DebugLine.MAX_DEBUG_LINES * DebugLine.STRIDE);
        this.debugLineBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.debugLineBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, this.debugLinesData.byteLength, gl.DYNAMIC_DRAW);
        this.debugLinesDataIndex = 0;
        this.ctx = this.canvas2D.getContext("2d");
    }
    handleResize() {
        const { canvasWebGL, canvas2D, gl } = this;
        const dpr = devicePixelRatio;
        const newWidth = Math.floor(document.body.clientWidth * dpr);
        const newHeight = Math.floor(document.body.clientHeight * dpr);
        if (canvasWebGL.width === newWidth && canvasWebGL.height === newHeight) {
            return;
        }
        canvas2D.style.width = newWidth / dpr + "px";
        canvas2D.style.height = newHeight / dpr + "px";
        canvas2D.width = newWidth;
        canvas2D.height = newHeight;
        canvasWebGL.style.width = newWidth / dpr + "px";
        canvasWebGL.style.height = newHeight / dpr + "px";
        canvasWebGL.width = newWidth;
        canvasWebGL.height = newHeight;
        this.ctx.resetTransform();
        this.ctx.scale(dpr, dpr);
        gl.viewport(0, 0, canvasWebGL.width, canvasWebGL.height);
        perspective(this.projectionMatrix, (45 * Math.PI) / 180, canvasWebGL.width / canvasWebGL.height, 0.1, 100);
    }
    defineVertexBuffer(gl, shader, attributes, stride) {
        let offset = 0;
        for (const attr of attributes) {
            const attrNum = shader[attr.name];
            if (attrNum !== undefined) {
                gl.vertexAttribPointer(attrNum, attr.size, gl.FLOAT, false, stride * Float32Array.BYTES_PER_ELEMENT, offset * Float32Array.BYTES_PER_ELEMENT);
                gl.enableVertexAttribArray(attrNum);
            }
            offset += attr.size;
        }
    }
    setCamera(pos, lookAt$1) {
        lookAt(this.viewMatrix, pos, lookAt$1, UP);
    }
    drawModel(model, tex, options, transform) {
        const { gl, objectsShader } = this;
        gl.bindBuffer(gl.ARRAY_BUFFER, model.vertices);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, model.indices);
        this.defineVertexBuffer(gl, objectsShader, Model.ATTRIBUTES, Model.STRIDE);
        gl.useProgram(objectsShader.program);
        const modelMatrix = create$5();
        fromRotationTranslationScale(modelMatrix, transform.rotation, transform.pos, transform.size);
        const mvp = create$5();
        multiply$5(mvp, mvp, this.projectionMatrix);
        multiply$5(mvp, mvp, this.viewMatrix);
        multiply$5(mvp, mvp, modelMatrix);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.uniformMatrix4fv(objectsShader.mvp, false, mvp);
        gl.uniformMatrix4fv(objectsShader.model, false, modelMatrix);
        gl.uniform1i(objectsShader.texture, 0);
        gl.uniform1f(objectsShader.texMul, options.texMul);
        if (options.colorOverride) {
            gl.uniform1f(objectsShader.useTexture, 0);
            gl.uniform4fv(objectsShader.color, options.colorOverride);
        }
        else {
            gl.uniform1f(objectsShader.useTexture, 1);
        }
        gl.drawElements(gl.TRIANGLES, model.indexCount, gl.UNSIGNED_SHORT, 0);
    }
    drawSkin(skin, tex, animation, s, position) {
        const { gl, skinningShader } = this;
        gl.bindBuffer(gl.ARRAY_BUFFER, skin.vertices);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, skin.indices);
        this.defineVertexBuffer(gl, skinningShader, Skin.ATTRIBUTES, Skin.STRIDE);
        gl.useProgram(skinningShader.program);
        const mvp = create$5();
        multiply$5(mvp, mvp, this.projectionMatrix);
        multiply$5(mvp, mvp, this.viewMatrix);
        translate$1(mvp, mvp, position);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, this.matrices);
        const matricesData = calculateSkinningMatrices(skin, animation, s, this.matricesBuffer.buffer);
        gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, matricesData.length / 4, 1, gl.RGBA, gl.FLOAT, matricesData);
        gl.uniformMatrix4fv(skinningShader.mvp, false, mvp);
        gl.uniform1i(skinningShader.texture, 0);
        gl.uniform1i(skinningShader.matrices, 1);
        gl.drawElements(gl.TRIANGLES, skin.indexCount, gl.UNSIGNED_SHORT, 0);
    }
    add(entity) {
        const transform = entity.get(TransformComponent);
        const model = entity.get(ModelComponent);
        const texture = entity.get(TextureComponent);
        if (transform && model && texture) {
            this.models.add(entity);
        }
    }
    addDebugRect(start, end, vertical, horizontal, depth) {
        this.persistentDebugRects.push({
            start,
            end,
            vertical,
            horizontal,
            depth,
        });
    }
    addText(text, pos) {
        this.texts.push({
            text,
            pos,
        });
    }
    drawDebugRect(start, end, v, h, d) {
        const points = [
            start,
            fromValues$4(start[0], start[1], end[2]),
            fromValues$4(start[0], end[1], start[2]),
            fromValues$4(end[0], start[1], start[2]),
            end,
            fromValues$4(end[0], end[1], start[2]),
            fromValues$4(end[0], start[1], end[2]),
            fromValues$4(start[0], end[1], end[2]), // 7
        ];
        this.drawDebugLine(points[0], points[1], v, v);
        this.drawDebugLine(points[0], points[2], d, d);
        this.drawDebugLine(points[0], points[3], h, h);
        this.drawDebugLine(points[2], points[7], v, v);
        this.drawDebugLine(points[3], points[6], v, v);
        this.drawDebugLine(points[1], points[6], h, h);
        this.drawDebugLine(points[2], points[5], h, h);
        this.drawDebugLine(points[1], points[7], d, d);
        this.drawDebugLine(points[3], points[5], d, d);
        this.drawDebugLine(points[4], points[5], v, v);
        this.drawDebugLine(points[4], points[6], d, d);
        this.drawDebugLine(points[4], points[7], h, h);
    }
    drawDebugLine(start, end, color1, color2) {
        if (this.debugLinesDataIndex + 2 > DebugLine.MAX_DEBUG_LINES) {
            throw new Error("Too many debug lines.");
        }
        const [r1, g1, b1] = colorToRGBA(color1);
        const [r2, g2, b2] = colorToRGBA(color2);
        const i = this.debugLinesDataIndex * DebugLine.STRIDE;
        this.debugLinesData[i + 0] = start[0];
        this.debugLinesData[i + 1] = start[1];
        this.debugLinesData[i + 2] = start[2];
        this.debugLinesData[i + 3] = r1;
        this.debugLinesData[i + 4] = g1;
        this.debugLinesData[i + 5] = b1;
        this.debugLinesData[i + 6] = end[0];
        this.debugLinesData[i + 7] = end[1];
        this.debugLinesData[i + 8] = end[2];
        this.debugLinesData[i + 9] = r2;
        this.debugLinesData[i + 10] = g2;
        this.debugLinesData[i + 11] = b2;
        this.debugLinesDataIndex += 2;
    }
    draw() {
        const { ctx, gl } = this;
        this.handleResize();
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        const mvp = create$5();
        multiply$5(mvp, mvp, this.projectionMatrix);
        multiply$5(mvp, mvp, this.viewMatrix);
        const pos = create$3();
        const transparentModels = [];
        for (const entity of this.models) {
            const transform = entity.get(TransformComponent);
            const model = entity.get(ModelComponent);
            const texture = entity.get(TextureComponent);
            model.modelDef.update(transform.transform);
            const modelEntities = model.modelDef.getEntries();
            // first draw all opaque objects
            for (const modelEntry of modelEntities) {
                if (modelEntry.options?.alpha !== true) {
                    this.drawModel(modelEntry.model, texture.texture, getModelOptions(modelEntry.options), modelEntry.transform);
                }
                else {
                    transparentModels.push({ entity, modelEntry });
                }
            }
        }
        // then sort all transparent objects by depth
        for (const entry of transparentModels) {
            const p = entry.modelEntry.transform.pos;
            transformMat4$1(pos, fromValues$3(p[0], p[1], p[2], 1), mvp);
            const z = pos[2] / pos[3];
            entry.modelEntry.tempZ = z;
        }
        transparentModels.sort((a, b) => b.modelEntry.tempZ - a.modelEntry.tempZ);
        // then draw all transparent objects from far to near
        for (const entry of transparentModels) {
            const { entity, modelEntry } = entry;
            const texture = entity.get(TextureComponent);
            this.drawModel(modelEntry.model, texture.texture, getModelOptions(modelEntry.options), modelEntry.transform);
        }
        for (const debugRect of this.persistentDebugRects) {
            this.drawDebugRect(debugRect.start, debugRect.end, debugRect.vertical, debugRect.horizontal, debugRect.depth);
        }
        if (this.debugLinesDataIndex > 0) {
            // gl.disable(gl.DEPTH_TEST)
            const { coloredShader } = this;
            gl.bindBuffer(gl.ARRAY_BUFFER, this.debugLineBuffer);
            this.defineVertexBuffer(gl, coloredShader, DebugLine.ATTRIBUTES, DebugLine.STRIDE);
            gl.useProgram(coloredShader.program);
            const mvp = create$5();
            multiply$5(mvp, mvp, this.projectionMatrix);
            multiply$5(mvp, mvp, this.viewMatrix);
            gl.uniformMatrix4fv(coloredShader.mvp, false, mvp);
            const filledDebugLinesData = new Float32Array(this.debugLinesData.buffer, 0, this.debugLinesDataIndex * DebugLine.STRIDE);
            gl.bufferSubData(gl.ARRAY_BUFFER, 0, filledDebugLinesData);
            gl.drawArrays(gl.LINES, 0, this.debugLinesDataIndex);
            this.debugLinesDataIndex = 0;
            // gl.enable(gl.DEPTH_TEST)
        }
        ctx.clearRect(0, 0, this.canvas2D.width, this.canvas2D.height);
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.strokeStyle = "white";
        ctx.lineWidth = 3;
        ctx.font = "25px Roboto";
        ctx.globalAlpha = 0.5;
        for (const text of this.texts) {
            const p = text.pos;
            transformMat4$1(pos, fromValues$3(p[0], p[1], p[2], 1), mvp);
            let x = pos[0] / pos[3];
            let y = pos[1] / pos[3];
            y = (-y + 1) / 2;
            x = (x + 1) / 2;
            ctx.strokeText(text.text, x * this.canvas2D.clientWidth, y * this.canvas2D.clientHeight);
            ctx.fillText(text.text, x * this.canvas2D.clientWidth, y * this.canvas2D.clientHeight);
        }
    }
}

class CollisionComponent extends Component {
    collisionPrimitive;
    static ID = "collision";
    constructor(collisionPrimitive) {
        super();
        this.collisionPrimitive = collisionPrimitive;
    }
}

class PhysicsComponent extends Component {
    physicsDef;
    static ID = "physics";
    body;
    constructor(physicsDef) {
        super();
        this.physicsDef = physicsDef;
    }
}

var CollisionGroups;
(function (CollisionGroups) {
    CollisionGroups[CollisionGroups["STATIC"] = 2] = "STATIC";
    CollisionGroups[CollisionGroups["PLAYER"] = 4] = "PLAYER";
})(CollisionGroups || (CollisionGroups = {}));
const DEFAULT_PHYSICS_OPTIONS = {
    isStatic: false,
    noRotation: false,
    mass: 1,
    friction: 0.5,
    bakedTransform: false,
    collisionGroup: CollisionGroups.STATIC,
};
function getPhysicsOptions(options) {
    return Object.assign({ ...DEFAULT_PHYSICS_OPTIONS }, options || {});
}
class PhysicsDef {
    options;
    constructor(options) {
        this.options = options;
        //
    }
}

class Physics {
    ammo;
    dynamicsWorld;
    entities = new Set();
    tempTransform = new Ammo.btTransform();
    constructor(ammo) {
        this.ammo = ammo;
        // ammo init (wow)
        const collisionConfiguration = new Ammo.btDefaultCollisionConfiguration();
        const dispatcher = new Ammo.btCollisionDispatcher(collisionConfiguration);
        const overlappingPairCache = new Ammo.btDbvtBroadphase();
        const solver = new Ammo.btSequentialImpulseConstraintSolver();
        this.dynamicsWorld = new Ammo.btDiscreteDynamicsWorld(dispatcher, overlappingPairCache, solver, collisionConfiguration);
        this.dynamicsWorld.setGravity(new Ammo.btVector3(0, 0, -9.8));
    }
    add(entity) {
        const physics = entity.get(PhysicsComponent);
        const collision = entity.get(CollisionComponent);
        const transfrom = entity.get(TransformComponent);
        if (physics && collision && transfrom) {
            const shape = collision.collisionPrimitive.getAmmoShape(transfrom.transform);
            const options = getPhysicsOptions(physics.physicsDef.options);
            const { isStatic, noRotation } = options;
            const localInertia = new Ammo.btVector3(0, 0, 0);
            const mass = isStatic ? 0 : options.mass;
            if (!isStatic && !noRotation) {
                shape.calculateLocalInertia(mass, localInertia);
            }
            let bodyTransform = new Ammo.btTransform();
            bodyTransform.setIdentity();
            if (!options.bakedTransform) {
                bodyTransform.setOrigin(new Ammo.btVector3(transfrom.transform.pos[0], transfrom.transform.pos[1], transfrom.transform.pos[2]));
                bodyTransform.setRotation(new Ammo.btQuaternion(transfrom.transform.rotation[0], transfrom.transform.rotation[1], transfrom.transform.rotation[2], transfrom.transform.rotation[3]));
            }
            const additionalTransform = collision.collisionPrimitive.getTransfrom();
            if (additionalTransform) {
                bodyTransform = bodyTransform.op_mul(additionalTransform);
            }
            const myMotionState = new Ammo.btDefaultMotionState(bodyTransform);
            const rbInfo = new Ammo.btRigidBodyConstructionInfo(mass, myMotionState, shape, localInertia);
            const body = new Ammo.btRigidBody(rbInfo);
            body.setFriction(options.friction);
            this.dynamicsWorld.addRigidBody(body, options.collisionGroup, 0xff);
            this.entities.add(entity);
            physics.body = body;
        }
    }
    raycast(p0, p1) {
        const from = new Ammo.btVector3(p0[0], p0[1], p0[2]);
        const to = new Ammo.btVector3(p1[0], p1[1], p1[2]);
        const callback = new Ammo.ClosestRayResultCallback(from, to);
        callback.set_m_collisionFilterGroup(CollisionGroups.STATIC);
        this.dynamicsWorld.rayTest(from, to, callback);
        const dist = distance$2(p0, p1);
        const ammoNormal = callback.get_m_hitNormalWorld();
        const normal = fromValues$4(ammoNormal.x(), ammoNormal.y(), ammoNormal.z());
        return {
            distance: dist * callback.get_m_closestHitFraction(),
            normal,
            hit: callback.hasHit(),
        };
    }
    syncBodies() {
        for (const entity of this.entities) {
            const physics = entity.get(PhysicsComponent);
            const transfrom = entity.get(TransformComponent);
            if (physics && transfrom && physics.body) {
                const body = physics.body;
                const options = getPhysicsOptions(physics.physicsDef.options);
                if (options.isStatic) {
                    continue;
                }
                body.getMotionState().getWorldTransform(this.tempTransform);
                const origin = this.tempTransform.getOrigin();
                transfrom.transform.pos[0] = origin.x();
                transfrom.transform.pos[1] = origin.y();
                transfrom.transform.pos[2] = origin.z();
                const rotation = this.tempTransform.getRotation();
                transfrom.transform.rotation[0] = rotation.x();
                transfrom.transform.rotation[1] = rotation.y();
                transfrom.transform.rotation[2] = rotation.z();
                transfrom.transform.rotation[3] = rotation.w();
            }
        }
    }
    tick(dt) {
        this.dynamicsWorld.stepSimulation(dt, 1);
        this.syncBodies();
    }
}

class Animation {
    timings;
    values;
    constructor(timings, values) {
        this.timings = timings;
        this.values = values;
    }
    findTimingNextIndex(s) {
        let index = 1;
        while (this.timings[index] <= s && index < this.timings.length) {
            index++;
        }
        console.assert(index < this.timings.length);
        return index;
    }
    getRotation(boneId, s) {
        const first = this.timings[0];
        const last = this.timings[this.timings.length - 1];
        const duration = last - first;
        s = first + ((s - first) % duration);
        const rotation = create$2();
        const rotations = this.values.get(boneId);
        if (rotations !== undefined) {
            const nextIndex = this.findTimingNextIndex(s);
            const prevIndex = nextIndex - 1;
            const s0 = this.timings[prevIndex];
            const s1 = this.timings[nextIndex];
            const t = (s - s0) / (s1 - s0);
            const r0 = rotations[prevIndex];
            const r1 = rotations[nextIndex];
            slerp(rotation, r0, r1, t);
        }
        return rotation;
    }
}

/* eslint-disable @typescript-eslint/no-non-null-assertion */
function loadSkin(gl, data) {
    const header = new Uint32Array(data, 0, 3);
    const [vertexCount, indexCount, boneCount] = header;
    const indices = new Uint16Array(data, 3 * 4, indexCount);
    const floatPosition = Math.ceil((3 * 4 + indexCount * 2) / 4) * 4;
    const vertices = new Float32Array(data, floatPosition, Skin.STRIDE * vertexCount);
    const boneData = new Float32Array(data, floatPosition + Skin.STRIDE * vertexCount * 4, boneCount * Bone.STRIDE);
    const bones = [];
    for (let i = 0; i < boneCount; i++) {
        const bone = new Bone();
        bone.id = Math.trunc(boneData[i * Bone.STRIDE + 0]);
        bone.translation = fromValues$4(boneData[i * Bone.STRIDE + 1], boneData[i * Bone.STRIDE + 2], boneData[i * Bone.STRIDE + 3]);
        bone.rotation = fromValues$2(boneData[i * Bone.STRIDE + 4], boneData[i * Bone.STRIDE + 5], boneData[i * Bone.STRIDE + 6], boneData[i * Bone.STRIDE + 7]);
        bones.push(bone);
    }
    const vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
    const skin = new Skin(vertexBuffer, vertexCount, indexBuffer, indexCount, bones);
    return skin;
}
async function loadSkinFromURL(gl, url) {
    const data = await (await fetch(url)).arrayBuffer();
    return loadSkin(gl, data);
}
function loadAnimation(data) {
    const floats = new Float32Array(data);
    const keyframeCount = Math.trunc(floats[0]);
    const bonesCount = Math.trunc(floats[1]);
    const timings = [];
    for (let i = 0; i < keyframeCount; i++) {
        timings.push(floats[2 + i]);
    }
    const map = new Map();
    const valuesPos = 2 + keyframeCount;
    const VALUES_STRIDE = 1 + 4 * keyframeCount;
    for (let i = 0; i < bonesCount; i++) {
        const pos = valuesPos + i * VALUES_STRIDE;
        const boneId = Math.trunc(floats[pos + 0]);
        const rotations = [];
        for (let j = 0; j < keyframeCount; j++) {
            const rotation = fromValues$2(floats[pos + 1 + j * 4 + 0], floats[pos + 1 + j * 4 + 1], floats[pos + 1 + j * 4 + 2], floats[pos + 1 + j * 4 + 3]);
            rotations.push(rotation);
        }
        map.set(boneId, rotations);
    }
    const animation = new Animation(timings, map);
    return animation;
}
async function loadAnimationFromURL(url) {
    const data = await (await fetch(url)).arrayBuffer();
    return loadAnimation(data);
}
async function loadTexture(gl, anisotropic, url) {
    return new Promise(resolve => {
        const image = new Image();
        image.onload = () => {
            const texture = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
            const isPowerOf2 = Math.ceil(Math.log2(image.width)) == Math.floor(Math.log2(image.width)) &&
                Math.ceil(Math.log2(image.height)) == Math.floor(Math.log2(image.height));
            if (isPowerOf2) {
                gl.generateMipmap(gl.TEXTURE_2D);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
            }
            else {
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            }
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
            if (anisotropic) {
                const max = gl.getParameter(anisotropic.MAX_TEXTURE_MAX_ANISOTROPY_EXT);
                gl.texParameterf(gl.TEXTURE_2D, anisotropic.TEXTURE_MAX_ANISOTROPY_EXT, max);
            }
            resolve(texture);
        };
        image.src = url;
    });
}
function loadModel(gl, data) {
    const header = new Uint32Array(data, 0, 2);
    const [vertexCount, indexCount] = header;
    const indices = new Uint16Array(data, 2 * 4, indexCount);
    const floatPosition = Math.ceil((2 * 4 + indexCount * 2) / 4) * 4;
    const vertices = new Float32Array(data, floatPosition, Model.STRIDE * vertexCount);
    const vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
    const model = new Model(vertexBuffer, vertexCount, indexBuffer, indexCount);
    return model;
}
async function loadModelFromURL(gl, url) {
    const data = await (await fetch(url)).arrayBuffer();
    return loadModel(gl, data);
}

var ResourceType;
(function (ResourceType) {
    ResourceType[ResourceType["Texture"] = 0] = "Texture";
    ResourceType[ResourceType["Model"] = 1] = "Model";
    ResourceType[ResourceType["Skin"] = 2] = "Skin";
    ResourceType[ResourceType["Animation"] = 3] = "Animation";
})(ResourceType || (ResourceType = {}));
// TODO implement cache
class ResourceManager {
    pendingList = new Map();
    getUrl(name, ext) {
        return `build/${name}.${ext}`;
    }
    async require(url, requestMaker) {
        let promise = this.pendingList.get(url);
        if (promise === undefined) {
            promise = requestMaker();
            this.pendingList.set(url, promise);
        }
        return promise;
    }
    async requireTexture(name) {
        let ext = "png";
        const extIndex = name.lastIndexOf(".");
        if (extIndex !== -1) {
            ext = name.slice(extIndex + 1);
            name = name.slice(0, extIndex);
        }
        const url = this.getUrl(name, ext);
        return this.require(url, () => loadTexture(Services.render.gl, Services.render.anisotropic, url));
    }
    async requireModel(name) {
        const url = this.getUrl(name, "mdl");
        return this.require(url, () => loadModelFromURL(Services.render.gl, url));
    }
    async requireSkin(name) {
        const url = this.getUrl(name, "skn");
        return this.require(url, () => loadSkinFromURL(Services.render.gl, url));
    }
    async requireAnimation(name) {
        const url = this.getUrl(name, "anm");
        return this.require(url, () => loadAnimationFromURL(url));
    }
    async waitForLoading() {
        return Promise.all(this.pendingList.values());
    }
}

class World {
    add(entity) {
        Services.render.add(entity);
        Services.physics.add(entity);
    }
}

class GameLoop {
    prevTime;
    tickBind = this.tick.bind(this);
    start() {
        requestAnimationFrame(this.tickBind);
    }
    tick(time) {
        // const dt = this.prevTime != undefined ? time - this.prevTime : 0
        const dt = 1000 / 60;
        Services.inputManager.tick(dt);
        Services.physics.tick(dt);
        Services.inputManager.postPhysics();
        Services.render.draw();
        this.prevTime = time;
        requestAnimationFrame(this.tickBind);
    }
}

class Entity {
    components = [];
    registerComponent(component) {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        const id = component.constructor.ID;
        if (this.components[id] != null) {
            throw new Error("Component is already registered.");
        }
        this.components[id] = component;
    }
    get(c) {
        const id = c.ID;
        return this.components[id] || null;
    }
}

class SimpleObject extends Entity {
    constructor(transform, modelDef, textureName, physicsDef, collisionPrimitive) {
        super();
        this.registerComponent(new TransformComponent(transform));
        this.registerComponent(new ModelComponent(modelDef));
        this.registerComponent(new TextureComponent(textureName));
        if (physicsDef && collisionPrimitive) {
            this.registerComponent(new PhysicsComponent(physicsDef));
            this.registerComponent(new CollisionComponent(collisionPrimitive));
        }
    }
}

class CollisionPrimitive {
    ammoShape;
    getAmmoShape(transform) {
        if (this.ammoShape === undefined) {
            this.ammoShape = this.update(transform);
        }
        return this.ammoShape;
    }
    getTransfrom() {
        return undefined;
    }
}
class Capsule extends CollisionPrimitive {
    update(transform) {
        const { size } = transform;
        return new Ammo.btCapsuleShapeZ(0.5 * size[0], size[2] - size[0]);
    }
}
class Box extends CollisionPrimitive {
    update(transform) {
        const { size } = transform;
        const ammoSize = new Ammo.btVector3(size[0] * 0.5, size[1] * 0.5, size[2] * 0.5);
        return new Ammo.btBoxShape(ammoSize);
    }
}
class Sphere extends CollisionPrimitive {
    update(transform) {
        const { size } = transform;
        return new Ammo.btSphereShape(0.5 * size[0]);
    }
}
class Plane extends CollisionPrimitive {
    update(transform) {
        const { pos, size, rotation } = transform;
        const p0 = fromValues$4(-0.5 * size[0], -0.5 * size[1], 0);
        const p1 = fromValues$4(+0.5 * size[0], -0.5 * size[1], 0);
        const p2 = fromValues$4(-0.5 * size[0], +0.5 * size[1], 0);
        const p3 = fromValues$4(+0.5 * size[0], +0.5 * size[1], 0);
        transformQuat$1(p0, p0, rotation);
        transformQuat$1(p1, p1, rotation);
        transformQuat$1(p2, p2, rotation);
        transformQuat$1(p3, p3, rotation);
        add$4(p0, p0, pos);
        add$4(p1, p1, pos);
        add$4(p2, p2, pos);
        add$4(p3, p3, pos);
        const p0a = new Ammo.btVector3(p0[0], p0[1], p0[2]);
        const p1a = new Ammo.btVector3(p1[0], p1[1], p1[2]);
        const p2a = new Ammo.btVector3(p2[0], p2[1], p2[2]);
        const p3a = new Ammo.btVector3(p3[0], p3[1], p3[2]);
        const trimesh = new Ammo.btTriangleMesh();
        trimesh.addTriangle(p0a, p1a, p2a, true);
        trimesh.addTriangle(p1a, p2a, p3a, true);
        return new Ammo.btBvhTriangleMeshShape(trimesh, true);
    }
}

class CapsuleModelDef extends ModelDef {
    halfSphere;
    cylinder;
    entries;
    constructor() {
        super();
        this.loadModels();
    }
    async loadModels() {
        const [halfSphere, cylinder] = await Promise.all([
            Services.resources.requireModel("half_sphere"),
            Services.resources.requireModel("cylinder"),
        ]);
        this.entries = [
            { model: halfSphere, transform: undefined },
            { model: cylinder, transform: undefined },
            { model: halfSphere, transform: undefined },
        ];
    }
    update(transform) {
        const height = transform.size[2];
        this.entries[0].transform = cloneTransform(transform);
        this.entries[0].transform.size[2] = 1;
        this.entries[0].transform.pos[2] += (height - 1) / 2;
        this.entries[1].transform = cloneTransform(transform);
        this.entries[1].transform.size[2] -= 1;
        this.entries[2].transform = cloneTransform(transform);
        this.entries[2].transform.size[2] = 1;
        const q = create$2();
        fromEuler(q, 180, 0, 0);
        mul$2(this.entries[2].transform.rotation, this.entries[2].transform.rotation, q);
        this.entries[2].transform.pos[2] -= (height - 1) / 2;
    }
    getEntries() {
        if (this.entries === undefined) {
            throw new Error("Models are not loaded.");
        }
        return this.entries;
    }
}

class SimpleModelDef {
    options;
    model;
    transform;
    constructor(modelName, options) {
        this.options = options;
        this.loadModel(modelName);
    }
    async loadModel(modelName) {
        this.model = await Services.resources.requireModel(modelName);
    }
    update(transform) {
        this.transform = transform;
    }
    getEntries() {
        if (this.model === undefined || this.transform === undefined) {
            throw new Error("Model is not loaded.");
        }
        return [{ model: this.model, transform: this.transform, options: this.options }];
    }
}

var Biomes;
(function (Biomes) {
    Biomes["THE_VOID"] = "the_void";
    Biomes["PLAINS"] = "plains";
    Biomes["SUNFLOWER_PLAINS"] = "sunflower_plains";
    Biomes["SNOWY_PLAINS"] = "snowy_plains";
    Biomes["ICE_SPIKES"] = "ice_spikes";
    Biomes["DESERT"] = "desert";
    Biomes["SWAMP"] = "swamp";
    Biomes["FOREST"] = "forest";
    Biomes["FLOWER_FOREST"] = "flower_forest";
    Biomes["BIRCH_FOREST"] = "birch_forest";
    Biomes["DARK_FOREST"] = "dark_forest";
    Biomes["OLD_GROWTH_BIRCH_FOREST"] = "old_growth_birch_forest";
    Biomes["OLD_GROWTH_PINE_TAIGA"] = "old_growth_pine_taiga";
    Biomes["OLD_GROWTH_SPRUCE_TAIGA"] = "old_growth_spruce_taiga";
    Biomes["TAIGA"] = "taiga";
    Biomes["SNOWY_TAIGA"] = "snowy_taiga";
    Biomes["SAVANNA"] = "savanna";
    Biomes["SAVANNA_PLATEAU"] = "savanna_plateau";
    Biomes["WINDSWEPT_HILLS"] = "windswept_hills";
    Biomes["WINDSWEPT_GRAVELLY_HILLS"] = "windswept_gravelly_hills";
    Biomes["WINDSWEPT_FOREST"] = "windswept_forest";
    Biomes["WINDSWEPT_SAVANNA"] = "windswept_savanna";
    Biomes["JUNGLE"] = "jungle";
    Biomes["SPARSE_JUNGLE"] = "sparse_jungle";
    Biomes["BAMBOO_JUNGLE"] = "bamboo_jungle";
    Biomes["BADLANDS"] = "badlands";
    Biomes["ERODED_BADLANDS"] = "eroded_badlands";
    Biomes["WOODED_BADLANDS"] = "wooded_badlands";
    Biomes["MEADOW"] = "meadow";
    Biomes["GROVE"] = "grove";
    Biomes["SNOWY_SLOPES"] = "snowy_slopes";
    Biomes["FROZEN_PEAKS"] = "frozen_peaks";
    Biomes["JAGGED_PEAKS"] = "jagged_peaks";
    Biomes["STONY_PEAKS"] = "stony_peaks";
    Biomes["RIVER"] = "river";
    Biomes["FROZEN_RIVER"] = "frozen_river";
    Biomes["BEACH"] = "beach";
    Biomes["SNOWY_BEACH"] = "snowy_beach";
    Biomes["STONY_SHORE"] = "stony_shore";
    Biomes["WARM_OCEAN"] = "warm_ocean";
    Biomes["LUKEWARM_OCEAN"] = "lukewarm_ocean";
    Biomes["DEEP_LUKEWARM_OCEAN"] = "deep_lukewarm_ocean";
    Biomes["OCEAN"] = "ocean";
    Biomes["DEEP_OCEAN"] = "deep_ocean";
    Biomes["COLD_OCEAN"] = "cold_ocean";
    Biomes["DEEP_COLD_OCEAN"] = "deep_cold_ocean";
    Biomes["FROZEN_OCEAN"] = "frozen_ocean";
    Biomes["DEEP_FROZEN_OCEAN"] = "deep_frozen_ocean";
    Biomes["MUSHROOM_FIELDS"] = "mushroom_fields";
    Biomes["DRIPSTONE_CAVES"] = "dripstone_caves";
    Biomes["LUSH_CAVES"] = "lush_caves";
    Biomes["NETHER_WASTES"] = "nether_wastes";
    Biomes["WARPED_FOREST"] = "warped_forest";
    Biomes["CRIMSON_FOREST"] = "crimson_forest";
    Biomes["SOUL_SAND_VALLEY"] = "soul_sand_valley";
    Biomes["BASALT_DELTAS"] = "basalt_deltas";
    Biomes["THE_END"] = "the_end";
    Biomes["END_HIGHLANDS"] = "end_highlands";
    Biomes["END_MIDLANDS"] = "end_midlands";
    Biomes["SMALL_END_ISLANDS"] = "small_end_islands";
    Biomes["END_BARRENS"] = "end_barrens";
})(Biomes || (Biomes = {}));

class Parameter {
    min;
    max;
    constructor(min, max) {
        this.min = min;
        this.max = max;
    }
    static span(min, max) {
        if (typeof min === "number") {
            if (typeof max !== "number") {
                throw new Error("");
            }
            return new Parameter(quantizeCoord(min), quantizeCoord(max));
        }
        else {
            if (typeof max === "number") {
                throw new Error("");
            }
            return new Parameter(min.min, max.max);
        }
    }
    static point(value) {
        return Parameter.span(value, value);
    }
    distance(value) {
        const v0 = value - this.max;
        const v1 = this.min - value;
        return v0 > 0 ? v0 : Math.max(v1, 0);
    }
    get center() {
        return (this.min + this.max) * 0.5;
    }
    get length() {
        return this.max - this.min;
    }
}
class TargetPoint {
    temperature;
    humidity;
    continentalness;
    erosion;
    depth;
    weirdness;
    constructor(temperature, humidity, continentalness, erosion, depth, weirdness) {
        this.temperature = temperature;
        this.humidity = humidity;
        this.continentalness = continentalness;
        this.erosion = erosion;
        this.depth = depth;
        this.weirdness = weirdness;
    }
}
class ParameterPoint {
    temperature;
    humidity;
    continentalness;
    erosion;
    depth;
    weirdness;
    offset;
    constructor(temperature, humidity, continentalness, erosion, depth, weirdness, offset) {
        this.temperature = temperature;
        this.humidity = humidity;
        this.continentalness = continentalness;
        this.erosion = erosion;
        this.depth = depth;
        this.weirdness = weirdness;
        this.offset = offset;
    }
    fitness(targetPoint) {
        const temperatureDistance = this.temperature.distance(targetPoint.temperature);
        const humidityDistance = this.humidity.distance(targetPoint.humidity);
        const continentalnessDistance = this.continentalness.distance(targetPoint.continentalness);
        const erosionDistance = this.erosion.distance(targetPoint.erosion);
        const depthDistance = this.depth.distance(targetPoint.depth);
        const weirdnessDistance = this.weirdness.distance(targetPoint.weirdness);
        const offsetDistance = 0 - this.offset;
        return (temperatureDistance * temperatureDistance +
            humidityDistance * humidityDistance +
            continentalnessDistance * continentalnessDistance +
            erosionDistance * erosionDistance +
            depthDistance * depthDistance +
            weirdnessDistance * weirdnessDistance +
            offsetDistance * offsetDistance);
    }
}
const QUANTIZATION_FACTOR = 10000;
function quantizeCoord(coord) {
    return Math.trunc(coord * QUANTIZATION_FACTOR);
}
function unquantizeCoord(coord) {
    return coord / QUANTIZATION_FACTOR;
}
function parameters(temperature, humidity, continentalness, erosion, depth, weirdness, offset) {
    if (typeof temperature === "number") {
        if (typeof temperature !== "number" ||
            typeof humidity !== "number" ||
            typeof continentalness !== "number" ||
            typeof erosion !== "number" ||
            typeof depth !== "number" ||
            typeof weirdness !== "number") {
            throw new Error("");
        }
        return new ParameterPoint(Parameter.point(temperature), Parameter.point(humidity), Parameter.point(continentalness), Parameter.point(erosion), Parameter.point(depth), Parameter.point(weirdness), quantizeCoord(offset));
    }
    else {
        if (typeof temperature === "number" ||
            typeof humidity === "number" ||
            typeof continentalness === "number" ||
            typeof erosion === "number" ||
            typeof depth === "number" ||
            typeof weirdness === "number") {
            throw new Error("");
        }
        return new ParameterPoint(temperature, humidity, continentalness, erosion, depth, weirdness, quantizeCoord(offset));
    }
}
function findValueBruteForce(targetPoint, values) {
    let minDistance = Infinity;
    let result;
    for (const pair of values) {
        const distance = pair.first.fitness(targetPoint);
        if (distance < minDistance) {
            minDistance = distance;
            result = pair.second;
        }
    }
    if (result === undefined) {
        throw new Error("Result not found.");
    }
    return result;
}
function target(temperature, humidity, continentalness, erosion, depth, weirdness) {
    return new TargetPoint(quantizeCoord(temperature), quantizeCoord(humidity), quantizeCoord(continentalness), quantizeCoord(erosion), quantizeCoord(depth), quantizeCoord(weirdness));
}

class Pair {
    first;
    second;
    constructor(first, second) {
        this.first = first;
        this.second = second;
    }
    static of(first, second) {
        return new Pair(first, second);
    }
}

const VALLEY_SIZE = 0.05;
const LOW_START = 0.26666668;
const HIGH_START = 0.4;
const HIGH_END = 0.93333334;
const PEAK_SIZE = 0.1;
const PEAK_START = 0.56666666;
const PEAK_END = 0.7666667;
const NEAR_INLAND_START = -0.11;
const MID_INLAND_START = 0.03;
const FAR_INLAND_START = 0.3;
const EROSION_INDEX_1_START = -0.78;
const EROSION_INDEX_2_START = -0.375;
const FULL_RANGE = Parameter.span(-1, 1);
const temperatures = [
    Parameter.span(-1.0, -0.45),
    Parameter.span(-0.45, -0.15),
    Parameter.span(-0.15, 0.2),
    Parameter.span(0.2, 0.55),
    Parameter.span(0.55, 1.0),
];
const humidities = [
    Parameter.span(-1.0, -0.35),
    Parameter.span(-0.35, -PEAK_SIZE),
    Parameter.span(-PEAK_SIZE, PEAK_SIZE),
    Parameter.span(PEAK_SIZE, FAR_INLAND_START),
    Parameter.span(FAR_INLAND_START, 1.0),
];
const erosions = [
    Parameter.span(-1.0, EROSION_INDEX_1_START),
    Parameter.span(EROSION_INDEX_1_START, EROSION_INDEX_2_START),
    Parameter.span(EROSION_INDEX_2_START, -0.2225),
    Parameter.span(-0.2225, VALLEY_SIZE),
    Parameter.span(VALLEY_SIZE, 0.45),
    Parameter.span(0.45, 0.55),
    Parameter.span(0.55, 1.0),
];
const FROZEN_RANGE = temperatures[0];
const UNFROZEN_RANGE = Parameter.span(temperatures[1], temperatures[4]);
const mushroomFieldsContinentalness = Parameter.span(-1.2, -1.05);
const deepOceanContinentalness = Parameter.span(-1.05, -0.455);
const oceanContinentalness = Parameter.span(-0.455, -0.19);
const coastContinentalness = Parameter.span(-0.19, NEAR_INLAND_START);
const inlandContinentalness = Parameter.span(NEAR_INLAND_START, 0.55);
const nearInlandContinentalness = Parameter.span(NEAR_INLAND_START, MID_INLAND_START);
const midInlandContinentalness = Parameter.span(MID_INLAND_START, FAR_INLAND_START);
const farInlandContinentalness = Parameter.span(FAR_INLAND_START, 1.0);
const OCEANS = [
    [
        Biomes.DEEP_FROZEN_OCEAN,
        Biomes.DEEP_COLD_OCEAN,
        Biomes.DEEP_OCEAN,
        Biomes.DEEP_LUKEWARM_OCEAN,
        Biomes.WARM_OCEAN,
    ],
    [
        Biomes.FROZEN_OCEAN,
        Biomes.COLD_OCEAN,
        Biomes.OCEAN,
        Biomes.LUKEWARM_OCEAN,
        Biomes.WARM_OCEAN,
    ],
];
const MIDDLE_BIOMES = [
    [
        Biomes.SNOWY_PLAINS,
        Biomes.SNOWY_PLAINS,
        Biomes.SNOWY_PLAINS,
        Biomes.SNOWY_TAIGA,
        Biomes.TAIGA,
    ],
    [Biomes.PLAINS, Biomes.PLAINS, Biomes.FOREST, Biomes.TAIGA, Biomes.OLD_GROWTH_SPRUCE_TAIGA],
    [Biomes.FLOWER_FOREST, Biomes.PLAINS, Biomes.FOREST, Biomes.BIRCH_FOREST, Biomes.DARK_FOREST],
    [Biomes.SAVANNA, Biomes.SAVANNA, Biomes.FOREST, Biomes.JUNGLE, Biomes.JUNGLE],
    [Biomes.DESERT, Biomes.DESERT, Biomes.DESERT, Biomes.DESERT, Biomes.DESERT],
];
const MIDDLE_BIOMES_VARIANT = [
    [Biomes.ICE_SPIKES, null, Biomes.SNOWY_TAIGA, null, null],
    [null, null, null, null, Biomes.OLD_GROWTH_PINE_TAIGA],
    [Biomes.SUNFLOWER_PLAINS, null, null, Biomes.OLD_GROWTH_BIRCH_FOREST, null],
    [null, null, Biomes.PLAINS, Biomes.SPARSE_JUNGLE, Biomes.BAMBOO_JUNGLE],
    [null, null, null, null, null],
];
const PLATEAU_BIOMES = [
    [
        Biomes.SNOWY_PLAINS,
        Biomes.SNOWY_PLAINS,
        Biomes.SNOWY_PLAINS,
        Biomes.SNOWY_TAIGA,
        Biomes.SNOWY_TAIGA,
    ],
    [Biomes.MEADOW, Biomes.MEADOW, Biomes.FOREST, Biomes.TAIGA, Biomes.OLD_GROWTH_SPRUCE_TAIGA],
    [Biomes.MEADOW, Biomes.MEADOW, Biomes.MEADOW, Biomes.MEADOW, Biomes.DARK_FOREST],
    [Biomes.SAVANNA_PLATEAU, Biomes.SAVANNA_PLATEAU, Biomes.FOREST, Biomes.FOREST, Biomes.JUNGLE],
    [
        Biomes.BADLANDS,
        Biomes.BADLANDS,
        Biomes.BADLANDS,
        Biomes.WOODED_BADLANDS,
        Biomes.WOODED_BADLANDS,
    ],
];
const PLATEAU_BIOMES_VARIANT = [
    [Biomes.ICE_SPIKES, null, null, null, null],
    [null, null, Biomes.MEADOW, Biomes.MEADOW, Biomes.OLD_GROWTH_PINE_TAIGA],
    [null, null, Biomes.FOREST, Biomes.BIRCH_FOREST, null],
    [null, null, null, null, null],
    [Biomes.ERODED_BADLANDS, Biomes.ERODED_BADLANDS, null, null, null],
];
const EXTREME_HILLS = [
    [
        Biomes.WINDSWEPT_GRAVELLY_HILLS,
        Biomes.WINDSWEPT_GRAVELLY_HILLS,
        Biomes.WINDSWEPT_HILLS,
        Biomes.WINDSWEPT_FOREST,
        Biomes.WINDSWEPT_FOREST,
    ],
    [
        Biomes.WINDSWEPT_GRAVELLY_HILLS,
        Biomes.WINDSWEPT_GRAVELLY_HILLS,
        Biomes.WINDSWEPT_HILLS,
        Biomes.WINDSWEPT_FOREST,
        Biomes.WINDSWEPT_FOREST,
    ],
    [
        Biomes.WINDSWEPT_HILLS,
        Biomes.WINDSWEPT_HILLS,
        Biomes.WINDSWEPT_HILLS,
        Biomes.WINDSWEPT_FOREST,
        Biomes.WINDSWEPT_FOREST,
    ],
    [null, null, null, null, null],
    [null, null, null, null, null],
];
class OverworldBiomeBuilder {
    // high order methods
    addBiomes(biomes) {
        this.addOffCoastBiomes(biomes);
        this.addInlandBiomes(biomes);
        this.addUndergroundBiomes(biomes);
    }
    addOffCoastBiomes(biomes) {
        this.addSurfaceBiome(biomes, FULL_RANGE, FULL_RANGE, mushroomFieldsContinentalness, FULL_RANGE, FULL_RANGE, 0.0, Biomes.MUSHROOM_FIELDS);
        for (let i = 0; i < temperatures.length; ++i) {
            const temperature = temperatures[i];
            this.addSurfaceBiome(biomes, temperature, FULL_RANGE, deepOceanContinentalness, FULL_RANGE, FULL_RANGE, 0.0, OCEANS[0][i]);
            this.addSurfaceBiome(biomes, temperature, FULL_RANGE, oceanContinentalness, FULL_RANGE, FULL_RANGE, 0.0, OCEANS[1][i]);
        }
    }
    addInlandBiomes(biomes) {
        this.addMidSlice(biomes, Parameter.span(-1.0, -HIGH_END));
        this.addHighSlice(biomes, Parameter.span(-HIGH_END, -PEAK_END));
        this.addPeaks(biomes, Parameter.span(-PEAK_END, -PEAK_START));
        this.addHighSlice(biomes, Parameter.span(-PEAK_START, -HIGH_START));
        this.addMidSlice(biomes, Parameter.span(-HIGH_START, -LOW_START));
        this.addLowSlice(biomes, Parameter.span(-LOW_START, -VALLEY_SIZE));
        this.addValleys(biomes, Parameter.span(-VALLEY_SIZE, VALLEY_SIZE));
        this.addLowSlice(biomes, Parameter.span(VALLEY_SIZE, LOW_START));
        this.addMidSlice(biomes, Parameter.span(LOW_START, HIGH_START));
        this.addHighSlice(biomes, Parameter.span(HIGH_START, PEAK_START));
        this.addPeaks(biomes, Parameter.span(PEAK_START, PEAK_END));
        this.addHighSlice(biomes, Parameter.span(PEAK_END, HIGH_END));
        this.addMidSlice(biomes, Parameter.span(HIGH_END, 1.0));
    }
    // specific type biomes
    addPeaks(biomes, weirdness) {
        for (let temperatureIndex = 0; temperatureIndex < temperatures.length; ++temperatureIndex) {
            const temperature = temperatures[temperatureIndex];
            for (let humidityIndex = 0; humidityIndex < humidities.length; ++humidityIndex) {
                const humidity = humidities[humidityIndex];
                const middleBiome = this.pickMiddleBiome(temperatureIndex, humidityIndex, weirdness);
                const middleOrBadlands = this.pickMiddleBiomeOrBadlandsIfHot(temperatureIndex, humidityIndex, weirdness);
                const middleOrBadlandsOrSlope = this.pickMiddleBiomeOrBadlandsIfHotOrSlopeIfCold(temperatureIndex, humidityIndex, weirdness);
                const plateauBiome = this.pickPlateauBiome(temperatureIndex, humidityIndex, weirdness);
                const extremeHillsBiome = this.pickExtremeHillsBiome(temperatureIndex, humidityIndex, weirdness);
                const maybeShattered = this.maybePickShatteredBiome(temperatureIndex, humidityIndex, weirdness, extremeHillsBiome);
                const peakyBiome = this.pickPeakBiome(temperatureIndex, humidityIndex, weirdness);
                this.addSurfaceBiome(biomes, temperature, humidity, Parameter.span(coastContinentalness, farInlandContinentalness), erosions[0], weirdness, 0.0, peakyBiome);
                this.addSurfaceBiome(biomes, temperature, humidity, Parameter.span(coastContinentalness, nearInlandContinentalness), erosions[1], weirdness, 0.0, middleOrBadlandsOrSlope);
                this.addSurfaceBiome(biomes, temperature, humidity, Parameter.span(midInlandContinentalness, farInlandContinentalness), erosions[1], weirdness, 0.0, peakyBiome);
                this.addSurfaceBiome(biomes, temperature, humidity, Parameter.span(coastContinentalness, nearInlandContinentalness), Parameter.span(erosions[2], erosions[3]), weirdness, 0.0, middleBiome);
                this.addSurfaceBiome(biomes, temperature, humidity, Parameter.span(midInlandContinentalness, farInlandContinentalness), erosions[2], weirdness, 0.0, plateauBiome);
                this.addSurfaceBiome(biomes, temperature, humidity, midInlandContinentalness, erosions[3], weirdness, 0.0, middleOrBadlands);
                this.addSurfaceBiome(biomes, temperature, humidity, farInlandContinentalness, erosions[3], weirdness, 0.0, plateauBiome);
                this.addSurfaceBiome(biomes, temperature, humidity, Parameter.span(coastContinentalness, farInlandContinentalness), erosions[4], weirdness, 0.0, middleBiome);
                this.addSurfaceBiome(biomes, temperature, humidity, Parameter.span(coastContinentalness, nearInlandContinentalness), erosions[5], weirdness, 0.0, maybeShattered);
                this.addSurfaceBiome(biomes, temperature, humidity, Parameter.span(midInlandContinentalness, farInlandContinentalness), erosions[5], weirdness, 0.0, extremeHillsBiome);
                this.addSurfaceBiome(biomes, temperature, humidity, Parameter.span(coastContinentalness, farInlandContinentalness), erosions[6], weirdness, 0.0, middleBiome);
            }
        }
    }
    addHighSlice(biomes, weirdness) {
        for (let temperatureIndex = 0; temperatureIndex < temperatures.length; ++temperatureIndex) {
            const temperature = temperatures[temperatureIndex];
            for (let humidityIndex = 0; humidityIndex < humidities.length; ++humidityIndex) {
                const humidity = humidities[humidityIndex];
                const middleBiome = this.pickMiddleBiome(temperatureIndex, humidityIndex, weirdness);
                const middleOrBadlands = this.pickMiddleBiomeOrBadlandsIfHot(temperatureIndex, humidityIndex, weirdness);
                const middleOrBadlandsOrSlope = this.pickMiddleBiomeOrBadlandsIfHotOrSlopeIfCold(temperatureIndex, humidityIndex, weirdness);
                const plateauBiome = this.pickPlateauBiome(temperatureIndex, humidityIndex, weirdness);
                const extremeHillsBiome = this.pickExtremeHillsBiome(temperatureIndex, humidityIndex, weirdness);
                const maybeShattered = this.maybePickShatteredBiome(temperatureIndex, humidityIndex, weirdness, middleBiome);
                const slopeBiome = this.pickSlopeBiome(temperatureIndex, humidityIndex, weirdness);
                const peakyBiome = this.pickPeakBiome(temperatureIndex, humidityIndex, weirdness);
                this.addSurfaceBiome(biomes, temperature, humidity, coastContinentalness, Parameter.span(erosions[0], erosions[1]), weirdness, 0.0, middleBiome);
                this.addSurfaceBiome(biomes, temperature, humidity, nearInlandContinentalness, erosions[0], weirdness, 0.0, slopeBiome);
                this.addSurfaceBiome(biomes, temperature, humidity, Parameter.span(midInlandContinentalness, farInlandContinentalness), erosions[0], weirdness, 0.0, peakyBiome);
                this.addSurfaceBiome(biomes, temperature, humidity, nearInlandContinentalness, erosions[1], weirdness, 0.0, middleOrBadlandsOrSlope);
                this.addSurfaceBiome(biomes, temperature, humidity, Parameter.span(midInlandContinentalness, farInlandContinentalness), erosions[1], weirdness, 0.0, slopeBiome);
                this.addSurfaceBiome(biomes, temperature, humidity, Parameter.span(coastContinentalness, nearInlandContinentalness), Parameter.span(erosions[2], erosions[3]), weirdness, 0.0, middleBiome);
                this.addSurfaceBiome(biomes, temperature, humidity, Parameter.span(midInlandContinentalness, farInlandContinentalness), erosions[2], weirdness, 0.0, plateauBiome);
                this.addSurfaceBiome(biomes, temperature, humidity, midInlandContinentalness, erosions[3], weirdness, 0.0, middleOrBadlands);
                this.addSurfaceBiome(biomes, temperature, humidity, farInlandContinentalness, erosions[3], weirdness, 0.0, plateauBiome);
                this.addSurfaceBiome(biomes, temperature, humidity, Parameter.span(coastContinentalness, farInlandContinentalness), erosions[4], weirdness, 0.0, middleBiome);
                this.addSurfaceBiome(biomes, temperature, humidity, Parameter.span(coastContinentalness, nearInlandContinentalness), erosions[5], weirdness, 0.0, maybeShattered);
                this.addSurfaceBiome(biomes, temperature, humidity, Parameter.span(midInlandContinentalness, farInlandContinentalness), erosions[5], weirdness, 0.0, extremeHillsBiome);
                this.addSurfaceBiome(biomes, temperature, humidity, Parameter.span(coastContinentalness, farInlandContinentalness), erosions[6], weirdness, 0.0, middleBiome);
            }
        }
    }
    addMidSlice(biomes, weirdness) {
        this.addSurfaceBiome(biomes, FULL_RANGE, FULL_RANGE, coastContinentalness, Parameter.span(erosions[0], erosions[2]), weirdness, 0.0, Biomes.STONY_SHORE);
        this.addSurfaceBiome(biomes, UNFROZEN_RANGE, FULL_RANGE, Parameter.span(nearInlandContinentalness, farInlandContinentalness), erosions[6], weirdness, 0.0, Biomes.SWAMP);
        for (let temperatureIndex = 0; temperatureIndex < temperatures.length; ++temperatureIndex) {
            const temperature = temperatures[temperatureIndex];
            for (let humidityIndex = 0; humidityIndex < humidities.length; ++humidityIndex) {
                const humidity = humidities[humidityIndex];
                const middleBiome = this.pickMiddleBiome(temperatureIndex, humidityIndex, weirdness);
                const middleOrBadlands = this.pickMiddleBiomeOrBadlandsIfHot(temperatureIndex, humidityIndex, weirdness);
                const middleOrBadlandsOrSlope = this.pickMiddleBiomeOrBadlandsIfHotOrSlopeIfCold(temperatureIndex, humidityIndex, weirdness);
                const extremeHillsBiome = this.pickExtremeHillsBiome(temperatureIndex, humidityIndex, weirdness);
                const plateauBiome = this.pickPlateauBiome(temperatureIndex, humidityIndex, weirdness);
                const beachBiome = this.pickBeachBiome(temperatureIndex);
                const maybeShattered = this.maybePickShatteredBiome(temperatureIndex, humidityIndex, weirdness, middleBiome);
                const shatteredCoastBiome = this.pickShatteredCoastBiome(temperatureIndex, humidityIndex, weirdness);
                const slopeBiome = this.pickSlopeBiome(temperatureIndex, humidityIndex, weirdness);
                this.addSurfaceBiome(biomes, temperature, humidity, Parameter.span(nearInlandContinentalness, farInlandContinentalness), erosions[0], weirdness, 0.0, slopeBiome);
                this.addSurfaceBiome(biomes, temperature, humidity, Parameter.span(nearInlandContinentalness, midInlandContinentalness), erosions[1], weirdness, 0.0, middleOrBadlandsOrSlope);
                this.addSurfaceBiome(biomes, temperature, humidity, farInlandContinentalness, erosions[1], weirdness, 0.0, temperatureIndex == 0 ? slopeBiome : plateauBiome);
                this.addSurfaceBiome(biomes, temperature, humidity, nearInlandContinentalness, erosions[2], weirdness, 0.0, middleBiome);
                this.addSurfaceBiome(biomes, temperature, humidity, midInlandContinentalness, erosions[2], weirdness, 0.0, middleOrBadlands);
                this.addSurfaceBiome(biomes, temperature, humidity, farInlandContinentalness, erosions[2], weirdness, 0.0, plateauBiome);
                this.addSurfaceBiome(biomes, temperature, humidity, Parameter.span(coastContinentalness, nearInlandContinentalness), erosions[3], weirdness, 0.0, middleBiome);
                this.addSurfaceBiome(biomes, temperature, humidity, Parameter.span(midInlandContinentalness, farInlandContinentalness), erosions[3], weirdness, 0.0, middleOrBadlands);
                if (weirdness.max < 0) {
                    this.addSurfaceBiome(biomes, temperature, humidity, coastContinentalness, erosions[4], weirdness, 0.0, beachBiome);
                    this.addSurfaceBiome(biomes, temperature, humidity, Parameter.span(nearInlandContinentalness, farInlandContinentalness), erosions[4], weirdness, 0.0, middleBiome);
                }
                else {
                    this.addSurfaceBiome(biomes, temperature, humidity, Parameter.span(coastContinentalness, farInlandContinentalness), erosions[4], weirdness, 0.0, middleBiome);
                }
                this.addSurfaceBiome(biomes, temperature, humidity, coastContinentalness, erosions[5], weirdness, 0.0, shatteredCoastBiome);
                this.addSurfaceBiome(biomes, temperature, humidity, nearInlandContinentalness, erosions[5], weirdness, 0.0, maybeShattered);
                this.addSurfaceBiome(biomes, temperature, humidity, Parameter.span(midInlandContinentalness, farInlandContinentalness), erosions[5], weirdness, 0.0, extremeHillsBiome);
                if (weirdness.max < 0) {
                    this.addSurfaceBiome(biomes, temperature, humidity, coastContinentalness, erosions[6], weirdness, 0.0, beachBiome);
                }
                else {
                    this.addSurfaceBiome(biomes, temperature, humidity, coastContinentalness, erosions[6], weirdness, 0.0, middleBiome);
                }
                if (temperatureIndex == 0) {
                    this.addSurfaceBiome(biomes, temperature, humidity, Parameter.span(nearInlandContinentalness, farInlandContinentalness), erosions[6], weirdness, 0.0, middleBiome);
                }
            }
        }
    }
    addLowSlice(biomes, weirdness) {
        this.addSurfaceBiome(biomes, FULL_RANGE, FULL_RANGE, coastContinentalness, Parameter.span(erosions[0], erosions[2]), weirdness, 0.0, Biomes.STONY_SHORE);
        this.addSurfaceBiome(biomes, UNFROZEN_RANGE, FULL_RANGE, Parameter.span(nearInlandContinentalness, farInlandContinentalness), erosions[6], weirdness, 0.0, Biomes.SWAMP);
        for (let temperatureIndex = 0; temperatureIndex < temperatures.length; ++temperatureIndex) {
            const temperature = temperatures[temperatureIndex];
            for (let humidityIndex = 0; humidityIndex < humidities.length; ++humidityIndex) {
                const humidity = humidities[humidityIndex];
                const resourcekey = this.pickMiddleBiome(temperatureIndex, humidityIndex, weirdness);
                const resourcekey1 = this.pickMiddleBiomeOrBadlandsIfHot(temperatureIndex, humidityIndex, weirdness);
                const resourcekey2 = this.pickMiddleBiomeOrBadlandsIfHotOrSlopeIfCold(temperatureIndex, humidityIndex, weirdness);
                const resourcekey3 = this.pickBeachBiome(temperatureIndex);
                const resourcekey4 = this.maybePickShatteredBiome(temperatureIndex, humidityIndex, weirdness, resourcekey);
                const resourcekey5 = this.pickShatteredCoastBiome(temperatureIndex, humidityIndex, weirdness);
                this.addSurfaceBiome(biomes, temperature, humidity, nearInlandContinentalness, Parameter.span(erosions[0], erosions[1]), weirdness, 0.0, resourcekey1);
                this.addSurfaceBiome(biomes, temperature, humidity, Parameter.span(midInlandContinentalness, farInlandContinentalness), Parameter.span(erosions[0], erosions[1]), weirdness, 0.0, resourcekey2);
                this.addSurfaceBiome(biomes, temperature, humidity, nearInlandContinentalness, Parameter.span(erosions[2], erosions[3]), weirdness, 0.0, resourcekey);
                this.addSurfaceBiome(biomes, temperature, humidity, Parameter.span(midInlandContinentalness, farInlandContinentalness), Parameter.span(erosions[2], erosions[3]), weirdness, 0.0, resourcekey1);
                this.addSurfaceBiome(biomes, temperature, humidity, coastContinentalness, Parameter.span(erosions[3], erosions[4]), weirdness, 0.0, resourcekey3);
                this.addSurfaceBiome(biomes, temperature, humidity, Parameter.span(nearInlandContinentalness, farInlandContinentalness), erosions[4], weirdness, 0.0, resourcekey);
                this.addSurfaceBiome(biomes, temperature, humidity, coastContinentalness, erosions[5], weirdness, 0.0, resourcekey5);
                this.addSurfaceBiome(biomes, temperature, humidity, nearInlandContinentalness, erosions[5], weirdness, 0.0, resourcekey4);
                this.addSurfaceBiome(biomes, temperature, humidity, Parameter.span(midInlandContinentalness, farInlandContinentalness), erosions[5], weirdness, 0.0, resourcekey);
                this.addSurfaceBiome(biomes, temperature, humidity, coastContinentalness, erosions[6], weirdness, 0.0, resourcekey3);
                if (temperatureIndex == 0) {
                    this.addSurfaceBiome(biomes, temperature, humidity, Parameter.span(nearInlandContinentalness, farInlandContinentalness), erosions[6], weirdness, 0.0, resourcekey);
                }
            }
        }
    }
    addValleys(biomes, wierdness) {
        this.addSurfaceBiome(biomes, FROZEN_RANGE, FULL_RANGE, coastContinentalness, Parameter.span(erosions[0], erosions[1]), wierdness, 0.0, wierdness.max < 0 ? Biomes.STONY_SHORE : Biomes.FROZEN_RIVER);
        this.addSurfaceBiome(biomes, UNFROZEN_RANGE, FULL_RANGE, coastContinentalness, Parameter.span(erosions[0], erosions[1]), wierdness, 0.0, wierdness.max < 0 ? Biomes.STONY_SHORE : Biomes.RIVER);
        this.addSurfaceBiome(biomes, FROZEN_RANGE, FULL_RANGE, nearInlandContinentalness, Parameter.span(erosions[0], erosions[1]), wierdness, 0.0, Biomes.FROZEN_RIVER);
        this.addSurfaceBiome(biomes, UNFROZEN_RANGE, FULL_RANGE, nearInlandContinentalness, Parameter.span(erosions[0], erosions[1]), wierdness, 0.0, Biomes.RIVER);
        this.addSurfaceBiome(biomes, FROZEN_RANGE, FULL_RANGE, Parameter.span(coastContinentalness, farInlandContinentalness), Parameter.span(erosions[2], erosions[5]), wierdness, 0.0, Biomes.FROZEN_RIVER);
        this.addSurfaceBiome(biomes, UNFROZEN_RANGE, FULL_RANGE, Parameter.span(coastContinentalness, farInlandContinentalness), Parameter.span(erosions[2], erosions[5]), wierdness, 0.0, Biomes.RIVER);
        this.addSurfaceBiome(biomes, FROZEN_RANGE, FULL_RANGE, coastContinentalness, erosions[6], wierdness, 0.0, Biomes.FROZEN_RIVER);
        this.addSurfaceBiome(biomes, UNFROZEN_RANGE, FULL_RANGE, coastContinentalness, erosions[6], wierdness, 0.0, Biomes.RIVER);
        this.addSurfaceBiome(biomes, UNFROZEN_RANGE, FULL_RANGE, Parameter.span(inlandContinentalness, farInlandContinentalness), erosions[6], wierdness, 0.0, Biomes.SWAMP);
        this.addSurfaceBiome(biomes, FROZEN_RANGE, FULL_RANGE, Parameter.span(inlandContinentalness, farInlandContinentalness), erosions[6], wierdness, 0.0, Biomes.FROZEN_RIVER);
        for (let temperatureIndex = 0; temperatureIndex < temperatures.length; ++temperatureIndex) {
            const temperature = temperatures[temperatureIndex];
            for (let humidityIndex = 0; humidityIndex < humidities.length; ++humidityIndex) {
                const humidity = humidities[humidityIndex];
                const resourcekey = this.pickMiddleBiomeOrBadlandsIfHot(temperatureIndex, humidityIndex, wierdness);
                this.addSurfaceBiome(biomes, temperature, humidity, Parameter.span(midInlandContinentalness, farInlandContinentalness), Parameter.span(erosions[0], erosions[1]), wierdness, 0.0, resourcekey);
            }
        }
    }
    addUndergroundBiomes(biomes) {
        this.addUndergroundBiome(biomes, FULL_RANGE, FULL_RANGE, Parameter.span(0.8, 1.0), FULL_RANGE, FULL_RANGE, 0.0, Biomes.DRIPSTONE_CAVES);
        this.addUndergroundBiome(biomes, FULL_RANGE, Parameter.span(0.7, 1.0), FULL_RANGE, FULL_RANGE, FULL_RANGE, 0.0, Biomes.LUSH_CAVES);
    }
    // biome pickers
    pickMiddleBiome(temperatureIndex, humidityIndex, weirdness) {
        if (weirdness.max < 0) {
            return MIDDLE_BIOMES[temperatureIndex][humidityIndex];
        }
        else {
            const resourcekey = MIDDLE_BIOMES_VARIANT[temperatureIndex][humidityIndex];
            return resourcekey == null
                ? MIDDLE_BIOMES[temperatureIndex][humidityIndex]
                : resourcekey;
        }
    }
    pickMiddleBiomeOrBadlandsIfHot(temperatureIndex, humidityIndex, weirdness) {
        return temperatureIndex == 4
            ? this.pickBadlandsBiome(humidityIndex, weirdness)
            : this.pickMiddleBiome(temperatureIndex, humidityIndex, weirdness);
    }
    pickMiddleBiomeOrBadlandsIfHotOrSlopeIfCold(temperatureIndex, humidityIndex, weirdness) {
        return temperatureIndex == 0
            ? this.pickSlopeBiome(temperatureIndex, humidityIndex, weirdness)
            : this.pickMiddleBiomeOrBadlandsIfHot(temperatureIndex, humidityIndex, weirdness);
    }
    maybePickShatteredBiome(temperatureIndex, humidityIndex, weirdness, defaultBiome) {
        return temperatureIndex > 1 && humidityIndex < 4 && weirdness.max >= 0
            ? Biomes.WINDSWEPT_SAVANNA
            : defaultBiome;
    }
    pickShatteredCoastBiome(temperatureIndex, humidityIndex, weirdness) {
        const biome = weirdness.max >= 0
            ? this.pickMiddleBiome(temperatureIndex, humidityIndex, weirdness)
            : this.pickBeachBiome(temperatureIndex);
        return this.maybePickShatteredBiome(temperatureIndex, humidityIndex, weirdness, biome);
    }
    pickBeachBiome(temperatureIndex) {
        if (temperatureIndex == 0) {
            return Biomes.SNOWY_BEACH;
        }
        else {
            return temperatureIndex == 4 ? Biomes.DESERT : Biomes.BEACH;
        }
    }
    pickBadlandsBiome(humidityIndex, weirdness) {
        if (humidityIndex < 2) {
            return weirdness.max < 0 ? Biomes.ERODED_BADLANDS : Biomes.BADLANDS;
        }
        else {
            return humidityIndex < 3 ? Biomes.BADLANDS : Biomes.WOODED_BADLANDS;
        }
    }
    pickPlateauBiome(temperatureIndex, humidityIndex, weirdness) {
        if (weirdness.max < 0) {
            return PLATEAU_BIOMES[temperatureIndex][humidityIndex];
        }
        else {
            const biome = PLATEAU_BIOMES_VARIANT[temperatureIndex][humidityIndex];
            return biome == null ? PLATEAU_BIOMES[temperatureIndex][humidityIndex] : biome;
        }
    }
    pickPeakBiome(temperatureIndex, humidityIndex, weirdness) {
        if (temperatureIndex <= 2) {
            return weirdness.max < 0 ? Biomes.JAGGED_PEAKS : Biomes.FROZEN_PEAKS;
        }
        else {
            return temperatureIndex == 3
                ? Biomes.STONY_PEAKS
                : this.pickBadlandsBiome(humidityIndex, weirdness);
        }
    }
    pickSlopeBiome(temperatureIndex, humidityIndex, weirdness) {
        if (temperatureIndex >= 3) {
            return this.pickPlateauBiome(temperatureIndex, humidityIndex, weirdness);
        }
        else {
            return humidityIndex <= 1 ? Biomes.SNOWY_SLOPES : Biomes.GROVE;
        }
    }
    pickExtremeHillsBiome(temperatureIndex, humidityIndex, weirdness) {
        const extremeHillsBiome = EXTREME_HILLS[temperatureIndex][humidityIndex];
        return extremeHillsBiome == null
            ? this.pickMiddleBiome(temperatureIndex, humidityIndex, weirdness)
            : extremeHillsBiome;
    }
    // push result
    addSurfaceBiome(biomes, temperature, humidity, continentalness, erosion, weirdness, offset, biome) {
        biomes.push(Pair.of(parameters(temperature, humidity, continentalness, erosion, Parameter.point(0.0), weirdness, offset), biome));
        biomes.push(Pair.of(parameters(temperature, humidity, continentalness, erosion, Parameter.point(1.0), weirdness, offset), biome));
    }
    addUndergroundBiome(biomes, temperature, humidity, continentalness, erosion, weirdness, offset, biome) {
        biomes.push(Pair.of(parameters(temperature, humidity, continentalness, erosion, Parameter.span(0.2, 0.9), weirdness, offset), biome));
    }
}

const BIOME_TO_COLOR = {};
BIOME_TO_COLOR[Biomes.THE_VOID] = 0x000000;
BIOME_TO_COLOR[Biomes.PLAINS] = 0x00cc00;
BIOME_TO_COLOR[Biomes.SUNFLOWER_PLAINS] = 0xffff66;
BIOME_TO_COLOR[Biomes.SNOWY_PLAINS] = 0xccffff;
BIOME_TO_COLOR[Biomes.ICE_SPIKES] = 0xccffff;
BIOME_TO_COLOR[Biomes.DESERT] = 0xffcc66;
BIOME_TO_COLOR[Biomes.SWAMP] = 0x006666;
BIOME_TO_COLOR[Biomes.FOREST] = 0x009933;
BIOME_TO_COLOR[Biomes.FLOWER_FOREST] = 0xcae03a;
BIOME_TO_COLOR[Biomes.BIRCH_FOREST] = 0xd6dea6;
BIOME_TO_COLOR[Biomes.DARK_FOREST] = 0x183615;
BIOME_TO_COLOR[Biomes.OLD_GROWTH_BIRCH_FOREST] = 0x0;
BIOME_TO_COLOR[Biomes.OLD_GROWTH_PINE_TAIGA] = 0x0;
BIOME_TO_COLOR[Biomes.OLD_GROWTH_SPRUCE_TAIGA] = 0x0;
BIOME_TO_COLOR[Biomes.TAIGA] = 0x071705;
BIOME_TO_COLOR[Biomes.SNOWY_TAIGA] = 0x364034;
BIOME_TO_COLOR[Biomes.SAVANNA] = 0x849626;
BIOME_TO_COLOR[Biomes.SAVANNA_PLATEAU] = 0x909c54;
BIOME_TO_COLOR[Biomes.WINDSWEPT_HILLS] = 0x2e612c;
BIOME_TO_COLOR[Biomes.WINDSWEPT_GRAVELLY_HILLS] = 0x445744;
BIOME_TO_COLOR[Biomes.WINDSWEPT_FOREST] = 0x2f4d2f;
BIOME_TO_COLOR[Biomes.WINDSWEPT_SAVANNA] = 0x656e47;
BIOME_TO_COLOR[Biomes.JUNGLE] = 0x18c71a;
BIOME_TO_COLOR[Biomes.SPARSE_JUNGLE] = 0x8ac26e;
BIOME_TO_COLOR[Biomes.BAMBOO_JUNGLE] = 0x38b832;
BIOME_TO_COLOR[Biomes.BADLANDS] = 0xbd6920;
BIOME_TO_COLOR[Biomes.ERODED_BADLANDS] = 0xb3743e;
BIOME_TO_COLOR[Biomes.WOODED_BADLANDS] = 0xc79044;
BIOME_TO_COLOR[Biomes.MEADOW] = 0x4cc22f;
BIOME_TO_COLOR[Biomes.GROVE] = 0x80997a;
BIOME_TO_COLOR[Biomes.SNOWY_SLOPES] = 0xe2e6e1;
BIOME_TO_COLOR[Biomes.FROZEN_PEAKS] = 0xb8c8d4;
BIOME_TO_COLOR[Biomes.JAGGED_PEAKS] = 0x95999c;
BIOME_TO_COLOR[Biomes.STONY_PEAKS] = 0x686869;
BIOME_TO_COLOR[Biomes.RIVER] = 0x4a73a8;
BIOME_TO_COLOR[Biomes.FROZEN_RIVER] = 0x7ba2d4;
BIOME_TO_COLOR[Biomes.BEACH] = 0xf2f754;
BIOME_TO_COLOR[Biomes.SNOWY_BEACH] = 0xcbcca3;
BIOME_TO_COLOR[Biomes.STONY_SHORE] = 0xccd2d9;
BIOME_TO_COLOR[Biomes.WARM_OCEAN] = 0x117dfa;
BIOME_TO_COLOR[Biomes.LUKEWARM_OCEAN] = 0x3186e8;
BIOME_TO_COLOR[Biomes.DEEP_LUKEWARM_OCEAN] = 0x2262ab;
BIOME_TO_COLOR[Biomes.OCEAN] = 0x4883c7;
BIOME_TO_COLOR[Biomes.DEEP_OCEAN] = 0x335e8f;
BIOME_TO_COLOR[Biomes.COLD_OCEAN] = 0x5a7a9e;
BIOME_TO_COLOR[Biomes.DEEP_COLD_OCEAN] = 0x3c5169;
BIOME_TO_COLOR[Biomes.FROZEN_OCEAN] = 0x5a6e85;
BIOME_TO_COLOR[Biomes.DEEP_FROZEN_OCEAN] = 0x3a4552;
BIOME_TO_COLOR[Biomes.MUSHROOM_FIELDS] = 0xd67e74;
BIOME_TO_COLOR[Biomes.DRIPSTONE_CAVES] = 0x0;
BIOME_TO_COLOR[Biomes.LUSH_CAVES] = 0x0;
BIOME_TO_COLOR[Biomes.NETHER_WASTES] = 0x0;
BIOME_TO_COLOR[Biomes.WARPED_FOREST] = 0x0;
BIOME_TO_COLOR[Biomes.CRIMSON_FOREST] = 0x0;
BIOME_TO_COLOR[Biomes.SOUL_SAND_VALLEY] = 0x0;
BIOME_TO_COLOR[Biomes.BASALT_DELTAS] = 0x0;
BIOME_TO_COLOR[Biomes.THE_END] = 0x0;
BIOME_TO_COLOR[Biomes.END_HIGHLANDS] = 0x0;
BIOME_TO_COLOR[Biomes.END_MIDLANDS] = 0x0;
BIOME_TO_COLOR[Biomes.SMALL_END_ISLANDS] = 0x0;
BIOME_TO_COLOR[Biomes.END_BARRENS] = 0x0;
class MapLoader {
    async loadMap(mapName) {
        if (mapName === "test") {
            await this.loadTestMap();
        }
        else {
            throw new Error("TODO");
        }
    }
    loadTestMap() {
        const q = create$2();
        fromEuler(q, 0, 0, 0);
        const ground = new SimpleObject({
            pos: fromValues$4(0, 0, 0),
            size: fromValues$4(50, 50, 1),
            rotation: q,
        }, new SimpleModelDef("plane", {
            texMul: 25,
        }), "grass2.jpg", new PhysicsDef({
            isStatic: true,
            bakedTransform: true,
        }), new Plane());
        Services.world.add(ground);
        const player = new SimpleObject({
            pos: fromValues$4(0, 2.61, 1.8 / 2),
            size: fromValues$4(1, 1, 1.8),
            rotation: create$2(),
        }, new CapsuleModelDef(), "blank", new PhysicsDef({
            noRotation: true,
            friction: 0.9,
            collisionGroup: CollisionGroups.PLAYER,
        }), new Capsule());
        Services.world.add(player);
        Services.inputManager.setEntityToOrbit(player, 5);
        Services.inputManager.setControlledEntity(player);
        const builder = new OverworldBiomeBuilder();
        const output = [];
        builder.addBiomes(output);
        const min = fromValues$4(Infinity, Infinity, Infinity);
        const max = fromValues$4(-Infinity, -Infinity, -Infinity);
        const POS_MUL = 1;
        const SIZE_MUL = 1;
        const POS_TRANSFORM = create$5();
        translate$1(POS_TRANSFORM, POS_TRANSFORM, fromValues$4(0, 0, 1.5));
        scale$5(POS_TRANSFORM, POS_TRANSFORM, fromValues$4(POS_MUL, POS_MUL, POS_MUL));
        const SIZE_TRANSFORM = create$5();
        scale$5(SIZE_TRANSFORM, SIZE_TRANSFORM, fromValues$4(SIZE_MUL, SIZE_MUL, SIZE_MUL));
        const biomesToShow = [Biomes.BIRCH_FOREST, Biomes.FOREST, Biomes.DARK_FOREST];
        const biomeBounds = {};
        for (const item of output) {
            const { first: point, second: biome } = item;
            const xRange = point.temperature;
            const yRange = point.humidity;
            const zRange = point.continentalness;
            const x = unquantizeCoord(xRange.center);
            const y = unquantizeCoord(yRange.center);
            const z = unquantizeCoord(zRange.center);
            const sizeX = unquantizeCoord(xRange.length);
            const sizeY = unquantizeCoord(yRange.length);
            const sizeZ = unquantizeCoord(zRange.length);
            const color = BIOME_TO_COLOR[biome];
            const rgba = colorToRGBA(color);
            const pos = fromValues$4(x, y, z);
            const size = fromValues$4(sizeX, sizeY, sizeZ);
            transformMat4$2(pos, pos, POS_TRANSFORM);
            transformMat4$2(size, size, SIZE_TRANSFORM);
            const box = new SimpleObject({
                pos,
                size,
                rotation: create$2(),
            }, new SimpleModelDef("cube", {
                colorOverride: fromValues$3(rgba[0], rgba[1], rgba[2], 0.8),
                alpha: true,
            }), "blank");
            if (biomesToShow.includes(biome)) {
                let bounds = biomeBounds[biome];
                if (bounds === undefined) {
                    bounds = {
                        min: fromValues$4(Infinity, Infinity, Infinity),
                        max: fromValues$4(-Infinity, -Infinity, -Infinity),
                    };
                    biomeBounds[biome] = bounds;
                }
                min$2(bounds.min, bounds.min, fromValues$4(unquantizeCoord(xRange.min), unquantizeCoord(yRange.min), unquantizeCoord(zRange.min)));
                max$2(bounds.max, bounds.max, fromValues$4(unquantizeCoord(xRange.max), unquantizeCoord(yRange.max), unquantizeCoord(zRange.max)));
                // Services.world.add(box)
            }
            min$2(min, min, fromValues$4(unquantizeCoord(xRange.min), unquantizeCoord(yRange.min), unquantizeCoord(zRange.min)));
            max$2(max, max, fromValues$4(unquantizeCoord(xRange.max), unquantizeCoord(yRange.max), unquantizeCoord(zRange.max)));
        }
        transformMat4$2(min, min, SIZE_TRANSFORM);
        transformMat4$2(min, min, POS_TRANSFORM);
        transformMat4$2(max, max, SIZE_TRANSFORM);
        transformMat4$2(max, max, POS_TRANSFORM);
        Services.render.addDebugRect(min, max, 0x00ff00, 0xff0000, 0x0000ff);
        Services.render.addText("temperature", fromValues$4((min[0] + max[0]) * 0.5, max[1], max[2]));
        Services.render.addText("cold", fromValues$4(min[0], max[1], max[2]));
        Services.render.addText("hot", fromValues$4(max[0], max[1], max[2] + 0.1));
        Services.render.addText("humidity", fromValues$4(max[0], (min[1] + max[1]) * 0.5, max[2]));
        Services.render.addText("dry", fromValues$4(max[0], min[1], max[2]));
        Services.render.addText("humid", fromValues$4(max[0], max[1], max[2]));
        Services.render.addText("continentalness", fromValues$4(max[0], max[1], (min[2] + max[2]) * 0.5));
        Services.render.addText("ocean", fromValues$4(max[0], max[1], min[2]));
        Services.render.addText("center", fromValues$4(max[0], max[1], max[2] - 0.1));
        for (const biome of Object.keys(biomeBounds)) {
            const center = create$4();
            const bounds = biomeBounds[biome];
            transformMat4$2(bounds.min, bounds.min, SIZE_TRANSFORM);
            transformMat4$2(bounds.min, bounds.min, POS_TRANSFORM);
            transformMat4$2(bounds.max, bounds.max, SIZE_TRANSFORM);
            transformMat4$2(bounds.max, bounds.max, POS_TRANSFORM);
            lerp$5(center, bounds.min, bounds.max, 0.5);
            Services.render.addText(biome.toUpperCase(), center);
            const size = clone$4(bounds.max);
            sub$2(size, size, bounds.min);
            const color = BIOME_TO_COLOR[biome];
            const rgba = colorToRGBA(color);
            const box = new SimpleObject({
                pos: center,
                size,
                rotation: create$2(),
            }, new SimpleModelDef("cube", {
                colorOverride: fromValues$3(rgba[0], rgba[1], rgba[2], 0.6),
                alpha: true,
            }), "blank");
            Services.world.add(box);
        }
    }
}

class InputManager {
    canvas;
    clickHandlerBind = this.clickHandler.bind(this);
    mouseHandlerBind = this.mouseHandler.bind(this);
    keyHandlerBind = this.keyHandler.bind(this);
    keyboard = new Map();
    orbit;
    controlledEntity;
    constructor(canvas) {
        this.canvas = canvas;
        this.attchEvents();
    }
    attchEvents() {
        const { canvas } = this;
        canvas.addEventListener("click", this.clickHandlerBind);
        canvas.addEventListener("mousemove", this.mouseHandlerBind, { passive: true });
        canvas.addEventListener("mouseup", this.mouseHandlerBind, { passive: true });
        canvas.addEventListener("mousedown", this.mouseHandlerBind, { passive: true });
        window.addEventListener("keyup", this.keyHandlerBind);
        window.addEventListener("keydown", this.keyHandlerBind);
    }
    clickHandler(e) {
        this.canvas.requestPointerLock();
    }
    mouseHandler(e) {
        const dx = e.movementX;
        const dy = e.movementY;
        const isLocked = document.pointerLockElement === this.canvas;
        if (this.orbit && isLocked && e.type === "mousemove") {
            const ROTATION_SPEED = 0.1;
            const e = 10e-3;
            this.orbit.zAngle = (this.orbit.zAngle + dx * ROTATION_SPEED) % 360;
            this.orbit.yAngle = Math.max(-90 + e, Math.min(this.orbit.yAngle + dy * ROTATION_SPEED, 90 - e));
            this.applyOrbit();
        }
    }
    processControlledEntity(dt) {
        const entity = this.controlledEntity;
        if (!entity) {
            return;
        }
        const physics = entity.get(PhysicsComponent);
        const transform = entity.get(TransformComponent);
        dt = dt / 1000;
        if (transform && physics && physics.body && this.orbit) {
            physics.body.applyCentralImpulse(new Ammo.btVector3(0, 0, -9.8 * dt));
            physics.body.setGravity(new Ammo.btVector3(0, 0, 0));
            let speed = 0;
            let desiredAngle = this.orbit.zAngle;
            if (this.isPressed("KeyW", "KeyS", "KeyA", "KeyD")) {
                // speed = 17.24 // run
                speed = 7.62; // walk
            }
            if (this.isPressed("KeyA")) {
                desiredAngle -= this.isPressed("KeyW") ? 45 : this.isPressed("KeyS") ? -45 : 90;
            }
            if (this.isPressed("KeyD")) {
                desiredAngle += this.isPressed("KeyW") ? 45 : this.isPressed("KeyS") ? -45 : 90;
            }
            if (this.isPressed("KeyS")) {
                desiredAngle += 180;
            }
            const velocity = fromValues$4(-speed, 0, 0);
            const q = create$2();
            fromEuler(q, 0, 0, -desiredAngle);
            transformQuat$1(velocity, velocity, q);
            const pos = physics.body.getWorldTransform().getOrigin();
            const next_x = pos.x();
            const next_y = pos.y();
            const next_z = pos.z() - 9.8 * 0.9375 * dt; // gravity effect?
            const z = next_z;
            const FEET_OFFSET = transform.transform.size[2] * 0.5 + 0.4;
            const center = fromValues$4(next_x, next_y, z);
            const feet = fromValues$4(next_x, next_y, z - FEET_OFFSET);
            const result = Services.physics.raycast(center, feet);
            velocity[2] = physics.body.getLinearVelocity().z();
            if (result.hit) {
                const next_z = center[2] - result.distance + FEET_OFFSET;
                velocity[2] = 0;
                const t = physics.body.getWorldTransform();
                t.setOrigin(new Ammo.btVector3(pos.x(), pos.y(), next_z - 0.001));
            }
            const ammoVelocity = new Ammo.btVector3(velocity[0], velocity[1], velocity[2]);
            physics.body.setLinearVelocity(ammoVelocity);
            physics.body.activate(true);
            Services.render.drawDebugLine(center, feet, 0xff0000, 0x00ff00);
        }
    }
    isPressed(...codes) {
        for (const code of codes) {
            if (this.keyboard.has(code)) {
                return true;
            }
        }
        return false;
    }
    processKeyMap(e) {
        if (e.type === "keydown") {
            this.keyboard.set(e.code, true);
        }
        else if (e.type === "keyup") {
            this.keyboard.delete(e.code);
        }
    }
    keyHandler(e) {
        this.processKeyMap(e);
    }
    setEntityToOrbit(entity, distance) {
        this.orbit = {
            entity,
            yAngle: 0,
            zAngle: 0,
            distance,
        };
        this.applyOrbit();
    }
    setControlledEntity(entity) {
        this.controlledEntity = entity;
    }
    applyOrbit() {
        if (this.orbit) {
            const transform = this.orbit.entity.get(TransformComponent);
            if (!transform) {
                throw new Error("Can't orbit entity without transformation component.");
            }
            const center = transform.transform.pos;
            const q = create$2();
            fromEuler(q, 0, -this.orbit.yAngle, -this.orbit.zAngle);
            const eye = fromValues$4(this.orbit.distance, 0, 0);
            transformQuat$1(eye, eye, q);
            add$4(eye, center, eye);
            Services.render.setCamera(eye, center);
        }
    }
    tick(dt) {
        this.processControlledEntity(dt);
    }
    postPhysics() {
        this.applyOrbit();
    }
}

class ServicesClass {
    render;
    physics;
    inputManager;
    resources;
    world;
    mapLoader;
    loop;
    constructor(options) {
        const canvasWebGL = document.createElement("canvas");
        const canvas2D = document.createElement("canvas");
        canvas2D.style.pointerEvents = "none";
        document.body.appendChild(canvasWebGL);
        document.body.appendChild(canvas2D);
        this.render = new Render(canvasWebGL, canvas2D);
        this.physics = new Physics(options.ammo);
        this.inputManager = new InputManager(canvasWebGL);
        this.resources = new ResourceManager();
        this.world = new World();
        this.mapLoader = new MapLoader();
        this.loop = new GameLoop();
    }
    async start() {
        await this.mapLoader.loadMap("test");
        await this.resources.waitForLoading();
        this.loop.start();
    }
}

var Blocks;
(function (Blocks) {
    Blocks["AIR"] = "air";
    Blocks["STONE"] = "stone";
    Blocks["GRANITE"] = "granite";
    Blocks["POLISHED_GRANITE"] = "polished_granite";
    Blocks["DIORITE"] = "diorite";
    Blocks["POLISHED_DIORITE"] = "polished_diorite";
    Blocks["ANDESITE"] = "andesite";
    Blocks["POLISHED_ANDESITE"] = "polished_andesite";
    Blocks["GRASS_BLOCK"] = "grass_block";
    Blocks["DIRT"] = "dirt";
    Blocks["COARSE_DIRT"] = "coarse_dirt";
    Blocks["PODZOL"] = "podzol";
    Blocks["COBBLESTONE"] = "cobblestone";
    Blocks["OAK_PLANKS"] = "oak_planks";
    Blocks["SPRUCE_PLANKS"] = "spruce_planks";
    Blocks["BIRCH_PLANKS"] = "birch_planks";
    Blocks["JUNGLE_PLANKS"] = "jungle_planks";
    Blocks["ACACIA_PLANKS"] = "acacia_planks";
    Blocks["DARK_OAK_PLANKS"] = "dark_oak_planks";
    Blocks["OAK_SAPLING"] = "oak_sapling";
    Blocks["SPRUCE_SAPLING"] = "spruce_sapling";
    Blocks["BIRCH_SAPLING"] = "birch_sapling";
    Blocks["JUNGLE_SAPLING"] = "jungle_sapling";
    Blocks["ACACIA_SAPLING"] = "acacia_sapling";
    Blocks["DARK_OAK_SAPLING"] = "dark_oak_sapling";
    Blocks["BEDROCK"] = "bedrock";
    Blocks["WATER"] = "water";
    Blocks["LAVA"] = "lava";
    Blocks["SAND"] = "sand";
    Blocks["RED_SAND"] = "red_sand";
    Blocks["GRAVEL"] = "gravel";
    Blocks["GOLD_ORE"] = "gold_ore";
    Blocks["DEEPSLATE_GOLD_ORE"] = "deepslate_gold_ore";
    Blocks["IRON_ORE"] = "iron_ore";
    Blocks["DEEPSLATE_IRON_ORE"] = "deepslate_iron_ore";
    Blocks["COAL_ORE"] = "coal_ore";
    Blocks["DEEPSLATE_COAL_ORE"] = "deepslate_coal_ore";
    Blocks["NETHER_GOLD_ORE"] = "nether_gold_ore";
    Blocks["OAK_LOG"] = "oak_log";
    Blocks["SPRUCE_LOG"] = "spruce_log";
    Blocks["BIRCH_LOG"] = "birch_log";
    Blocks["JUNGLE_LOG"] = "jungle_log";
    Blocks["ACACIA_LOG"] = "acacia_log";
    Blocks["DARK_OAK_LOG"] = "dark_oak_log";
    Blocks["STRIPPED_SPRUCE_LOG"] = "stripped_spruce_log";
    Blocks["STRIPPED_BIRCH_LOG"] = "stripped_birch_log";
    Blocks["STRIPPED_JUNGLE_LOG"] = "stripped_jungle_log";
    Blocks["STRIPPED_ACACIA_LOG"] = "stripped_acacia_log";
    Blocks["STRIPPED_DARK_OAK_LOG"] = "stripped_dark_oak_log";
    Blocks["STRIPPED_OAK_LOG"] = "stripped_oak_log";
    Blocks["OAK_WOOD"] = "oak_wood";
    Blocks["SPRUCE_WOOD"] = "spruce_wood";
    Blocks["BIRCH_WOOD"] = "birch_wood";
    Blocks["JUNGLE_WOOD"] = "jungle_wood";
    Blocks["ACACIA_WOOD"] = "acacia_wood";
    Blocks["DARK_OAK_WOOD"] = "dark_oak_wood";
    Blocks["STRIPPED_OAK_WOOD"] = "stripped_oak_wood";
    Blocks["STRIPPED_SPRUCE_WOOD"] = "stripped_spruce_wood";
    Blocks["STRIPPED_BIRCH_WOOD"] = "stripped_birch_wood";
    Blocks["STRIPPED_JUNGLE_WOOD"] = "stripped_jungle_wood";
    Blocks["STRIPPED_ACACIA_WOOD"] = "stripped_acacia_wood";
    Blocks["STRIPPED_DARK_OAK_WOOD"] = "stripped_dark_oak_wood";
    Blocks["OAK_LEAVES"] = "oak_leaves";
    Blocks["SPRUCE_LEAVES"] = "spruce_leaves";
    Blocks["BIRCH_LEAVES"] = "birch_leaves";
    Blocks["JUNGLE_LEAVES"] = "jungle_leaves";
    Blocks["ACACIA_LEAVES"] = "acacia_leaves";
    Blocks["DARK_OAK_LEAVES"] = "dark_oak_leaves";
    Blocks["AZALEA_LEAVES"] = "azalea_leaves";
    Blocks["FLOWERING_AZALEA_LEAVES"] = "flowering_azalea_leaves";
    Blocks["SPONGE"] = "sponge";
    Blocks["WET_SPONGE"] = "wet_sponge";
    Blocks["GLASS"] = "glass";
    Blocks["LAPIS_ORE"] = "lapis_ore";
    Blocks["DEEPSLATE_LAPIS_ORE"] = "deepslate_lapis_ore";
    Blocks["LAPIS_BLOCK"] = "lapis_block";
    Blocks["DISPENSER"] = "dispenser";
    Blocks["SANDSTONE"] = "sandstone";
    Blocks["CHISELED_SANDSTONE"] = "chiseled_sandstone";
    Blocks["CUT_SANDSTONE"] = "cut_sandstone";
    Blocks["NOTE_BLOCK"] = "note_block";
    Blocks["WHITE_BED"] = "white_bed";
    Blocks["ORANGE_BED"] = "orange_bed";
    Blocks["MAGENTA_BED"] = "magenta_bed";
    Blocks["LIGHT_BLUE_BED"] = "light_blue_bed";
    Blocks["YELLOW_BED"] = "yellow_bed";
    Blocks["LIME_BED"] = "lime_bed";
    Blocks["PINK_BED"] = "pink_bed";
    Blocks["GRAY_BED"] = "gray_bed";
    Blocks["LIGHT_GRAY_BED"] = "light_gray_bed";
    Blocks["CYAN_BED"] = "cyan_bed";
    Blocks["PURPLE_BED"] = "purple_bed";
    Blocks["BLUE_BED"] = "blue_bed";
    Blocks["BROWN_BED"] = "brown_bed";
    Blocks["GREEN_BED"] = "green_bed";
    Blocks["RED_BED"] = "red_bed";
    Blocks["BLACK_BED"] = "black_bed";
    Blocks["POWERED_RAIL"] = "powered_rail";
    Blocks["DETECTOR_RAIL"] = "detector_rail";
    Blocks["STICKY_PISTON"] = "sticky_piston";
    Blocks["COBWEB"] = "cobweb";
    Blocks["GRASS"] = "grass";
    Blocks["FERN"] = "fern";
    Blocks["DEAD_BUSH"] = "dead_bush";
    Blocks["SEAGRASS"] = "seagrass";
    Blocks["TALL_SEAGRASS"] = "tall_seagrass";
    Blocks["PISTON"] = "piston";
    Blocks["PISTON_HEAD"] = "piston_head";
    Blocks["WHITE_WOOL"] = "white_wool";
    Blocks["ORANGE_WOOL"] = "orange_wool";
    Blocks["MAGENTA_WOOL"] = "magenta_wool";
    Blocks["LIGHT_BLUE_WOOL"] = "light_blue_wool";
    Blocks["YELLOW_WOOL"] = "yellow_wool";
    Blocks["LIME_WOOL"] = "lime_wool";
    Blocks["PINK_WOOL"] = "pink_wool";
    Blocks["GRAY_WOOL"] = "gray_wool";
    Blocks["LIGHT_GRAY_WOOL"] = "light_gray_wool";
    Blocks["CYAN_WOOL"] = "cyan_wool";
    Blocks["PURPLE_WOOL"] = "purple_wool";
    Blocks["BLUE_WOOL"] = "blue_wool";
    Blocks["BROWN_WOOL"] = "brown_wool";
    Blocks["GREEN_WOOL"] = "green_wool";
    Blocks["RED_WOOL"] = "red_wool";
    Blocks["BLACK_WOOL"] = "black_wool";
    Blocks["MOVING_PISTON"] = "moving_piston";
    Blocks["DANDELION"] = "dandelion";
    Blocks["POPPY"] = "poppy";
    Blocks["BLUE_ORCHID"] = "blue_orchid";
    Blocks["ALLIUM"] = "allium";
    Blocks["AZURE_BLUET"] = "azure_bluet";
    Blocks["RED_TULIP"] = "red_tulip";
    Blocks["ORANGE_TULIP"] = "orange_tulip";
    Blocks["WHITE_TULIP"] = "white_tulip";
    Blocks["PINK_TULIP"] = "pink_tulip";
    Blocks["OXEYE_DAISY"] = "oxeye_daisy";
    Blocks["CORNFLOWER"] = "cornflower";
    Blocks["WITHER_ROSE"] = "wither_rose";
    Blocks["LILY_OF_THE_VALLEY"] = "lily_of_the_valley";
    Blocks["BROWN_MUSHROOM"] = "brown_mushroom";
    Blocks["RED_MUSHROOM"] = "red_mushroom";
    Blocks["GOLD_BLOCK"] = "gold_block";
    Blocks["IRON_BLOCK"] = "iron_block";
    Blocks["BRICKS"] = "bricks";
    Blocks["TNT"] = "tnt";
    Blocks["BOOKSHELF"] = "bookshelf";
    Blocks["MOSSY_COBBLESTONE"] = "mossy_cobblestone";
    Blocks["OBSIDIAN"] = "obsidian";
    Blocks["TORCH"] = "torch";
    Blocks["WALL_TORCH"] = "wall_torch";
    Blocks["FIRE"] = "fire";
    Blocks["SOUL_FIRE"] = "soul_fire";
    Blocks["SPAWNER"] = "spawner";
    Blocks["OAK_STAIRS"] = "oak_stairs";
    Blocks["CHEST"] = "chest";
    Blocks["REDSTONE_WIRE"] = "redstone_wire";
    Blocks["DIAMOND_ORE"] = "diamond_ore";
    Blocks["DEEPSLATE_DIAMOND_ORE"] = "deepslate_diamond_ore";
    Blocks["DIAMOND_BLOCK"] = "diamond_block";
    Blocks["CRAFTING_TABLE"] = "crafting_table";
    Blocks["WHEAT"] = "wheat";
    Blocks["FARMLAND"] = "farmland";
    Blocks["FURNACE"] = "furnace";
    Blocks["OAK_SIGN"] = "oak_sign";
    Blocks["SPRUCE_SIGN"] = "spruce_sign";
    Blocks["BIRCH_SIGN"] = "birch_sign";
    Blocks["ACACIA_SIGN"] = "acacia_sign";
    Blocks["JUNGLE_SIGN"] = "jungle_sign";
    Blocks["DARK_OAK_SIGN"] = "dark_oak_sign";
    Blocks["OAK_DOOR"] = "oak_door";
    Blocks["LADDER"] = "ladder";
    Blocks["RAIL"] = "rail";
    Blocks["COBBLESTONE_STAIRS"] = "cobblestone_stairs";
    Blocks["OAK_WALL_SIGN"] = "oak_wall_sign";
    Blocks["SPRUCE_WALL_SIGN"] = "spruce_wall_sign";
    Blocks["BIRCH_WALL_SIGN"] = "birch_wall_sign";
    Blocks["ACACIA_WALL_SIGN"] = "acacia_wall_sign";
    Blocks["JUNGLE_WALL_SIGN"] = "jungle_wall_sign";
    Blocks["DARK_OAK_WALL_SIGN"] = "dark_oak_wall_sign";
    Blocks["LEVER"] = "lever";
    Blocks["STONE_PRESSURE_PLATE"] = "stone_pressure_plate";
    Blocks["IRON_DOOR"] = "iron_door";
    Blocks["OAK_PRESSURE_PLATE"] = "oak_pressure_plate";
    Blocks["SPRUCE_PRESSURE_PLATE"] = "spruce_pressure_plate";
    Blocks["BIRCH_PRESSURE_PLATE"] = "birch_pressure_plate";
    Blocks["JUNGLE_PRESSURE_PLATE"] = "jungle_pressure_plate";
    Blocks["ACACIA_PRESSURE_PLATE"] = "acacia_pressure_plate";
    Blocks["DARK_OAK_PRESSURE_PLATE"] = "dark_oak_pressure_plate";
    Blocks["REDSTONE_ORE"] = "redstone_ore";
    Blocks["DEEPSLATE_REDSTONE_ORE"] = "deepslate_redstone_ore";
    Blocks["REDSTONE_TORCH"] = "redstone_torch";
    Blocks["REDSTONE_WALL_TORCH"] = "redstone_wall_torch";
    Blocks["STONE_BUTTON"] = "stone_button";
    Blocks["SNOW"] = "snow";
    Blocks["ICE"] = "ice";
    Blocks["SNOW_BLOCK"] = "snow_block";
    Blocks["CACTUS"] = "cactus";
    Blocks["CLAY"] = "clay";
    Blocks["SUGAR_CANE"] = "sugar_cane";
    Blocks["JUKEBOX"] = "jukebox";
    Blocks["OAK_FENCE"] = "oak_fence";
    Blocks["PUMPKIN"] = "pumpkin";
    Blocks["NETHERRACK"] = "netherrack";
    Blocks["SOUL_SAND"] = "soul_sand";
    Blocks["SOUL_SOIL"] = "soul_soil";
    Blocks["BASALT"] = "basalt";
    Blocks["POLISHED_BASALT"] = "polished_basalt";
    Blocks["SOUL_TORCH"] = "soul_torch";
    Blocks["SOUL_WALL_TORCH"] = "soul_wall_torch";
    Blocks["GLOWSTONE"] = "glowstone";
    Blocks["NETHER_PORTAL"] = "nether_portal";
    Blocks["CARVED_PUMPKIN"] = "carved_pumpkin";
    Blocks["JACK_O_LANTERN"] = "jack_o_lantern";
    Blocks["CAKE"] = "cake";
    Blocks["REPEATER"] = "repeater";
    Blocks["WHITE_STAINED_GLASS"] = "white_stained_glass";
    Blocks["ORANGE_STAINED_GLASS"] = "orange_stained_glass";
    Blocks["MAGENTA_STAINED_GLASS"] = "magenta_stained_glass";
    Blocks["LIGHT_BLUE_STAINED_GLASS"] = "light_blue_stained_glass";
    Blocks["YELLOW_STAINED_GLASS"] = "yellow_stained_glass";
    Blocks["LIME_STAINED_GLASS"] = "lime_stained_glass";
    Blocks["PINK_STAINED_GLASS"] = "pink_stained_glass";
    Blocks["GRAY_STAINED_GLASS"] = "gray_stained_glass";
    Blocks["LIGHT_GRAY_STAINED_GLASS"] = "light_gray_stained_glass";
    Blocks["CYAN_STAINED_GLASS"] = "cyan_stained_glass";
    Blocks["PURPLE_STAINED_GLASS"] = "purple_stained_glass";
    Blocks["BLUE_STAINED_GLASS"] = "blue_stained_glass";
    Blocks["BROWN_STAINED_GLASS"] = "brown_stained_glass";
    Blocks["GREEN_STAINED_GLASS"] = "green_stained_glass";
    Blocks["RED_STAINED_GLASS"] = "red_stained_glass";
    Blocks["BLACK_STAINED_GLASS"] = "black_stained_glass";
    Blocks["OAK_TRAPDOOR"] = "oak_trapdoor";
    Blocks["SPRUCE_TRAPDOOR"] = "spruce_trapdoor";
    Blocks["BIRCH_TRAPDOOR"] = "birch_trapdoor";
    Blocks["JUNGLE_TRAPDOOR"] = "jungle_trapdoor";
    Blocks["ACACIA_TRAPDOOR"] = "acacia_trapdoor";
    Blocks["DARK_OAK_TRAPDOOR"] = "dark_oak_trapdoor";
    Blocks["STONE_BRICKS"] = "stone_bricks";
    Blocks["MOSSY_STONE_BRICKS"] = "mossy_stone_bricks";
    Blocks["CRACKED_STONE_BRICKS"] = "cracked_stone_bricks";
    Blocks["CHISELED_STONE_BRICKS"] = "chiseled_stone_bricks";
    Blocks["INFESTED_STONE"] = "infested_stone";
    Blocks["INFESTED_COBBLESTONE"] = "infested_cobblestone";
    Blocks["INFESTED_STONE_BRICKS"] = "infested_stone_bricks";
    Blocks["INFESTED_MOSSY_STONE_BRICKS"] = "infested_mossy_stone_bricks";
    Blocks["INFESTED_CRACKED_STONE_BRICKS"] = "infested_cracked_stone_bricks";
    Blocks["INFESTED_CHISELED_STONE_BRICKS"] = "infested_chiseled_stone_bricks";
    Blocks["BROWN_MUSHROOM_BLOCK"] = "brown_mushroom_block";
    Blocks["RED_MUSHROOM_BLOCK"] = "red_mushroom_block";
    Blocks["MUSHROOM_STEM"] = "mushroom_stem";
    Blocks["IRON_BARS"] = "iron_bars";
    Blocks["CHAIN"] = "chain";
    Blocks["GLASS_PANE"] = "glass_pane";
    Blocks["MELON"] = "melon";
    Blocks["ATTACHED_PUMPKIN_STEM"] = "attached_pumpkin_stem";
    Blocks["ATTACHED_MELON_STEM"] = "attached_melon_stem";
    Blocks["PUMPKIN_STEM"] = "pumpkin_stem";
    Blocks["MELON_STEM"] = "melon_stem";
    Blocks["VINE"] = "vine";
    Blocks["GLOW_LICHEN"] = "glow_lichen";
    Blocks["OAK_FENCE_GATE"] = "oak_fence_gate";
    Blocks["BRICK_STAIRS"] = "brick_stairs";
    Blocks["STONE_BRICK_STAIRS"] = "stone_brick_stairs";
    Blocks["MYCELIUM"] = "mycelium";
    Blocks["LILY_PAD"] = "lily_pad";
    Blocks["NETHER_BRICKS"] = "nether_bricks";
    Blocks["NETHER_BRICK_FENCE"] = "nether_brick_fence";
    Blocks["NETHER_BRICK_STAIRS"] = "nether_brick_stairs";
    Blocks["NETHER_WART"] = "nether_wart";
    Blocks["ENCHANTING_TABLE"] = "enchanting_table";
    Blocks["BREWING_STAND"] = "brewing_stand";
    Blocks["CAULDRON"] = "cauldron";
    Blocks["WATER_CAULDRON"] = "water_cauldron";
    Blocks["LAVA_CAULDRON"] = "lava_cauldron";
    Blocks["POWDER_SNOW_CAULDRON"] = "powder_snow_cauldron";
    Blocks["END_PORTAL"] = "end_portal";
    Blocks["END_PORTAL_FRAME"] = "end_portal_frame";
    Blocks["END_STONE"] = "end_stone";
    Blocks["DRAGON_EGG"] = "dragon_egg";
    Blocks["REDSTONE_LAMP"] = "redstone_lamp";
    Blocks["COCOA"] = "cocoa";
    Blocks["SANDSTONE_STAIRS"] = "sandstone_stairs";
    Blocks["EMERALD_ORE"] = "emerald_ore";
    Blocks["DEEPSLATE_EMERALD_ORE"] = "deepslate_emerald_ore";
    Blocks["ENDER_CHEST"] = "ender_chest";
    Blocks["TRIPWIRE_HOOK"] = "tripwire_hook";
    Blocks["TRIPWIRE"] = "tripwire";
    Blocks["EMERALD_BLOCK"] = "emerald_block";
    Blocks["SPRUCE_STAIRS"] = "spruce_stairs";
    Blocks["BIRCH_STAIRS"] = "birch_stairs";
    Blocks["JUNGLE_STAIRS"] = "jungle_stairs";
    Blocks["COMMAND_BLOCK"] = "command_block";
    Blocks["BEACON"] = "beacon";
    Blocks["COBBLESTONE_WALL"] = "cobblestone_wall";
    Blocks["MOSSY_COBBLESTONE_WALL"] = "mossy_cobblestone_wall";
    Blocks["FLOWER_POT"] = "flower_pot";
    Blocks["POTTED_OAK_SAPLING"] = "potted_oak_sapling";
    Blocks["POTTED_SPRUCE_SAPLING"] = "potted_spruce_sapling";
    Blocks["POTTED_BIRCH_SAPLING"] = "potted_birch_sapling";
    Blocks["POTTED_JUNGLE_SAPLING"] = "potted_jungle_sapling";
    Blocks["POTTED_ACACIA_SAPLING"] = "potted_acacia_sapling";
    Blocks["POTTED_DARK_OAK_SAPLING"] = "potted_dark_oak_sapling";
    Blocks["POTTED_FERN"] = "potted_fern";
    Blocks["POTTED_DANDELION"] = "potted_dandelion";
    Blocks["POTTED_POPPY"] = "potted_poppy";
    Blocks["POTTED_BLUE_ORCHID"] = "potted_blue_orchid";
    Blocks["POTTED_ALLIUM"] = "potted_allium";
    Blocks["POTTED_AZURE_BLUET"] = "potted_azure_bluet";
    Blocks["POTTED_RED_TULIP"] = "potted_red_tulip";
    Blocks["POTTED_ORANGE_TULIP"] = "potted_orange_tulip";
    Blocks["POTTED_WHITE_TULIP"] = "potted_white_tulip";
    Blocks["POTTED_PINK_TULIP"] = "potted_pink_tulip";
    Blocks["POTTED_OXEYE_DAISY"] = "potted_oxeye_daisy";
    Blocks["POTTED_CORNFLOWER"] = "potted_cornflower";
    Blocks["POTTED_LILY_OF_THE_VALLEY"] = "potted_lily_of_the_valley";
    Blocks["POTTED_WITHER_ROSE"] = "potted_wither_rose";
    Blocks["POTTED_RED_MUSHROOM"] = "potted_red_mushroom";
    Blocks["POTTED_BROWN_MUSHROOM"] = "potted_brown_mushroom";
    Blocks["POTTED_DEAD_BUSH"] = "potted_dead_bush";
    Blocks["POTTED_CACTUS"] = "potted_cactus";
    Blocks["CARROTS"] = "carrots";
    Blocks["POTATOES"] = "potatoes";
    Blocks["OAK_BUTTON"] = "oak_button";
    Blocks["SPRUCE_BUTTON"] = "spruce_button";
    Blocks["BIRCH_BUTTON"] = "birch_button";
    Blocks["JUNGLE_BUTTON"] = "jungle_button";
    Blocks["ACACIA_BUTTON"] = "acacia_button";
    Blocks["DARK_OAK_BUTTON"] = "dark_oak_button";
    Blocks["SKELETON_SKULL"] = "skeleton_skull";
    Blocks["SKELETON_WALL_SKULL"] = "skeleton_wall_skull";
    Blocks["WITHER_SKELETON_SKULL"] = "wither_skeleton_skull";
    Blocks["WITHER_SKELETON_WALL_SKULL"] = "wither_skeleton_wall_skull";
    Blocks["ZOMBIE_HEAD"] = "zombie_head";
    Blocks["ZOMBIE_WALL_HEAD"] = "zombie_wall_head";
    Blocks["PLAYER_HEAD"] = "player_head";
    Blocks["PLAYER_WALL_HEAD"] = "player_wall_head";
    Blocks["CREEPER_HEAD"] = "creeper_head";
    Blocks["CREEPER_WALL_HEAD"] = "creeper_wall_head";
    Blocks["DRAGON_HEAD"] = "dragon_head";
    Blocks["DRAGON_WALL_HEAD"] = "dragon_wall_head";
    Blocks["ANVIL"] = "anvil";
    Blocks["CHIPPED_ANVIL"] = "chipped_anvil";
    Blocks["DAMAGED_ANVIL"] = "damaged_anvil";
    Blocks["TRAPPED_CHEST"] = "trapped_chest";
    Blocks["LIGHT_WEIGHTED_PRESSURE_PLATE"] = "light_weighted_pressure_plate";
    Blocks["HEAVY_WEIGHTED_PRESSURE_PLATE"] = "heavy_weighted_pressure_plate";
    Blocks["COMPARATOR"] = "comparator";
    Blocks["DAYLIGHT_DETECTOR"] = "daylight_detector";
    Blocks["REDSTONE_BLOCK"] = "redstone_block";
    Blocks["NETHER_QUARTZ_ORE"] = "nether_quartz_ore";
    Blocks["HOPPER"] = "hopper";
    Blocks["QUARTZ_BLOCK"] = "quartz_block";
    Blocks["CHISELED_QUARTZ_BLOCK"] = "chiseled_quartz_block";
    Blocks["QUARTZ_PILLAR"] = "quartz_pillar";
    Blocks["QUARTZ_STAIRS"] = "quartz_stairs";
    Blocks["ACTIVATOR_RAIL"] = "activator_rail";
    Blocks["DROPPER"] = "dropper";
    Blocks["WHITE_TERRACOTTA"] = "white_terracotta";
    Blocks["ORANGE_TERRACOTTA"] = "orange_terracotta";
    Blocks["MAGENTA_TERRACOTTA"] = "magenta_terracotta";
    Blocks["LIGHT_BLUE_TERRACOTTA"] = "light_blue_terracotta";
    Blocks["YELLOW_TERRACOTTA"] = "yellow_terracotta";
    Blocks["LIME_TERRACOTTA"] = "lime_terracotta";
    Blocks["PINK_TERRACOTTA"] = "pink_terracotta";
    Blocks["GRAY_TERRACOTTA"] = "gray_terracotta";
    Blocks["LIGHT_GRAY_TERRACOTTA"] = "light_gray_terracotta";
    Blocks["CYAN_TERRACOTTA"] = "cyan_terracotta";
    Blocks["PURPLE_TERRACOTTA"] = "purple_terracotta";
    Blocks["BLUE_TERRACOTTA"] = "blue_terracotta";
    Blocks["BROWN_TERRACOTTA"] = "brown_terracotta";
    Blocks["GREEN_TERRACOTTA"] = "green_terracotta";
    Blocks["RED_TERRACOTTA"] = "red_terracotta";
    Blocks["BLACK_TERRACOTTA"] = "black_terracotta";
    Blocks["WHITE_STAINED_GLASS_PANE"] = "white_stained_glass_pane";
    Blocks["ORANGE_STAINED_GLASS_PANE"] = "orange_stained_glass_pane";
    Blocks["MAGENTA_STAINED_GLASS_PANE"] = "magenta_stained_glass_pane";
    Blocks["LIGHT_BLUE_STAINED_GLASS_PANE"] = "light_blue_stained_glass_pane";
    Blocks["YELLOW_STAINED_GLASS_PANE"] = "yellow_stained_glass_pane";
    Blocks["LIME_STAINED_GLASS_PANE"] = "lime_stained_glass_pane";
    Blocks["PINK_STAINED_GLASS_PANE"] = "pink_stained_glass_pane";
    Blocks["GRAY_STAINED_GLASS_PANE"] = "gray_stained_glass_pane";
    Blocks["LIGHT_GRAY_STAINED_GLASS_PANE"] = "light_gray_stained_glass_pane";
    Blocks["CYAN_STAINED_GLASS_PANE"] = "cyan_stained_glass_pane";
    Blocks["PURPLE_STAINED_GLASS_PANE"] = "purple_stained_glass_pane";
    Blocks["BLUE_STAINED_GLASS_PANE"] = "blue_stained_glass_pane";
    Blocks["BROWN_STAINED_GLASS_PANE"] = "brown_stained_glass_pane";
    Blocks["GREEN_STAINED_GLASS_PANE"] = "green_stained_glass_pane";
    Blocks["RED_STAINED_GLASS_PANE"] = "red_stained_glass_pane";
    Blocks["BLACK_STAINED_GLASS_PANE"] = "black_stained_glass_pane";
    Blocks["ACACIA_STAIRS"] = "acacia_stairs";
    Blocks["DARK_OAK_STAIRS"] = "dark_oak_stairs";
    Blocks["SLIME_BLOCK"] = "slime_block";
    Blocks["BARRIER"] = "barrier";
    Blocks["LIGHT"] = "light";
    Blocks["IRON_TRAPDOOR"] = "iron_trapdoor";
    Blocks["PRISMARINE"] = "prismarine";
    Blocks["PRISMARINE_BRICKS"] = "prismarine_bricks";
    Blocks["DARK_PRISMARINE"] = "dark_prismarine";
    Blocks["PRISMARINE_STAIRS"] = "prismarine_stairs";
    Blocks["PRISMARINE_BRICK_STAIRS"] = "prismarine_brick_stairs";
    Blocks["DARK_PRISMARINE_STAIRS"] = "dark_prismarine_stairs";
    Blocks["PRISMARINE_SLAB"] = "prismarine_slab";
    Blocks["PRISMARINE_BRICK_SLAB"] = "prismarine_brick_slab";
    Blocks["DARK_PRISMARINE_SLAB"] = "dark_prismarine_slab";
    Blocks["SEA_LANTERN"] = "sea_lantern";
    Blocks["HAY_BLOCK"] = "hay_block";
    Blocks["WHITE_CARPET"] = "white_carpet";
    Blocks["ORANGE_CARPET"] = "orange_carpet";
    Blocks["MAGENTA_CARPET"] = "magenta_carpet";
    Blocks["LIGHT_BLUE_CARPET"] = "light_blue_carpet";
    Blocks["YELLOW_CARPET"] = "yellow_carpet";
    Blocks["LIME_CARPET"] = "lime_carpet";
    Blocks["PINK_CARPET"] = "pink_carpet";
    Blocks["GRAY_CARPET"] = "gray_carpet";
    Blocks["LIGHT_GRAY_CARPET"] = "light_gray_carpet";
    Blocks["CYAN_CARPET"] = "cyan_carpet";
    Blocks["PURPLE_CARPET"] = "purple_carpet";
    Blocks["BLUE_CARPET"] = "blue_carpet";
    Blocks["BROWN_CARPET"] = "brown_carpet";
    Blocks["GREEN_CARPET"] = "green_carpet";
    Blocks["RED_CARPET"] = "red_carpet";
    Blocks["BLACK_CARPET"] = "black_carpet";
    Blocks["TERRACOTTA"] = "terracotta";
    Blocks["COAL_BLOCK"] = "coal_block";
    Blocks["PACKED_ICE"] = "packed_ice";
    Blocks["SUNFLOWER"] = "sunflower";
    Blocks["LILAC"] = "lilac";
    Blocks["ROSE_BUSH"] = "rose_bush";
    Blocks["PEONY"] = "peony";
    Blocks["TALL_GRASS"] = "tall_grass";
    Blocks["LARGE_FERN"] = "large_fern";
    Blocks["WHITE_BANNER"] = "white_banner";
    Blocks["ORANGE_BANNER"] = "orange_banner";
    Blocks["MAGENTA_BANNER"] = "magenta_banner";
    Blocks["LIGHT_BLUE_BANNER"] = "light_blue_banner";
    Blocks["YELLOW_BANNER"] = "yellow_banner";
    Blocks["LIME_BANNER"] = "lime_banner";
    Blocks["PINK_BANNER"] = "pink_banner";
    Blocks["GRAY_BANNER"] = "gray_banner";
    Blocks["LIGHT_GRAY_BANNER"] = "light_gray_banner";
    Blocks["CYAN_BANNER"] = "cyan_banner";
    Blocks["PURPLE_BANNER"] = "purple_banner";
    Blocks["BLUE_BANNER"] = "blue_banner";
    Blocks["BROWN_BANNER"] = "brown_banner";
    Blocks["GREEN_BANNER"] = "green_banner";
    Blocks["RED_BANNER"] = "red_banner";
    Blocks["BLACK_BANNER"] = "black_banner";
    Blocks["WHITE_WALL_BANNER"] = "white_wall_banner";
    Blocks["ORANGE_WALL_BANNER"] = "orange_wall_banner";
    Blocks["MAGENTA_WALL_BANNER"] = "magenta_wall_banner";
    Blocks["LIGHT_BLUE_WALL_BANNER"] = "light_blue_wall_banner";
    Blocks["YELLOW_WALL_BANNER"] = "yellow_wall_banner";
    Blocks["LIME_WALL_BANNER"] = "lime_wall_banner";
    Blocks["PINK_WALL_BANNER"] = "pink_wall_banner";
    Blocks["GRAY_WALL_BANNER"] = "gray_wall_banner";
    Blocks["LIGHT_GRAY_WALL_BANNER"] = "light_gray_wall_banner";
    Blocks["CYAN_WALL_BANNER"] = "cyan_wall_banner";
    Blocks["PURPLE_WALL_BANNER"] = "purple_wall_banner";
    Blocks["BLUE_WALL_BANNER"] = "blue_wall_banner";
    Blocks["BROWN_WALL_BANNER"] = "brown_wall_banner";
    Blocks["GREEN_WALL_BANNER"] = "green_wall_banner";
    Blocks["RED_WALL_BANNER"] = "red_wall_banner";
    Blocks["BLACK_WALL_BANNER"] = "black_wall_banner";
    Blocks["RED_SANDSTONE"] = "red_sandstone";
    Blocks["CHISELED_RED_SANDSTONE"] = "chiseled_red_sandstone";
    Blocks["CUT_RED_SANDSTONE"] = "cut_red_sandstone";
    Blocks["RED_SANDSTONE_STAIRS"] = "red_sandstone_stairs";
    Blocks["OAK_SLAB"] = "oak_slab";
    Blocks["SPRUCE_SLAB"] = "spruce_slab";
    Blocks["BIRCH_SLAB"] = "birch_slab";
    Blocks["JUNGLE_SLAB"] = "jungle_slab";
    Blocks["ACACIA_SLAB"] = "acacia_slab";
    Blocks["DARK_OAK_SLAB"] = "dark_oak_slab";
    Blocks["STONE_SLAB"] = "stone_slab";
    Blocks["SMOOTH_STONE_SLAB"] = "smooth_stone_slab";
    Blocks["SANDSTONE_SLAB"] = "sandstone_slab";
    Blocks["CUT_SANDSTONE_SLAB"] = "cut_sandstone_slab";
    Blocks["PETRIFIED_OAK_SLAB"] = "petrified_oak_slab";
    Blocks["COBBLESTONE_SLAB"] = "cobblestone_slab";
    Blocks["BRICK_SLAB"] = "brick_slab";
    Blocks["STONE_BRICK_SLAB"] = "stone_brick_slab";
    Blocks["NETHER_BRICK_SLAB"] = "nether_brick_slab";
    Blocks["QUARTZ_SLAB"] = "quartz_slab";
    Blocks["RED_SANDSTONE_SLAB"] = "red_sandstone_slab";
    Blocks["CUT_RED_SANDSTONE_SLAB"] = "cut_red_sandstone_slab";
    Blocks["PURPUR_SLAB"] = "purpur_slab";
    Blocks["SMOOTH_STONE"] = "smooth_stone";
    Blocks["SMOOTH_SANDSTONE"] = "smooth_sandstone";
    Blocks["SMOOTH_QUARTZ"] = "smooth_quartz";
    Blocks["SMOOTH_RED_SANDSTONE"] = "smooth_red_sandstone";
    Blocks["SPRUCE_FENCE_GATE"] = "spruce_fence_gate";
    Blocks["BIRCH_FENCE_GATE"] = "birch_fence_gate";
    Blocks["JUNGLE_FENCE_GATE"] = "jungle_fence_gate";
    Blocks["ACACIA_FENCE_GATE"] = "acacia_fence_gate";
    Blocks["DARK_OAK_FENCE_GATE"] = "dark_oak_fence_gate";
    Blocks["SPRUCE_FENCE"] = "spruce_fence";
    Blocks["BIRCH_FENCE"] = "birch_fence";
    Blocks["JUNGLE_FENCE"] = "jungle_fence";
    Blocks["ACACIA_FENCE"] = "acacia_fence";
    Blocks["DARK_OAK_FENCE"] = "dark_oak_fence";
    Blocks["SPRUCE_DOOR"] = "spruce_door";
    Blocks["BIRCH_DOOR"] = "birch_door";
    Blocks["JUNGLE_DOOR"] = "jungle_door";
    Blocks["ACACIA_DOOR"] = "acacia_door";
    Blocks["DARK_OAK_DOOR"] = "dark_oak_door";
    Blocks["END_ROD"] = "end_rod";
    Blocks["CHORUS_PLANT"] = "chorus_plant";
    Blocks["CHORUS_FLOWER"] = "chorus_flower";
    Blocks["PURPUR_BLOCK"] = "purpur_block";
    Blocks["PURPUR_PILLAR"] = "purpur_pillar";
    Blocks["PURPUR_STAIRS"] = "purpur_stairs";
    Blocks["END_STONE_BRICKS"] = "end_stone_bricks";
    Blocks["BEETROOTS"] = "beetroots";
    Blocks["DIRT_PATH"] = "dirt_path";
    Blocks["END_GATEWAY"] = "end_gateway";
    Blocks["REPEATING_COMMAND_BLOCK"] = "repeating_command_block";
    Blocks["CHAIN_COMMAND_BLOCK"] = "chain_command_block";
    Blocks["FROSTED_ICE"] = "frosted_ice";
    Blocks["MAGMA_BLOCK"] = "magma_block";
    Blocks["NETHER_WART_BLOCK"] = "nether_wart_block";
    Blocks["RED_NETHER_BRICKS"] = "red_nether_bricks";
    Blocks["BONE_BLOCK"] = "bone_block";
    Blocks["STRUCTURE_VOID"] = "structure_void";
    Blocks["OBSERVER"] = "observer";
    Blocks["SHULKER_BOX"] = "shulker_box";
    Blocks["WHITE_SHULKER_BOX"] = "white_shulker_box";
    Blocks["ORANGE_SHULKER_BOX"] = "orange_shulker_box";
    Blocks["MAGENTA_SHULKER_BOX"] = "magenta_shulker_box";
    Blocks["LIGHT_BLUE_SHULKER_BOX"] = "light_blue_shulker_box";
    Blocks["YELLOW_SHULKER_BOX"] = "yellow_shulker_box";
    Blocks["LIME_SHULKER_BOX"] = "lime_shulker_box";
    Blocks["PINK_SHULKER_BOX"] = "pink_shulker_box";
    Blocks["GRAY_SHULKER_BOX"] = "gray_shulker_box";
    Blocks["LIGHT_GRAY_SHULKER_BOX"] = "light_gray_shulker_box";
    Blocks["CYAN_SHULKER_BOX"] = "cyan_shulker_box";
    Blocks["PURPLE_SHULKER_BOX"] = "purple_shulker_box";
    Blocks["BLUE_SHULKER_BOX"] = "blue_shulker_box";
    Blocks["BROWN_SHULKER_BOX"] = "brown_shulker_box";
    Blocks["GREEN_SHULKER_BOX"] = "green_shulker_box";
    Blocks["RED_SHULKER_BOX"] = "red_shulker_box";
    Blocks["BLACK_SHULKER_BOX"] = "black_shulker_box";
    Blocks["WHITE_GLAZED_TERRACOTTA"] = "white_glazed_terracotta";
    Blocks["ORANGE_GLAZED_TERRACOTTA"] = "orange_glazed_terracotta";
    Blocks["MAGENTA_GLAZED_TERRACOTTA"] = "magenta_glazed_terracotta";
    Blocks["LIGHT_BLUE_GLAZED_TERRACOTTA"] = "light_blue_glazed_terracotta";
    Blocks["YELLOW_GLAZED_TERRACOTTA"] = "yellow_glazed_terracotta";
    Blocks["LIME_GLAZED_TERRACOTTA"] = "lime_glazed_terracotta";
    Blocks["PINK_GLAZED_TERRACOTTA"] = "pink_glazed_terracotta";
    Blocks["GRAY_GLAZED_TERRACOTTA"] = "gray_glazed_terracotta";
    Blocks["LIGHT_GRAY_GLAZED_TERRACOTTA"] = "light_gray_glazed_terracotta";
    Blocks["CYAN_GLAZED_TERRACOTTA"] = "cyan_glazed_terracotta";
    Blocks["PURPLE_GLAZED_TERRACOTTA"] = "purple_glazed_terracotta";
    Blocks["BLUE_GLAZED_TERRACOTTA"] = "blue_glazed_terracotta";
    Blocks["BROWN_GLAZED_TERRACOTTA"] = "brown_glazed_terracotta";
    Blocks["GREEN_GLAZED_TERRACOTTA"] = "green_glazed_terracotta";
    Blocks["RED_GLAZED_TERRACOTTA"] = "red_glazed_terracotta";
    Blocks["BLACK_GLAZED_TERRACOTTA"] = "black_glazed_terracotta";
    Blocks["WHITE_CONCRETE"] = "white_concrete";
    Blocks["ORANGE_CONCRETE"] = "orange_concrete";
    Blocks["MAGENTA_CONCRETE"] = "magenta_concrete";
    Blocks["LIGHT_BLUE_CONCRETE"] = "light_blue_concrete";
    Blocks["YELLOW_CONCRETE"] = "yellow_concrete";
    Blocks["LIME_CONCRETE"] = "lime_concrete";
    Blocks["PINK_CONCRETE"] = "pink_concrete";
    Blocks["GRAY_CONCRETE"] = "gray_concrete";
    Blocks["LIGHT_GRAY_CONCRETE"] = "light_gray_concrete";
    Blocks["CYAN_CONCRETE"] = "cyan_concrete";
    Blocks["PURPLE_CONCRETE"] = "purple_concrete";
    Blocks["BLUE_CONCRETE"] = "blue_concrete";
    Blocks["BROWN_CONCRETE"] = "brown_concrete";
    Blocks["GREEN_CONCRETE"] = "green_concrete";
    Blocks["RED_CONCRETE"] = "red_concrete";
    Blocks["BLACK_CONCRETE"] = "black_concrete";
    Blocks["WHITE_CONCRETE_POWDER"] = "white_concrete_powder";
    Blocks["ORANGE_CONCRETE_POWDER"] = "orange_concrete_powder";
    Blocks["MAGENTA_CONCRETE_POWDER"] = "magenta_concrete_powder";
    Blocks["LIGHT_BLUE_CONCRETE_POWDER"] = "light_blue_concrete_powder";
    Blocks["YELLOW_CONCRETE_POWDER"] = "yellow_concrete_powder";
    Blocks["LIME_CONCRETE_POWDER"] = "lime_concrete_powder";
    Blocks["PINK_CONCRETE_POWDER"] = "pink_concrete_powder";
    Blocks["GRAY_CONCRETE_POWDER"] = "gray_concrete_powder";
    Blocks["LIGHT_GRAY_CONCRETE_POWDER"] = "light_gray_concrete_powder";
    Blocks["CYAN_CONCRETE_POWDER"] = "cyan_concrete_powder";
    Blocks["PURPLE_CONCRETE_POWDER"] = "purple_concrete_powder";
    Blocks["BLUE_CONCRETE_POWDER"] = "blue_concrete_powder";
    Blocks["BROWN_CONCRETE_POWDER"] = "brown_concrete_powder";
    Blocks["GREEN_CONCRETE_POWDER"] = "green_concrete_powder";
    Blocks["RED_CONCRETE_POWDER"] = "red_concrete_powder";
    Blocks["BLACK_CONCRETE_POWDER"] = "black_concrete_powder";
    Blocks["KELP"] = "kelp";
    Blocks["KELP_PLANT"] = "kelp_plant";
    Blocks["DRIED_KELP_BLOCK"] = "dried_kelp_block";
    Blocks["TURTLE_EGG"] = "turtle_egg";
    Blocks["DEAD_TUBE_CORAL_BLOCK"] = "dead_tube_coral_block";
    Blocks["DEAD_BRAIN_CORAL_BLOCK"] = "dead_brain_coral_block";
    Blocks["DEAD_BUBBLE_CORAL_BLOCK"] = "dead_bubble_coral_block";
    Blocks["DEAD_FIRE_CORAL_BLOCK"] = "dead_fire_coral_block";
    Blocks["DEAD_HORN_CORAL_BLOCK"] = "dead_horn_coral_block";
    Blocks["TUBE_CORAL_BLOCK"] = "tube_coral_block";
    Blocks["BRAIN_CORAL_BLOCK"] = "brain_coral_block";
    Blocks["BUBBLE_CORAL_BLOCK"] = "bubble_coral_block";
    Blocks["FIRE_CORAL_BLOCK"] = "fire_coral_block";
    Blocks["HORN_CORAL_BLOCK"] = "horn_coral_block";
    Blocks["DEAD_TUBE_CORAL"] = "dead_tube_coral";
    Blocks["DEAD_BRAIN_CORAL"] = "dead_brain_coral";
    Blocks["DEAD_BUBBLE_CORAL"] = "dead_bubble_coral";
    Blocks["DEAD_FIRE_CORAL"] = "dead_fire_coral";
    Blocks["DEAD_HORN_CORAL"] = "dead_horn_coral";
    Blocks["TUBE_CORAL"] = "tube_coral";
    Blocks["BRAIN_CORAL"] = "brain_coral";
    Blocks["BUBBLE_CORAL"] = "bubble_coral";
    Blocks["FIRE_CORAL"] = "fire_coral";
    Blocks["HORN_CORAL"] = "horn_coral";
    Blocks["DEAD_TUBE_CORAL_FAN"] = "dead_tube_coral_fan";
    Blocks["DEAD_BRAIN_CORAL_FAN"] = "dead_brain_coral_fan";
    Blocks["DEAD_BUBBLE_CORAL_FAN"] = "dead_bubble_coral_fan";
    Blocks["DEAD_FIRE_CORAL_FAN"] = "dead_fire_coral_fan";
    Blocks["DEAD_HORN_CORAL_FAN"] = "dead_horn_coral_fan";
    Blocks["TUBE_CORAL_FAN"] = "tube_coral_fan";
    Blocks["BRAIN_CORAL_FAN"] = "brain_coral_fan";
    Blocks["BUBBLE_CORAL_FAN"] = "bubble_coral_fan";
    Blocks["FIRE_CORAL_FAN"] = "fire_coral_fan";
    Blocks["HORN_CORAL_FAN"] = "horn_coral_fan";
    Blocks["DEAD_TUBE_CORAL_WALL_FAN"] = "dead_tube_coral_wall_fan";
    Blocks["DEAD_BRAIN_CORAL_WALL_FAN"] = "dead_brain_coral_wall_fan";
    Blocks["DEAD_BUBBLE_CORAL_WALL_FAN"] = "dead_bubble_coral_wall_fan";
    Blocks["DEAD_FIRE_CORAL_WALL_FAN"] = "dead_fire_coral_wall_fan";
    Blocks["DEAD_HORN_CORAL_WALL_FAN"] = "dead_horn_coral_wall_fan";
    Blocks["TUBE_CORAL_WALL_FAN"] = "tube_coral_wall_fan";
    Blocks["BRAIN_CORAL_WALL_FAN"] = "brain_coral_wall_fan";
    Blocks["BUBBLE_CORAL_WALL_FAN"] = "bubble_coral_wall_fan";
    Blocks["FIRE_CORAL_WALL_FAN"] = "fire_coral_wall_fan";
    Blocks["HORN_CORAL_WALL_FAN"] = "horn_coral_wall_fan";
    Blocks["SEA_PICKLE"] = "sea_pickle";
    Blocks["BLUE_ICE"] = "blue_ice";
    Blocks["CONDUIT"] = "conduit";
    Blocks["BAMBOO_SAPLING"] = "bamboo_sapling";
    Blocks["BAMBOO"] = "bamboo";
    Blocks["POTTED_BAMBOO"] = "potted_bamboo";
    Blocks["VOID_AIR"] = "void_air";
    Blocks["CAVE_AIR"] = "cave_air";
    Blocks["BUBBLE_COLUMN"] = "bubble_column";
    Blocks["POLISHED_GRANITE_STAIRS"] = "polished_granite_stairs";
    Blocks["SMOOTH_RED_SANDSTONE_STAIRS"] = "smooth_red_sandstone_stairs";
    Blocks["MOSSY_STONE_BRICK_STAIRS"] = "mossy_stone_brick_stairs";
    Blocks["POLISHED_DIORITE_STAIRS"] = "polished_diorite_stairs";
    Blocks["MOSSY_COBBLESTONE_STAIRS"] = "mossy_cobblestone_stairs";
    Blocks["END_STONE_BRICK_STAIRS"] = "end_stone_brick_stairs";
    Blocks["STONE_STAIRS"] = "stone_stairs";
    Blocks["SMOOTH_SANDSTONE_STAIRS"] = "smooth_sandstone_stairs";
    Blocks["SMOOTH_QUARTZ_STAIRS"] = "smooth_quartz_stairs";
    Blocks["GRANITE_STAIRS"] = "granite_stairs";
    Blocks["ANDESITE_STAIRS"] = "andesite_stairs";
    Blocks["RED_NETHER_BRICK_STAIRS"] = "red_nether_brick_stairs";
    Blocks["POLISHED_ANDESITE_STAIRS"] = "polished_andesite_stairs";
    Blocks["DIORITE_STAIRS"] = "diorite_stairs";
    Blocks["POLISHED_GRANITE_SLAB"] = "polished_granite_slab";
    Blocks["SMOOTH_RED_SANDSTONE_SLAB"] = "smooth_red_sandstone_slab";
    Blocks["MOSSY_STONE_BRICK_SLAB"] = "mossy_stone_brick_slab";
    Blocks["POLISHED_DIORITE_SLAB"] = "polished_diorite_slab";
    Blocks["MOSSY_COBBLESTONE_SLAB"] = "mossy_cobblestone_slab";
    Blocks["END_STONE_BRICK_SLAB"] = "end_stone_brick_slab";
    Blocks["SMOOTH_SANDSTONE_SLAB"] = "smooth_sandstone_slab";
    Blocks["SMOOTH_QUARTZ_SLAB"] = "smooth_quartz_slab";
    Blocks["GRANITE_SLAB"] = "granite_slab";
    Blocks["ANDESITE_SLAB"] = "andesite_slab";
    Blocks["RED_NETHER_BRICK_SLAB"] = "red_nether_brick_slab";
    Blocks["POLISHED_ANDESITE_SLAB"] = "polished_andesite_slab";
    Blocks["DIORITE_SLAB"] = "diorite_slab";
    Blocks["BRICK_WALL"] = "brick_wall";
    Blocks["PRISMARINE_WALL"] = "prismarine_wall";
    Blocks["RED_SANDSTONE_WALL"] = "red_sandstone_wall";
    Blocks["MOSSY_STONE_BRICK_WALL"] = "mossy_stone_brick_wall";
    Blocks["GRANITE_WALL"] = "granite_wall";
    Blocks["STONE_BRICK_WALL"] = "stone_brick_wall";
    Blocks["NETHER_BRICK_WALL"] = "nether_brick_wall";
    Blocks["ANDESITE_WALL"] = "andesite_wall";
    Blocks["RED_NETHER_BRICK_WALL"] = "red_nether_brick_wall";
    Blocks["SANDSTONE_WALL"] = "sandstone_wall";
    Blocks["END_STONE_BRICK_WALL"] = "end_stone_brick_wall";
    Blocks["DIORITE_WALL"] = "diorite_wall";
    Blocks["SCAFFOLDING"] = "scaffolding";
    Blocks["LOOM"] = "loom";
    Blocks["BARREL"] = "barrel";
    Blocks["SMOKER"] = "smoker";
    Blocks["BLAST_FURNACE"] = "blast_furnace";
    Blocks["CARTOGRAPHY_TABLE"] = "cartography_table";
    Blocks["FLETCHING_TABLE"] = "fletching_table";
    Blocks["GRINDSTONE"] = "grindstone";
    Blocks["LECTERN"] = "lectern";
    Blocks["SMITHING_TABLE"] = "smithing_table";
    Blocks["STONECUTTER"] = "stonecutter";
    Blocks["BELL"] = "bell";
    Blocks["LANTERN"] = "lantern";
    Blocks["SOUL_LANTERN"] = "soul_lantern";
    Blocks["CAMPFIRE"] = "campfire";
    Blocks["SOUL_CAMPFIRE"] = "soul_campfire";
    Blocks["SWEET_BERRY_BUSH"] = "sweet_berry_bush";
    Blocks["WARPED_STEM"] = "warped_stem";
    Blocks["STRIPPED_WARPED_STEM"] = "stripped_warped_stem";
    Blocks["WARPED_HYPHAE"] = "warped_hyphae";
    Blocks["STRIPPED_WARPED_HYPHAE"] = "stripped_warped_hyphae";
    Blocks["WARPED_NYLIUM"] = "warped_nylium";
    Blocks["WARPED_FUNGUS"] = "warped_fungus";
    Blocks["WARPED_WART_BLOCK"] = "warped_wart_block";
    Blocks["WARPED_ROOTS"] = "warped_roots";
    Blocks["NETHER_SPROUTS"] = "nether_sprouts";
    Blocks["CRIMSON_STEM"] = "crimson_stem";
    Blocks["STRIPPED_CRIMSON_STEM"] = "stripped_crimson_stem";
    Blocks["CRIMSON_HYPHAE"] = "crimson_hyphae";
    Blocks["STRIPPED_CRIMSON_HYPHAE"] = "stripped_crimson_hyphae";
    Blocks["CRIMSON_NYLIUM"] = "crimson_nylium";
    Blocks["CRIMSON_FUNGUS"] = "crimson_fungus";
    Blocks["SHROOMLIGHT"] = "shroomlight";
    Blocks["WEEPING_VINES"] = "weeping_vines";
    Blocks["WEEPING_VINES_PLANT"] = "weeping_vines_plant";
    Blocks["TWISTING_VINES"] = "twisting_vines";
    Blocks["TWISTING_VINES_PLANT"] = "twisting_vines_plant";
    Blocks["CRIMSON_ROOTS"] = "crimson_roots";
    Blocks["CRIMSON_PLANKS"] = "crimson_planks";
    Blocks["WARPED_PLANKS"] = "warped_planks";
    Blocks["CRIMSON_SLAB"] = "crimson_slab";
    Blocks["WARPED_SLAB"] = "warped_slab";
    Blocks["CRIMSON_PRESSURE_PLATE"] = "crimson_pressure_plate";
    Blocks["WARPED_PRESSURE_PLATE"] = "warped_pressure_plate";
    Blocks["CRIMSON_FENCE"] = "crimson_fence";
    Blocks["WARPED_FENCE"] = "warped_fence";
    Blocks["CRIMSON_TRAPDOOR"] = "crimson_trapdoor";
    Blocks["WARPED_TRAPDOOR"] = "warped_trapdoor";
    Blocks["CRIMSON_FENCE_GATE"] = "crimson_fence_gate";
    Blocks["WARPED_FENCE_GATE"] = "warped_fence_gate";
    Blocks["CRIMSON_STAIRS"] = "crimson_stairs";
    Blocks["WARPED_STAIRS"] = "warped_stairs";
    Blocks["CRIMSON_BUTTON"] = "crimson_button";
    Blocks["WARPED_BUTTON"] = "warped_button";
    Blocks["CRIMSON_DOOR"] = "crimson_door";
    Blocks["WARPED_DOOR"] = "warped_door";
    Blocks["CRIMSON_SIGN"] = "crimson_sign";
    Blocks["WARPED_SIGN"] = "warped_sign";
    Blocks["CRIMSON_WALL_SIGN"] = "crimson_wall_sign";
    Blocks["WARPED_WALL_SIGN"] = "warped_wall_sign";
    Blocks["STRUCTURE_BLOCK"] = "structure_block";
    Blocks["JIGSAW"] = "jigsaw";
    Blocks["COMPOSTER"] = "composter";
    Blocks["TARGET"] = "target";
    Blocks["BEE_NEST"] = "bee_nest";
    Blocks["BEEHIVE"] = "beehive";
    Blocks["HONEY_BLOCK"] = "honey_block";
    Blocks["HONEYCOMB_BLOCK"] = "honeycomb_block";
    Blocks["NETHERITE_BLOCK"] = "netherite_block";
    Blocks["ANCIENT_DEBRIS"] = "ancient_debris";
    Blocks["CRYING_OBSIDIAN"] = "crying_obsidian";
    Blocks["RESPAWN_ANCHOR"] = "respawn_anchor";
    Blocks["POTTED_CRIMSON_FUNGUS"] = "potted_crimson_fungus";
    Blocks["POTTED_WARPED_FUNGUS"] = "potted_warped_fungus";
    Blocks["POTTED_CRIMSON_ROOTS"] = "potted_crimson_roots";
    Blocks["POTTED_WARPED_ROOTS"] = "potted_warped_roots";
    Blocks["LODESTONE"] = "lodestone";
    Blocks["BLACKSTONE"] = "blackstone";
    Blocks["BLACKSTONE_STAIRS"] = "blackstone_stairs";
    Blocks["BLACKSTONE_WALL"] = "blackstone_wall";
    Blocks["BLACKSTONE_SLAB"] = "blackstone_slab";
    Blocks["POLISHED_BLACKSTONE"] = "polished_blackstone";
    Blocks["POLISHED_BLACKSTONE_BRICKS"] = "polished_blackstone_bricks";
    Blocks["CRACKED_POLISHED_BLACKSTONE_BRICKS"] = "cracked_polished_blackstone_bricks";
    Blocks["CHISELED_POLISHED_BLACKSTONE"] = "chiseled_polished_blackstone";
    Blocks["POLISHED_BLACKSTONE_BRICK_SLAB"] = "polished_blackstone_brick_slab";
    Blocks["POLISHED_BLACKSTONE_BRICK_STAIRS"] = "polished_blackstone_brick_stairs";
    Blocks["POLISHED_BLACKSTONE_BRICK_WALL"] = "polished_blackstone_brick_wall";
    Blocks["GILDED_BLACKSTONE"] = "gilded_blackstone";
    Blocks["POLISHED_BLACKSTONE_STAIRS"] = "polished_blackstone_stairs";
    Blocks["POLISHED_BLACKSTONE_SLAB"] = "polished_blackstone_slab";
    Blocks["POLISHED_BLACKSTONE_PRESSURE_PLATE"] = "polished_blackstone_pressure_plate";
    Blocks["POLISHED_BLACKSTONE_BUTTON"] = "polished_blackstone_button";
    Blocks["POLISHED_BLACKSTONE_WALL"] = "polished_blackstone_wall";
    Blocks["CHISELED_NETHER_BRICKS"] = "chiseled_nether_bricks";
    Blocks["CRACKED_NETHER_BRICKS"] = "cracked_nether_bricks";
    Blocks["QUARTZ_BRICKS"] = "quartz_bricks";
    Blocks["CANDLE"] = "candle";
    Blocks["WHITE_CANDLE"] = "white_candle";
    Blocks["ORANGE_CANDLE"] = "orange_candle";
    Blocks["MAGENTA_CANDLE"] = "magenta_candle";
    Blocks["LIGHT_BLUE_CANDLE"] = "light_blue_candle";
    Blocks["YELLOW_CANDLE"] = "yellow_candle";
    Blocks["LIME_CANDLE"] = "lime_candle";
    Blocks["PINK_CANDLE"] = "pink_candle";
    Blocks["GRAY_CANDLE"] = "gray_candle";
    Blocks["LIGHT_GRAY_CANDLE"] = "light_gray_candle";
    Blocks["CYAN_CANDLE"] = "cyan_candle";
    Blocks["PURPLE_CANDLE"] = "purple_candle";
    Blocks["BLUE_CANDLE"] = "blue_candle";
    Blocks["BROWN_CANDLE"] = "brown_candle";
    Blocks["GREEN_CANDLE"] = "green_candle";
    Blocks["RED_CANDLE"] = "red_candle";
    Blocks["BLACK_CANDLE"] = "black_candle";
    Blocks["CANDLE_CAKE"] = "candle_cake";
    Blocks["WHITE_CANDLE_CAKE"] = "white_candle_cake";
    Blocks["ORANGE_CANDLE_CAKE"] = "orange_candle_cake";
    Blocks["MAGENTA_CANDLE_CAKE"] = "magenta_candle_cake";
    Blocks["LIGHT_BLUE_CANDLE_CAKE"] = "light_blue_candle_cake";
    Blocks["YELLOW_CANDLE_CAKE"] = "yellow_candle_cake";
    Blocks["LIME_CANDLE_CAKE"] = "lime_candle_cake";
    Blocks["PINK_CANDLE_CAKE"] = "pink_candle_cake";
    Blocks["GRAY_CANDLE_CAKE"] = "gray_candle_cake";
    Blocks["LIGHT_GRAY_CANDLE_CAKE"] = "light_gray_candle_cake";
    Blocks["CYAN_CANDLE_CAKE"] = "cyan_candle_cake";
    Blocks["PURPLE_CANDLE_CAKE"] = "purple_candle_cake";
    Blocks["BLUE_CANDLE_CAKE"] = "blue_candle_cake";
    Blocks["BROWN_CANDLE_CAKE"] = "brown_candle_cake";
    Blocks["GREEN_CANDLE_CAKE"] = "green_candle_cake";
    Blocks["RED_CANDLE_CAKE"] = "red_candle_cake";
    Blocks["BLACK_CANDLE_CAKE"] = "black_candle_cake";
    Blocks["AMETHYST_BLOCK"] = "amethyst_block";
    Blocks["BUDDING_AMETHYST"] = "budding_amethyst";
    Blocks["AMETHYST_CLUSTER"] = "amethyst_cluster";
    Blocks["LARGE_AMETHYST_BUD"] = "large_amethyst_bud";
    Blocks["MEDIUM_AMETHYST_BUD"] = "medium_amethyst_bud";
    Blocks["SMALL_AMETHYST_BUD"] = "small_amethyst_bud";
    Blocks["TUFF"] = "tuff";
    Blocks["CALCITE"] = "calcite";
    Blocks["TINTED_GLASS"] = "tinted_glass";
    Blocks["POWDER_SNOW"] = "powder_snow";
    Blocks["SCULK_SENSOR"] = "sculk_sensor";
    Blocks["OXIDIZED_COPPER"] = "oxidized_copper";
    Blocks["WEATHERED_COPPER"] = "weathered_copper";
    Blocks["EXPOSED_COPPER"] = "exposed_copper";
    Blocks["COPPER_BLOCK"] = "copper_block";
    Blocks["COPPER_ORE"] = "copper_ore";
    Blocks["DEEPSLATE_COPPER_ORE"] = "deepslate_copper_ore";
    Blocks["OXIDIZED_CUT_COPPER"] = "oxidized_cut_copper";
    Blocks["WEATHERED_CUT_COPPER"] = "weathered_cut_copper";
    Blocks["EXPOSED_CUT_COPPER"] = "exposed_cut_copper";
    Blocks["CUT_COPPER"] = "cut_copper";
    Blocks["OXIDIZED_CUT_COPPER_STAIRS"] = "oxidized_cut_copper_stairs";
    Blocks["WEATHERED_CUT_COPPER_STAIRS"] = "weathered_cut_copper_stairs";
    Blocks["EXPOSED_CUT_COPPER_STAIRS"] = "exposed_cut_copper_stairs";
    Blocks["CUT_COPPER_STAIRS"] = "cut_copper_stairs";
    Blocks["OXIDIZED_CUT_COPPER_SLAB"] = "oxidized_cut_copper_slab";
    Blocks["WEATHERED_CUT_COPPER_SLAB"] = "weathered_cut_copper_slab";
    Blocks["EXPOSED_CUT_COPPER_SLAB"] = "exposed_cut_copper_slab";
    Blocks["CUT_COPPER_SLAB"] = "cut_copper_slab";
    Blocks["WAXED_COPPER_BLOCK"] = "waxed_copper_block";
    Blocks["WAXED_WEATHERED_COPPER"] = "waxed_weathered_copper";
    Blocks["WAXED_EXPOSED_COPPER"] = "waxed_exposed_copper";
    Blocks["WAXED_OXIDIZED_COPPER"] = "waxed_oxidized_copper";
    Blocks["WAXED_OXIDIZED_CUT_COPPER"] = "waxed_oxidized_cut_copper";
    Blocks["WAXED_WEATHERED_CUT_COPPER"] = "waxed_weathered_cut_copper";
    Blocks["WAXED_EXPOSED_CUT_COPPER"] = "waxed_exposed_cut_copper";
    Blocks["WAXED_CUT_COPPER"] = "waxed_cut_copper";
    Blocks["WAXED_OXIDIZED_CUT_COPPER_STAIRS"] = "waxed_oxidized_cut_copper_stairs";
    Blocks["WAXED_WEATHERED_CUT_COPPER_STAIRS"] = "waxed_weathered_cut_copper_stairs";
    Blocks["WAXED_EXPOSED_CUT_COPPER_STAIRS"] = "waxed_exposed_cut_copper_stairs";
    Blocks["WAXED_CUT_COPPER_STAIRS"] = "waxed_cut_copper_stairs";
    Blocks["WAXED_OXIDIZED_CUT_COPPER_SLAB"] = "waxed_oxidized_cut_copper_slab";
    Blocks["WAXED_WEATHERED_CUT_COPPER_SLAB"] = "waxed_weathered_cut_copper_slab";
    Blocks["WAXED_EXPOSED_CUT_COPPER_SLAB"] = "waxed_exposed_cut_copper_slab";
    Blocks["WAXED_CUT_COPPER_SLAB"] = "waxed_cut_copper_slab";
    Blocks["LIGHTNING_ROD"] = "lightning_rod";
    Blocks["POINTED_DRIPSTONE"] = "pointed_dripstone";
    Blocks["DRIPSTONE_BLOCK"] = "dripstone_block";
    Blocks["CAVE_VINES"] = "cave_vines";
    Blocks["CAVE_VINES_PLANT"] = "cave_vines_plant";
    Blocks["SPORE_BLOSSOM"] = "spore_blossom";
    Blocks["AZALEA"] = "azalea";
    Blocks["FLOWERING_AZALEA"] = "flowering_azalea";
    Blocks["MOSS_CARPET"] = "moss_carpet";
    Blocks["MOSS_BLOCK"] = "moss_block";
    Blocks["BIG_DRIPLEAF"] = "big_dripleaf";
    Blocks["BIG_DRIPLEAF_STEM"] = "big_dripleaf_stem";
    Blocks["SMALL_DRIPLEAF"] = "small_dripleaf";
    Blocks["HANGING_ROOTS"] = "hanging_roots";
    Blocks["ROOTED_DIRT"] = "rooted_dirt";
    Blocks["DEEPSLATE"] = "deepslate";
    Blocks["COBBLED_DEEPSLATE"] = "cobbled_deepslate";
    Blocks["COBBLED_DEEPSLATE_STAIRS"] = "cobbled_deepslate_stairs";
    Blocks["COBBLED_DEEPSLATE_SLAB"] = "cobbled_deepslate_slab";
    Blocks["COBBLED_DEEPSLATE_WALL"] = "cobbled_deepslate_wall";
    Blocks["POLISHED_DEEPSLATE"] = "polished_deepslate";
    Blocks["POLISHED_DEEPSLATE_STAIRS"] = "polished_deepslate_stairs";
    Blocks["POLISHED_DEEPSLATE_SLAB"] = "polished_deepslate_slab";
    Blocks["POLISHED_DEEPSLATE_WALL"] = "polished_deepslate_wall";
    Blocks["DEEPSLATE_TILES"] = "deepslate_tiles";
    Blocks["DEEPSLATE_TILE_STAIRS"] = "deepslate_tile_stairs";
    Blocks["DEEPSLATE_TILE_SLAB"] = "deepslate_tile_slab";
    Blocks["DEEPSLATE_TILE_WALL"] = "deepslate_tile_wall";
    Blocks["DEEPSLATE_BRICKS"] = "deepslate_bricks";
    Blocks["DEEPSLATE_BRICK_STAIRS"] = "deepslate_brick_stairs";
    Blocks["DEEPSLATE_BRICK_SLAB"] = "deepslate_brick_slab";
    Blocks["DEEPSLATE_BRICK_WALL"] = "deepslate_brick_wall";
    Blocks["CHISELED_DEEPSLATE"] = "chiseled_deepslate";
    Blocks["CRACKED_DEEPSLATE_BRICKS"] = "cracked_deepslate_bricks";
    Blocks["CRACKED_DEEPSLATE_TILES"] = "cracked_deepslate_tiles";
    Blocks["INFESTED_DEEPSLATE"] = "infested_deepslate";
    Blocks["SMOOTH_BASALT"] = "smooth_basalt";
    Blocks["RAW_IRON_BLOCK"] = "raw_iron_block";
    Blocks["RAW_COPPER_BLOCK"] = "raw_copper_block";
    Blocks["RAW_GOLD_BLOCK"] = "raw_gold_block";
    Blocks["POTTED_AZALEA"] = "potted_azalea_bush";
    Blocks["POTTED_FLOWERING_AZALEA"] = "potted_flowering_azalea_bush";
})(Blocks || (Blocks = {}));

function unsignedShift64(num, shift) {
    return BigInt.asUintN(64, num) >> shift;
}
function clamp64(num) {
    return BigInt.asIntN(64, num);
}
function rotateLeft64(n, bits) {
    const b = BigInt.asUintN(64, n);
    const shifted = b << bits;
    const lo = BigInt.asUintN(64, shifted >> 64n);
    const hi = BigInt.asUintN(64, shifted);
    return lo | hi;
}
function clamp(value, min, max) {
    if (value < min) {
        return min;
    }
    else {
        return value > max ? max : value;
    }
}
function toUnsignedLong(n) {
    return BigInt.asUintN(64, BigInt(n)) & 0xffffffffn;
}
function toUnsignedInt(n) {
    return BigInt.asUintN(32, BigInt(n));
}
function toLong(n) {
    return BigInt(n);
}
function toInt(n) {
    return Number(BigInt.asIntN(32, n));
}
function remainderUnsigned32(divident, divisor) {
    const result = toUnsignedInt(divident) % toUnsignedInt(divisor);
    return toInt(result);
}
function fromBytes64(b1, b2, b3, b4, b5, b6, b7, b8) {
    return clamp64((BigInt(b1) << 56n) |
        (BigInt(b2) << 48n) |
        (BigInt(b3) << 40n) |
        (BigInt(b4) << 32n) |
        (BigInt(b5) << 24n) |
        (BigInt(b6) << 16n) |
        (BigInt(b7) << 8n) |
        BigInt(b8));
}
function binarySearch(startIndex, endIndex, predicate) {
    let i = endIndex - startIndex;
    while (i > 0) {
        const j = Math.trunc(i / 2);
        const k = startIndex + j;
        if (predicate(k)) {
            i = j;
        }
        else {
            startIndex = k + 1;
            i -= j + 1;
        }
    }
    return startIndex;
}
function lerp(t, v0, v1) {
    return v0 + t * (v1 - v0);
}
function lerp2(xt, yt, x0, x1, y0, y1) {
    return lerp(yt, lerp(xt, x0, x1), lerp(xt, y0, y1));
}
function lerp3(xt, yt, zt, x0, x1, y0, y1, x2, x3, y2, y3) {
    return lerp(zt, lerp2(xt, yt, x0, x1, y0, y1), lerp2(xt, yt, x2, x3, y2, y3));
}
function smoothstep(v) {
    return v * v * v * (v * (v * 6.0 - 15.0) + 10.0);
}
function smoothstepDerivative(v) {
    return 30.0 * v * v * (v - 1.0) * (v - 1.0);
}
function square(num) {
    return num * num;
}
function getSeed(p_14131_, p_14132_, p_14133_) {
    let i = toLong(toInt(toLong(p_14131_) * 3129871n)) ^
        clamp64(toLong(p_14133_) * 116129781n) ^
        toLong(p_14132_);
    i = clamp64(i * i * 42317861n + i * 11n);
    return i >> 16n;
}
function floor(num) {
    return Math.floor(num);
}
function lfloor(num) {
    return Math.floor(num);
}
function floorDiv(x, y) {
    return Math.floor(x / y);
}
function intFloorDiv(x, y) {
    return Math.floor(x / y);
}
function clampedLerp(v0, v1, t) {
    if (t < 0.0) {
        return v0;
    }
    else {
        return t > 1.0 ? v1 : lerp(t, v0, v1);
    }
}
function frac(num) {
    return num - lfloor(num);
}

var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

function getDefaultExportFromCjs (x) {
	return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
}

function getDefaultExportFromNamespaceIfPresent (n) {
	return n && Object.prototype.hasOwnProperty.call(n, 'default') ? n['default'] : n;
}

function getDefaultExportFromNamespaceIfNotNamed (n) {
	return n && Object.prototype.hasOwnProperty.call(n, 'default') && Object.keys(n).length === 1 ? n['default'] : n;
}

function getAugmentedNamespace(n) {
	if (n.__esModule) return n;
	var a = Object.defineProperty({}, '__esModule', {value: true});
	Object.keys(n).forEach(function (k) {
		var d = Object.getOwnPropertyDescriptor(n, k);
		Object.defineProperty(a, k, d.get ? d : {
			enumerable: true,
			get: function () {
				return n[k];
			}
		});
	});
	return a;
}

function commonjsRequire (path) {
	throw new Error('Could not dynamically require "' + path + '". Please configure the dynamicRequireTargets or/and ignoreDynamicRequires option of @rollup/plugin-commonjs appropriately for this require call to work.');
}

var md5$1 = {exports: {}};

var crypt$1 = {exports: {}};

(function() {
  var base64map
      = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/',

  crypt = {
    // Bit-wise rotation left
    rotl: function(n, b) {
      return (n << b) | (n >>> (32 - b));
    },

    // Bit-wise rotation right
    rotr: function(n, b) {
      return (n << (32 - b)) | (n >>> b);
    },

    // Swap big-endian to little-endian and vice versa
    endian: function(n) {
      // If number given, swap endian
      if (n.constructor == Number) {
        return crypt.rotl(n, 8) & 0x00FF00FF | crypt.rotl(n, 24) & 0xFF00FF00;
      }

      // Else, assume array and swap all items
      for (var i = 0; i < n.length; i++)
        n[i] = crypt.endian(n[i]);
      return n;
    },

    // Generate an array of any length of random bytes
    randomBytes: function(n) {
      for (var bytes = []; n > 0; n--)
        bytes.push(Math.floor(Math.random() * 256));
      return bytes;
    },

    // Convert a byte array to big-endian 32-bit words
    bytesToWords: function(bytes) {
      for (var words = [], i = 0, b = 0; i < bytes.length; i++, b += 8)
        words[b >>> 5] |= bytes[i] << (24 - b % 32);
      return words;
    },

    // Convert big-endian 32-bit words to a byte array
    wordsToBytes: function(words) {
      for (var bytes = [], b = 0; b < words.length * 32; b += 8)
        bytes.push((words[b >>> 5] >>> (24 - b % 32)) & 0xFF);
      return bytes;
    },

    // Convert a byte array to a hex string
    bytesToHex: function(bytes) {
      for (var hex = [], i = 0; i < bytes.length; i++) {
        hex.push((bytes[i] >>> 4).toString(16));
        hex.push((bytes[i] & 0xF).toString(16));
      }
      return hex.join('');
    },

    // Convert a hex string to a byte array
    hexToBytes: function(hex) {
      for (var bytes = [], c = 0; c < hex.length; c += 2)
        bytes.push(parseInt(hex.substr(c, 2), 16));
      return bytes;
    },

    // Convert a byte array to a base-64 string
    bytesToBase64: function(bytes) {
      for (var base64 = [], i = 0; i < bytes.length; i += 3) {
        var triplet = (bytes[i] << 16) | (bytes[i + 1] << 8) | bytes[i + 2];
        for (var j = 0; j < 4; j++)
          if (i * 8 + j * 6 <= bytes.length * 8)
            base64.push(base64map.charAt((triplet >>> 6 * (3 - j)) & 0x3F));
          else
            base64.push('=');
      }
      return base64.join('');
    },

    // Convert a base-64 string to a byte array
    base64ToBytes: function(base64) {
      // Remove non-base-64 characters
      base64 = base64.replace(/[^A-Z0-9+\/]/ig, '');

      for (var bytes = [], i = 0, imod4 = 0; i < base64.length;
          imod4 = ++i % 4) {
        if (imod4 == 0) continue;
        bytes.push(((base64map.indexOf(base64.charAt(i - 1))
            & (Math.pow(2, -2 * imod4 + 8) - 1)) << (imod4 * 2))
            | (base64map.indexOf(base64.charAt(i)) >>> (6 - imod4 * 2)));
      }
      return bytes;
    }
  };

  crypt$1.exports = crypt;
})();

var crypt = crypt$1.exports;

var charenc = {
  // UTF-8 encoding
  utf8: {
    // Convert a string to a byte array
    stringToBytes: function(str) {
      return charenc.bin.stringToBytes(unescape(encodeURIComponent(str)));
    },

    // Convert a byte array to a string
    bytesToString: function(bytes) {
      return decodeURIComponent(escape(charenc.bin.bytesToString(bytes)));
    }
  },

  // Binary encoding
  bin: {
    // Convert a string to a byte array
    stringToBytes: function(str) {
      for (var bytes = [], i = 0; i < str.length; i++)
        bytes.push(str.charCodeAt(i) & 0xFF);
      return bytes;
    },

    // Convert a byte array to a string
    bytesToString: function(bytes) {
      for (var str = [], i = 0; i < bytes.length; i++)
        str.push(String.fromCharCode(bytes[i]));
      return str.join('');
    }
  }
};

var charenc_1 = charenc;

/*!
 * Determine if an object is a Buffer
 *
 * @author   Feross Aboukhadijeh <https://feross.org>
 * @license  MIT
 */

// The _isBuffer check is for Safari 5-7 support, because it's missing
// Object.prototype.constructor. Remove this eventually
var isBuffer_1 = function (obj) {
  return obj != null && (isBuffer(obj) || isSlowBuffer(obj) || !!obj._isBuffer)
};

function isBuffer (obj) {
  return !!obj.constructor && typeof obj.constructor.isBuffer === 'function' && obj.constructor.isBuffer(obj)
}

// For Node v0.10 support. Remove this eventually.
function isSlowBuffer (obj) {
  return typeof obj.readFloatLE === 'function' && typeof obj.slice === 'function' && isBuffer(obj.slice(0, 0))
}

(function(){
  var crypt = crypt$1.exports,
      utf8 = charenc_1.utf8,
      isBuffer = isBuffer_1,
      bin = charenc_1.bin,

  // The core
  md5 = function (message, options) {
    // Convert to byte array
    if (message.constructor == String)
      if (options && options.encoding === 'binary')
        message = bin.stringToBytes(message);
      else
        message = utf8.stringToBytes(message);
    else if (isBuffer(message))
      message = Array.prototype.slice.call(message, 0);
    else if (!Array.isArray(message) && message.constructor !== Uint8Array)
      message = message.toString();
    // else, assume byte array already

    var m = crypt.bytesToWords(message),
        l = message.length * 8,
        a =  1732584193,
        b = -271733879,
        c = -1732584194,
        d =  271733878;

    // Swap endian
    for (var i = 0; i < m.length; i++) {
      m[i] = ((m[i] <<  8) | (m[i] >>> 24)) & 0x00FF00FF |
             ((m[i] << 24) | (m[i] >>>  8)) & 0xFF00FF00;
    }

    // Padding
    m[l >>> 5] |= 0x80 << (l % 32);
    m[(((l + 64) >>> 9) << 4) + 14] = l;

    // Method shortcuts
    var FF = md5._ff,
        GG = md5._gg,
        HH = md5._hh,
        II = md5._ii;

    for (var i = 0; i < m.length; i += 16) {

      var aa = a,
          bb = b,
          cc = c,
          dd = d;

      a = FF(a, b, c, d, m[i+ 0],  7, -680876936);
      d = FF(d, a, b, c, m[i+ 1], 12, -389564586);
      c = FF(c, d, a, b, m[i+ 2], 17,  606105819);
      b = FF(b, c, d, a, m[i+ 3], 22, -1044525330);
      a = FF(a, b, c, d, m[i+ 4],  7, -176418897);
      d = FF(d, a, b, c, m[i+ 5], 12,  1200080426);
      c = FF(c, d, a, b, m[i+ 6], 17, -1473231341);
      b = FF(b, c, d, a, m[i+ 7], 22, -45705983);
      a = FF(a, b, c, d, m[i+ 8],  7,  1770035416);
      d = FF(d, a, b, c, m[i+ 9], 12, -1958414417);
      c = FF(c, d, a, b, m[i+10], 17, -42063);
      b = FF(b, c, d, a, m[i+11], 22, -1990404162);
      a = FF(a, b, c, d, m[i+12],  7,  1804603682);
      d = FF(d, a, b, c, m[i+13], 12, -40341101);
      c = FF(c, d, a, b, m[i+14], 17, -1502002290);
      b = FF(b, c, d, a, m[i+15], 22,  1236535329);

      a = GG(a, b, c, d, m[i+ 1],  5, -165796510);
      d = GG(d, a, b, c, m[i+ 6],  9, -1069501632);
      c = GG(c, d, a, b, m[i+11], 14,  643717713);
      b = GG(b, c, d, a, m[i+ 0], 20, -373897302);
      a = GG(a, b, c, d, m[i+ 5],  5, -701558691);
      d = GG(d, a, b, c, m[i+10],  9,  38016083);
      c = GG(c, d, a, b, m[i+15], 14, -660478335);
      b = GG(b, c, d, a, m[i+ 4], 20, -405537848);
      a = GG(a, b, c, d, m[i+ 9],  5,  568446438);
      d = GG(d, a, b, c, m[i+14],  9, -1019803690);
      c = GG(c, d, a, b, m[i+ 3], 14, -187363961);
      b = GG(b, c, d, a, m[i+ 8], 20,  1163531501);
      a = GG(a, b, c, d, m[i+13],  5, -1444681467);
      d = GG(d, a, b, c, m[i+ 2],  9, -51403784);
      c = GG(c, d, a, b, m[i+ 7], 14,  1735328473);
      b = GG(b, c, d, a, m[i+12], 20, -1926607734);

      a = HH(a, b, c, d, m[i+ 5],  4, -378558);
      d = HH(d, a, b, c, m[i+ 8], 11, -2022574463);
      c = HH(c, d, a, b, m[i+11], 16,  1839030562);
      b = HH(b, c, d, a, m[i+14], 23, -35309556);
      a = HH(a, b, c, d, m[i+ 1],  4, -1530992060);
      d = HH(d, a, b, c, m[i+ 4], 11,  1272893353);
      c = HH(c, d, a, b, m[i+ 7], 16, -155497632);
      b = HH(b, c, d, a, m[i+10], 23, -1094730640);
      a = HH(a, b, c, d, m[i+13],  4,  681279174);
      d = HH(d, a, b, c, m[i+ 0], 11, -358537222);
      c = HH(c, d, a, b, m[i+ 3], 16, -722521979);
      b = HH(b, c, d, a, m[i+ 6], 23,  76029189);
      a = HH(a, b, c, d, m[i+ 9],  4, -640364487);
      d = HH(d, a, b, c, m[i+12], 11, -421815835);
      c = HH(c, d, a, b, m[i+15], 16,  530742520);
      b = HH(b, c, d, a, m[i+ 2], 23, -995338651);

      a = II(a, b, c, d, m[i+ 0],  6, -198630844);
      d = II(d, a, b, c, m[i+ 7], 10,  1126891415);
      c = II(c, d, a, b, m[i+14], 15, -1416354905);
      b = II(b, c, d, a, m[i+ 5], 21, -57434055);
      a = II(a, b, c, d, m[i+12],  6,  1700485571);
      d = II(d, a, b, c, m[i+ 3], 10, -1894986606);
      c = II(c, d, a, b, m[i+10], 15, -1051523);
      b = II(b, c, d, a, m[i+ 1], 21, -2054922799);
      a = II(a, b, c, d, m[i+ 8],  6,  1873313359);
      d = II(d, a, b, c, m[i+15], 10, -30611744);
      c = II(c, d, a, b, m[i+ 6], 15, -1560198380);
      b = II(b, c, d, a, m[i+13], 21,  1309151649);
      a = II(a, b, c, d, m[i+ 4],  6, -145523070);
      d = II(d, a, b, c, m[i+11], 10, -1120210379);
      c = II(c, d, a, b, m[i+ 2], 15,  718787259);
      b = II(b, c, d, a, m[i+ 9], 21, -343485551);

      a = (a + aa) >>> 0;
      b = (b + bb) >>> 0;
      c = (c + cc) >>> 0;
      d = (d + dd) >>> 0;
    }

    return crypt.endian([a, b, c, d]);
  };

  // Auxiliary functions
  md5._ff  = function (a, b, c, d, x, s, t) {
    var n = a + (b & c | ~b & d) + (x >>> 0) + t;
    return ((n << s) | (n >>> (32 - s))) + b;
  };
  md5._gg  = function (a, b, c, d, x, s, t) {
    var n = a + (b & d | c & ~d) + (x >>> 0) + t;
    return ((n << s) | (n >>> (32 - s))) + b;
  };
  md5._hh  = function (a, b, c, d, x, s, t) {
    var n = a + (b ^ c ^ d) + (x >>> 0) + t;
    return ((n << s) | (n >>> (32 - s))) + b;
  };
  md5._ii  = function (a, b, c, d, x, s, t) {
    var n = a + (c ^ (b | ~d)) + (x >>> 0) + t;
    return ((n << s) | (n >>> (32 - s))) + b;
  };

  // Package private blocksize
  md5._blocksize = 16;
  md5._digestsize = 16;

  md5$1.exports = function (message, options) {
    if (message === undefined || message === null)
      throw new Error('Illegal argument ' + message);

    var digestbytes = crypt.wordsToBytes(md5(message, options));
    return options && options.asBytes ? digestbytes :
        options && options.asString ? bin.bytesToString(digestbytes) :
        crypt.bytesToHex(digestbytes);
  };

})();

var md5 = md5$1.exports;

function toResourceLocation(path) {
    const namespace = "minecraft";
    return namespace + ":" + path;
}
class PositionalRandomFactory {
}
// abstract
class RandomSource {
}
class Seed128bit {
    seedLo;
    seedHi;
    constructor(seedLo, seedHi) {
        this.seedLo = seedLo;
        this.seedHi = seedHi;
    }
}
class RandomSupport {
    static GOLDEN_RATIO_64 = -7046029254386353131n;
    static SILVER_RATIO_64 = 7640891576956012809n;
    static SEED_UNIQUIFIER = 8682522807148012n;
    static mixStafford13(seed) {
        seed = clamp64((seed ^ unsignedShift64(seed, 30n)) * -4658895280553007687n);
        seed = clamp64((seed ^ unsignedShift64(seed, 27n)) * -7723592293110705685n);
        return clamp64(seed ^ unsignedShift64(seed, 31n));
    }
    static upgradeSeedTo128bit(seed) {
        const lo = seed ^ RandomSupport.SILVER_RATIO_64;
        const hi = clamp64(lo + RandomSupport.GOLDEN_RATIO_64);
        return new Seed128bit(RandomSupport.mixStafford13(lo), RandomSupport.mixStafford13(hi));
    }
    static seedUniquifier() {
        RandomSupport.SEED_UNIQUIFIER = clamp64(RandomSupport.SEED_UNIQUIFIER * 1181783497276652981n);
        return RandomSupport.SEED_UNIQUIFIER ^ (BigInt(performance.now()) * 1000000n);
    }
    static nextIntBetweenInclusive(randomSource, min, max) {
        return randomSource.nextInt(max - min + 1) + min;
    }
    static consumeCount(randomSource, count) {
        for (let i = 0; i < count; ++i) {
            randomSource.nextInt();
        }
    }
}
// implementations
class Xoroshiro128PlusPlus {
    seedLo;
    seedHi;
    constructor(lo, hi) {
        if (lo instanceof Seed128bit) {
            hi = lo.seedHi;
            lo = lo.seedLo;
        }
        if (hi === undefined) {
            throw new Error();
        }
        this.seedLo = lo;
        this.seedHi = hi;
        if ((this.seedLo | this.seedHi) == 0n) {
            this.seedLo = RandomSupport.GOLDEN_RATIO_64;
            this.seedHi = RandomSupport.SILVER_RATIO_64;
        }
    }
    nextLong() {
        const i = this.seedLo;
        let j = this.seedHi;
        const k = clamp64(rotateLeft64(clamp64(i + j), 17n) + i);
        j ^= i;
        this.seedLo = rotateLeft64(i, 49n) ^ j ^ clamp64(j << 21n);
        this.seedHi = rotateLeft64(j, 28n);
        return k;
    }
}
class MarsagliaPolarGaussian {
    randomSource;
    nextNextGaussian;
    haveNextNextGaussian;
    constructor(randomSource) {
        this.randomSource = randomSource;
    }
    reset() {
        this.haveNextNextGaussian = false;
    }
    nextGaussian() {
        if (this.haveNextNextGaussian) {
            this.haveNextNextGaussian = false;
            return this.nextNextGaussian;
        }
        else {
            // eslint-disable-next-line no-constant-condition
            while (true) {
                const d0 = 2.0 * this.randomSource.nextDouble() - 1.0;
                const d1 = 2.0 * this.randomSource.nextDouble() - 1.0;
                const d2 = square(d0) + square(d1);
                if (!(d2 >= 1.0)) {
                    if (d2 != 0.0) {
                        const d3 = Math.sqrt((-2.0 * Math.log(d2)) / d2);
                        this.nextNextGaussian = d1 * d3;
                        this.haveNextNextGaussian = true;
                        return d0 * d3;
                    }
                }
            }
        }
    }
}
// source implementations
class XoroshiroRandomSource {
    static FLOAT_UNIT = 5.9604645e-8;
    static DOUBLE_UNIT = 1.1102230246251565e-16;
    randomNumberGenerator;
    gaussianSource = new MarsagliaPolarGaussian(this);
    constructor(lo, hi) {
        if (hi === undefined) {
            this.randomNumberGenerator = new Xoroshiro128PlusPlus(RandomSupport.upgradeSeedTo128bit(lo));
        }
        else {
            this.randomNumberGenerator = new Xoroshiro128PlusPlus(lo, hi);
        }
    }
    fork() {
        return new XoroshiroRandomSource(this.randomNumberGenerator.nextLong(), this.randomNumberGenerator.nextLong());
    }
    forkPositional() {
        return new XoroshiroPositionalRandomFactory(this.randomNumberGenerator.nextLong(), this.randomNumberGenerator.nextLong());
    }
    setSeed(seed) {
        this.randomNumberGenerator = new Xoroshiro128PlusPlus(RandomSupport.upgradeSeedTo128bit(seed));
        this.gaussianSource.reset();
    }
    nextInt(bound) {
        if (bound !== undefined) {
            let i = toUnsignedLong(this.nextInt());
            let j = clamp64(i * toLong(bound));
            let k = j & 4294967295n;
            if (k < toLong(bound)) {
                for (let l = remainderUnsigned32(~bound + 1, bound); k < toLong(l); k = j & 4294967295n) {
                    i = toUnsignedLong(this.nextInt());
                    j = i * toLong(bound);
                }
            }
            const i1 = j >> 32n;
            return toInt(i1);
        }
        else {
            return Number(BigInt.asIntN(32, this.randomNumberGenerator.nextLong()));
        }
    }
    nextLong() {
        return this.randomNumberGenerator.nextLong();
    }
    nextBoolean() {
        return (this.randomNumberGenerator.nextLong() & 1n) != 0n;
    }
    nextFloat() {
        return Number(this.nextBits(24)) * XoroshiroRandomSource.FLOAT_UNIT;
    }
    nextDouble() {
        return Number(this.nextBits(53)) * XoroshiroRandomSource.DOUBLE_UNIT;
    }
    nextGaussian() {
        return this.gaussianSource.nextGaussian();
    }
    consumeCount(count) {
        for (let i = 0; i < count; ++i) {
            this.randomNumberGenerator.nextLong();
        }
    }
    nextBits(bits) {
        return unsignedShift64(this.randomNumberGenerator.nextLong(), toLong(64 - bits));
    }
}
class XoroshiroPositionalRandomFactory extends PositionalRandomFactory {
    seedLo;
    seedHi;
    constructor(seedLo, seedHi) {
        super();
        this.seedLo = seedLo;
        this.seedHi = seedHi;
    }
    at(x, y, z) {
        const coordinateSeed = getSeed(x, y, z);
        const finalSeedLo = coordinateSeed ^ this.seedLo;
        return new XoroshiroRandomSource(finalSeedLo, this.seedHi);
    }
    fromHashOf(s) {
        const abyte = md5(s, {
            encoding: "utf8",
            asBytes: true,
        });
        const i = fromBytes64(abyte[0], abyte[1], abyte[2], abyte[3], abyte[4], abyte[5], abyte[6], abyte[7]);
        const j = fromBytes64(abyte[8], abyte[9], abyte[10], abyte[11], abyte[12], abyte[13], abyte[14], abyte[15]);
        return new XoroshiroRandomSource(i ^ this.seedLo, j ^ this.seedHi);
    }
}
class BitRandomSource {
    static FLOAT_MULTIPLIER = 5.9604645e-8;
    static DOUBLE_MULTIPLIER = 1.1102230246251565e-16;
    nextInt(bound) {
        if (bound !== undefined) {
            if ((bound & (bound - 1)) == 0) {
                return toInt((toLong(bound) * toLong(this.next(31))) >> 31n);
            }
            else {
                let i, clapmedI;
                do {
                    i = this.next(31);
                    clapmedI = i % bound;
                } while (i - clapmedI + (bound - 1) < 0);
                return clapmedI;
            }
        }
        else {
            return this.next(32);
        }
    }
    nextLong() {
        const i = this.next(32);
        const j = this.next(32);
        const k = toLong(i) << 32n;
        return clamp64(k + toLong(j));
    }
    nextBoolean() {
        return this.next(1) != 0;
    }
    nextFloat() {
        return this.next(24) * BitRandomSource.FLOAT_MULTIPLIER;
    }
    nextDouble() {
        const i = this.next(26);
        const j = this.next(27);
        const k = clamp64((toLong(i) << 27n) + toLong(j));
        return Number(k) * BitRandomSource.DOUBLE_MULTIPLIER;
    }
}
class LegacyRandomSource extends BitRandomSource {
    static MODULUS_BITS = 48n;
    static MODULUS_MASK = 281474976710655n;
    static MULTIPLIER = 25214903917n;
    static INCREMENT = 11n;
    seed;
    gaussianSource = new MarsagliaPolarGaussian(this);
    constructor(seed) {
        super();
        this.setSeed(seed);
    }
    fork() {
        return new LegacyRandomSource(this.nextLong());
    }
    forkPositional() {
        return new LegacyPositionalRandomFactory(this.nextLong());
    }
    setSeed(seed) {
        this.seed = (seed ^ LegacyRandomSource.MULTIPLIER) & LegacyRandomSource.MODULUS_MASK;
        this.gaussianSource.reset();
    }
    next(bits) {
        this.seed = clamp64((this.seed * LegacyRandomSource.MULTIPLIER + LegacyRandomSource.INCREMENT) &
            LegacyRandomSource.MODULUS_MASK);
        return toInt(this.seed >> (LegacyRandomSource.MODULUS_BITS - toLong(bits)));
    }
    nextGaussian() {
        return this.gaussianSource.nextGaussian();
    }
}
function hashCode(s) {
    let h = 0;
    for (let i = 0; i < s.length; i++)
        h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
    return h;
}
class LegacyPositionalRandomFactory extends PositionalRandomFactory {
    seed;
    constructor(seed) {
        super();
        this.seed = seed;
    }
    at(x, y, z) {
        const coordinateSeed = getSeed(x, y, z);
        const finalSeed = coordinateSeed ^ this.seed;
        return new LegacyRandomSource(finalSeed);
    }
    fromHashOf(s) {
        const i = hashCode(s);
        return new LegacyRandomSource(toLong(i) ^ this.seed);
    }
}
// random
class Random {
    static multiplier = 0x5deece66dn;
    static addend = 0xbn;
    static mask = (1n << 48n) - 1n;
    static FLOAT_UNIT = 1.0 / Number(1n << 24n);
    static DOUBLE_UNIT = 1.0 / Number(1n << 53n);
    seed;
    nextNextGaussian;
    haveNextNextGaussian = false;
    constructor(seed) {
        this.setSeed(seed);
    }
    setSeed(seed) {
        this.seed = Random.initialScramble(seed);
        this.haveNextNextGaussian = false;
    }
    static initialScramble(seed) {
        return (seed ^ Random.multiplier) & Random.mask;
    }
    next(bits) {
        const oldseed = this.seed;
        const nextseed = (oldseed * Random.multiplier + Random.addend) & Random.mask;
        this.seed = nextseed;
        return toInt(unsignedShift64(nextseed, toLong(48 - bits)));
    }
    nextInt(bound) {
        if (bound === undefined) {
            return this.next(32);
        }
        else {
            let r = this.next(31);
            const m = bound - 1;
            if ((bound & m) == 0)
                // i.e., bound is a power of 2
                r = toInt((toLong(bound) * toLong(r)) >> 31n);
            else {
                // reject over-represented candidates
                for (let u = r; u - (r = u % bound) + m < 0; u = this.next(31))
                    ;
            }
            return r;
        }
    }
    nextLong() {
        // it's okay that the bottom word remains signed.
        return (toLong(this.next(32)) << 32n) + toLong(this.next(32));
    }
    nextBoolean() {
        return this.next(1) != 0;
    }
    nextFloat() {
        return this.next(24) / Random.FLOAT_UNIT;
    }
    nextDouble() {
        return Number((toLong(this.next(26)) << 27n) + toLong(this.next(27))) * Random.DOUBLE_UNIT;
    }
    nextGaussian() {
        // See Knuth, TAOCP, Vol. 2, 3rd edition, Section 3.4.1 Algorithm C.
        if (this.haveNextNextGaussian) {
            this.haveNextNextGaussian = false;
            return this.nextNextGaussian;
        }
        else {
            let v1, v2, s;
            do {
                v1 = 2 * this.nextDouble() - 1; // between -1 and 1
                v2 = 2 * this.nextDouble() - 1; // between -1 and 1
                s = v1 * v1 + v2 * v2;
            } while (s >= 1 || s == 0);
            const multiplier = Math.sqrt((-2 * Math.log(s)) / s);
            this.nextNextGaussian = v2 * multiplier;
            this.haveNextNextGaussian = true;
            return v1 * multiplier;
        }
    }
}
// world gen
class WorldgenRandom extends Random {
    randomSource;
    count;
    constructor(randomSource) {
        super(0n);
        this.randomSource = randomSource;
        this.count = 0;
    }
    getCount() {
        return this.count;
    }
    fork() {
        return this.randomSource.fork();
    }
    forkPositional() {
        return this.randomSource.forkPositional();
    }
    next(bits) {
        ++this.count;
        const randomsource = this.randomSource;
        if (randomsource instanceof LegacyRandomSource) {
            const legacyrandomsource = randomsource;
            return legacyrandomsource.next(bits);
        }
        else {
            return toInt(unsignedShift64(this.randomSource.nextLong(), toLong(64 - bits)));
        }
    }
    setSeed(seed) {
        if (this.randomSource != null) {
            this.randomSource.setSeed(seed);
        }
    }
    setDecorationSeed(seed, x, y) {
        this.setSeed(seed);
        const xSeed = this.nextLong() | 1n;
        const ySeed = this.nextLong() | 1n;
        const finalSeed = (clamp64(toLong(x) * xSeed) + clamp64(toLong(y) * ySeed)) ^ seed;
        this.setSeed(finalSeed);
        return finalSeed;
    }
    setFeatureSeed(seed, x, y) {
        const finalSeed = clamp64(seed + toLong(x) + toLong(toInt(10000n * toLong(y))));
        this.setSeed(finalSeed);
    }
    setLargeFeatureSeed(seed, x, y) {
        this.setSeed(seed);
        const xSeed = this.nextLong();
        const ySeed = this.nextLong();
        const finalSeed = clamp64(toLong(x) * xSeed) ^ clamp64(toLong(y) * ySeed) ^ seed;
        this.setSeed(finalSeed);
    }
    setLargeFeatureWithSalt(salt, x, y, z) {
        const finalSeed = clamp64(clamp64(toLong(x) * 341873128712n) +
            clamp64(toLong(y) * 132897987541n) +
            salt +
            toLong(z));
        this.setSeed(finalSeed);
    }
    static seedSlimeChunk(x, y, seed, salt) {
        return new Random((seed +
            toLong(toInt(toLong(x) * toLong(x) * 4987142n)) +
            toLong(toInt(toLong(x) * 5947611n)) +
            toLong(toInt(toLong(y) * toLong(y))) * 4392871n +
            toLong(toInt(toLong(y) * 389711n))) ^
            salt);
    }
}
var Algorithm;
(function (Algorithm) {
    Algorithm[Algorithm["LEGACY"] = 0] = "LEGACY";
    Algorithm[Algorithm["XOROSHIRO"] = 1] = "XOROSHIRO";
})(Algorithm || (Algorithm = {}));
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
const AlgorithmClasses = {};
AlgorithmClasses[Algorithm.LEGACY] = LegacyRandomSource;
AlgorithmClasses[Algorithm.XOROSHIRO] = XoroshiroRandomSource;
function Algorithm_newInstance(algorithm, seed) {
    return new AlgorithmClasses[algorithm](seed);
}

class SimplexNoise {
    static GRADIENT = [
        [1, 1, 0],
        [-1, 1, 0],
        [1, -1, 0],
        [-1, -1, 0],
        [1, 0, 1],
        [-1, 0, 1],
        [1, 0, -1],
        [-1, 0, -1],
        [0, 1, 1],
        [0, -1, 1],
        [0, 1, -1],
        [0, -1, -1],
        [1, 1, 0],
        [0, -1, 1],
        [-1, 1, 0],
        [0, -1, -1],
    ];
    static SQRT_3 = Math.sqrt(3.0);
    static F2 = 0.5 * (SimplexNoise.SQRT_3 - 1.0);
    static G2 = (3.0 - SimplexNoise.SQRT_3) / 6.0;
    p = new Array(512).fill(0);
    xo;
    yo;
    zo;
    constructor(randomSource) {
        this.xo = randomSource.nextDouble() * 256.0;
        this.yo = randomSource.nextDouble() * 256.0;
        this.zo = randomSource.nextDouble() * 256.0;
        for (let i = 0; i < 256; i++) {
            this.p[i] = i;
        }
        for (let i = 0; i < 256; ++i) {
            const value = randomSource.nextInt(256 - i);
            const temp = this.p[i];
            this.p[i] = this.p[value + i];
            this.p[value + i] = temp;
        }
    }
    get_p(index) {
        return this.p[index & 255];
    }
    static dot(v, x, y, z) {
        return v[0] * x + v[1] * y + v[2] * z;
    }
    getCornerNoise3D(gradintIndex, x, y, z, maxLengthSq) {
        let lengthDiff = maxLengthSq - x * x - y * y - z * z;
        let result;
        if (lengthDiff < 0.0) {
            result = 0.0;
        }
        else {
            lengthDiff *= lengthDiff;
            result =
                lengthDiff *
                    lengthDiff *
                    SimplexNoise.dot(SimplexNoise.GRADIENT[gradintIndex], x, y, z);
        }
        return result;
    }
    getValue(x, y, z) {
        if (z === undefined) {
            const someLength1 = (x + y) * SimplexNoise.F2;
            const intX = floor(x + someLength1);
            const intY = floor(y + someLength1);
            const someLength2 = (intX + intY) * SimplexNoise.G2;
            const d2 = intX - someLength2;
            const d3 = intY - someLength2;
            const d4 = x - d2;
            const d5 = y - d3;
            let k;
            let l;
            if (d4 > d5) {
                k = 1;
                l = 0;
            }
            else {
                k = 0;
                l = 1;
            }
            const d6 = d4 - k + SimplexNoise.G2;
            const d7 = d5 - l + SimplexNoise.G2;
            const d8 = d4 - 1.0 + 2.0 * SimplexNoise.G2;
            const d9 = d5 - 1.0 + 2.0 * SimplexNoise.G2;
            const clampedIntX = intX & 255;
            const clampedIntY = intY & 255;
            const k1 = this.get_p(clampedIntX + this.get_p(clampedIntY)) % 12;
            const l1 = this.get_p(clampedIntX + k + this.get_p(clampedIntY + l)) % 12;
            const i2 = this.get_p(clampedIntX + 1 + this.get_p(clampedIntY + 1)) % 12;
            const d10 = this.getCornerNoise3D(k1, d4, d5, 0.0, 0.5);
            const d11 = this.getCornerNoise3D(l1, d6, d7, 0.0, 0.5);
            const d12 = this.getCornerNoise3D(i2, d8, d9, 0.0, 0.5);
            return 70.0 * (d10 + d11 + d12);
        }
        else {
            const ONE_THIRD = 0.3333333333333333;
            const ONE_SIXTH = 0.16666666666666666;
            const avgCoord = (x + y + z) * ONE_THIRD;
            const avgIntX = floor(x + avgCoord);
            const avgIntY = floor(y + avgCoord);
            const avgIntZ = floor(z + avgCoord);
            const avgCoord2 = (avgIntX + avgIntY + avgIntZ) * ONE_SIXTH;
            const d4 = avgIntX - avgCoord2;
            const d5 = avgIntY - avgCoord2;
            const d6 = avgIntZ - avgCoord2;
            const d7 = x - d4;
            const d8 = y - d5;
            const d9 = z - d6;
            let l;
            let i1;
            let j1;
            let k1;
            let l1;
            let i2;
            if (d7 >= d8) {
                if (d8 >= d9) {
                    l = 1;
                    i1 = 0;
                    j1 = 0;
                    k1 = 1;
                    l1 = 1;
                    i2 = 0;
                }
                else if (d7 >= d9) {
                    l = 1;
                    i1 = 0;
                    j1 = 0;
                    k1 = 1;
                    l1 = 0;
                    i2 = 1;
                }
                else {
                    l = 0;
                    i1 = 0;
                    j1 = 1;
                    k1 = 1;
                    l1 = 0;
                    i2 = 1;
                }
            }
            else if (d8 < d9) {
                l = 0;
                i1 = 0;
                j1 = 1;
                k1 = 0;
                l1 = 1;
                i2 = 1;
            }
            else if (d7 < d9) {
                l = 0;
                i1 = 1;
                j1 = 0;
                k1 = 0;
                l1 = 1;
                i2 = 1;
            }
            else {
                l = 0;
                i1 = 1;
                j1 = 0;
                k1 = 1;
                l1 = 1;
                i2 = 0;
            }
            const d10 = d7 - l + ONE_SIXTH;
            const d11 = d8 - i1 + ONE_SIXTH;
            const d12 = d9 - j1 + ONE_SIXTH;
            const d13 = d7 - k1 + ONE_THIRD;
            const d14 = d8 - l1 + ONE_THIRD;
            const d15 = d9 - i2 + ONE_THIRD;
            const d16 = d7 - 1.0 + 0.5;
            const d17 = d8 - 1.0 + 0.5;
            const d18 = d9 - 1.0 + 0.5;
            const j2 = avgIntX & 255;
            const k2 = avgIntY & 255;
            const l2 = avgIntZ & 255;
            const i3 = this.get_p(j2 + this.get_p(k2 + this.get_p(l2))) % 12;
            const j3 = this.get_p(j2 + l + this.get_p(k2 + i1 + this.get_p(l2 + j1))) % 12;
            const k3 = this.get_p(j2 + k1 + this.get_p(k2 + l1 + this.get_p(l2 + i2))) % 12;
            const l3 = this.get_p(j2 + 1 + this.get_p(k2 + 1 + this.get_p(l2 + 1))) % 12;
            const d19 = this.getCornerNoise3D(i3, d7, d8, d9, 0.6);
            const d20 = this.getCornerNoise3D(j3, d10, d11, d12, 0.6);
            const d21 = this.getCornerNoise3D(k3, d13, d14, d15, 0.6);
            const d22 = this.getCornerNoise3D(l3, d16, d17, d18, 0.6);
            return 32.0 * (d19 + d20 + d21 + d22);
        }
    }
}

class ImprovedNoise {
    static SHIFT_UP_EPSILON = 1.0e-7;
    p;
    xo;
    yo;
    zo;
    constructor(randomSource) {
        this.xo = randomSource.nextDouble() * 256.0;
        this.yo = randomSource.nextDouble() * 256.0;
        this.zo = randomSource.nextDouble() * 256.0;
        this.p = new Int8Array(256);
        for (let i = 0; i < 256; ++i) {
            this.p[i] = i;
        }
        for (let i = 0; i < 256; ++i) {
            const value = randomSource.nextInt(256 - i);
            const temp = this.p[i];
            this.p[i] = this.p[i + value];
            this.p[i + value] = temp;
        }
    }
    noise(x, y, z, yFractStep = 0, maxYfract = 0) {
        const xWithOffset = x + this.xo;
        const yWithOffset = y + this.yo;
        const zWithOffset = z + this.zo;
        const intX = floor(xWithOffset);
        const intY = floor(yWithOffset);
        const intZ = floor(zWithOffset);
        const xFract = xWithOffset - intX;
        const yFract = yWithOffset - intY;
        const zFract = zWithOffset - intZ;
        let yFractOffset;
        if (yFractStep != 0.0) {
            let yFractToUse;
            if (maxYfract >= 0.0 && maxYfract < yFract) {
                yFractToUse = maxYfract;
            }
            else {
                yFractToUse = yFract;
            }
            yFractOffset =
                floor(yFractToUse / yFractStep + ImprovedNoise.SHIFT_UP_EPSILON) * yFractStep;
        }
        else {
            yFractOffset = 0.0;
        }
        return this.sampleAndLerp(intX, intY, intZ, xFract, yFract - yFractOffset, zFract, yFract);
    }
    static gradDot(gradintIndex, x, y, z) {
        return SimplexNoise.dot(SimplexNoise.GRADIENT[gradintIndex & 15], x, y, z);
    }
    get_p(index) {
        return this.p[index & 255] & 255;
    }
    sampleAndLerp(x, y, z, xt, yt, zt, yt2) {
        const noiseX0 = this.get_p(x);
        const noiseX1 = this.get_p(x + 1);
        const noiseY00 = this.get_p(noiseX0 + y);
        const noiseY01 = this.get_p(noiseX0 + y + 1);
        const noiseY10 = this.get_p(noiseX1 + y);
        const noiseY11 = this.get_p(noiseX1 + y + 1);
        // cube 2x2x2
        const len0 = ImprovedNoise.gradDot(this.get_p(noiseY00 + z), xt, yt, zt);
        const len1 = ImprovedNoise.gradDot(this.get_p(noiseY10 + z), xt - 1.0, yt, zt);
        const len2 = ImprovedNoise.gradDot(this.get_p(noiseY01 + z), xt, yt - 1.0, zt);
        const len3 = ImprovedNoise.gradDot(this.get_p(noiseY11 + z), xt - 1.0, yt - 1.0, zt);
        const len4 = ImprovedNoise.gradDot(this.get_p(noiseY00 + z + 1), xt, yt, zt - 1.0);
        const len5 = ImprovedNoise.gradDot(this.get_p(noiseY10 + z + 1), xt - 1.0, yt, zt - 1.0);
        const len6 = ImprovedNoise.gradDot(this.get_p(noiseY01 + z + 1), xt, yt - 1.0, zt - 1.0);
        const len7 = ImprovedNoise.gradDot(this.get_p(noiseY11 + z + 1), xt - 1.0, yt - 1.0, zt - 1.0);
        const smoothXt = smoothstep(xt);
        const smoothYt = smoothstep(yt2);
        const smoothZt = smoothstep(zt);
        return lerp3(smoothXt, smoothYt, smoothZt, len0, len1, len2, len3, len4, len5, len6, len7);
    }
    // unused
    noiseWithDerivative(x, y, z, output) {
        const xWithOffset = x + this.xo;
        const yWithOffset = y + this.yo;
        const zWithOffset = z + this.zo;
        const intXwithOffset = floor(xWithOffset);
        const intYwithOffset = floor(yWithOffset);
        const intZwithOffset = floor(zWithOffset);
        const xFract = xWithOffset - intXwithOffset;
        const yFract = yWithOffset - intYwithOffset;
        const zFract = zWithOffset - intZwithOffset;
        return this.sampleWithDerivative(intXwithOffset, intYwithOffset, intZwithOffset, xFract, yFract, zFract, output);
    }
    sampleWithDerivative(x, y, z, xFract, yFract, zFract, output) {
        const noiseX0 = this.get_p(x);
        const noiseX1 = this.get_p(x + 1);
        const noiseY00 = this.get_p(noiseX0 + y);
        const noiseY01 = this.get_p(noiseX0 + y + 1);
        const noiseY10 = this.get_p(noiseX1 + y);
        const noiseY11 = this.get_p(noiseX1 + y + 1);
        const noiseZ000 = this.get_p(noiseY00 + z);
        const noiseZ100 = this.get_p(noiseY10 + z);
        const noiseZ010 = this.get_p(noiseY01 + z);
        const noiseZ110 = this.get_p(noiseY11 + z);
        const noiseZ001 = this.get_p(noiseY00 + z + 1);
        const noiseZ101 = this.get_p(noiseY10 + z + 1);
        const noiseZ011 = this.get_p(noiseY01 + z + 1);
        const noiseZ111 = this.get_p(noiseY11 + z + 1);
        // here we have 2x2x2 cube
        const gradient0 = SimplexNoise.GRADIENT[noiseZ000 & 15];
        const gradient1 = SimplexNoise.GRADIENT[noiseZ100 & 15];
        const gradient2 = SimplexNoise.GRADIENT[noiseZ010 & 15];
        const gradient3 = SimplexNoise.GRADIENT[noiseZ110 & 15];
        const gradient4 = SimplexNoise.GRADIENT[noiseZ001 & 15];
        const gradient5 = SimplexNoise.GRADIENT[noiseZ101 & 15];
        const gradient6 = SimplexNoise.GRADIENT[noiseZ011 & 15];
        const gradient7 = SimplexNoise.GRADIENT[noiseZ111 & 15];
        const len0 = SimplexNoise.dot(gradient0, xFract, yFract, zFract);
        const len1 = SimplexNoise.dot(gradient1, xFract - 1.0, yFract, zFract);
        const len2 = SimplexNoise.dot(gradient2, xFract, yFract - 1.0, zFract);
        const len3 = SimplexNoise.dot(gradient3, xFract - 1.0, yFract - 1.0, zFract);
        const len4 = SimplexNoise.dot(gradient4, xFract, yFract, zFract - 1.0);
        const len5 = SimplexNoise.dot(gradient5, xFract - 1.0, yFract, zFract - 1.0);
        const len6 = SimplexNoise.dot(gradient6, xFract, yFract - 1.0, zFract - 1.0);
        const len7 = SimplexNoise.dot(gradient7, xFract - 1.0, yFract - 1.0, zFract - 1.0);
        const smoothXfract = smoothstep(xFract);
        const smoothYfract = smoothstep(yFract);
        const smoothZfract = smoothstep(zFract);
        const interpolatedGradientX = lerp3(smoothXfract, smoothYfract, smoothZfract, gradient0[0], gradient1[0], gradient2[0], gradient3[0], gradient4[0], gradient5[0], gradient6[0], gradient7[0]);
        const interpolatedGradientY = lerp3(smoothXfract, smoothYfract, smoothZfract, gradient0[1], gradient1[1], gradient2[1], gradient3[1], gradient4[1], gradient5[1], gradient6[1], gradient7[1]);
        const interpolatedGradientZ = lerp3(smoothXfract, smoothYfract, smoothZfract, gradient0[2], gradient1[2], gradient2[2], gradient3[2], gradient4[2], gradient5[2], gradient6[2], gradient7[2]);
        const xLen = lerp2(smoothYfract, smoothZfract, len1 - len0, len3 - len2, len5 - len4, len7 - len6);
        const yLen = lerp2(smoothZfract, smoothXfract, len2 - len0, len6 - len4, len3 - len1, len7 - len5);
        const zLen = lerp2(smoothXfract, smoothYfract, len4 - len0, len5 - len1, len6 - len2, len7 - len3);
        const xDerivSmooth = smoothstepDerivative(xFract);
        const yDerivSmooth = smoothstepDerivative(yFract);
        const zDerivSmooth = smoothstepDerivative(zFract);
        const outputX = interpolatedGradientX + xDerivSmooth * xLen;
        const outputY = interpolatedGradientY + yDerivSmooth * yLen;
        const outputZ = interpolatedGradientZ + zDerivSmooth * zLen;
        output[0] += outputX;
        output[1] += outputY;
        output[2] += outputZ;
        return lerp3(smoothXfract, smoothYfract, smoothZfract, len0, len1, len2, len3, len4, len5, len6, len7);
    }
}

class IntStream {
    static rangeClosed(startInclusive, endInclusive) {
        const result = [];
        for (let i = startInclusive; i <= endInclusive; i++) {
            result.push(i);
        }
        return result;
    }
}
class PerlinNoise {
    noiseLevels;
    firstOctave;
    amplitudes;
    lowestFreqValueFactor;
    lowestFreqInputFactor;
    static createLegacyForBlendedNoise(randomSource, octaves) {
        return new PerlinNoise(randomSource, PerlinNoise.makeAmplitudes(octaves), false);
    }
    static createLegacyForLegacyNormalNoise(randomSource, firstOctave, amplitudes) {
        return new PerlinNoise(randomSource, Pair.of(firstOctave, amplitudes), false);
    }
    static create(randomSource, octaves) {
        return new PerlinNoise(randomSource, PerlinNoise.makeAmplitudes(octaves), true);
    }
    static create2(randomSource, firstOctave, amplitudes) {
        return new PerlinNoise(randomSource, Pair.of(firstOctave, amplitudes), true);
    }
    static makeAmplitudes(octaves) {
        const minusFirstOctave = -octaves[0];
        const lastOctave = octaves[octaves.length - 1];
        const octaveLength = minusFirstOctave + lastOctave + 1;
        const doublelist = new Array(octaveLength);
        doublelist.fill(0);
        for (const octave of octaves) {
            doublelist[octave + minusFirstOctave] = 1.0;
        }
        return Pair.of(-minusFirstOctave, doublelist);
    }
    constructor(randomSource, octaveAndAmplitudes, notLegacy) {
        this.firstOctave = octaveAndAmplitudes.first;
        this.amplitudes = octaveAndAmplitudes.second;
        const amplitudesCount = this.amplitudes.length;
        const minusFirstOctave = -this.firstOctave;
        this.noiseLevels = new Array(amplitudesCount);
        if (notLegacy) {
            const positionalrandomfactory = randomSource.forkPositional();
            for (let k = 0; k < amplitudesCount; ++k) {
                if (this.amplitudes[k] != 0.0) {
                    const l = this.firstOctave + k;
                    this.noiseLevels[k] = new ImprovedNoise(positionalrandomfactory.fromHashOf("octave_" + l));
                }
            }
        }
        else {
            const improvednoise = new ImprovedNoise(randomSource);
            if (minusFirstOctave >= 0 && minusFirstOctave < amplitudesCount) {
                const d0 = this.amplitudes[minusFirstOctave];
                if (d0 != 0.0) {
                    this.noiseLevels[minusFirstOctave] = improvednoise;
                }
            }
            for (let octaveIndex = minusFirstOctave - 1; octaveIndex >= 0; --octaveIndex) {
                if (octaveIndex < amplitudesCount) {
                    const d1 = this.amplitudes[octaveIndex];
                    if (d1 != 0.0) {
                        this.noiseLevels[octaveIndex] = new ImprovedNoise(randomSource);
                    }
                    else {
                        PerlinNoise.skipOctave(randomSource);
                    }
                }
                else {
                    PerlinNoise.skipOctave(randomSource);
                }
            }
            if (this.noiseLevels.filter(noise => noise).length !=
                this.amplitudes.filter(amplitude => amplitude != 0).length) {
                throw new Error("Failed to create correct number of noise levels for given non-zero amplitudes");
            }
            if (minusFirstOctave < amplitudesCount - 1) {
                throw new Error("Positive octaves are temporarily disabled");
            }
        }
        this.lowestFreqInputFactor = Math.pow(2.0, -minusFirstOctave);
        this.lowestFreqValueFactor =
            Math.pow(2.0, amplitudesCount - 1) / (Math.pow(2.0, amplitudesCount) - 1.0);
    }
    static skipOctave(randomSource) {
        RandomSupport.consumeCount(randomSource, 262);
    }
    getValue(x, y, z, yStep = 0, maxYfract = 0, useYfractOverride = false) {
        let value = 0.0;
        let inputScale = this.lowestFreqInputFactor;
        let outputScale = this.lowestFreqValueFactor;
        for (let i = 0; i < this.noiseLevels.length; ++i) {
            const improvednoise = this.noiseLevels[i];
            if (improvednoise != null) {
                const noise = improvednoise.noise(PerlinNoise.wrap(x * inputScale), useYfractOverride ? -improvednoise.yo : PerlinNoise.wrap(y * inputScale), PerlinNoise.wrap(z * inputScale), yStep * inputScale, maxYfract * inputScale);
                value += this.amplitudes[i] * noise * outputScale;
            }
            inputScale *= 2.0;
            outputScale /= 2.0;
        }
        return value;
    }
    getOctaveNoise(octave) {
        return this.noiseLevels[this.noiseLevels.length - 1 - octave];
    }
    static wrap(num) {
        return num - lfloor(num / 3.3554432e7 + 0.5) * 3.3554432e7;
    }
}

class NoiseParameters {
    firstOctave;
    amplitudes;
    constructor(firstOctave, firstAmplitude, ...amplitudes) {
        this.firstOctave = firstOctave;
        if (typeof firstAmplitude === "number") {
            this.amplitudes = [firstAmplitude, ...amplitudes];
        }
        else {
            this.amplitudes = firstAmplitude;
        }
    }
}
class NormalNoise {
    static INPUT_FACTOR = 1.0181268882175227;
    static TARGET_DEVIATION = 0.3333333333333333;
    valueFactor;
    first;
    second;
    static createLegacyNetherBiome(randomSource, parameters) {
        return new NormalNoise(randomSource, parameters.firstOctave, parameters.amplitudes, false);
    }
    static create(randomSource, firstOctave, ...amplitudes) {
        return new NormalNoise(randomSource, firstOctave, amplitudes, true);
    }
    static create2(p_192849_, p_192850_) {
        return new NormalNoise(p_192849_, p_192850_.firstOctave, p_192850_.amplitudes, true);
    }
    static create3(randomSource, firstOctave, amplitudes) {
        return new NormalNoise(randomSource, firstOctave, amplitudes, true);
    }
    constructor(randomSource, firstOctave, amplitudes, notLegacy) {
        if (notLegacy) {
            this.first = PerlinNoise.create2(randomSource, firstOctave, amplitudes);
            this.second = PerlinNoise.create2(randomSource, firstOctave, amplitudes);
        }
        else {
            this.first = PerlinNoise.createLegacyForLegacyNormalNoise(randomSource, firstOctave, amplitudes);
            this.second = PerlinNoise.createLegacyForLegacyNormalNoise(randomSource, firstOctave, amplitudes);
        }
        let minAmplitudeIndex = Number.MAX_SAFE_INTEGER;
        let maxAmplitudeIndex = Number.MIN_SAFE_INTEGER;
        for (let amplitudeIndex = 0; amplitudeIndex < amplitudes.length; amplitudeIndex++) {
            const amplitude = amplitudes[amplitudeIndex];
            if (amplitude != 0.0) {
                minAmplitudeIndex = Math.min(minAmplitudeIndex, amplitudeIndex);
                maxAmplitudeIndex = Math.max(maxAmplitudeIndex, amplitudeIndex);
            }
        }
        this.valueFactor =
            0.16666666666666666 /
                NormalNoise.expectedDeviation(maxAmplitudeIndex - minAmplitudeIndex);
    }
    static expectedDeviation(v) {
        return 0.1 * (1.0 + 1.0 / (v + 1));
    }
    getValue(x, y, z) {
        const inputX = x * NormalNoise.INPUT_FACTOR;
        const inputY = y * NormalNoise.INPUT_FACTOR;
        const inputZ = z * NormalNoise.INPUT_FACTOR;
        return ((this.first.getValue(x, y, z) + this.second.getValue(inputX, inputY, inputZ)) *
            this.valueFactor);
    }
    parameters() {
        return new NoiseParameters(this.first.firstOctave, this.first.amplitudes);
    }
}

var Noises;
(function (Noises) {
    Noises["TEMPERATURE"] = "temperature";
    Noises["VEGETATION"] = "vegetation";
    Noises["CONTINENTALNESS"] = "continentalness";
    Noises["EROSION"] = "erosion";
    Noises["TEMPERATURE_LARGE"] = "temperature_large";
    Noises["VEGETATION_LARGE"] = "vegetation_large";
    Noises["CONTINENTALNESS_LARGE"] = "continentalness_large";
    Noises["EROSION_LARGE"] = "erosion_large";
    Noises["RIDGE"] = "ridge";
    Noises["SHIFT"] = "offset";
    Noises["AQUIFER_BARRIER"] = "aquifer_barrier";
    Noises["AQUIFER_FLUID_LEVEL_FLOODEDNESS"] = "aquifer_fluid_level_floodedness";
    Noises["AQUIFER_LAVA"] = "aquifer_lava";
    Noises["AQUIFER_FLUID_LEVEL_SPREAD"] = "aquifer_fluid_level_spread";
    Noises["PILLAR"] = "pillar";
    Noises["PILLAR_RARENESS"] = "pillar_rareness";
    Noises["PILLAR_THICKNESS"] = "pillar_thickness";
    Noises["SPAGHETTI_2"] = "spaghetti_2";
    Noises["SPAGHETTI_2D_ELEVATION"] = "spaghetti_2d_elevation";
    Noises["SPAGHETTI_2D_MODULATOR"] = "spaghetti_2d_modulator";
    Noises["SPAGHETTI_2D_THICKNESS"] = "spaghetti_2d_thickness";
    Noises["SPAGHETTI_3D_1"] = "spaghetti_3d_1";
    Noises["SPAGHETTI_3D_2"] = "spaghetti_3d_2";
    Noises["SPAGHETTI_3D_RARITY"] = "spaghetti_3d_rarity";
    Noises["SPAGHETTI_3D_THICKNESS"] = "spaghetti_3d_thickness";
    Noises["SPAGHETTI_ROUGHNESS"] = "spaghetti_roughness";
    Noises["SPAGHETTI_ROUGHNESS_MODULATOR"] = "spaghetti_roughness_modulator";
    Noises["CAVE_ENTRANCE"] = "cave_entrance";
    Noises["CAVE_LAYER"] = "cave_layer";
    Noises["CAVE_CHEESE"] = "cave_cheese";
    Noises["ORE_VEININESS"] = "ore_veininess";
    Noises["ORE_VEIN_A"] = "ore_vein_a";
    Noises["ORE_VEIN_B"] = "ore_vein_b";
    Noises["ORE_GAP"] = "ore_gap";
    Noises["NOODLE"] = "noodle";
    Noises["NOODLE_THICKNESS"] = "noodle_thickness";
    Noises["NOODLE_RIDGE_A"] = "noodle_ridge_a";
    Noises["NOODLE_RIDGE_B"] = "noodle_ridge_b";
    Noises["JAGGED"] = "jagged";
    Noises["SURFACE"] = "surface";
    Noises["SURFACE_SECONDARY"] = "surface_secondary";
    Noises["CLAY_BANDS_OFFSET"] = "clay_bands_offset";
    Noises["BADLANDS_PILLAR"] = "badlands_pillar";
    Noises["BADLANDS_PILLAR_ROOF"] = "badlands_pillar_roof";
    Noises["BADLANDS_SURFACE"] = "badlands_surface";
    Noises["ICEBERG_PILLAR"] = "iceberg_pillar";
    Noises["ICEBERG_PILLAR_ROOF"] = "iceberg_pillar_roof";
    Noises["ICEBERG_SURFACE"] = "iceberg_surface";
    Noises["SWAMP"] = "surface_swamp";
    Noises["CALCITE"] = "calcite";
    Noises["GRAVEL"] = "gravel";
    Noises["POWDER_SNOW"] = "powder_snow";
    Noises["PACKED_ICE"] = "packed_ice";
    Noises["ICE"] = "ice";
    Noises["SOUL_SAND_LAYER"] = "soul_sand_layer";
    Noises["GRAVEL_LAYER"] = "gravel_layer";
    Noises["PATCH"] = "patch";
    Noises["NETHERRACK"] = "netherrack";
    Noises["NETHER_WART"] = "nether_wart";
    Noises["NETHER_STATE_SELECTOR"] = "nether_state_selector";
})(Noises || (Noises = {}));
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
const NOISES = {};
function registerNoises() {
    registerBiomeNoises(0, Noises.TEMPERATURE, Noises.VEGETATION, Noises.CONTINENTALNESS, Noises.EROSION);
    registerBiomeNoises(-2, Noises.TEMPERATURE_LARGE, Noises.VEGETATION_LARGE, Noises.CONTINENTALNESS_LARGE, Noises.EROSION_LARGE);
    register(Noises.RIDGE, -7, 1.0, 2.0, 1.0, 0.0, 0.0, 0.0);
    register(Noises.SHIFT, -3, 1.0, 1.0, 1.0, 0.0);
    register(Noises.AQUIFER_BARRIER, -3, 1.0);
    register(Noises.AQUIFER_FLUID_LEVEL_FLOODEDNESS, -7, 1.0);
    register(Noises.AQUIFER_LAVA, -1, 1.0);
    register(Noises.AQUIFER_FLUID_LEVEL_SPREAD, -5, 1.0);
    register(Noises.PILLAR, -7, 1.0, 1.0);
    register(Noises.PILLAR_RARENESS, -8, 1.0);
    register(Noises.PILLAR_THICKNESS, -8, 1.0);
    register(Noises.SPAGHETTI_2, -7, 1.0);
    register(Noises.SPAGHETTI_2D_ELEVATION, -8, 1.0);
    register(Noises.SPAGHETTI_2D_MODULATOR, -11, 1.0);
    register(Noises.SPAGHETTI_2D_THICKNESS, -11, 1.0);
    register(Noises.SPAGHETTI_3D_1, -7, 1.0);
    register(Noises.SPAGHETTI_3D_2, -7, 1.0);
    register(Noises.SPAGHETTI_3D_RARITY, -11, 1.0);
    register(Noises.SPAGHETTI_3D_THICKNESS, -8, 1.0);
    register(Noises.SPAGHETTI_ROUGHNESS, -5, 1.0);
    register(Noises.SPAGHETTI_ROUGHNESS_MODULATOR, -8, 1.0);
    register(Noises.CAVE_ENTRANCE, -7, 0.4, 0.5, 1.0);
    register(Noises.CAVE_LAYER, -8, 1.0);
    register(Noises.CAVE_CHEESE, -8, 0.5, 1.0, 2.0, 1.0, 2.0, 1.0, 0.0, 2.0, 0.0);
    register(Noises.ORE_VEININESS, -8, 1.0);
    register(Noises.ORE_VEIN_A, -7, 1.0);
    register(Noises.ORE_VEIN_B, -7, 1.0);
    register(Noises.ORE_GAP, -5, 1.0);
    register(Noises.NOODLE, -8, 1.0);
    register(Noises.NOODLE_THICKNESS, -8, 1.0);
    register(Noises.NOODLE_RIDGE_A, -7, 1.0);
    register(Noises.NOODLE_RIDGE_B, -7, 1.0);
    register(Noises.JAGGED, -16, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0);
    register(Noises.SURFACE, -6, 1.0, 1.0, 1.0);
    register(Noises.SURFACE_SECONDARY, -6, 1.0, 1.0, 1.0);
    register(Noises.CLAY_BANDS_OFFSET, -8, 1.0);
    register(Noises.BADLANDS_PILLAR, -2, 1.0, 1.0, 1.0, 1.0);
    register(Noises.BADLANDS_PILLAR_ROOF, -8, 1.0);
    register(Noises.BADLANDS_SURFACE, -6, 1.0, 1.0, 1.0);
    register(Noises.ICEBERG_PILLAR, -6, 1.0, 1.0, 1.0, 1.0);
    register(Noises.ICEBERG_PILLAR_ROOF, -3, 1.0);
    register(Noises.ICEBERG_SURFACE, -6, 1.0, 1.0, 1.0);
    register(Noises.SWAMP, -2, 1.0);
    register(Noises.CALCITE, -9, 1.0, 1.0, 1.0, 1.0);
    register(Noises.GRAVEL, -8, 1.0, 1.0, 1.0, 1.0);
    register(Noises.POWDER_SNOW, -6, 1.0, 1.0, 1.0, 1.0);
    register(Noises.PACKED_ICE, -7, 1.0, 1.0, 1.0, 1.0);
    register(Noises.ICE, -4, 1.0, 1.0, 1.0, 1.0);
    register(Noises.SOUL_SAND_LAYER, -8, 1.0, 1.0, 1.0, 1.0, 0.0, 0.0, 0.0, 0.0, 0.013333333333333334);
    register(Noises.GRAVEL_LAYER, -8, 1.0, 1.0, 1.0, 1.0, 0.0, 0.0, 0.0, 0.0, 0.013333333333333334);
    register(Noises.PATCH, -5, 1.0, 0.0, 0.0, 0.0, 0.0, 0.013333333333333334);
    register(Noises.NETHERRACK, -3, 1.0, 0.0, 0.0, 0.35);
    register(Noises.NETHER_WART, -3, 1.0, 0.0, 0.0, 0.9);
    register(Noises.NETHER_STATE_SELECTOR, -4, 1.0);
}
function registerBiomeNoises(octaveOffset, temperature, vegetation, continentalness, erosion) {
    register(temperature, -10 + octaveOffset, 1.5, 0.0, 1.0, 0.0, 0.0, 0.0);
    register(vegetation, -8 + octaveOffset, 1.0, 1.0, 0.0, 0.0, 0.0, 0.0);
    register(continentalness, -9 + octaveOffset, 1.0, 1.0, 2.0, 2.0, 2.0, 1.0, 1.0, 1.0, 1.0);
    register(erosion, -9 + octaveOffset, 1.0, 1.0, 0.0, 1.0, 1.0);
}
function register(noise, firstOctave, firstAmplitude, ...amplitudes) {
    NOISES[noise] = new NoiseParameters(firstOctave, firstAmplitude, ...amplitudes);
}
registerNoises();
function Noises_instantiate(random, noise) {
    return NormalNoise.create2(random.fromHashOf(toResourceLocation(noise)), NOISES[noise]);
}

class Context {
}
function makeStateRule(p_194811_) {
    //return SurfaceRules.state(p_194811_.defaultBlockState());
}
class VerticalAnchor {
    static absolute(height) { }
    static aboveBottom(height) { }
    static belowTop(height) { }
    static bottom() { }
    static top() { }
}
var CaveSurface;
(function (CaveSurface) {
    CaveSurface[CaveSurface["CEILING"] = 0] = "CEILING";
    CaveSurface[CaveSurface["FLOOR"] = 1] = "FLOOR";
})(CaveSurface || (CaveSurface = {}));
class SurfaceRules {
    static yBlockCheck(anchor, p_189402_) { }
    static yStartCheck(anchor, p_189402_) { }
    static waterBlockCheck(offset, surfaceDepthMultiplier) { }
    static waterStartCheck(offset, surfaceDepthMultiplier) { }
    static hole() { }
    static abovePreliminarySurface() { }
    static temperature() { }
    static steep() { }
    static isBiome(...biomes) { }
    static ifTrue(cond, p_189396_) { }
    static stoneDepthCheck(p_189386_, p_189387_, p_189388_, p_189389_) { }
    static ON_FLOOR = SurfaceRules.stoneDepthCheck(0, false, false, CaveSurface.FLOOR);
    static UNDER_FLOOR = SurfaceRules.stoneDepthCheck(0, true, false, CaveSurface.FLOOR);
    static ON_CEILING = SurfaceRules.stoneDepthCheck(0, false, false, CaveSurface.CEILING);
    static UNDER_CEILING = SurfaceRules.stoneDepthCheck(0, true, false, CaveSurface.CEILING);
    static sequence(...rules) { }
    static noiseCondition(noise, minNoiseValue, maxNoiseValue = Number.MAX_VALUE) { }
    static not(cond) { }
    static bandlands() { }
    static verticalGradient(p_189404_, p_189405_, p_189406_) { }
    static surfaceNoiseAbove(p_194809_) { }
}
const AIR = makeStateRule(Blocks.AIR);
const BEDROCK = makeStateRule(Blocks.BEDROCK);
const WHITE_TERRACOTTA = makeStateRule(Blocks.WHITE_TERRACOTTA);
const ORANGE_TERRACOTTA = makeStateRule(Blocks.ORANGE_TERRACOTTA);
const TERRACOTTA = makeStateRule(Blocks.TERRACOTTA);
const RED_SAND = makeStateRule(Blocks.RED_SAND);
const RED_SANDSTONE = makeStateRule(Blocks.RED_SANDSTONE);
const STONE = makeStateRule(Blocks.STONE);
const DEEPSLATE = makeStateRule(Blocks.DEEPSLATE);
const DIRT = makeStateRule(Blocks.DIRT);
const PODZOL = makeStateRule(Blocks.PODZOL);
const COARSE_DIRT = makeStateRule(Blocks.COARSE_DIRT);
const MYCELIUM = makeStateRule(Blocks.MYCELIUM);
const GRASS_BLOCK = makeStateRule(Blocks.GRASS_BLOCK);
const CALCITE = makeStateRule(Blocks.CALCITE);
const GRAVEL = makeStateRule(Blocks.GRAVEL);
const SAND = makeStateRule(Blocks.SAND);
const SANDSTONE = makeStateRule(Blocks.SANDSTONE);
const PACKED_ICE = makeStateRule(Blocks.PACKED_ICE);
const SNOW_BLOCK = makeStateRule(Blocks.SNOW_BLOCK);
const POWDER_SNOW = makeStateRule(Blocks.POWDER_SNOW);
const ICE = makeStateRule(Blocks.ICE);
const WATER = makeStateRule(Blocks.WATER);
class SurfaceRuleData {
    static overworld() {
        return SurfaceRuleData.overworldLike(true, false, true);
    }
    static overworldLike(p_198381_, haveBedrockRoof, haveBedrockFloor) {
        const surfacerules$conditionsource = SurfaceRules.yBlockCheck(VerticalAnchor.absolute(97), 2);
        const surfacerules$conditionsource1 = SurfaceRules.yBlockCheck(VerticalAnchor.absolute(256), 0);
        const surfacerules$conditionsource2 = SurfaceRules.yStartCheck(VerticalAnchor.absolute(63), -1);
        const surfacerules$conditionsource3 = SurfaceRules.yStartCheck(VerticalAnchor.absolute(74), 1);
        const surfacerules$conditionsource4 = SurfaceRules.yBlockCheck(VerticalAnchor.absolute(62), 0);
        const surfacerules$conditionsource5 = SurfaceRules.yBlockCheck(VerticalAnchor.absolute(63), 0);
        const isWaterAboveTheBlock = SurfaceRules.waterBlockCheck(-1, 0);
        const isWater = SurfaceRules.waterBlockCheck(0, 0);
        const surfacerules$conditionsource8 = SurfaceRules.waterStartCheck(-6, -1);
        const isHole = SurfaceRules.hole();
        const isFrozenOcean = SurfaceRules.isBiome(Biomes.FROZEN_OCEAN, Biomes.DEEP_FROZEN_OCEAN);
        const isSteep = SurfaceRules.steep();
        const replaceGrassWithDirtIfWaterIsAbove = SurfaceRules.sequence(SurfaceRules.ifTrue(isWaterAboveTheBlock, GRASS_BLOCK), DIRT);
        const replaceSandstoneWithSandOnCeiling = SurfaceRules.sequence(SurfaceRules.ifTrue(SurfaceRules.ON_CEILING, SANDSTONE), SAND);
        const replaceStoneWithGravelOnCeiling = SurfaceRules.sequence(SurfaceRules.ifTrue(SurfaceRules.ON_CEILING, STONE), GRAVEL);
        const isWarmOceanDesertOrBeach = SurfaceRules.isBiome(Biomes.WARM_OCEAN, Biomes.DESERT, Biomes.BEACH, Biomes.SNOWY_BEACH);
        const ceilingRules = SurfaceRules.sequence(SurfaceRules.ifTrue(SurfaceRules.isBiome(Biomes.STONY_PEAKS), SurfaceRules.sequence(SurfaceRules.ifTrue(SurfaceRules.noiseCondition(Noises.CALCITE, -0.0125, 0.0125), CALCITE), STONE)), SurfaceRules.ifTrue(SurfaceRules.isBiome(Biomes.STONY_SHORE), SurfaceRules.sequence(SurfaceRules.ifTrue(SurfaceRules.noiseCondition(Noises.GRAVEL, -0.05, 0.05), replaceStoneWithGravelOnCeiling), STONE)), SurfaceRules.ifTrue(SurfaceRules.isBiome(Biomes.WINDSWEPT_HILLS), SurfaceRules.ifTrue(SurfaceRules.surfaceNoiseAbove(1.0), STONE)), SurfaceRules.ifTrue(isWarmOceanDesertOrBeach, replaceSandstoneWithSandOnCeiling), SurfaceRules.ifTrue(SurfaceRules.isBiome(Biomes.DRIPSTONE_CAVES), STONE));
        const powderSnow = SurfaceRules.ifTrue(SurfaceRules.noiseCondition(Noises.POWDER_SNOW, 0.45, 0.58), POWDER_SNOW);
        const anotherPowderSnow = SurfaceRules.ifTrue(SurfaceRules.noiseCondition(Noises.POWDER_SNOW, 0.35, 0.6), POWDER_SNOW);
        const surfacerules$rulesource6 = SurfaceRules.sequence(SurfaceRules.ifTrue(SurfaceRules.isBiome(Biomes.FROZEN_PEAKS), SurfaceRules.sequence(SurfaceRules.ifTrue(isSteep, PACKED_ICE), SurfaceRules.ifTrue(SurfaceRules.noiseCondition(Noises.PACKED_ICE, -0.5, 0.2), PACKED_ICE), SurfaceRules.ifTrue(SurfaceRules.noiseCondition(Noises.ICE, -0.0625, 0.025), ICE), SNOW_BLOCK)), SurfaceRules.ifTrue(SurfaceRules.isBiome(Biomes.SNOWY_SLOPES), SurfaceRules.sequence(SurfaceRules.ifTrue(isSteep, STONE), powderSnow, SNOW_BLOCK)), SurfaceRules.ifTrue(SurfaceRules.isBiome(Biomes.JAGGED_PEAKS), STONE), SurfaceRules.ifTrue(SurfaceRules.isBiome(Biomes.GROVE), SurfaceRules.sequence(powderSnow, DIRT)), ceilingRules, SurfaceRules.ifTrue(SurfaceRules.isBiome(Biomes.WINDSWEPT_SAVANNA), SurfaceRules.ifTrue(SurfaceRules.surfaceNoiseAbove(1.75), STONE)), SurfaceRules.ifTrue(SurfaceRules.isBiome(Biomes.WINDSWEPT_GRAVELLY_HILLS), SurfaceRules.sequence(SurfaceRules.ifTrue(SurfaceRules.surfaceNoiseAbove(2.0), replaceStoneWithGravelOnCeiling), SurfaceRules.ifTrue(SurfaceRules.surfaceNoiseAbove(1.0), STONE), SurfaceRules.ifTrue(SurfaceRules.surfaceNoiseAbove(-1.0), DIRT), replaceStoneWithGravelOnCeiling)), DIRT);
        const surfacerules$rulesource7 = SurfaceRules.sequence(SurfaceRules.ifTrue(SurfaceRules.isBiome(Biomes.FROZEN_PEAKS), SurfaceRules.sequence(SurfaceRules.ifTrue(isSteep, PACKED_ICE), SurfaceRules.ifTrue(SurfaceRules.noiseCondition(Noises.PACKED_ICE, 0.0, 0.2), PACKED_ICE), SurfaceRules.ifTrue(SurfaceRules.noiseCondition(Noises.ICE, 0.0, 0.025), ICE), SNOW_BLOCK)), SurfaceRules.ifTrue(SurfaceRules.isBiome(Biomes.SNOWY_SLOPES), SurfaceRules.sequence(SurfaceRules.ifTrue(isSteep, STONE), anotherPowderSnow, SNOW_BLOCK)), SurfaceRules.ifTrue(SurfaceRules.isBiome(Biomes.JAGGED_PEAKS), SurfaceRules.sequence(SurfaceRules.ifTrue(isSteep, STONE), SNOW_BLOCK)), SurfaceRules.ifTrue(SurfaceRules.isBiome(Biomes.GROVE), SurfaceRules.sequence(anotherPowderSnow, SNOW_BLOCK)), ceilingRules, SurfaceRules.ifTrue(SurfaceRules.isBiome(Biomes.WINDSWEPT_SAVANNA), SurfaceRules.sequence(SurfaceRules.ifTrue(SurfaceRules.surfaceNoiseAbove(1.75), STONE), SurfaceRules.ifTrue(SurfaceRules.surfaceNoiseAbove(-0.5), COARSE_DIRT))), SurfaceRules.ifTrue(SurfaceRules.isBiome(Biomes.WINDSWEPT_GRAVELLY_HILLS), SurfaceRules.sequence(SurfaceRules.ifTrue(SurfaceRules.surfaceNoiseAbove(2.0), replaceStoneWithGravelOnCeiling), SurfaceRules.ifTrue(SurfaceRules.surfaceNoiseAbove(1.0), STONE), SurfaceRules.ifTrue(SurfaceRules.surfaceNoiseAbove(-1.0), replaceGrassWithDirtIfWaterIsAbove), replaceStoneWithGravelOnCeiling)), SurfaceRules.ifTrue(SurfaceRules.isBiome(Biomes.OLD_GROWTH_PINE_TAIGA, Biomes.OLD_GROWTH_SPRUCE_TAIGA), SurfaceRules.sequence(SurfaceRules.ifTrue(SurfaceRules.surfaceNoiseAbove(1.75), COARSE_DIRT), SurfaceRules.ifTrue(SurfaceRules.surfaceNoiseAbove(-0.95), PODZOL))), SurfaceRules.ifTrue(SurfaceRules.isBiome(Biomes.ICE_SPIKES), SNOW_BLOCK), SurfaceRules.ifTrue(SurfaceRules.isBiome(Biomes.MUSHROOM_FIELDS), MYCELIUM), replaceGrassWithDirtIfWaterIsAbove);
        const surfacerules$conditionsource13 = SurfaceRules.noiseCondition(Noises.SURFACE, -0.909, -0.5454);
        const surfacerules$conditionsource14 = SurfaceRules.noiseCondition(Noises.SURFACE, -0.1818, 0.1818);
        const surfacerules$conditionsource15 = SurfaceRules.noiseCondition(Noises.SURFACE, 0.5454, 0.909);
        const surfacerules$rulesource8 = SurfaceRules.sequence(SurfaceRules.ifTrue(SurfaceRules.ON_FLOOR, SurfaceRules.sequence(SurfaceRules.ifTrue(SurfaceRules.isBiome(Biomes.WOODED_BADLANDS), SurfaceRules.ifTrue(surfacerules$conditionsource, SurfaceRules.sequence(SurfaceRules.ifTrue(surfacerules$conditionsource13, COARSE_DIRT), SurfaceRules.ifTrue(surfacerules$conditionsource14, COARSE_DIRT), SurfaceRules.ifTrue(surfacerules$conditionsource15, COARSE_DIRT), replaceGrassWithDirtIfWaterIsAbove))), SurfaceRules.ifTrue(SurfaceRules.isBiome(Biomes.SWAMP), SurfaceRules.ifTrue(surfacerules$conditionsource4, SurfaceRules.ifTrue(SurfaceRules.not(surfacerules$conditionsource5), SurfaceRules.ifTrue(SurfaceRules.noiseCondition(Noises.SWAMP, 0.0), WATER)))))), SurfaceRules.ifTrue(SurfaceRules.isBiome(Biomes.BADLANDS, Biomes.ERODED_BADLANDS, Biomes.WOODED_BADLANDS), SurfaceRules.sequence(SurfaceRules.ifTrue(SurfaceRules.ON_FLOOR, SurfaceRules.sequence(SurfaceRules.ifTrue(surfacerules$conditionsource1, ORANGE_TERRACOTTA), SurfaceRules.ifTrue(surfacerules$conditionsource3, SurfaceRules.sequence(SurfaceRules.ifTrue(surfacerules$conditionsource13, TERRACOTTA), SurfaceRules.ifTrue(surfacerules$conditionsource14, TERRACOTTA), SurfaceRules.ifTrue(surfacerules$conditionsource15, TERRACOTTA), SurfaceRules.bandlands())), SurfaceRules.ifTrue(isWaterAboveTheBlock, SurfaceRules.sequence(SurfaceRules.ifTrue(SurfaceRules.ON_CEILING, RED_SANDSTONE), RED_SAND)), SurfaceRules.ifTrue(SurfaceRules.not(isHole), ORANGE_TERRACOTTA), SurfaceRules.ifTrue(surfacerules$conditionsource8, WHITE_TERRACOTTA), replaceStoneWithGravelOnCeiling)), SurfaceRules.ifTrue(surfacerules$conditionsource2, SurfaceRules.sequence(SurfaceRules.ifTrue(surfacerules$conditionsource5, SurfaceRules.ifTrue(SurfaceRules.not(surfacerules$conditionsource3), ORANGE_TERRACOTTA)), SurfaceRules.bandlands())), SurfaceRules.ifTrue(SurfaceRules.UNDER_FLOOR, SurfaceRules.ifTrue(surfacerules$conditionsource8, WHITE_TERRACOTTA)))), SurfaceRules.ifTrue(SurfaceRules.ON_FLOOR, SurfaceRules.ifTrue(isWaterAboveTheBlock, SurfaceRules.sequence(SurfaceRules.ifTrue(isFrozenOcean, SurfaceRules.ifTrue(isHole, SurfaceRules.sequence(SurfaceRules.ifTrue(isWater, AIR), SurfaceRules.ifTrue(SurfaceRules.temperature(), ICE), WATER))), surfacerules$rulesource7))), SurfaceRules.ifTrue(surfacerules$conditionsource8, SurfaceRules.sequence(SurfaceRules.ifTrue(SurfaceRules.ON_FLOOR, SurfaceRules.ifTrue(isFrozenOcean, SurfaceRules.ifTrue(isHole, WATER))), SurfaceRules.ifTrue(SurfaceRules.UNDER_FLOOR, surfacerules$rulesource6), SurfaceRules.ifTrue(isWarmOceanDesertOrBeach, SurfaceRules.ifTrue(SurfaceRules.stoneDepthCheck(0, true, true, CaveSurface.FLOOR), SANDSTONE)))), SurfaceRules.ifTrue(SurfaceRules.ON_FLOOR, SurfaceRules.sequence(SurfaceRules.ifTrue(SurfaceRules.isBiome(Biomes.FROZEN_PEAKS, Biomes.JAGGED_PEAKS), STONE), SurfaceRules.ifTrue(SurfaceRules.isBiome(Biomes.WARM_OCEAN, Biomes.LUKEWARM_OCEAN, Biomes.DEEP_LUKEWARM_OCEAN), replaceSandstoneWithSandOnCeiling), replaceStoneWithGravelOnCeiling)));
        const builder = [];
        if (haveBedrockRoof) {
            builder.push(SurfaceRules.ifTrue(SurfaceRules.not(SurfaceRules.verticalGradient("bedrock_roof", VerticalAnchor.belowTop(5), VerticalAnchor.top())), BEDROCK));
        }
        if (haveBedrockFloor) {
            builder.push(SurfaceRules.ifTrue(SurfaceRules.verticalGradient("bedrock_floor", VerticalAnchor.bottom(), VerticalAnchor.aboveBottom(5)), BEDROCK));
        }
        const surfacerules$rulesource9 = SurfaceRules.ifTrue(SurfaceRules.abovePreliminarySurface(), surfacerules$rulesource8);
        builder.push(p_198381_ ? surfacerules$rulesource9 : surfacerules$rulesource8);
        builder.push(SurfaceRules.ifTrue(SurfaceRules.verticalGradient("deepslate", VerticalAnchor.absolute(0), VerticalAnchor.absolute(8)), DEEPSLATE));
        return SurfaceRules.sequence(...builder);
    }
}

class CubicSpline {
    static constant(value) {
        return new Constant(value);
    }
    static builder(coordinate, valueTransformer) {
        return new CubicSplineBuilder(coordinate, valueTransformer);
    }
}
class CubicSplineBuilder {
    coordinate;
    valueTransformer;
    locations = [];
    values = [];
    derivatives = [];
    constructor(coordinate, valueTransformer) {
        this.coordinate = coordinate;
        this.valueTransformer = valueTransformer ? valueTransformer : value => value;
    }
    addPoint(t, value, derivative) {
        if (typeof value === "number") {
            value = new Constant(this.valueTransformer(value));
        }
        this.locations.push(t);
        this.values.push(value);
        this.derivatives.push(derivative);
        return this;
    }
    build() {
        return new Multipoint(this.coordinate, this.locations, this.values.slice(), this.derivatives);
    }
}
class Constant extends CubicSpline {
    value;
    constructor(value) {
        super();
        this.value = value;
    }
    apply() {
        return this.value;
    }
}
class Multipoint extends CubicSpline {
    coordinate;
    locations;
    values;
    derivatives;
    constructor(coordinate, locations, values, derivatives) {
        super();
        this.coordinate = coordinate;
        this.locations = locations;
        this.values = values;
        this.derivatives = derivatives;
    }
    apply(value) {
        const loc = this.coordinate(value);
        const index = binarySearch(0, this.locations.length, index => loc < this.locations[index]) - 1;
        const j = this.locations.length - 1;
        if (index < 0) {
            return this.values[0].apply(value) + this.derivatives[0] * (loc - this.locations[0]);
        }
        else if (index == j) {
            return this.values[j].apply(value) + this.derivatives[j] * (loc - this.locations[j]);
        }
        else {
            const prevLoc = this.locations[index];
            const nextLoc = this.locations[index + 1];
            const t = (loc - prevLoc) / (nextLoc - prevLoc);
            const tofloatfunction = this.values[index];
            const tofloatfunction1 = this.values[index + 1];
            const d0 = this.derivatives[index];
            const d1 = this.derivatives[index + 1];
            const v0 = tofloatfunction.apply(value);
            const v1 = tofloatfunction1.apply(value);
            const v2 = d0 * (nextLoc - prevLoc) - (v1 - v0);
            const v3 = -d1 * (nextLoc - prevLoc) + (v1 - v0);
            return lerp(t, v0, v1) + t * (1 - t) * lerp(t, v2, v3);
        }
    }
}

class Point {
    continents;
    erosion;
    ridges;
    weirdness;
    constructor(continents, erosion, ridges, weirdness) {
        this.continents = continents;
        this.erosion = erosion;
        this.ridges = ridges;
        this.weirdness = weirdness;
    }
    static CONTINENTS(value) {
        return value.continents;
    }
    static EROSION(value) {
        return value.erosion;
    }
    static RIDGES(value) {
        return value.ridges;
    }
    static WEIRDNESS(value) {
        return value.weirdness;
    }
}
const NO_TRANSFORM = v => v;
class TerrainShaper {
    offsetSampler;
    factorSampler;
    jaggednessSampler;
    constructor(offsetSampler, factorSampler, jaggednessSampler) {
        this.offsetSampler = offsetSampler;
        this.factorSampler = factorSampler;
        this.jaggednessSampler = jaggednessSampler;
        //
    }
    static getAmplifiedOffset(value) {
        return value < 0 ? value : value * 2;
    }
    static getAmplifiedFactor(value) {
        return 1.25 - 6.25 / (value + 5);
    }
    static getAmplifiedJaggedness(value) {
        return value * 2;
    }
    static overworld(isAmplified) {
        const offsetTransformer = isAmplified ? TerrainShaper.getAmplifiedOffset : NO_TRANSFORM;
        const factorTransformer = isAmplified ? TerrainShaper.getAmplifiedFactor : NO_TRANSFORM;
        const jaggednessTransformer = isAmplified
            ? TerrainShaper.getAmplifiedJaggedness
            : NO_TRANSFORM;
        const erosionOffset1 = TerrainShaper.buildErosionOffsetSpline(-0.15, 0.0, 0.0, 0.1, 0.0, -0.03, false, false, offsetTransformer);
        const erosionOffset2 = TerrainShaper.buildErosionOffsetSpline(-0.1, 0.03, 0.1, 0.1, 0.01, -0.03, false, false, offsetTransformer);
        const erosionOffset3 = TerrainShaper.buildErosionOffsetSpline(-0.1, 0.03, 0.1, 0.7, 0.01, -0.03, true, true, offsetTransformer);
        const erosionOffset4 = TerrainShaper.buildErosionOffsetSpline(-0.05, 0.03, 0.1, 1.0, 0.01, 0.01, true, true, offsetTransformer);
        const offsetSampler = CubicSpline.builder(Point.CONTINENTS, offsetTransformer)
            .addPoint(-1.1, 0.044, 0.0)
            .addPoint(-1.02, -0.2222, 0.0)
            .addPoint(-0.51, -0.2222, 0.0)
            .addPoint(-0.44, -0.12, 0.0)
            .addPoint(-0.18, -0.12, 0.0)
            .addPoint(-0.16, erosionOffset1, 0.0)
            .addPoint(-0.15, erosionOffset1, 0.0)
            .addPoint(-0.1, erosionOffset2, 0.0)
            .addPoint(0.25, erosionOffset3, 0.0)
            .addPoint(1.0, erosionOffset4, 0.0)
            .build();
        const factorSampler = CubicSpline.builder(Point.CONTINENTS, NO_TRANSFORM)
            .addPoint(-0.19, 3.95, 0.0)
            .addPoint(-0.15, TerrainShaper.getErosionFactor(6.25, true, NO_TRANSFORM), 0.0)
            .addPoint(-0.1, TerrainShaper.getErosionFactor(5.47, true, factorTransformer), 0.0)
            .addPoint(0.03, TerrainShaper.getErosionFactor(5.08, true, factorTransformer), 0.0)
            .addPoint(0.06, TerrainShaper.getErosionFactor(4.69, false, factorTransformer), 0.0)
            .build();
        const jaggednessSampler = CubicSpline.builder(Point.CONTINENTS, jaggednessTransformer)
            .addPoint(-0.11, 0.0, 0.0)
            .addPoint(0.03, TerrainShaper.buildErosionJaggednessSpline(1.0, 0.5, 0.0, 0.0, jaggednessTransformer), 0.0)
            .addPoint(0.65, TerrainShaper.buildErosionJaggednessSpline(1.0, 1.0, 1.0, 0.0, jaggednessTransformer), 0.0)
            .build();
        return new TerrainShaper(offsetSampler, factorSampler, jaggednessSampler);
    }
    offset(value) {
        return this.offsetSampler.apply(value) + -0.50375;
    }
    factor(value) {
        return this.factorSampler.apply(value);
    }
    jaggedness(value) {
        return this.jaggednessSampler.apply(value);
    }
    makePoint(continents, erosion, weirdness) {
        return new Point(continents, erosion, TerrainShaper.peaksAndValleys(weirdness), weirdness);
    }
    static peaksAndValleys(weirdness) {
        return -(Math.abs(Math.abs(weirdness) - 0.6666667) - 0.33333334) * 3.0;
    }
    static mountainContinentalness(x, y, z) {
        const f2 = 1.0 - (1.0 - y) * 0.5;
        const f3 = 0.5 * (1.0 - y);
        const f4 = (x + 1.17) * 0.46082947;
        const f5 = f4 * f2 - f3;
        return x < z ? Math.max(f5, -0.2222) : Math.max(f5, 0.0);
    }
    static calculateMountainRidgeZeroContinentalnessPoint(p_187344_) {
        const f2 = 1.0 - (1.0 - p_187344_) * 0.5;
        const f3 = 0.5 * (1.0 - p_187344_);
        return f3 / (0.46082947 * f2) - 1.17;
    }
    static calculateSlope(p_187272_, p_187273_, p_187274_, p_187275_) {
        return (p_187273_ - p_187272_) / (p_187275_ - p_187274_);
    }
    static buildMountainRidgeSplineWithPoints(p_187331_, p_187332_, transformer) {
        const builder = CubicSpline.builder(Point.RIDGES, transformer);
        const f2 = TerrainShaper.mountainContinentalness(-1.0, p_187331_, -0.7);
        const f4 = TerrainShaper.mountainContinentalness(1.0, p_187331_, -0.7);
        const f5 = TerrainShaper.calculateMountainRidgeZeroContinentalnessPoint(p_187331_);
        if (-0.65 < f5 && f5 < 1.0) {
            const f14 = TerrainShaper.mountainContinentalness(-0.65, p_187331_, -0.7);
            const f9 = TerrainShaper.mountainContinentalness(-0.75, p_187331_, -0.7);
            const f10 = TerrainShaper.calculateSlope(f2, f9, -1.0, -0.75);
            builder.addPoint(-1.0, f2, f10);
            builder.addPoint(-0.75, f9, 0.0);
            builder.addPoint(-0.65, f14, 0.0);
            const f11 = TerrainShaper.mountainContinentalness(f5, p_187331_, -0.7);
            const f12 = TerrainShaper.calculateSlope(f11, f4, f5, 1.0);
            builder.addPoint(f5 - 0.01, f11, 0.0);
            builder.addPoint(f5, f11, f12);
            builder.addPoint(1.0, f4, f12);
        }
        else {
            const f7 = TerrainShaper.calculateSlope(f2, f4, -1.0, 1.0);
            if (p_187332_) {
                builder.addPoint(-1.0, Math.max(0.2, f2), 0.0);
                builder.addPoint(0.0, lerp(0.5, f2, f4), f7);
            }
            else {
                builder.addPoint(-1.0, f2, f7);
            }
            builder.addPoint(1.0, f4, f7);
        }
        return builder.build();
    }
    static buildErosionOffsetSpline(p_187285_, p_187286_, p_187287_, p_187288_, p_187289_, p_187290_, p_187291_, p_187292_, transformer) {
        const cubicspline = TerrainShaper.buildMountainRidgeSplineWithPoints(lerp(p_187288_, 0.6, 1.5), p_187292_, transformer);
        const cubicspline1 = TerrainShaper.buildMountainRidgeSplineWithPoints(lerp(p_187288_, 0.6, 1.0), p_187292_, transformer);
        const cubicspline2 = TerrainShaper.buildMountainRidgeSplineWithPoints(p_187288_, p_187292_, transformer);
        const cubicspline3 = TerrainShaper.ridgeSpline(p_187285_ - 0.15, 0.5 * p_187288_, lerp(0.5, 0.5, 0.5) * p_187288_, 0.5 * p_187288_, 0.6 * p_187288_, 0.5, transformer);
        const cubicspline4 = TerrainShaper.ridgeSpline(p_187285_, p_187289_ * p_187288_, p_187286_ * p_187288_, 0.5 * p_187288_, 0.6 * p_187288_, 0.5, transformer);
        const cubicspline5 = TerrainShaper.ridgeSpline(p_187285_, p_187289_, p_187289_, p_187286_, p_187287_, 0.5, transformer);
        const cubicspline6 = TerrainShaper.ridgeSpline(p_187285_, p_187289_, p_187289_, p_187286_, p_187287_, 0.5, transformer);
        const cubicspline7 = CubicSpline.builder(Point.RIDGES, transformer)
            .addPoint(-1.0, p_187285_, 0.0)
            .addPoint(-0.4, cubicspline5, 0.0)
            .addPoint(0.0, p_187287_ + 0.07, 0.0)
            .build();
        const cubicspline8 = TerrainShaper.ridgeSpline(-0.02, p_187290_, p_187290_, p_187286_, p_187287_, 0.0, transformer);
        const builder = CubicSpline.builder(Point.EROSION, transformer)
            .addPoint(-0.85, cubicspline, 0.0)
            .addPoint(-0.7, cubicspline1, 0.0)
            .addPoint(-0.4, cubicspline2, 0.0)
            .addPoint(-0.35, cubicspline3, 0.0)
            .addPoint(-0.1, cubicspline4, 0.0)
            .addPoint(0.2, cubicspline5, 0.0);
        if (p_187291_) {
            builder
                .addPoint(0.4, cubicspline6, 0.0)
                .addPoint(0.45, cubicspline7, 0.0)
                .addPoint(0.55, cubicspline7, 0.0)
                .addPoint(0.58, cubicspline6, 0.0);
        }
        builder.addPoint(0.7, cubicspline8, 0.0);
        return builder.build();
    }
    static getErosionFactor(p_187308_, p_187309_, transformer) {
        const cubicspline = CubicSpline.builder(Point.WEIRDNESS, transformer)
            .addPoint(-0.2, 6.3, 0.0)
            .addPoint(0.2, p_187308_, 0.0)
            .build();
        const builder = CubicSpline.builder(Point.EROSION, transformer)
            .addPoint(-0.6, cubicspline, 0.0)
            .addPoint(-0.5, CubicSpline.builder(Point.WEIRDNESS, transformer)
            .addPoint(-0.05, 6.3, 0.0)
            .addPoint(0.05, 2.67, 0.0)
            .build(), 0.0)
            .addPoint(-0.35, cubicspline, 0.0)
            .addPoint(-0.25, cubicspline, 0.0)
            .addPoint(-0.1, CubicSpline.builder(Point.WEIRDNESS, transformer)
            .addPoint(-0.05, 2.67, 0.0)
            .addPoint(0.05, 6.3, 0.0)
            .build(), 0.0)
            .addPoint(0.03, cubicspline, 0.0);
        if (p_187309_) {
            const cubicspline1 = CubicSpline.builder(Point.WEIRDNESS, transformer)
                .addPoint(0.0, p_187308_, 0.0)
                .addPoint(0.1, 0.625, 0.0)
                .build();
            const cubicspline2 = CubicSpline.builder(Point.RIDGES, transformer)
                .addPoint(-0.9, p_187308_, 0.0)
                .addPoint(-0.69, cubicspline1, 0.0)
                .build();
            builder
                .addPoint(0.35, p_187308_, 0.0)
                .addPoint(0.45, cubicspline2, 0.0)
                .addPoint(0.55, cubicspline2, 0.0)
                .addPoint(0.62, p_187308_, 0.0);
        }
        else {
            const cubicspline3 = CubicSpline.builder(Point.RIDGES, transformer)
                .addPoint(-0.7, cubicspline, 0.0)
                .addPoint(-0.15, 1.37, 0.0)
                .build();
            const cubicspline4 = CubicSpline.builder(Point.RIDGES, transformer)
                .addPoint(0.45, cubicspline, 0.0)
                .addPoint(0.7, 1.56, 0.0)
                .build();
            builder
                .addPoint(0.05, cubicspline4, 0.0)
                .addPoint(0.4, cubicspline4, 0.0)
                .addPoint(0.45, cubicspline3, 0.0)
                .addPoint(0.55, cubicspline3, 0.0)
                .addPoint(0.58, p_187308_, 0.0);
        }
        return builder.build();
    }
    static ridgeSpline(p_187277_, p_187278_, p_187279_, p_187280_, p_187281_, p_187282_, transformer) {
        const f = Math.max(0.5 * (p_187278_ - p_187277_), p_187282_);
        const f1 = 5.0 * (p_187279_ - p_187278_);
        return CubicSpline.builder(Point.RIDGES, transformer)
            .addPoint(-1.0, p_187277_, f)
            .addPoint(-0.4, p_187278_, Math.min(f, f1))
            .addPoint(0.0, p_187279_, f1)
            .addPoint(0.4, p_187280_, 2.0 * (p_187280_ - p_187279_))
            .addPoint(1.0, p_187281_, 0.7 * (p_187281_ - p_187280_))
            .build();
    }
    static buildErosionJaggednessSpline(p_187295_, p_187296_, p_187297_, p_187298_, p_187299_) {
        const cubicspline = TerrainShaper.buildRidgeJaggednessSpline(p_187295_, p_187297_, p_187299_);
        const cubicspline1 = TerrainShaper.buildRidgeJaggednessSpline(p_187296_, p_187298_, p_187299_);
        return CubicSpline.builder(Point.EROSION, p_187299_)
            .addPoint(-1.0, cubicspline, 0.0)
            .addPoint(-0.78, cubicspline1, 0.0)
            .addPoint(-0.5775, cubicspline1, 0.0)
            .addPoint(-0.375, 0.0, 0.0)
            .build();
    }
    static buildWeirdnessJaggednessSpline(p_187305_, transformer) {
        const v0 = 0.63 * p_187305_;
        const v1 = 0.3 * p_187305_;
        return CubicSpline.builder(Point.WEIRDNESS, transformer)
            .addPoint(-0.01, v0, 0.0)
            .addPoint(0.01, v1, 0.0)
            .build();
    }
    static buildRidgeJaggednessSpline(weirdness1, weirdness0, transformer) {
        const f = TerrainShaper.peaksAndValleys(0.4);
        const f1 = TerrainShaper.peaksAndValleys(0.56666666);
        const middlePeaksAndValleys = (f + f1) / 2.0;
        const builder = CubicSpline.builder(Point.RIDGES, transformer);
        builder.addPoint(f, 0.0, 0.0);
        if (weirdness0 > 0.0) {
            builder.addPoint(middlePeaksAndValleys, TerrainShaper.buildWeirdnessJaggednessSpline(weirdness0, transformer), 0.0);
        }
        else {
            builder.addPoint(middlePeaksAndValleys, 0.0, 0.0);
        }
        if (weirdness1 > 0.0) {
            builder.addPoint(1.0, TerrainShaper.buildWeirdnessJaggednessSpline(weirdness1, transformer), 0.0);
        }
        else {
            builder.addPoint(1.0, 0.0, 0.0);
        }
        return builder.build();
    }
}

class BlendedNoise {
    minLimitNoise;
    maxLimitNoise;
    mainNoise;
    cellWidth;
    cellHeight;
    xzScale;
    yScale;
    xzMainScale;
    yMainScale;
    constructor(minLimitNoise, maxLimitNoise, mainNoise, settings, cellWidth, cellHeight) {
        this.minLimitNoise = minLimitNoise;
        this.maxLimitNoise = maxLimitNoise;
        this.mainNoise = mainNoise;
        this.cellWidth = cellWidth;
        this.cellHeight = cellHeight;
        this.xzScale = 684.412 * settings.xzScale;
        this.yScale = 684.412 * settings.yScale;
        this.xzMainScale = this.xzScale / settings.xzFactor;
        this.yMainScale = this.yScale / settings.yFactor;
    }
    static create(randomSource, settings, cellWidth, cellHeight) {
        return new BlendedNoise(PerlinNoise.createLegacyForBlendedNoise(randomSource, IntStream.rangeClosed(-15, 0)), PerlinNoise.createLegacyForBlendedNoise(randomSource, IntStream.rangeClosed(-15, 0)), PerlinNoise.createLegacyForBlendedNoise(randomSource, IntStream.rangeClosed(-7, 0)), settings, cellWidth, cellHeight);
    }
    calculateNoise(x, y, z) {
        const cellX = floorDiv(x, this.cellWidth);
        const cellY = floorDiv(y, this.cellHeight);
        const cellZ = floorDiv(z, this.cellWidth);
        let minNoiseValue = 0.0;
        let maxNoiseValue = 0.0;
        let noiseValue = 0.0;
        let scale = 1.0;
        for (let octave = 0; octave < 8; ++octave) {
            const improvedNoise = this.mainNoise.getOctaveNoise(octave);
            if (improvedNoise != null) {
                noiseValue +=
                    improvedNoise.noise(PerlinNoise.wrap(cellX * this.xzMainScale * scale), PerlinNoise.wrap(cellY * this.yMainScale * scale), PerlinNoise.wrap(cellZ * this.xzMainScale * scale), this.yMainScale * scale, cellY * this.yMainScale * scale) / scale;
            }
            scale /= 2.0;
        }
        const t = (noiseValue / 10.0 + 1.0) / 2.0;
        const isMaxOrHigher = t >= 1.0;
        const isMinOrLower = t <= 0.0;
        scale = 1.0;
        for (let octave = 0; octave < 16; ++octave) {
            const x = PerlinNoise.wrap(cellX * this.xzScale * scale);
            const y = PerlinNoise.wrap(cellY * this.yScale * scale);
            const z = PerlinNoise.wrap(cellZ * this.xzScale * scale);
            const yScale = this.yScale * scale;
            if (!isMaxOrHigher) {
                const improvedNoise = this.minLimitNoise.getOctaveNoise(octave);
                if (improvedNoise != null) {
                    minNoiseValue += improvedNoise.noise(x, y, z, yScale, cellY * yScale) / scale;
                }
            }
            if (!isMinOrLower) {
                const improvedNoise = this.maxLimitNoise.getOctaveNoise(octave);
                if (improvedNoise != null) {
                    maxNoiseValue += improvedNoise.noise(x, y, z, yScale, cellY * yScale) / scale;
                }
            }
            scale /= 2.0;
        }
        return clampedLerp(minNoiseValue / 512.0, maxNoiseValue / 512.0, t) / 128.0;
    }
}

class FluidStatus {
    fluidLevel;
    fluidType;
    constructor(fluidLevel, fluidType) {
        this.fluidLevel = fluidLevel;
        this.fluidType = fluidType;
    }
    at(y) {
        return y < this.fluidLevel ? this.fluidType : Blocks.AIR;
    }
}
const Long_MAX_VALUE = 2n ** 63n - 1n;
class NoiseBasedAquifer {
    noiseChunk;
    barrierNoise;
    fluidLevelFloodednessNoise;
    fluidLevelSpreadNoise;
    lavaNoise;
    positionalRandomFactory;
    globalFluidPicker;
    minGridX;
    minGridY;
    minGridZ;
    gridSizeX;
    gridSizeZ;
    aquiferCache;
    aquiferLocationCache;
    constructor(noiseChunk, chunkPos, barrierNoise, fluidLevelFloodednessNoise, fluidLevelSpreadNoise, lavaNoise, positionalRandomFactory, y, height, globalFluidPicker) {
        this.noiseChunk = noiseChunk;
        this.barrierNoise = barrierNoise;
        this.fluidLevelFloodednessNoise = fluidLevelFloodednessNoise;
        this.fluidLevelSpreadNoise = fluidLevelSpreadNoise;
        this.lavaNoise = lavaNoise;
        this.positionalRandomFactory = positionalRandomFactory;
        this.globalFluidPicker = globalFluidPicker;
        this.minGridX = this.gridX(chunkPos.getMinBlockX()) - 1;
        this.minGridY = this.gridY(y) - 1;
        this.minGridZ = this.gridZ(chunkPos.getMinBlockZ()) - 1;
        const maxGridX = this.gridX(chunkPos.getMaxBlockX()) + 1;
        const maxGridY = this.gridY(y + height) + 1;
        const maxGridZ = this.gridZ(chunkPos.getMaxBlockZ()) + 1;
        this.gridSizeX = maxGridX - this.minGridX + 1;
        const gridSizeY = maxGridY - this.minGridY + 1;
        this.gridSizeZ = maxGridZ - this.minGridZ + 1;
        const gridSize = this.gridSizeX * gridSizeY * this.gridSizeZ;
        this.aquiferCache = new Array(gridSize);
        this.aquiferLocationCache = new Array(gridSize);
        this.aquiferLocationCache.fill(Long_MAX_VALUE);
    }
    gridX(x) {
        return floorDiv(x, 16);
    }
    gridY(y) {
        return floorDiv(y, 12);
    }
    gridZ(z) {
        return floorDiv(z, 16);
    }
    computeSubstance(x, y, z, baseNoise, clampedBaseNoise) {
        throw new Error("Method not implemented.");
    }
    shouldScheduleFluidUpdate() {
        throw new Error("Method not implemented.");
    }
}
class Aquifer {
    static create(noiseChunk, chunkPos, p_198195_, p_198196_, p_198197_, p_198198_, p_198199_, p_198200_, p_198201_, picker) {
        return new NoiseBasedAquifer(noiseChunk, chunkPos, p_198195_, p_198196_, p_198197_, p_198198_, p_198199_, p_198200_, p_198201_, picker);
    }
    static createDisabled(picker) {
        return {
            computeSubstance: (x, y, z, baseNoise, clampedBaseNoise) => {
                return clampedBaseNoise > 0 ? null : picker.computeFluid(x, y, z).at(y);
            },
            shouldScheduleFluidUpdate: () => {
                return false;
            },
        };
    }
}

class BlockPos {
    x;
    y;
    z;
    constructor(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
    }
}
class SectionPos {
    static blockToSectionCoord(coord) {
        return coord >> 4;
    }
    static sectionToBlockCoord(coord, coord2) {
        return (coord << 4) + (coord2 ?? 0);
    }
}
class ChunkPos {
    x;
    z;
    constructor(x, z) {
        if (typeof x === "bigint") {
            const coord = x;
            this.x = toInt(coord);
            this.z = toInt(coord >> 32n);
        }
        else if (typeof x === "number") {
            this.x = x;
            this.z = z;
        }
        else {
            const pos = x;
            this.x = SectionPos.blockToSectionCoord(pos.x);
            this.z = SectionPos.blockToSectionCoord(pos.z);
        }
    }
    toLong() {
        return ChunkPos.asLong(this.x, this.z);
    }
    static asLong(x, z) {
        if (typeof x === "number") {
            return (toLong(x) & 4294967295n) | ((toLong(z) & 4294967295n) << 32n);
        }
        else {
            const pos = x;
            return ChunkPos.asLong(SectionPos.blockToSectionCoord(pos.x), SectionPos.blockToSectionCoord(pos.z));
        }
    }
    static getX(coord) {
        return toInt(coord & 4294967295n);
    }
    static getZ(coord) {
        return toInt(unsignedShift64(coord, 32n) & 4294967295n);
    }
    getMiddleBlockX() {
        return this.getBlockX(8);
    }
    getMiddleBlockZ() {
        return this.getBlockZ(8);
    }
    getMinBlockX() {
        return SectionPos.sectionToBlockCoord(this.x);
    }
    getMinBlockZ() {
        return SectionPos.sectionToBlockCoord(this.z);
    }
    getMaxBlockX() {
        return this.getBlockX(15);
    }
    getMaxBlockZ() {
        return this.getBlockZ(15);
    }
    getRegionX() {
        return this.x >> 5;
    }
    getRegionZ() {
        return this.z >> 5;
    }
    getRegionLocalX() {
        return this.x & 31;
    }
    getRegionLocalZ() {
        return this.z & 31;
    }
    getBlockAt(x, y, z) {
        return new BlockPos(this.getBlockX(x), y, this.getBlockZ(z));
    }
    getBlockX(x) {
        return SectionPos.sectionToBlockCoord(this.x, x);
    }
    getBlockZ(z) {
        return SectionPos.sectionToBlockCoord(this.z, z);
    }
    getMiddleBlockPosition(y) {
        return new BlockPos(this.getMiddleBlockX(), y, this.getMiddleBlockZ());
    }
    getWorldPosition() {
        return new BlockPos(this.getMinBlockX(), 0, this.getMinBlockZ());
    }
}
// chunk access
class LevelHeightAccessor {
    getHeight() {
        return 384;
    }
    getMinBuildHeight() {
        return -64;
    }
    getMaxBuildHeight() {
        return this.getMinBuildHeight() + this.getHeight();
    }
    getSectionsCount() {
        return this.getMaxSection() - this.getMinSection();
    }
    getMinSection() {
        return SectionPos.blockToSectionCoord(this.getMinBuildHeight());
    }
    getMaxSection() {
        return SectionPos.blockToSectionCoord(this.getMaxBuildHeight() - 1) + 1;
    }
    isOutsideBuildHeight(y) {
        if (typeof y === "number") {
            return y < this.getMinBuildHeight() || y >= this.getMaxBuildHeight();
        }
        else {
            const pos = y;
            return this.isOutsideBuildHeight(pos.y);
        }
    }
    getSectionIndex(coord) {
        return this.getSectionIndexFromSectionY(SectionPos.blockToSectionCoord(coord));
    }
    getSectionIndexFromSectionY(y) {
        return y - this.getMinSection();
    }
    getSectionYFromSectionIndex(sectionIndex) {
        return sectionIndex + this.getMinSection();
    }
}
class ChunkAccess {
    chunkPos;
    levelHeightAccessor;
    constructor(chunkPos, levelHeightAccessor) {
        this.chunkPos = chunkPos;
        this.levelHeightAccessor = levelHeightAccessor;
        //
    }
    fillBiomesFromNoise(resolver, sampler) {
        throw new Error("TODO");
    }
    getPos() {
        return this.chunkPos;
    }
    getMinBuildHeight() {
        return this.levelHeightAccessor.getMinBuildHeight();
    }
    getMaxBuildHeight() {
        return this.levelHeightAccessor.getMaxBuildHeight();
    }
}
// generator
class WorldGenRegion {
}
class ChunkGenerator {
    biomeSource;
    constructor(biomeSource) {
        this.biomeSource = biomeSource;
        //
    }
    getNoiseBiome(x, y, z) {
        return this.biomeSource.getNoiseBiome(x, y, z, this.climateSampler());
    }
    createBiomes(chunk) {
        chunk.fillBiomesFromNoise(this.biomeSource, this.climateSampler());
        return chunk;
    }
}
class NoiseSamplingSettings {
    xzScale;
    yScale;
    xzFactor;
    yFactor;
    constructor(xzScale, yScale, xzFactor, yFactor) {
        this.xzScale = xzScale;
        this.yScale = yScale;
        this.xzFactor = xzFactor;
        this.yFactor = yFactor;
    }
}
class NoiseSlider {
    target;
    size;
    offset;
    constructor(target, size, offset) {
        this.target = target;
        this.size = size;
        this.offset = offset;
    }
    applySlide(y, cellY) {
        if (this.size <= 0) {
            return y;
        }
        else {
            const t = (cellY - this.offset) / this.size;
            return clampedLerp(this.target, y, t);
        }
    }
}
class QuartPos {
    static BITS = 2;
    static SIZE = 4;
    static MASK = 3;
    static SECTION_TO_QUARTS_BITS = 2;
    constructor() {
        //
    }
    static fromBlock(coord) {
        return coord >> QuartPos.BITS;
    }
    static quartLocal(coord) {
        return coord & QuartPos.MASK;
    }
    static toBlock(coord) {
        return coord << QuartPos.BITS;
    }
    static fromSection(coord) {
        return coord << QuartPos.SECTION_TO_QUARTS_BITS;
    }
    static toSection(coord) {
        return coord >> QuartPos.SECTION_TO_QUARTS_BITS;
    }
}
class NoiseSettings {
    minY;
    height;
    noiseSamplingSettings;
    topSlideSettings;
    bottomSlideSettings;
    noiseSizeHorizontal;
    noiseSizeVertical;
    islandNoiseOverride;
    isAmplified;
    largeBiomes;
    terrainShaper;
    constructor(minY, height, noiseSamplingSettings, topSlideSettings, bottomSlideSettings, noiseSizeHorizontal, noiseSizeVertical, islandNoiseOverride, isAmplified, largeBiomes, terrainShaper) {
        this.minY = minY;
        this.height = height;
        this.noiseSamplingSettings = noiseSamplingSettings;
        this.topSlideSettings = topSlideSettings;
        this.bottomSlideSettings = bottomSlideSettings;
        this.noiseSizeHorizontal = noiseSizeHorizontal;
        this.noiseSizeVertical = noiseSizeVertical;
        this.islandNoiseOverride = islandNoiseOverride;
        this.isAmplified = isAmplified;
        this.largeBiomes = largeBiomes;
        this.terrainShaper = terrainShaper;
    }
    get cellHeight() {
        return QuartPos.toBlock(this.noiseSizeVertical);
    }
    get cellWidth() {
        return QuartPos.toBlock(this.noiseSizeHorizontal);
    }
    get cellCountY() {
        return Math.trunc(this.height / this.cellHeight);
    }
    get minCellY() {
        return intFloorDiv(this.minY, this.cellHeight);
    }
}
class NoiseGeneratorSettings {
    noiseSettings;
    defaultBlock;
    defaultFluid;
    surfaceRule;
    seaLevel;
    disableMobGeneration;
    aquifersEnabled;
    noiseCavesEnabled;
    oreVeinsEnabled;
    noodleCavesEnabled;
    useLegacyRandom;
    static OVERWORLD = NoiseGeneratorSettings.overworld(false, false);
    constructor(noiseSettings, defaultBlock, defaultFluid, surfaceRule, seaLevel, disableMobGeneration, aquifersEnabled, noiseCavesEnabled, oreVeinsEnabled, noodleCavesEnabled, useLegacyRandom) {
        this.noiseSettings = noiseSettings;
        this.defaultBlock = defaultBlock;
        this.defaultFluid = defaultFluid;
        this.surfaceRule = surfaceRule;
        this.seaLevel = seaLevel;
        this.disableMobGeneration = disableMobGeneration;
        this.aquifersEnabled = aquifersEnabled;
        this.noiseCavesEnabled = noiseCavesEnabled;
        this.oreVeinsEnabled = oreVeinsEnabled;
        this.noodleCavesEnabled = noodleCavesEnabled;
        this.useLegacyRandom = useLegacyRandom;
    }
    static overworld(isAmplified, isLargeBiomes) {
        return new NoiseGeneratorSettings(new NoiseSettings(-64, 384, new NoiseSamplingSettings(1, 1, 80, 160), new NoiseSlider(-0.078125, 2, isAmplified ? 0 : 8), new NoiseSlider(isAmplified ? 0.4 : 0.1171875, 3, 0), 1, 2, false, isAmplified, isLargeBiomes, TerrainShaper.overworld(isAmplified)), Blocks.STONE, Blocks.WATER, SurfaceRuleData.overworld(), 63, false, true, true, true, true, false);
    }
    get randomSource() {
        return this.useLegacyRandom ? Algorithm.LEGACY : Algorithm.XOROSHIRO;
    }
}
class NoiseInterpolator {
    noiseChunk;
    noiseFiller;
    slice0;
    slice1;
    noise000;
    noise001;
    noise100;
    noise101;
    noise010;
    noise011;
    noise110;
    noise111;
    valueXZ00;
    valueXZ10;
    valueXZ01;
    valueXZ11;
    valueZ0;
    valueZ1;
    value;
    constructor(noiseChunk, noiseFiller) {
        this.noiseChunk = noiseChunk;
        this.noiseFiller = noiseFiller;
        this.slice0 = this.allocateSlice(this.noiseChunk.cellCountY, this.noiseChunk.cellCountXZ);
        this.slice1 = this.allocateSlice(this.noiseChunk.cellCountY, this.noiseChunk.cellCountXZ);
        this.noiseChunk.interpolators.push(this);
    }
    allocateSlice(cellCountY, cellCountXZ) {
        const sliceWidth = cellCountXZ + 1;
        const sliceHeight = cellCountY + 1;
        const slice = new Array(sliceWidth);
        for (let k = 0; k < sliceWidth; ++k) {
            slice[k] = new Array(sliceHeight);
        }
        return slice;
    }
    initializeForFirstCellX() {
        this.fillSlice(this.slice0, this.noiseChunk.firstCellX);
    }
    advanceCellX(cellOffsetX) {
        this.fillSlice(this.slice1, this.noiseChunk.firstCellX + cellOffsetX + 1);
    }
    fillSlice(slice, cellX) {
        const cellWidth = this.noiseChunk.noiseSettings.cellWidth;
        const cellHeight = this.noiseChunk.noiseSettings.cellHeight;
        for (let offsetZ = 0; offsetZ < this.noiseChunk.cellCountXZ + 1; ++offsetZ) {
            const cellZ = this.noiseChunk.firstCellZ + offsetZ;
            for (let offsetY = 0; offsetY < this.noiseChunk.cellCountY + 1; ++offsetY) {
                const cellY = offsetY + this.noiseChunk.cellNoiseMinY;
                const y = cellY * cellHeight;
                const noise = this.noiseFiller.calculateNoise(cellX * cellWidth, y, cellZ * cellWidth);
                slice[offsetZ][offsetY] = noise;
            }
        }
    }
    selectCellYZ(cellY, cellZ) {
        this.noise000 = this.slice0[cellZ][cellY];
        this.noise001 = this.slice0[cellZ + 1][cellY];
        this.noise100 = this.slice1[cellZ][cellY];
        this.noise101 = this.slice1[cellZ + 1][cellY];
        this.noise010 = this.slice0[cellZ][cellY + 1];
        this.noise011 = this.slice0[cellZ + 1][cellY + 1];
        this.noise110 = this.slice1[cellZ][cellY + 1];
        this.noise111 = this.slice1[cellZ + 1][cellY + 1];
    }
    updateForY(t) {
        this.valueXZ00 = lerp(t, this.noise000, this.noise010);
        this.valueXZ10 = lerp(t, this.noise100, this.noise110);
        this.valueXZ01 = lerp(t, this.noise001, this.noise011);
        this.valueXZ11 = lerp(t, this.noise101, this.noise111);
    }
    updateForX(t) {
        this.valueZ0 = lerp(t, this.valueXZ00, this.valueXZ10);
        this.valueZ1 = lerp(t, this.valueXZ01, this.valueXZ11);
    }
    updateForZ(t) {
        this.value = lerp(t, this.valueZ0, this.valueZ1);
    }
    sample() {
        return this.value;
    }
    swapSlices() {
        const temp = this.slice0;
        this.slice0 = this.slice1;
        this.slice1 = temp;
    }
}
class FlatNoiseData {
    shiftedX;
    shiftedZ;
    continentalness;
    weirdness;
    erosion;
    terrainInfo;
    constructor(shiftedX, shiftedZ, continentalness, weirdness, erosion, terrainInfo) {
        this.shiftedX = shiftedX;
        this.shiftedZ = shiftedZ;
        this.continentalness = continentalness;
        this.weirdness = weirdness;
        this.erosion = erosion;
        this.terrainInfo = terrainInfo;
    }
}
function computeIfAbsent(map, key, mappingFunction) {
    let value = map.get(key);
    if (value === undefined) {
        value = mappingFunction(key);
        map.set(key, value);
    }
    return value;
}
class NoiseChunk {
    cellCountXZ;
    cellCountY;
    cellNoiseMinY;
    sampler;
    noiseSettings;
    firstCellX;
    firstCellZ;
    firstNoiseX;
    firstNoiseZ;
    interpolators;
    _noiseData;
    _preliminarySurfaceLevel = new Map();
    aquifer;
    baseNoise;
    blender;
    static forChunk(chunkAccess, sampler, filler, generatorSettings, fluidPicker, blender) {
        const chunkPos = chunkAccess.getPos();
        const noiseSettings = generatorSettings.noiseSettings;
        const minY = Math.max(noiseSettings.minY, chunkAccess.getMinBuildHeight());
        const maxY = Math.min(noiseSettings.minY + noiseSettings.height, chunkAccess.getMaxBuildHeight());
        const cellMinY = intFloorDiv(minY, noiseSettings.cellHeight);
        const cellCountY = intFloorDiv(maxY - minY, noiseSettings.cellHeight);
        return new NoiseChunk(Math.trunc(16 / noiseSettings.cellWidth), cellCountY, cellMinY, sampler, chunkPos.getMinBlockX(), chunkPos.getMinBlockZ(), filler(), generatorSettings, fluidPicker, blender);
    }
    static forColumn(startX, startZ, cellNoiseMinY, cellCountY, sampler, noiseSettings, fluidPicker) {
        return new NoiseChunk(1, cellCountY, cellNoiseMinY, sampler, startX, startZ, {
            calculateNoise: () => 0,
        }, noiseSettings, fluidPicker, Blender.empty());
    }
    constructor(cellCountXZ, cellCountY, cellNoiseMinY, sampler, startX, startZ, filler, noiseSettings, fluidPicker, blender) {
        this.cellCountXZ = cellCountXZ;
        this.cellCountY = cellCountY;
        this.cellNoiseMinY = cellNoiseMinY;
        this.sampler = sampler;
        this.noiseSettings = noiseSettings.noiseSettings;
        this.cellCountXZ = cellCountXZ;
        this.cellCountY = cellCountY;
        this.cellNoiseMinY = cellNoiseMinY;
        this.sampler = sampler;
        const cellWidth = this.noiseSettings.cellWidth;
        this.firstCellX = floorDiv(startX, cellWidth);
        this.firstCellZ = floorDiv(startZ, cellWidth);
        this.interpolators = [];
        this.firstNoiseX = QuartPos.fromBlock(startX);
        this.firstNoiseZ = QuartPos.fromBlock(startZ);
        const countXZ = QuartPos.fromBlock(cellCountXZ * cellWidth);
        this._noiseData = new Array(countXZ + 1);
        this.blender = blender;
        for (let offsetX = 0; offsetX <= countXZ; ++offsetX) {
            const x = this.firstNoiseX + offsetX;
            this._noiseData[offsetX] = new Array(countXZ + 1);
            for (let offsetZ = 0; offsetZ <= countXZ; ++offsetZ) {
                const z = this.firstNoiseZ + offsetZ;
                this._noiseData[offsetX][offsetZ] = sampler.noiseData(x, z, blender);
            }
        }
        this.aquifer = sampler.createAquifer(this, startX, startZ, cellNoiseMinY, cellCountY, fluidPicker, noiseSettings.aquifersEnabled);
        this.baseNoise = sampler.makeBaseNoiseFiller(this, filler);
    }
    noiseData(x, z) {
        return this._noiseData[x - this.firstNoiseX][z - this.firstNoiseZ];
    }
    preliminarySurfaceLevel(x, z) {
        return computeIfAbsent(this._preliminarySurfaceLevel, ChunkPos.asLong(QuartPos.fromBlock(x), QuartPos.fromBlock(z)), linearCoord => this.computePreliminarySurfaceLevel(linearCoord));
    }
    computePreliminarySurfaceLevel(linearCoord) {
        const x = ChunkPos.getX(linearCoord);
        const z = ChunkPos.getZ(linearCoord);
        const baseX = x - this.firstNoiseX;
        const baseZ = z - this.firstNoiseZ;
        const noiseSize = this._noiseData.length;
        let terraininfo;
        if (baseX >= 0 && baseZ >= 0 && baseX < noiseSize && baseZ < noiseSize) {
            terraininfo = this.noiseData[baseX][baseZ].terrainInfo();
        }
        else {
            terraininfo = this.sampler.noiseData(x, z, this.blender).terrainInfo;
        }
        return this.sampler.getPreliminarySurfaceLevel(QuartPos.toBlock(x), QuartPos.toBlock(z), terraininfo);
    }
    createNoiseInterpolator(filler) {
        return new NoiseInterpolator(this, filler);
    }
    initializeForFirstCellX() {
        for (const interpolator of this.interpolators) {
            interpolator.initializeForFirstCellX();
        }
    }
    advanceCellX(cellOffsetX) {
        for (const interpolator of this.interpolators) {
            interpolator.advanceCellX(cellOffsetX);
        }
    }
    selectCellYZ(cellY, cellZ) {
        for (const interpolator of this.interpolators) {
            interpolator.selectCellYZ(cellY, cellZ);
        }
    }
    updateForY(t) {
        for (const interpolator of this.interpolators) {
            interpolator.updateForY(t);
        }
    }
    updateForX(t) {
        for (const interpolator of this.interpolators) {
            interpolator.updateForX(t);
        }
    }
    updateForZ(t) {
        for (const interpolator of this.interpolators) {
            interpolator.updateForZ(t);
        }
    }
    swapSlices() {
        for (const interpolator of this.interpolators) {
            interpolator.swapSlices();
        }
    }
    updateNoiseAndGenerateBaseState(x, y, z) {
        return this.baseNoise(x, y, z);
    }
}
// always empty
class Blender {
    static EMPTY = new Blender();
    blendOffsetAndFactor(x, y, terrainInfo) {
        return terrainInfo;
    }
    blendDensity(x, y, z, density) {
        return density;
    }
    getBiomeResolver(resolver) {
        return resolver;
    }
    static empty() {
        return Blender.EMPTY;
    }
}
class TerrainInfo {
    offset;
    factor;
    jaggedness;
    constructor(offset, factor, jaggedness) {
        this.offset = offset;
        this.factor = factor;
        this.jaggedness = jaggedness;
    }
}
class NoiseSampler {
    noiseSettings;
    baseNoise;
    blendedNoise;
    temperatureNoise;
    humidityNoise;
    continentalnessNoise;
    erosionNoise;
    weirdnessNoise;
    offsetNoise;
    jaggedNoise;
    // water
    aquiferPositionalRandomFactory;
    barrierNoise;
    fluidLevelFloodednessNoise;
    fluidLevelSpreadNoise;
    lavaNoise;
    constructor(noiseSettings, seed, algorithm) {
        this.noiseSettings = noiseSettings;
        this.baseNoise = noiseChunk => noiseChunk.createNoiseInterpolator({
            calculateNoise: (x, y, z) => {
                return this.calculateBaseNoise2(x, y, z, noiseChunk.noiseData(QuartPos.fromBlock(x), QuartPos.fromBlock(z))
                    .terrainInfo, noiseChunk.blender);
            },
        });
        const largeBiomes = noiseSettings.largeBiomes;
        const positionalrandomfactory = Algorithm_newInstance(algorithm, seed).forkPositional();
        if (algorithm != Algorithm.LEGACY) {
            this.blendedNoise = BlendedNoise.create(positionalrandomfactory.fromHashOf("terrain"), noiseSettings.noiseSamplingSettings, noiseSettings.cellWidth, noiseSettings.cellHeight);
            this.temperatureNoise = Noises_instantiate(positionalrandomfactory, largeBiomes ? Noises.TEMPERATURE_LARGE : Noises.TEMPERATURE);
            this.humidityNoise = Noises_instantiate(positionalrandomfactory, largeBiomes ? Noises.VEGETATION_LARGE : Noises.VEGETATION);
            this.offsetNoise = Noises_instantiate(positionalrandomfactory, Noises.SHIFT);
        }
        else {
            this.blendedNoise = BlendedNoise.create(Algorithm_newInstance(algorithm, seed), noiseSettings.noiseSamplingSettings, noiseSettings.cellWidth, noiseSettings.cellHeight);
            this.temperatureNoise = NormalNoise.createLegacyNetherBiome(Algorithm_newInstance(algorithm, seed), new NoiseParameters(-7, 1.0, 1.0));
            this.humidityNoise = NormalNoise.createLegacyNetherBiome(Algorithm_newInstance(algorithm, seed + 1n), new NoiseParameters(-7, 1.0, 1.0));
            this.offsetNoise = NormalNoise.create2(positionalrandomfactory.fromHashOf(toResourceLocation(Noises.SHIFT)), new NoiseParameters(0, 0.0));
        }
        this.aquiferPositionalRandomFactory = positionalrandomfactory
            .fromHashOf("aquifer")
            .forkPositional();
        this.barrierNoise = Noises_instantiate(positionalrandomfactory, Noises.AQUIFER_BARRIER);
        this.fluidLevelFloodednessNoise = Noises_instantiate(positionalrandomfactory, Noises.AQUIFER_FLUID_LEVEL_FLOODEDNESS);
        this.lavaNoise = Noises_instantiate(positionalrandomfactory, Noises.AQUIFER_LAVA);
        this.fluidLevelSpreadNoise = Noises_instantiate(positionalrandomfactory, Noises.AQUIFER_FLUID_LEVEL_SPREAD);
        this.continentalnessNoise = Noises_instantiate(positionalrandomfactory, largeBiomes ? Noises.CONTINENTALNESS_LARGE : Noises.CONTINENTALNESS);
        this.erosionNoise = Noises_instantiate(positionalrandomfactory, largeBiomes ? Noises.EROSION_LARGE : Noises.EROSION);
        this.weirdnessNoise = Noises_instantiate(positionalrandomfactory, Noises.RIDGE);
        this.jaggedNoise = Noises_instantiate(positionalrandomfactory, Noises.JAGGED);
    }
    calculateBaseNoise2(x, y, z, terrainInfo, blender) {
        const blended = this.blendedNoise.calculateNoise(x, y, z);
        return this.calculateBaseNoise(x, y, z, terrainInfo, blended, true, blender);
    }
    calculateBaseNoise(x, y, z, terrainInfo, blended, useJagged, blender) {
        const jagged = useJagged ? this.sampleJaggedNoise(terrainInfo.jaggedness, x, z) : 0;
        const density = (this.computeBaseDensity(y, terrainInfo) + jagged) * terrainInfo.factor;
        const height = density * (density > 0.0 ? 4 : 1);
        const blendedHeight = height + blended;
        const someHeight = blendedHeight;
        const spaghettiHeight = 64;
        const pillars = -64;
        let finalHeight = Math.max(Math.min(someHeight, spaghettiHeight), pillars);
        finalHeight = this.applySlide(finalHeight, Math.trunc(y / this.noiseSettings.cellHeight));
        finalHeight = blender.blendDensity(x, y, z, finalHeight);
        return clamp(finalHeight, -64, 64);
    }
    sampleJaggedNoise(jaggedness, x, z) {
        if (jaggedness === 0.0) {
            return 0.0;
        }
        else {
            const jagged = this.jaggedNoise.getValue(x * 1500, 0, z * 1500);
            return jagged > 0 ? jaggedness * jagged : (jaggedness / 2) * jagged;
        }
    }
    computeBaseDensity(y, terrainInfo) {
        const normalizedY = 1 - y / 128;
        return normalizedY + terrainInfo.offset;
    }
    applySlide(height, cellY) {
        const baseCellY = cellY - this.noiseSettings.minCellY;
        height = this.noiseSettings.topSlideSettings.applySlide(height, this.noiseSettings.cellCountY - baseCellY);
        return this.noiseSettings.bottomSlideSettings.applySlide(height, baseCellY);
    }
    makeBaseNoiseFiller(chunk, filler) {
        const baseNoiseSampler = this.baseNoise(chunk);
        return (x, y, z) => {
            const baseNoise = baseNoiseSampler.sample();
            let clampedBaseNoise = clamp(baseNoise * 0.64, -1, 1);
            clampedBaseNoise =
                clampedBaseNoise / 2 - (clampedBaseNoise * clampedBaseNoise * clampedBaseNoise) / 24;
            clampedBaseNoise += filler.calculateNoise(x, y, z);
            return chunk.aquifer.computeSubstance(x, y, z, baseNoise, clampedBaseNoise);
        };
    }
    getPreliminarySurfaceLevel(x, z, terrainInfo) {
        for (let cellY = this.noiseSettings.minCellY + this.noiseSettings.cellCountY; cellY >= this.noiseSettings.minCellY; --cellY) {
            const y = cellY * this.noiseSettings.cellHeight;
            const baseNoise = this.calculateBaseNoise(x, y, z, terrainInfo, -0.703125, false, Blender.empty());
            if (baseNoise > 0.390625) {
                return y;
            }
        }
        return 2 ** 31 - 1;
    }
    createAquifer(noiseChunk, x, y, cellX, cellY, picker, enabled) {
        if (!enabled) {
            return Aquifer.createDisabled(picker);
        }
        else {
            const sectionX = SectionPos.blockToSectionCoord(x);
            const sectionY = SectionPos.blockToSectionCoord(y);
            return Aquifer.create(noiseChunk, new ChunkPos(sectionX, sectionY), this.barrierNoise, this.fluidLevelFloodednessNoise, this.fluidLevelSpreadNoise, this.lavaNoise, this.aquiferPositionalRandomFactory, cellX * this.noiseSettings.cellHeight, cellY * this.noiseSettings.cellHeight, picker);
        }
    }
    noiseData(x, z, blender) {
        const shiftedX = x + this.getOffset(x, 0, z);
        const shiftedZ = z + this.getOffset(z, x, 0);
        const continentalness = this.getContinentalness(shiftedX, 0, shiftedZ);
        const weirdness = this.getWeirdness(shiftedX, 0, shiftedZ);
        const erosion = this.getErosion(shiftedX, 0, shiftedZ);
        const terrainInfo = this.terrainInfo(QuartPos.toBlock(x), QuartPos.toBlock(z), continentalness, weirdness, erosion, blender);
        return new FlatNoiseData(shiftedX, shiftedZ, continentalness, weirdness, erosion, terrainInfo);
    }
    sample(x, y, z) {
        return this.target(x, y, z, this.noiseData(x, z, Blender.empty()));
    }
    target(x, y, z, flatData) {
        const shiftedX = flatData.shiftedX;
        const shiftedY = y + this.getOffset(y, z, x);
        const d2 = flatData.shiftedZ;
        const d3 = this.computeBaseDensity(QuartPos.toBlock(y), flatData.terrainInfo);
        return target(this.getTemperature(shiftedX, shiftedY, d2), this.getHumidity(shiftedX, shiftedY, d2), flatData.continentalness, flatData.erosion, d3, flatData.weirdness);
    }
    terrainInfo(x, y, continents, weirdness, erosion, blender) {
        const terrainShaper = this.noiseSettings.terrainShaper;
        const point = terrainShaper.makePoint(continents, erosion, weirdness);
        const offset = terrainShaper.offset(point);
        const factor = terrainShaper.factor(point);
        const jaggedness = terrainShaper.jaggedness(point);
        const terrainInfo = new TerrainInfo(offset, factor, jaggedness);
        return blender.blendOffsetAndFactor(x, y, terrainInfo);
    }
    getOffset(x, y, z) {
        return this.offsetNoise.getValue(x, y, z) * 4;
    }
    getTemperature(x, y, z) {
        return this.temperatureNoise.getValue(x, 0, z);
    }
    getHumidity(x, y, z) {
        return this.humidityNoise.getValue(x, 0, z);
    }
    getContinentalness(x, y, z) {
        return this.continentalnessNoise.getValue(x, y, z);
    }
    getErosion(x, y, z) {
        return this.erosionNoise.getValue(x, y, z);
    }
    getWeirdness(x, y, z) {
        return this.weirdnessNoise.getValue(x, y, z);
    }
}
class NoiseBasedChunkGenerator extends ChunkGenerator {
    seed;
    settings;
    defaultBlock;
    sampler;
    constructor(biomeSource, seed, settings) {
        super(biomeSource);
        this.seed = seed;
        this.settings = settings;
        this.defaultBlock = settings.defaultBlock;
        const noiseSettings = settings.noiseSettings;
        this.sampler = new NoiseSampler(noiseSettings, seed, settings.randomSource);
    }
    climateSampler() {
        return this.sampler;
    }
}

function same(n1, n2, e) {
    return Math.abs(n2 - n1) <= e;
}
function test() {
    const settings = NoiseGeneratorSettings.OVERWORLD;
    const noiseSettings = settings.noiseSettings;
    const sampler = new NoiseSampler(noiseSettings, 0xdeadbeafdeadbeafn, settings.randomSource);
    const canvas = document.createElement("canvas");
    canvas.width = 1024;
    canvas.height = 1024;
    canvas.style.width = canvas.width * 1 + "px";
    canvas.style.height = canvas.height * 1 + "px";
    const ctx = canvas.getContext("2d");
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
    for (let x = 0; x < data.width; x++) {
        for (let y = 0; y < data.height; y++) {
            // const x = 520
            // const y = 538
            const p = sampler.sample(x, y, 100);
            // debugger
            const v = Math.trunc(8388608 + p.temperature + p.depth + p.erosion + p.humidity) | 0;
            data.data[(y * data.width + x) * 4 + 0] = (v >> 16) & 255;
            data.data[(y * data.width + x) * 4 + 1] = (v >> 8) & 255;
            data.data[(y * data.width + x) * 4 + 2] = v & 255;
            data.data[(y * data.width + x) * 4 + 3] = 255;
        }
    }
    ctx.putImageData(data, 0, 0);
    document.body.appendChild(canvas);
}

async function main() {
    const ammo = await Ammo();
    setServices(new ServicesClass({ ammo }));
    await Services.start();
}
test();
// main()
//# sourceMappingURL=index.js.map
