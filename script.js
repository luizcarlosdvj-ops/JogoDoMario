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
const victoryScreen = document.getElementById('victoryScreen');
const board = document.querySelector('.game-board');

let score = 0;
let marioLives = 3;
let isAlive = true;
let isBossFight = false;
let isMiniPipePhase = false;
let bossHealth = 100;
let canMarioShoot = true;
let isCrouching = false;

// Física
let marioPosX = 100;
let marioPosY = 0;
let marioVelY = 0;
let gravity = 0.8;
let onPlatform = true;
let marioDirection = 1;

function applyPhysics() {
    if (!isAlive) return;
    marioVelY -= gravity;
    marioPosY += marioVelY;

    // Ajustado para 25 para alinhar com o novo 'bottom: 4vh' do CSS no mobile
    const floorLimit = window.innerWidth < 900 ? 25 : 0;

    if (marioPosY <= floorLimit) {
        marioPosY = floorLimit;
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
    let moveAmount = 15;

    if (!isBossFight && !isMiniPipePhase) {
        if (dir === 1) marioPosX += moveAmount;
        if (dir === -1 && marioPosX > 50) marioPosX -= moveAmount;
    } else {
        marioPosX += dir * moveAmount;
    }

    if (marioPosX < 0) marioPosX = 0;
    if (marioPosX > board.offsetWidth - 60) marioPosX = board.offsetWidth - 60;
    dir === -1 ? mario.classList.add('face-left') : mario.classList.remove('face-left');
};

const jump = () => {
    if (isAlive && onPlatform && !isCrouching) {
        marioVelY = 18;
        onPlatform = false;
    }
};

const crouch = (state) => {
    if (!isAlive) return;
    isCrouching = state;
    state ? mario.classList.add('crouch') : mario.classList.remove('crouch');
};

function marioShoot() {
    if (!isAlive || !canMarioShoot || (!isBossFight && !isMiniPipePhase)) return;
    canMarioShoot = false;
    setTimeout(() => canMarioShoot = true, 400);

    const bullet = document.createElement('div');
    bullet.classList.add('mario-bullet');
    bullet.style.bottom = (marioPosY + 30) + 'px';
    bullet.style.left = (marioPosX + (marioDirection === 1 ? 50 : -5)) + 'px';
    bulletsContainer.appendChild(bullet);

    const shotDir = marioDirection;
    const moveBullet = setInterval(() => {
        let bLeft = parseInt(bullet.style.left);
        bullet.style.left = (bLeft + (shotDir * 12)) + 'px';
        const bRect = bullet.getBoundingClientRect();

        if (isBossFight) {
            const bossRect = boss.getBoundingClientRect();
            if (bRect.right > bossRect.left && bRect.left < bossRect.right && bRect.top < bossRect.bottom && bRect.bottom > bossRect.top) {
                bossHealth -= 5;
                healthFill.style.width = bossHealth + '%';
                bullet.remove(); clearInterval(moveBullet);
                if (bossHealth <= 0) startMiniPipePhase();
            }
        }
        if (bLeft < -50 || bLeft > window.innerWidth + 50) {
            bullet.remove(); clearInterval(moveBullet);
        }
    }, 10);
}

// Loop Principal
setInterval(() => {
    if (!isAlive || isBossFight || isMiniPipePhase) return;
    const mRect = mario.getBoundingClientRect();
    const gRect = pipeGround.getBoundingClientRect();
    const cRect = pipeCeiling.getBoundingClientRect();

    if (pipeGround.classList.contains('pipe-animation')) {
        if (mRect.right > gRect.left + 15 && mRect.left < gRect.right - 15 && mRect.bottom > gRect.top + 10) {
            finishGame("Bateu no cano de baixo!");
        }
    }

    if (pipeCeiling.classList.contains('pipe-animation')) {
        if (mRect.right > cRect.left + 15 && mRect.left < cRect.right - 15) {
            if (!isCrouching && mRect.top < cRect.bottom - 5) {
                finishGame("Cano no teto! Tinha que agachar!");
            }
        }
    }

    score++;
    scoreElement.innerHTML = `Pontos: ${Math.floor(score / 10)}`;
    if (Math.floor(score / 10) >= 400) startBossFight();
}, 10);

setInterval(() => {
    if (!isBossFight && !isMiniPipePhase && isAlive) {
        pipeGround.classList.remove('pipe-animation');
        pipeCeiling.classList.remove('pipe-animation');
        void pipeGround.offsetWidth; 
        Math.random() > 0.5 ? pipeGround.classList.add('pipe-animation') : pipeCeiling.classList.add('pipe-animation');
    }
}, 1800);

function startBossFight() {
    isBossFight = true;
    pipeGround.style.display = 'none'; pipeCeiling.style.display = 'none';
    boss.style.display = 'block'; healthBar.style.display = 'block';
    setInterval(() => { if (isBossFight && isAlive) spawnBossAttack(); }, 1200);
}

function spawnBossAttack() {
    if (!isAlive) return;
    const bullet = document.createElement('div');
    bullet.classList.add('boss-bullet');
    bullet.style.bottom = (marioPosY + 20) + 'px';
    bullet.style.right = '100px'; 
    bulletsContainer.appendChild(bullet);
    const moveB = setInterval(() => {
        let bRight = parseInt(bullet.style.right) || 0;
        bullet.style.right = (bRight + 10) + 'px';
        const bRect = bullet.getBoundingClientRect();
        const mRect = mario.getBoundingClientRect();
        if (bRect.left < mRect.right && bRect.right > mRect.left && bRect.top < mRect.bottom && bRect.bottom > mRect.top) {
            marioLives--; updateLivesUI(); bullet.remove(); clearInterval(moveB);
            if (marioLives <= 0) finishGame("O Boss te fritou!");
        }
        if (bRight > window.innerWidth) { bullet.remove(); clearInterval(moveB); }
    }, 10);
}

function startMiniPipePhase() {
    isBossFight = false;
    isAlive = false;
    boss.style.display = 'none';
    healthBar.style.display = 'none';
    victoryScreen.style.display = 'block';
    document.getElementById('final-score').innerHTML = `Pontos: ${Math.floor(score/10)}`;
}

function updateLivesUI() {
    let h = "Vidas: ";
    for (let i = 0; i < marioLives; i++) h += "❤️";
    marioLivesElement.innerHTML = h;
}

function finishGame(r) {
    isAlive = false;
    mario.style.display = 'none';
    document.getElementById('death-reason').innerHTML = r;
    gameOverScreen.style.display = 'block';
}

function restartGame() { location.reload(); }

// Controles... (mesma lógica de event listeners do código anterior)
document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowUp') jump();
    if (e.key === 'ArrowLeft') move(-1);
    if (e.key === 'ArrowRight') move(1);
    if (e.key === 'ArrowDown') crouch(true);
    if (e.key === 'z' || e.key === 'Z') marioShoot();
});
document.addEventListener('keyup', (e) => { if (e.key === 'ArrowDown') crouch(false); });

let moveInterval = null;
const setupMobileButton = (id) => {
    const btn = document.getElementById(id);
    if (!btn) return;
    btn.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        if (id === 'btn-left' || id === 'btn-right') {
            const dir = (id === 'btn-left') ? -1 : 1;
            move(dir);
            moveInterval = setInterval(() => move(dir), 50);
        } else if (id === 'btn-jump') jump();
        else if (id === 'btn-shoot') marioShoot();
        else if (id === 'btn-down') crouch(true);
    });
    const stopAction = (e) => {
        e.preventDefault();
        clearInterval(moveInterval);
        if (id === 'btn-down') crouch(false);
    };
    btn.addEventListener('pointerup', stopAction);
    btn.addEventListener('pointerleave', stopAction);
};

['btn-left', 'btn-right', 'btn-jump', 'btn-shoot', 'btn-down'].forEach(setupMobileButton);
applyPhysics();
