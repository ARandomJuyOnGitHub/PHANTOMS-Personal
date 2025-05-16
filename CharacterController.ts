class CharacterController {
    sprite: Sprite;
    physics: PhysicsController;

    grounded: boolean = false;
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

    private isWallJumping: boolean = false
    private isWallJumpFalling: boolean = false
    private rightWallLimit: number = 3
    private leftWallLimit: number = 3
    private lastWallJumped: number = 0
    private wallJumpingDirection: number = 0
    private wallJumpingCooldown: number = .6 // in seconds
    private wallJumpingDebounce: number = 0
    private wallJumpingTimer: number = 200 // in milliseconds
    private wallJumpingPower: Vector2 = vectors.create(80, -330)

    constructor(_sprite: Sprite) {
        super(_sprite)

        controller.up.onEvent(ControllerButtonEvent.Pressed, function () {
            if (this.grounded) {
                this.jumping = true
                this.jumpHeld = true
            }

        })
        controller.up.onEvent(ControllerButtonEvent.Released, function () {
            this.jumpHeld = false
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
            } else {
                this.sprite.fx = 50
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

        if (controller.up.isPressed() && this.isWallSliding) {
            // if your jumping from the same wall and the cool down isn't over do nothing
            if ((this.lastWallJumped == this.againstWall) && this.wallJumpingDebounce > 0) {return}

            // if the limmit for hte current wall ahs been reached do nothing
            if ((this.againstWall == 1 && this.rightWallLimit <= 0) || (this.againstWall == -1 && this.leftWallLimit <= 0)) {return}

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
