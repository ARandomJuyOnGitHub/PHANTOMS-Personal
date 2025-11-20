abstract class CharacterController {
    sprite: Sprite;
    physics: PhysicsController;

    grounded: boolean = true;
    againstWall: number = 0

    debugMode = false;

    constructor(_sprite: Sprite) {
        this.sprite = _sprite
        this.physics = new PhysicsController(_sprite)

        game.onUpdate(function() {
            if (this.sprite.isHittingTile(CollisionDirection.Bottom)) {
                this.grounded = true
            } else {
                this.grounded = false
            }

            if (this.sprite.isHittingTile(CollisionDirection.Right)) {
                this.againstWall = 1
            } else if (this.sprite.isHittingTile(CollisionDirection.Left)) {
                this.againstWall = -1
            } else {
                this.againstWall = 0
            }
        })
    }
}

abstract class State<T extends CharacterController> {
    readonly name: string;

    constructor(name: string){
        this.name = name
    }

    enter(owner: T): void {
        if ((owner as any).debugMode) {
            console.log("Entered" + this.name)
        }
    }
    update(owner: T): void {}
    exit(owner: T): void {}
}

class IdleState extends State<Player> {
    constructor(){
        super("Idle")
    }

    enter(owner: Player) {super.enter(owner)}
    update(owner: Player){
        if ((controller.right.isPressed() || controller.left.isPressed()) && !this.guards(owner)){
            owner.groundMovement.change("Running")
        }
    }

    guards(owner: Player){
        return (owner.arialMovement.getCurrentState() == "WallSliding")
    }
}

class RunningState extends State<Player> {
    constructor() {
        super("Running")
    }
    enter(owner: Player) { super.enter(owner) }
    update(owner: Player) {
        this.movementInit(owner)
    }

    private movementInit(owner: Player) {
        let rightMovement = 0
        let leftMovement = 0

        if (controller.right.isPressed()) {
            // this.isWallJumpFalling = false
            rightMovement = 1
        } else {
            rightMovement = 0
        }

        if (controller.left.isPressed()) {
            // this.isWallJumpFalling = false
            leftMovement = -1
        } else {
            leftMovement = 0
        }

        let trueMovement = rightMovement + leftMovement

        if (!(owner.arialMovement.getCurrentState() == "WallJumping")) {
            owner.flip(trueMovement)
        }
        if (trueMovement == 0){
            owner.groundMovement.change("Idle")
        }

        if (!(owner.arialMovement.getCurrentState() == "WallJumping")) {
            owner.sprite.vx = trueMovement * owner.movementSpeed
        }

    }
}

class GroundedState extends State<Player> {
    constructor() {
        super("Grounded")
    }
    private toJump: () => void

    enter(owner: Player){
        super.enter(owner)

        owner.sprite.fx = 1000
        owner.rightWallLimit = 3
        owner.leftWallLimit = 3
        
        this.toJump = function(){
            owner.arialMovement.change("Jumping")
        }

        controller.up.addEventListener(ControllerButtonEvent.Pressed, this.toJump)
    }
    exit(owner: Player){
        controller.up.removeEventListener(ControllerButtonEvent.Pressed, this.toJump)

        owner.sprite.fx = 50
        owner.coyoteTimeCounter = owner.coyoteTime
    }
    update(owner: Player){
        if (!owner.grounded){
            owner.arialMovement.change("Falling") 
        }
    }
}

class JumpingState extends State<Player> {
    constructor() {
        super("Jumping")
    }

    enter(owner: Player) {
        super.enter(owner)

        owner.coyoteTimeCounter = 0
        this.jump(owner)
    }
    update(owner: Player) {
        if (owner.grounded){
            owner.arialMovement.change("Grounded")
            return
        }
        
        if (owner.isWalled()){
            owner.arialMovement.change("WallSliding")
            return
        }

        if (owner.sprite.vy >= 0) {
            owner.arialMovement.change("Falling")
            return
        }

        // Variable jump height
        if (controller.up.isPressed()) {
            owner.sprite.vy += owner.physics.gravitationalForce * (owner.longfall - 1) * control.eventContext().deltaTime
        } else {
            owner.sprite.vy += owner.physics.gravitationalForce * (owner.shortfall - 1) * control.eventContext().deltaTime
        }
    }

    private jump(owner: Player) {
        owner.physics.force(vectors.create(0, -owner.jumpPower))
    }
}

class FallingState extends State<Player> {
    constructor() {
        super("Falling")
    }

    enter(owner: Player) { super.enter(owner) }
    update(owner: Player) {
        if (owner.grounded){
            owner.arialMovement.change("Grounded")
            return
        }

        if (owner.isWalled()) {
            owner.arialMovement.change("WallSliding")
            return
        }

        if (controller.up.isPressed() && owner.coyoteTimeCounter > 0){
            owner.arialMovement.change("Jumping")
            return
        }
    }
}

class WallSlidingState extends State<Player> {
    constructor() {
        super("WallSliding")
    }
    toWallJump: () => void

