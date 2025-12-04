namespace SpriteKind {
    export const EnemyHitbox = SpriteKind.create()
}

class Hitbox {
    sprite: Sprite
    parent: Sprite
    visible: boolean = false
    debounce: number = -1
    enabled: boolean = true
    constructor(parent: Sprite, kind: number, dimensions: Vector2, offset?: Vector2, debounce?: number, visible?: boolean) {
        this.parent = parent
        let box = image.create(dimensions.x, dimensions.y)
        
        if (!offset) {
            offset = vectors.create() 
        }

        if (debounce) {
            this.debounce = debounce  
        }

        if (visible) { 
            this.visible = visible
            box.fill(6)
        }

        this.sprite = sprites.create(box, kind)
        this.sprite.data = this

        anchor.anchorSprite(parent,this.sprite,offset)
    }

    reset() {
        this.enabled = false
        if (this.debounce > 0) {
            timer.after(this.debounce * 1000, () => {
                if (this) {
                    this.enabled = true
                }
            })
        }
    }
}

namespace HitboxHandler{
    export function getSpriteData(sprite1: Sprite, sprite2: Sprite): [Player, Hitbox] {
        return [sprite1.data, sprite2.data]
    }

    export function processCollision(thing1: Player, thing2: Hitbox){
        thing1.dealDamage(0,5,vectors.create(150,-100))
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

