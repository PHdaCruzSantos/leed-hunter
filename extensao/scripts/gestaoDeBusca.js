import { exibirDetalhesDosLeads, getLeadsColetados } from '../side panel/resultados.js'

let consultaAtual = "";
let totalScripts = 3;
let scriptsRecebidos = 0;

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
                return;
            }

            resultsLista.innerHTML = "";
            scriptsRecebidos = 0;
            totalScripts = urlsParaBuscar.length;

            chrome.windows.create({
                url: urlsParaBuscar,
                state: "minimized",
                focused: false
            });

            statusDiv.style.color = "#ffffff";
            statusDiv.innerText = `Busca iniciada em ${totalScripts} plataforma(s)...`;


        });
    } else {
        statusDiv.style.color = "#aaaaaa";
        statusDiv.innerText = "Digite algo para buscar!";
    }
}

// Ouve as mensagens de qualquer scraper que terminar o trabalho (registrado apenas uma vez)
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (sender && sender.tab && sender.tab.id) {
        chrome.tabs.remove(sender.tab.id).catch(() => { });
    }

    if (message.type === "DADOS_COLETADOS") {
        const statusDiv = document.getElementById('status');
        exibirDetalhesDosLeads(message.dados, false);
        const leadsColetados = getLeadsColetados();
        statusDiv.innerText = `${leadsColetados.length} leads detectados!`;
        scriptsRecebidos++;
        if (scriptsRecebidos == totalScripts) {
            criaHistorico(consultaAtual, leadsColetados);
        }
    } else if (message.type === "SEM_RESULTADOS") {
        const statusDiv = document.getElementById('status');
        const leadsColetados = getLeadsColetados();
        if (leadsColetados.length === 0) {
            statusDiv.innerText = "Aguardando resultados ou nada encontrado.";
            statusDiv.style.color = "#ff6b6b";
        }
        scriptsRecebidos++;
        if (scriptsRecebidos == totalScripts) {
            criaHistorico(consultaAtual, leadsColetados);
        }
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