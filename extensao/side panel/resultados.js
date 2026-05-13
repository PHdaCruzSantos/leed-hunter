import { downloadCSV, downloadPDF } from '../scripts/export.js';
import { realizarBusca } from '../scripts/gestaoDeBusca.js';

let leadsColetados = [];
let googleLimite = 5;
let linkedinLimite = 5;
let instagramLimite = 5;
let termoAtual = "";
let dataAtual = "";

export function getLeadsColetados() {
    return leadsColetados;
}

document.addEventListener('DOMContentLoaded', () => {
    // Carregar os ícones SVG
    fetch('./src/icons.html')
        .then(response => response.text())
        .then(html => {
            document.body.insertAdjacentHTML('afterbegin', html);
        })
        .catch(error => console.error('Erro ao carregar ícones:', error));

    // Verificar o estado inicial (nova busca ou visualizar histórico)
    chrome.storage.local.get(['acaoPendente'], (result) => {
        const acao = result.acaoPendente;
        if (acao) {
            termoAtual = acao.termo;
            dataAtual = acao.data || new Date().toLocaleDateString('pt-BR');
            const queryInfoDiv = document.getElementById('queryInfo');
            if (queryInfoDiv) queryInfoDiv.innerText = `Resultados para: "${termoAtual}"`;

            if (acao.tipo === 'nova_busca') {
                realizarBusca(termoAtual);
            } else if (acao.tipo === 'historico') {
                exibirDetalhesDosLeads(acao.leads, true);
                document.getElementById('exportArea').style.display = 'flex';
            }

            // Limpa a ação pendente para não repetir se recarregar
            chrome.storage.local.remove('acaoPendente');
        }
    });
});

