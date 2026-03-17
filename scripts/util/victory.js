import { world, system, GameMode } from "@minecraft/server";

/**
 * 勝利メッセージを表示し、ゲームをリセット（または停止）する
 * @param {string} title 
 * @param {string} subtitle 
 */
function announceVictory(title, subtitle) {
    for (const player of world.getAllPlayers()) {
        player.onScreenDisplay.setTitle(title);
        player.onScreenDisplay.setSubtitle(subtitle);
        player.sendMessage(`§l§6[勝利判定] §r${title}: ${subtitle}`);
    }
}

/**
 * 人狼側の勝利判定（市民が全員スペクテイターになっているか）
 * @returns {boolean} 勝利したかどうか
 */
export function checkWerewolfVictory() {
    const villagers = world.getAllPlayers().filter(p => p.hasTag("villager"));
    
    // 市民が一人もいない場合は判定しない
    if (villagers.length === 0) return false;

    // 生きている（サバイバルモードの）市民がいるかチェック
    const livingVillagers = villagers.filter(p => p.getGameMode() === GameMode.survival || p.getGameMode() === GameMode.adventure);

    if (livingVillagers.length === 0) {
        announceVictory("§c人狼の勝利！", "§f市民が全滅しました。");
        return true;
    }
    return false;
}

/**
 * 市民側の勝利判定（特定のアイテムを持っているか）
 * @returns {boolean} 勝利したかどうか
 */
export function checkVillagerVictory() {
    const villagers = world.getAllPlayers().filter(p => p.hasTag("villager"));
    
    // 市民が一人もいない場合は判定しない
    if (villagers.length === 0) return false;

    // 適当なアイテムとして「ダイヤモンド」を勝利条件にします
    const victoryItem = "minecraft:diamond";

    for (const villager of villagers) {
        const inventory = villager.getComponent("minecraft:inventory");
        if (!inventory || !inventory.container) continue;

        for (let i = 0; i < inventory.container.size; i++) {
            const item = inventory.container.getItem(i);
            if (item && item.typeId === victoryItem) {
                announceVictory("§b市民の勝利！", `§f${villager.name}が§e聖なるダイヤモンド§fを手に入れました。`);
                return true;
            }
        }
    }
    return false;
}
