import 'dotenv/config';
import { Document, VectorStoreIndex, Settings } from "llamaindex";
import { OpenAI, OpenAIEmbedding } from "@llamaindex/openai";

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
- Si la respuesta se encuentra total o parcialmente en los documentos, explícalo con claridad.
- Si no tienes información suficiente en los documentos, responde:
  "No dispongo de esa información en los documentos proporcionados. ¿Podrías reformular o especificar tu pregunta?"
- No inventes información fuera de lo que se te proporcionó.
- Prioriza siempre la información documental.
- No uses caracteres de formateo de texto.
`;

export async function runQuery(prompt, documents) {
  if (!documents || documents.length === 0) {
    throw new Error("No se recibieron documentos para procesar.");
  }

  const index = await VectorStoreIndex.fromDocuments(documents);
  const queryEngine = index.asQueryEngine();

  const completedQuery = `${systemPrompt} Pregunta del usuario: ${prompt}`;

  const response = await queryEngine.query({ query: completedQuery });

  return response.toString();
}