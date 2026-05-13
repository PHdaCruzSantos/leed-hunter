export const UI = {
    mudarTela: (tela) => {
        // Elementos globais
        const searchArea = document.getElementById('searchArea');
        const searchBtn = document.getElementById('searchBtn');
        const btnManageSites = document.getElementById('btnManageSites');
        const recentSearches = document.querySelector('.recent-searches');
        const manageSitesArea = document.getElementById('manageSitesArea');

        // Esconder tudo por padrão
        if (searchArea) searchArea.style.display = 'none';
        if (searchBtn) searchBtn.style.display = 'none';
        if (btnManageSites) btnManageSites.style.display = 'none';
        if (recentSearches) recentSearches.style.display = 'none';
        if (manageSitesArea) manageSitesArea.style.display = 'none';

        // Mostrar apenas o necessário para cada tela
        if (tela === 'home') {
            if (searchArea) searchArea.style.display = 'block';
            if (searchBtn) searchBtn.style.display = 'flex';
            if (btnManageSites) btnManageSites.style.display = 'block';
            if (recentSearches) recentSearches.style.display = 'flex';
        } 
        else if (tela === 'manage') {
            if (manageSitesArea) manageSitesArea.style.display = 'flex';
        } 
    }
};
