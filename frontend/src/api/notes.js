// frontend/src/api/notes.js
import api, { setAuthToken } from "./axios";

export function initNotesApiAuth() {
  const token = localStorage.getItem("token");
  setAuthToken(token || null);
}

// Notes API calls
export async function fetchNotes() {
  const { data } = await api.get("/api/notes");
  return data; // array of notes
}

export async function fetchNoteById(noteId) {
  const { data } = await api.get(`/api/notes/${noteId}`);
  return data; // single note
}

export async function findNoteByChatAndTitle(chatId, title) {
  try {
    const { data } = await api.get(`/api/notes/find/by-chat`, {
      params: { chatId, title }
    });
    return data; // single note or null
  } catch (error) {
    if (error.response && error.response.status === 404) {
      return null; // Note not found
    }
    throw error;
  }
}

export async function createNote({ title = "Untitled Note", content = "", folderId = null, color = "#5227FF", chatId = null, messageId = null } = {}) {
  const { data } = await api.post("/api/notes", { title, content, folderId, color, chatId, messageId });
  return data; // created note row
}

export async function updateNote(noteId, { title, content, folderId, color, chatId = null, messageId = null }) {
  const { data } = await api.put(`/api/notes/${noteId}`, { title, content, folderId, color, chatId, messageId });
  return data; // updated note row
}

export async function deleteNote(noteId) {
  const { data } = await api.delete(`/api/notes/${noteId}`);
  return data; // { success: true }
}

export async function togglePinNote(noteId, pinned) {
  const { data } = await api.patch(`/api/notes/${noteId}/pin`, { pinned });
  return data; // updated note row
}

// Folders API calls
export async function fetchFolders() {
  const { data } = await api.get("/api/notes/folders/list/all");
  return data; // array of folders
}

export async function createFolder({ name = "New Folder", color = "#5227FF" } = {}) {
  const { data } = await api.post("/api/notes/folders", { name, color });
  return data; // created folder row
}

export async function updateFolder(folderId, { name, color }) {
  const { data } = await api.put(`/api/notes/folders/${folderId}`, { name, color });
  return data; // updated folder row
}

export async function deleteFolder(folderId) {
  const { data } = await api.delete(`/api/notes/folders/${folderId}`);
  return data; // { success: true }
}

export async function togglePinFolder(folderId, pinned) {
  const { data } = await api.patch(`/api/notes/folders/${folderId}/pin`, { pinned });
  return data; // updated folder row
}
