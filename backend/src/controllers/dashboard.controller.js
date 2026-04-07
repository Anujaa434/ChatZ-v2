const Chat = require("../models/chat.model");
const Folder = require("../models/folder.model");
const Note = require("../models/note.model");
const Message = require("../models/message.model");

// 1. GET EVERYTHING — returns nested folder tree + inbox of unfiled items
exports.getDashboardData = async (req, res) => {
  try {
    const userId = req.user.id;

    // Fetch all data in parallel
    const [chats, folders, notes] = await Promise.all([
      Chat.getUserChats(userId),
      Folder.getUserFolders(userId),
      Note.getUserNotes(userId)
    ]);

    // Build a map of folders by id for O(1) lookup
    const folderMap = {};
    folders.forEach(f => {
      folderMap[f.id] = { ...f, chats: [], notes: [], children: [] };
    });

    // Attach chats to their folder (or inbox)
    const inboxChats = [];
    chats.forEach(c => {
      if (c.folder_id && folderMap[c.folder_id]) {
        folderMap[c.folder_id].chats.push(c);
      } else {
        inboxChats.push(c);
      }
    });

    // Attach notes to their folder (or inbox)
    const inboxNotes = [];
    notes.forEach(n => {
      if (n.folder_id && folderMap[n.folder_id]) {
        folderMap[n.folder_id].notes.push(n);
      } else {
        inboxNotes.push(n);
      }
    });

    // Build nested tree (parent_id → children)
    const rootFolders = [];
    folders.forEach(f => {
      if (f.parent_id && folderMap[f.parent_id]) {
        folderMap[f.parent_id].children.push(folderMap[f.id]);
      } else {
        rootFolders.push(folderMap[f.id]);
      }
    });

    res.json({
      folders: rootFolders,
      inbox: { chats: inboxChats, notes: inboxNotes }
    });
  } catch (err) {
    console.error("Dashboard Load Error:", err);
    res.status(500).json({ error: "Failed to load dashboard data" });
  }
};


// --- FOLDER OPERATIONS ---
exports.createFolder = async (req, res) => {
  try {
    const { name, color, parent_id } = req.body;
    const folder = await Folder.createFolder({
      userId: req.user.id,
      name: name || "New Folder",
      color: color || "#5227FF",
      parentFolderId: parent_id || null
    });
    res.status(201).json(folder);
  } catch (err) {
    console.error("createFolder error:", err);
    res.status(500).json({ error: err.message });
  }
};


exports.updateFolder = async (req, res) => {
  try {
    await Folder.updateFolder(req.user.id, req.params.id, req.body);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.deleteFolder = async (req, res) => {
  try {
    await Folder.deleteFolder(req.user.id, req.params.id);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// Toggle pin on a folder
exports.togglePinFolder = async (req, res) => {
  try {
    const folder = await Folder.togglePinFolder(req.user.id, req.params.id);
    if (!folder) return res.status(404).json({ error: "Folder not found" });
    res.json(folder);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// Get all chats + notes inside a specific folder
exports.getFolderContents = async (req, res) => {
  try {
    const contents = await Folder.getFolderContents(req.user.id, req.params.id);
    res.json(contents);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// --- NOTE OPERATIONS ---
exports.createNote = async (req, res) => {
  try {
    const { title, content, folder_id, color } = req.body;
    const note = await Note.createNote({
      userId: req.user.id,
      title: title || "Untitled Note",
      content: content || "",
      folderId: folder_id || null,
      color: color || null          // preserve null — user chose no tint
    });
    res.status(201).json(note);
  } catch (err) {
    console.error("createNote error:", err);
    res.status(500).json({ error: err.message });
  }
};

exports.updateNote = async (req, res) => {
  try {
    const { title, content, folder_id, color } = req.body;
    const updated = await Note.updateNote({
      noteId: req.params.id,
      userId: req.user.id,
      title, content,
      folderId: folder_id || null,
      color
    });
    if (!updated) return res.status(404).json({ error: "Note not found" });
    res.json(updated);
  } catch (err) {
    console.error("updateNote error:", err);
    res.status(500).json({ error: err.message });
  }
};

exports.deleteNote = async (req, res) => {
  try {
    const ok = await Note.deleteNote({ noteId: req.params.id, userId: req.user.id });
    if (!ok) return res.status(404).json({ error: "Note not found" });
    res.json({ success: true });
  } catch (err) {
    console.error("deleteNote error:", err);
    res.status(500).json({ error: err.message });
  }
};

// --- CHAT UPDATES (move folder / rename) ---
exports.updateChat = async (req, res) => {
  try {
    const chatId = req.params.id;
    const userId = req.user.id;
    const { title, folder_id } = req.body;

    let result;
    if (folder_id !== undefined) {
      // Cross-folder move
      result = await Chat.moveChatToFolder({ chatId, userId, folderId: folder_id });
    } else if (title) {
      // Rename
      result = await Chat.renameChat({ chatId, userId, title });
    }
    if (!result) return res.status(404).json({ error: "Chat not found" });
    res.json(result);
  } catch (err) {
    console.error("updateChat error:", err);
    res.status(500).json({ error: err.message });
  }
};

exports.deleteChat = async (req, res) => {
    try {
      await Chat.deleteChat({ chatId: req.params.id, userId: req.user.id });
      res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
  };