import { world, system } from "@minecraft/server";
import { checkVillagerVictory, getGameActive, incrementGameTicks, getBorderCenter } from "./util/core/game.js";

import "./commands/commands.js";
import "./events/playerDeath.js";
import "./util/systems/chat.js";
import "./util/systems/border.js";
import "./util/systems/status.js";

system.runInterval(() => {
    if (getGameActive()) {
        incrementGameTicks();
    }
}, 1);

// 作業台の位置にビーコンの光（パーティクルの柱）を表示する
system.runInterval(() => {
    if (getGameActive()) {
        const center = getBorderCenter();
        const dim = world.getDimension("overworld");
        
        // 作業台の中心座標を計算（ブロックの中心座標）
        const bx = Math.floor(center[0]) + 0.5;
        const by = Math.floor(center[1]) + 1; // 作業台のすぐ上から開始
        const bz = Math.floor(center[2]) + 0.5;

        // 上に向かってパーティクルを発生させ、光の柱をシミュレート
        for (let i = 0; i < 60; i += 1.5) {
            try {
                dim.spawnParticle("minecraft:endrod", { x: bx, y: by + i, z: bz });
            } catch (e) {
                // ディメンションがロードされていない場合などのエラーを無視する
            }
        }
    }
}, 10);

// 市民の勝利判定（アイテムチェック）を定期的に実行（20tick = 1秒ごと）
system.runInterval(() => {
    checkVillagerVictory();
    world.getDimension("overworld").runCommand("effect @a[tag=dead_player] night_vision infinite 1 true");
    world.getDimension("overworld").runCommand("clear @a crafting_table");
}, 1);

world.beforeEvents.playerBreakBlock.subscribe((event) => {
    const block = event.block;
    const player = event.player;
    // getGameActive() 関数を使って判定
    if (block.typeId === "minecraft:crafting_table" && getGameActive() === true) {
        event.cancel = true;
        player.sendMessage("§c作業台を壊すことはできません");
    }
});

// 爆発から作業台を保護
world.beforeEvents.explosion.subscribe((event) => {
    if (getGameActive()) {
        const impactedBlocks = event.getImpactedBlocks();
        const safeBlocks = impactedBlocks.filter(b => b.typeId !== "minecraft:crafting_table");
        event.setImpactedBlocks(safeBlocks);
    }
});