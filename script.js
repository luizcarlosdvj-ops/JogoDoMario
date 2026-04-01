const mario = document.querySelector('.mario');
const pipeGround = document.getElementById('pipeGround');
const pipeCeiling = document.getElementById('pipeCeiling');
const scoreElement = document.querySelector('.score');
const marioLivesElement = document.getElementById('mario-lives');
const boss = document.getElementById('boss');
const healthBar = document.getElementById('boss-health-bar');
const healthFill = document.getElementById('health-fill');
const bulletsContainer = document.getElementById('bullets-container');
const enemiesContainer = document.getElementById('enemies-container');
const gameOverScreen = document.getElementById('gameOverScreen');
const board = document.querySelector('.game-board');
const platforms = document.querySelectorAll('.platform');

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
let onPlatform = false;
let marioDirection = 1;

function applyPhysics() {
    if (!isAlive) return;

    marioVelY -= gravity;
    marioPosY += marioVelY;
    let stoodOnSomething = false;

    // 1. Colisão com o Chão (Base)
    if (marioPosY <= 0) {
        marioPosY = 0;
        marioVelY = 0;
        stoodOnSomething = true;
    }

    // 2. Colisão com Plataformas (Pisáveis) - CORRIGIDO
    const mRect = mario.getBoundingClientRect();
    
    platforms.forEach(plat => {
        const pRect = plat.getBoundingClientRect();
        const bRect = board.getBoundingClientRect();

        // Verifica se o Mario está caindo (VelY <= 0)
        // E se os pés dele estão na faixa da plataforma
        if (marioVelY <= 0 &&
            mRect.right > pRect.left + 10 && 
            mRect.left < pRect.right - 10 &&
            mRect.bottom >= pRect.top && 
            mRect.bottom <= pRect.top + 25) {
            
            // Ajusta a posição para o topo exato da plataforma
            // board.offsetHeight - (pRect.top - bRect.top) calcula a altura correta no sistema bottom
            marioPosY = bRect.bottom - pRect.top; 
            marioVelY = 0;
            stoodOnSomething = true;
        }
    });

    onPlatform = stoodOnSomething;
    mario.style.bottom = marioPosY + 'px';
    mario.style.left = marioPosX + 'px';

    requestAnimationFrame(applyPhysics);
}

