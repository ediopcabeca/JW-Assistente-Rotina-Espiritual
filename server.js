import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { model } from './config/gemini.mjs';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || '*';

app.use(express.json());
app.use(cors({ origin: FRONTEND_ORIGIN }));

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.post('/api/chat', async (req, res) => {
  try {
    const payload = req.body;
    const result = await model.generateContent(payload.prompt || payload);
    const response = await result.response;
    res.json({ reply: response.text() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => console.log('Running'));