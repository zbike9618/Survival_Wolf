import { world, system } from "@minecraft/server";
import { setSpectatorMode } from "../util/player.js";
import { checkWerewolfVictory } from "../util/core/game.js";
import { settings } from "../util/core/settings.js";

// プレイヤーが死亡したときの処理を監視
world.afterEvents.entityDie.subscribe((event) => {
    const deadEntity = event.deadEntity;
    const damageSource = event.damageSource;

    if (deadEntity?.typeId === "minecraft:player") {
        deadEntity.addTag("dead_player");
        setSpectatorMode(deadEntity);
        
        deadEntity.sendMessage("§e[システム] あなたは死亡しました。チャット欄で §b!tpa§e と入力すると、生存者の場所へテレポートできます。");
        
        // 死因・殺害者の特定
        let killerName = "不明";
        if (damageSource) {
            if (damageSource.damagingEntity) {
                killerName = damageSource.damagingEntity.name || damageSource.damagingEntity.typeId.replace("minecraft:", "");
            } else {
                const cause = damageSource.cause;
                if (cause === "fall") killerName = "落下ダメージ";
                else if (cause === "lava" || cause === "fire" || cause === "fireTick") killerName = "炎・溶岩";
                else if (cause === "drowning") killerName = "溺死";
                else if (cause === "void") killerName = "奈落・ボーダー外";
                else killerName = cause;
            }
        }

        // --- 3. 死亡調査システム（墓標の生成） ---
        if (settings.deathInvestigationEnabled) {
            const loc = deadEntity.location;
            const role = deadEntity.hasTag("werewolf") ? "§c人狼§r" : "§b市民§r";
            
            system.run(() => {
                const dimension = deadEntity.dimension;
                // 墓標代わりの防具立てを召喚
                const grave = dimension.spawnEntity("minecraft:armor_stand", {
                    x: loc.x,
                    y: loc.y,
                    z: loc.z
                });
                grave.nameTag = `§7[${deadEntity.name}の墓]§r\n§8(タップして調査)§r`;
                grave.addTag("sv_grave");
                grave.setDynamicProperty("dead_player_name", deadEntity.name);
                grave.setDynamicProperty("dead_player_role", role);
                grave.setDynamicProperty("dead_player_killer", killerName);
            });
        }

        system.run(() => {
            checkWerewolfVictory();
        });
    }
});

// 墓標を調査したときの処理
world.afterEvents.playerInteractWithEntity.subscribe((event) => {
    const target = event.target;
    const player = event.player;

    if (target.typeId === "minecraft:armor_stand" && target.hasTag("sv_grave")) {
        const name = target.getDynamicProperty("dead_player_name");
        const role = target.getDynamicProperty("dead_player_role");
        const killer = target.getDynamicProperty("dead_player_killer") || "不明";
        
        player.sendMessage(`§l§7--- 死亡調査報告 ---§r`);
        player.sendMessage(`§f死亡者: ${name}`);
        player.sendMessage(`§f正体: ${role}`);
        player.sendMessage(`§f死因/殺害者: ${killer}`);
        player.sendMessage(`§7------------------§r`);
    }
});
