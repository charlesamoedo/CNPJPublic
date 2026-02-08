# 🚀 Guias de Deploy para CNPJPublic

## 1. Vercel (⭐ Recomendado)

### Passos:
```bash
# 1. Instale o CLI da Vercel
npm install -g vercel

# 2. Faça login
vercel login

# 3. Deploy
vercel
```

### Configuração (vercel.json)
```json
{
  "version": 2,
  "builds": [
    {
      "src": "server/proxy.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "server/proxy.js"
    },
    {
      "src": "/(.*)",
      "dest": "public/$1"
    }
  ]
}
```

## 2. Railway.app

### Passos:
1. Faça push do repositório para GitHub
2. Acesse https://railway.app
3. Clique em "Create Project"
4. Selecione "Deploy from GitHub"
5. Selecione o repositório
6. Configure as variáveis de ambiente:
   - `PORT` = 3000
7. Pronto! Railway fará deploy automaticamente

## 3. Render

### Passos:
1. Acesse https://render.com
2. Clique em "New +" e selecione "Web Service"
3. Conecte seu repositório GitHub
4. Configure:
   - **Name**: cnpjpublic
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
5. Clique em "Create Web Service"

## 4. Heroku

### Passos:
```bash
# 1. Instale o CLI do Heroku
npm install -g heroku

# 2. Faça login
heroku login

# 3. Crie uma nova aplicação
heroku create seu-app-unico

# 4. Faça o deploy
git push heroku main
```

## 5. Docker + Any Cloud (AWS, Google Cloud, Azure)

### Dockerfile
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3000

CMD ["npm", "start"]
```

### Build e Run
```bash
docker build -t cnpjpublic .
docker run -p 3000:3000 cnpjpublic
```

## 6. Ambiente Local (Development)

```bash
# 1. Clone ou download do projeto
cd CNPJPublic

# 2. Instale as dependências
npm install

# 3. Inicie o servidor
npm start

# 4. Acesse no navegador
# http://localhost:3000
```

---

## 📊 Comparação de Plataformas

| Plataforma | Free | Deploy Fácil | Escalabilidade | Recomendado |
|-----------|------|-----------------|-----------------|------------|
| **Vercel** | ✅ | ✅✅ | Excelente | ✅ Sim |
| **Railway** | Limitado | ✅ | Bom | ✅ Sim |
| **Render** | ✅ | ✅ | Excelente | ✅ Sim |
| **Heroku** | ❌ | ✅ | Bom | ⚠️ Pago |
| **Docker** | ✅ | ⚠️ | Excelente | ⚠️ Complexo |

---

## 🔧 Variáveis de Ambiente

Sempre defina as seguintes variáveis:

```env
PORT=3000
NODE_ENV=production
```

Opcional em produção:
```env
RECEITAWS_API=https://receitaws.com.br/v1/cnpj
FRONTEND_URL=https://seu-dominio.com
```

---

## ✅ Checklist Pré-Deploy

- [ ] npm install executado localmente
- [ ] npm start testado localmente
- [ ] Variáveis de ambiente configuradas
- [ ] package.json contém "start": "node server/proxy.js"
- [ ] Repositório .git inicializado (se usar plataforma with Git auto-deploy)
- [ ] README.md e documentação up-to-date

---

## 🆘 Troubleshooting

### Erro: "Cannot find module 'express'"
```bash
rm -rf node_modules package-lock.json
npm install
```

### Erro: "Port already in use"
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Mac/Linux
lsof -i :3000
kill -9 <PID>
```

### Erro: "CORS issue"
O servidor está configurado com CORS habilitado. Se persistir, verifique:
- URL do frontend em .env
- Headers de requisição esperados

---

## 📈 Monitoramento

### Vercel
- Dashboard: https://vercel.com/dashboard
- Logs em tempo real

### Railway
- Dashboard: https://railway.app/dashboard
- Logs e métricas

### Render
- Dashboard: https://dashboard.render.com
- Logs via CLI

---

## 💾 Backup e Restore

Os dados não são persistidos (conforme PRD). Se precisar adicionar banco de dados, considere:
- MongoDB Atlas (free tier)
- PostgreSQL em Heroku
- Firestore no Google Cloud

---

Boa sorte com seu deploy! 🎉
