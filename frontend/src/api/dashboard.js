// frontend/src/api/dashboard.js
// Unified API client for dashboard data: folders, chats, notes
import api from "./client";

// ── Dashboard sync (all folders + contents) ───────────────────────────────
export async function syncDashboard() {
  const { data } = await api.get("/api/dashboard/sync");
  return data; // { folders: [...], inbox: { chats: [...], notes: [...] } }
}

// ── Folders ───────────────────────────────────────────────────────────────
export async function createFolder({ name = "New Folder", color = "#5a8cff", parentId = null } = {}) {
  const { data } = await api.post("/api/dashboard/folders", { name, color, parent_id: parentId });
  return data;
}

export async function updateFolder(id, { name, color }) {
  const { data } = await api.put(`/api/dashboard/folders/${id}`, { name, color });
  return data;
}

export async function deleteFolder(id) {
  const { data } = await api.delete(`/api/dashboard/folders/${id}`);
  return data;
}

export async function pinFolder(id, pinned) {
  const { data } = await api.patch(`/api/dashboard/folders/${id}/pin`, { pinned });
  return data;
}

export async function getFolderContents(id) {
  const { data } = await api.get(`/api/dashboard/folders/${id}/contents`);
  return data; // { chats: [...], notes: [...] }
}

// ── Chats ─────────────────────────────────────────────────────────────────
export async function getChats(folderId = null) {
  const params = folderId ? { folder_id: folderId } : {};
  const { data } = await api.get("/api/chats", { params });
  return data; // array of chats
}

export async function createChat({ title = "New Chat", folderId = null } = {}) {
  const { data } = await api.post("/api/chats", { title, folder_id: folderId });
  return data; // { id, title, folder_id, ... }
}

export async function getMessages(chatId) {
  const { data } = await api.get(`/api/chats/${chatId}/messages`);
  return data; // array of { id, role, content, created_at }
}

export async function sendMessage({ chatId, message, model = "gemini-1.5-pro", folderId = null }) {
  const { data } = await api.post("/api/chats/send", { chatId, message, model, folderId });
  return data; // { reply: "...", messageId: "..." }
}

// PHASE 4A — renameChat (merged duplicate — was declared twice, causing build crash)
// WHY: There were two renameChat functions. JS doesn't allow duplicate exports.
// The first used /api/dashboard/chats/:id, the second used /api/chats/:id.
// We keep /api/chats/:id because chat.routes.js handles PUT /:chatId → renameChat controller.
export async function renameChat(id, title) {
  const { data } = await api.put(`/api/chats/${id}`, { title });
  return data;
}

export async function updateChat(id, { title, folder_id, folderId } = {}) {
  // Normalize folderId → folder_id for backend
  const payload = { title, folder_id: folder_id ?? folderId };
  const { data } = await api.put(`/api/dashboard/chats/${id}`, payload);
  return data;
}

export async function deleteChat(id) {
  const { data } = await api.delete(`/api/dashboard/chats/${id}`);
  return data;
}

export async function pinChat(id, pinned) {
  const { data } = await api.patch(`/api/chats/${id}/pin`, { pinned });
  return data;
}

// ── Notes ─────────────────────────────────────────────────────────────────
export async function getNotes(folderId = null) {
  const params = folderId ? { folder_id: folderId } : {};
  const { data } = await api.get("/api/notes", { params });
  return data; // array of notes
}

export async function createNote({ title = "Untitled Note", content = "", folderId = null, color } = {}) {
  // Using dashboard route — controller maps folder_id → folderId correctly
  const { data } = await api.post("/api/dashboard/notes", {
    title, content,
    folder_id: folderId,   // dashboard controller maps this to folderId
    color
  });
  return data; // { id, title, content, folder_id, ... }
}


export async function getNote(id) {
  const { data } = await api.get(`/api/notes/${id}`);
  return data;
}


export async function updateNote(id, { title, content, folder_id, color } = {}) {
  // Uses the dashboard route which has the correct controller
  const { data } = await api.put(`/api/dashboard/notes/${id}`, { title, content, folder_id, color });
  return data;
}


export async function deleteNote(id) {
  // Uses the dashboard route which has the correct controller
  const { data } = await api.delete(`/api/dashboard/notes/${id}`);
  return data;
}


export async function pinNote(id, pinned) {
  const { data } = await api.patch(`/api/notes/${id}/pin`, { pinned });
  return data;
}
