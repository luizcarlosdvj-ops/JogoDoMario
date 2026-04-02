const mario = document.querySelector('.mario');
const board = document.querySelector('.game-board');
const boss = document.getElementById('boss');
const healthBar = document.getElementById('boss-health-bar');
const healthFill = document.getElementById('health-fill');
const victoryScreen = document.getElementById('victoryScreen');
const gameOverScreen = document.getElementById('gameOverScreen');

let marioPosX = 50;
let marioPosY = 0;
let marioVelY = 0;
let gravity = 0.8;
let onPlatform = true;
let isAlive = true;
let isBossFight = false;
let marioDirection = 1;
let score = 0;

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
    marioPosX += dir * 20;
    if (marioPosX < 0) marioPosX = 0;
    if (marioPosX > board.offsetWidth - 60) marioPosX = board.offsetWidth - 60;
    dir === -1 ? mario.classList.add('face-left') : mario.classList.remove('face-left');
};

const jump = () => { if (onPlatform && isAlive) { marioVelY = 18; onPlatform = false; } };
const crouch = (state) => { state ? mario.classList.add('crouch') : mario.classList.remove('crouch'); };

function restartGame() { location.reload(); }

// FUNÇÃO PARA BOTÕES MOBILE FUNCIONAREM SEM ATRASO
let moveTimer;
function bindMobileBtn(id, actionDown, actionUp = null) {
    const btn = document.getElementById(id);
    if (!btn) return;

    btn.addEventListener('touchstart', (e) => {
        e.preventDefault(); // Impede zoom e scroll
        actionDown();
        if (id === 'btn-left' || id === 'btn-right') {
            const dir = id === 'btn-left' ? -1 : 1;
            moveTimer = setInterval(() => move(dir), 50);
        }
    });

    btn.addEventListener('touchend', (e) => {
        e.preventDefault();
        clearInterval(moveTimer);
        if (actionUp) actionUp();
    });
}

// Ativando botões
bindMobileBtn('btn-left', () => move(-1));
bindMobileBtn('btn-right', () => move(1));
bindMobileBtn('btn-jump', jump);
bindMobileBtn('btn-down', () => crouch(true), () => crouch(false));
bindMobileBtn('btn-shoot', () => { /* Sua função de tiro aqui */ });

applyPhysics();
