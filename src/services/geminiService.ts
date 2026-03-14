import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

export const enhancePrompt = async (prompt: string): Promise<string> => {
  const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) return prompt;
  
  const ai = new GoogleGenAI({ apiKey });
  
  try {
    const seed = Math.floor(Math.random() * 100000);
    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: `Enhance this video generation prompt to be more descriptive, cinematic, and detailed. Keep it under 100 words. 
      Original prompt: "${prompt}"
      Enhanced prompt:`,
      config: {
        seed: seed
      }
    });

    return response.text || prompt;
  } catch (e) {
    console.error("Prompt enhancement failed:", e);
    return prompt;
  }
};

export const generateSuggestions = async (): Promise<string[]> => {
  const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) return [
    "A futuristic cyberpunk city with neon lights and flying cars in the rain",
    "A peaceful zen garden with a floating cherry blossom tree",
    "An astronaut exploring a vibrant alien jungle with bioluminescent plants",
    "A high-speed chase through a desert canyon at sunset",
    "A cozy library with magical books flying around"
  ];
  
  const ai = new GoogleGenAI({ apiKey });
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: "Generate 5 creative and trending video generation prompts for an AI video generator. Return as a JSON array of strings.",
      config: {
        responseMimeType: "application/json",
      }
    });

    return JSON.parse(response.text || "[]");
  } catch (e) {
    console.error("Suggestions generation failed:", e);
    return [
      "A futuristic cyberpunk city with neon lights and flying cars in the rain",
      "A peaceful zen garden with a floating cherry blossom tree",
      "An astronaut exploring a vibrant alien jungle with bioluminescent plants",
      "A high-speed chase through a desert canyon at sunset",
      "A cozy library with magical books flying around"
    ];
  }
};

export const callGemini = async (prompt: string): Promise<string> => {
  const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("API Key not found");
  
  const ai = new GoogleGenAI({ apiKey });
  const seed = Math.floor(Math.random() * 100000);
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        seed: seed
      }
    });
    return response.text || "";
  } catch (e) {
    console.error("Gemini API Error:", e);
    throw e;
  }
};
