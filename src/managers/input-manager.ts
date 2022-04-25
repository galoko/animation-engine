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

    private processControlledEntity(dt: number): void {
        const entity = this.controlledEntity

        if (!entity) {
            return
        }

        const physics = entity.get(PhysicsComponent)
        const transform = entity.get(TransformComponent)

        dt = dt / 1000

        if (transform && physics && physics.body && this.orbit) {
            physics.body.applyCentralImpulse(new Ammo.btVector3(0, 0, -9.8 * dt))
            physics.body.setGravity(new Ammo.btVector3(0, 0, 0))

            let speed = 0
            let desiredAngle = this.orbit.zAngle

            if (this.isPressed("KeyW", "KeyS", "KeyA", "KeyD")) {
                // speed = 17.24 // run
                speed = 7.62 // walk
            }

            if (this.isPressed("KeyA")) {
                desiredAngle -= this.isPressed("KeyW") ? 45 : this.isPressed("KeyS") ? -45 : 90
            }
            if (this.isPressed("KeyD")) {
                desiredAngle += this.isPressed("KeyW") ? 45 : this.isPressed("KeyS") ? -45 : 90
            }

            if (this.isPressed("KeyS")) {
                desiredAngle += 180
            }

            const velocity = vec3.fromValues(-speed, 0, 0)
            const q = quat.create()
            quat.fromEuler(q, 0, 0, -desiredAngle)
            vec3.transformQuat(velocity, velocity, q)

            const pos = physics.body.getWorldTransform().getOrigin()

            const next_x = pos.x()
            const next_y = pos.y()
            const next_z = pos.z() - 9.8 * 0.9375 * dt // gravity effect?

            const z = next_z
            const FEET_OFFSET = transform.transform.size[2] * 0.5 + 0.4

            const center = vec3.fromValues(next_x, next_y, z)
            const feet = vec3.fromValues(next_x, next_y, z - FEET_OFFSET)
            const result = Services.physics.raycast(center, feet)
            velocity[2] = physics.body.getLinearVelocity().z()

            if (result.hit) {
                const next_z = center[2] - result.distance + FEET_OFFSET

                velocity[2] = 0

                const t = physics.body.getWorldTransform()
                t.setOrigin(new Ammo.btVector3(pos.x(), pos.y(), next_z - 0.001))
            }
            const ammoVelocity = new Ammo.btVector3(velocity[0], velocity[1], velocity[2])
            physics.body.setLinearVelocity(ammoVelocity)
            physics.body.activate(true)

            Services.render.drawDebugLine(center, feet, 0xff0000, 0x00ff00)
        }
    }

    private isPressed(...codes: string[]): boolean {
        for (const code of codes) {
            if (this.keyboard.has(code)) {
                return true
            }
        }

        return false
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
        this.processControlledEntity(dt)
    }

    postPhysics() {
        this.applyOrbit()
    }
}
