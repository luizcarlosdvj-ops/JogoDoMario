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
let bossHealth = 100;
let marioPosX = 50;
let marioPosY = 0;
let marioVelY = 0;
let gravity = 0.8;
let onPlatform = true;
let marioDirection = 1;
let isCrouching = false;

function applyPhysics() {
    if (!isAlive) return;
    marioVelY -= gravity;
    marioPosY += marioVelY;
    if (marioPosY <= 0) { marioPosY = 0; marioVelY = 0; onPlatform = true; } 
    else { onPlatform = false; }
    mario.style.bottom = marioPosY + 'px';
    mario.style.left = marioPosX + 'px';
    requestAnimationFrame(applyPhysics);
}

const move = (dir) => {
    if (!isAlive) return;
    marioDirection = dir;
    marioPosX += dir * 15;
    if (marioPosX < 0) marioPosX = 0;
    if (marioPosX > board.offsetWidth - 60) marioPosX = board.offsetWidth - 60;
    dir === -1 ? mario.classList.add('face-left') : mario.classList.remove('face-left');
};

const jump = () => { if (isAlive && onPlatform && !isCrouching) { marioVelY = 17; onPlatform = false; } };
const crouch = (state) => { isCrouching = state; state ? mario.classList.add('crouch') : mario.classList.remove('crouch'); };

function startBossFight() {
    if (isBossFight) return;
    isBossFight = true;
    pipeGround.style.display = 'none'; 
    pipeCeiling.style.display = 'none';
    pipeGround.classList.remove('pipe-animation');
    pipeCeiling.classList.remove('pipe-animation');
    boss.style.display = 'block'; 
    healthBar.style.display = 'block';
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
        bullet.style.left = (bLeft + 10) + 'px';
        const bRect = bullet.getBoundingClientRect();
        const bossRect = boss.getBoundingClientRect();

        if (bRect.right > bossRect.left && bRect.top < bossRect.bottom && bRect.bottom > bossRect.top) {
            bossHealth -= 5;
            healthFill.style.width = bossHealth + '%';
            bullet.remove(); clearInterval(moveB);
            if (bossHealth <= 0) { isAlive = false; victoryScreen.style.display = 'block'; }
        }
        if (bLeft > window.innerWidth) { bullet.remove(); clearInterval(moveB); }
    }, 10);
}

// Loop de Colisão e Pontuação
setInterval(() => {
    if (!isAlive || isBossFight) return;
    const mRect = mario.getBoundingClientRect();
    const gRect = pipeGround.getBoundingClientRect();
    const cRect = pipeCeiling.getBoundingClientRect();

    if (pipeGround.classList.contains('pipe-animation') && mRect.right > gRect.left + 10 && mRect.left < gRect.right - 10 && mRect.bottom > gRect.top + 10) finishGame("Cano!");
    if (pipeCeiling.classList.contains('pipe-animation') && mRect.right > cRect.left + 10 && mRect.left < cRect.right - 10 && !isCrouching && mRect.top < cRect.bottom) finishGame("Teto!");

    score++;
    scoreElement.innerHTML = `Pontos: ${Math.floor(score / 10)}`;
    if (Math.floor(score / 10) >= 400) startBossFight();
}, 10);

// Ciclo dos Canos
setInterval(() => {
    if (!isBossFight && isAlive) {
        pipeGround.classList.remove('pipe-animation');
        pipeCeiling.classList.remove('pipe-animation');
        void pipeGround.offsetWidth; 
        Math.random() > 0.5 ? pipeGround.classList.add('pipe-animation') : pipeCeiling.classList.add('pipe-animation');
    }
}, 2000);

function finishGame(r) { isAlive = false; gameOverScreen.style.display = 'block'; document.getElementById('death-reason').innerText = r; }
function restartGame() { location.reload(); }

// Controles Teclado (PC permanece igual)
document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowUp') jump();
    if (e.key === 'ArrowLeft') move(-1);
    if (e.key === 'ArrowRight') move(1);
    if (e.key === 'ArrowDown') crouch(true);
    if (e.key.toLowerCase() === 'z') marioShoot();
});
document.addEventListener('keyup', (e) => { if (e.key === 'ArrowDown') crouch(false); });

// Controles Mobile (Corrigidos para touchstart)
let moveInt;
const bindMobile = (id, down, up = null) => {
    const btn = document.getElementById(id);
    btn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        down();
        if (id === 'btn-left' || id === 'btn-right') moveInt = setInterval(down, 50);
    });
    btn.addEventListener('touchend', (e) => {
        e.preventDefault();
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
