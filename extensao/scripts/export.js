export function downloadCSV(lista_de_leads, termo = "Busca", data = "") {
    if (!data) data = new Date().toLocaleDateString('pt-BR');

    const leadsGoogle = lista_de_leads.filter(item => item.origem && item.origem.includes('google'));
    const leadsLinkedin = lista_de_leads.filter(item => item.origem && item.origem.includes('linkedin'));

    let csv = `Busca: ${termo}\nData: ${data} | Leads coletados: ${lista_de_leads.length}\n\n`;

    csv += "Leads coletados no Google:\nNome,Telefone,Site\n";
    leadsGoogle.forEach(item => {
        csv += `"${item.nome}","${item.telefone}","${item.site}"\n`;
    });

    csv += "\nLeads coletados no LinkedIn:\nNome,Profissao,Site\n";
    leadsLinkedin.forEach(item => {
        csv += `"${item.nome}","${item.profissao || item.telefone || ''}","${item.site}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "leads_extraidos.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
}

export function downloadPDF(lista_de_leads, termo = "Busca", data = "") {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    if (!data) data = new Date().toLocaleDateString('pt-BR');

    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text(`Busca: ${termo}`, 10, 10);

    doc.setFontSize(10);
    doc.text(`Data: ${data} | Leads coletados: ${lista_de_leads.length}`, 10, 16);

    let y = 26; // Posição vertical inicial

    const leadsGoogle = lista_de_leads.filter(item => item.origem && item.origem.includes('google'));
    const leadsLinkedin = lista_de_leads.filter(item => item.origem && item.origem.includes('linkedin'));

    if (leadsGoogle.length > 0) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.text("Leads coletados no Google:", 10, y);
        y += 8;

        leadsGoogle.forEach((item, i) => {
            if (y > 270) {
                doc.addPage();
                y = 20;
            }

            const labelNome = `${i + 1}. Nome:`;
            doc.setFont("helvetica", "bold");
            doc.setFontSize(10);
            doc.text(labelNome, 10, y);
            const larguraNome = doc.getTextWidth(labelNome);
            doc.setFont("helvetica", "normal");
            doc.text(`${item.nome}`, 10 + larguraNome + 2, y);

            y += 6;
            const labelTel = `Telefone:`;
            doc.setFont("helvetica", "bold");
            doc.text(labelTel, 15, y);
            const larguraTel = doc.getTextWidth(labelTel);
            doc.setFont("helvetica", "normal");
            doc.text(`${item.telefone}`, 15 + larguraTel + 2, y);

            y += 6;
            const labelSite = `Site para contato:`;
            doc.setFont("helvetica", "bold");
            doc.text(labelSite, 15, y);
            const larguraSite = doc.getTextWidth(labelSite);

            desenharSiteParaContato(doc, item, y, 15 + larguraSite + 2);
            y += 12;
        });
    }

    if (leadsLinkedin.length > 0) {
        if (y > 260) {
            doc.addPage();
            y = 20;
        }
        y += 4;

        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.text("Leads coletados no LinkedIn:", 10, y);
        y += 8;

        leadsLinkedin.forEach((item, i) => {
            if (y > 270) {
                doc.addPage();
                y = 20;
            }

            const labelNome = `${i + 1}. Nome:`;
            doc.setFont("helvetica", "bold");
            doc.setFontSize(10);
            doc.text(labelNome, 10, y);
            const larguraNome = doc.getTextWidth(labelNome);
            doc.setFont("helvetica", "normal");
            doc.text(`${item.nome}`, 10 + larguraNome + 2, y);

            y += 6;
            const labelSite = `Site para contato:`;
            doc.setFont("helvetica", "bold");
            doc.text(labelSite, 15, y);
            const larguraSite = doc.getTextWidth(labelSite);

            desenharSiteParaContato(doc, item, y, 15 + larguraSite + 2);
            y += 12;
        });
    }

    doc.save("leads_extraidos.pdf");
}

function desenharSiteParaContato(doc, item, y, startX) {
    let urlPura = extrairUrl(item.site);

    if (urlPura != "Sem site") {
        if (!urlPura.startsWith('http')) {
            urlPura = 'https://' + urlPura;
        }

        const textoLink = "Entrar em contato";
        const larguraTexto = doc.getTextWidth(textoLink);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(0, 0, 0);
        doc.text(textoLink, startX, y);
        doc.line(startX, y + 1, startX + larguraTexto, y + 1);
        doc.link(startX, y - 3, larguraTexto, 6, { url: urlPura });
        doc.setTextColor(0, 0, 0);

    } else {
        doc.setFont("helvetica", "normal");
        doc.setTextColor(0, 0, 0);
        doc.text("Sem site", startX, y);
        doc.setTextColor(0, 0, 0);
    }
}

function extrairUrl(htmlString) {
    if (!htmlString) return "";
    const match = htmlString.match(/href="([^"]*)"/);
    if (match && match[1]) {
        return match[1];
    }
    return htmlString.trim();
}