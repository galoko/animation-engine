import { CubicSpline, ToFloatFunction } from "./cubic-spline"
import * as Mth from "./mth"

class Point {
    constructor(
        readonly continents: number,
        readonly erosion: number,
        readonly ridges: number,
        readonly weirdness: number
    ) {}

    static CONTINENTS(value: Point) {
        return value.continents
    }
    static EROSION(value: Point) {
        return value.erosion
    }
    static RIDGES(value: Point) {
        return value.ridges
    }
    static WEIRDNESS(value: Point) {
        return value.weirdness
    }
}

const NO_TRANSFORM = v => v

export class TerrainShaper {
    constructor(
        private readonly offsetSampler: CubicSpline<Point>,
        private readonly factorSampler: CubicSpline<Point>,
        private readonly jaggednessSampler: CubicSpline<Point>
    ) {
        //
    }

    private static getAmplifiedOffset(value: number): number {
        return value < 0 ? value : value * 2
    }

    private static getAmplifiedFactor(value: number): number {
        return 1.25 - 6.25 / (value + 5)
    }

    private static getAmplifiedJaggedness(value: number): number {
        return value * 2
    }

    static overworld(isAmplified: boolean): TerrainShaper {
        const offsetTransformer = isAmplified ? TerrainShaper.getAmplifiedOffset : NO_TRANSFORM
        const factorTransformer = isAmplified ? TerrainShaper.getAmplifiedFactor : NO_TRANSFORM
        const jaggednessTransformer = isAmplified
            ? TerrainShaper.getAmplifiedJaggedness
            : NO_TRANSFORM
        const erosionOffset1 = TerrainShaper.buildErosionOffsetSpline(
            -0.15,
            0.0,
            0.0,
            0.1,
            0.0,
            -0.03,
            false,
            false,
            offsetTransformer
        )
        const erosionOffset2 = TerrainShaper.buildErosionOffsetSpline(
            -0.1,
            0.03,
            0.1,
            0.1,
            0.01,
            -0.03,
            false,
            false,
            offsetTransformer
        )
        const erosionOffset3 = TerrainShaper.buildErosionOffsetSpline(
            -0.1,
            0.03,
            0.1,
            0.7,
            0.01,
            -0.03,
            true,
            true,
            offsetTransformer
        )
        const erosionOffset4 = TerrainShaper.buildErosionOffsetSpline(
            -0.05,
            0.03,
            0.1,
            1.0,
            0.01,
            0.01,
            true,
            true,
            offsetTransformer
        )
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
            .build()
        const factorSampler = CubicSpline.builder(Point.CONTINENTS, NO_TRANSFORM)
            .addPoint(-0.19, 3.95, 0.0)
            .addPoint(-0.15, TerrainShaper.getErosionFactor(6.25, true, NO_TRANSFORM), 0.0)
            .addPoint(-0.1, TerrainShaper.getErosionFactor(5.47, true, factorTransformer), 0.0)
            .addPoint(0.03, TerrainShaper.getErosionFactor(5.08, true, factorTransformer), 0.0)
            .addPoint(0.06, TerrainShaper.getErosionFactor(4.69, false, factorTransformer), 0.0)
            .build()
        const jaggednessSampler = CubicSpline.builder(Point.CONTINENTS, jaggednessTransformer)
            .addPoint(-0.11, 0.0, 0.0)
            .addPoint(
                0.03,
                TerrainShaper.buildErosionJaggednessSpline(
                    1.0,
                    0.5,
                    0.0,
                    0.0,
                    jaggednessTransformer
                ),
                0.0
            )
            .addPoint(
                0.65,
                TerrainShaper.buildErosionJaggednessSpline(
                    1.0,
                    1.0,
                    1.0,
                    0.0,
                    jaggednessTransformer
                ),
                0.0
            )
            .build()
        return new TerrainShaper(offsetSampler, factorSampler, jaggednessSampler)
    }

    public offset(value: Point): number {
        return this.offsetSampler.apply(value) + -0.50375
    }

    public factor(value: Point): number {
        return this.factorSampler.apply(value)
    }

    public jaggedness(value: Point): number {
        return this.jaggednessSampler.apply(value)
    }