export function exibirDetalhesDosLeads(novosLeads, isHistorico = false) {
    if (isHistorico) {
        leadsColetados = novosLeads;
    } else {
        leadsColetados = [...leadsColetados, ...novosLeads];
    }
    const resultsLista = document.getElementById('resultsLista');
    if (!resultsLista) return;

    resultsLista.innerHTML = "";

    const leadsGoogle = leadsColetados.filter(item => item.origem && item.origem.includes('google'));
    const leadsLinkedIn = leadsColetados.filter(item => item.origem && item.origem.includes('linkedin'));
    const leadsInstagram = leadsColetados.filter(item => item.origem && item.origem.includes('instagram'));

    // seção do Google
    if (leadsGoogle.length > 0) {
        const googleContainer = document.createElement('div');
        googleContainer.className = 'platform-group google-group';

        const secaoGoogle = document.createElement('div');
        secaoGoogle.innerHTML = `<h3 style="color: #EDEAE0; margin: 10px 0; font-size: 14px; display: flex; align-items: center; gap: 6px;">
            <svg width="16" height="16" fill="currentColor">
                <use href="#icon-google"></use>
            </svg>Google (${leadsGoogle.length} leads)
        </h3>`;
        googleContainer.appendChild(secaoGoogle);

        leadsGoogle.slice(0, googleLimite).forEach(item => {
            const card = document.createElement('div');
            card.className = 'lead-card';
            card.innerHTML = `
            <strong>${item.nome}</strong>
            <span>📱 ${item.telefone}</span>
            <span>🔗 ${item.site}</span>
            `;
            googleContainer.appendChild(card);
        });

        const googleBtnContainer = document.createElement('div');
        googleBtnContainer.style.display = 'flex';
        googleBtnContainer.style.gap = '10px';
        googleBtnContainer.style.marginTop = '10px';
        googleBtnContainer.style.marginBottom = '10px';

        adicionarBotoesDePaginacao(googleLimite, leadsGoogle.length, googleBtnContainer, 'google');

        if (googleBtnContainer.childNodes.length > 0) {
            googleContainer.appendChild(googleBtnContainer);
        }
        
        resultsLista.appendChild(googleContainer);
    }

    // seção do Linkedin
    if (leadsLinkedIn.length > 0) {
        const linkedinContainer = document.createElement('div');
        linkedinContainer.className = 'platform-group linkedin-group';

        const sectionLinkedIn = document.createElement('div');
        const margemTopo = leadsGoogle.length > 0 ? "20px" : "10px";
        sectionLinkedIn.innerHTML = `<h3 style="color: #EDEAE0; margin: ${margemTopo} 0 10px 0; font-size: 14px; display: flex; align-items: center; gap: 6px;">
            <svg width="16" height="16" fill="currentColor">
                <use href="#icon-linkedin"></use>
            </svg>LinkedIn (${leadsLinkedIn.length} leads)
        </h3>`;
        linkedinContainer.appendChild(sectionLinkedIn);

        leadsLinkedIn.slice(0, linkedinLimite).forEach(item => {
            const card = document.createElement('div');
            card.className = 'lead-card';
            card.innerHTML = `
            <strong>${item.nome}</strong>
            <span>💼 ${item.profissao}</span>
            <span>🔗 ${item.site}</span>
            `;
            linkedinContainer.appendChild(card);
        });

        const linkedinBtnContainer = document.createElement('div');
        linkedinBtnContainer.style.display = 'flex';
        linkedinBtnContainer.style.gap = '10px';
        linkedinBtnContainer.style.marginTop = '10px';
        linkedinBtnContainer.style.marginBottom = '10px';

        adicionarBotoesDePaginacao(linkedinLimite, leadsLinkedIn.length, linkedinBtnContainer, 'linkedin');

        if (linkedinBtnContainer.childNodes.length > 0) {
            linkedinContainer.appendChild(linkedinBtnContainer);
        }
        
        resultsLista.appendChild(linkedinContainer);
    }

    // seção do Instagram
    if (leadsInstagram.length > 0) {
        const instagramContainer = document.createElement('div');
        instagramContainer.className = 'platform-group instagram-group';

        const sectionInstagram = document.createElement('div');
        const margemTopo = (leadsGoogle.length > 0 || leadsLinkedIn.length > 0) ? "20px" : "10px";
        sectionInstagram.innerHTML = `<h3 style="color: #EDEAE0; margin: ${margemTopo} 0 10px 0; font-size: 14px; display: flex; align-items: center; gap: 6px;">
            <svg width="16" height="16" fill="currentColor">
                <use href="#icon-instagram"></use>
            </svg>Instagram (${leadsInstagram.length} leads)
        </h3>`;
        instagramContainer.appendChild(sectionInstagram);

        leadsInstagram.slice(0, instagramLimite).forEach(item => {
            const card = document.createElement('div');
            card.className = 'lead-card';
            card.innerHTML = `
            <strong>${item.nome}</strong>
            <span>🔗 ${item.site}</span>
            `;
            instagramContainer.appendChild(card);
        });

        const instagramBtnContainer = document.createElement('div');
        instagramBtnContainer.style.display = 'flex';
        instagramBtnContainer.style.gap = '10px';
        instagramBtnContainer.style.marginTop = '10px';
        instagramBtnContainer.style.marginBottom = '10px';

        adicionarBotoesDePaginacao(instagramLimite, leadsInstagram.length, instagramBtnContainer, 'instagram');

        if (instagramBtnContainer.childNodes.length > 0) {
            instagramContainer.appendChild(instagramBtnContainer);
        }
        
        resultsLista.appendChild(instagramContainer);
    }

    if (isHistorico) {
        const statusDiv = document.getElementById('status');
        if (statusDiv) {
            statusDiv.style.color = "#EDEAE0";
            statusDiv.innerText = `${leadsColetados.length} leads exibidos do histórico!`;
        }
    } else if (leadsColetados.length > 0) {
        // Mostra área de exportação se houver leads
        document.getElementById('exportArea').style.display = 'flex';
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
            exibirDetalhesDosLeads([], false);
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
            exibirDetalhesDosLeads([], false);
        });
        containerDeBotoes.appendChild(btnMenos);
    }
}

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
    window.location.href = 'popup.html';
});
