import * as server from "@minecraft/server";
import { world, system } from "@minecraft/server";
import { startGame, endGame, setBorderCenter } from "../util/core/game.js";
import { ModalFormData, ActionFormData } from "@minecraft/server-ui";
import { settings, saveSettings } from "../util/core/settings.js";

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
                player.runCommand("effect @a instant_health 5 255 true");
                player.runCommand("effect @a saturation 5 255 true");
                player.runCommand("effect @a clear");
                player.runCommand("clear @a");

                const intaliitem = settings.initialItems;

                for (let i = 0; i < intaliitem.length; i++) {
                    player.runCommand(`give @a ${intaliitem[i]}`);
                }


                player.runCommand("setblock ~ ~ ~ crafting_table");
                player.runCommand("setworldspawn ~ ~1 ~")
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



server.system.beforeEvents.startup.subscribe(ev => {
    ev.customCommandRegistry.registerCommand({
        name: "sv:settings",
        description: "ゲームの各種設定を変更します",
        permissionLevel: server.CommandPermissionLevel.Any,
    }, (origin, args) => {
        const player = origin.sourceEntity;
        if (!player || player.typeId !== "minecraft:player") return;

        system.run(() => {
            showMainMenu(player);
        });
    });
});

/**
 * 設定のメインメニュー
 */
function showMainMenu(player) {
    const menu = new ActionFormData()
        .title("§lSurvival Wolf 設定")
        .body("設定する項目を選んでください。")
        .button("§bボーダー設定")
        .button("§6勝利条件アイテム")
        .button("§eチャット設定")
        .button("§a初期装備設定");

    menu.show(player).then(response => {
        if (response.canceled) return;
        switch (response.selection) {
            case 0: showBorderSettings(player); break;
            case 1: showVictorySettings(player); break;
            case 2: showChatSettings(player); break;
            case 3: showEquipmentSettings(player); break;
        }
    });
}

/**
 * ボーダー設定
 */
function showBorderSettings(player) {
    const current = settings.getAll();
    const form = new ModalFormData()
        .title("§lボーダー設定")
        .slider("半径", 10, 500, { defaultValue: current.borderRadius })
        .textField("ダメージ倍率", "0.1 ~ 5.0", { defaultValue: String(current.borderDamage) })
        .slider("エリア外猶予時間", 0, 60, { defaultValue: current.borderWarning });

    form.show(player).then(response => {
        if (response.canceled) return showMainMenu(player);
        const [radius, damageStr, warning] = response.formValues;
        const damage = parseFloat(damageStr) || 0.5;

        const updated = settings.getAll();
        updated.borderRadius = radius;
        updated.borderDamage = damage;
        updated.borderWarning = warning;
        saveSettings(updated);
        player.sendMessage("§a§l[設定] §rボーダー設定を保存しました。");
    });
}

/**
 * 勝利条件設定
 */
function showVictorySettings(player) {
    const current = settings.getAll();
    const form = new ModalFormData()
        .title("§l勝利条件設定")
        .textField("必要アイテムID", "minecraft:...", { defaultValue: current.victoryItem });

    form.show(player).then(response => {
        if (response.canceled) return showMainMenu(player);
        const [item] = response.formValues;

        const updated = settings.getAll();
        updated.victoryItem = item;
        saveSettings(updated);
        player.sendMessage("§a§l[設定] §r勝利条件を保存しました。");
    });
}

/**
 * チャット設定
 */
function showChatSettings(player) {
    const current = settings.getAll();
    const form = new ModalFormData()
        .title("§lチャット設定")
        .slider("有効範囲", 5, 100, { defaultValue: current.chatDistance });

    form.show(player).then(response => {
        if (response.canceled) return showMainMenu(player);
        const [dist] = response.formValues;

        const updated = settings.getAll();
        updated.chatDistance = dist;
        saveSettings(updated);
        player.sendMessage("§a§l[設定] §rチャット設定を保存しました。");
    });
}

/**
 * 初期装備設定 (一覧表示)
 */
function showEquipmentSettings(player) {
    const current = settings.getAll();
    const itemList = current.initialItems || [];

    const menu = new ActionFormData()
        .title("§l初期装備リスト")
        .body("設定されている初期装備です。アイテムを選んで編集・削除できます。");

    itemList.forEach((item, index) => {
        menu.button(`§7[${index + 1}] §f${item}`);
    });

    menu.button("§a§l[+] アイテムを追加");
    menu.button("§8戻る");

    menu.show(player).then(response => {
        if (response.canceled) return showMainMenu(player);

        if (response.selection === itemList.length) {
            // 「アイテムを追加」を選択
            showItemEditor(player, -1);
        } else if (response.selection === itemList.length + 1) {
            // 「戻る」を選択
            showMainMenu(player);
        } else {
            // 特定のアイテムを選択
            showItemOptionsMenu(player, response.selection);
        }
    });
}

/**
 * 個別アイテムの操作メニュー (編集/削除)
 */
function showItemOptionsMenu(player, index) {
    const itemList = settings.initialItems;
    const item = itemList[index];

    const menu = new ActionFormData()
        .title("§lアイテム操作")
        .body(`選択中: ${item}`)
        .button("§e編集")
        .button("§c削除")
        .button("§8戻る");

    menu.show(player).then(response => {
        if (response.canceled) return showEquipmentSettings(player);

        switch (response.selection) {
            case 0: // 編集
                showItemEditor(player, index);
                break;
            case 1: // 削除
                const updated = settings.getAll();
                updated.initialItems.splice(index, 1);
                saveSettings(updated);
                player.sendMessage("§aアイテムを削除しました。");
                showEquipmentSettings(player);
                break;
            case 2: // 戻る
                showEquipmentSettings(player);
                break;
        }
    });
}

/**
 * アイテムの追加・編集フォーム
 */
function showItemEditor(player, index) {
    const itemList = settings.initialItems;
    const isEdit = index !== -1;
    const currentItem = isEdit ? itemList[index] : "";

    const form = new ModalFormData()
        .title(isEdit ? "§lアイテムを編集" : "§lアイテムを追加")
        .textField("アイテムIDと個数 (例: bread 16)", "minecraft:apple", { defaultValue: currentItem });

    form.show(player).then(response => {
        if (response.canceled) return isEdit ? showItemOptionsMenu(player, index) : showEquipmentSettings(player);

        const [newItem] = response.formValues;
        if (!newItem || newItem.trim().length === 0) {
            player.sendMessage("§cエラー: アイテムIDを入力してください。");
            return showEquipmentSettings(player);
        }

        const updated = settings.getAll();
        if (isEdit) {
            updated.initialItems[index] = newItem.trim();
        } else {
            updated.initialItems.push(newItem.trim());
        }

        saveSettings(updated);
        player.sendMessage(isEdit ? "§aアイテムを更新しました。" : "§aアイテムを追加しました。");
        showEquipmentSettings(player);
    });
}
