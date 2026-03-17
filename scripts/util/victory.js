import { world, system, GameMode } from "@minecraft/server";

// ゲームが進行中かどうかを管理するフラグ
let isGameActive = false;

/**
 * ゲームを開始状態にする
 */
export function startGame() {
    isGameActive = true;
}

/**
 * 勝利メッセージを表示し、ゲームをリセット（または停止）する
 * @param {string} message 
 */
function announceVictory(message, title) {
    isGameActive = false; // 勝利が決まったら判定を停止する
    for (const player of world.getAllPlayers()) {
        player.onScreenDisplay.setTitle(title);
        player.sendMessage(`§l§6[勝利判定] §r${message}`);
    }
}

/**
 * 人狼側の勝利判定（市民が全員スペクテイターになっているか）
 * @returns {boolean} 勝利したかどうか
 */
export function checkWerewolfVictory() {
    if (!isGameActive) return false;

    const villagers = world.getAllPlayers().filter(p => p.hasTag("villager"));

    // 市民が一人もいない場合は判定しない
    if (villagers.length === 0) return false;

    // 生きている（サバイバルモードの）市民がいるかチェック
    const livingVillagers = villagers.filter(p => p.getGameMode() === GameMode.survival || p.getGameMode() === GameMode.adventure);

    if (livingVillagers.length === 0) {
        announceVictory("§c人狼の勝利！市民が全滅しました。", "§c人狼の勝利");
        return true;
    }
    return false;
}

/**
 * 市民側の勝利判定（特定のアイテムを持っているか）
 * @returns {boolean} 勝利したかどうか
 */
export function checkVillagerVictory() {
    if (!isGameActive) return false;

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
                announceVictory(`§b市民の勝利！${villager.name}が聖なるダイヤモンドを手に入れました。`, "§b市民の勝利");
                return true;
            }
        }
    }
    return false;
}
