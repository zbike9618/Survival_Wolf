import * as server from "@minecraft/server";
import { world, system } from "@minecraft/server";

server.system.beforeEvents.startup.subscribe(ev => {
    ev.customCommandRegistry.registerCommand({
        name: "sv:start",
        description: "ゲームを開始するコマンド",
        permissionLevel: server.CommandPermissionLevel.Any,
        mandatoryParameters: [
        ],
        optionalParameters: [
        ]
    }, (origin, arg) => {
        if (origin.sourceEntity?.typeId === "minecraft:player") {
            let player = origin.sourceEntity;
            system.run(() => {  // 1tick後に安全に実行
                const allPlayers = world.getPlayers();

                // プレイヤーの配列をシャッフル
                const shuffledPlayers = [...allPlayers].sort(() => Math.random() - 0.5);

                // 人狼の数（現在は1人）
                const werewolfCount = 1;

                shuffledPlayers.forEach((p, index) => {
                    // 以前の役職タグがあればリセットする
                    p.removeTag("werewolf");
                    p.removeTag("villager");

                    if (index < werewolfCount) {
                        p.addTag("werewolf");
                        p.sendMessage("§cあなたは【人狼】です。市民を全滅させてください。");
                    } else {
                        p.addTag("villager");
                        p.sendMessage("§bあなたは【市民】です。人狼を見つけ出してください。");
                    }
                });

                player.sendMessage("ゲームを開始しました。プレイヤーに役職を割り当てました。");
            });
        }
    });
});

