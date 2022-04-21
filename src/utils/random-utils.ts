export function xmur3(str: string): () => number {
    let h = 1779033703 ^ str.length
    for (let i = 0; i < str.length; i++) {
        h = Math.imul(h ^ str.charCodeAt(i), 3432918353)
        h = (h << 13) | (h >>> 19)
    }
    return () => {
        h = Math.imul(h ^ (h >>> 16), 2246822507)
        h = Math.imul(h ^ (h >>> 13), 3266489909)
        return (h ^= h >>> 16) >>> 0
    }
}

export function sfc32(a: number, b: number, c: number, d: number): () => number {
    return () => {
        a >>>= 0
        b >>>= 0
        c >>>= 0
        d >>>= 0
        let t = (a + b) | 0
        a = b ^ (b >>> 9)
        b = (c + (c << 3)) | 0
        c = (c << 21) | (c >>> 11)
        d = (d + 1) | 0
        t = (t + d) | 0
        c = (c + t) | 0
        return (t >>> 0) / 4294967296
    }
}

export function mulberry32(a: number): () => number {
    return () => {
        let t = (a += 0x6d2b79f5)
        t = Math.imul(t ^ (t >>> 15), t | 1)
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296
    }
}

export function xoshiro128ss(a: number, b: number, c: number, d: number): () => number {
    return () => {
        const t = b << 9
        let r = a * 5
        r = ((r << 7) | (r >>> 25)) * 9
        c ^= a
        d ^= b
        b ^= c
        a ^= d
        c ^= t
        d = (d << 11) | (d >>> 21)
        return (r >>> 0) / 4294967296
    }
}

export function jsf32(a: number, b: number, c: number, d: number): () => number {
    return () => {
        a |= 0
        b |= 0
        c |= 0
        d |= 0
        const t = (a - ((b << 27) | (b >>> 5))) | 0
        a = b ^ ((c << 17) | (c >>> 15))
        b = (c + d) | 0
        c = (d + t) | 0
        d = (a + t) | 0
        return (d >>> 0) / 4294967296
    }
}

export function randomRange(min: number, max: number, rand: () => number): number {
    const r = rand()

    return min + (max - min) * r
}
