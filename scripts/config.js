export default {
    border: {
        radius: 100, // ボーダーの半径（中心からの距離）
        center: { x: 0, z: 0 }, // ボーダーの中心座標
        damageMultiplier: 0.5, // エリア外でのダメージ倍率
        warningSeconds: 10, // エリア外に出てからキルされるまでの猶予（秒）
        enabledDimensions: ["minecraft:overworld"], // 有効なディメンション
        visualDistance: 10, // 境界線が見えるようになる距離
        renderRange: 8 // パーティクルを表示する横幅の範囲
    }
};
