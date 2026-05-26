// index.js
const fs = require("fs");
const https = require("https");

// URL do seu endpoint
const url = "https://jsonplaceholder.typicode.com/todos/";

async function executar() {
  try {
    // Fazendo o fetch manual usando https
    https.get(url, (res) => {
      let data = "";

      res.on("data", (chunk) => {
        data += chunk;
      });

      res.on("end", () => {
        try {
          const json = JSON.parse(data);

          console.log("Resultado do endpoint:");
          console.log(json);

          fs.writeFileSync("resultado.json", JSON.stringify(json, null, 2));

          console.log("Arquivo 'resultado.json' salvo com sucesso!");
        } catch (err) {
          console.error("Erro ao processar JSON:", err);
        }
      });
    }).on("error", (err) => {
      console.error("Erro ao chamar o endpoint:", err);
    });

  } catch (erro) {
    console.error("Erro geral:", erro);
  }
}

executar();
