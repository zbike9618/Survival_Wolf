import { world, system } from "@minecraft/server";
import { settings } from "../core/settings.js";
import { getGameActive } from "../core/game.js";
import { ActionFormData } from "@minecraft/server-ui";


world.beforeEvents.chatSend.subscribe((event) => {
    const sender = event.sender;
    const message = event.message;

    // --- !tp コマンド (死亡者用) ---
    if (message.startsWith("!tp")) {
        event.cancel = true;

        // ゲーム中かつ死んでいる場合のみ許可
        if (!getGameActive() || !sender.hasTag("dead_player")) {
            sender.sendMessage("§c!tp コマンドはゲーム中の死亡者（観戦者）のみ使用できます。");
            return;
        }

        const args = message.split(" ");
        const targetName = args[1]; // !tp <name> の <name> 部分

        system.run(() => {
            const livingPlayers = world.getAllPlayers().filter(p => !p.hasTag("dead_player"));

            if (livingPlayers.length === 0) {
                sender.sendMessage("§cテレポート先の生存プレイヤーがいません。");
                return;
            }

            // 名前が指定されている場合は直接テレポートを試みる
            if (targetName) {
                const target = livingPlayers.find(p => p.name.toLowerCase() === targetName.toLowerCase());
                if (target) {
                    sender.teleport(target.location, { dimension: target.dimension });
                    sender.sendMessage(`§a${target.name} にテレポートしました。`);
                } else {
                    sender.sendMessage(`§cエラー: 「${targetName}」という名前の生存プレイヤーが見つかりません。`);
                }
                return;
            }

            // 名前が指定されていない場合はメニューを表示
            const menu = new ActionFormData()
                .title("§lテレポート先を選択")
                .body("テレポートしたいプレイヤーを選んでください。");

            livingPlayers.forEach(p => {
                menu.button(`${p.name}\n§8(生存者)`);
            });

            menu.show(sender).then(response => {
                if (response.canceled) return;
                const target = livingPlayers[response.selection];
                if (target) {
                    sender.teleport(target.location, { dimension: target.dimension });
                    sender.sendMessage(`§a${target.name} にテレポートしました。`);
                }
            });
        });
        return;
    }

    // 1. ゲームが始まっていない、または近距離チャット設定がオフの場合は、通常のチャットにする
    if (!getGameActive() || !settings.nearbyChatEnabled) {
        return;
    }

    // 2. 近距離チャットがオンでゲーム中の場合のみ、チャットを制御する
    event.cancel = true;

    const isSenderDead = sender.hasTag("dead_player");

    // --- 死亡者（霊界）チャット ---
    if (isSenderDead) {
        // 死亡者のチャットは、他の死亡者全員に距離に関係なく届く
        for (const player of world.getAllPlayers()) {
            if (player.hasTag("dead_player")) {
                player.sendMessage(`§7[霊界] <${sender.name}> ${message}`);
            }
        }
        return;
    }

    // --- 生存者チャット（近距離のみ） ---
    const dimension = sender.dimension;

    // 送信者の位置の近くにいる生存者を探す
    const nearbyPlayers = dimension.getPlayers({
        location: sender.location,
        maxDistance: settings.chatDistance,
        excludeTags: ["dead_player"]
    });

    for (const player of nearbyPlayers) {
        const dx = sender.location.x - player.location.x;
        const dy = sender.location.y - player.location.y;
        const dz = sender.location.z - player.location.z;
        const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
        const displayDistance = distance.toFixed(1);

        // 生存者の声は、近くにいる「生きている人」に届く
        player.sendMessage(`[近距離チャット] (${displayDistance}m) <${sender.name}> ${message}`);
    }
});
