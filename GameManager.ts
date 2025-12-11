namespace GameManger {
    export enum EnemyType {
        Basic
    }

    export function spawnEnemy(enemyType: EnemyType) {
        switch (enemyType) {
            case EnemyType.Basic: {
                new BasicGuy()
            }
        }
    }
}
