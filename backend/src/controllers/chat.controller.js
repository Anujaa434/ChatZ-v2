const Chat = require("../models/chat.model");
const Message = require("../models/message.model");
const { handleAIResponse, normalizeModel } = require("../services/ai.service");
const { generateTitleFromMessage } = require("../utils/generateTitle");
const { generateAutoTitle } = require("../utils/generateAutoTitle");

/**
 * GET all chats for logged-in user
 */
exports.getChats = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const userId = req.user.id;
    const chats = await Chat.getUserChats(userId);
    res.json(chats);
  } catch (err) {
    console.error("Get chats failed:", err);
    res.status(500).json({ error: "Failed to load chats" });
  }
};

/**
 * CREATE a new chat
 */
exports.createChat = async (req, res) => {
  // A chat can no longer be created independently of a message as per DB trigger.
  return res.status(400).json({ error: "Cannot create chat without an initial message" });
};


/**
 * GET messages of a chat
 */
exports.getMessages = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { chatId } = req.params;
    const messages = await Message.getMessagesByChat(chatId);
    res.json(messages);
  } catch (err) {
    console.error("Get messages failed:", err);
    res.status(500).json({ error: "Failed to load messages" });
  }
};

/**
 * SEND message (user → AI provider or demo → save both)
 * Auto-generates meaningful chat title after first AI response
 */
exports.sendMessage = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const userId = req.user.id;
    const { chatId, message, model, folderId } = req.body;

    // Validate message
    const text = (message || "").toString();
    const trimmed = text.trim();
    if (!trimmed) {
      return res.status(400).json({ error: "Message cannot be empty" });
    }

    // Lazy chat creation inside a transaction via createChatWithMessage
    let targetChatId = chatId;
    let createdChat = null;
    if (!targetChatId) {
      const initialTitle = generateTitleFromMessage(trimmed);
      createdChat = await Chat.createChatWithMessage({ 
        userId, 
        folderId,
        title: initialTitle, 
        isAutoTitleGenerated: true,
        messageRole: "user",
        messageContent: trimmed
      });
      targetChatId = createdChat.id;
    } else {
      // save user message (now that we have a chat id)
      await Message.createMessage({ chatId: targetChatId, userId, role: "user", content: trimmed });
    }

    // AI reply via centralized handler (graceful fallback for non-integrated models)
    let aiReply = "";
    try {
      aiReply = await handleAIResponse(model || "gemini", trimmed);
    } catch (err) {
      // Only hits when integrated provider (e.g., Gemini) fails
      console.warn("AI provider failed, sending fallback:", err?.message || err);
      aiReply = "⚠️ AI is temporarily unavailable. Your message was saved.";
    }

    // save AI message regardless
    await Message.createMessage({
      chatId: targetChatId,
      userId: null,
      role: "assistant",
      content: aiReply,
    });

    // Auto-generate meaningful title after first AI response (non-blocking)
    // This runs asynchronously without blocking the response
    setImmediate(async () => {
      try {
        const chat = await Chat.getChatById(targetChatId);
        // Only generate if title hasn't been manually set and is still a placeholder
        if (chat && !chat.is_auto_title_generated && chat.title === "New Chat") {
          const allMessages = await Message.getMessagesByChat(targetChatId);
          const messagesForTitle = allMessages.map((msg) => ({
            role: msg.role,
            content: msg.content,
          }));
          
          const generatedTitle = await generateAutoTitle(messagesForTitle, model || "gemini");
          await Chat.updateAutoTitle({
            chatId: targetChatId,
            title: generatedTitle,
            userId,
          });
        }
      } catch (titleErr) {
        console.warn("Auto title generation failed:", titleErr?.message || titleErr);
        // Silently fail - don't interrupt user experience
      }
    });

    res.json({
      reply: aiReply,
      chatId: targetChatId,
      provider: normalizeModel(model || "gemini"),
      chat: createdChat || null,
    });
  } catch (err) {
    console.error("Send message failed:", err);
    res.status(500).json({ error: "Message send failed" });
  }
};

/**
 * RENAME a chat
 */
exports.renameChat = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const userId = req.user.id;
    const chatId = parseInt(req.params.chatId, 10);
    const { title } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ error: "Title cannot be empty" });
    }

    const chat = await Chat.renameChat({
      chatId,
      title: title.trim(),
      userId,
    });

    if (!chat) {
      return res.status(403).json({ error: "Chat not found or unauthorized" });
    }

    res.json(chat);
  } catch (err) {
    console.error("Rename chat failed:", err);
    res.status(500).json({ error: "Failed to rename chat" });
  }
};

/**
 * DELETE a chat
 */
exports.deleteChat = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const userId = req.user.id;
    const chatId = parseInt(req.params.chatId, 10);

    const deleted = await Chat.deleteChat({
      chatId,
      userId,
    });

    if (!deleted) {
      return res.status(403).json({ error: "Chat not found or unauthorized" });
    }

    res.json({ success: true, message: "Chat deleted successfully" });
  } catch (err) {
    console.error("Delete chat failed:", err);
    res.status(500).json({ error: "Failed to delete chat" });
  }
};

/**
 * DELETE a single message (soft delete)
 */
exports.deleteMessage = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const userId = req.user.id;
    const messageId = parseInt(req.params.messageId, 10);

    if (!messageId) {
      return res.status(400).json({ error: "Invalid message id" });
    }

    const ok = await Message.deleteMessage({ messageId, userId });
    if (!ok) {
      return res.status(403).json({ error: "Message not found or unauthorized" });
    }

    res.json({ success: true });
  } catch (err) {
    console.error("Delete message failed:", err);
    res.status(500).json({ error: "Failed to delete message" });
  }
};

/**
 * PIN/UNPIN a message
 */
exports.togglePinMessage = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const userId = req.user.id;
    const messageId = parseInt(req.params.messageId, 10);
    const chatId = parseInt(req.params.chatId, 10);
    const { pinned } = req.body;

    if (!messageId) {
      return res.status(400).json({ error: "Invalid message id" });
    }

    // If trying to pin, check if already at limit (3 pinned messages per chat)
    if (pinned === true) {
      const pinnedCount = await Message.countPinnedMessages(chatId);
      if (pinnedCount >= 3) {
        return res.status(400).json({ 
          error: "You can only pin up to 3 messages per chat",
          pinnedCount 
        });
      }
    }

    const message = await Message.togglePinMessage({ messageId, userId, pinned });

    if (!message) {
      return res.status(403).json({ error: "Message not found or unauthorized" });
    }

    res.json(message);
  } catch (err) {
    console.error("Toggle pin message failed:", err);
    res.status(500).json({ error: "Failed to pin/unpin message" });
  }
};
/**
 * PIN/UNPIN a chat (limit 3 pinned chats)
 */
exports.togglePinChat = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const userId = req.user.id;
    const chatId = parseInt(req.params.chatId, 10);
    const { pinned } = req.body;

    // If trying to pin, check if already at limit (3 pinned chats)
    if (pinned === true) {
      const pinnedCount = await Chat.countPinnedChats(userId);
      if (pinnedCount >= 3) {
        return res.status(400).json({ 
          error: "You can only pin up to 3 chats",
          pinnedCount 
        });
      }
    }

    const chat = await Chat.togglePinChat({
      chatId,
      userId,
      pinned,
    });

    if (!chat) {
      return res.status(403).json({ error: "Chat not found or unauthorized" });
    }

    res.json(chat);
  } catch (err) {
    console.error("Toggle pin chat failed:", err);
    res.status(500).json({ error: "Failed to pin/unpin chat" });
  }
};
