/* VARIÁVEIS DE ESTADO (O QUE MUDA NO JOGO) */
let populacaoPragas = 10;
let saudeEcossistema = 100;
let custoProducao = 0;
let cicloAtivo = true;

/* ELEMENTOS DA INTERFACE (LIGAÇÃO COM O HTML) */
// Certifique-se de que seu HTML tem IDs correspondentes
const displayPragas = document.getElementById('pragas-val');
const displaySaude = document.getElementById('saude-val');
const displayCusto = document.getElementById('custo-val');
const consoleLog = document.getElementById('diario-campo');

/* LOOP PRINCIPAL - Roda a cada 2 segundos */
const simuladorLoop = setInterval(() => {
    if (cicloAtivo) {
        // Crescimento natural das pragas
        const crescimento = Math.floor(populacaoPragas * 0.2) + 2;
        populacaoPragas += crescimento;
        
        // Se houver muita praga, a saúde do ecossistema cai sozinha
        if (populacaoPragas > 100) {
            saudeEcossistema -= 2;
        }

        atualizarInterface();
        verificarCondicoes();
    }
}, 2000);

/* FUNÇÕES DE AÇÃO (BOTÕES) */

function controleBiologico() {
    // Reduz pragas de forma moderada, mas melhora a saúde do solo
    populacaoPragas = Math.max(0, populacaoPragas - 30);
    saudeEcossistema = Math.min(100, saudeEcossistema + 5);
    custoProducao += 150; // Inimigos naturais têm um custo de aquisição
    
    registrarEvento("Controle Biológico aplicado: Equilíbrio restaurado.");
    atualizarInterface();
}

function controleQuimico() {
    // Mata muitas pragas rápido, mas prejudica o ecossistema significativamente
    populacaoPragas = Math.max(0, populacaoPragas - 80);
    saudeEcossistema -= 15;
    custoProducao += 300; // Pesticidas são caros
    
    registrarEvento("Intervenção Química: Pragas eliminadas, mas solo impactado.");
    atualizarInterface();
}

/* LÓGICA DE APOIO */

function atualizarInterface() {
    if(displayPragas) displayPragas.innerText = populacaoPragas;
    if(displaySaude) displaySaude.innerText = saudeEcossistema + "%";
    if(displayCusto) displayCusto.innerText = "R$ " + custoProducao;
}

function registrarEvento(texto) {
    const data = new Date().toLocaleTimeString();
    if(consoleLog) {
        consoleLog.value += `[${data}] ${texto}\n`;
        consoleLog.scrollTop = consoleLog.scrollHeight; // Rola o texto para baixo
    }
}

function verificarCondicoes() {
    if (saudeEcossistema <= 0) {
        alert("Fim de Jogo: O ecossistema entrou em colapso por excesso de químicos.");
        resetarSimulador();
    } else if (populacaoPragas > 500) {
        alert("Fim de Jogo: As pragas destruíram 100% da lavoura.");
        resetarSimulador();
    }
}

function resetarSimulador() {
    populacaoPragas = 10;
    saudeEcossistema = 100;
    custoProducao = 0;
    if(consoleLog) consoleLog.value = "Simulador reiniciado...\n";
    atualizarInterface();
}