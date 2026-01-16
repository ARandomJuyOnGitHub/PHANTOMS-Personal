namespace SpriteKind {
    export const EnemyHitbox = SpriteKind.create()
    export const PlayerHitbox = SpriteKind.create()
    export const PlayerPogoHitbox = SpriteKind.create()
}

// invisible spreites dont collide. will most likely will have
// to make collision system from scratch

class Hitbox {
    sprite: Sprite
    parent: Sprite

    active: boolean = true
    debounce: number = -1
    knockBackMagnitude?: number;
    knockBackDirection?: Vector2;// is only used if direction is defined
    invisible: boolean = true
    enabled: boolean = true

    constructor(parent: Sprite, kind: number, dimensions: Vector2, offset?: Vector2, magnitude?: number, direction?: Vector2, debounce?: number, visible?: boolean) {
        this.parent = parent
        let box = image.create(dimensions.x, dimensions.y)
        box.fill(6)

        if (magnitude) {
            this.knockBackMagnitude = magnitude
        }

        if (direction) {
            this.knockBackDirection = direction
        }

        if (!offset) {
            offset = vectors.create()
        }

        if (debounce) {
            this.debounce = debounce
        }

        // if (this.invisible) { 
        //     this.invisible = visible
        // }

        this.sprite = sprites.create(box, kind)
        this.sprite.data = this
        this.sprite.setFlag(SpriteFlag.Invisible, this.invisible)

        anchor.anchorSprite(parent, this.sprite, offset)
    }

    reset() {
        this.enabled = false
        if (this.debounce > 0) {
            timer.after(this.debounce * 1000, () => {
                if (this.active) {
                    this.enabled = true
                }
            })
        }
    }

    destroy() {
        this.active = false
        anchor.unanchorSprite(this.parent, this.sprite)
        sprites.destroy(this.sprite)
    }
}

namespace HitboxHandler {
    export function getSpriteData(sprite1: Sprite, sprite2: Sprite): [Player | Enemy, Hitbox] {
        return [sprite1.data, sprite2.data]
    }

    function getDirection(sprite1: Sprite, sprite2: Sprite) {
        let direcionVector: Vector2 = vectors.subtract(vectors.spritePropertyToVector(sprite1, SpriteProperties.Position), vectors.spritePropertyToVector(sprite2, SpriteProperties.Position))
        return vectors.normal(direcionVector)
    }

    function checkHitboxKind(hitbox: Hitbox, kind: number) {
        return (hitbox.sprite.kind() == kind)
    }

    export function detectCollision(sprite: Sprite, otherSprite: Sprite) {
        let entities: [Player | Enemy, Hitbox] = HitboxHandler.getSpriteData(sprite, otherSprite)
        let entity: Player | Enemy = (entities as any[])[0]
        let hitbox: Hitbox = (entities as any[])[1]
        if (hitbox.enabled) {
            hitbox.reset()
            processCollision(entity, hitbox)
        }
    }

    function processCollision(entity: Player | Enemy, hitbox: Hitbox) {
        if (entity instanceof Player) {
            let direction = hitbox.knockBackDirection
            if (direction == null) {
                direction = getDirection(entity.sprite, hitbox.sprite)
            }

            entity.dealDamage(0, 1, vectors.multiply(direction, hitbox.knockBackMagnitude))
        }

        if (checkHitboxKind(hitbox, SpriteKind.PlayerPogoHitbox)) {
            let player = GameManger.player
            player.launch(200)
        }

        if (checkHitboxKind(hitbox, SpriteKind.PlayerHitbox)) {
            console.log("hit")
        }
    }
}

sprites.onOverlap(SpriteKind.Player, SpriteKind.EnemyHitbox, function (sprite: Sprite, otherSprite: Sprite) {
    HitboxHandler.detectCollision(sprite, otherSprite)
})

sprites.onOverlap(SpriteKind.Enemy, SpriteKind.PlayerHitbox, function (sprite: Sprite, otherSprite: Sprite) {
    HitboxHandler.detectCollision(sprite, otherSprite)
})

sprites.onOverlap(SpriteKind.Enemy, SpriteKind.PlayerPogoHitbox, function (sprite: Sprite, otherSprite: Sprite) {
    HitboxHandler.detectCollision(sprite, otherSprite)
    console.log("yay")
})
