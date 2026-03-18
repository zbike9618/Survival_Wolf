import { world, system } from "@minecraft/server";
import { getGameActive, getGameTicks } from "../core/game.js";
import { settings } from "../core/settings.js";

/**
 * 経過日に応じたステータス表示とエフェクト付与
 */
system.runInterval(() => {
    if (!getGameActive()) return;

    const totalTicks = getGameTicks();
    
    // 日数: 0-23999 が 1日目
    const day = Math.floor(totalTicks / 24000) + 1;
    
    // 時刻の計算 (開始 0 ticks = 06:00)
    // 24000 ticks = 24 hours => 1000 ticks = 1 hour
    // (totalTicks + 6000) % 24000 で 0 ticks が 6000 (06:00) になるように調整
    const dayTicks = (totalTicks + 6000) % 24000;
    let totalMinutes = Math.floor(dayTicks / 24000 * 1440);
    const hours = Math.floor(totalMinutes / 60);
    const mins = Math.floor(totalMinutes % 60);
    const timeStr = `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;

    const isDay = dayTicks < 18000 && dayTicks >= 6000; // 06:00 ~ 18:00
    const dayNightIcon = isDay ? "§e☀" : "§1🌙";
    const dayColor = isDay ? "§e" : "§b";

    // 上部に表示するための工夫：アクションバーを少し強めに強調
    // （※Bedrock Script API では「上端」へ固定する機能が制限されているため、アクションバーを使用します）
    const hudText = `§l${dayColor}[Day ${day}]  ${dayNightIcon} ${timeStr}  §7|  §fSurvival Wolf§r`;

    for (const player of world.getAllPlayers()) {
        player.onScreenDisplay.setActionBar(hudText);

        if (player.hasTag("dead_player")) continue;

        // --- ステータス効果 (永続付与) ---
        
        // 人狼 (werewolf) 
        if (player.hasTag("werewolf")) {
            // --- 2. 夜間強化 (移動速度・暗視) ---
            if (settings.werewolfNightPowerEnabled && !isDay) {
                player.addEffect("speed", 100, { amplifier: 0, showParticles: false });
                player.addEffect("night_vision", 400, { amplifier: 0, showParticles: false });
            }

            // --- 1. 経過日数による強化 ---
            // 2日目以降: 耐性 1 (amplifier: 0)
            if (day >= 2) {
                player.addEffect("resistance", 100, { amplifier: 0, showParticles: false });
            }
            // 3日目以降: 攻撃力増加 2 (amplifier: 1)
            if (day >= 3) {
                player.addEffect("strength", 100, { amplifier: 1, showParticles: false });
            }
        }

        // 市民 (villager)
        if (player.hasTag("villager")) {
            // 4日目以降: 空腹
            if (day >= 4) {
                player.addEffect("hunger", 100, { amplifier: 0, showParticles: false });
            }
        }
    }
}, 20);
