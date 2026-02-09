// Gerenciamento de Autenticação
const AUTH_KEY = 'cnpj_user_auth';
const USERS_KEY = 'cnpj_users_db';

// Obter usuários cadastrados
function getAllUsers() {
    const users = localStorage.getItem(USERS_KEY);
    return users ? JSON.parse(users) : {};
}

// Salvar usuários
function saveUsers(users) {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

// Obter usuário atual logado
function getCurrentUser() {
    const auth = localStorage.getItem(AUTH_KEY);
    return auth ? JSON.parse(auth) : null;
}

// Fazer login
function loginUser(email, password) {
    const users = getAllUsers();
    const user = users[email];

    if (!user) {
        return { success: false, message: 'Usuário não encontrado' };
    }

    // Hash simples (em produção usar bcrypt no backend)
    if (hashPassword(password) !== user.passwordHash) {
        return { success: false, message: 'Senha incorreta' };
    }

    // Armazenar sessão
    const userSession = {
        email: user.email,
        name: user.name,
        loginTime: new Date().toISOString()
    };
    localStorage.setItem(AUTH_KEY, JSON.stringify(userSession));

    return { success: true, message: 'Login realizado com sucesso', user: userSession };
}

// Fazer registro
function registerUser(email, name, password) {
    const users = getAllUsers();

    if (users[email]) {
        return { success: false, message: 'Usuário já existe' };
    }

    if (password.length < 6) {
        return { success: false, message: 'Senha deve ter no mínimo 6 caracteres' };
    }

    users[email] = {
        email,
        name,
        passwordHash: hashPassword(password),
        registeredAt: new Date().toISOString()
    };

    saveUsers(users);

    // Auto-login após registro
    const userSession = {
        email,
        name,
        loginTime: new Date().toISOString()
    };
    localStorage.setItem(AUTH_KEY, JSON.stringify(userSession));

    return { success: true, message: 'Registrado com sucesso!', user: userSession };
}

// Logout
function logoutUser() {
    localStorage.removeItem(AUTH_KEY);
}

// Hash simples (não usar em produção!)
function hashPassword(password) {
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
        const char = password.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Converter para 32-bit integer
    }
    return Math.abs(hash).toString(16);
}

// Verificar se usuário está autenticado
function isAuthenticated() {
    return getCurrentUser() !== null;
}

// Exportar para usar em outros arquivos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        loginUser,
        registerUser,
        logoutUser,
        getCurrentUser,
        isAuthenticated
    };
}
