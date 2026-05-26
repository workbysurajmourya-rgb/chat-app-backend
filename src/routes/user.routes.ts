import express from "express";
import { deleteUser, getUser } from "../controllers/user.controller";
import { authMiddleware } from "../middleware/auth.middleware";
const router = express.Router();

router.get("/all", authMiddleware, getUser);
router.delete("/me", authMiddleware, deleteUser);

export default router;