// Movimento (Arena vs Corrida)
const move = (dir) => {
    if (!isAlive) return;

    marioDirection = dir;
    let moveAmount = 20;

    if (!isBossFight && !isMiniPipePhase) {
        if (dir === 1) marioPosX += moveAmount;
        if (dir === -1 && marioPosX > 100) marioPosX -= moveAmount;
    } else {
        marioPosX += dir * moveAmount;
    }

    if (marioPosX < 0) marioPosX = 0;
    if (marioPosX > board.offsetWidth - 80) marioPosX = board.offsetWidth - 80;

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

// TIRO MARIO
function marioShoot() {
    if (!isAlive || !canMarioShoot || (!isBossFight && !isMiniPipePhase)) return;

    canMarioShoot = false;
    setTimeout(() => canMarioShoot = true, 400);

    const bullet = document.createElement('div');
    bullet.classList.add('mario-bullet');
    bullet.style.bottom = (marioPosY + 40) + 'px';
    
    let bulletStartPos = marioPosX + (marioDirection === 1 ? 60 : -10);
    bullet.style.left = bulletStartPos + 'px';
    bulletsContainer.appendChild(bullet);

    const shotDir = marioDirection;

    const moveBullet = setInterval(() => {
        let bLeft = parseInt(bullet.style.left);
        bullet.style.left = (bLeft + (shotDir * 12)) + 'px';
        const bRect = bullet.getBoundingClientRect();

        document.querySelectorAll('.mini-pipe').forEach(mini => {
            const minRect = mini.getBoundingClientRect();
            if (bRect.right > minRect.left && bRect.left < minRect.right &&
                bRect.top < minRect.bottom && bRect.bottom > minRect.top) {
                mini.remove();
                bullet.remove();
                score += 500;
                clearInterval(moveBullet);
            }
        });

        if (isBossFight) {
            const bossRect = boss.getBoundingClientRect();
            if (bRect.right > bossRect.left && bRect.left < bossRect.right &&
                bRect.top < bossRect.bottom && bRect.bottom > bossRect.top) {
                bossHealth -= 5;
                healthFill.style.width = bossHealth + '%';
                bullet.remove();
                clearInterval(moveBullet);
                if (bossHealth <= 0) startMiniPipePhase();
            }
        }

        if (bLeft < -50 || bLeft > window.innerWidth + 50) {
            bullet.remove();
            clearInterval(moveBullet);
        }
    }, 10);
}

// LOOP PRINCIPAL (Corrida)
setInterval(() => {
    if (!isAlive || isBossFight || isMiniPipePhase) return;

    const mRect = mario.getBoundingClientRect();
    const gRect = pipeGround.getBoundingClientRect();
    const cRect = pipeCeiling.getBoundingClientRect();

    if (pipeGround.classList.contains('pipe-animation')) {
        if (mRect.right > gRect.left + 15 && mRect.left < gRect.right - 15 && mRect.bottom > gRect.top + 10) {
            finishGame("Bateu no cano!");
        }
    }

    if (pipeCeiling.classList.contains('pipe-animation')) {
        if (mRect.right > cRect.left + 15 && mRect.left < cRect.right - 15) {
            if (!isCrouching && mRect.top < cRect.bottom - 10) {
                finishGame("Cano no teto!");
            }
        }
    }

    score++;
    scoreElement.innerHTML = `Pontos: ${Math.floor(score / 10)}`;
    if (Math.floor(score / 10) >= 150) startBossFight();
}, 10);

// Alternar canos
setInterval(() => {
    if (!isBossFight && !isMiniPipePhase && isAlive) {
        pipeGround.classList.remove('pipe-animation');
        pipeCeiling.classList.remove('pipe-animation');
        void pipeGround.offsetWidth; 
        Math.random() > 0.5 ? pipeGround.classList.add('pipe-animation') : pipeCeiling.classList.add('pipe-animation');
    }
}, 1800);

// BOSS - ARENA
function startBossFight() {
    isBossFight = true;
    pipeGround.style.display = 'none';
    pipeCeiling.style.display = 'none';
    boss.style.display = 'block';
    healthBar.style.display = 'block';
    document.getElementById('platforms-container').style.display = 'block';
    board.classList.add('boss-fight-bg');
    alert("BOSS FIGHT!");

    const bossInterval = setInterval(() => {
        if (isBossFight && isAlive) spawnBossAttack();
        else clearInterval(bossInterval);
    }, 1200);
}

function spawnBossAttack() {
    if (!isAlive) return;
    const bullet = document.createElement('div');
    bullet.classList.add('boss-bullet');
    const alturas = [marioPosY + 60, marioPosY + 30, marioPosY];
    const alturaEscolhida = alturas[Math.floor(Math.random() * 3)];
    bullet.style.bottom = alturaEscolhida + 'px';
    bullet.style.right = '100px'; 
    bulletsContainer.appendChild(bullet);

    const moveB = setInterval(() => {
        let bRight = parseInt(bullet.style.right) || 0;
        bullet.style.right = (bRight + 10) + 'px';
        const bRect = bullet.getBoundingClientRect();
        const mRect = mario.getBoundingClientRect();
        if (bRect.left < mRect.right && bRect.right > mRect.left &&
            bRect.top < mRect.bottom && bRect.bottom > mRect.top) {
            marioLives--;
            updateLivesUI();
            bullet.remove();
            clearInterval(moveB);
            if (marioLives <= 0) finishGame("Fogo do Boss!");
        }
        if (bRight > window.innerWidth) {
            bullet.remove();
            clearInterval(moveB);
        }
    }, 10);
}

// FASE FINAL
function startMiniPipePhase() {
    isBossFight = false;
    isMiniPipePhase = true;
    boss.style.display = 'none';
    healthBar.style.display = 'none';
    board.style.background = "#1a1a1a"; 
    alert("FINAL PHASE!");

    const miniInterval = setInterval(() => {
        if (isMiniPipePhase && isAlive) spawnMiniPipe();
        else clearInterval(miniInterval);
    }, 1500);
}

function spawnMiniPipe() {
    if (!isAlive) return;
    const mini = document.createElement('img');
    mini.src = 'pipe.png';
    mini.classList.add('mini-pipe');
    let side = Math.random() > 0.5;
    mini.style.left = side ? '-50px' : (window.innerWidth + 50) + 'px';
    mini.style.bottom = '0px';
    enemiesContainer.appendChild(mini);

    const ai = setInterval(() => {
        let pLeft = parseInt(mini.style.left);
        pLeft < marioPosX ? mini.style.left = (pLeft + 4) + 'px' : mini.style.left = (pLeft - 4) + 'px';
        const pRect = mini.getBoundingClientRect();
        const mRect = mario.getBoundingClientRect();
        if (pRect.left < mRect.right && pRect.right > mRect.left && pRect.bottom > mRect.top) {
            finishGame("Cercado!");
        }
        if (!isAlive || !isMiniPipePhase) {
            mini.remove();
            clearInterval(ai);
        }
    }, 30);
}

function updateLivesUI() {
    let h = "Vidas: ";
    for (let i = 0; i < marioLives; i++) h += "❤️";
    marioLivesElement.innerHTML = h;
}

function finishGame(r) {
    isAlive = false;
    mario.src = 'game-over.png';
    document.getElementById('death-reason').innerHTML = r;
    gameOverScreen.style.display = 'block';
}

function restartGame() {
    location.reload();
}

// CONTROLES
document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowUp') jump();
    if (e.key === 'ArrowLeft') move(-1);
    if (e.key === 'ArrowRight') move(1);
    if (e.key === 'ArrowDown') crouch(true);
    if (e.key === 'z' || e.key === 'Z') marioShoot();
});

document.addEventListener('keyup', (e) => {
    if (e.key === 'ArrowDown') crouch(false);
});

applyPhysics();