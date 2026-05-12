const SELETORES = {
    container_lista: 'div[class="VkpGBb"]', 
    nome: 'div[role="heading"][aria-level="3"] span',
    links_contato: 'a[href]'
};

function extrairDadosBusca() {

    const blocos = document.querySelectorAll(SELETORES.container_lista);
    const listaResultados = [];

    blocos.forEach(bloco => {
        const nome = bloco.querySelector(SELETORES.nome)?.innerText ?? "N/A";
        const textoBruto = bloco.innerText;
        const regexTelefone = /\(\d{2}\)\s\d{4,5}-\d{4}/;
        const telefone = textoBruto.match(regexTelefone)?.[0] ?? "Sem telefone";
        const linkElemento = bloco.querySelector(SELETORES.links_contato);
        let site = "";
        if (linkElemento && linkElemento.href.includes('maps')) {
            site = "Sem site";
        } else {
            site = formataLink(linkElemento);
        }
        
        listaResultados.push({
            nome: nome,
            telefone: telefone,
            site: site,
            origem: window.location.href 
        });
        
    });
    
    enviarDadosColetados(listaResultados);
    return listaResultados;
}

setTimeout(extrairDadosBusca, 2000);

