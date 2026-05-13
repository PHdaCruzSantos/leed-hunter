async function extrairDadosBusca() {
    const leadsColetados = [];

    try {
        const resposta = await fetch(window.location.href);
        const dadosJson = await resposta.json();

        if (dadosJson.users && dadosJson.users.length > 0) {
            dadosJson.users.forEach(item => {
                const usuario = item.user;
                const siteFormatado = formataLink(`https://www.instagram.com/${usuario.username}/`);

                leadsColetados.push({
                    nome: usuario.full_name || usuario.username,
                    site: siteFormatado,
                    origem: window.location.href
                });
            });
        }
    } catch (erro) {
        console.error("Falha no Instagram:", erro.message);
    }

    enviarDadosColetados(leadsColetados);
    return leadsColetados;
}

const delayHumano = Math.floor(Math.random() * 2000) + 1500;

setTimeout(extrairDadosBusca, delayHumano);
