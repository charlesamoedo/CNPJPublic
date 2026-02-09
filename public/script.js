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
                <button class="history-card-delete" onclick="event.stopPropagation(); deleteFromHistory('${item.cnpj}')" title="Remover do histórico">🗑️</button>
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

// Função para deletar do histórico
function deleteFromHistory(cnpj) {
    const history = getHistory();
    
    // Confirmar antes de deletar
    if (!confirm(`Remover ${cnpj} do histórico?`)) {
        return;
    }
    
    // Filtrar e remover
    const filtered = history.filter(item => item.cnpj !== cnpj);
    saveHistory(filtered);
    renderHistory();
}

// ====== FIM DE FUNÇÕES DE HISTÓRICO ======

// Função para exibir resultados (reutilizável)
function displayResults(data) {
    currentResultData = data; // Armazenar para exportação
    
    // Esconder search section e mostrar results
    searchSection.classList.remove('active');
    resultsSection.classList.add('active');
    
    // Renderizar cards
    cardsContainer.innerHTML = createResultCards(data);
}

// ====== FIM DE FUNÇÃO AUXILIAR ======

// ====== FUNÇÕES DE EXPORTAÇÃO ======

// Armazenar dados da consulta atual para exportar
let currentResultData = null;

// Exportar para PDF
async function exportToPDF() {
    if (!currentResultData) {
        alert('Nenhum resultado para exportar');
        return;
    }

    try {
        // Carregar biblioteca jsPDF dinamicamente
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
        script.onload = () => {
            // Usar jsPDF nativo (sem biblioteca externa)
            generatePDFContent();
        };
        document.head.appendChild(script);

        // Gerar PDF com formato simples usando data URI
        generateSimplePDF();
    } catch (error) {
        console.error('Erro ao exportar PDF:', error);
        alert('Erro ao gerar PDF');
    }
}

