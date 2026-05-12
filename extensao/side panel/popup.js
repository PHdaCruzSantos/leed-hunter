import { downloadCSV, downloadPDF } from '../scripts/export.js'
import { realizarBusca } from '../scripts/gestaoDeBusca.js'
import { UI } from '../scripts/ui.js'

let leadsColetados = [];
let googleLimite = 5;
let linkedinLimite = 5;
let instagramLimite = 5;
let termoAtual = "Busca Ativa";
let dataAtual = "";

export function getLeadsColetados() {
    return leadsColetados;
}

document.addEventListener('DOMContentLoaded', () => {
    fetch('./src/icons.html')
        .then(response => response.text())
        .then(html => {
            document.body.insertAdjacentHTML('afterbegin', html);
        })
        .catch(error => console.error('Erro ao carregar ícones:', error));

    renderizarHistorico();
    carregarPreferenciasDeBusca();
});

// tela Gerenciar Sites
document.getElementById('btnManageSites').addEventListener('click', () => {
    UI.mudarTela('manage');
});

document.getElementById('btnBackManage').addEventListener('click', () => {
    UI.mudarTela('home');
});

// Carregar e salvar preferências de busca (plataformas)
function carregarPreferenciasDeBusca() {
    chrome.storage.local.get({
        plataformasAtivas: {
            google: true,
            linkedin: true,
            instagram: true
        }
    }, (result) => {
        document.getElementById('toggleGoogle').checked = result.plataformasAtivas.google;
        document.getElementById('toggleLinkedin').checked = result.plataformasAtivas.linkedin;
        document.getElementById('toggleInstagram').checked = result.plataformasAtivas.instagram;
    });
}

function salvarPreferenciasDeBusca() {
    const preferencias = {
        google: document.getElementById('toggleGoogle').checked,
        linkedin: document.getElementById('toggleLinkedin').checked,
        instagram: document.getElementById('toggleInstagram').checked
    };
    chrome.storage.local.set({ plataformasAtivas: preferencias });
}

document.getElementById('toggleGoogle').addEventListener('change', salvarPreferenciasDeBusca);
document.getElementById('toggleLinkedin').addEventListener('change', salvarPreferenciasDeBusca);
document.getElementById('toggleInstagram').addEventListener('change', salvarPreferenciasDeBusca);

