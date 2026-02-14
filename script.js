// ============================================================
//  Valentine's Day Interactive Website – Full Script
// ============================================================

// ── State ──
let currentScreen = 1;
let screen1Clicks  = 0;   // 0 → show subtitle, 1 → next screen
let typingDone     = false;
let noClickCount   = 0;
let transitioning  = false;

// ── Elements ──
const canvas   = document.getElementById('fallingCanvas');
const ctx      = canvas.getContext('2d');

// ── Music ──
const bgMusic     = document.getElementById('bgMusic');
const musicToggle = document.getElementById('music-toggle');
let musicPlaying  = false;

musicToggle.addEventListener('click', (e) => {
    e.stopPropagation();
    if (musicPlaying) {
        bgMusic.pause();
        musicToggle.classList.add('muted');
        musicToggle.textContent = '🔇';
    } else {
        bgMusic.volume = 0.3;
        bgMusic.play().catch(() => {});
        musicToggle.classList.remove('muted');
        musicToggle.textContent = '🎵';
    }
    musicPlaying = !musicPlaying;
});

// ============================================================
//  FALLING HEARTS & ROSES CANVAS
// ============================================================
const fallingItems = [];
const heartSymbols = ['❤️','💕','💖','💗','💝','🌹','🥀','💐','🌷','💘','♥'];

function resizeCanvas() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

function spawnItem() {
    fallingItems.push({
        x        : Math.random() * canvas.width,
        y        : -30,
        speed    : 0.4 + Math.random() * 1.2,
        size     : 14 + Math.random() * 22,
        symbol   : heartSymbols[Math.floor(Math.random() * heartSymbols.length)],
        wobble   : Math.random() * Math.PI * 2,
        wobbleSpd: 0.008 + Math.random() * 0.018,
        wobbleAmp: 0.2 + Math.random() * 0.6,
        opacity  : 0,
        targetOp : 0.35 + Math.random() * 0.5,
        fadeIn   : 0.008 + Math.random() * 0.008,
        rotation : Math.random() * Math.PI * 2,
        rotSpd   : (Math.random() - 0.5) * 0.012,
    });
}

let lastFrameTime = 0;

