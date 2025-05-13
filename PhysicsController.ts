class PhysicsController {
    sprite: Sprite = null
    maxSpeed: number = 100
    gravitationalForce: number = 500

    constructor(_sprite: Sprite) {
        this.sprite = _sprite
        this.sprite.ay = this.gravitationalForce
        this.sprite.fx = 50
    }

    accelerate(vector: Vector2) {
        this.sprite.ax = vector.x
        this.sprite.ay = vector.y
    }

    force(vector: Vector2) {
        this.sprite.setVelocity(vector.x, vector.y)
    }
}