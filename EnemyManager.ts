// maeges enemies abviously (i cant spell)

abstract class Enemy extends CharacterController {
    moventSpeed: number
    movementDirection: number
    hitlol: Hitbox
    constructor(sprite: Sprite){
        super(sprite)
        this.hitlol = new Hitbox(
            this.sprite,
            SpriteKind.EnemyHitbox,
            vectors.create(this.sprite.image.width, this.sprite.image.height),
            null,
            200
        )
        this.hitlol.debounce = 1
        tiles.placeOnRandomTile(this.sprite, assets.tile`myTile49`)
        tileUtil.replaceAllTiles(assets.tile`myTile49`, assets.tile`transparency16`) // remove later
    }
}

class BasicGuy extends Enemy {

    constructor(){
        super(sprites.create(assets.image`Normal Enemy`))
    }
}