    public makePoint(continents: number, erosion: number, weirdness: number): Point {
        return new Point(continents, erosion, TerrainShaper.peaksAndValleys(weirdness), weirdness)
    }

    public static peaksAndValleys(weirdness: number): number {
        return -(Math.abs(Math.abs(weirdness) - 0.6666667) - 0.33333334) * 3.0
    }

    private static mountainContinentalness(x: number, y: number, z: number): number {
        const f2 = 1.0 - (1.0 - y) * 0.5
        const f3 = 0.5 * (1.0 - y)
        const f4 = (x + 1.17) * 0.46082947
        const f5 = f4 * f2 - f3
        return x < z ? Math.max(f5, -0.2222) : Math.max(f5, 0.0)
    }

    private static calculateMountainRidgeZeroContinentalnessPoint(p_187344_: number): number {
        const f2 = 1.0 - (1.0 - p_187344_) * 0.5
        const f3 = 0.5 * (1.0 - p_187344_)
        return f3 / (0.46082947 * f2) - 1.17
    }

    private static calculateSlope(
        p_187272_: number,
        p_187273_: number,
        p_187274_: number,
        p_187275_: number
    ): number {
        return (p_187273_ - p_187272_) / (p_187275_ - p_187274_)
    }

    private static buildMountainRidgeSplineWithPoints(
        p_187331_: number,
        p_187332_: boolean,
        transformer: ToFloatFunction<number>
    ): CubicSpline<Point> {
        const builder = CubicSpline.builder(Point.RIDGES, transformer)
        const f2 = TerrainShaper.mountainContinentalness(-1.0, p_187331_, -0.7)
        const f4 = TerrainShaper.mountainContinentalness(1.0, p_187331_, -0.7)
        const f5 = TerrainShaper.calculateMountainRidgeZeroContinentalnessPoint(p_187331_)
        if (-0.65 < f5 && f5 < 1.0) {
            const f14 = TerrainShaper.mountainContinentalness(-0.65, p_187331_, -0.7)
            const f9 = TerrainShaper.mountainContinentalness(-0.75, p_187331_, -0.7)
            const f10 = TerrainShaper.calculateSlope(f2, f9, -1.0, -0.75)
            builder.addPoint(-1.0, f2, f10)
            builder.addPoint(-0.75, f9, 0.0)
            builder.addPoint(-0.65, f14, 0.0)
            const f11 = TerrainShaper.mountainContinentalness(f5, p_187331_, -0.7)
            const f12 = TerrainShaper.calculateSlope(f11, f4, f5, 1.0)
            builder.addPoint(f5 - 0.01, f11, 0.0)
            builder.addPoint(f5, f11, f12)
            builder.addPoint(1.0, f4, f12)
        } else {
            const f7 = TerrainShaper.calculateSlope(f2, f4, -1.0, 1.0)
            if (p_187332_) {
                builder.addPoint(-1.0, Math.max(0.2, f2), 0.0)
                builder.addPoint(0.0, Mth.lerp(0.5, f2, f4), f7)
            } else {
                builder.addPoint(-1.0, f2, f7)
            }

            builder.addPoint(1.0, f4, f7)
        }

        return builder.build()
    }

