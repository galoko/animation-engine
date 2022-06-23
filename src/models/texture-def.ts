export type TextureOptions = {
    name: string
    nn: boolean
}

const DEFAULT_TEXTURE_OPTIONS = {
    name: "",
    nn: false,
} as TextureOptions

export function getTextureOptions(options: Partial<TextureOptions>): TextureOptions {
    return Object.assign({ ...DEFAULT_TEXTURE_OPTIONS }, options || {})
}

export class TextureDef {
    constructor(public readonly options: Partial<TextureOptions>) {
        //
    }
}