// Gerar PDF simples usando HTML para PDF
function generateSimplePDF() {
    const data = currentResultData;
    const cnpj = formataCNPJ(data.cnpj);

    // Criar conteúdo HTML/CSS para PDF
    const pdfContent = `
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
            <meta charset="UTF-8">
            <style>
                body {
                    font-family: Arial, sans-serif;
                    margin: 20px;
                    color: #333;
                }
                .header {
                    border-bottom: 3px solid #6366f1;
                    padding-bottom: 20px;
                    margin-bottom: 30px;
                }
                .header h1 {
                    color: #6366f1;
                    margin: 0 0 10px 0;
                }
                .header p {
                    margin: 0;
                    color: #666;
                    font-size: 12px;
                }
                .content {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 20px;
                }
                .field {
                    flex: 1;
                    min-width: 250px;
                    border: 1px solid #ddd;
                    padding: 15px;
                    border-radius: 8px;
                    page-break-inside: avoid;
                }
                .field-label {
                    font-size: 12px;
                    color: #999;
                    text-transform: uppercase;
                    font-weight: bold;
                    margin-bottom: 5px;
                    letter-spacing: 1px;
                }
                .field-value {
                    font-size: 14px;
                    color: #333;
                    font-weight: 500;
                    word-break: break-word;
                }
                .emphasis {
                    color: #6366f1;
                    font-weight: 700;
                    font-size: 15px;
                }
                .status {
                    display: inline-block;
                    padding: 8px 12px;
                    border-radius: 6px;
                    font-size: 12px;
                    font-weight: 600;
                }
                .status-ativa {
                    background: #d1fae5;
                    color: #10b981;
                }
                .status-inativa {
                    background: #fee2e2;
                    color: #ef4444;
                }
                .footer {
                    margin-top: 30px;
                    padding-top: 20px;
                    border-top: 1px solid #ddd;
                    font-size: 11px;
                    color: #999;
                    text-align: center;
                }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>Relatório CNPJ - CNPJPublic</h1>
                <p>Gerado em ${new Date().toLocaleString('pt-BR')}</p>
            </div>

            <div class="content">
                <div class="field" style="flex: 1 1 100%;">
                    <div class="field-label">Razão Social</div>
                    <div class="field-value emphasis">${escapeHTML(data.nome || 'N/A')}</div>
                </div>

                <div class="field">
                    <div class="field-label">CNPJ</div>
                    <div class="field-value emphasis">${cnpj}</div>
                </div>

                <div class="field">
                    <div class="field-label">Nome Fantasia</div>
                    <div class="field-value">${escapeHTML(data.fantasia || 'Não informado')}</div>
                </div>

                <div class="field">
                    <div class="field-label">Situação Cadastral</div>
                    <div class="field-value">
                        <span class="status ${data.situacao.toUpperCase() === 'ATIVA' ? 'status-ativa' : 'status-inativa'}">
                            ${data.situacao}
                        </span>
                    </div>
                </div>

                <div class="field">
                    <div class="field-label">Data de Abertura</div>
                    <div class="field-value">${formatDate(data.abertura) || 'N/A'}</div>
                </div>

                <div class="field">
                    <div class="field-label">Natureza Jurídica</div>
                    <div class="field-value">${escapeHTML(data.natureza_juridica || 'Não informado')}</div>
                </div>

                <div class="field" style="flex: 1 1 100%;">
                    <div class="field-label">Endereço</div>
                    <div class="field-value">
                        ${escapeHTML(data.logradouro || 'Não informado')}, 
                        ${data.numero || 'S/N'}
                        ${data.complemento ? ', ' + escapeHTML(data.complemento) : ''}
                    </div>
                </div>

                <div class="field">
                    <div class="field-label">Bairro</div>
                    <div class="field-value">${escapeHTML(data.bairro || 'Não informado')}</div>
                </div>

                <div class="field">
                    <div class="field-label">Cidade/UF</div>
                    <div class="field-value">${escapeHTML(data.municipio || 'Não informado')} - ${data.uf || 'N/A'}</div>
                </div>

                <div class="field">
                    <div class="field-label">CEP</div>
                    <div class="field-value">${data.cep || 'Não informado'}</div>
                </div>

                <div class="field">
                    <div class="field-label">Telefone</div>
                    <div class="field-value">${data.telefone || 'Não informado'}</div>
                </div>

                <div class="field">
                    <div class="field-label">Email</div>
                    <div class="field-value">${data.email || 'Não informado'}</div>
                </div>
            </div>

            <div class="footer">
                <p>Dados fornecidos pela ReceitaWS © 2026 CNPJPublic</p>
            </div>
        </body>
        </html>
    `;

    // Criar blob e baixar
    const blob = new Blob([pdfContent], { type: 'text/html' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `CNPJ_${sanitizeCNPJ(data.cnpj)}_${new Date().getTime()}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    // Alternativa: usar print para PDF
    setTimeout(() => {
        const printWindow = window.open('', '', 'width=800,height=600');
        printWindow.document.write(pdfContent);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
    }, 100);
}

// ====== FIM DE FUNÇÕES DE EXPORTAÇÃO ======

// ====== FUNÇÕES DE AUTENTICAÇÃO ======

// Hash simples (não usar em produção!)
function hashPassword(password) {
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
        const char = password.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
}

// Obter usuários
function getAllUsers() {
    const users = localStorage.getItem('cnpj_users_db');
    return users ? JSON.parse(users) : {};
}

// Salvar usuários
function saveUsers(users) {
    localStorage.setItem('cnpj_users_db', JSON.stringify(users));
}

// Obter usuário logado
function getCurrentUser() {
    const auth = localStorage.getItem('cnpj_user_auth');
    return auth ? JSON.parse(auth) : null;
}

// Fazer login
function handleLogin() {
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    const authMessage = document.getElementById('authMessage');

    if (!email || !password) {
        showAuthMessage('Por favor, preencha todos os campos', 'error');
        return;
    }

    const users = getAllUsers();
    const user = users[email];

    if (!user) {
        showAuthMessage('Usuário não encontrado', 'error');
        return;
    }

    if (hashPassword(password) !== user.passwordHash) {
        showAuthMessage('Senha incorreta', 'error');
        return;
    }

    const userSession = {
        email: user.email,
        name: user.name,
        loginTime: new Date().toISOString()
    };
    localStorage.setItem('cnpj_user_auth', JSON.stringify(userSession));

    showAuthMessage('Login realizado com sucesso!', 'success');
    setTimeout(() => {
        checkAuthStatus();
    }, 500);
}

// Fazer registro
function handleRegister() {
    const name = document.getElementById('registerName').value.trim();
    const email = document.getElementById('registerEmail').value.trim();
    const password = document.getElementById('registerPassword').value;
    const confirm = document.getElementById('registerConfirm').value;

    if (!name || !email || !password || !confirm) {
        showAuthMessage('Por favor, preencha todos os campos', 'error');
        return;
    }

    if (password !== confirm) {
        showAuthMessage('As senhas não coincidem', 'error');
        return;
    }

    if (password.length < 6) {
        showAuthMessage('Senha deve ter no mínimo 6 caracteres', 'error');
        return;
    }

    const users = getAllUsers();

    if (users[email]) {
        showAuthMessage('Este email já está registrado', 'error');
        return;
    }

    users[email] = {
        email,
        name,
        passwordHash: hashPassword(password),
        registeredAt: new Date().toISOString()
    };

    saveUsers(users);

    const userSession = {
        email,
        name,
        loginTime: new Date().toISOString()
    };
    localStorage.setItem('cnpj_user_auth', JSON.stringify(userSession));

    showAuthMessage('Registrado com sucesso!', 'success');
    setTimeout(() => {
        checkAuthStatus();
    }, 500);
}

// Mostrar mensagem de autenticação
function showAuthMessage(message, type) {
    const authMessage = document.getElementById('authMessage');
    authMessage.textContent = message;
    authMessage.className = `auth-message ${type}`;
}

// Alternar entre Login e Registro
function toggleAuthForm() {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const authTitle = document.getElementById('authTitle');

    if (loginForm.style.display === 'none') {
        loginForm.style.display = 'block';
        registerForm.style.display = 'none';
        authTitle.textContent = 'Fazer Login';
    } else {
        loginForm.style.display = 'none';
        registerForm.style.display = 'block';
        authTitle.textContent = 'Registre-se';
    }

    document.getElementById('authMessage').className = 'auth-message';
}

// Pular autenticação (continuar como convidado)
function skipAuth() {
    const authModal = document.getElementById('authModal');
    authModal.classList.add('hidden');
}

// Fazer logout
function logoutAndRefresh() {
    localStorage.removeItem('cnpj_user_auth');
    location.reload();
}

// Verificar status de autenticação
function checkAuthStatus() {
    const authModal = document.getElementById('authModal');
    const userInfo = document.getElementById('userInfo');
    const currentUser = getCurrentUser();

    if (currentUser) {
        // Usuário logado
        authModal.classList.add('hidden');
        userInfo.style.display = 'flex';
        document.getElementById('userName').textContent = `Olá, ${currentUser.name}`;
    } else {
        // Usuário não logado
        authModal.classList.remove('hidden');
        userInfo.style.display = 'none';
    }
}

// ====== FIM DE FUNÇÕES DE AUTENTICAÇÃO ======

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
    currentResultData = null; // Limpar dados para exportação
    searchSection.classList.add('active');
    resultsSection.classList.remove('active');
    cnpjInput.focus();
}

// Inicializar
document.addEventListener('DOMContentLoaded', () => {
    cnpjInput.focus();
    searchSection.classList.add('active');
    renderHistory(); // Carregar histórico na página inicial
    
    // Verificar autenticação
    checkAuthStatus();
});
