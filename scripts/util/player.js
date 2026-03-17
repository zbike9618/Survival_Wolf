import { system, world } from "@minecraft/server";

/**
 * プレイヤーのゲームモードをスペクテイターに変更する
 * @param {import("@minecraft/server").Player} player 
 */
export function setSpectatorMode(player) {
    if (!player) return;

    system.run(() => {
        // Run gamemode command safely on the next tick
        player.runCommand("gamemode spectator @s").catch(e => {
            console.warn("Failed to set spectator mode for player: " + player.name);
        });
    });
}
