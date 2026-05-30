import express from "express";
import {
    getNotifications,
    readNotification,
    readAllNotifications,
    removeNotification,
} from "../controllers/notificationController.js";
import { authenticate } from "../middleware/authMiddleware.js";

const router = express.Router();

// GET ALL NOTIFICATIONS (AND SYNC H-1 DEADLINES)
router.get("/", authenticate, getNotifications);

// MARK ALL NOTIFICATIONS AS READ
router.patch("/read-all", authenticate, readAllNotifications);

// MARK A SINGLE NOTIFICATION AS READ
router.patch("/:id/read", authenticate, readNotification);

// DELETE A SINGLE NOTIFICATION
router.delete("/:id", authenticate, removeNotification);

export default router;
