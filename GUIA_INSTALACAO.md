# CNPJPublic - Landing Page de Consulta de CNPJ

Uma aplicação minimalista e responsiva para consultar a situação cadastral de empresas brasileiras através da API pública ReceitaWS.

## 🎯 Características

✅ **Interface responsiva** - Funciona perfeitamente em Desktop, Tablet e Mobile  
✅ **Máscara automática** - Formata automaticamente o CNPJ enquanto digita  
✅ **Validação inteligente** - Valida formato e dígitos significativos  
✅ **Feedback visual** - Loading state e mensagens de erro amigáveis  
✅ **Tratamento de erros** - Gerencia erros de conexão, CNPJ inválido e limite de requisições  
✅ **Design moderno** - Gradientes, animações e interface intuitiva  

## 📋 Requisitos

- Node.js 14.0.0 ou superior
- npm 6.0.0 ou superior

## 🚀 Como Instalar e Executar

### 1. Instalar dependências
```bash
npm install
```

### 2. Iniciar o servidor
```bash
npm start
```

Para desenvolvimento com reload automático:
```bash
npm run dev
```

### 3. Acessar a aplicação
Abra seu navegador e acesse:
```
http://localhost:3000
```

## 📁 Estrutura do Projeto

```
CNPJPublic/
├── public/                 # Frontend
│   ├── index.html         # HTML principal
│   ├── style.css          # Estilos responsivos
│   └── script.js          # JavaScript vanilla
├── server/                # Backend
│   └── proxy.js           # Servidor Express + Proxy
├── package.json           # Dependências
├── README.md              # Este arquivo
└── Doc/
    └── PRD CNPJPublic.MD  # Documento de requisitos
```

## 🔄 Fluxo de Funcionamento

1. **Usuário acessa** a landing page
2. **Digita o CNPJ** (aceita com ou sem máscara)
3. **Clica em "Consultar"** ou pressiona Enter
4. **Sistema valida** o CNPJ
5. **Requisição é enviada** ao proxy backend
6. **Proxy chama** a API ReceitaWS remotamente
7. **Resultados são exibidos** em cards organizados

## 📊 Dados Exibidos

- **Razão Social** - Nome oficial da empresa
- **Nome Fantasia** - Nome comercial (se disponível)
- **CNPJ** - Número formatado
- **Situação Cadastral** - Status com cores (Verde = Ativa, Vermelho = Inativa)
- **Data de Abertura** - Formatada em DD/MM/YYYY
- **Natureza Jurídica** - Classificação legal
- **Endereço Completo** - Logradouro, número, bairro, cidade, UF e CEP

## 🛡️ Tratamento de Erros

| Erro | Mensagem | Solução |
|------|----------|---------|
| CNPJ vazio | "Por favor, digite um CNPJ." | Digite um CNPJ válido |
| Formato inválido | "CNPJ inválido. Por favor, verifique e tente novamente." | Use apenas 14 dígitos |
| 404 - Não encontrado | "CNPJ não encontrado na base de dados." | Verifique se o CNPJ está correto |
| 429 - Limite excedido | "Limite de requisições atingido. Aguarde..." | Tente novamente em alguns momentos |
| Erro de conexão | "Erro ao consultar CNPJ. Por favor, tente novamente." | Verifique sua internet |

## 🌐 CORS - Resolvido com Proxy

A API ReceitaWS não aceita requisições diretas do navegador (CORS). Esta aplicação utiliza um **servidor proxy em Node.js/Express** que:

1. Recebe a requisição do frontend
2. Valida o CNPJ
3. Chama a API ReceitaWS no servidor
4. Retorna o JSON para o frontend

Isso evita o bloqueio de CORS e melhora a segurança.

## 🎨 Design Responsivo

- **Desktop (1200px+)** - Layout em grid 2 colunas
- **Tablet (768px - 1199px)** - Layout em grid 1 coluna
- **Mobile (<768px)** - Layout em coluna única, inputs empilhados

## 🔒 Segurança

- ✅ Validação de entrada no frontend e backend
- ✅ Escape de HTML para prevenir XSS
- ✅ CORS configurado para aceitar requisições seguras
- ✅ Timeout de 10 segundos para requisições à API
- ✅ Remoção de caracteres especiais antes do envio

## 📝 Exemplo de Resposta da API

```json
{
  "cnpj": "11222333000181",
  "nome": "EMPRESA TESTE LTDA",
  "fantasia": "EMPRESA TESTE",
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

## 🚀 Deploy

### Vercel (Recomendado)
```bash
npm install -g vercel
vercel
```

### Heroku
```bash
heroku create seu-app
git push heroku main
```

### Railway/Render
Ambos suportam Node.js e podem fazer deploy automaticamente do repositório Git.

## 📞 Suporte

Para dúvidas sobre a API ReceitaWS acesse: https://www.receitaws.com.br/

## 📄 Licença

MIT

## 👨‍💻 Desenvolvido por

CNPJPublic - 2026