    private static buildErosionOffsetSpline(
        p_187285_: number,
        p_187286_: number,
        p_187287_: number,
        p_187288_: number,
        p_187289_: number,
        p_187290_: number,
        p_187291_: boolean,
        p_187292_: boolean,
        transformer: ToFloatFunction<number>
    ): CubicSpline<Point> {
        const cubicspline = TerrainShaper.buildMountainRidgeSplineWithPoints(
            Mth.lerp(p_187288_, 0.6, 1.5),
            p_187292_,
            transformer
        )
        const cubicspline1 = TerrainShaper.buildMountainRidgeSplineWithPoints(
            Mth.lerp(p_187288_, 0.6, 1.0),
            p_187292_,
            transformer
        )
        const cubicspline2 = TerrainShaper.buildMountainRidgeSplineWithPoints(
            p_187288_,
            p_187292_,
            transformer
        )
        const cubicspline3 = TerrainShaper.ridgeSpline(
            p_187285_ - 0.15,
            0.5 * p_187288_,
            Mth.lerp(0.5, 0.5, 0.5) * p_187288_,
            0.5 * p_187288_,
            0.6 * p_187288_,
            0.5,
            transformer
        )
        const cubicspline4 = TerrainShaper.ridgeSpline(
            p_187285_,
            p_187289_ * p_187288_,
            p_187286_ * p_187288_,
            0.5 * p_187288_,
            0.6 * p_187288_,
            0.5,
            transformer
        )
        const cubicspline5 = TerrainShaper.ridgeSpline(
            p_187285_,
            p_187289_,
            p_187289_,
            p_187286_,
            p_187287_,
            0.5,
            transformer
        )
        const cubicspline6 = TerrainShaper.ridgeSpline(
            p_187285_,
            p_187289_,
            p_187289_,
            p_187286_,
            p_187287_,
            0.5,
            transformer
        )
        const cubicspline7 = CubicSpline.builder(Point.RIDGES, transformer)
            .addPoint(-1.0, p_187285_, 0.0)
            .addPoint(-0.4, cubicspline5, 0.0)
            .addPoint(0.0, p_187287_ + 0.07, 0.0)
            .build()
        const cubicspline8 = TerrainShaper.ridgeSpline(
            -0.02,
            p_187290_,
            p_187290_,
            p_187286_,
            p_187287_,
            0.0,
            transformer
        )
        const builder = CubicSpline.builder(Point.EROSION, transformer)
            .addPoint(-0.85, cubicspline, 0.0)
            .addPoint(-0.7, cubicspline1, 0.0)
            .addPoint(-0.4, cubicspline2, 0.0)
            .addPoint(-0.35, cubicspline3, 0.0)
            .addPoint(-0.1, cubicspline4, 0.0)
            .addPoint(0.2, cubicspline5, 0.0)
        if (p_187291_) {
            builder
                .addPoint(0.4, cubicspline6, 0.0)
                .addPoint(0.45, cubicspline7, 0.0)
                .addPoint(0.55, cubicspline7, 0.0)
                .addPoint(0.58, cubicspline6, 0.0)
        }

        builder.addPoint(0.7, cubicspline8, 0.0)
        return builder.build()
    }

    private static getErosionFactor(
        p_187308_: number,
        p_187309_: boolean,
        transformer: ToFloatFunction<number>
    ): CubicSpline<Point> {
        const cubicspline = CubicSpline.builder(Point.WEIRDNESS, transformer)
            .addPoint(-0.2, 6.3, 0.0)
            .addPoint(0.2, p_187308_, 0.0)
            .build()
        const builder = CubicSpline.builder(Point.EROSION, transformer)
            .addPoint(-0.6, cubicspline, 0.0)
            .addPoint(
                -0.5,
                CubicSpline.builder(Point.WEIRDNESS, transformer)
                    .addPoint(-0.05, 6.3, 0.0)
                    .addPoint(0.05, 2.67, 0.0)
                    .build(),
                0.0
            )
            .addPoint(-0.35, cubicspline, 0.0)
            .addPoint(-0.25, cubicspline, 0.0)
            .addPoint(
                -0.1,
                CubicSpline.builder(Point.WEIRDNESS, transformer)
                    .addPoint(-0.05, 2.67, 0.0)
                    .addPoint(0.05, 6.3, 0.0)
                    .build(),
                0.0
            )
            .addPoint(0.03, cubicspline, 0.0)
        if (p_187309_) {
            const cubicspline1 = CubicSpline.builder(Point.WEIRDNESS, transformer)
                .addPoint(0.0, p_187308_, 0.0)
                .addPoint(0.1, 0.625, 0.0)
                .build()
            const cubicspline2 = CubicSpline.builder(Point.RIDGES, transformer)
                .addPoint(-0.9, p_187308_, 0.0)
                .addPoint(-0.69, cubicspline1, 0.0)
                .build()
            builder
                .addPoint(0.35, p_187308_, 0.0)
                .addPoint(0.45, cubicspline2, 0.0)
                .addPoint(0.55, cubicspline2, 0.0)
                .addPoint(0.62, p_187308_, 0.0)
        } else {
            const cubicspline3 = CubicSpline.builder(Point.RIDGES, transformer)
                .addPoint(-0.7, cubicspline, 0.0)
                .addPoint(-0.15, 1.37, 0.0)
                .build()
            const cubicspline4 = CubicSpline.builder(Point.RIDGES, transformer)
                .addPoint(0.45, cubicspline, 0.0)
                .addPoint(0.7, 1.56, 0.0)
                .build()
            builder
                .addPoint(0.05, cubicspline4, 0.0)
                .addPoint(0.4, cubicspline4, 0.0)
                .addPoint(0.45, cubicspline3, 0.0)
                .addPoint(0.55, cubicspline3, 0.0)
                .addPoint(0.58, p_187308_, 0.0)
        }

        return builder.build()
    }

