const { handleAIResponse } = require("../services/ai.service");

/**
 * Generate a meaningful chat title by summarizing the conversation
 * @param {Array} messages - Array of messages with {role, content}
 * @param {string} model - AI model to use for generation
 * @returns {Promise<string>} Generated title or fallback to first message
 */
async function generateAutoTitle(messages, model = "gemini") {
  try {
    if (!messages || messages.length === 0) {
      return "New Chat";
    }

    // Build conversation summary for AI
    const conversationText = messages
      .map((msg) => `${msg.role === "user" ? "User" : "AI"}: ${msg.content}`)
      .join("\n");

    const prompt = `You are a chat title generator. Given this conversation, create a SHORT, CLEAR title (maximum 6 words) that summarizes the main topic or purpose of the chat. 

Rules:
- Do NOT use punctuation
- Do NOT use full sentences
- Be specific and descriptive
- Avoid generic terms like "Discussion" or "Chat"
- Max 6 words

Conversation:
${conversationText}

Title:`;

    // Call AI to generate title
    const generatedTitle = await handleAIResponse(model, prompt);

    // Clean up the response
    let title = generatedTitle
      .trim()
      .replace(/^["']|["']$/g, "") // Remove quotes
      .split("\n")[0] // Take first line only
      .trim();

    // Validate title length and format
    if (!title || title.length === 0) {
      return fallbackTitle(messages[0]?.content || "New Chat");
    }

    // If title is too long, truncate to 6 words
    const words = title.split(" ");
    if (words.length > 6) {
      title = words.slice(0, 6).join(" ");
    }

    // Capitalize first letter
    title = title.charAt(0).toUpperCase() + title.slice(1);

    return title;
  } catch (error) {
    console.warn("Auto title generation failed, using fallback:", error?.message || error);
    // Fallback to first message
    return fallbackTitle(messages[0]?.content || "New Chat");
  }
}

/**
 * Fallback title generation from first message
 * @param {string} firstMessage - First message in chat
 * @returns {string} Generated fallback title
 */
function fallbackTitle(firstMessage) {
  if (!firstMessage || !firstMessage.trim()) {
    return "New Chat";
  }

  const cleaned = firstMessage.trim();
  const sentenceEnd = cleaned.search(/[.!?]/);
  let title = sentenceEnd > 0 ? cleaned.substring(0, sentenceEnd) : cleaned;

  if (title.length > 60) {
    title = title.substring(0, 60).trim() + "...";
  }

  return title.charAt(0).toUpperCase() + title.slice(1);
}

module.exports = { generateAutoTitle, fallbackTitle };
