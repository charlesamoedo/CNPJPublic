FROM node:18-alpine

# Define o diretório de trabalho
WORKDIR /app

# Copia package.json e package-lock.json
COPY package*.json ./

# Instala as dependências (apenas produção)
RUN npm ci --only=production

# Copia o resto da aplicação
COPY . .

# Expõe a porta 3000
EXPOSE 3000

# Variável de ambiente para production
ENV NODE_ENV=production

# Comando para iniciar a aplicação
CMD ["npm", "start"]

# Healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"
