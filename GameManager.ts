namespace GameManger {
    export enum EnemyType {
        Basic
    }
    export let player: Player;


    export function spawnEnemy(enemyType: EnemyType) {
        switch (enemyType) {
            case EnemyType.Basic: {
                new BasicGuy()
            }
        }
    }

    export function spawnPlayer(){
        let playerSprite = sprites.create(assets.image`Normal Enemy`)
        scene.cameraFollowSprite(playerSprite)
        GameManger.player = new Player(playerSprite)

        tiles.setCurrentTilemap(tilemap`Combat Testing`)
        tiles.placeOnRandomTile(playerSprite, assets.tile`Start`)
        tileUtil.replaceAllTiles(assets.tile`Start`, assets.tile`transparency16`)
    }
}
