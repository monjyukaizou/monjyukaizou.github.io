<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<title>宝石当てゲーム</title>
<style>
    body {
        font-family: sans-serif;
        text-align: center;
        background-color: #f0f0f0;
    }
    .game-container {
        margin-top: 50px;
    }
    .cups-container {
        display: flex;
        justify-content: center;
        align-items: flex-end;
        height: 150px; /* カップが持ち上がるスペースを確保 */
        margin-bottom: 30px;
    }
    .cup {
        position: relative;
        width: 100px;
        height: 120px;
        margin: 0 20px;
        cursor: pointer;
        transition: transform 0.5s ease-in-out; /* アニメーション */
    }
    .cup img {
        width: 100%;
        position: absolute;
        bottom: 0;
        left: 0;
        z-index: 10;
    }
    .jewel {
        width: 50px;
        height: 50px;
        position: absolute;
        bottom: 10px;
        left: 50%;
        transform: translateX(-50%);
        opacity: 0; /* 最初は見えない */
        transition: opacity 0.3s;
        z-index: 5;
    }
    .jewel.visible {
        opacity: 1; /* 見えるようにする */
    }
    /* カップが持ち上がるアニメーション */
    .cup.lifted {
        transform: translateY(-100px);
    }
    .buttons-container button {
        font-size: 16px;
        padding: 10px 20px;
        margin: 0 10px;
        cursor: pointer;
    }
</style>
</head>
<body>

<h1>宝石はどこだ？</h1>
<div class="game-container">
    <div class="cups-container">
        <div class="cup" id="cup-0">
            <img src="https://i.imgur.com/7H2Vr6q.png" alt="紙コップ">
            <img src="https://i.imgur.com/sC98fD4.png" alt="宝石" class="jewel" id="jewel-0">
        </div>
        <div class="cup" id="cup-1">
            <img src="https://i.imgur.com/7H2Vr6q.png" alt="紙コップ">
            <img src="https://i.imgur.com/sC98fD4.png" alt="宝石" class="jewel" id="jewel-1">
        </div>
        <div class="cup" id="cup-2">
            <img src="https://i.imgur.com/7H2Vr6q.png" alt="紙コップ">
            <img src="https://i.imgur.com/sC98fD4.png" alt="宝石" class="jewel" id="jewel-2">
        </div>
    </div>
    <div class="buttons-container">
        <button id="btn-0">ボタン1</button>
        <button id="btn-1">ボタン2</button>
        <button id="btn-2">ボタン3</button>
    </div>
</div>

<script>
    // HTML要素を取得
    const cups = document.querySelectorAll('.cup');
    const jewels = document.querySelectorAll('.jewel');
    const buttons = document.querySelectorAll('.buttons-container button');

    let isGameInProgress = false; // ゲームが進行中かどうかのフラグ

    // ボタンにクリックイベントを設定
    buttons.forEach(button => {
        button.addEventListener('click', startGame);
    });

    function startGame() {
        // ゲーム進行中なら何もしない
        if (isGameInProgress) return;
        
        isGameInProgress = true; // ゲームを進行中にする

        // 以前の宝石を隠す
        jewels.forEach(jewel => jewel.classList.remove('visible'));

        // 0, 1, 2の中からランダムな数字を一つ選ぶ
        const jewelLocation = Math.floor(Math.random() * 3);

        // 2秒後にカップを下ろす処理を予約
        setTimeout(() => {
            // 当たりの場所に宝石を表示
            jewels[jewelLocation].classList.add('visible');

            // 全てのカップを持ち上げる
            cups.forEach(cup => cup.classList.add('lifted'));

            // さらに2秒後にカップを下ろし、ゲームをリセット
            setTimeout(() => {
                // カップを下ろす
                cups.forEach(cup => cup.classList.remove('lifted'));
                // 宝石を隠す
                jewels.forEach(jewel => jewel.classList.remove('visible'));
                // ゲームをリセット
                isGameInProgress = false;
            }, 2000); // 2秒間表示

        }, 200); // ボタンを押してから少し間をあけて開始
    }
</script>

</body>
</html>
