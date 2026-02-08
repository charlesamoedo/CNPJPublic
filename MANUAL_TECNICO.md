# 📚 Manual Técnico - CNPJPublic

## Visão Geral da Arquitetura

```
┌─────────────────────────────────────────────────────────┐
│                      Navegador do Usuário               │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Frontend (HTML + CSS + JavaScript)              │  │
│  │  - index.html (Landing Page)                     │  │
│  │  - style.css (Responsivo, Gradientes)            │  │
│  │  - script.js (Validação, Máscaras, UI)           │  │
│  └──────────────────────────────────────────────────┘  │
└──────────────────────┬─────────────────────────────────┘
                       │ HTTP/HTTPS
                       │ CORS Headers
                       ↓
┌──────────────────────────────────────────────────────────┐
│              Servidor Backend (Node.js)                  │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Express Server (server/proxy.js)                │  │
│  │                                                  │  │
│  │  GET /api/cnpj/:cnpj                            │  │
│  │  └─ Validação                                   │  │
│  │  └─ Sanitização                                 │  │
│  │  └─ Requisição à ReceitaWS                      │  │
│  │  └─ Response com CORS                           │  │
│  │                                                  │  │
│  │  GET /health                                    │  │
│  │  GET / (index.html)                             │  │
│  └──────────────────────────────────────────────────┘  │
└──────────────────────┬─────────────────────────────────┘
                       │ HTTP
                       │ Sem Headers
                       ↓
┌──────────────────────────────────────────────────────────┐
│         API Pública ReceitaWS (Terceiros)                │
│      https://receitaws.com.br/v1/cnpj/{cnpj}            │
└──────────────────────────────────────────────────────────┘
```

---

## Estrutura de Arquivos em Detalhes

### Frontend (`/public`)

#### `index.html`
- **Responsabilidade**: Estrutura HTML da aplicação
- **Elementos principais**:
  - Header com título e descrição
  - Input para CNPJ (com ID: `cnpjInput`)
  - Botão de busca (com ID: `searchBtn`)
  - Área de loading (spinner)
  - Área de resultados (cards)
  - Footer

#### `style.css`
- **Responsabilidade**: Estilização e responsividade
- **Características**:
  - Design moderno com gradientes
  - Responsive breakpoints em 768px e 480px
  - Animações suaves (fade-in, slide-in, spin)
  - Sistema de cores com variáveis CSS
  - Grid dinâmico para cards

#### `script.js`
- **Responsabilidade**: Lógica da aplicação
- **Funções principais**:
  - `handleSearch()` - Inicia a busca
  - `handleClear()` - Limpa resultados
  - `isValidCNPJ()` - Valida CNPJ
  - `sanitizeCNPJ()` - Remove caracteres especiais
  - `formatCNPJ()` - Aplica máscara
  - `createResultCards()` - Renderiza resultados
  - `formatDate()` - Formata datas
  - `escapeHTML()` - Previne XSS
  - `formatSituation()` - Coloriza status

### Backend (`/server`)

#### `proxy.js`
- **Responsabilidade**: Servidor Node.js/Express que atua como proxy
- **Rotas principais**:
  - `GET /api/cnpj/:cnpj` - Consulta CNPJ
  - `GET /health` - Health check
  - `GET /` - Serve index.html

- **Middleware**:
  - `cors()` - Habilita CORS
  - `express.json()` - Parse JSON
  - `express.static()` - Serve arquivos estáticos

- **Tratamento de Erros**:
  - 400 - CNPJ inválido
  - 404 - CNPJ não encontrado
  - 429 - Limite de requisições
  - 500 - Erro do servidor

---

## Fluxo de Requisição Detalhado

### 1️⃣ Usuário digitando CNPJ
```javascript
// script.js - Event listener do input
cnpjInput.addEventListener('input', (e) => {
    // Valida apenas números
    let value = e.target.value.replace(/\D/g, '');
    
    // Limita a 14 dígitos
    if (value.length > 14) {
        value = value.slice(0, 14);
    }
    
    // Aplica máscara: XX.XXX.XXX/XXXX-XX
    // ...
});
```

### 2️⃣ Clica em "Consultar"
```javascript
async function handleSearch() {
    // 1. Validação do CNPJ
    if (!isValidCNPJ(cnpj)) {
        errorMessage.textContent = 'CNPJ inválido...';
        return;
    }
    
    // 2. Mostrar loading
    loading.classList.add('active');
    searchBtn.disabled = true;
    
    // 3. Sanitizar CNPJ
    const sanitized = sanitizeCNPJ(cnpj);
    
    // 4. Fazer requisição
    const response = await fetch(`${API_ENDPOINT}/${sanitized}`);
    
    // 5. Processar resposta
    const data = await response.json();
    
    // 6. Renderizar cards
    cardsContainer.innerHTML = createResultCards(data);
}
```

### 3️⃣ Backend recebe requisição
```javascript
// proxy.js
app.get('/api/cnpj/:cnpj', async (req, res) => {
    // 1. Extrair CNPJ da URL
    const cnpj = req.params.cnpj.replace(/\D/g, '');
    
    // 2. Validação básica
    if (cnpj.length !== 14) {
        return res.status(400).json({ error: 'CNPJ inválido' });
    }
    
    // 3. Chamar API ReceitaWS
    const response = await axios.get(
        `https://receitaws.com.br/v1/cnpj/${cnpj}`,
        { timeout: 10000 }
    );
    
    // 4. Retornar resposta
    res.json(response.data);
});
```

### 4️⃣ API ReceitaWS retorna dados
```json
{
  "cnpj": "11222333000181",
  "nome": "EMPRESA LTDA",
  "fantasia": "EMPRESA",
  "abertura": "2010-05-28",
  "situacao": "ATIVA",
  "natureza_juridica": "Sociedade Empresária Limitada",
  "logradouro": "Rua Exemplo",
  "numero": "123",
  "bairro": "Centro",
  "municipio": "São Paulo",
  "uf": "SP",
  "cep": "01311100"
}
```

### 5️⃣ Frontend exibe resultados
```javascript
// Criar cards com os dados
const cards = [
    { title: 'Razão Social', value: data.nome, emphasis: true },
    { title: 'Situação Cadastral', value: formatSituation(data.situacao) },
    // ... mais cards
];

