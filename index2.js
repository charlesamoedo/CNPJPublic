const fs = require("fs");
const https = require("https");
const readline = require("readline");

// Interface do prompt
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function formatarDados(json) {
  console.log("\n" + "=".repeat(80));
  console.log("DADOS DA EMPRESA");
  console.log("=".repeat(80));
  
  // Informações básicas
  console.log("\n--- INFORMAÇÕES BÁSICAS ---");
  console.log(`CNPJ: ${json.cnpj}`);
  console.log(`Razão Social: ${json.nome}`);
  console.log(`Nome Fantasia: ${json.fantasia}`);
  console.log(`Status: ${json.status}`);
  
  // Situação
  console.log("\n--- SITUAÇÃO ---");
  console.log(`Situação: ${json.situacao}`);
  console.log(`Data da Situação: ${json.data_situacao}`);
  console.log(`Motivo da Situação: ${json.motivo_situacao || "N/A"}`);
  console.log(`Situação Especial: ${json.situacao_especial || "N/A"}`);
  console.log(`Data da Situação Especial: ${json.data_situacao_especial || "N/A"}`);
  
  // Empresa
  console.log("\n--- EMPRESA ---");
  console.log(`Tipo: ${json.tipo}`);
  console.log(`Porte: ${json.porte}`);
  console.log(`Natureza Jurídica: ${json.natureza_juridica}`);
  console.log(`Data de Abertura: ${json.abertura}`);
  console.log(`Capital Social: R$ ${json.capital_social}`);
  
  // Atividades
  console.log("\n--- ATIVIDADE PRINCIPAL ---");
  if (json.atividade_principal && json.atividade_principal.length > 0) {
    const atividade = json.atividade_principal[0];
    console.log(`Código: ${atividade.code}`);
    console.log(`Descrição: ${atividade.text}`);
  }
  
  if (json.atividades_secundarias && json.atividades_secundarias.length > 0) {
    console.log("\n--- ATIVIDADES SECUNDÁRIAS ---");
    json.atividades_secundarias.forEach((atividade, index) => {
      console.log(`  ${index + 1}. (${atividade.code}) ${atividade.text}`);
    });
  }
  
  // Endereço
  console.log("\n--- ENDEREÇO ---");
  console.log(`Logradouro: ${json.logradouro}`);
  console.log(`Número: ${json.numero}`);
  console.log(`Complemento: ${json.complemento || "N/A"}`);
  console.log(`Bairro: ${json.bairro}`);
  console.log(`Município: ${json.municipio}`);
  console.log(`UF: ${json.uf}`);
  console.log(`CEP: ${json.cep}`);
  
  // Contato
  console.log("\n--- CONTATO ---");
  console.log(`Telefone: ${json.telefone || "N/A"}`);
  console.log(`Email: ${json.email || "N/A"}`);
  
  // Regime de Tributação
  console.log("\n--- REGIME DE TRIBUTAÇÃO ---");
  if (json.simples) {
    console.log(`Simples Nacional Optante: ${json.simples.optante ? "Sim" : "Não"}`);
    if (json.simples.optante) {
      console.log(`  Data de Opção: ${json.simples.data_opcao}`);
    }
    if (json.simples.data_exclusao) {
      console.log(`  Data de Exclusão: ${json.simples.data_exclusao}`);
    }
  }
  if (json.simei) {
    console.log(`SIMEI Optante: ${json.simei.optante ? "Sim" : "Não"}`);
    if (json.simei.optante) {
      console.log(`  Data de Opção: ${json.simei.data_opcao}`);
    }
    if (json.simei.data_exclusao) {
      console.log(`  Data de Exclusão: ${json.simei.data_exclusao}`);
    }
  }
  
  // Quadro de Sócios
  console.log("\n--- QUADRO DE SÓCIOS ---");
  if (json.qsa && json.qsa.length > 0) {
    json.qsa.forEach((socio, index) => {
      console.log(`  ${index + 1}. ${socio.nome || "N/A"}`);
    });
  } else {
    console.log("Sem informações de sócios");
  }
  
  // Informações adicionais
  console.log("\n--- INFORMAÇÕES ADICIONAIS ---");
  console.log(`Última Atualização: ${json.ultima_atualizacao}`);
  console.log(`EFR: ${json.efr || "N/A"}`);
  
  console.log("\n" + "=".repeat(80) + "\n");
}

rl.question("Digite o CNPJ: ", (cnpj) => {

  const url = `https://receitaws.com.br/v1/cnpj/${cnpj}`;

  console.log(`Consultando CNPJ: ${cnpj}...`);

  https.get(url, (res) => {
    let data = "";

    res.on("data", (chunk) => {
      data += chunk;
    });

    res.on("end", () => {
      try {
        const json = JSON.parse(data);

        // Exibir todos os dados formatados
        formatarDados(json);

        // Caminho da pasta
        const pasta = "CNPJConsultados";

        // Criar a pasta se não existir
        if (!fs.existsSync(pasta)) {
          fs.mkdirSync(pasta);
        }

        // Caminho completo do arquivo
        const caminhoArquivo = `${pasta}/${cnpj}.json`;

        // Salvar o arquivo
        fs.writeFileSync(caminhoArquivo, JSON.stringify(json, null, 2));

        console.log(`✓ Arquivo salvo com sucesso em: ${caminhoArquivo}`);

      } catch (err) {
        console.error("Erro ao processar JSON:", err);
      }

      rl.close();
    });
  }).on("error", (err) => {
    console.error("Erro ao chamar o endpoint:", err);
    rl.close();
  });
});
