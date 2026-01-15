// maeges enemies abviously (i cant spell)

type TileCheck = "pitfall" | "wall"

abstract class Enemy extends CharacterController {
    moventSpeed: number
    movementDirection: number
    moving: boolean = false
    targetPosititon: number
    hitlol: Hitbox

    constructor(sprite: Sprite) {
        super(sprite)
        sprite.setKind(SpriteKind.Enemy)

        this.hitlol = new Hitbox(
            this.sprite, // sprite
            SpriteKind.EnemyHitbox, // hitbox type
            vectors.create(this.sprite.image.width, this.sprite.image.height), // size
            null, // offset
            200 // knockback strength
        )
        this.hitlol.debounce = 1

        tiles.placeOnRandomTile(this.sprite, assets.tile`myTile49`)
        tileUtil.replaceAllTiles(assets.tile`myTile49`, assets.tile`transparency16`) // remove later

        game.onUpdate(() => {
            if (this.moving) {
                // console.logValue("currentpos", this.sprite.x)
                // console.logValue("targetpos", this.targetPosititon)
                this.move()
                // checks to make sure the npc doesn't move past its target position
                // checks to make sure the npc isn't walking off a platform 
                if
                    (
                    (this.movementDirection > 0 && sprite.x >= this.targetPosititon) ||
                    (this.movementDirection < 0 && sprite.x <= this.targetPosititon) ||
                    this.checkTile("pitfall") // if there is a pitfall
                ) {
                    this.moving = false
                }
            }
        })
    }

    private move() {
        this.sprite.vx = this.moventSpeed * this.movementDirection
    }

    checkTile(condition: TileCheck, direction?: number, tile?: tiles.Location) {
        let currentTilePos = tile || this.sprite.tilemapLocation()
        if (direction == undefined) {
            direction = this.movementDirection;
        }

        let wall = direction > 0 ?
            currentTilePos.getNeighboringLocation(CollisionDirection.Right) :
            currentTilePos.getNeighboringLocation(CollisionDirection.Left)

        switch (condition) {
            case "pitfall":
                // check bottom right (or left) tile
                return !tiles.tileAtLocationIsWall(wall.getNeighboringLocation(CollisionDirection.Bottom))
            case "wall":
                // check side tile
                return tiles.tileAtLocationIsWall(wall)
        }
    }
    
    raycastTile(distance: number, condition: TileCheck, direction?: number) {
        let currentTile = this.sprite.tilemapLocation()
        if (direction == undefined) {
            direction = this.movementDirection;
        }

        for (let i = 1; i <= distance; i++) {
            let result = this.checkTile(condition, direction, currentTile)
            if (result) {return i}
            
            direction = (direction > 0) ?
                CollisionDirection.Right :
                CollisionDirection.Left
            currentTile = currentTile.getNeighboringLocation(direction)
        }

        return false
    }

    moveForwardInPixels(numberOfPixels: number) {
        this.sprite.fx = 1000
        this.targetPosititon = this.sprite.x + (numberOfPixels * this.movementDirection)
        this.moving = true
    }

    moveForwardInTiles(numberofTiles: number) {
        let currentTilePos = this.sprite.tilemapLocation()
        let direction = (this.movementDirection > 0) ? 
        CollisionDirection.Right :
        CollisionDirection.Left

        let targetTile = currentTilePos
        for (let i = 0; i < numberofTiles; i++) {
            targetTile = targetTile.getNeighboringLocation(direction)
        }

        let numberOfPixels = Math.abs(this.sprite.x - targetTile.x)
        this.moveForwardInPixels(numberOfPixels)
    }
}

class BasicGuy extends Enemy {

    constructor() {
        super(sprites.create(assets.image`Shadow Enemy`))
        this.moventSpeed = 50
        this.movementDirection = -1
        this.moveForwardInPixels(1000)
    }
}
