import { GoogleGenAI, Type } from "@google/genai";

export default async function handler(req, res) {
    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Get API key from environment
    const apiKey = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY || process.env.API_KEY;

    if (!apiKey) {
        return res.status(500).json({ error: "Server missing API Key config" });
    }

    const { rawText } = req.body;
    if (!rawText) {
        return res.status(400).json({ error: "Missing rawText" });
    }

    try {
        const ai = new GoogleGenAI({ apiKey });
        const model = "gemini-2.5-flash";

        const prompt = `
      You are an expert conference coordinator assistant. 
      Parse the following raw text into a structured conference program.
      
      Instructions:
      1. Default duration: 30 mins if unknown.
      2. Default Start: 09:00 if unknown.
      3. Types: TALK, BREAK, KEYNOTE, PANEL.
      
      Raw Text: "${rawText}"
    `;

        const response = await ai.models.generateContent({
            model,
            contents: prompt,
            config: {
                systemInstruction: "You are a strict JSON generator. Always return valid JSON matching the schema.",
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        title: { type: Type.STRING },
                        subtitle: { type: Type.STRING },
                        date: { type: Type.STRING },
                        startTime: { type: Type.STRING },
                        slots: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    title: { type: Type.STRING },
                                    speaker: { type: Type.STRING },
                                    durationMinutes: { type: Type.NUMBER },
                                    type: { type: Type.STRING }
                                },
                                required: ["title", "durationMinutes", "type"]
                            }
                        }
                    },
                    required: ["title", "slots"]
                }
            }
        });

        const result = response.text ? JSON.parse(response.text) : null;

        if (!result) {
            return res.status(500).json({ error: "Failed to generate program" });
        }

        res.json(result);
    } catch (error) {
        console.error('Gemini API Error:', error);
        res.status(500).json({
            error: "Failed to generate program",
            details: error.message
        });
    }
}
