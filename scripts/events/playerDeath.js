import { world } from "@minecraft/server";
import { setSpectatorMode } from "../util/player.js";

// プレイヤーが死亡したときの処理を監視
world.afterEvents.entityDie.subscribe((event) => {
    const deadEntity = event.deadEntity;

    // 死亡したエンティティがプレイヤーであるか確認
    if (deadEntity?.typeId === "minecraft:player") {
        setSpectatorMode(deadEntity);
    }
});