function animateFalling(timestamp) {
    if (!lastFrameTime) lastFrameTime = timestamp;
    const delta = Math.min((timestamp - lastFrameTime) / 16.667, 3);
    lastFrameTime = timestamp;

    // Soft trail effect: semi-transparent clear for smoother motion
    ctx.fillStyle = 'rgba(26, 10, 10, 0.15)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // Full clear underneath to prevent permanent build-up every N frames
    if (Math.random() < 0.02) ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (Math.random() < 0.14) spawnItem();

    for (let i = fallingItems.length - 1; i >= 0; i--) {
        const p = fallingItems[i];

        // Smooth fade-in
        if (p.opacity < p.targetOp) {
            p.opacity = Math.min(p.opacity + p.fadeIn * delta, p.targetOp);
        }

        // Fade out near bottom
        const bottomZone = canvas.height * 0.85;
        if (p.y > bottomZone) {
            p.opacity *= 1 - (0.02 * delta);
        }

        p.y        += p.speed * delta;
        p.wobble   += p.wobbleSpd * delta;
        p.x        += Math.sin(p.wobble) * p.wobbleAmp * delta;
        p.rotation += p.rotSpd * delta;

        ctx.save();
        ctx.globalAlpha = p.opacity;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.font = `${p.size}px serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(p.symbol, 0, 0);
        ctx.restore();

        if (p.y > canvas.height + 40 || p.opacity < 0.01) fallingItems.splice(i, 1);
    }
    requestAnimationFrame(animateFalling);
}
animateFalling();

// ============================================================
//  SCREEN TRANSITIONS
// ============================================================
function doTransition(fromId, toId, callback) {
    if (transitioning) return;
    transitioning = true;

    const overlay = document.getElementById('transition');
    overlay.classList.add('active');
    overlay.style.display = 'flex';

    const fromEl = document.getElementById(fromId);

    setTimeout(() => {
        fromEl.classList.remove('active');
        fromEl.style.display = 'none';
        fromEl.style.opacity = '0';
    }, 550);

    setTimeout(() => {
        const toEl = document.getElementById(toId);
        toEl.style.display = 'flex';
        // force reflow
        void toEl.offsetWidth;
        toEl.classList.add('active');
        toEl.style.opacity = '1';

        overlay.classList.remove('active');
        setTimeout(() => {
            overlay.style.display = 'none';
            transitioning = false;
            if (callback) callback();
        }, 150);
    }, 1200);
}

// ============================================================
//  TYPING ANIMATION
// ============================================================
function typeText(container, text, speed, onDone) {
    container.innerHTML = '';
    let i = 0;
    const cursor = document.createElement('span');
    cursor.className = 'typing-cursor';
    let lastTime = 0;
    let currentDelay = speed;

    function type(timestamp) {
        if (!lastTime) lastTime = timestamp;
        const elapsed = timestamp - lastTime;

        if (elapsed < currentDelay) {
            requestAnimationFrame(type);
            return;
        }

        // Type one character per frame for smooth appearance
        if (text[i] === '\n') {
            container.appendChild(document.createElement('br'));
        } else {
            container.appendChild(document.createTextNode(text[i]));
        }
        i++;

        // Keep cursor at end
        if (cursor.parentNode) cursor.parentNode.removeChild(cursor);
        container.appendChild(cursor);

        // Smooth auto-scroll
        const scrollEl = container.parentElement;
        scrollEl.scrollTo({ top: scrollEl.scrollHeight, behavior: 'smooth' });

        lastTime = timestamp;

        if (i < text.length) {
            // Variable speed for punctuation – gentle pauses
            currentDelay = speed;
            const lastChar = text[i - 1];
            if (lastChar === '.' || lastChar === '—' || lastChar === '…') currentDelay = speed * 2;
            else if (lastChar === ',') currentDelay = speed * 1.4;
            else if (lastChar === '\n') currentDelay = speed * 1.5;

            requestAnimationFrame(type);
        } else {
            // Remove cursor after a pause
            setTimeout(() => {
                if (cursor.parentNode) cursor.parentNode.removeChild(cursor);
                if (onDone) onDone();
            }, 800);
        }
    }
    requestAnimationFrame(type);
}

// ============================================================
//  POEMS & TEXTS
// ============================================================
const poemText = `To My Wife, My Forever Valentine

Before the world wakes up,
before the sun paints gold on the sky,
there's a quiet moment
where I remember
you are mine —
and I am the luckiest man alive.

You are the soft in my storms,
the calm in my chaos,
the steady hand I reach for
without even looking —
because I know you'll always be there.

In your laughter, I found home.
In your eyes, I found my future.
In your heart, I found
a love that feels
both like fire
and like peace.

Every ordinary day with you
is a hidden holiday.
Every simple touch
is a promise renewed.
And every "I love you"
still feels like the first.

If I had one wish this Valentine's,
it wouldn't be roses or candlelight —
it would be time.
More mornings beside you.
More dreams built together.
More years to grow old
holding your hand.

You are not just my Valentine.
You are my always.
My forever.
My greatest blessing.

And I would choose you —
in this life
and every life after. ❤️`;

const letterText = `My love,

I won't lie — long distance is hard. There are days I wish I could just show up at your door, hug you without warning, and steal a few extra seconds before letting go. I miss the small things the most. Sitting next to you. Seeing your expressions without a screen. The kind of silence that feels full instead of far.

But even with all the miles between us, you've never felt distant to me.

You're the first person I want to tell things to. The one I look for when something good happens. The one I think about before I fall asleep. Somehow, through calls, texts, and late-night conversations, you've become my comfort — even from afar.

What we have isn't easy, but it's real. We choose each other every day, even when it would be simpler not to. That means something. You mean something. More than I probably say out loud.

I think about the future a lot. About the day we won't have to count down visits or say goodbye at airports. About normal days together — grocery runs, lazy evenings, random arguments about nothing. I want all of it with you.

And until that day comes, I just want you to know this — distance hasn't changed how I feel. If anything, it's made it clearer.

So there's something I've been meaning to ask you…

Even with the miles between us,
even through screens and time zones,
even while we wait for "someday"…`;

const finalText = `You have no idea how big my smile is right now.

Even with all the miles between us, you just made this the sweetest Valentine's ever. Thank you for choosing me — again. I promise, one day we'll look back at this distance and smile, because it only made us stronger.

Until I can hold you for real… just know my heart's already with you. ❤️`;

// ============================================================
//  GLOBAL CLICK HANDLER
// ============================================================
document.addEventListener('click', (e) => {
    // Ignore clicks on buttons or music toggle
    if (e.target.closest('.btn') || e.target.closest('#music-toggle')) return;
    if (transitioning) return;

    // Try to start music on first interaction
    if (!musicPlaying) {
        bgMusic.volume = 0.3;
        bgMusic.play().then(() => {
            musicPlaying = true;
            musicToggle.textContent = '🎵';
            musicToggle.classList.remove('muted');
        }).catch(() => {});
    }

    switch (currentScreen) {
        case 1: handleScreen1Click(); break;
        case 2: handleScreen2Click(); break;
        case 3: handleScreen3Click(); break;
        case 5: handleScreen5Click(); break;
    }
});

// ── Screen 1 ──
function handleScreen1Click() {
    if (screen1Clicks === 0) {
        const sub = document.getElementById('subtitle1');
        sub.classList.remove('hidden');
        sub.classList.add('show');
        screen1Clicks++;
        // Show hint after subtitle appears
        setTimeout(() => {
            const hint = document.getElementById('clickHint1');
            hint.classList.remove('hidden');
            hint.classList.add('show');
        }, 1500);
    } else {
        currentScreen = 2;
        doTransition('screen1', 'screen2', () => {
            typingDone = false;
            typeText(
                document.getElementById('poemText'),
                poemText,
                15,
                () => {
                    typingDone = true;
                    const hint = document.getElementById('clickHint2');
                    hint.classList.remove('hidden');
                    hint.classList.add('show');
                }
            );
        });
    }
}

// ── Screen 2 ──
function handleScreen2Click() {
    if (!typingDone) return;
    currentScreen = 3;
    doTransition('screen2', 'screen3', () => {
        typingDone = false;
        typeText(
            document.getElementById('letterText'),
            letterText,
            12,
            () => {
                typingDone = true;
                const hint = document.getElementById('clickHint3');
                hint.classList.remove('hidden');
                hint.classList.add('show');
            }
        );
    });
}

// ── Screen 3 ──
function handleScreen3Click() {
    if (!typingDone) return;
    currentScreen = 4;
    doTransition('screen3', 'screen4', () => {});
}

// ── Screen 5 ──
function handleScreen5Click() {
    if (!typingDone) return;
    currentScreen = 6;

    // Show curtain screen
    const curtainScreen = document.getElementById('screen6');
    const screen5El     = document.getElementById('screen5');

    curtainScreen.style.display = 'flex';
    curtainScreen.classList.add('active');

    // Small delay then begin closing — lets the screen render first
    setTimeout(() => {
        curtainScreen.classList.add('closing');
    }, 200);

    // Fade out screen 5 as curtains sweep over it
    screen5El.style.transition = 'opacity 1.5s ease';
    screen5El.style.opacity = '0';
    setTimeout(() => {
        screen5El.classList.remove('active');
        screen5El.style.display = 'none';
    }, 1500);

    // After curtains fully close and message lingers, attempt to close
    setTimeout(() => {
        window.open('', '_self');
        window.close();
    }, 8000);
}

// ============================================================
//  SCREEN 4: YES / NO BUTTONS
// ============================================================
function handleNo() {
    noClickCount++;
    const yesBtn = document.getElementById('yesBtn');
    const noBtn  = document.getElementById('noBtn');

    // Grow the yes button
    const scale     = 1 + noClickCount * 0.35;
    const padding   = 18 + noClickCount * 8;
    const fontSize  = 1.3 + noClickCount * 0.25;

    yesBtn.style.transform = `scale(${scale})`;
    yesBtn.style.padding   = `${padding}px ${padding * 2.5}px`;
    yesBtn.style.fontSize  = `${fontSize}rem`;
    yesBtn.style.zIndex    = 20 + noClickCount;

    // Shrink no button slightly and make it run away
    noBtn.style.transform = `scale(${Math.max(0.4, 1 - noClickCount * 0.08)})`;
    noBtn.style.opacity   = `${Math.max(0.3, 1 - noClickCount * 0.1)}`;

    // Random reposition the No button
    const container = document.getElementById('buttonContainer');
    const rect = container.getBoundingClientRect();
    const randX = (Math.random() - 0.5) * 200;
    const randY = (Math.random() - 0.5) * 100;
    noBtn.style.position = 'relative';
    noBtn.style.left = `${randX}px`;
    noBtn.style.top  = `${randY}px`;

    // After many clicks, hide no entirely
    if (noClickCount >= 8) {
        noBtn.style.display = 'none';
    }

    // Add shake animation
    yesBtn.style.animation = 'none';
    void yesBtn.offsetWidth;
    yesBtn.style.animation = 'buttonPulse 0.5s ease';
}

function handleYes() {
    // Heart burst effect
    createHeartBurst();

    currentScreen = 5;
    setTimeout(() => {
        doTransition('screen4', 'screen5', () => {
            typingDone = false;
            typeText(
                document.getElementById('finalText'),
                finalText,
                15,
                () => {
                    typingDone = true;
                    const hint = document.getElementById('clickHint5');
                    hint.classList.remove('hidden');
                    hint.classList.add('show');
                }
            );
        });
    }, 800);
}

// ============================================================
//  HEART BURST EFFECT
// ============================================================
function createHeartBurst() {
    const symbols = ['❤️','💖','💕','💗','💝','🌹','✨','💘'];
    for (let i = 0; i < 30; i++) {
        const el = document.createElement('div');
        el.className = 'heart-burst';
        el.textContent = symbols[Math.floor(Math.random() * symbols.length)];
        el.style.left = `${window.innerWidth / 2}px`;
        el.style.top  = `${window.innerHeight / 2}px`;
        el.style.fontSize = `${1 + Math.random() * 2}rem`;

        const angle = (Math.PI * 2 * i) / 30;
        const dist  = 100 + Math.random() * 300;
        el.style.setProperty('--tx', `${Math.cos(angle) * dist}px`);
        el.style.setProperty('--ty', `${Math.sin(angle) * dist}px`);

        document.body.appendChild(el);
        setTimeout(() => el.remove(), 1500);
    }
}

// ============================================================
//  EXTRA: Button pulse keyframe (injected)
// ============================================================
const styleSheet = document.createElement('style');
styleSheet.textContent = `
@keyframes buttonPulse {
    0%   { box-shadow: 0 0 0 0 rgba(0, 200, 83, 0.7); }
    50%  { box-shadow: 0 0 30px 15px rgba(0, 200, 83, 0.3); }
    100% { box-shadow: 0 6px 25px rgba(0, 200, 83, 0.4); }
}
`;
document.head.appendChild(styleSheet);
