const https = require("https");

export default function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const { cnpj } = req.query;

  if (!cnpj) {
    res.status(400).json({ error: "CNPJ é obrigatório" });
    return;
  }

  const url = `https://receitaws.com.br/v1/cnpj/${cnpj}`;

  https
    .get(url, (apiRes) => {
      let data = "";

      apiRes.on("data", (chunk) => {
        data += chunk;
      });

      apiRes.on("end", () => {
        try {
          const json = JSON.parse(data);
          res.status(200).json(json);
        } catch (err) {
          res.status(500).json({ error: "Erro ao processar JSON" });
        }
      });
    })
    .on("error", (err) => {
      res.status(500).json({ error: "Erro ao consultar a API" });
    });
}
