import { GoogleGenAI } from "@google/genai";

export async function generateAppLogo(prompt: string) {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        {
          text: `Create a professional, modern app logo for a sales intelligence app named "SalesPulse". The logo should feature a pulse line (like an EKG) integrated with a rising sales bar chart. Use a clean, tech-focused color palette (deep blue, emerald green, and white). The style should be minimalist and high-end, suitable for a corporate dashboard. No text in the logo itself. ${prompt}`,
        },
      ],
    },
    config: {
      imageConfig: {
        aspectRatio: "1:1"
      }
    }
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  return null;
}
