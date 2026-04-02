const mario = document.querySelector('.mario');
const pipeGround = document.getElementById('pipeGround');
const pipeCeiling = document.getElementById('pipeCeiling');
const scoreElement = document.querySelector('.score');
const boss = document.getElementById('boss');
const healthBar = document.getElementById('boss-health-bar');
const healthFill = document.getElementById('health-fill');
const victoryScreen = document.getElementById('victoryScreen');
const gameOverScreen = document.getElementById('gameOverScreen');
const board = document.querySelector('.game-board');

let score = 0;
let isAlive = true;
let isBossFight = false;
let bossHealth = 200;
let marioPosX = 50;
let marioPosY = 0;
let marioVelY = 0;
let gravity = 0.8;
let onPlatform = true;
let marioDirection = 1;
let isCrouching = false;
let gameSpeed = 1;

// 🔥 NOVO (controle do boss)
let bossAttackInterval = null;

function applyPhysics() {
    if (!isAlive) return;

    marioVelY -= gravity;
    marioPosY += marioVelY;

    if (marioPosY <= 0) {
        marioPosY = 0;
        marioVelY = 0;
        onPlatform = true;
    } else {
        onPlatform = false;
    }

    mario.style.bottom = marioPosY + 'px';
    mario.style.left = marioPosX + 'px';

    requestAnimationFrame(applyPhysics);
}

const move = (dir) => {
    if (!isAlive) return;

    marioDirection = dir;
    marioPosX += dir * (15 * gameSpeed);

    if (marioPosX < 0) marioPosX = 0;
    if (marioPosX > board.offsetWidth - mario.offsetWidth) {
        marioPosX = board.offsetWidth - mario.offsetWidth;
    }

    dir === -1
        ? mario.classList.add('face-left')
        : mario.classList.remove('face-left');
};

const jump = () => {
    if (isAlive && onPlatform && !isCrouching) {
        marioVelY = 17;
        onPlatform = false;
    }
};

const crouch = (state) => {
    isCrouching = state;
    state ? mario.classList.add('crouch') : mario.classList.remove('crouch');
};

function startBossFight() {
    if (isBossFight) return;

    isBossFight = true;

    pipeGround.style.display = 'none';
    pipeCeiling.style.display = 'none';

    pipeGround.classList.remove('pipe-animation');
    pipeCeiling.classList.remove('pipe-animation');

    boss.style.display = 'block';
    healthBar.style.display = 'block';

    // 🔥 FIX MOBILE (interval controlado)
    if (!bossAttackInterval) {
        bossAttackInterval = setInterval(() => {
            spawnBossShot();
        }, 1200);
    }
}

function marioShoot() {
    if (!isAlive || !isBossFight) return;

    const bullet = document.createElement('div');
    bullet.classList.add('mario-bullet');

    bullet.style.bottom = (marioPosY + 30) + 'px';
    bullet.style.left = (marioPosX + 50) + 'px';

    document.getElementById('bullets-container').appendChild(bullet);

    const moveB = setInterval(() => {
        let bLeft = parseInt(bullet.style.left);
        bullet.style.left = (bLeft + (10 * gameSpeed)) + 'px';

        const bRect = bullet.getBoundingClientRect();
        const bossRect = boss.getBoundingClientRect();

        if (
            bRect.right > bossRect.left &&
            bRect.top < bossRect.bottom &&
            bRect.bottom > bossRect.top
        ) {
            bossHealth -= 3;
            healthFill.style.width = bossHealth + '%';

            bullet.remove();
            clearInterval(moveB);

            if (bossHealth <= 0) {
                isAlive = false;
                victoryScreen.style.display = 'block';
            }
        }

        if (bLeft > board.offsetWidth) {
            bullet.remove();
            clearInterval(moveB);
        }

    }, 10);
}

