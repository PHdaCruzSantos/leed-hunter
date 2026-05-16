import { exibirDetalhesDosLeads, getLeadsColetados } from '../side panel/resultados.js'

let consultaAtual = "";
let totalScripts = 3;
let scriptsRecebidos = 0;
let buscaEmAndamento = false;
let scraperWindowId = null;
let loginNecessarioAtivo = false;

export function isBuscaEmAndamento() {
    return buscaEmAndamento;
}

function setBuscaUI(ativa) {
    buscaEmAndamento = ativa;
    const btnBack = document.getElementById('btnBack');
    if (btnBack) {
        btnBack.disabled = ativa;
        btnBack.style.cursor = ativa ? 'not-allowed' : 'pointer';
        btnBack.style.opacity = ativa ? '0.3' : '1';
        btnBack.title = ativa ? 'Aguarde a busca finalizar' : 'Voltar para a tela inicial';
    }
}



export function realizarBusca(consulta) {
    const statusDiv = document.getElementById('status');
    const resultsLista = document.getElementById('resultsLista');

    if (consulta) {
        chrome.storage.local.get({
            plataformasAtivas: {
                google: true,
                linkedin: true,
                instagram: true
            }
        }, (result) => {
            const ativas = result.plataformasAtivas;
            const urlsParaBuscar = [];

            consultaAtual = consulta;
            const queryFormatada = consulta.trim().replace(/\s+/g, '+');

            if (ativas.google) {
                urlsParaBuscar.push(`https://www.google.com/search?q=${queryFormatada}&tbm=lcl`);
            }
            if (ativas.linkedin) {
                urlsParaBuscar.push(`https://www.linkedin.com/search/results/companies/?keywords=${encodeURIComponent(consulta)}&origin=SWITCH_SEARCH_VERTICAL`);
            }
            if (ativas.instagram) {
                urlsParaBuscar.push(`https://www.instagram.com/web/search/topsearch/?context=blended&query=${encodeURIComponent(consulta)}`);
            }

            if (urlsParaBuscar.length === 0) {
                statusDiv.style.color = "#ff6b6b";
                statusDiv.innerText = "Nenhuma plataforma selecionada para busca!";
                const queryInfoDiv = document.getElementById('queryInfo');
                if (queryInfoDiv) queryInfoDiv.style.display = 'none';
                return;
            }

            resultsLista.innerHTML = "";
            scriptsRecebidos = 0;
            totalScripts = urlsParaBuscar.length;
            loginNecessarioAtivo = false;

            chrome.windows.create({
                url: urlsParaBuscar,
                state: "minimized",
                focused: false
            }, (win) => {
                scraperWindowId = win.id;
            });

            statusDiv.style.color = "#ffffff";
            statusDiv.innerText = `Busca iniciada em ${totalScripts} plataforma(s)...`;
            setBuscaUI(true);
        });
    } else {
        statusDiv.style.color = "#aaaaaa";
        statusDiv.innerText = "Digite algo para buscar!";
    }
}

const mensagem = "fora da funçaõ realizar busca";
chrome.runtime.sendMessage({
    action: "DEBUG_LOG",
    dados: mensagem
});

// Ouve as mensagens de qualquer scraper que terminar o trabalho (registrado apenas uma vez)
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    const statusDiv = document.getElementById('status');
    const mensagem = "dentro do ouvido dos scrapers";
    chrome.runtime.sendMessage({
        action: "DEBUG_LOG",
        dados: mensagem
    });
    if (!scraperWindowId || !sender?.tab || sender.tab.windowId !== scraperWindowId) {
        return;
    }
    chrome.tabs.remove(sender.tab.id).catch(() => { });

    if (message.type === "DADOS_COLETADOS") {
        const mensagem = "dados coletados linkedin";
        chrome.runtime.sendMessage({
            action: "DEBUG_LOG",
            dados: mensagem
        });
        exibirDetalhesDosLeads(message.dados, false);
        const leadsColetados = getLeadsColetados();
        if (!loginNecessarioAtivo) {
            statusDiv.innerText = `${leadsColetados.length} leads detectados!`;
        }
        scriptsRecebidos++;
        if (scriptsRecebidos >= totalScripts) {
            criaHistorico(consultaAtual, leadsColetados);
            setBuscaUI(false);
            scraperWindowId = null;
        }
    } else if (message.type === "SEM_RESULTADOS") {
        const leadsColetados = getLeadsColetados();
        if (!loginNecessarioAtivo && leadsColetados.length === 0) {
            statusDiv.innerText = "Nenhum resultado correspondente encontrado.";
            statusDiv.style.color = "#ff6b6b";
        }
        scriptsRecebidos++;
        if (scriptsRecebidos >= totalScripts) {
            criaHistorico(consultaAtual, leadsColetados);
            setBuscaUI(false);
            scraperWindowId = null;
        }
    } else if (message.type === "LOGIN_NECESSARIO") {
        if (statusDiv) {
            statusDiv.style.color = "#ff6b6b";
            statusDiv.innerHTML = `Login necessário no ${message.plataforma}. Clique no link para logar e tente novamente.`;
        }
        processarLoginNecessario(message.plataforma, message.url);
    }
});

function criaHistorico(consulta, leadsColetados) {
    chrome.storage.local.get({ historico: [], indexConsulta: 1 }, (result) => {
        let currentIndex = result.indexConsulta;
        const leadsGoogle = leadsColetados.filter(item => item.origem && item.origem.includes('google'));
        const leadsLinkedin = leadsColetados.filter(item => item.origem && item.origem.includes('linkedin'));
        const leadsInstagram = leadsColetados.filter(item => item.origem && item.origem.includes('instagram'));

        const novaEntrada = {
            termo: consulta,
            data: new Date().toLocaleDateString('pt-BR'),
            quantidade: leadsColetados.length,
            leads: {
                google: leadsGoogle,
                linkedin: leadsLinkedin,
                instagram: leadsInstagram
            },
            indexConsulta: currentIndex
        };

        const novoHistorico = [novaEntrada, ...result.historico].slice(0, 20);
        chrome.storage.local.set({
            historico: novoHistorico,
            indexConsulta: currentIndex + 1
        });
    });
}

function processarLoginNecessario(plataforma, url) {
    loginNecessarioAtivo = true;

    // Fecha a janela oculta e abre uma janela visível para o login
    if (scraperWindowId) {
        chrome.windows.remove(scraperWindowId).catch(() => { });
        scraperWindowId = null;
    }

    chrome.windows.create({
        url: url,
        focused: true,
        state: "normal"
    }, (win) => {
        // Não guardamos o ID da janela de login como scraperWindowId 
        // para evitar que o listener tente fechar abas nela.
    });

    setBuscaUI(false);
}