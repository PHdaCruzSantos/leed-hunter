import { UI } from '../scripts/ui.js'

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

// Carregar e salvar preferências de busca
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

// Alerta de login para LinkedIn e Instagram
document.querySelectorAll('.btn-login-info').forEach(btn => {
    btn.addEventListener('click', () => {
        const plataforma = btn.dataset.platform;
        const nomes = { linkedin: 'LinkedIn', instagram: 'Instagram' };
        const urls = {
            linkedin: 'https://www.linkedin.com/login',
            instagram: 'https://www.instagram.com/accounts/login/'
        };

        // Remove tooltip anterior se existir
        document.querySelectorAll('.login-tooltip, .login-tooltip-overlay').forEach(el => el.remove());

        const overlay = document.createElement('div');
        overlay.className = 'login-tooltip-overlay';

        const tooltip = document.createElement('div');
        tooltip.className = 'login-tooltip';
        tooltip.innerHTML = `
            <p>Para coletar leads do <strong>${nomes[plataforma]}</strong>, é necessário efetuar o login antes de iniciar a busca.</p>
            <button class="btn-close-tooltip">Entendi</button>
        `;

        document.body.appendChild(overlay);
        document.body.appendChild(tooltip);

        const fechar = () => {
            overlay.remove();
            tooltip.remove();
        };

        tooltip.querySelector('.btn-close-tooltip').addEventListener('click', fechar);
        overlay.addEventListener('click', fechar);
    });
});

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
            li.style.background = "#111111";

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

                chrome.storage.local.set({
                    acaoPendente: {
                        tipo: 'historico',
                        termo: item.termo,
                        data: item.data,
                        leads: leadsParaExibir
                    }
                }, () => {
                    window.location.href = 'resultados.html';
                });
            });
            ul.appendChild(li);
        });
        container.appendChild(ul);
    });
}

function iniciarBusca() {
    const termo = document.getElementById('searchTerm').value;
    if (!termo.trim()) return;

    chrome.storage.local.set({
        acaoPendente: {
            tipo: 'nova_busca',
            termo: termo
        }
    }, () => {
        window.location.href = 'resultados.html';
    });
}

document.getElementById('searchBtn').addEventListener('click', iniciarBusca);

document.getElementById('searchTerm').addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
        iniciarBusca();
    }
});
