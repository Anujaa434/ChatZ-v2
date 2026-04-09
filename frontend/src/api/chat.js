// frontend/src/api/chat.js
import api, { setAuthToken } from "./axios";

export function initChatApiAuth() {
  const token = localStorage.getItem("token");
  setAuthToken(token || null);
}

export async function fetchChats() {
  const { data } = await api.get("/api/chats");
  return data;
}

export async function createChat(title = "New Chat") {
  const { data } = await api.post("/api/chats", { title });
  return data; // chat row { id, title, ... }
}

export async function fetchMessages(chatId) {
  const { data } = await api.get(`/api/chats/${chatId}/messages`);
  return data; // array of rows
}

export async function sendMessage({ chatId, message, model, folderId = null }) {
  const { data } = await api.post("/api/chats/send", { chatId, message, model, folderId });
  return data; // { reply }
}

export async function renameChat(chatId, title) {
  const { data } = await api.put(`/api/chats/${chatId}`, { title });
  return data; // updated chat row
}

export async function deleteChat(chatId) {
  const { data } = await api.delete(`/api/chats/${chatId}`);
  return data; // { success: true }
}

export async function togglePinChat(chatId, pinned) {
  const { data } = await api.patch(`/api/chats/${chatId}/pin`, { pinned });
  return data; // updated chat row
}

export async function deleteMessage(chatId, messageId) {
  const { data } = await api.delete(`/api/chats/${chatId}/messages/${messageId}`);
  return data; // { success: true }
}

export async function togglePinMessage(chatId, messageId, pinned) {
  const { data } = await api.patch(`/api/chats/${chatId}/messages/${messageId}/pin`, { pinned });
  return data; // updated message row
}