    enter(owner: Player) {
        super.enter(owner)
        // if (owner.groundMovement.getCurrentState() == "Running"){
        //     owner.groundMovement.change("Idle")
        // }
        
        this.toWallJump = function () {
            console.log("tey")
            if (!this.attemptWallJump(owner)){
                return
            }

            owner.arialMovement.change("WallJumping")
        }
        
        controller.up.addEventListener(ControllerButtonEvent.Pressed, this.toWallJump)
    }
    exit(owner: Player) {
        controller.up.removeEventListener(ControllerButtonEvent.Pressed, this.toWallJump)
    }
    update(owner: Player) {
        if (owner.grounded) {
            owner.arialMovement.change("Grounded")
            return
        }

        if (!owner.isWalled()) {
            owner.arialMovement.change("Falling")
            return
        }
        
        owner.sprite.setVelocity(owner.sprite.vx, Math.constrain(owner.sprite.vy, 0, owner.wallSlidingSpeed))
        if (owner.facingDirection != owner.againstWall) {
            owner.flip(owner.againstWall)
        }
        owner.wallJumpingDirection = -owner.againstWall
    }

    attemptWallJump(owner: Player) {
        // if your jumping from the same wall and the cool down isn't over do nothing
        if ((owner.lastWallJumped == owner.againstWall) && owner.wallJumpingDebounce > 0) { return false }

        // if the limmit for hte current wall ahs been reached do nothing
        if ((owner.againstWall == 1 && owner.rightWallLimit <= 0) || (owner.againstWall == -1 && owner.leftWallLimit <= 0)) { return false }

        return true
    }
}

class WallJumpingState extends State<Player> {
    constructor() {
        super("WallJumping")
    }

    enter(owner: Player) {
        super.enter(owner)

        owner.wallJumpingDirection = -owner.againstWall

        if (owner.againstWall == 1) {
            owner.rightWallLimit -= 1
        } else if (owner.againstWall == -1) {
            owner.leftWallLimit -= 1
        }

        owner.lastWallJumped = owner.againstWall
        owner.sprite.setVelocity(owner.wallJumpingDirection * owner.wallJumpingPower.x, owner.wallJumpingPower.y)
        owner.wallJumpingDebounce = owner.wallJumpingCooldown

        owner.flip(owner.wallJumpingDirection)

        timer.after(owner.wallJumpingTimer, function () {
            owner.arialMovement.change("WallJumpFalling")
        })
    }
    update(owner: Player) {
        if (owner.grounded) {
            owner.arialMovement.change("Grounded")
            return
        }

        if (owner.isWalled()) {
            owner.arialMovement.change("WallSliding")
            return
        }

        owner.sprite.vy += owner.physics.gravitationalForce * (owner.shortfall - 1) * control.eventContext().deltaTime
    }
}

class WallJumpFallingState extends State<Player> {
    constructor() {
        super("WallJumpFalling")
    }

    enter(owner: Player) { super.enter(owner) }
    update(owner: Player) {
        if (owner.grounded) {
            owner.arialMovement.change("Grounded")
            return
        }

        if (owner.isWalled()) {
            owner.arialMovement.change("WallSliding")
            return
        }

        if (controller.right.isPressed() || controller.left.isPressed()) {
            owner.arialMovement.change("Falling")
        }

    }
}

class StateMachine<T extends CharacterController> {
    private current: string
    private states: { [key: string]: State<T> } = {}
    private owner: T

    constructor(owner: T, initial: string, states: State<T>[]) {
        for (const state of states) {
            this.states[state.name] = state
        }

        this.owner = owner
        this.current = initial
        console.log(this.current)
        this.states[this.current].enter(owner)
        
    }

    update() {
        this.states[this.current].update(this.owner)
    }

    change(newState: string) {
        this.states[this.current].exit(this.owner)
        this.current = newState
        this.states[this.current].enter(this.owner)
    }

    getCurrentState(): string {
        return this.current
    }
}

class Player extends CharacterController {
    movementSpeed: number = 100
    facingDirection: number = -1

    jumpPower: number = 200
    longfall: number = .85
    shortfall: number = 2.55

    wallSlidingSpeed: number = 40

    coyoteTime: number = .1 // in seconds
    coyoteTimeCounter: number = 0

    rightWallLimit: number = 3
    leftWallLimit: number = 3
    lastWallJumped: number = 0
    wallJumpingDirection: number = 0
    wallJumpingCooldown: number = .4 // in seconds (original is .6)
    wallJumpingDebounce: number = 0
    wallJumpingTimer: number = 200 // in milliseconds
    wallJumpingPower: Vector2 = vectors.create(80, -310)

    groundMovement: StateMachine<Player>
    arialMovement: StateMachine<Player>

    constructor(_sprite: Sprite) {
        super(_sprite)

        this.groundMovement = new StateMachine(this, "Idle", 
        [
            new IdleState(),
            new RunningState()
        ])

        this.arialMovement = new StateMachine(this, "Grounded",
        [
            new GroundedState(),
            new JumpingState(),
            new FallingState(),
            new WallSlidingState(),
            new WallJumpingState(),
            new WallJumpFallingState()
        ])

        game.onUpdate(function(){
            this.groundMovement.update()
            this.arialMovement.update()
            this.debounce()
        })
    }

    flip(direction: number) {
        if (direction !== 0 && direction !== this.facingDirection) {
            this.sprite.image.flipX()
            this.facingDirection = direction
        }
    }

    isWalled() {
        if (this.againstWall == 1 && controller.right.isPressed()) {
            return true
        } else if (this.againstWall == -1 && controller.left.isPressed()) {
            return true
        } else {
            return false
        }
    }

    debounce() {
        this.wallJumpingDebounce -= control.eventContext().deltaTime
        this.coyoteTimeCounter -= control.eventContext().deltaTime
    }
}