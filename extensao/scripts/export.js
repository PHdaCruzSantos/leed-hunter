export function downloadCSV(lista_de_leads, termo = "Busca", data = "") {
    if (!data) data = new Date().toLocaleDateString('pt-BR');

    const leadsGoogle = lista_de_leads.filter(item => item.origem && item.origem.includes('google'));
    const leadsLinkedin = lista_de_leads.filter(item => item.origem && item.origem.includes('linkedin'));
    const leadsInstagram = lista_de_leads.filter(item => item.origem && item.origem.includes('instagram'));
    const sep = ";";
    let csv = `Busca: ${termo}${sep}${sep}\n`;

    csv += `Data: ${data} | Leads coletados: ${lista_de_leads.length}${sep}${sep}\n\n`;

    const criarSecao = (titulo, colunas) => {
        let bloco = "";
        bloco += `${sep}${titulo.toUpperCase()}${sep}\n`;
        bloco += colunas.join(sep) + "\n";
        return bloco;
    };

    // --- SEÇÃO GOOGLE ---
    csv += criarSecao("Leads coletados no Google", ["Nome", "Telefone", "Site"]);
    leadsGoogle.forEach(item => {
        csv += `"${item.nome}"${sep}"${item.telefone}"${sep}"${item.site}"\n`;
    });

    // --- SEÇÃO LINKEDIN ---
    csv += "\n" + criarSecao("Leads coletados no LinkedIn", ["Nome", "Profissão", "Site"]);
    leadsLinkedin.forEach(item => {
        csv += `"${item.nome}"${sep}"${item.profissao || ''}"${sep}"${item.site}"\n`;
    });

    // --- SEÇÃO INSTAGRAM ---
    csv += "\n" + criarSecao("Leads coletados no Instagram", ["Nome", "Link da Conta", "Site"]);
    leadsInstagram.forEach(item => {
        csv += `"${item.nome}"${sep}"${item.site}"${sep}""\n`;
    });

    const blob = new Blob(["\ufeff" + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `leads_${termo.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}



export function downloadPDF(lista_de_leads, termo = "Busca", data = "") {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

    if (!data) data = new Date().toLocaleDateString('pt-BR');

    const W = 210, H = 297;

    // ── CORES em RGB (jsPDF não suporta hex com alpha) ──
    const C = {
        bg: [247, 248, 250],   // #F7F8FA
        white: [255, 255, 255],
        dark: [17, 24, 39],    // #111827
        medium: [55, 65, 81],    // #374151
        muted: [156, 163, 175],   // #9CA3AF
        border: [229, 231, 235],   // #E5E7EB
        accent: [37, 99, 235],   // #2563EB
        accentLt: [239, 246, 255],   // #EFF6FF
        tagBg: [243, 244, 246],   // #F3F4F6
        headerBg: [17, 24, 39],    // #111827
        chipBg: [30, 58, 95],    // #1E3A5F
        chipVal: [147, 197, 253],   // #93C5FD
        chipLbl: [100, 116, 155],   // #64748B
        headerLine: [255, 255, 255],   // branco (sem alpha — usamos opacidade via cor mais escura)
        accentBar: [30, 64, 175],   // azul um pouco mais escuro pra barra lateral do card
    };

    function fill(color) { doc.setFillColor(color[0], color[1], color[2]); }
    function stroke(color) { doc.setDrawColor(color[0], color[1], color[2]); }
    function text(color) { doc.setTextColor(color[0], color[1], color[2]); }

    function rr(x, y, w, h, r, fillColor, strokeColor, lineW = 0.3) {
        if (fillColor) fill(fillColor);
        if (strokeColor) { stroke(strokeColor); doc.setLineWidth(lineW); }
        else { doc.setDrawColor(0, 0, 0, 0); doc.setLineWidth(0); }
        const mode = fillColor && strokeColor ? "FD" : fillColor ? "F" : "D";
        doc.roundedRect(x, y, w, h, r, r, mode);
    }

    // ── HEADER ─────────────────────────────────────
    function desenharHeader() {
        // Background geral
        fill(C.bg);
        doc.rect(0, 0, W, H, "F");

        // Header escuro
        fill(C.headerBg);
        doc.rect(0, 0, W, 58, "F");

        // Linha azul topo
        fill(C.accent);
        doc.rect(0, 0, W, 1.5, "F");

        // ── Dot grid decorativo (canto direito do header) ──
        // Cor sólida levemente mais clara que o header
        doc.setFillColor(35, 45, 65);
        for (let row = 0; row < 5; row++) {
            for (let col = 0; col < 8; col++) {
                doc.circle(W - 60 + col * 7, 10 + row * 9, 0.8, "F");
            }
        }

        // Título
        text(C.white);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(22);
        doc.text("Relatório de Leads", 14, 18);

        // Subtítulo
        text(C.muted);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.text(`Extração Inteligente  ·  Busca: ${termo}`, 14, 26);

        // ── Traço separador visível ──
        doc.setDrawColor(55, 65, 90);   // azul-acinzentado sólido, visível no fundo escuro
        doc.setLineWidth(0.4);
        doc.line(14, 31, W - 14, 31);

        // ── Chips ──
        const stats = [
            { val: String(lista_de_leads.length), label: "leads coletados", w: 42 },
            { val: data, label: "data de extração", w: 50 },
        ];

        let chipX = 14;
        stats.forEach(({ val, label, w }) => {
            rr(chipX, 36, w, 13, 2, C.chipBg);

            text(C.chipVal);
            doc.setFont("helvetica", "bold");
            doc.setFontSize(8.5);
            doc.text(val, chipX + w / 2, 43, { align: "center" });

            text(C.chipLbl);
            doc.setFont("helvetica", "normal");
            doc.setFontSize(7.5);
            doc.text(label, chipX + w / 2, 47.5, { align: "center" });

            chipX += w + 4;
        });
    }

    // ── FOOTER ─────────────────────────────────────
    function desenharFooter() {
        stroke(C.border);
        doc.setLineWidth(0.3);
        doc.line(14, H - 14, W - 14, H - 14);

        text(C.muted);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7.5);
        doc.text(
            `Gerado automaticamente em ${data}  ·  Dados coletados via Extração Inteligente`,
            14, H - 8
        );

        text(C.accent);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(7.5);
        doc.text("Confidencial", W - 14, H - 8, { align: "right" });
    }

    // ── LABEL DE SEÇÃO ─────────────────────────────
    function desenharSecaoLabel(label, y) {
        text(C.headerBg);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.text(label, 14, y);
        stroke(C.border);
        doc.setLineWidth(0.3);
        doc.line(14, y + 2, W - 14, y + 2);
    }

    // ── CARDS ──────────────────────────────────────
    function renderizarCards(leads, secaoLabel) {
        const colMargin = 14, colGap = 4;
        const colW = (W - 2 * colMargin - colGap) / 2;  // ~94mm cada coluna
        const cardH = 22;
        const cardGap = 2;
        const cardsPorPagina = 12; // 6 linhas × 2 colunas

        leads.forEach((item, i) => {
            const posNaPagina = i % cardsPorPagina;

            if (posNaPagina === 0 && i !== 0) {
                desenharFooter();
                doc.addPage();
                desenharHeader();
                desenharSecaoLabel(secaoLabel, 68);
            }

            const col = posNaPagina % 2;
            const row = Math.floor(posNaPagina / 2);
            const cx = colMargin + col * (colW + colGap);
            const cy = 74 + row * (cardH + cardGap);

            // Sombra simulada (retângulo levemente deslocado)
            fill([220, 222, 226]);
            doc.roundedRect(cx + 0.5, cy + 0.5, colW, cardH, 3, 3, "F");

            // Card branco
            rr(cx, cy, colW, cardH, 3, C.white, C.border, 0.3);

            // Barra accent esquerda
            fill(C.accent);
            doc.roundedRect(cx, cy, 2.5, cardH, 1.5, 1.5, "F");

            // ── Badge número ──
            const badgeX = cx + 5;
            const badgeY = cy + 5;   // topo do card com margem
            rr(badgeX, badgeY, 8, 5.5, 1.5, C.accentLt);
            text(C.accent);
            doc.setFont("helvetica", "bold");
            doc.setFontSize(7);
            doc.text(String(i + 1).padStart(2, "0"), badgeX + 4, badgeY + 3.8, { align: "center" });

            // ── Nome ao lado do badge ──
            let nome = item.nome || "";
            if (nome.length > 26) nome = nome.slice(0, 24) + "…";
            text(C.dark);
            doc.setFont("helvetica", "bold");
            doc.setFontSize(9);
            doc.text(nome, badgeX + 10, badgeY + 3.8);

            // ── Telefone / Profissão ──
            const infoSecundaria = item.telefone || item.profissao || "";
            text(C.muted);
            doc.setFont("helvetica", "normal");
            doc.setFontSize(8);
            doc.text(infoSecundaria, cx + 5, cy + cardH - 7);

            // ── Tag "Ver contato" (estilo link azul) ──
            const tagW = 22, tagH = 6;
            const tagX = cx + colW - tagW - 3;
            const tagY = cy + cardH - tagH - 3;
            rr(tagX, tagY, tagW, tagH, 2, C.accentLt);
            text(C.accent);
            doc.setFont("helvetica", "bold");
            doc.setFontSize(7);
            doc.text("Ver contato →", tagX + tagW / 2, tagY + 3.8, { align: "center" });

            // Link clicável na tag
            let urlPura = extrairUrl(item.site);
            if (urlPura && urlPura !== "Sem site") {
                if (!urlPura.startsWith("http")) urlPura = "https://" + urlPura;
                doc.link(tagX, tagY, tagW, tagH, { url: urlPura });
            }
        });
    }

    // ── MONTAR PDF ─────────────────────────────────
    const leadsGoogle = lista_de_leads.filter(i => i.origem && i.origem.includes('google'));
    const leadsLinkedin = lista_de_leads.filter(i => i.origem && i.origem.includes('linkedin'));
    const leadsInstagram = lista_de_leads.filter(i => i.origem && i.origem.includes('instagram'));

    // Monta as seções dinamicamente 
    const secoes = [];
    if (leadsGoogle.length > 0) secoes.push({ leads: leadsGoogle, label: "LEADS IDENTIFICADOS — GOOGLE" });
    if (leadsLinkedin.length > 0) secoes.push({ leads: leadsLinkedin, label: "LEADS IDENTIFICADOS — LINKEDIN" });
    if (leadsInstagram.length > 0) secoes.push({ leads: leadsInstagram, label: "LEADS IDENTIFICADOS — INSTAGRAM" });

    // Página 1 — header já desenhado
    desenharHeader();

    secoes.forEach((secao, index) => {
        if (index > 0) {
            desenharFooter();
            doc.addPage();
            desenharHeader();
        }
        desenharSecaoLabel(secao.label, 68);
        renderizarCards(secao.leads, secao.label);
    });

    desenharFooter();
    doc.save(`leads_${termo.replace(/\s+/g, '_')}.pdf`);
}

function extrairUrl(htmlString) {
    if (!htmlString) return "";
    const match = htmlString.match(/href="([^"]*)"/);
    if (match && match[1]) return match[1];
    return htmlString.trim();
}