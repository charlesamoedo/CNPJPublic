# PRD - Landing Page de Consulta de CNPJ

**Versão:** 1.0  
**Data:** 08/02/2026  
**Status:** Rascunho  

---

## 1. Visão Geral e Objetivo
O objetivo é desenvolver uma *landing page* minimalista e responsiva que permita ao usuário consultar a situação cadastral de empresas brasileiras. O sistema deve receber um número de CNPJ, consultar a API pública da **ReceitaWS**, e exibir os dados retornados na tela de forma clara e organizada.

## 2. Escopo

### Inclusos (In Scope)
* Interface de usuário (UI) com campo de busca e botão de ação.
* Validação básica de formato de entrada (apenas números).
* Integração via método HTTP `GET` com o endpoint: `https://receitaws.com.br/v1/cnpj/${cnpj}`.
* Feedback visual de carregamento (*loading state*).
* Tratamento de erros (CNPJ inválido, erro de conexão, limite de requisições).
* Exibição dos dados principais da empresa.

### Não Inclusos (Out of Scope)
* Persistência de dados (Banco de Dados).
* Sistema de autenticação ou login de usuários.
* Histórico de consultas realizadas anteriormente.
* Funcionalidades de exportação (PDF/Excel).

---

## 3. Requisitos Funcionais (RF)

| ID | Requisito | Descrição | Prioridade |
|:---|:---|:---|:---|
| **RF01** | **Input de CNPJ** | O sistema deve possuir um campo de entrada que aceite a digitação do CNPJ. Deve aplicar máscara automática (ex: `00.000.000/0000-00`) ou aceitar apenas números. | Alta |
| **RF02** | **Sanitização** | Antes do envio para a API, o sistema deve remover caracteres especiais (pontos, barras, traços), mantendo apenas os 14 dígitos numéricos. | Alta |
| **RF03** | **Integração API** | O sistema deve realizar uma requisição `GET` para a API da ReceitaWS utilizando o CNPJ sanitizado. | Alta |
| **RF04** | **Exibição de Resultados** | O sistema deve renderizar na tela os seguintes dados retornados: Razão Social, Nome Fantasia, Situação Cadastral, Data de Abertura, Natureza Jurídica e Endereço Completo. | Alta |
| **RF05** | **Limpar Tela** | Deve haver um botão ou mecanismo para limpar a busca atual e permitir uma nova consulta sem recarregar a página. | Média |
| **RF06** | **Tratamento de Erro 429** | Se a API retornar o status `429 (Too Many Requests)`, o sistema deve exibir uma mensagem amigável informando o usuário para aguardar (limitação da versão gratuita da API). | Média |

---

## 4. Requisitos Não Funcionais (RNF)

* **RNF01 - Responsividade:** A interface deve ser fluida e adaptável para Desktop, Tablet e Mobile.
* **RNF02 - Usabilidade:** O feedback da ação (loading) deve ser imediato após o clique no botão "Consultar".
* **RNF03 - Tecnologia:** Frontend deve ser construído utilizando HTML5, CSS3 e JavaScript (Vanilla ou Framework leve como Vue.js/React).
* **RNF04 - Disponibilidade:** A aplicação deve tratar falhas de conexão com a API externa sem "quebrar" a interface.

---

## 5. Mapeamento de Dados (JSON -> UI)

Abaixo, a relação entre os campos do JSON de retorno da API e os rótulos a serem exibidos:

* `nome` $\rightarrow$ **Razão Social**
* `fantasia` $\rightarrow$ **Nome Fantasia** *(Caso vazio, exibir: "Não informado")*
* `cnpj` $\rightarrow$ **CNPJ**
* `situacao` $\rightarrow$ **Situação Cadastral** *(Estilizar: Verde para "ATIVA", Vermelho para "BAIXADA/INAPTA")*
* `abertura` $\rightarrow$ **Data de Abertura**
* `natureza_juridica` $\rightarrow$ **Natureza Jurídica**
* `logradouro`, `numero`, `bairro`, `municipio`, `uf`, `cep` $\rightarrow$ **Endereço Completo**

---

## 6. Fluxo de Usuário (User Flow)

1.  **Acesso:** Usuário acessa a *landing page*.
2.  **Interação:** Usuário digita o CNPJ no campo central.
3.  **Ação:** Usuário clica em "Consultar".
4.  **Processamento:**
    * Exibir *spinner* de carregamento.
    * Botão "Consultar" fica desabilitado.
5.  **Retorno:**
    * **Sucesso:** O formulário de busca sobe ou diminui, e os dados aparecem em *cards* logo abaixo.
    * **Erro:** Uma mensagem de alerta (Toast ou texto em vermelho) aparece abaixo do input explicandoo o motivo (ex: "CNPJ não encontrado").

---

## 7. Notas Técnicas e Restrições

> **⚠️ IMPORTANTE: CORS (Cross-Origin Resource Sharing)**
> A API pública da ReceitaWS não suporta chamadas diretas via browser (AJAX/Fetch) de domínios não autorizados devido a políticas de CORS.
>
> **Soluções Propostas:**
> 1.  **JSONP:** Verificar se a biblioteca utilizada ou a API suporta JSONP.
> 2.  **Proxy Server (Recomendado):** Criar uma camada intermediária simples (Node.js/Vercel Serverless Function/PHP) que receba a requisição do frontend, chame a ReceitaWS e devolva o JSON para o frontend. Isso evita o bloqueio de CORS no navegador.