let Groq;
try {
  Groq = require("groq-sdk");
} catch (e) {
  // SDK not installed; will fail at call time
  console.error("Groq SDK import failed:", e.message);
}

async function getGroqResponse(message) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!Groq || !apiKey) {
    throw new Error("Groq not configured: SDK or API key missing");
  }

  // Validate message
  if (!message || typeof message !== "string" || !message.trim()) {
    throw new Error("Message cannot be empty");
  }

  try {
    const groq = new Groq({ apiKey });
    
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: message }],
      temperature: 0.7,
      max_tokens: 1024,
    });

    const responseText = completion.choices?.[0]?.message?.content || "";
    return responseText.trim();
  } catch (error) {
    console.error("Groq error:", error);
    throw error;
  }
}

module.exports = { getGroqResponse };
