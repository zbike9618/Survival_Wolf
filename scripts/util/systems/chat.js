import { world } from "@minecraft/server";

const CHAT_DISTANCE = 20; // 近くの判定距離（ブロック数）

world.beforeEvents.chatSend.subscribe((event) => {
    // 1. デフォルトの全体チャットをキャンセルする（全員には見えなくなる）
    event.cancel = true;

    // 2. チャットを送った人（sender）とメッセージ（message）を取得する
    const sender = event.sender;
    const message = event.message;
    const dimension = sender.dimension; // 今いる世界（オーバーワールドなど）

    // 3. 送信者の位置の近くにいるプレイヤーを探す
    const nearbyPlayers = dimension.getPlayers({
        location: sender.location, // 送信者のいる場所
        maxDistance: CHAT_DISTANCE // この距離（ブロック数）まで届く
    });

    // 4. 見つかった近くのプレイヤー一人ひとりにメッセージを送る
    for (const player of nearbyPlayers) {
        // x, y, z の座標の差を計算して、プレイヤー間の直線距離を求める公式です
        const dx = sender.location.x - player.location.x;
        const dy = sender.location.y - player.location.y;
        const dz = sender.location.z - player.location.z;
        const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
        
        // 小数点第一位まで表示するようにします（例: 5.82m → 5.8m）
        const displayDistance = distance.toFixed(1);

        // 距離を含めて、誰が何を言ったかを表示する
        player.sendMessage(`[近距離チャット] (${displayDistance}m) <${sender.name}> ${message}`);
    }
});
