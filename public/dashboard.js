// Constantes
const HISTORY_KEY = 'cnpj_search_history';

// Obter histórico
function getHistory() {
    const history = localStorage.getItem(HISTORY_KEY);
    return history ? JSON.parse(history) : [];
}

// Calcular estatísticas
function calculateStats() {
    const history = getHistory();

    if (history.length === 0) {
        return null;
    }

    // Total de consultas
    const totalConsultas = history.length;

    // Empresas únicas
    const uniqueCompanies = new Set(history.map(h => h.cnpj)).size;

    // Contar consultas por empresa
    const companyCount = {};
    history.forEach(item => {
        const key = item.cnpj;
        companyCount[key] = (companyCount[key] || 0) + 1;
    });

    // Ordenar por frequência
    const topCompanies = Object.entries(companyCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([cnpj, visits]) => {
            const company = history.find(h => h.cnpj === cnpj);
            return {
                cnpj,
                name: company?.name || 'Desconhecida',
                visits
            };
        });

    // Data da primeira consulta
    const firstDate = new Date(history[history.length - 1].timestamp);

    // Dias desde primeira consulta
    const daysSinceFirst = Math.floor((new Date() - firstDate) / (1000 * 60 * 60 * 24));

    return {
        totalConsultas,
        uniqueCompanies,
        topCompanies,
        firstDate,
        daysSinceFirst,
        avgConsultasPerDay: (totalConsultas / (daysSinceFirst + 1)).toFixed(1)
    };
}

// Renderizar estatísticas
function renderStats() {
    const stats = calculateStats();
    const statsGrid = document.getElementById('statsGrid');
    const topCompaniesDiv = document.getElementById('topCompanies');

    if (!stats) {
        statsGrid.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px; color: var(--text-light);">
                <div style="font-size: 3rem; margin-bottom: 15px;">📭</div>
                <p>Nenhuma consulta realizada ainda. Faça sua primeira busca!</p>
                <a href="/" style="display: inline-block; margin-top: 20px; padding: 12px 24px; background: var(--primary); color: white; border-radius: 10px; text-decoration: none; font-weight: 700;">Ir para Busca</a>
            </div>
        `;
        topCompaniesDiv.innerHTML = topCompaniesDiv.innerHTML;
        return;
    }

    // Renderizar cards de estatísticas
    statsGrid.innerHTML = `
        <div class="stat-card">
            <h3>Total de Consultas</h3>
            <div class="stat-number">${stats.totalConsultas}</div>
            <div class="stat-subtitle">buscas realizadas</div>
        </div>
        <div class="stat-card">
            <h3>Empresas Únicas</h3>
            <div class="stat-number">${stats.uniqueCompanies}</div>
            <div class="stat-subtitle">empresas consultadas</div>
        </div>
        <div class="stat-card">
            <h3>Média de Consultas</h3>
            <div class="stat-number">${stats.avgConsultasPerDay}</div>
            <div class="stat-subtitle">por dia</div>
        </div>
        <div class="stat-card">
            <h3>Desde</h3>
            <div class="stat-number">${stats.daysSinceFirst}</div>
            <div class="stat-subtitle">dias em uso</div>
        </div>
    `;

    // Renderizar empresas mais consultadas
    if (stats.topCompanies.length === 0) {
        topCompaniesDiv.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 40px 20px; color: var(--text-light);">
                <div style="font-size: 2rem; margin-bottom: 10px;">📭</div>
                <p>Nenhuma empresa consultada ainda</p>
            </div>
        `;
    } else {
        topCompaniesDiv.innerHTML = stats.topCompanies.map((company, index) => `
            <div class="company-item">
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
                    <span style="font-size: 1.5rem;">🏆</span>
                    <span style="font-size: 1.2rem; font-weight: 700; color: var(--primary);">#${index + 1}</span>
                </div>
                <div class="company-name">${escapeHTML(company.name)}</div>
                <div class="company-cnpj">${company.cnpj}</div>
                <div class="company-visits">🔍 Consultada ${company.visits} ${company.visits === 1 ? 'vez' : 'vezes'}</div>
            </div>
        `).join('');
    }
}

// Escapar HTML
function escapeHTML(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

// Inicializar
document.addEventListener('DOMContentLoaded', () => {
    renderStats();

    // Observar mudanças no localStorage quando nova consulta é feita
    window.addEventListener('storage', () => {
        renderStats();
    });
});
