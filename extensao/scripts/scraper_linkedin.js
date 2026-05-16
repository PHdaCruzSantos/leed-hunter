const SELETORES = {
    link_perfil: 'a[href*="/company/"]',
    profissao: 'div > p > span'
};

function detectarLoginLinkedIn() {
    const urlAtual = window.location.href;

    if (
        urlAtual.includes('/login') ||
        urlAtual.includes('/authwall') ||
        urlAtual.includes('/checkpoint') ||
        urlAtual.includes('/uas/login') ||
        urlAtual.includes('/signup') ||
        urlAtual.includes('/onboarding') ||
        (urlAtual.includes('/feed') && !urlAtual.includes('/search'))
    ) {
        return true;
    }


    const seletoresDeLogin = [
        'form[action*="/uas/login"]',
        'form[action*="/login"]',
        '.login__form',
        'input[name="session_key"]',
        '.authwall-join-form',
        '[data-test-id="login-form"]',
        '.join-page',
        '.authwall',
        '#public_profile_contextual-sign-in',
        '.contextual-sign-in-modal',
        '.guest-results-container'
    ];

    return seletoresDeLogin.some(seletor => !!document.querySelector(seletor));
}

function extrairDadosBusca() {
    if (detectarLoginLinkedIn()) {
        chrome.runtime.sendMessage({
            action: "DEBUG_LOG",
            dados: "[LINKEDIN] Login detectado — enviando LOGIN_NECESSARIO"
        });
        chrome.runtime.sendMessage({
            type: "LOGIN_NECESSARIO",
            plataforma: "LinkedIn",
            url: "https://www.linkedin.com/login"
        });
        return;
    }

    chrome.runtime.sendMessage({
        action: "DEBUG_LOG",
        dados: "[LINKEDIN] Página de resultados carregada — iniciando extração"
    });

    const linksPerfil = document.querySelectorAll(SELETORES.link_perfil);
    const listaResultados = [];
    const perfisProcessados = new Set();

    linksPerfil.forEach(linkElemento => {

        const url = linkElemento.href.split('?')[0];

        if (perfisProcessados.has(url)) return;
        perfisProcessados.add(url);

        let nomeBruto = linkElemento.innerText.trim();
        let nome = nomeBruto ? nomeBruto.split('\n')[0].split('•')[0].trim() : "N/A";
        let profissao = "Não especificada";

        const paragrafos = linkElemento.querySelectorAll(SELETORES.profissao);

        if (paragrafos.length > 1) {
            profissao = paragrafos[1].innerText.trim();

        } else if (paragrafos.length === 1 && !paragrafos[0].innerText.includes(nome)) {
            profissao = paragrafos[0].innerText.trim();

        }

        const siteFormatado = formataLink(url);

        listaResultados.push({
            nome: nome,
            profissao: profissao,
            site: siteFormatado,
            origem: window.location.href
        });
    });

    if (listaResultados.length === 0) {
        // Fallback: Se não achou leads, verifica se há textos de login/signup na página
        const bodyText = document.body.innerText.toLowerCase();
        if (bodyText.includes('fazer login') || bodyText.includes('sign in') || bodyText.includes('cadastre-se') || bodyText.includes('join now')) {
            chrome.runtime.sendMessage({
                type: "LOGIN_NECESSARIO",
                plataforma: "LinkedIn",
                url: "https://www.linkedin.com/login"
            });
            return;
        }
    }

    enviarDadosColetados(listaResultados);
    return listaResultados;
}

setTimeout(extrairDadosBusca, 2000);