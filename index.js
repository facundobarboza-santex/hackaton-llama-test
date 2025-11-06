import fs from "fs";
import path from "path";
import 'dotenv/config';

import { Document, VectorStoreIndex, Settings } from "llamaindex";
import { OpenAI, OpenAIEmbedding } from "@llamaindex/openai";

import pdfjsLib from "pdfjs-dist/legacy/build/pdf.js";


Settings.llm = new OpenAI({
  model: "gpt-4o-mini",
  apiKey: process.env.OPENAI_API_KEY,
});

Settings.embedModel = new OpenAIEmbedding({
  model: "text-embedding-3-small",
  apiKey: process.env.OPENAI_API_KEY
});

const systemPrompt = `
  Eres un asistente especializado en responder consultas únicamente basadas en la información proporcionada en los documentos PDF cargados.  
  Tu objetivo es ayudar a los usuarios a entender y obtener información sobre los sistemas y procesos descritos en esos documentos.  

  Reglas:
  - Si la respuesta se encuentra en los documentos, explícalo con claridad y concisión.
  - Si no tienes información suficiente en los documentos, responde con:  
    "No dispongo de esa información en los documentos proporcionados. ¿Podrías reformular o especificar tu pregunta?"
  - No inventes ni alucines información fuera de lo que se te proporcionó.
  - Prioriza siempre la información documental antes que tus conocimientos generales.
`;


function readTxtFile(filePath) {
  const text = fs.readFileSync(filePath, "utf-8").trim();
  if (!text) throw new Error("El archivo está vacío");
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

  return [new Document({ text: fullText, metadata: { fileName: path.basename(filePath) } })];
}

export async function runQuery(prompt) {
  const filePath = path.join("data", "test.pdf");
  if (!fs.existsSync(filePath)) {
    throw new Error(`No se encontró el archivo: ${filePath}`);
  }

  let docs;
  if (filePath.endsWith(".pdf")) {
    docs = await readPdfFile(filePath);
  } else if (filePath.endsWith(".txt")) {
    docs = [readTxtFile(filePath)];
  } else {
    throw new Error("Formato de archivo no soportado. Usa .txt o .pdf");
  }

  const index = await VectorStoreIndex.fromDocuments(docs);
  const queryEngine = index.asQueryEngine();

  var completedQuery = `${systemPrompt}\n\nPregunta del usuario: ${prompt}`;

  const response = await queryEngine.query({ query: completedQuery });
  return response.toString();
}