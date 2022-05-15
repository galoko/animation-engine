export class PerlinNoise {
    private static readonly ROUND_OFF = 33554432

    private readonly noiseLevels: ImprovedNoise[]
    private readonly firstOctave: number
    private readonly amplitudes: number[]
    private readonly lowestFreqValueFactor: number
    private readonly lowestFreqInputFactor: number
}
