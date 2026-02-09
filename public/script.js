// Elementos DOM
const cnpjInput = document.getElementById('cnpjInput');
const searchBtn = document.getElementById('searchBtn');
const errorMessage = document.getElementById('errorMessage');
const loading = document.getElementById('loading');
const searchSection = document.getElementById('searchSection');
const resultsSection = document.getElementById('resultsSection');
const cardsContainer = document.getElementById('cardsContainer');
const historyGrid = document.getElementById('historyGrid');
const historySection = document.getElementById('historySection');

// API endpoint - usar rota relativa para funcionar em qualquer ambiente
const API_ENDPOINT = '/api/cnpj';

// Gerenciamento de histórico (máx 10 itens)
const MAX_HISTORY = 10;
const HISTORY_KEY = 'cnpj_search_history';

// Aplicar máscara ao input
cnpjInput.addEventListener('input', (e) => {
    let value = e.target.value.replace(/\D/g, '');
    
    if (value.length > 14) {
        value = value.slice(0, 14);
    }
    
    // Aplicar máscara: XX.XXX.XXX/XXXX-XX
    if (value.length <= 2) {
        e.target.value = value;
    } else if (value.length <= 5) {
        e.target.value = value.slice(0, 2) + '.' + value.slice(2);
    } else if (value.length <= 8) {
        e.target.value = value.slice(0, 2) + '.' + value.slice(2, 5) + '.' + value.slice(5);
    } else if (value.length <= 12) {
        e.target.value = value.slice(0, 2) + '.' + value.slice(2, 5) + '.' + value.slice(5, 8) + '/' + value.slice(8);
    } else {
        e.target.value = value.slice(0, 2) + '.' + value.slice(2, 5) + '.' + value.slice(5, 8) + '/' + value.slice(8, 12) + '-' + value.slice(12);
    }
});

// Permitir Enter para buscar
cnpjInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !searchBtn.disabled) {
        handleSearch();
    }
});

// Função para sanitizar CNPJ
function sanitizeCNPJ(cnpj) {
    return cnpj.replace(/\D/g, '');
}

// Função para validar CNPJ
function isValidCNPJ(cnpj) {
    const sanitized = sanitizeCNPJ(cnpj);
    
    // Deve ter exatamente 14 dígitos
    if (sanitized.length !== 14) {
        return false;
    }
    
    // Não pode ser sequência de números iguais
    if (/^(\d)\1{13}$/.test(sanitized)) {
        return false;
    }
    
    return true;
}

// Função para formatar situação
function formatSituation(situacao) {
    const situacaoUpper = situacao.toUpperCase();
    
    if (situacaoUpper === 'ATIVA') {
        return `<span class="status-ativa">${situacao}</span>`;
    } else if (situacaoUpper.includes('BAIXADA') || situacaoUpper.includes('INAPTA')) {
        return `<span class="status-inativa">${situacao}</span>`;
    } else {
        return `<span class="status-suspensa">${situacao}</span>`;
    }
}

// ====== FUNÇÕES DE HISTÓRICO ======

// Obter histórico do localStorage
function getHistory() {
    const history = localStorage.getItem(HISTORY_KEY);
    return history ? JSON.parse(history) : [];
}

// Salvar histórico no localStorage
function saveHistory(history) {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
}

// Adicionar nova consulta ao histórico
function addToHistory(cnpj, companyData) {
    const history = getHistory();
    const sanitizedCnpj = sanitizeCNPJ(cnpj);
    
    // Remover duplicatas (se a mesma empresa foi consultada antes)
    const filtered = history.filter(item => sanitizeCNPJ(item.cnpj) !== sanitizedCnpj);
    
    // Adicionar nova consulta no início WITH dados completos
    filtered.unshift({
        cnpj: formataCNPJ(sanitizedCnpj),
        name: companyData.nome || 'Empresa desconhecida',
        data: companyData, // Armazenar dados completos para evitar chamada à API
        timestamp: new Date().toISOString()
    });
    
    // Manter apenas os últimos MAX_HISTORY itens
    const limited = filtered.slice(0, MAX_HISTORY);
    
    saveHistory(limited);
    renderHistory();
}

// Renderizar histórico na tela
function renderHistory() {
    const history = getHistory();
    
    if (history.length === 0) {
        historyGrid.innerHTML = '<p class="empty-message">Nenhuma consulta realizada ainda</p>';
        return;
    }
    
    let html = '';
    history.forEach((item, index) => {
        html += `
            <div class="history-card" onclick="searchFromHistory('${item.cnpj}')">
                <div class="history-card-cnpj">${item.cnpj}</div>
                <div class="history-card-company" title="${item.name}">${item.name}</div>
            </div>
        `;
    });
    
    historyGrid.innerHTML = html;
}

// Função para buscar a partir do histórico
function searchFromHistory(cnpj) {
    const history = getHistory();
    const item = history.find(h => h.cnpj === cnpj);
    
    if (item && item.data) {
        // Usar dados em cache, sem chamar a API
        cnpjInput.value = cnpj;
        displayResults(item.data);
    } else {
        // Se não houver dados em cache, digitar no input e fazer a busca normalmente
        cnpjInput.value = cnpj;
        cnpjInput.focus();
        handleSearch();
    }
}

// ====== FIM DE FUNÇÕES DE HISTÓRICO ======