// 👹 ATAQUE DO BOSS
function spawnBossShot() {
    if (!isAlive || !isBossFight) return;

    const bullet = document.createElement('div');
    bullet.classList.add('boss-bullet');

    const heights = [20, 60, 100];
    const h = heights[Math.floor(Math.random() * heights.length)];

    bullet.style.bottom = h + 'px';
    bullet.style.left = (board.offsetWidth - 120) + 'px';

    document.getElementById('bullets-container').appendChild(bullet);

    const moveShot = setInterval(() => {
        let bLeft = parseFloat(bullet.style.left); // 🔥 FIX MOBILE
        bullet.style.left = (bLeft - (8 * gameSpeed)) + 'px';

        const bRect = bullet.getBoundingClientRect();
        const mRect = mario.getBoundingClientRect();

        if (
            bRect.right > mRect.left &&
            bRect.left < mRect.right &&
            bRect.top < mRect.bottom &&
            bRect.bottom > mRect.top
        ) {
            finishGame("O Boss te destruiu 💀");
            bullet.remove();
            clearInterval(moveShot);
        }

        if (bLeft < -50) {
            bullet.remove();
            clearInterval(moveShot);
        }

    }, 20);
}

// LOOP PRINCIPAL
setInterval(() => {
    if (!isAlive || isBossFight) return;

    const mRect = mario.getBoundingClientRect();
    const gRect = pipeGround.getBoundingClientRect();
    const cRect = pipeCeiling.getBoundingClientRect();

    score++;
    gameSpeed = 1 + Math.floor(score / 150) * 0.10;

    pipeGround.style.animationDuration = (2 / gameSpeed) + 's';
    pipeCeiling.style.animationDuration = (2 / gameSpeed) + 's';

    if (
        pipeGround.classList.contains('pipe-animation') &&
        mRect.right > gRect.left + 10 &&
        mRect.left < gRect.right - 10 &&
        mRect.bottom > gRect.top + 10
    ) {
        finishGame("Cano!");
    }

    if (
        pipeCeiling.classList.contains('pipe-animation') &&
        mRect.right > cRect.left + 10 &&
        mRect.left < cRect.right - 10 &&
        !isCrouching &&
        mRect.top <= cRect.bottom &&
        mRect.bottom > cRect.bottom - 50
    ) {
        finishGame("Teto!");
    }

    scoreElement.innerHTML = `Pontos: ${Math.floor(score / 10)}`;

    if (Math.floor(score / 10) >= 400) startBossFight();

}, 10);

// CANOS
setInterval(() => {
    if (!isBossFight && isAlive) {

        pipeGround.classList.remove('pipe-animation');
        pipeCeiling.classList.remove('pipe-animation');

        void pipeGround.offsetWidth;

        Math.random() > 0.5
            ? pipeGround.classList.add('pipe-animation')
            : pipeCeiling.classList.add('pipe-animation');
    }
}, 2000);

function finishGame(r) {
    isAlive = false;

    // 🔥 limpa ataque do boss
    if (bossAttackInterval) {
        clearInterval(bossAttackInterval);
    }

    gameOverScreen.style.display = 'block';
    document.getElementById('death-reason').innerText = r;
}

function restartGame() {
    location.reload();
}

// TECLADO
document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowUp') jump();
    if (e.key === 'ArrowLeft') move(-1);
    if (e.key === 'ArrowRight') move(1);
    if (e.key === 'ArrowDown') crouch(true);
    if (e.key.toLowerCase() === 'z') marioShoot();
});

document.addEventListener('keyup', (e) => {
    if (e.key === 'ArrowDown') crouch(false);
});

// MOBILE
let moveInt;

const bindMobile = (id, down, up = null) => {
    const btn = document.getElementById(id);

    btn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        down();

        if (id === 'btn-left' || id === 'btn-right') {
            moveInt = setInterval(down, 50);
        }
    });

    btn.addEventListener('touchend', (e) => {
        e.preventDefault();
        clearInterval(moveInt);
        if (up) up();
    });

    btn.addEventListener('touchcancel', () => {
        clearInterval(moveInt);
        if (up) up();
    });
};

bindMobile('btn-left', () => move(-1));
bindMobile('btn-right', () => move(1));
bindMobile('btn-jump', jump);
bindMobile('btn-shoot', marioShoot);
bindMobile('btn-down', () => crouch(true), () => crouch(false));

applyPhysics();
