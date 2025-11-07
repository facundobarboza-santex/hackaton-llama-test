import express from 'express';
import { runQuery, extractUrls } from './index.js';
import 'dotenv/config';

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.status(200).send('<h1>Servidor activo</h1>');
});

// endpoint para enviar prompt
app.post('/query', async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Debe enviar un campo "prompt" en el body.' });
    }

    const response = await runQuery(prompt);
    // detectar URLs
    const urls = extractUrls(responseText);

    res.json({
      prompt,
      response: cleanResponse,
      urls: urls.length > 0 ? urls : null
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port http://localhost:${PORT}`);
});