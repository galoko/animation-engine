import { Biomes } from "./biomes"
import { Sampler, ParameterPoint, TargetPoint, findValueBruteForce } from "./climate"
import { Pair } from "./consumer"

export interface BiomeResolver {
    getNoiseBiome(x: number, y: number, z: number, sampler: Sampler): Biomes
}

export abstract class BiomeSource implements BiomeResolver {
    private readonly biomes: Set<Biomes>

    constructor(biomes: Biomes[]) {
        this.biomes = new Set(biomes)
    }

    abstract getNoiseBiome(x: number, y: number, z: number, sampler: Sampler): Biomes
}

export class MultiNoiseBiomeSource extends BiomeSource {
    constructor(private readonly parameters: Pair<ParameterPoint, Biomes>[]) {
        super(parameters.map(e => e.second))
    }

    getNoiseBiome(x: number, y: number, z: number, sampler: Sampler): Biomes
    getNoiseBiome(targetPoint: TargetPoint): Biomes
    getNoiseBiome(x: TargetPoint | number, y?: number, z?: number, sampler?: Sampler): Biomes {
        if (typeof x === "number") {
            if (y === undefined || z === undefined || !sampler) {
                throw new Error()
            }
            x = sampler.sample(x, y, z)
        }

        return findValueBruteForce(x, this.parameters)
    }
}
