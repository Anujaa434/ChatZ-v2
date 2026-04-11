let GoogleGenAI;
try {
  // Try newer SDK first
  ({ GoogleGenAI } = require("@google/genai"));
} catch (e) {
  // Fall back to older SDK if not available
  try {
    const { GoogleGenerativeAI } = require("@google/generative-ai");
    GoogleGenAI = null; // Signal to use old SDK
  } catch {
    // Neither SDK available; we'll fail at call time
  }
}

let legacyGenAI;
if (!GoogleGenAI) {
  try {
    const { GoogleGenerativeAI } = require("@google/generative-ai");
    legacyGenAI = GoogleGenerativeAI;
  } catch (e) {
    // library not installed or other error; we'll fallback at call time
  }
}

async function getGeminiResponse(message) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Gemini not configured: GEMINI_API_KEY not set");
  }

  // Try to validate message
  if (!message || typeof message !== "string" || !message.trim()) {
    throw new Error("Message cannot be empty");
  }

  try {
    // Use newer SDK if available
    if (GoogleGenAI) {
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: message,
      });
      return response.text || "";
    }

    // Fall back to older SDK
    if (legacyGenAI) {
      const genAI = new legacyGenAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
      const result = await model.generateContent(message);
      return result.response.text();
    }

    throw new Error("Gemini SDK not available");
  } catch (error) {
    console.error("Gemini error:", error);
    throw error;
  }
}

module.exports = { getGeminiResponse };
