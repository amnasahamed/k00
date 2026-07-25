import { GoogleGenAI } from "@google/genai";
import { getExportData } from "./dataService";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const askGemini = async (prompt: string) => {
  // getExportData is async — must be awaited. Previously this was passed
  // directly into JSON.stringify, which produced "{}" because Promise has
  // no enumerable own properties, so every Gemini call received an empty
  // snapshot and could only hallucinate answers.
  const data = await getExportData();

  // Create a minimal context context to avoid token limits, but enough to be useful
  const context = JSON.stringify({
    summary: `You are an AI assistant for a Content Management System.
    Here is the current database snapshot.
    Current Date: ${new Date().toISOString()}.
    Data: ${JSON.stringify(data)}`
  });

  const fullPrompt = `
    ${context}
    
    User Query: ${prompt}
    
    Instructions:
    1. Answer based ONLY on the provided JSON data.
    2. If asked to draft a message, provide a professional text message or email draft.
    3. Keep answers concise and helpful.
    4. If analyzing finances, be precise with math.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: fullPrompt,
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Sorry, I encountered an error connecting to the AI service. Please check your API Key.";
  }
};