    private static ridgeSpline(
        p_187277_: number,
        p_187278_: number,
        p_187279_: number,
        p_187280_: number,
        p_187281_: number,
        p_187282_: number,
        transformer: ToFloatFunction<number>
    ): CubicSpline<Point> {
        const f = Math.max(0.5 * (p_187278_ - p_187277_), p_187282_)
        const f1 = 5.0 * (p_187279_ - p_187278_)
        return CubicSpline.builder(Point.RIDGES, transformer)
            .addPoint(-1.0, p_187277_, f)
            .addPoint(-0.4, p_187278_, Math.min(f, f1))
            .addPoint(0.0, p_187279_, f1)
            .addPoint(0.4, p_187280_, 2.0 * (p_187280_ - p_187279_))
            .addPoint(1.0, p_187281_, 0.7 * (p_187281_ - p_187280_))
            .build()
    }

    private static buildErosionJaggednessSpline(
        p_187295_: number,
        p_187296_: number,
        p_187297_: number,
        p_187298_: number,
        p_187299_: ToFloatFunction<number>
    ): CubicSpline<Point> {
        const cubicspline = TerrainShaper.buildRidgeJaggednessSpline(
            p_187295_,
            p_187297_,
            p_187299_
        )
        const cubicspline1 = TerrainShaper.buildRidgeJaggednessSpline(
            p_187296_,
            p_187298_,
            p_187299_
        )
        return CubicSpline.builder(Point.EROSION, p_187299_)
            .addPoint(-1.0, cubicspline, 0.0)
            .addPoint(-0.78, cubicspline1, 0.0)
            .addPoint(-0.5775, cubicspline1, 0.0)
            .addPoint(-0.375, 0.0, 0.0)
            .build()
    }

    private static buildWeirdnessJaggednessSpline(
        p_187305_: number,
        transformer: ToFloatFunction<number>
    ): CubicSpline<Point> {
        const v0 = 0.63 * p_187305_
        const v1 = 0.3 * p_187305_
        return CubicSpline.builder(Point.WEIRDNESS, transformer)
            .addPoint(-0.01, v0, 0.0)
            .addPoint(0.01, v1, 0.0)
            .build()
    }

    private static buildRidgeJaggednessSpline(
        weirdness1: number,
        weirdness0: number,
        transformer: ToFloatFunction<number>
    ): CubicSpline<Point> {
        const f = TerrainShaper.peaksAndValleys(0.4)
        const f1 = TerrainShaper.peaksAndValleys(0.56666666)
        const middlePeaksAndValleys = (f + f1) / 2.0
        const builder = CubicSpline.builder(Point.RIDGES, transformer)
        builder.addPoint(f, 0.0, 0.0)
        if (weirdness0 > 0.0) {
            builder.addPoint(
                middlePeaksAndValleys,
                TerrainShaper.buildWeirdnessJaggednessSpline(weirdness0, transformer),
                0.0
            )
        } else {
            builder.addPoint(middlePeaksAndValleys, 0.0, 0.0)
        }

        if (weirdness1 > 0.0) {
            builder.addPoint(
                1.0,
                TerrainShaper.buildWeirdnessJaggednessSpline(weirdness1, transformer),
                0.0
            )
        } else {
            builder.addPoint(1.0, 0.0, 0.0)
        }

        return builder.build()
    }
}
