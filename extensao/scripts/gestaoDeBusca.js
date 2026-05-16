import { exibirDetalhesDosLeads, getLeadsColetados } from '../side panel/resultados.js'

let consultaAtual = "";
let totalScripts = 3;
let scriptsRecebidos = 0;
let buscaEmAndamento = false;
let scraperWindowId = null;
let loginNecessarioAtivo = false;
let searchTimeout = null;

function detectarLoginPelaUrl(url) {
    if (!url) return null;
    const lowerUrl = url.toLowerCase();
    const loginPatterns = [
        "linkedin.com/login",
        "linkedin.com/authwall",
        "linkedin.com/checkpoint",
        "linkedin.com/uas/",
        "instagram.com/accounts/login",
        "instagram.com/login",
        "google.com/service/login",
        "google.com/accounts/login",
        "accounts.google.com"
    ];

    if (loginPatterns.some(pattern => lowerUrl.includes(pattern))) {
        if (lowerUrl.includes("linkedin")) return "LinkedIn";
        if (lowerUrl.includes("instagram")) return "Instagram";
        if (lowerUrl.includes("google")) return "Google";
    }
    return null;
}

function dispararToastLogin(plataforma, url) {
    if (loginNecessarioAtivo) return;

    // Tratativa específica para o Instagram (Segurança e baixa detecção)
    if (plataforma === "Instagram") {
        loginNecessarioAtivo = true;

        if (totalScripts === 1) {
            // Finaliza a busca atual imediatamente para evitar suspeitas do Instagram
            if (scraperWindowId) {
                chrome.windows.remove(scraperWindowId).catch(() => { });
                scraperWindowId = null;
            }
            if (searchTimeout) {
                clearTimeout(searchTimeout);
                searchTimeout = null;
            }
            setBuscaUI(false);
        } else {
            // Se há outras plataformas, fecha apenas a aba do Instagram na janela oculta
            if (scraperWindowId) {
                chrome.tabs.query({ windowId: scraperWindowId }, (tabs) => {
                    tabs.forEach(tab => {
                        if (tab.url && tab.url.includes('instagram')) {
                            chrome.tabs.remove(tab.id).catch(() => {});
                        }
                    });
                });
            }
            
            // Marca o script do Instagram como "processado" para as outras plataformas terminarem normalmente
            scriptsRecebidos++;
            if (scriptsRecebidos >= totalScripts) {
                const leads = getLeadsColetados();
                if (leads.length > 0) {
                    criaHistorico(consultaAtual, leads);
                }
                setBuscaUI(false);
                scraperWindowId = null;
                if (searchTimeout) clearTimeout(searchTimeout);
            }
        }

        const toastContent = document.createElement("div");
        toastContent.style.display = "flex";
        toastContent.style.flexDirection = "column";
        toastContent.style.gap = "10px";
        toastContent.innerHTML = `
            <div style="font-family: 'Outfit', sans-serif; font-size: 14px;">
                <strong>Instagram exige login:</strong><br>
                Para buscar leads no Instagram, você precisa estar logado na rede social em seu navegador.
            </div>
            <button id="btnEntendiInsta" style="
                background: linear-gradient(45deg, #f09433 0%,#e6683c 25%,#dc2743 50%,#cc2366 75%,#bc1888 100%);
                color: white;
                border: none;
                padding: 8px 12px;
                border-radius: 6px;
                cursor: pointer;
                font-family: 'Outfit', sans-serif;
                font-weight: 600;
                transition: transform 0.1s;
                margin-top: 5px;
            ">Entendi</button>
        `;

        const toast = Toastify({
            node: toastContent,
            duration: -1,
            close: false,
            gravity: "top",
            position: "right",
            stopOnFocus: true,
            style: {
                background: "#1a1d2e",
                color: "#EDEAE0",
                border: "1px solid #2563eb",
                borderRadius: "12px",
                padding: "15px 25px",
                boxShadow: "0 10px 20px rgba(0,0,0,0.4)"
            }
        }).showToast();

        const btnEntendi = toastContent.querySelector("#btnEntendiInsta");
        btnEntendi.onmousedown = () => btnEntendi.style.transform = "scale(0.95)";
        btnEntendi.onmouseup = () => btnEntendi.style.transform = "scale(1)";
        btnEntendi.onclick = () => {
            toast.hideToast();
            if (totalScripts === 1) {
                window.location.href = "popup.html";
            }
        };
        return;
    }

    const statusDiv = document.getElementById('status');
    if (statusDiv) {
        statusDiv.style.color = "#ff6b6b";
        statusDiv.innerText = `Aguardando login no ${plataforma}...`;
    }

    const toastContent = document.createElement("div");
    toastContent.style.display = "flex";
    toastContent.style.flexDirection = "column";
    toastContent.style.gap = "10px";
    toastContent.innerHTML = `
        <div style="font-family: 'Outfit', sans-serif; font-size: 14px;">
            <strong>Login necessário:</strong> ${plataforma}.<br>
            Acesse a aba aberta para logar e clique abaixo para continuar.
        </div>
        <button id="btnRetomarBusca" style="
            background: #ff6b6b;
            color: white;
            border: none;
            padding: 8px 12px;
            border-radius: 6px;
            cursor: pointer;
            font-family: 'Outfit', sans-serif;
            font-weight: 600;
            transition: opacity 0.2s;
        ">Retomar Busca</button>
    `;

    const toast = Toastify({
        node: toastContent,
        duration: -1,
        close: false,
        gravity: "top",
        position: "right",
        stopOnFocus: true,
        style: {
            background: "#1a1d2e",
            color: "#EDEAE0",
            border: "1px solid #2563eb",
            borderRadius: "12px",
            padding: "15px 25px",
            boxShadow: "0 10px 20px rgba(0,0,0,0.4)"
        }
    }).showToast();

    const btnRetomar = toastContent.querySelector("#btnRetomarBusca");
    btnRetomar.onmouseover = () => btnRetomar.style.opacity = "0.8";
    btnRetomar.onmouseout = () => btnRetomar.style.opacity = "1";
    btnRetomar.onclick = () => {
        toast.hideToast();
        realizarBusca(consultaAtual);
    };

    processarLoginNecessario(plataforma, url);
}

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
                Toastify({
                    text: "Por favor, selecione ao menos uma plataforma nas configurações.",
                    duration: 4000,
                    gravity: "top",
                    position: "right",
                    style: {
                        background: "#1a1d2e",
                        color: "#EDEAE0",
                        border: "1px solid #2563eb",
                        borderRadius: "12px",
                        fontFamily: "'Outfit', sans-serif",
                        fontSize: "16px",
                        padding: "15px 25px",
                        boxShadow: "0 10px 20px rgba(0,0,0,0.4)"
                    }
                }).showToast();
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
                // Verificação imediata caso o redirecionamento ocorra no primeiro carregamento
                if (win.tabs) {
                    win.tabs.forEach(tab => {
                        const plataforma = detectarLoginPelaUrl(tab.url || tab.pendingUrl);
                        if (plataforma) {
                            dispararToastLogin(plataforma, tab.url || tab.pendingUrl);
                        }
                    });
                }
            });

            statusDiv.style.color = "#ffffff";
            statusDiv.innerText = `Busca iniciada em ${totalScripts} plataforma(s)...`;
            setBuscaUI(true);

            // Timeout de segurança: se nada acontecer em 25 segundos, destrava a UI
            if (searchTimeout) clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                if (buscaEmAndamento) {
                    statusDiv.style.color = "#ff6b6b";
                    statusDiv.innerText = "A busca demorou muito a responder. Verifique sua conexão ou se há bloqueios.";
                    setBuscaUI(false);
                    if (scraperWindowId) {
                        chrome.windows.remove(scraperWindowId).catch(() => { });
                        scraperWindowId = null;
                    }
                }
            }, 35000);
        });
    } else {
        statusDiv.style.color = "#aaaaaa";
        statusDiv.innerText = "Digite algo para buscar!";
    }
}


