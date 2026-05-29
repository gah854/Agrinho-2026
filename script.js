/* VARIÁVEIS DE ESTADO (O QUE MUDA NO JOGO) */
let populacaoPragas = 150;
let saudeEcossistema = 80;
let custoProducao = 0;
let cicloAtivo = false; // começa pausado até iniciar o jogo
let tempoRestante = 120; // segundos
let timerInterval = null;
let score = 0;
let level = 1;
let difficultyMultiplier = 1.0;
let isMuted = false;
let audioCtx = null;

document.addEventListener('DOMContentLoaded', () => {
    /* ELEMENTOS DA INTERFACE (LIGAÇÃO COM O HTML) */
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

    function applyTheme(themeName) {
        document.body.classList.remove('theme-a','theme-b','theme-c');
        if(themeName) document.body.classList.add(themeName);
        localStorage.setItem('agrinho-theme', themeName);
        // update active state on buttons
        themeButtons.forEach(b => {
            if(b.dataset.theme === themeName) b.classList.add('active'); else b.classList.remove('active');
        });
    }

    // restore theme
    const savedTheme = localStorage.getItem('agrinho-theme') || 'theme-a';
    applyTheme(savedTheme);

    // wire buttons
    themeButtons.forEach(btn => btn.addEventListener('click', () => applyTheme(btn.dataset.theme)));

    function atualizarInterface() {
        if(displayPragas) displayPragas.innerText = populacaoPragas;
        if(displaySaude) displaySaude.innerText = saudeEcossistema + "%";
        if(displayCusto) displayCusto.innerText = "R$ " + custoProducao;
        if(danoBar) danoBar.value = Math.min(100, Math.floor((populacaoPragas / 5)));

        // Atualiza visual simples da plantação (mais insetos quando há mais pragas)
        if(plantacaoEmojis) {
            const bugs = Math.min(10, Math.floor(populacaoPragas / 30));
            const emojis = '🌿 ' + '🐛 '.repeat(bugs) + '🌿';
            plantacaoEmojis.innerText = emojis;
        }
    }

    function registrarEvento(texto) {
        const data = new Date().toLocaleTimeString();
        if(consoleLog) {
            consoleLog.value += `[${data}] ${texto}\n`;
            consoleLog.scrollTop = consoleLog.scrollHeight;
        }
    }

    /* Áudio simples com WebAudio */
    function initAudio() {
        if(audioCtx) return;
        try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch(e) { audioCtx = null; }
    }

    function playTone(freq=440, type='sine', duration=0.12, gain=0.08) {
        if(isMuted) return;
        initAudio();
        if(!audioCtx) return;
        const o = audioCtx.createOscillator();
        const g = audioCtx.createGain();
        o.type = type; o.frequency.value = freq;
        g.gain.value = gain;
        o.connect(g); g.connect(audioCtx.destination);
        o.start();
        setTimeout(() => { o.stop(); }, duration * 1000);
    }

    function addScore(pts, x=0, y=0) {
        score += pts;
        if(score < 0) score = 0;
        const hudScore = document.getElementById('hud-score');
        if(hudScore) hudScore.innerText = score;
        // pop visual
        const area = document.getElementById('area-plantacao');
        if(area) {
            const el = document.createElement('div');
            el.className = 'score-pop';
            el.innerText = (pts>0? `+${pts}`: `${pts}`);
            el.style.left = (50 + Math.random()*60) + 'px';
            el.style.top = (40 + Math.random()*40) + 'px';
            area.appendChild(el);
            setTimeout(() => el.remove(), 700);
        }
        // level up by score threshold
        if(score >= level * 200) levelUp();
    }

    function levelUp() {
        level += 1;
        difficultyMultiplier += 0.18;
        const hudLevel = document.getElementById('hud-level');
        if(hudLevel) hudLevel.innerText = level;
        registrarEvento(`Nível ${level} alcançado — desafio aumentado.`);
        playTone(650, 'sawtooth', 0.18, 0.12);
    }

    function verificarCondicoes() {
        if (saudeEcossistema <= 0) {
            showOverlay('Derrota', 'O ecossistema entrou em colapso por excesso de químicos.');
        } else if (populacaoPragas > 500) {
            showOverlay('Derrota', 'As pragas destruíram 100% da lavoura.');
        } else if (populacaoPragas <= 20 && saudeEcossistema >= 95) {
            showOverlay('Vitória', 'Parabéns! Manejo sustentável bem-sucedido.');
        }
    }

    function resetarSimulador() {
        populacaoPragas = 150;
        saudeEcossistema = 80;
        custoProducao = 0;
        if(consoleLog) consoleLog.value = "Jogo reiniciado...\n";
        atualizarInterface();
        hideOverlay();
    }

    /* LOOP PRINCIPAL - Roda a cada 2 segundos */
    const simuladorLoop = setInterval(() => {
        if (cicloAtivo) {
            // Crescimento natural das pragas, afetado pelo nível de dificuldade
            const crescimento = Math.floor(populacaoPragas * 0.12 * difficultyMultiplier) + Math.floor(5 * difficultyMultiplier);
            populacaoPragas += crescimento;

            // Se houver muita praga, a saúde do ecossistema cai sozinha
            if (populacaoPragas > 100) {
                saudeEcossistema -= 2;
            }

            // recompensa por boa manutenção: pontos pequenos
            if (saudeEcossistema >= 90) addScore(2);

            atualizarInterface();
            verificarCondicoes();
        }
    }, 2000);

    /* FUNÇÕES DE AÇÃO (BOTÕES) */
    function controleBiologico() {
        populacaoPragas = Math.max(0, populacaoPragas - 50);
        saudeEcossistema = Math.min(100, saudeEcossistema + 8);
        custoProducao += 120;
        registrarEvento("Controle Biológico aplicado: Inimigos naturais liberados.");
        addScore(25);
        playTone(760, 'triangle', 0.08, 0.06);
        atualizarInterface();
    }

    function controleQuimico() {
        populacaoPragas = Math.max(0, populacaoPragas - 140);
        saudeEcossistema -= 25;
        custoProducao += 300;
        registrarEvento("Intervenção Química: Pragas eliminadas, impacto ambiental alto.");
        addScore(10);
        playTone(220, 'sine', 0.14, 0.1);
        atualizarInterface();
    }

    function instalarArmadilhas() {
        // Reduz taxa de crescimento temporariamente
        populacaoPragas = Math.max(0, populacaoPragas - 30);
        custoProducao += 80;
        registrarEvento("Armadilhas instaladas: Monitoramento melhorado.");
        addScore(18);
        playTone(980, 'square', 0.07, 0.06);
        atualizarInterface();
    }

    /* LIGAÇÃO DOS BOTÕES */
    if(btnBiologico) btnBiologico.addEventListener('click', controleBiologico);
    if(btnQuimico) btnQuimico.addEventListener('click', controleQuimico);
    if(btnArmadilhas) btnArmadilhas.addEventListener('click', instalarArmadilhas);
    /* Overlay controls & HUD updates */
    const overlay = document.getElementById('overlay');
    const overlayTitle = document.getElementById('overlay-title');
    const overlayMsg = document.getElementById('overlay-msg');
    const overlayRestart = document.getElementById('overlay-restart');
    const overlayStart = document.getElementById('overlay-start');
    const hudTimer = document.createElement('div');
    hudTimer.id = 'hud-timer';
    hudTimer.style.fontWeight = '800';
    hudTimer.style.marginLeft = '8px';
    // adiciona temporizador ao HUD
    const hud = document.getElementById('hud');
    if(hud) hud.appendChild(hudTimer);
    const hudPragas = document.getElementById('hud-pragas');
    const hudSaude = document.getElementById('hud-saude');
    const hudCusto = document.getElementById('hud-custo');
    const hudScore = document.getElementById('hud-score');
    const hudLevel = document.getElementById('hud-level');

    function showOverlay(title, msg) {
        cicloAtivo = false;
        if(overlayTitle) overlayTitle.innerText = title;
        if(overlayMsg) overlayMsg.innerText = msg;
        if(overlay) overlay.classList.remove('hidden');
        // disable buttons
        [btnBiologico, btnQuimico, btnArmadilhas].forEach(b => { if(b) b.disabled = true; });
        if(btnMute) btnMute.disabled = true;
        // mostrar botão de reiniciar
        if(overlayRestart) overlayRestart.classList.remove('hidden');
        if(overlayStart) overlayStart.classList.add('hidden');
        // parar temporizador
        if(timerInterval) { clearInterval(timerInterval); timerInterval = null; }
        // som de fim
        if(title === 'Vitória') playTone(1200, 'sine', 0.18, 0.14);
        else playTone(160, 'sine', 0.3, 0.16);
    }

    function hideOverlay() {
        cicloAtivo = true;
        if(overlay) overlay.classList.add('hidden');
        [btnBiologico, btnQuimico, btnArmadilhas].forEach(b => { if(b) b.disabled = false; });
        if(overlayRestart) overlayRestart.classList.add('hidden');
        if(overlayStart) overlayStart.classList.remove('hidden');
        if(btnMute) btnMute.disabled = false;
    }

    if(overlayRestart) overlayRestart.addEventListener('click', () => { resetarSimulador(); });
    if(overlayStart) overlayStart.addEventListener('click', () => { startGame(); });

    function startGame() {
        // inicializa variáveis e inicia loop/temporizador
        populacaoPragas = 150;
        saudeEcossistema = 80;
        custoProducao = 0;
        tempoRestante = 120;
        cicloAtivo = true;
        atualizarInterface();
        if(overlay) overlay.classList.add('hidden');
        // ativa botões
        [btnBiologico, btnQuimico, btnArmadilhas].forEach(b => { if(b) b.disabled = false; });
        // iniciar temporizador
        if(timerInterval) clearInterval(timerInterval);
        timerInterval = setInterval(() => {
            tempoRestante -= 1;
            if(hudTimer) hudTimer.innerText = `Tempo: ${tempoRestante}s`;
            if(tempoRestante <= 0) {
                // tempo acabou: verifica condições de vitória
                if (populacaoPragas <= 30 && saudeEcossistema >= 90) {
                    showOverlay('Vitória', 'Parabéns! Você atingiu os objetivos a tempo.');
                } else {
                    showOverlay('Derrota', 'Tempo esgotado. Objetivos não foram alcançados.');
                }
            }
        }, 1000);
    }

    function atualizarInterface() {
        if(displayPragas) displayPragas.innerText = populacaoPragas;
        if(displaySaude) displaySaude.innerText = saudeEcossistema + "%";
        if(displayCusto) displayCusto.innerText = "R$ " + custoProducao;
        if(danoBar) danoBar.value = Math.min(100, Math.floor((populacaoPragas / 5)));

        // Atualiza visual simples da plantação (mais insetos quando há mais pragas)
        if(plantacaoEmojis) {
            const bugs = Math.min(10, Math.floor(populacaoPragas / 30));
            const emojis = '🌿 ' + '🐛 '.repeat(bugs) + '🌿';
            plantacaoEmojis.innerText = emojis;
            if(bugs > 0) plantacaoEmojis.classList.add('bug-anim'); else plantacaoEmojis.classList.remove('bug-anim');
        }

        if(hudPragas) hudPragas.innerText = populacaoPragas;
        if(hudSaude) hudSaude.innerText = saudeEcossistema + "%";
        if(hudCusto) hudCusto.innerText = "R$ " + custoProducao;
        if(hudScore) hudScore.innerText = score;
        if(hudLevel) hudLevel.innerText = level;
        if(hudTimer) hudTimer.innerText = `Tempo: ${tempoRestante}s`;
    }

    // mute button
    if(btnMute) btnMute.addEventListener('click', () => {
        isMuted = !isMuted;
        btnMute.innerText = isMuted ? '🔈' : '🔊';
        if(!isMuted) initAudio();
    });

    // aplica dificuldade no loop: aumentar crescimento pelo multiplier
    // ajusta simuladorLoop ao utilizar difficultyMultiplier

    atualizarInterface();
});
