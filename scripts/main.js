import { world, system } from "@minecraft/server";
import { checkVillagerVictory, getGameActive } from "./util/victory.js";

import "./commands/commands.js";
import "./events/playerDeath.js";
import "./util/chat.js";

// 市民の勝利判定（アイテムチェック）を定期的に実行（20tick = 1秒ごと）
system.runInterval(() => {
    checkVillagerVictory();
    world.getDimension("overworld").runCommand("clear @a crafting_table");
}, 20);

world.beforeEvents.playerBreakBlock.subscribe((event) => {
    const block = event.block;
    const player = event.player;
    // getGameActive() 関数を使って判定
    if (block.typeId === "minecraft:crafting_table" && getGameActive() === true) {
        event.cancel = true;
        player.sendMessage("§c作業台を壊すことはできません");
    }
});