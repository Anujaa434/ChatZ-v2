/**
 * Generate a chat title from the first message
 * Takes the first 60 characters or up to the first sentence
 */
function generateTitleFromMessage(message) {
  if (!message || !message.trim()) {
    return "New Chat";
  }

  // Remove extra whitespace
  const cleaned = message.trim();

  // Find first sentence (period, question mark, or exclamation)
  const sentenceEnd = cleaned.search(/[.!?]/);
  let title = sentenceEnd > 0 ? cleaned.substring(0, sentenceEnd) : cleaned;

  // Limit to 60 characters max
  if (title.length > 60) {
    title = title.substring(0, 60).trim();
  }

  // Capitalize first letter
  title = title.charAt(0).toUpperCase() + title.slice(1);

  return title;
}

module.exports = { generateTitleFromMessage };
