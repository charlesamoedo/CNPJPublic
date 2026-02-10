const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Desabilitar cache para CSS, HTML e JS
app.use((req, res, next) => {
    if (req.path.endsWith('.css') || req.path.endsWith('.html') || req.path.endsWith('.js')) {
        res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.set('Pragma', 'no-cache');
        res.set('Expires', '0');
    }
    next();
});

// Servir arquivos estáticos da pasta public
app.use(express.static(path.join(__dirname, '../public')));

// Endpoint para consultar CNPJ
app.get('/api/cnpj/:cnpj', async (req, res) => {
    try {
        const cnpj = req.params.cnpj.replace(/\D/g, '');
        
        // Validar CNPJ
        if (cnpj.length !== 14) {
            return res.status(400).json({ error: 'CNPJ inválido' });
        }
        
        // Fazer requisição para a API ReceitaWS
        const response = await axios.get(`https://receitaws.com.br/v1/cnpj/${cnpj}`, {
            timeout: 10000 // 10 segundos de timeout
        });
        
        res.json(response.data);
        
    } catch (error) {
        console.error('Erro ao consultar API ReceitaWS:', error.message);
        
        if (error.response) {
            // A API respondeu com um status de erro
            if (error.response.status === 429) {
                return res.status(429).json({ 
                    error: 'Limite de requisições atingido. Por favor, aguarde alguns momentos e tente novamente.' 
                });
            } else if (error.response.status === 404) {
                return res.status(404).json({ 
                    error: 'CNPJ não encontrado na base de dados.' 
                });
            } else {
                return res.status(error.response.status).json({ 
                    error: error.response.data.message || 'Erro ao consultar API' 
                });
            }
        } else if (error.code === 'ECONNABORTED') {
            return res.status(503).json({ 
                error: 'Tempo limite excedido ao consultar a API. Por favor, tente novamente.' 
            });
        } else {
            return res.status(500).json({ 
                error: 'Erro ao consultar a API. Por favor, tente novamente mais tarde.' 
            });
        }
    }
});

// Rota raiz retorna o index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', message: 'Servidor funcionando' });
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
    console.log(`📄 Acesse http://localhost:${PORT} no seu navegador`);
});