export function exibirDetalhesDosLeads(novosLeads, isHistorico = false) {
    if (isHistorico) {
        leadsColetados = novosLeads;
    } else {
        leadsColetados = [...leadsColetados, ...novosLeads];
    }
    const resultsLista = document.getElementById('resultsLista');
    resultsLista.innerHTML = "";

    const leadsGoogle = leadsColetados.filter(item => item.origem && item.origem.includes('google'));
    const leadsLinkedIn = leadsColetados.filter(item => item.origem && item.origem.includes('linkedin'));
    const leadsInstagram = leadsColetados.filter(item => item.origem && item.origem.includes('instagram'));

    // seção do Google
    if (leadsGoogle.length > 0) {
        const secaoGoogle = document.createElement('div');
        secaoGoogle.innerHTML = `<h3 style="color: #ffffff; margin: 10px 0; font-size: 14px; display: flex; align-items: center; gap: 6px;">
            <svg width="16" height="16" fill="currentColor">
                <use href="#icon-google"></use>
            </svg> Resultados do Google
        </h3>`;
        resultsLista.appendChild(secaoGoogle);

        //const limiteGoogle = googleLimite;

        leadsGoogle.slice(0, googleLimite).forEach(item => {
            const card = document.createElement('div');
            card.className = 'lead-card';
            card.innerHTML = `
            <strong>${item.nome}</strong>
            <span>📱 ${item.telefone}</span>
            <span>🔗 ${item.site}</span>
            `;
            resultsLista.appendChild(card);
        });

        const googleBtnContainer = document.createElement('div');
        googleBtnContainer.style.display = 'flex';
        googleBtnContainer.style.gap = '10px';
        googleBtnContainer.style.marginTop = '10px';
        googleBtnContainer.style.marginBottom = '10px';

        adicionarBotoesDePaginacao(googleLimite, leadsGoogle.length, googleBtnContainer, 'google');

        if (googleBtnContainer.childNodes.length > 0) {
            resultsLista.appendChild(googleBtnContainer);
        }
    }

    // seção do Linkedin
    if (leadsLinkedIn.length > 0) {
        const sectionLinkedIn = document.createElement('div');
        const margemTopo = leadsGoogle.length > 0 ? "20px" : "10px";
        sectionLinkedIn.innerHTML = `<h3 style="color: #ffffff; margin: ${margemTopo} 0 10px 0; font-size: 14px; display: flex; align-items: center; gap: 6px;">
            <svg width="16" height="16" fill="currentColor">
                <use href="#icon-linkedin"></use>
            </svg> Resultados do LinkedIn
        </h3>`;
        resultsLista.appendChild(sectionLinkedIn);

        const limitLinkedIn = linkedinLimite;

        leadsLinkedIn.slice(0, limitLinkedIn).forEach(item => {
            const card = document.createElement('div');
            card.className = 'lead-card';
            card.innerHTML = `
            <strong>${item.nome}</strong>
            <span>💼 ${item.profissao}</span>
            <span>🔗 ${item.site}</span>
            `;
            resultsLista.appendChild(card);
        });

        const linkedinBtnContainer = document.createElement('div');
        linkedinBtnContainer.style.display = 'flex';
        linkedinBtnContainer.style.gap = '10px';
        linkedinBtnContainer.style.marginTop = '10px';
        linkedinBtnContainer.style.marginBottom = '10px';

        adicionarBotoesDePaginacao(linkedinLimite, leadsLinkedIn.length, linkedinBtnContainer, 'linkedin');

        if (linkedinBtnContainer.childNodes.length > 0) {
            resultsLista.appendChild(linkedinBtnContainer);
        }
    }

    // seção do Instagram
    if (leadsInstagram.length > 0) {
        const sectionInstagram = document.createElement('div');
        const margemTopo = (leadsGoogle.length > 0 || leadsLinkedIn.length > 0) ? "20px" : "10px";
        sectionInstagram.innerHTML = `<h3 style="color: #ffffff; margin: ${margemTopo} 0 10px 0; font-size: 14px; display: flex; align-items: center; gap: 6px;">
            <svg width="16" height="16" fill="currentColor">
                <use href="#icon-instagram"></use>
            </svg> Resultados do Instagram
        </h3>`;
        resultsLista.appendChild(sectionInstagram);

        const limitInstagram = instagramLimite;

        leadsInstagram.slice(0, limitInstagram).forEach(item => {
            const card = document.createElement('div');
            card.className = 'lead-card';
            card.innerHTML = `
            <strong>${item.nome}</strong>
            <span>📸 @${item.user || "N/A"}</span>
            <span>🔗 ${item.site}</span>
            `;
            resultsLista.appendChild(card);
        });

        const instagramBtnContainer = document.createElement('div');
        instagramBtnContainer.style.display = 'flex';
        instagramBtnContainer.style.gap = '10px';
        instagramBtnContainer.style.marginTop = '10px';
        instagramBtnContainer.style.marginBottom = '10px';

        adicionarBotoesDePaginacao(instagramLimite, leadsInstagram.length, instagramBtnContainer, 'instagram');

        if (instagramBtnContainer.childNodes.length > 0) {
            resultsLista.appendChild(instagramBtnContainer);
        }
    }

    if (isHistorico) {
        const statusDiv = document.getElementById('status');
        if (statusDiv) {
            statusDiv.style.color = "#ffffff";
            statusDiv.innerText = `${leadsColetados.length} leads exibidos do histórico!`;
        }
    }
}

