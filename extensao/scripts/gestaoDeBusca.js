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
                urlsParaBuscar.push(`https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(consulta)}&origin=GLOBAL_SEARCH_HEADER`);
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
            //loginNecessarioAtivo = false;

            statusDiv.style.color = "#ffffff";
            statusDiv.innerText = `Busca iniciada em ${totalScripts} plataforma(s)...`;
            setBuscaUI(true);
        });
    } else {
        statusDiv.style.color = "#aaaaaa";
        statusDiv.innerText = "Digite algo para buscar!";
    }
}



// Ouve as mensagens de qualquer scraper que terminar o trabalho (registrado apenas uma vez)
function ouveScraper(message){
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (!scraperWindowId || !sender?.tab || sender.tab.windowId !== scraperWindowId) {
            return;
        }
        chrome.tabs.remove(sender.tab.id).catch(() => { });

        if (message.type === "DADOS_COLETADOS") {
            const statusDiv = document.getElementById('status');
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
            const statusDiv = document.getElementById('status');
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
            processarLoginNecessario(message.plataforma, message.url);
        }
    });
}

ouveScraper();




function processarLoginNecessario(plataforma, urlLogin, tabId) {
    const statusDiv = document.getElementById('status');
    loginNecessarioAtivo = true;
    statusDiv.style.color = "#ffcc00";
    statusDiv.innerHTML = `
        Não é possível iniciar a busca no <strong>${plataforma}</strong> antes de efetuar o login. 
        Por favor, acesse <a href="${urlLogin}">${urlLogin.replace("https://www.", "")}</a> para prosseguir.
    `;

    if (tabId) {
        chrome.windows.create({
            tabId: tabId,
            focused: true,
            //type: "popup",
            width: 500,
            height: 600
        });
    } else {
        abrirLogin(urlLogin);
    }

    scriptsRecebidos++;
    verificarFimDeBusca();
}





function abrirLogin(urlLogin) {
    chrome.windows.create({
        url: urlLogin,
        focused: true,
        width: 500,
        height: 600
    }, (win) => {
        if (win && win.id) {
            scraperWindowId = win.id;
        }
    });
}

function pararBuscaPorErro(mensagem) {
    // Reseta o estado global
    scraperWindowId = null;

    // Atualiza a UI apenas se houver uma mensagem nova e não for login
    if (mensagem) {
        const statusDiv = document.getElementById('status');
        if (statusDiv) {
            statusDiv.style.color = "#ff6b6b";
            statusDiv.innerText = mensagem;
        }
    }
    setBuscaUI(false); // Destrava botões de busca
}


function verificarFimDeBusca() {
    if (scriptsRecebidos >= totalScripts) {
        const leadsColetados = typeof getLeadsColetados === 'function' ? getLeadsColetados() : [];
        criaHistorico(consultaAtual, leadsColetados);
        setBuscaUI(false);
        scraperWindowId = null;
    }
}



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
        //console.log("Novo hisotirco: ", novoHistorico);
        //chrome.runtime.sendMessage({
        //  action: "DEBUG_LOG",
        //dados: novoHistorico
        //});

        chrome.storage.local.set({
            historico: novoHistorico,
            indexConsulta: currentIndex + 1
        });
    });
}