// Ouve as mensagens de qualquer scraper que terminar o trabalho (registrado apenas uma vez)
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    const statusDiv = document.getElementById('status');

    // Log para depuração de comunicação
    chrome.runtime.sendMessage({
        action: "DEBUG_LOG",
        dados: `[GESTAO] Recebeu mensagem: ${message.type} de windowId: ${sender?.tab?.windowId}. Esperado: ${scraperWindowId}`
    });

    if (!scraperWindowId || !sender?.tab || sender.tab.windowId !== scraperWindowId) {
        return;
    }

    // Se recebeu algo do windowID correto, limpa o timeout pois houve atividade
    if (searchTimeout) {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            if (buscaEmAndamento) {
                statusDiv.style.color = "#ff6b6b";
                statusDiv.innerText = "A busca demorou muito a responder. Verifique sua conexão ou se há bloqueios.";
                setBuscaUI(false);
                scraperWindowId = null;
            }
        }, 25000);
    }

    if (message.type === "DADOS_COLETADOS") {
        // REDE DE SEGURANÇA: Verifica se a aba não foi para uma página de login antes de aceitar os dados
        const plataformaUrl = detectarLoginPelaUrl(sender.tab.url);
        if (plataformaUrl) {
            dispararToastLogin(plataformaUrl, sender.tab.url);
            return;
        }

        chrome.tabs.remove(sender.tab.id).catch(() => { });
        chrome.runtime.sendMessage({
            action: "DEBUG_LOG",
            dados: `[GESTAO] Processando ${message.dados.length} leads de ${message.dados[0]?.origem || 'origem desconhecida'}`
        });

        exibirDetalhesDosLeads(message.dados, false);
        const leadsColetados = getLeadsColetados();
        if (!loginNecessarioAtivo) {
            statusDiv.innerText = `${leadsColetados.length} leads detectados!`;
        }
        scriptsRecebidos++;
        if (scriptsRecebidos >= totalScripts) {
            if (leadsColetados.length > 0) {
                criaHistorico(consultaAtual, leadsColetados);
            }
            setBuscaUI(false);
            scraperWindowId = null;
            if (searchTimeout) clearTimeout(searchTimeout);
        }
    } else if (message.type === "SEM_RESULTADOS") {
        // REDE DE SEGURANÇA: Se não veio resultados, verifica se não estamos presos numa página de login/bloqueio
        const plataformaUrl = detectarLoginPelaUrl(sender.tab.url);
        if (plataformaUrl) {
            dispararToastLogin(plataformaUrl, sender.tab.url);
            return;
        }

        chrome.runtime.sendMessage({
            action: "DEBUG_LOG",
            dados: `[GESTAO] SEM_RESULTADOS na URL: ${sender.tab.url}`
        });

        chrome.tabs.remove(sender.tab.id).catch(() => { });
        const leadsColetados = getLeadsColetados();
        if (!loginNecessarioAtivo && leadsColetados.length === 0) {
            statusDiv.innerText = "Nenhum resultado correspondente encontrado.";
            statusDiv.style.color = "#ff6b6b";
        }
        scriptsRecebidos++;
        if (scriptsRecebidos >= totalScripts) {
            if (leadsColetados.length > 0) {
                criaHistorico(consultaAtual, leadsColetados);
            }
            setBuscaUI(false);
            scraperWindowId = null;
            if (searchTimeout) clearTimeout(searchTimeout);
        }
    } else if (message.type === "LOGIN_NECESSARIO") {
        const mensagem = "mensagem de erro login necessario";
        chrome.runtime.sendMessage({
            action: "DEBUG_LOG",
            dados: mensagem
        });
        dispararToastLogin(message.plataforma, message.url);
    }
});

// Monitoramento ativo de redirecionamentos para login
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (scraperWindowId && tab.windowId === scraperWindowId) {
        // Verifica tanto a URL que mudou quanto a URL atual da aba
        const urlParaVerificar = changeInfo.url || tab.url;
        const plataforma = detectarLoginPelaUrl(urlParaVerificar);
        if (plataforma) {
            dispararToastLogin(plataforma, urlParaVerificar);
        }
    }
});

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
        // Janela de login aberta
    });

    setBuscaUI(false);
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
        chrome.storage.local.set({
            historico: novoHistorico,
            indexConsulta: currentIndex + 1
        });
    });
}
