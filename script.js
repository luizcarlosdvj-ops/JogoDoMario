const mario = document.querySelector('.mario');
const pipeGround = document.getElementById('pipeGround');
const pipeCeiling = document.getElementById('pipeCeiling');
const scoreElement = document.querySelector('.score');
const marioLivesElement = document.getElementById('mario-lives');
const boss = document.getElementById('boss');
const healthBar = document.getElementById('boss-health-bar');
const healthFill = document.getElementById('health-fill');
const bulletsContainer = document.getElementById('bullets-container');
const gameOverScreen = document.getElementById('gameOverScreen');
const board = document.querySelector('.game-board');

let score = 0;
let marioLives = 3;
let isAlive = true;
let isBossFight = false;
let bossHealth = 100;
let canMarioShoot = true;
let isCrouching = false;

// Física ajustada para a altura da Board
let marioPosX = 50;
let marioPosY = 0;
let marioVelY = 0;
let gravity = 1.2; 
let onPlatform = true;
let marioDirection = 1;

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
    marioPosX += dir * 12;
    if (marioPosX < 0) marioPosX = 0;
    if (marioPosX > board.offsetWidth - mario.offsetWidth) marioPosX = board.offsetWidth - mario.offsetWidth;
    dir === -1 ? mario.classList.add('face-left') : mario.classList.remove('face-left');
};

const jump = () => {
    if (isAlive && onPlatform && !isCrouching) {
        marioVelY = 22;
        onPlatform = false;
    }
};

const crouch = (state) => {
    if (!isAlive) return;
    isCrouching = state;
    state ? mario.classList.add('crouch') : mario.classList.remove('crouch');
};

function marioShoot() {
    if (!isAlive || !canMarioShoot) return;
    canMarioShoot = false;
    setTimeout(() => canMarioShoot = true, 400);

    const bullet = document.createElement('div');
    bullet.classList.add('mario-bullet');
    bullet.style.bottom = (marioPosY + (mario.offsetHeight / 2)) + 'px';
    bullet.style.left = (marioPosX + (marioDirection === 1 ? mario.offsetWidth : -10)) + 'px';
    bulletsContainer.appendChild(bullet);

    const shotDir = marioDirection;
    const moveBullet = setInterval(() => {
        let bLeft = parseInt(bullet.style.left);
        bullet.style.left = (bLeft + (shotDir * 15)) + 'px';
        const bRect = bullet.getBoundingClientRect();

        if (isBossFight) {
            const bossRect = boss.getBoundingClientRect();
            if (bRect.right > bossRect.left && bRect.left < bossRect.right && bRect.top < bossRect.bottom && bRect.bottom > bossRect.top) {
                bossHealth -= 5;
                healthFill.style.width = bossHealth + '%';
                bullet.remove(); clearInterval(moveBullet);
                if (bossHealth <= 0) endBossFight();
            }
        }
        if (bLeft < -50 || bLeft > window.innerWidth + 50) {
            bullet.remove(); clearInterval(moveBullet);
        }
    }, 10);
}

// Colisão e Pontos
setInterval(() => {
    if (!isAlive || isBossFight) return;
    const mRect = mario.getBoundingClientRect();
    const gRect = pipeGround.getBoundingClientRect();
    const cRect = pipeCeiling.getBoundingClientRect();

    if (pipeGround.classList.contains('pipe-animation')) {
        if (mRect.right > gRect.left + 10 && mRect.left < gRect.right - 10 && mRect.bottom > gRect.top + 5) {
            finishGame("Bateu no cano!");
        }
    }
    if (pipeCeiling.classList.contains('pipe-animation')) {
        if (mRect.right > cRect.left + 10 && mRect.left < cRect.right - 10) {
            if (!isCrouching && mRect.top < cRect.bottom - 5) {
                finishGame("Agache!");
            }
        }
    }
    score++;
    scoreElement.innerHTML = `Pontos: ${Math.floor(score / 10)}`;
    if (Math.floor(score / 10) === 400 && !isBossFight) startBossFight();
}, 10);

// Ciclo de canos
setInterval(() => {
    if (!isBossFight && isAlive) {
        pipeGround.classList.remove('pipe-animation');
        pipeCeiling.classList.remove('pipe-animation');
        void pipeGround.offsetWidth; 
        Math.random() > 0.5 ? pipeGround.classList.add('pipe-animation') : pipeCeiling.classList.add('pipe-animation');
    }
}, 2400);

function startBossFight() {
    isBossFight = true;
    pipeGround.style.display = 'none'; pipeCeiling.style.display = 'none';
    boss.style.display = 'block'; healthBar.style.display = 'block';
    const bInt = setInterval(() => { if (isBossFight && isAlive) spawnBossAttack(); else clearInterval(bInt); }, 1500);
}

function endBossFight() {
    isBossFight = false;
    boss.style.display = 'none'; healthBar.style.display = 'none';
    pipeGround.style.display = 'block'; pipeCeiling.style.display = 'block';
}

function spawnBossAttack() {
    const bullet = document.createElement('div');
    bullet.classList.add('boss-bullet');
    bullet.style.bottom = (marioPosY + 20) + 'px';
    bullet.style.right = '50px'; 
    bulletsContainer.appendChild(bullet);
    const moveB = setInterval(() => {
        let bRight = parseInt(bullet.style.right) || 0;
        bullet.style.right = (bRight + 10) + 'px';
        const bRect = bullet.getBoundingClientRect();
        const mRect = mario.getBoundingClientRect();
        if (bRect.left < mRect.right && bRect.right > mRect.left && bRect.top < mRect.bottom && bRect.bottom > mRect.top) {
            marioLives--; updateLivesUI(); bullet.remove(); clearInterval(moveB);
            if (marioLives <= 0) finishGame("Game Over!");
        }
        if (bRight > window.innerWidth) { bullet.remove(); clearInterval(moveB); }
    }, 10);
}

function updateLivesUI() {
    let h = "Vidas: ";
    for (let i = 0; i < marioLives; i++) h += "❤️";
    marioLivesElement.innerHTML = h;
}

function finishGame(r) { isAlive = false; document.getElementById('death-reason').innerHTML = r; gameOverScreen.style.display = 'block'; }
function restartGame() { location.reload(); }

// Controles
document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowUp') jump();
    if (e.key === 'ArrowLeft') move(-1);
    if (e.key === 'ArrowRight') move(1);
    if (e.key === 'ArrowDown') crouch(true);
    if (e.key === 'z' || e.key === 'Z') marioShoot();
});
document.addEventListener('keyup', (e) => { if (e.key === 'ArrowDown') crouch(false); });

let moveInt = null;
const setupBtn = (id) => {
    const btn = document.getElementById(id);
    btn.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        if (id === 'btn-left' || id === 'btn-right') {
            const d = id === 'btn-left' ? -1 : 1;
            move(d); moveInt = setInterval(() => move(d), 50);
        } else if (id === 'btn-jump') jump();
        else if (id === 'btn-shoot') marioShoot();
        else if (id === 'btn-down') crouch(true);
    });
    const stop = () => { clearInterval(moveInt); if (id === 'btn-down') crouch(false); };
    btn.addEventListener('pointerup', stop); btn.addEventListener('pointerleave', stop);
};
['btn-left', 'btn-right', 'btn-jump', 'btn-shoot', 'btn-down'].forEach(setupBtn);

applyPhysics();
