import { world, system } from "@minecraft/server";
import { checkVillagerVictory } from "./util/victory.js";

import "./commands/commands.js";
import "./events/playerDeath.js";

// 市民の勝利判定（アイテムチェック）を定期的に実行（20tick = 1秒ごと）
system.runInterval(() => {
    checkVillagerVictory();
}, 20);
