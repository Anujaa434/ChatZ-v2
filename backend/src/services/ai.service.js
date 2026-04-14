const { getGeminiResponse } = require("./gemini.service");
const { getGroqResponse } = require("./groq.service");

function normalizeModel(input) {
  const m = String(input || "").toLowerCase();
  if (m.includes("gemini")) return "gemini";
  if (m.includes("groq")) return "groq";
  if (m.startsWith("gpt") || m.includes("chatgpt")) return "chatgpt";
  if (m.includes("claude")) return "claude";
  return "unknown";
}

function demoResponse(provider, model, message) {
  const safeMsg = (message || "").toString().slice(0, 400);
  return [
    `🤖 [Mock ${model || provider}] Reply`,
    `I received your message: "${safeMsg}..."`,
    `(Configure a real API key in backend/.env to connect to true AI models.)`
  ].filter(Boolean).join("\n\n");
}

async function handleAIResponse(model, message) {
  const provider = normalizeModel(model);
  console.log(`[AI Service] Received model: "${model}" | Normalized to: "${provider}"`);

  switch (provider) {
    case "gemini": {
      // Defer to actual Gemini service; let caller decide on fallback
      return await getGeminiResponse(message);
    }
    case "groq": {
      // Groq AI integration
      try {
        return await getGroqResponse(message);
      } catch (err) {
        console.warn("Groq unavailable, sending fallback:", err?.message || err);
        return "Groq AI is temporarily unavailable. Your message was saved.";
      }
    }
    case "chatgpt":
    case "claude": {
      // Not integrated yet: return safe demo response
      return demoResponse(provider, model, message);
    }
    default: {
      // Unknown model: safe demo
      return demoResponse("unknown", model, message);
    }
  }
}

module.exports = { handleAIResponse, normalizeModel };
