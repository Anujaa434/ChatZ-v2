const express = require("express");
const router = express.Router();

const { requireAuth } = require("../middlewares/auth.middleware");
const controller = require("../controllers/dashboard.controller");

router.get("/sync", requireAuth, controller.getDashboardData);

// Folders
router.post("/folders", requireAuth, controller.createFolder);
router.put("/folders/:id", requireAuth, controller.updateFolder);
router.delete("/folders/:id", requireAuth, controller.deleteFolder);
router.patch("/folders/:id/pin", requireAuth, controller.togglePinFolder);
router.get("/folders/:id/contents", requireAuth, controller.getFolderContents);

// Notes
router.post("/notes", requireAuth, controller.createNote);
router.put("/notes/:id", requireAuth, controller.updateNote);
router.delete("/notes/:id", requireAuth, controller.deleteNote);

// Chats
router.put("/chats/:id", requireAuth, controller.updateChat);
router.delete("/chats/:id", requireAuth, controller.deleteChat);

module.exports = router;
