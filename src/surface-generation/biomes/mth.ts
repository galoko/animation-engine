export function binarySearch(
    startIndex: number,
    endIndex: number,
    predicate: (index: number) => boolean
): number {
    let i = endIndex - startIndex

    while (i > 0) {
        const j = Math.trunc(i / 2)
        const k = startIndex + j
        if (predicate(k)) {
            i = j
        } else {
            startIndex = k + 1
            i -= j + 1
        }
    }

    return startIndex
}

export function lerp(t: number, v0: number, v1: number): number {
    return v0 + t * (v1 - v0)
}
