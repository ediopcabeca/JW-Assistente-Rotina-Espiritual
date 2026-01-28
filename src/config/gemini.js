import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
    // Enforced error locally, but in production we catch this to prevent process crash
    console.warn("GEMINI_API_KEY não definida. Configure no .env ou nas variáveis da Hostinger.");
}

const genAI = new GoogleGenerativeAI(apiKey || "");

// Modelo otimizado para velocidade e custo na Hostinger
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

export { model };
