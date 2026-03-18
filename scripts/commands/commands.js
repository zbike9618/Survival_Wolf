import * as server from "@minecraft/server";
import { world, system } from "@minecraft/server";
import { startGame, endGame, setBorderCenter } from "../util/core/game.js";

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

                // 勝利判定の状態をリセットして開始
                startGame();
                
                // コマンド実行者の位置をボーダーの中心にする
                setBorderCenter(player.location);

                // プレイヤーの配列をシャッフル
                const shuffledPlayers = [...allPlayers].sort(() => Math.random() - 0.5);

                // 人狼の数（現在は1人）
                const werewolfCount = 1;

                shuffledPlayers.forEach((p, index) => {
                    // 以前の役職タグがあればリセットする
                    p.removeTag("werewolf");
                    p.removeTag("villager");
                    p.removeTag("dead_player"); // 生死タグもリセット

                    if (index < werewolfCount) {
                        p.addTag("werewolf");
                        p.sendMessage("§cあなたは【人狼】です。市民を全滅させてください。");
                        p.onScreenDisplay.setTitle("§cあなたは【人狼】です");
                    } else {
                        p.addTag("villager");
                        p.sendMessage("§bあなたは【市民】です。人狼を見つけ出してください。");
                        p.onScreenDisplay.setTitle("§bあなたは【市民】です");
                    }
                });

                player.sendMessage("ゲームを開始しました。プレイヤーに役職を割り当てました。");
                player.runCommand("tp @a @s");
                player.runCommand("gamemode survival @a");

                const intaliitem = [
                    "minecraft:stick",
                    "minecraft:stick",
                    "minecraft:stick",
                    "minecraft:stick"
                ];

                for (let i = 0; i < intaliitem.length; i++) {
                    player.runCommand(`give @a ${intaliitem[i]}`);
                }


                player.runCommand("setblock ~ ~ ~ crafting_table");
            });
        }
    });
});

server.system.beforeEvents.startup.subscribe(ev => {
    ev.customCommandRegistry.registerCommand({
        name: "sv:stop",
        description: "ゲームを終了するコマンド",
        permissionLevel: server.CommandPermissionLevel.Any,
        mandatoryParameters: [],
        optionalParameters: []
    }, (origin, arg) => {
        if (origin.sourceEntity?.typeId === "minecraft:player") {
            let player = origin.sourceEntity;
            system.run(() => {
                const allPlayers = world.getPlayers();

                // 勝利判定の状態をリセットして終了
                endGame();

                allPlayers.forEach(p => {
                    // 全プレイヤーの役職タグと生死タグを消去
                    p.removeTag("werewolf");
                    p.removeTag("villager");
                    p.removeTag("dead_player");
                    
                    p.sendMessage("§eゲームが強制終了されました。");
                });

                player.sendMessage("ゲームを終了しました。全員の役職をリセットしました。");
                world.getDimension("overworld").runCommand("gamemode survival @a");
            });
        }
    });
});