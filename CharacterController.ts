class CharacterController {
    sprite: Sprite;
    physics: PhysicsController;

    grounded: boolean = true;
    againstWall: number = 0

    constructor(_sprite: Sprite) {
        this.sprite = _sprite
        this.physics = new PhysicsController(_sprite)

        game.onUpdate(function () {
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

class Player extends CharacterController {
    private movementSpeed: number = 100
    private xMovementVelocity: number = 0
    private facingDirection: number = -1

    private jumpPower: number = 200
    private jumping: boolean = false
    private jumpHeld: boolean = false
    private longfall: number = .85
    private shortfall: number = 2.55

    private isWallSliding: boolean = false
    private wallSlidingSpeed: number = 40

    private coyoteTime: number = .1 // in seconds
    private coyoteTimeCounter: number = 0 

    private attemptWallJump: boolean = false
    private isWallJumping: boolean = false
    private isWallJumpFalling: boolean = false
    private rightWallLimit: number = 3
    private leftWallLimit: number = 3
    private lastWallJumped: number = 0
    private wallJumpingDirection: number = 0
    private wallJumpingCooldown: number = .4 // in seconds (original is .6)
    private wallJumpingDebounce: number = 0
    private wallJumpingTimer: number = 200 // in milliseconds
    private wallJumpingPower: Vector2 = vectors.create(80, -330)

    constructor(_sprite: Sprite) {
        super(_sprite)

        controller.up.onEvent(ControllerButtonEvent.Pressed, function () {
            if (this.coyoteTimeCounter > 0) {
                // let mySprite = sprites.create(assets.image`Hitbox`, SpriteKind.Player)
                // mySprite.setPosition(this.sprite.x, this.sprite.y)
                this.jumping = true
                this.jumpHeld = true
            } else if (this.isWallSliding) {
                this.attemptWallJump = true
            }

        })
        controller.up.onEvent(ControllerButtonEvent.Released, function () {
            this.jumpHeld = false
            this.coyoteTimeCounter = 0
        })

        game.onUpdate(function () {
            console.log(this.againstWall)
            
            if (this.isWallJumpFalling && this.againstWall) {
                this.isWallJumping = false
            }

            if (!this.isWallJumping) {
                this.flip()
            }

            if (this.grounded) {
                this.rightWallLimit = 3
                this.leftWallLimit = 3
                this.isWallJumpFalling = false
                this.sprite.fx = 1000
                this.coyoteTimeCounter = this.coyoteTime
            } else {
                this.sprite.fx = 50
                this.coyoteTimeCounter -= control.eventContext().deltaTime
            }

            if (!this.isWallJumping) {
                this.movementInit()
            }

            //wall movement logic
            this.wallSlide()
            this.wallJump()

            //jumping logic
            if (this.jumping) {
                this.jump()
                this.jumping = false
            }

            if (this.jumpHeld && this.sprite.vy < 0) {
                this.sprite.vy += 1 * this.physics.gravitationalForce * (this.longfall - 1) * control.eventContext().deltaTime
            } else if (!this.jumpHeld && this.sprite.vy < 0) {
                this.sprite.vy += 1 * this.physics.gravitationalForce * (this.shortfall - 1) * control.eventContext().deltaTime
            }

            this.debounce()
        })
    }

    movementInit() {
        let rightMovement = 0
        let leftMovement = 0

        if (controller.right.isPressed()) {
            this.isWallJumpFalling = false
            rightMovement = 1
        } else {
            rightMovement = 0
        }

        if (controller.left.isPressed()) {
            this.isWallJumpFalling = false
            leftMovement = -1
        } else {
            leftMovement = 0
        }

        let trueMovement = rightMovement + leftMovement
        if (!this.isWallJumpFalling) {
            this.sprite.vx = trueMovement * this.movementSpeed
        }
    }

    jump() {
        this.physics.force(vectors.create(0, -this.jumpPower))
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

    wallSlide() {
        if (this.isWalled() && (!this.grounded)) {
            this.isWallSliding = true
            this.sprite.setVelocity(this.sprite.vx, Math.constrain(this.sprite.vy, 0, this.wallSlidingSpeed))
            if (this.facingDirection != this.againstWall) {
                this.flip()
            }
        } else {
            this.isWallSliding = false
        }
    }

    wallJump() {
        if (this.isWallSliding) {
            this.isWallJumping = false
            this.wallJumpingDirection = -this.againstWall
        }

        if (this.attemptWallJump) {
            // if your jumping from the same wall and the cool down isn't over do nothing
            if ((this.lastWallJumped == this.againstWall) && this.wallJumpingDebounce > 0) {this.attemptWallJump = false; return}

            // if the limmit for hte current wall ahs been reached do nothing
            if ((this.againstWall == 1 && this.rightWallLimit <= 0) || (this.againstWall == -1 && this.leftWallLimit <= 0)) {this.attemptWallJump = false; return}

            this.isWallJumping = true
            this.isWallJumpFalling = true
            this.jumpHeld = false // prevents the player from flying away

            if (this.againstWall == 1) {
                this.rightWallLimit -= 1
            } else if (this.againstWall == -1) {
                this.leftWallLimit -= 1
            }

            this.lastWallJumped = this.againstWall
            this.sprite.setVelocity(this.wallJumpingDirection * this.wallJumpingPower.x, this.wallJumpingPower.y)
            this.wallJumpingDebounce = this.wallJumpingCooldown

            if (this.facingDirection != this.wallJumpingDirection) {
                this.flip()
            }

            timer.after(this.wallJumpingTimer, function () {
                this.isWallJumping = false
            })

            this.attemptWallJump = false
        }
    }

    stopWallJumping() {
        this.isWallJumping = false
    }

    flip() {
        if ((this.facingDirection > 0 && this.sprite.vx < 0) ||
            (this.facingDirection < 0 && this.sprite.vx > 0)) {
            this.sprite.image.flipX()
            this.facingDirection = -this.facingDirection
        }
    }

    debounce() {
        this.wallJumpingDebounce -= control.eventContext().deltaTime
    }
}


interface State {
    name: string
    enter(owner: NewPlayer): void
    update(owner: NewPlayer): void
    exit(owner: NewPlayer): void
}

class IdleState implements State {
    name: string = "Idle"
    constructor(){}
    enter(owner: NewPlayer) { }
    update(owner: NewPlayer){
        if ((controller.right.isPressed() || controller.left.isPressed()) && !this.guards(owner)){
            owner.groundMovement.change("Running")
        }
    }

    guards(owner: NewPlayer){
        return (owner.arialMovement.getCurrentState() == "WallSliding")
    }
    exit(owner: NewPlayer){}
}

class RunningState implements State {
    name: string = "Running"
    constructor(){}
    enter(owner: NewPlayer) { }
    update(owner: NewPlayer) {
        this.movementInit(owner)
    }
    exit(owner: NewPlayer) {}

    private movementInit(owner: NewPlayer) {
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

class GroundedState implements State {
    name: string = "Grounded"
    private toJump: () => void

    constructor(){}
    enter(owner: NewPlayer){
    

        owner.sprite.fx = 1000
        owner.rightWallLimit = 3
        owner.leftWallLimit = 3
        
        this.toJump = function(){
            owner.arialMovement.change("Jumping")
        }

        controller.up.addEventListener(ControllerButtonEvent.Pressed, this.toJump)
    }
    exit(owner: NewPlayer){
        controller.up.removeEventListener(ControllerButtonEvent.Pressed, this.toJump)

        owner.sprite.fx = 50
    }
    update(owner: NewPlayer){
        if (!owner.grounded){
            owner.arialMovement.change("Falling") 
        }
    }
}

class JumpingState implements State {
    name: string = "Jumping"
    constructor() { }
    enter(owner: NewPlayer) {
        console.log("ENTERED JUMPING AHAHAHAHAH")
        this.jump(owner)
    }
    exit(owner: NewPlayer) { }
    update(owner: NewPlayer) {
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

    private jump(owner: NewPlayer) {
        owner.physics.force(vectors.create(0, -owner.jumpPower))
    }
}

class FallingState implements State {
    name: string = "Falling"
    constructor() { }
    enter(owner: NewPlayer) { }
    exit(owner: NewPlayer) { }
    update(owner: NewPlayer) {
        if (owner.grounded){
            owner.arialMovement.change("Grounded")
            return
        }

        if (owner.isWalled()) {
            owner.arialMovement.change("WallSliding")
            return
        }
    }
}

class WallSlidingState implements State {
    name: string = "WallSliding"
    toWallJump: () => void
    constructor() { }
    enter(owner: NewPlayer) {
        // if (owner.groundMovement.getCurrentState() == "Running"){
        //     owner.groundMovement.change("Idle")
        // }

        this.toWallJump = function () {
            if (!this.attemptWallJump(owner)){
                return
            }

            owner.arialMovement.change("WallJumping")
        }

        controller.up.addEventListener(ControllerButtonEvent.Pressed, this.toWallJump)
    }
    exit(owner: NewPlayer) {
        controller.up.removeEventListener(ControllerButtonEvent.Pressed, this.toWallJump)
    }
    update(owner: NewPlayer) {
        if (!owner.isWalled()) {
            owner.arialMovement.change("Falling")
            return
        }

        if (owner.grounded) {
            owner.arialMovement.change("Grounded")
            return
        }

        owner.sprite.setVelocity(owner.sprite.vx, Math.constrain(owner.sprite.vy, 0, owner.wallSlidingSpeed))
        if (owner.facingDirection != owner.againstWall) {
            owner.flip(owner.againstWall)
        }
        owner.wallJumpingDirection = -owner.againstWall
    }

    attemptWallJump(owner: NewPlayer) {
        // if your jumping from the same wall and the cool down isn't over do nothing
        if ((owner.lastWallJumped == owner.againstWall) && owner.wallJumpingDebounce > 0) { return false }

        // if the limmit for hte current wall ahs been reached do nothing
        if ((owner.againstWall == 1 && owner.rightWallLimit <= 0) || (owner.againstWall == -1 && owner.leftWallLimit <= 0)) { return false }

        return true
    }
}

class WallJumpingState implements State {
    name: string = "WallJumping"
    constructor() { }
    enter(owner: NewPlayer) {
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
    exit(owner: NewPlayer) { }
    update(owner: NewPlayer) {
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

class WallJumpFallingState implements State {
    name: string = "WallJumpFalling"
    constructor() { }
    enter(owner: NewPlayer) { }
    exit(owner: NewPlayer) { }
    update(owner: NewPlayer) {
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
class StateMachine {
    private current: string
    private states: { [key: string]: State } = {}
    private owner: NewPlayer

    constructor(owner: NewPlayer, initial: string, states: State[]) {
        for (const state of states) {
            this.states[state.name] = state
        }

        this.owner = owner
        this.current = initial
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

class NewPlayer extends CharacterController {
    movementSpeed: number = 100
    private xMovementVelocity: number = 0
    facingDirection: number = -1

    jumpPower: number = 200
    private jumping: boolean = false
    private jumpHeld: boolean = false
    longfall: number = .85
    shortfall: number = 2.55

    private isWallSliding: boolean = false
    wallSlidingSpeed: number = 40

    private coyoteTime: number = .1 // in seconds
    private coyoteTimeCounter: number = 0

    private attemptWallJump: boolean = false
    private isWallJumping: boolean = false
    private isWallJumpFalling: boolean = false
    rightWallLimit: number = 3
    leftWallLimit: number = 3
    lastWallJumped: number = 0
    wallJumpingDirection: number = 0
    wallJumpingCooldown: number = .4 // in seconds (original is .6)
    wallJumpingDebounce: number = 0
    wallJumpingTimer: number = 200 // in milliseconds
    wallJumpingPower: Vector2 = vectors.create(80, -310)

    groundMovement: StateMachine
    arialMovement: StateMachine

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
            new WallJumpFallingState
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
    }
}