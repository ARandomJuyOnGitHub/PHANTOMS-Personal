namespace SpriteKind {
    export const EnemyHitbox = SpriteKind.create()
    export const PlayerHitbox = SpriteKind.create()
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
    visible: boolean = false
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

        if (this.visible) { 
            this.visible = visible
        }

        this.sprite = sprites.create(box, kind)
        this.sprite.data = this
        this.sprite.setFlag(SpriteFlag.Invisible, this.visible)

        anchor.anchorSprite(parent,this.sprite,offset)
        console.log(anchor.isAnchoredTo(parent,this.sprite))
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
        anchor.unanchorSprite(this.parent,this.sprite)
        sprites.destroy(this.sprite)
    }
}

namespace HitboxHandler{
    export function getSpriteData(sprite1: Sprite, sprite2: Sprite): [Player, Hitbox] {
        return [sprite1.data, sprite2.data]
    }

    function getDirection(sprite1: Sprite , sprite2: Sprite) {
        let direcionVector: Vector2 = vectors.subtract(vectors.spritePropertyToVector(sprite1, SpriteProperties.Position), vectors.spritePropertyToVector(sprite2, SpriteProperties.Position))
        return vectors.normal(direcionVector)
    }

    export function processCollision(player: Player, hitbox: Hitbox){
        let direction = hitbox.knockBackDirection
        if (direction == undefined) {
            direction = getDirection(player.sprite,hitbox.sprite)
        }

        player.dealDamage(0, 5, vectors.multiply(direction, hitbox.knockBackMagnitude))
    }
}

sprites.onOverlap(SpriteKind.Player, SpriteKind.EnemyHitbox, function(sprite: Sprite, otherSprite: Sprite) {
    let entities: [Player, Hitbox] = HitboxHandler.getSpriteData(sprite, otherSprite)
    let player: Player = (entities as any[])[0]
    let hitbox: Hitbox = (entities as any[])[1]
    if (hitbox.enabled) {
        hitbox.reset()
        HitboxHandler.processCollision(player, hitbox)
    }
})

