import { world, system } from "@minecraft/server";
import { setSpectatorMode } from "../util/player.js";
import { checkWerewolfVictory } from "../util/victory.js";

// プレイヤーが死亡したときの処理を監視
world.afterEvents.entityDie.subscribe((event) => {
    const deadEntity = event.deadEntity;

    // 死亡したエンティティがプレイヤーであるか確認
    if (deadEntity?.typeId === "minecraft:player") {
        deadEntity.addTag("dead_player");
        setSpectatorMode(deadEntity);
        
        // 死亡後に人狼の勝利条件（市民全滅）をチェック
        system.run(() => {
            checkWerewolfVictory();
        });
    }
});
