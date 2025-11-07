// app.js
import express from 'express';
import fs from 'fs';
import path from 'path';
import pdfjsLib from 'pdfjs-dist/legacy/build/pdf.js';
import { Document } from "llamaindex";
import { runQuery } from './index.js';
import 'dotenv/config';

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

function readTxtFile(filePath) {
  const text = fs.readFileSync(filePath, "utf-8").trim();
  return new Document({ text, metadata: { fileName: path.basename(filePath) } });
}

async function readPdfFile(filePath) {
  const data = new Uint8Array(fs.readFileSync(filePath));
  const pdf = await pdfjsLib.getDocument({ data }).promise;

  let fullText = "";
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const strings = content.items.map((item) => item.str);
    fullText += strings.join(" ") + "\n";
  }

  return new Document({ text: fullText, metadata: { fileName: path.basename(filePath) } });
}

// Carga el documento en cada request
async function loadDocument() {
  const filePath = path.join("data", "test.pdf");

  if (!fs.existsSync(filePath)) {
    throw new Error(`No se encontró el archivo: ${filePath}`);
  }

  if (filePath.endsWith(".pdf")) return [await readPdfFile(filePath)];
  if (filePath.endsWith(".txt")) return [readTxtFile(filePath)];

  throw new Error("Formato de archivo no soportado. Usa .txt o .pdf");
}

app.get('/', (req, res) => {
  res.status(200).send('<h1>Servidor activo</h1>');
});

// Endpoint para enviar prompt
app.post('/query', async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Debe enviar un campo "prompt" en el body.' });
    }

    // Lee el documento en cada request
    const documents = await loadDocument();

    // Ejecuta consulta
    const response = await runQuery(prompt, documents);

    res.json({ prompt, response });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});