import { world, system } from "@minecraft/server";
import { checkVillagerVictory, getGameActive, incrementGameTicks } from "./util/core/game.js";

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