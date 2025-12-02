class Hitbox {
    sprite: Sprite
    parent: Sprite
    visible: boolean = false
    debounce: number = -1
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
    }

}

namespace HitboxHandler{
    function doDamge(){
        console.log("ow!")
    }
}