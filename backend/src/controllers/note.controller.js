const Note = require("../models/note.model");

const mapNoteResponse = (row) => {
  if (!row) return row;
  return {
    ...row,
    sourceChatId: row.source_chat_id ?? row.chat_id ?? null,
    sourceMessageId: row.source_message_id ?? row.message_id ?? null,
    canShowInChat: !!row.can_show_in_chat,
  };
};

/**
 * GET all notes for logged-in user
 */
exports.getNotes = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const userId = req.user.id;
    const notes = await Note.getNotesByUserId(userId);
    res.json(notes.map(mapNoteResponse));
  } catch (err) {
    console.error("Get notes failed:", err);
    res.status(500).json({ error: "Failed to load notes" });
  }
};

/**
 * GET a single note by ID
 */
exports.getNoteById = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const userId = req.user.id;
    const { noteId } = req.params;
    const note = mapNoteResponse(await Note.getNoteById(parseInt(noteId), userId));

    if (!note) {
      return res.status(404).json({ error: "Note not found" });
    }

    res.json(note);
  } catch (err) {
    console.error("Get note failed:", err);
    res.status(500).json({ error: "Failed to load note" });
  }
};

/**
 * GET note by chatId and title (for preventing duplicate notes)
 */
exports.findNoteByChatAndTitle = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const userId = req.user.id;
    const { chatId, title } = req.query;

    if (!chatId || !title) {
      return res.status(400).json({ error: "chatId and title are required" });
    }

    const note = await Note.findNoteByChatIdAndTitle(parseInt(chatId), title, userId);

    if (!note) {
      return res.status(404).json({ error: "Note not found" });
    }

    res.json(mapNoteResponse(note));
  } catch (err) {
    console.error("Find note by chat and title failed:", err);
    res.status(500).json({ error: "Failed to find note" });
  }
};

/**
 * CREATE a new note
 */
exports.createNote = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const userId = req.user.id;
    const { title = "Untitled Note", content = "", folderId = null, color = "#5227FF", chatId = null, messageId = null } = req.body;

    const note = mapNoteResponse(
      await Note.createNote({
        userId,
        title,
        content,
        folderId,
        color,
        chatId,
        messageId,
      })
    );

    res.json(note);
  } catch (err) {
    console.error("Create note failed:", err);
    res.status(500).json({ error: "Failed to create note" });
  }
};

/**
 * UPDATE a note
 */
exports.updateNote = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const userId = req.user.id;
    const { noteId } = req.params;
    const { title, content, folderId, color, chatId = null, messageId = null } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ error: "Title cannot be empty" });
    }

    const note = mapNoteResponse(
      await Note.updateNote({
        noteId: parseInt(noteId),
        userId,
        title: title.trim(),
        content: content || "",
        folderId: folderId || null,
        color: color || "#5227FF",
        chatId,
        messageId,
      })
    );

    if (!note) {
      return res.status(403).json({ error: "Note not found or unauthorized" });
    }

    res.json(note);
  } catch (err) {
    console.error("Update note failed:", err);
    res.status(500).json({ error: "Failed to update note" });
  }
};

/**
 * DELETE a note (soft delete)
 */
exports.deleteNote = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const userId = req.user.id;
    const { noteId } = req.params;

    console.log(`[DELETE NOTE] Attempting to delete noteId=${noteId} for userId=${userId}`);

    const deleted = await Note.deleteNote({ noteId: parseInt(noteId), userId });

    console.log(`[DELETE NOTE] Delete result:`, deleted);

    if (!deleted) {
      return res.status(403).json({ error: "Note not found or unauthorized" });
    }

    res.json({ success: true, message: "Note deleted successfully" });
  } catch (err) {
    console.error("Delete note failed:", err);
    res.status(500).json({ error: "Failed to delete note" });
  }
};

/**
 * PIN/UNPIN a note
 */
exports.togglePinNote = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const userId = req.user.id;
    const { noteId } = req.params;
    const { pinned } = req.body;

    const note = await Note.togglePinNote({
      noteId: parseInt(noteId),
      userId,
      pinned,
    });

    if (!note) {
      return res.status(403).json({ error: "Note not found or unauthorized" });
    }

    res.json(note);
  } catch (err) {
    console.error("Toggle pin note failed:", err);
    res.status(500).json({ error: "Failed to pin/unpin note" });
  }
};

/**
 * GET all folders for logged-in user
 */
exports.getFolders = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const userId = req.user.id;
    const folders = await Note.getFoldersByUserId(userId);
    res.json(folders);
  } catch (err) {
    console.error("Get folders failed:", err);
    res.status(500).json({ error: "Failed to load folders" });
  }
};

/**
 * CREATE a new note folder
 */
exports.createFolder = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const userId = req.user.id;
    const { name = "New Folder", color = "#5227FF" } = req.body;

    const folder = await Note.createFolder({
      userId,
      name,
      color,
    });

    res.json(folder);
  } catch (err) {
    console.error("Create folder failed:", err);
    res.status(500).json({ error: "Failed to create folder" });
  }
};

/**
 * UPDATE a note folder
 */
exports.updateFolder = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const userId = req.user.id;
    const { folderId } = req.params;
    const { name, color } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: "Folder name cannot be empty" });
    }

    const folder = await Note.updateFolder({
      folderId: parseInt(folderId),
      userId,
      name: name.trim(),
      color: color || "#5227FF",
    });

    if (!folder) {
      return res.status(403).json({ error: "Folder not found or unauthorized" });
    }

    res.json(folder);
  } catch (err) {
    console.error("Update folder failed:", err);
    res.status(500).json({ error: "Failed to update folder" });
  }
};

/**
 * DELETE a folder (soft delete)
 */
exports.deleteFolder = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const userId = req.user.id;
    const { folderId } = req.params;

    const deleted = await Note.deleteFolder({ folderId: parseInt(folderId), userId });

    if (!deleted) {
      return res.status(403).json({ error: "Folder not found or unauthorized" });
    }

    res.json({ success: true, message: "Folder deleted successfully" });
  } catch (err) {
    console.error("Delete folder failed:", err);
    res.status(500).json({ error: "Failed to delete folder" });
  }
};

/**
 * PIN/UNPIN a folder
 */
exports.togglePinFolder = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const userId = req.user.id;
    const { folderId } = req.params;
    const { pinned } = req.body;

    const folder = await Note.togglePinFolder({
      folderId: parseInt(folderId),
      userId,
      pinned,
    });

    if (!folder) {
      return res.status(403).json({ error: "Folder not found or unauthorized" });
    }

    res.json(folder);
  } catch (err) {
    console.error("Toggle pin folder failed:", err);
    res.status(500).json({ error: "Failed to pin/unpin folder" });
  }
};
