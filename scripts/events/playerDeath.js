import { world, system } from "@minecraft/server";
import { setSpectatorMode } from "../util/player.js";
import { checkWerewolfVictory } from "../util/core/game.js";
import { settings } from "../util/core/settings.js";

// プレイヤーが死亡したときの処理を監視
world.afterEvents.entityDie.subscribe((event) => {
    const deadEntity = event.deadEntity;

    if (deadEntity?.typeId === "minecraft:player") {
        deadEntity.addTag("dead_player");
        setSpectatorMode(deadEntity);
        
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
        
        player.sendMessage(`§l§7--- 死亡調査報告 ---§r`);
        player.sendMessage(`§f死亡者: ${name}`);
        player.sendMessage(`§f正体: ${role}`);
        player.sendMessage(`§7------------------§r`);
    }
});
