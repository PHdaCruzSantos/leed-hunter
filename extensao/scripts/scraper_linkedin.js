const SELETORES = {
    link_perfil: 'a[href*="/in/"]',
    profissao: 'p'
};

function extrairDadosBusca() {

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