function adicionarBotoesDePaginacao(limiteAtual, totalDeLeads, containerDeBotoes, origem) {
    if (limiteAtual < totalDeLeads) {
        const btnMais = document.createElement('button');
        const restantes = totalDeLeads - limiteAtual;
        const paraMostrar = Math.min(5, restantes);
        btnMais.innerText = `Ver mais (${paraMostrar})`;
        btnMais.addEventListener('click', () => {
            if (origem === 'google') {
                googleLimite += 5;
            } else if (origem === 'linkedin') {
                linkedinLimite += 5;
            } else if (origem === 'instagram') {
                instagramLimite += 5;
            }
            exibirDetalhesDosLeads([]);
        });
        containerDeBotoes.appendChild(btnMais);
    }

    if (limiteAtual > 5) {
        const btnMenos = document.createElement('button');
        btnMenos.innerText = `Recolher`;
        btnMenos.addEventListener('click', () => {
            if (origem === 'google') {
                googleLimite = 5;
            } else if (origem === 'linkedin') {
                linkedinLimite = 5;
            } else if (origem === 'instagram') {
                instagramLimite = 5;
            }
            exibirDetalhesDosLeads([]);
        });
        containerDeBotoes.appendChild(btnMenos);
    }
}

function renderizarHistorico() {
    chrome.storage.local.get({ historico: [] }, (result) => {
        const container = document.getElementById('historicoCard');

        if (result.historico.length === 0) {
            container.innerHTML = '<p>Nenhuma busca recente.</p>';
            return;
        }

        container.innerHTML = '';
        const ul = document.createElement('ul');
        ul.style.listStyle = 'none';
        ul.style.padding = '0';

        result.historico.forEach(item => {
            const li = document.createElement('li');
            li.style.marginBottom = "10px";
            li.style.cursor = 'pointer';

            li.innerHTML = `
                <div class="history-info">
                    <strong> ${item.termo} </strong>  <br>
                    <small>Data: ${item.data} • ${item.quantidade} leads encontrados</small>
                </div>
                <button class="btn-delete-history" title="Excluir busca">
                    <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
                        <use href="#icon-trash"></use>
                    </svg>
                </button>
            `;

            const btnDelete = li.querySelector('.btn-delete-history');
            btnDelete.addEventListener('click', (e) => {
                e.stopPropagation();
                const novoHistorico = result.historico.filter(h => {
                    if (h.indexConsulta && item.indexConsulta) {
                        return h.indexConsulta !== item.indexConsulta;
                    }
                    return h.termo !== item.termo || h.data !== item.data;
                });
                chrome.storage.local.set({ historico: novoHistorico }, () => {
                    renderizarHistorico();
                });
            });

            li.addEventListener('click', () => {
                googleLimite = 5;
                linkedinLimite = 5;
                instagramLimite = 5;
                termoAtual = item.termo;
                dataAtual = item.data;

                // Suporta formato antigo (array) e novo (objeto separado por plataformas)
                let leadsParaExibir = [];
                if (Array.isArray(item.leads)) {
                    leadsParaExibir = item.leads;
                } else if (item.leads) {
                    leadsParaExibir = [
                        ...(item.leads.google || []),
                        ...(item.leads.linkedin || []),
                        ...(item.leads.instagram || [])
                    ];
                }

                exibirDetalhesDosLeads(leadsParaExibir, true);
                UI.mudarTela('results');
            });
            ul.appendChild(li);
        });
        container.appendChild(ul);
    });
}

document.getElementById('searchBtn').addEventListener('click', () => {
    googleLimite = 5;
    linkedinLimite = 5;
    instagramLimite = 5;
    termoAtual = document.getElementById('searchTerm').value;
    dataAtual = new Date().toLocaleDateString('pt-BR');
    realizarBusca();
});

document.getElementById('searchTerm').addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
        googleLimite = 5;
        linkedinLimite = 5;
        instagramLimite = 5;
        termoAtual = document.getElementById('searchTerm').value;
        dataAtual = new Date().toLocaleDateString('pt-BR');
        realizarBusca();
    }
});

document.getElementById('btnCSV').addEventListener('click', () => {
    if (leadsColetados.length > 0) {
        downloadCSV(leadsColetados, termoAtual, dataAtual);
    }
});

document.getElementById('btnPDF').addEventListener('click', () => {
    if (leadsColetados.length > 0) {
        downloadPDF(leadsColetados, termoAtual, dataAtual);
    }
});

document.getElementById('btnBack').addEventListener('click', () => {
    UI.mudarTela('home');
    document.getElementById('resultsLista').innerHTML = "";
    document.getElementById('status').innerText = "";
    leadsColetados = [];
    googleLimite = 5;
    linkedinLimite = 5;
    instagramLimite = 5;
    renderizarHistorico();
});
