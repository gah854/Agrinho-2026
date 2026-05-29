/* VARIÁVEIS DE ESTADO (O QUE MUDA NO JOGO) */
let populacaoPragas = 150;
let saudeEcossistema = 80;
let custoProducao = 0;
let score = 0;
let level = 1;
let tempoRestante = 120;
let cicloAtivo = false;
let timerInterval = null;
let isMuted = false;
let audioCtx = null;
let growthReduction = 0;

function initAudio() {
    if (audioCtx) return;
    try {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (error) {
        audioCtx = null;
    }
}

function playTone(freq = 440, type = 'sine', duration = 0.12, gain = 0.08) {
    if (isMuted) return;
    initAudio();
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gainNode.gain.value = gain;
    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    osc.start();
    setTimeout(() => osc.stop(), duration * 1000);
}

document.addEventListener('DOMContentLoaded', () => {
    const displayPragas = document.getElementById('pragas-val');
    const displaySaude = document.getElementById('saude-val');
    const displayCusto = document.getElementById('custo-val');
    const consoleLog = document.getElementById('diario-campo');
    const danoBar = document.getElementById('dano-val');
    const plantacaoEmojis = document.getElementById('plantacao-emojis');
    const btnBiologico = document.getElementById('btn-biologico');
    const btnQuimico = document.getElementById('btn-quimico');
    const btnArmadilhas = document.getElementById('btn-armadilhas');
    const btnMute = document.getElementById('btn-mute');
    const themeButtons = Array.from(document.querySelectorAll('.theme-btn'));
    const overlay = document.getElementById('overlay');
    const overlayTitle = document.getElementById('overlay-title');
    const overlayMsg = document.getElementById('overlay-msg');
    const overlayRestart = document.getElementById('overlay-restart');
    const overlayStart = document.getElementById('overlay-start');
    const hud = document.getElementById('hud');
    const hudPragas = document.getElementById('hud-pragas');
    const hudSaude = document.getElementById('hud-saude');
    const hudCusto = document.getElementById('hud-custo');
    const hudScore = document.getElementById('hud-score');
    const hudLevel = document.getElementById('hud-level');

    const hudTimer = document.createElement('div');
    hudTimer.id = 'hud-timer';
    hudTimer.style.fontWeight = '800';
    hudTimer.style.marginLeft = '8px';
    hudTimer.innerText = `Tempo: ${tempoRestante}s`;
    if (hud) hud.appendChild(hudTimer);

    function logEvento(texto) {
        const horario = new Date().toLocaleTimeString();
        if (consoleLog) {
            consoleLog.value += `[${horario}] ${texto}\n`;
            consoleLog.scrollTop = consoleLog.scrollHeight;
        }
    }

    function atualizarInterface() {
        if (displayPragas) displayPragas.innerText = populacaoPragas;
        if (displaySaude) displaySaude.innerText = saudeEcossistema + '%';
        if (displayCusto) displayCusto.innerText = 'R$ ' + custoProducao;
        if (danoBar) danoBar.value = Math.min(100, Math.floor(populacaoPragas / 5));
        if (hudPragas) hudPragas.innerText = populacaoPragas;
        if (hudSaude) hudSaude.innerText = saudeEcossistema + '%';
        if (hudCusto) hudCusto.innerText = 'R$ ' + custoProducao;
        if (hudScore) hudScore.innerText = score;
        if (hudLevel) hudLevel.innerText = level;
        if (hudTimer) hudTimer.innerText = `Tempo: ${tempoRestante}s`;

        if (plantacaoEmojis) {
            const bugs = Math.min(10, Math.floor(populacaoPragas / 30));
            const emojis = '🌿 ' + '🐛 '.repeat(bugs) + '🌿';
            plantacaoEmojis.innerText = emojis;
            plantacaoEmojis.classList.toggle('bug-anim', bugs > 0);
        }
    }

    function bloquearControles(valor) {
        [btnBiologico, btnQuimico, btnArmadilhas, btnMute].forEach(btn => {
            if (btn) btn.disabled = valor;
        });
    }

    function mostrarOverlay(titulo, mensagem) {
        cicloAtivo = false;
        if (overlayTitle) overlayTitle.innerText = titulo;
        if (overlayMsg) overlayMsg.innerText = mensagem;
        if (overlay) overlay.classList.remove('hidden');
        if (overlayRestart) overlayRestart.classList.remove('hidden');
        if (overlayStart) overlayStart.classList.add('hidden');
        bloquearControles(true);
        if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
        }
        if (titulo === 'Vitória') playTone(1200, 'sine', 0.18, 0.14);
        else playTone(160, 'sine', 0.25, 0.18);
    }

    function esconderOverlay() {
        if (overlay) overlay.classList.add('hidden');
        if (overlayRestart) overlayRestart.classList.add('hidden');
        if (overlayStart) overlayStart.classList.remove('hidden');
        bloquearControles(false);
    }

    function addScore(pts) {
        score = Math.max(0, score + pts);
        if (hudScore) hudScore.innerText = score;
        const area = document.getElementById('area-plantacao');
        if (area) {
            const pop = document.createElement('div');
            pop.className = 'score-pop';
            pop.innerText = pts >= 0 ? `+${pts}` : `${pts}`;
            pop.style.left = `${40 + Math.random() * 80}px`;
            pop.style.top = `${30 + Math.random() * 50}px`;
            area.appendChild(pop);
            setTimeout(() => pop.remove(), 700);
        }
        if (score >= level * 200) {
            level += 1;
            growthReduction = Math.min(0.85, growthReduction + 0.12);
            if (hudLevel) hudLevel.innerText = level;
            logEvento(`Nível ${level} alcançado — desafio aumentado.`);
            playTone(680, 'sawtooth', 0.18, 0.12);
        }
    }

    function verificarCondicoes() {
        if (!cicloAtivo) return;
        if (saudeEcossistema <= 0) {
            mostrarOverlay('Derrota', 'O ecossistema entrou em colapso por excesso de químicos.');
            return;
        }
        if (populacaoPragas > 500) {
            mostrarOverlay('Derrota', 'As pragas destruíram 100% da lavoura.');
            return;
        }
        if (populacaoPragas <= 20 && saudeEcossistema >= 95) {
            mostrarOverlay('Vitória', 'Parabéns! Manejo sustentável bem-sucedido.');
            return;
        }
    }

    function reiniciarJogo() {
        score = 0;
        level = 1;
        growthReduction = 0;
        tempoRestante = 120;
        populacaoPragas = 150;
        saudeEcossistema = 80;
        custoProducao = 0;
        if (consoleLog) consoleLog.value = 'Jogo reiniciado...\n';
        atualizarInterface();
        esconderOverlay();
    }

    function iniciarTemporizador() {
        if (timerInterval) clearInterval(timerInterval);
        timerInterval = setInterval(() => {
            if (!cicloAtivo) return;
            tempoRestante -= 1;
            if (hudTimer) hudTimer.innerText = `Tempo: ${tempoRestante}s`;
            if (tempoRestante <= 0) {
                cicloAtivo = false;
                if (populacaoPragas <= 30 && saudeEcossistema >= 90) {
                    mostrarOverlay('Vitória', 'Parabéns! Você atingiu os objetivos a tempo.');
                } else {
                    mostrarOverlay('Derrota', 'Tempo esgotado. Objetivos não foram alcançados.');
                }
            }
        }, 1000);
    }

    function startGame() {
        reiniciarJogo();
        cicloAtivo = true;
        if (overlay) overlay.classList.add('hidden');
        bloquearControles(false);
        iniciarTemporizador();
        logEvento('Jogo iniciado: mantenha a saúde >= 90% e pragas <= 30 em 120s.');
    }

    function aplicarAcao(custo, pragasAlteracao, saudeAlteracao, texto, pts, tone) {
        if (!cicloAtivo) return;
        populacaoPragas = Math.max(0, populacaoPragas + pragasAlteracao);
        saudeEcossistema = Math.min(100, Math.max(0, saudeEcossistema + saudeAlteracao));
        custoProducao += custo;
        logEvento(texto);
        addScore(pts);
        playTone(...tone);
        atualizarInterface();
        verificarCondicoes();
    }

    function controleBiologico() {
        aplicarAcao(120, -50, 8, 'Controle Biológico aplicado: força natural em ação.', 25, [760, 'triangle', 0.08, 0.06]);
    }

    function controleQuimico() {
        aplicarAcao(300, -120, -25, 'Controle Químico aplicado: baixa rápida de pragas com custo ambiental.', 10, [220, 'sine', 0.14, 0.1]);
    }

    function instalarArmadilhas() {
        if (!cicloAtivo) return;
        growthReduction = Math.min(0.8, growthReduction + 0.35);
        aplicarAcao(80, -30, 0, 'Armadilhas instaladas: crescimento das pragas reduzido temporariamente.', 18, [980, 'square', 0.07, 0.06]);
        setTimeout(() => {
            growthReduction = Math.max(0, growthReduction - 0.35);
            logEvento('Efeito das armadilhas diminuiu: cuidado com novas pragas.');
        }, 12000);
    }

    if (btnBiologico) btnBiologico.addEventListener('click', controleBiologico);
    if (btnQuimico) btnQuimico.addEventListener('click', controleQuimico);
    if (btnArmadilhas) btnArmadilhas.addEventListener('click', instalarArmadilhas);
    if (overlayStart) overlayStart.addEventListener('click', startGame);
    if (overlayRestart) overlayRestart.addEventListener('click', startGame);
    if (btnMute) btnMute.addEventListener('click', () => {
        isMuted = !isMuted;
        btnMute.innerText = isMuted ? '🔈' : '🔊';
        if (!isMuted) initAudio();
    });

    setInterval(() => {
        if (!cicloAtivo) return;
        const crescimento = Math.floor((populacaoPragas * 0.12 + 6) * (1 - growthReduction));
        populacaoPragas = Math.max(0, populacaoPragas + crescimento);
        if (populacaoPragas > 100) saudeEcossistema = Math.max(0, saudeEcossistema - 2);
        if (saudeEcossistema >= 90) addScore(2);
        atualizarInterface();
        verificarCondicoes();
    }, 2000);

    atualizarInterface();
});