// Função para exibir resultados (reutilizável)
function displayResults(data) {
    // Esconder search section e mostrar results
    searchSection.classList.remove('active');
    resultsSection.classList.add('active');
    
    // Renderizar cards
    cardsContainer.innerHTML = createResultCards(data);
}

// ====== FIM DE FUNÇÃO AUXILIAR ======

// Função para criar cards de resultado
function createResultCards(data) {
    const cards = [
        {
            title: 'Razão Social',
            value: data.nome,
            emphasis: true
        },
        {
            title: 'Nome Fantasia',
            value: data.fantasia || 'Não informado'
        },
        {
            title: 'CNPJ',
            value: formataCNPJ(data.cnpj),
            emphasis: true
        },
        {
            title: 'Situação Cadastral',
            value: formatSituation(data.situacao),
            isHTML: true
        },
        {
            title: 'Data de Abertura',
            value: formatDate(data.abertura)
        },
        {
            title: 'Natureza Jurídica',
            value: data.natureza_juridica || 'Não informado'
        },
        // Dados de Endereço
        {
            title: 'Logradouro',
            value: data.logradouro || 'Não informado'
        },
        {
            title: 'Número',
            value: data.numero || 'S/N'
        },
        {
            title: 'Bairro',
            value: data.bairro || 'Não informado'
        },
        {
            title: 'Cidade',
            value: data.municipio || 'Não informado'
        },
        {
            title: 'UF',
            value: data.uf || 'Não informado'
        },
        {
            title: 'CEP',
            value: data.cep || 'Não informado'
        }
    ];
    
    let html = '';
    cards.forEach(card => {
        html += `
            <div class="card">
                <div class="card-title">${card.title}</div>
                <div class="card-value ${card.emphasis ? 'emphasis' : ''}">
                    ${card.isHTML ? card.value : escapeHTML(card.value)}
                </div>
            </div>
        `;
    });
    
    return html;
}

// Função para formatar CNPJ
function formataCNPJ(cnpj) {
    const sanitized = sanitizeCNPJ(cnpj);
    return sanitized.slice(0, 2) + '.' + sanitized.slice(2, 5) + '.' + sanitized.slice(5, 8) + '/' + sanitized.slice(8, 12) + '-' + sanitized.slice(12);
}

// Função para formatar data
function formatDate(dateStr) {
    if (!dateStr) return 'Não informado';
    
    try {
        // Tentar múltiplos formatos
        let year, month, day;
        
        // Formato YYYY-MM-DD
        if (dateStr.includes('-')) {
            [year, month, day] = dateStr.split('-');
        }
        // Formato DD/MM/YYYY
        else if (dateStr.includes('/')) {
            [day, month, year] = dateStr.split('/');
        }
        // Se não conseguiu, retornar como está
        else {
            return dateStr;
        }
        
        // Validar se os valores são válidos
        if (!year || !month || !day) {
            return dateStr;
        }
        
        year = year.trim();
        month = month.trim();
        day = day.trim();
        
        return `${day}/${month}/${year}`;
    } catch (e) {
        return dateStr;
    }
}

// Função para escapar HTML (prevenir XSS)
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

// Função de busca
async function handleSearch() {
    const cnpj = cnpjInput.value.trim();
    
    // Limpar mensagem de erro
    errorMessage.textContent = '';
    
    // Validar CNPJ
    if (!cnpj) {
        errorMessage.textContent = 'Por favor, digite um CNPJ.';
        return;
    }
    
    if (!isValidCNPJ(cnpj)) {
        errorMessage.textContent = 'CNPJ inválido. Por favor, verifique e tente novamente.';
        return;
    }
    
    // Mostrar loading
    loading.classList.add('active');
    searchBtn.disabled = true;
    cnpjInput.disabled = true;
    
    try {
        const sanitized = sanitizeCNPJ(cnpj);
        
        // Fazer requisição para o proxy
        const response = await fetch(`${API_ENDPOINT}/${sanitized}`);
        
        if (!response.ok) {
            if (response.status === 429) {
                throw new Error('Limite de requisições atingido. Por favor, aguarde alguns momentos e tente novamente.');
            } else if (response.status === 404) {
                throw new Error('CNPJ não encontrado na base de dados.');
            } else {
                throw new Error('Erro ao consultar API. Por favor, tente novamente.');
            }
        }
        
        const data = await response.json();
        
        // Adicionar ao histórico COM dados completos
        addToHistory(sanitized, data);
        
        // Exibir resultados
        displayResults(data);
        
    } catch (error) {
        console.error('Erro:', error);
        errorMessage.textContent = error.message || 'Erro ao consultar CNPJ. Por favor, tente novamente.';
    } finally {
        loading.classList.remove('active');
        searchBtn.disabled = false;
        cnpjInput.disabled = false;
    }
}

// Função para limpar
function handleClear() {
    cnpjInput.value = '';
    errorMessage.textContent = '';
    cardsContainer.innerHTML = '';
    searchSection.classList.add('active');
    resultsSection.classList.remove('active');
    cnpjInput.focus();
}

// Inicializar
document.addEventListener('DOMContentLoaded', () => {
    cnpjInput.focus();
    searchSection.classList.add('active');
    renderHistory(); // Carregar histórico na página inicial
});
