import express from "express";
import { getMessages } from "../controllers/message.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router = express.Router();

router.get("/:receiverId", authMiddleware, getMessages);

export default router;