// Renderizar HTML
cardsContainer.innerHTML = cards.map(card => `
    <div class="card">
        <div class="card-title">${card.title}</div>
        <div class="card-value">${card.value}</div>
    </div>
`).join('');
```

---

## Validações Implementadas

### CNPJ

| Validação | Implementação | Local |
|-----------|---------------|-------|
| Apenas números | `replace(/\D/g, '')` | Frontend + Backend |
| Exatamente 14 dígitos | `cnpj.length === 14` | Frontend + Backend |
| Não sequência igual | `!/^(\d)\1{13}$/.test()` | Frontend |
| Caracteres especiais removidos | `.replace(/\D/g, '')` | Backend |

### Segurança

| Tipo | Implementação | Local |
|------|---------------|-------|
| XSS Prevention | `escapeHTML(text)` | Frontend |
| CORS | `cors()` middleware | Backend |
| Timeout | `timeout: 10000` | Backend |
| Input validation | Múltiplas camadas | Frontend + Backend |

---

## Tratamento de Erros

### Fluxograma de Decisão
```
Usuário clica em "Consultar"
    ↓
CNPJ vazio?  ──YES──> "Por favor, digite um CNPJ"
    │ NO
    ↓
Formato inválido? ──YES──> "CNPJ inválido"
    │ NO
    ↓
Chamada à API
    │
    ├─ Status 200 ──> Mostrar resultados
    ├─ Status 404 ──> "CNPJ não encontrado"
    ├─ Status 429 ──> "Limite de requisições"
    ├─ Status 500 ──> "Erro do servidor"
    └─ Erro rede ──> "Erro de conexão"
```

---

## Performance e Otimizações

### Frontend
- ✅ JavaScript Vanilla (sem framework pesado)
- ✅ CSS Grid responsivo
- ✅ Animações em CSS (melhor performance)
- ✅ Lazy loading de imagens (se houver)

### Backend
- ✅ Express.js leve
- ✅ Compressão gzip (opcional)
- ✅ Pooling de conexões (para produção)
- ✅ Rate limiting (opcional)

### Rede
- ✅ Proxy reduz latência
- ✅ Caching de CNPJS (opcional)
- ✅ Compressão de assets

---

## Configuração para Produção

### Environment Variables
```env
NODE_ENV=production
PORT=3000
RECEITAWS_API=https://receitaws.com.br/v1/cnpj
```

### Melhorias Recomendadas
```javascript
// 1. Rate Limiting
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
    windowMs: 60 * 1000, // 1 minuto
    max: 30 // máximo 30 requisições
});

app.use('/api/', limiter);

// 2. Caching
const NodeCache = require('node-cache');
const cache = new NodeCache({ stdTTL: 600 }); // 10 minutos

// 3. Compression
const compression = require('compression');
app.use(compression());
```

---

## Testes Manuais Recomendados

### Desktop
- [ ] Chrome, Firefox, Safari no macOS
- [ ] Chrome, Firefox, Edge no Windows
- [ ] Zoom em 125%, 150%, 175%
- [ ] Modo desenvolvedor (DevTools)

### Mobile
- [ ] iPhone (Safari)
- [ ] Android (Chrome)
- [ ] Orientação landscape
- [ ] Ecrã pequeno (320px)

### Casos de Uso
- [ ] CNPJ válido
- [ ] CNPJ inválido
- [ ] CNPJ não encontrado
- [ ] Limite de requisições (429)
- [ ] Sem conexão de internet
- [ ] Servidor offline

---

## Dependências e Versões

```json
{
  "express": "^4.18.2",      // Framework web
  "cors": "^2.8.5",          // Cross-Origin Resource Sharing
  "axios": "^1.6.0",         // HTTP client
  "nodemon": "^3.0.1"        // Dev tool (reload automático)
}
```

---

## Debugging

### Log detalhado no Backend
```javascript
// Adicionar antes de axios.get()
console.log(`[${new Date().toISOString()}] GET ${url}`);
console.log(`Status: ${response.status}`);
console.log(`Data:`, response.data);
```

### Network tab no Chrome DevTools
1. F12 → Abrir DevTools
2. Network tab
3. Executar busca
4. Ver requisição e resposta
5. Verificar headers de CORS

### Console do Navegador
```javascript
// Testar diretamente
fetch('http://localhost:3000/api/cnpj/11222333000181')
    .then(r => r.json())
    .then(d => console.log(d));
```

---

## Roadmap Futuro (Out of Scope atual)

- 🔄 Histórico de consultas (localStorage ou DB)
- 📊 Dashboard de estatísticas
- 📄 Exportar em PDF/Excel
- 🔐 Autenticação de usuários
- 💾 Banco de dados persistente
- 🌍 Suporte para outros países
- 📱 Aplicativo mobile nativo
- ⚡ PWA (Progressive Web App)

---

**Última atualização**: 08/02/2026
**Versão**: 1.0.0
**Status**: Production Ready ✅
