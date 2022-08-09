export class ResourseManager {
    static readonly canvasWebGL = document.createElement("canvas")
    static readonly canvas2D = document.createElement("canvas")

    static init(): void {
        this.canvas2D.style.pointerEvents = "none"

        document.body.appendChild(this.canvasWebGL)
        document.body.appendChild(this.canvas2D)
    }

    static finalize(): void {
        //
    }
}
