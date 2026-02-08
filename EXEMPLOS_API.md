# Exemplos de Requisições à API

## 1. Consultar CNPJ Válido
```bash
curl -X GET "http://localhost:3000/api/cnpj/11222333000181"
```

## 2. Usar com PowerShell (Windows)
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/cnpj/11222333000181" -Method Get
```

## 3. Com fetch no JavaScript
```javascript
fetch('http://localhost:3000/api/cnpj/11222333000181')
  .then(response => response.json())
  .then(data => console.log(data))
  .catch(error => console.error('Erro:', error));
```

## 4. CNPJ com Máscara (a API limpa automaticamente)
```bash
curl -X GET "http://localhost:3000/api/cnpj/11.222.333%2F0001-81"
```

## 5. CNPJ Inválido
```bash
curl -X GET "http://localhost:3000/api/cnpj/12345"
# Resposta 400: CNPJ inválido
```

## 6. CNPJ Não Encontrado
```bash
curl -X GET "http://localhost:3000/api/cnpj/00000000000191"
# Resposta 404: CNPJ não encontrado
```

## 7. Limite de Requisições Excedido
```bash
# Fazer múltiplas solicitações rapidamente
for i in {1..100}; do
  curl -X GET "http://localhost:3000/api/cnpj/11222333000181"
done
# Resposta 429: Too Many Requests
```

## 8. Health Check
```bash
curl -X GET "http://localhost:3000/health"
# Resposta: {"status":"ok","message":"Servidor funcionando"}
```

## 9. Com Postman
- **Method**: GET
- **URL**: http://localhost:3000/api/cnpj/11222333000181
- **Headers**: (nenhum necessário)

## 10. Com Python Requests
```python
import requests

response = requests.get('http://localhost:3000/api/cnpj/11222333000181')
print(response.json())
```

## Respostas Esperadas

### Sucesso (200)
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

### Erro 400 - CNPJ Inválido
```json
{
  "error": "CNPJ inválido"
}
```

### Erro 404 - Não Encontrado
```json
{
  "error": "CNPJ não encontrado na base de dados."
}
```

### Erro 429 - Limite Excedido
```json
{
  "error": "Limite de requisições atingido. Por favor, aguarde alguns momentos e tente novamente."
}
```

### Erro 500 - Erro do Servidor
```json
{
  "error": "Erro ao consultar a API. Por favor, tente novamente mais tarde."
}
```

---

## 📝 Nota sobre CNPJs de Teste

Alguns CNPJs válidos na base ReceitaWS para testes:
- `11222333000181` - Empresa de teste
- `11444777000161` - Outro exemplo

Para encontrar CNPJs válidos, use empresas reais brasileiras (ex: CNPJ da sua própria empresa ou de grandes empresas).
