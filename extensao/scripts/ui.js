export const UI = {
    mudarTela: (tela) => {
        // Elementos globais
        const searchArea = document.getElementById('searchArea');
        const searchBtn = document.getElementById('searchBtn');
        const btnManageSites = document.getElementById('btnManageSites');
        const recentSearches = document.querySelector('.recent-searches');
        const status = document.getElementById('status');
        const manageSitesArea = document.getElementById('manageSitesArea');
        const btnBack = document.getElementById('btnBack');
        const exportArea = document.getElementById('exportArea');

        // Esconder tudo por padrão
        if (searchArea) searchArea.style.display = 'none';
        if (searchBtn) searchBtn.style.display = 'none';
        if (btnManageSites) btnManageSites.style.display = 'none';
        if (recentSearches) recentSearches.style.display = 'none';
        if (manageSitesArea) manageSitesArea.style.display = 'none';
        if (btnBack) btnBack.style.display = 'none';
        if (exportArea) exportArea.style.display = 'none';
        if (status) status.style.display = 'none';

        // Mostrar apenas o necessário para cada tela
        if (tela === 'home') {
            if (searchArea) searchArea.style.display = 'block';
            if (searchBtn) searchBtn.style.display = 'flex';
            if (btnManageSites) btnManageSites.style.display = 'block';
            if (recentSearches) recentSearches.style.display = 'flex';
            if (status) status.style.display = 'block';
        } 
        else if (tela === 'manage') {
            if (manageSitesArea) manageSitesArea.style.display = 'flex';
        } 
        else if (tela === 'results') {
            if (btnBack) btnBack.style.display = 'block';
            if (exportArea) exportArea.style.display = 'flex';
            if (status) status.style.display = 'block';
        }
        else if (tela === 'searching') {
            if (btnBack) btnBack.style.display = 'block';
            if (status) status.style.display = 'block';
        }
    }
};
