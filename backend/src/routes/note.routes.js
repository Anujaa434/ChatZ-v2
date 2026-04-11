const express = require("express");
const router = express.Router();
const noteController = require("../controllers/note.controller");
const auth = require("../middlewares/auth.middleware");

// Folder routes (place before parameterized note routes to avoid conflicts)
router.get("/folders/list/all", auth.requireAuth, noteController.getFolders);
router.post("/folders", auth.requireAuth, noteController.createFolder);
router.put("/folders/:folderId", auth.requireAuth, noteController.updateFolder);
router.delete("/folders/:folderId", auth.requireAuth, noteController.deleteFolder);
router.patch("/folders/:folderId/pin", auth.requireAuth, noteController.togglePinFolder);

// Note routes
router.get("/", auth.requireAuth, noteController.getNotes);
router.get("/find/by-chat", auth.requireAuth, noteController.findNoteByChatAndTitle); // Place before /:noteId
router.get("/:noteId", auth.requireAuth, noteController.getNoteById);
router.post("/", auth.requireAuth, noteController.createNote);
router.put("/:noteId", auth.requireAuth, noteController.updateNote);
router.delete("/:noteId", auth.requireAuth, noteController.deleteNote);
router.patch("/:noteId/pin", auth.requireAuth, noteController.togglePinNote);

module.exports = router;
