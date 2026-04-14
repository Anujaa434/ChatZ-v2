const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth.middleware");
const controller = require("../controllers/chat.controller");

router.get("/", auth.requireAuth, controller.getChats);
router.post("/", auth.requireAuth, controller.createChat); // ✅ MUST EXIST
router.post("/send", auth.requireAuth, controller.sendMessage);
router.get("/:chatId/messages", auth.requireAuth, controller.getMessages);
router.delete("/:chatId/messages/:messageId", auth.requireAuth, controller.deleteMessage);
router.patch("/:chatId/messages/:messageId/pin", auth.requireAuth, controller.togglePinMessage);
router.put("/:chatId", auth.requireAuth, controller.renameChat);
router.patch("/:chatId/pin", auth.requireAuth, controller.togglePinChat);
router.delete("/:chatId", auth.requireAuth, controller.deleteChat);

module.exports = router;
