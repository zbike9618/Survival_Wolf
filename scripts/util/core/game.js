import { world, system, GameMode } from "@minecraft/server";
import { settings } from "./settings.js";

// キーの定義
// キーの定義
const IS_ACTIVE_KEY = "sv_is_active";
const ELAPSED_TICKS_KEY = "sv_elapsed_ticks"; // 経過Tick数
const BORDER_CENTER_KEY = "sv_border_center";

/**
 * ゲームが進行中かどうかを返す
 */
export function getGameActive() {
    return world.getDynamicProperty(IS_ACTIVE_KEY) === true;
}

/**
 * 経過Tick数を取得
 */
export function getGameTicks() {
    return world.getDynamicProperty(ELAPSED_TICKS_KEY) ?? 0;
}

/**
 * ゲームを開始状態にする
 */
export function startGame() {
    world.setDynamicProperty(IS_ACTIVE_KEY, true);
    world.setDynamicProperty(ELAPSED_TICKS_KEY, 0);
    world.setTimeOfDay(0); // 開始時は朝にする
}

/**
 * ティックを加算する
 */
export function incrementGameTicks() {
    const current = getGameTicks();
    world.setDynamicProperty(ELAPSED_TICKS_KEY, current + 1);
}

/**
 * ゲームを終了状態にする
 */
export function endGame() {
    world.setDynamicProperty(IS_ACTIVE_KEY, false);
}

/**
 * ゲームが進行中かどうかを返す
 */
/**
 * ゲーム開始からの経過Tick数を取得 (互換性のための残し)
 */
// getGameTicks は上記で実装済み

/**
 * ボーダーの中心座標を設定する
 */
export function setBorderCenter(loc) {
    world.setDynamicProperty(BORDER_CENTER_KEY, JSON.stringify({ x: loc.x, y: loc.y, z: loc.z }));
}

/**
 * ボーダーの中心座標を取得する
 */
export function getBorderCenter() {
    const saved = world.getDynamicProperty(BORDER_CENTER_KEY);
    if (!saved) return [0, 0, 0];
    const loc = JSON.parse(saved);
    return [loc.x, loc.y, loc.z];
}

function announceVictory(message, title) {
    const center = getBorderCenter();
    world.setDynamicProperty(IS_ACTIVE_KEY, false); // 勝利が決まったら判定を停止する

    // 全プレイヤーの役職リストを作成
    const players = world.getAllPlayers();
    let resultMessage = "\n§l§e--- 全員の役職 ---§r\n";

    players.forEach(p => {
        const role = p.hasTag("werewolf") ? "§c人狼§r" : "§b市民§r";
        resultMessage += `§7- §f${p.name}: ${role}\n`;
    });

    for (const player of world.getAllPlayers()) {
        player.onScreenDisplay.setTitle(title);
        // 勝利メッセージと全員の役職リストを送信
        player.sendMessage(`§l§6[勝利判定] §r${message}${resultMessage}`);
    }
    system.runTimeout(() => {
        world.getDimension("minecraft:overworld").runCommand("gamemode c @a");
        world.getDimension("minecraft:overworld").runCommand(`tp @a ${center[0]} ${center[1]} ${center[2]}`);
    }, 20 * 3);
}

/**
 * 人狼側の勝利判定（市民が全員スペクテイターになっているか）
 * @returns {boolean} 勝利したかどうか
 */
export function checkWerewolfVictory() {
    if (!getGameActive()) return false;

    const villagers = world.getAllPlayers().filter(p => p.hasTag("villager"));

    // 市民が一人もいない場合は判定しない
    if (villagers.length === 0) return false;

    // 生きている市民がいるかチェック（dead_playerタグがついていない人）
    const livingVillagers = villagers.filter(p => !p.hasTag("dead_player"));

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
    if (!getGameActive()) return false;

    const villagers = world.getAllPlayers().filter(p => p.hasTag("villager"));

    // 市民が一人もいない場合は判定しない
    if (villagers.length === 0) return false;

    const victoryItem = settings.victoryItem;

    for (const villager of villagers) {
        const inventory = villager.getComponent("minecraft:inventory");
        if (!inventory || !inventory.container) continue;

        for (let i = 0; i < inventory.container.size; i++) {
            const item = inventory.container.getItem(i);
            if (item && item.typeId === victoryItem) {
                announceVictory(`§b市民の勝利！${villager.name}がダイヤモンドブーツを手に入れました。`, "§b市民の勝利");
                return true;
            }
        }
    }
    return false;
}
