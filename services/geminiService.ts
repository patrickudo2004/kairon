import { Program } from "../types";

// NOTE: This now calls our local proxy, not Google directly.
export const generateProgramDraft = async (rawText: string): Promise<Program | null> => {

  try {
    // In development, Vite dev server will proxy /api/* to the serverless function
    // In production (Vercel), /api/* routes directly to serverless functions
    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ rawText })
    });

    if (!response.ok) {
      throw new Error(`Server Error: ${response.statusText}`);
    }

    const data = await response.json();

    // Transform to internal shape with IDs
    const program: Program = {
      id: crypto.randomUUID(),
      title: data.title,
      subtitle: data.subtitle,
      date: data.date || new Date().toISOString().split('T')[0],
      startTime: data.startTime || "09:00",
      endTime: data.endTime || undefined,
      slots: data.slots.map((s: any) => ({
        id: crypto.randomUUID(),
        title: s.title,
        speaker: s.speaker || "TBA",
        durationMinutes: s.durationMinutes,
        type: s.type,
        details: s.details || ""
      }))
    };

    return program;

  } catch (error) {
    console.error("Gemini AI generation failed:", error);
    return null;
  }
};