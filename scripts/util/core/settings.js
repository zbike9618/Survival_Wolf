import { world } from "@minecraft/server";

const SETTINGS_KEY = "sv_wolf_settings";

/**
 * デフォルト設定
 */
const DEFAULT_SETTINGS = {
    borderRadius: 100,
    borderDamage: 0.5,
    borderWarning: 10,
    chatDistance: 20,
    nearbyChatEnabled: true,
    werewolfCount: 1,
    villagerCount: 4,
    autoRoleDistributionEnabled: false,
    werewolfNightPowerEnabled: true,
    deathInvestigationEnabled: true,
    victoryItem: "minecraft:diamond_boots",
    initialItems: [
        "minecraft:wooden_sword",
        "minecraft:wooden_axe",
        "minecraft:wooden_pickaxe",
        "minecraft:bread 16"
    ]
};

/**
 * 現在の設定を取得（保存されていなければデフォルト）
 */
function getAllSettings() {
    const saved = world.getDynamicProperty(SETTINGS_KEY);
    if (!saved) return { ...DEFAULT_SETTINGS };
    try {
        const parsed = JSON.parse(saved);
        // 保存されている設定にデフォルト値をマージする（新しく追加された設定項目が undefined になるのを防ぐ）
        return { ...DEFAULT_SETTINGS, ...parsed };
    } catch (e) {
        return { ...DEFAULT_SETTINGS };
    }
}

/**
 * 設定を保存
 */
export function saveSettings(settings) {
    world.setDynamicProperty(SETTINGS_KEY, JSON.stringify(settings));
}

/**
 * 個別の設定値を取得するためのゲッター群
 */
export const settings = {
    get borderRadius() { return getAllSettings().borderRadius; },
    get borderDamage() { return getAllSettings().borderDamage; },
    get borderWarning() { return getAllSettings().borderWarning; },
    get chatDistance() { return getAllSettings().chatDistance; },
    get nearbyChatEnabled() { return getAllSettings().nearbyChatEnabled; },
    get werewolfCount() { return getAllSettings().werewolfCount; },
    get villagerCount() { return getAllSettings().villagerCount; },
    get autoRoleDistributionEnabled() { return getAllSettings().autoRoleDistributionEnabled; },
    get werewolfNightPowerEnabled() { return getAllSettings().werewolfNightPowerEnabled; },
    get deathInvestigationEnabled() { return getAllSettings().deathInvestigationEnabled; },
    get victoryItem() { return getAllSettings().victoryItem; },
    get initialItems() { return getAllSettings().initialItems; },
    
    // 全て取得（フォーム用）
    getAll() { return getAllSettings(); }
};
