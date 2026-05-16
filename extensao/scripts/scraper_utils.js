function enviarDadosColetados(listaResultados) {
    if (listaResultados.length > 0) {
        // Formata os dados para exibição na tabela no console do navegador
        const dadosTabela = listaResultados.map((lead, index) => {
            // Extrai a URL limpa da tag <a> do 'site', se possível
            const matchLink = lead.site.match(/href="([^"]*)"/);
            const linkLimpo = matchLink ? matchLink[1] : lead.site;
            return {
                "Lead": index + 1,
                "Nome": lead.nome,
                "Profissão": lead.profissao,
                "Link do Perfil": linkLimpo
            };
        });

        console.log(`%c[TABELA DE LEADS] Foram coletados ${listaResultados.length} resultados:`, "color: #00ff00; font-weight: bold; font-size: 14px;");
        console.table(dadosTabela);

        chrome.runtime.sendMessage({
            type: "DADOS_COLETADOS",
            dados: listaResultados
        });
    } else {
        console.log("%c[TABELA DE LEADS] Nenhum resultado coletado.", "color: #ff0000; font-weight: bold;");
        chrome.runtime.sendMessage({
            type: "SEM_RESULTADOS"
        });
    }
}

function formataLink(site) {
    if (!site) return '';
    return `<a href="${site}" target="_blank" rel="noopener noreferrer">Ver perfil</a>`;
}
