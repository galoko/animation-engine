import { quat, vec3 } from "gl-matrix"
import { PhysicsComponent } from "../components/phyicsComponent"
import { TransformComponent } from "../components/transformComponent"
import { Entity } from "../entities/entity"
import { Services } from "./services"

type OrbitInfo = {
    entity: Entity

    yAngle: number
    zAngle: number

    distance: number
}

export class InputManager {
    private readonly clickHandlerBind = this.clickHandler.bind(this)
    private readonly mouseHandlerBind = this.mouseHandler.bind(this)
    private readonly keyHandlerBind = this.keyHandler.bind(this)

    private readonly keyboard: Map<string, boolean> = new Map()

    private orbit: OrbitInfo | undefined
    private controlledEntity: Entity | undefined

    constructor(private readonly canvas: HTMLCanvasElement) {
        this.attchEvents()
    }

    private attchEvents() {
        const { canvas } = this

        canvas.addEventListener("click", this.clickHandlerBind)

        canvas.addEventListener("mousemove", this.mouseHandlerBind, { passive: true })
        canvas.addEventListener("mouseup", this.mouseHandlerBind, { passive: true })
        canvas.addEventListener("mousedown", this.mouseHandlerBind, { passive: true })

        window.addEventListener("keyup", this.keyHandlerBind)
        window.addEventListener("keydown", this.keyHandlerBind)
    }

    private clickHandler(e: MouseEvent): void {
        this.canvas.requestPointerLock()
    }

    private mouseHandler(e: MouseEvent): void {
        const dx = e.movementX
        const dy = e.movementY
        const isLocked = document.pointerLockElement === this.canvas

        if (this.orbit && isLocked && e.type === "mousemove") {
            const ROTATION_SPEED = 0.1
            const e = 10e-3

            this.orbit.zAngle = (this.orbit.zAngle + dx * ROTATION_SPEED) % 360
            this.orbit.yAngle = Math.max(
                -90 + e,
                Math.min(this.orbit.yAngle + dy * ROTATION_SPEED, 90 - e)
            )
            this.applyOrbit()
        }
    }

    private processControlledEntity(): void {
        const entity = this.controlledEntity

        if (!entity) {
            return
        }

        const physics = entity.get(PhysicsComponent)

        if (physics && this.orbit) {
            if (this.isPressed("KeyW")) {
                const force = vec3.fromValues(-10, 0, 0)
                const q = quat.create()
                quat.fromEuler(q, 0, 0, -this.orbit.zAngle)
                vec3.transformQuat(force, force, q)

                const ammoForce = new Ammo.btVector3(force[0], force[1], force[2])
                physics.body?.applyCentralLocalForce(ammoForce)
                physics.body?.activate(true)
            }
        }
    }

    private isPressed(code: string): boolean {
        return this.keyboard.has(code)
    }

    private processKeyMap(e: KeyboardEvent): void {
        if (e.type === "keydown") {
            this.keyboard.set(e.code, true)
        } else if (e.type === "keyup") {
            this.keyboard.delete(e.code)
        }
    }

    private keyHandler(e: KeyboardEvent): void {
        this.processKeyMap(e)
    }

    setEntityToOrbit(entity: Entity, distance: number): void {
        this.orbit = {
            entity,
            yAngle: 0,
            zAngle: 0,
            distance,
        }

        this.applyOrbit()
    }

    setControlledEntity(entity: Entity): void {
        this.controlledEntity = entity
    }

    private applyOrbit() {
        if (this.orbit) {
            const transform = this.orbit.entity.get(TransformComponent)
            if (!transform) {
                throw new Error("Can't orbit entity without transformation component.")
            }

            const center = transform.transform.pos

            const q = quat.create()
            quat.fromEuler(q, 0, -this.orbit.yAngle, -this.orbit.zAngle)

            const eye = vec3.fromValues(this.orbit.distance, 0, 0)
            vec3.transformQuat(eye, eye, q)
            vec3.add(eye, center, eye)

            Services.render.setCamera(eye, center)
        }
    }

    tick(dt: number) {
        this.processControlledEntity()
    }

    postPhysics() {
        this.applyOrbit()
    }
}
