const SELETORES = {
    link_perfil: 'a[href*="/company/"]',
    profissao: 'div > p > span'
};

const mensagem = "[LINKEDIN]chegou no scraper linkedin";
chrome.runtime.sendMessage({
    action: "DEBUG_LOG",
    dados: mensagem
});

function detectarLoginLinkedIn() {
    const urlAtual = window.location.href;

    // Verifica por redirecionamento de URL para páginas de login conhecidas
    if (
        urlAtual.includes('/login') ||
        urlAtual.includes('/authwall') ||
        urlAtual.includes('/checkpoint') ||
        urlAtual.includes('/uas/login') ||
        urlAtual.includes('/signup')
    ) {
        return true;
    }

    // Verifica por elementos de login que aparecem como overlay na própria página de resultados
    // (LinkedIn frequentemente não redireciona, mas mostra um bloqueio na mesma URL)
    const seletoresDeLogin = [
        'form[action*="/uas/login"]',
        'form[action*="/login"]',
        '.login__form',
        'input[name="session_key"]',
        '.authwall-join-form',
        '[data-test-id="login-form"]',
        '.join-page',
    ];

    return seletoresDeLogin.some(seletor => !!document.querySelector(seletor));
}


function extrairDadosBusca() {
    // Detecta redirecionamento ou overlay de login
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

    enviarDadosColetados(listaResultados);
    return listaResultados;
}

setTimeout(extrairDadosBusca, 2000);