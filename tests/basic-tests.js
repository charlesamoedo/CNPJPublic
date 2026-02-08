#!/usr/bin/env node

/**
 * Testes básicos do servidor CNPJPublic
 * Execute: node tests/basic-tests.js
 */

const http = require('http');

const API_HOST = 'http://localhost:3000';
const TEST_CNPJ = '11222333000181';

let passedTests = 0;
let failedTests = 0;

// Função helper para fazer requisições
function request(method, path) {
    return new Promise((resolve, reject) => {
        const url = new URL(API_HOST + path);
        const options = {
            hostname: url.hostname,
            port: url.port,
            path: url.pathname + url.search,
            method: method,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const jsonData = data ? JSON.parse(data) : {};
                    resolve({
                        status: res.statusCode,
                        headers: res.headers,
                        body: jsonData
                    });
                } catch (e) {
                    resolve({
                        status: res.statusCode,
                        headers: res.headers,
                        body: data
                    });
                }
            });
        });

        req.on('error', reject);
        req.end();
    });
}

// Função para assert
function assert(condition, message) {
    if (condition) {
        console.log(`✅ ${message}`);
        passedTests++;
    } else {
        console.log(`❌ ${message}`);
        failedTests++;
    }
}

// Testes
async function runTests() {
    console.log('\n🧪 Iniciando testes do servidor CNPJPublic...\n');

    try {
        // Teste 1: Health Check
        console.log('📋 Teste 1: Health Check');
        const healthResponse = await request('GET', '/health');
        assert(healthResponse.status === 200, 'Servidor respondendo (200)');
        assert(healthResponse.body.status === 'ok', 'Health check retorna status ok');
        console.log('');

        // Teste 2: CNPJ Válido
        console.log('📋 Teste 2: Consultar CNPJ Válido');
        const validResponse = await request('GET', `/api/cnpj/${TEST_CNPJ}`);
        assert(
            validResponse.status === 200 || validResponse.status === 404,
            'API respondendo para CNPJ válido'
        );
        if (validResponse.status === 200) {
            assert(validResponse.body.cnpj !== undefined, 'Resposta contém campo CNPJ');
            assert(validResponse.body.nome !== undefined, 'Resposta contém campo nome');
        }
        console.log('');

        // Teste 3: CNPJ Inválido (muito curto)
        console.log('📋 Teste 3: CNPJ Inválido');
        const invalidResponse = await request('GET', '/api/cnpj/123');
        assert(invalidResponse.status === 400, 'Retorna 400 para CNPJ inválido');
        assert(invalidResponse.body.error !== undefined, 'Resposta contém mensagem de erro');
        console.log('');

        // Teste 4: Servir arquivo estático
        console.log('📋 Teste 4: Servir Arquivos Estáticos');
        const indexResponse = await request('GET', '/');
        assert(indexResponse.status === 200, 'INDEX.HTML sendo servido');
        assert(typeof indexResponse.body === 'string', 'Resposta é HTML');
        console.log('');

    } catch (error) {
        console.error(`❌ Erro ao conectar ao servidor: ${error.message}`);
        console.log('\n⚠️  Certifique-se de que o servidor está rodando:');
        console.log('   npm start\n');
        process.exit(1);
    }

    // Resumo dos testes
    console.log('\n' + '='.repeat(50));
    console.log(`📊 Resultado: ${passedTests} passou(aram), ${failedTests} falhou`);
    console.log('='.repeat(50) + '\n');

    if (failedTests > 0) {
        process.exit(1);
    }
}

// Executar testes
runTests();
