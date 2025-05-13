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
    private facingDirection: number = -1

    private jumpPower: number = 200
    private jumping: boolean = false
    private jumpHeld: boolean = false
    private longfall: number = .85
    private shortfall: number = 2.55

    private isWallSliding: boolean = false
    private wallSlidingSpeed: number = 40

    private isWallJumping: boolean = false
    private lastWallJumped: number = 0
    private wallJumpingDirection: number = 0
    private wallJumpingCooldown: number = 0.4
    private wallJumpingDebounce: number = 0
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
            this.flip()

            if (this.grounded) {
                this.sprite.fx = 1000
            } else {
                this.sprite.fx = 50
            }

            if (this.isWallJumping) {
                this.movementSpeed = 0
            } else {
                this.movementSpeed = 100
            }

            // allows for changeable player speed
            controller.player1.moveSprite(this.sprite, this.movementSpeed, 0)

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
        })
    }

    isWalled() {
        return (this.againstWall != 0)
    }

    wallSlide() {
        if (this.isWalled() && (!this.grounded)) {
            this.isWallSliding = true
            this.sprite.setVelocity(this.sprite.vx, Math.constrain(this.sprite.vy, 0, this.wallSlidingSpeed))
        } else {
            this.isWallSliding = false
        }
    }

    /**
     * new wall jumping idea:
     * when you wall jump there is a cool down but only for that specific wall
     * 
     */

    wallJump() {
        if (this.isWallSliding) {
            this.isWallJumping = false
            this.wallJumpingDirection = -this.againstWall
            this.wallJumpingDebounce = this.wallJumpingCooldown
        } else {
            this.wallJumpingDebounce -= control.eventContext().deltaTime
        }

        if (controller.up.isPressed() && this.wallJumpingDebounce > 0) {
            this.isWallJumping = true
            this.jumpHeld = false // prevents the player from flying away
            this.lastWallJumped = this.againstWall
            this.sprite.setVelocity(this.wallJumpingDirection * this.wallJumpingPower.x, this.wallJumpingPower.y)
            this.wallJumpingDebounce = 0


            timer.after(200, function () {
                this.isWallJumping = false
            })
        }
    }

    stopWallJumping() {
        this.isWallJumping = false
    }

    jump() {
        this.physics.force(vectors.create(0, -this.jumpPower))
    }

    flip() {
        if ((this.facingDirection > 0 && this.sprite.vx < 0) ||
            (this.facingDirection < 0 && this.sprite.vx > 0)) {
            this.sprite.image.flipX()
            this.facingDirection = -this.facingDirection
        }
    }
}
