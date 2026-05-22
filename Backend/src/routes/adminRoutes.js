import express from "express";

import {
    getAllUserTasks,
    overdueTasks,
    statistics,
    getCategories,
    addCategory,
    removeCategory,
    editCategory,
    adminGetUsers,
    adminSoftDeleteUser,
    adminRestoreUser,
} from "../controllers/adminController.js";

import {
    authenticate,
    isAdmin,
} from "../middleware/authMiddleware.js";

const router =
    express.Router();

// ALL TASKS
router.get(
    "/tasks",
    authenticate,
    isAdmin,
    getAllUserTasks
);

// OVERDUE
router.get(
    "/overdue",
    authenticate,
    isAdmin,
    overdueTasks
);

// STATISTICS
router.get(
    "/statistics",
    authenticate,
    isAdmin,
    statistics
);

// CATEGORIES
router.get("/categories", authenticate, isAdmin, getCategories);
router.post("/categories", authenticate, isAdmin, addCategory);
router.put("/categories/:id", authenticate, isAdmin, editCategory);
router.delete("/categories/:id", authenticate, isAdmin, removeCategory);

// USER ACCOUNTS MANAGEMENT
router.get("/users", authenticate, isAdmin, adminGetUsers);
router.post("/users/:id/soft-delete", authenticate, isAdmin, adminSoftDeleteUser);
router.post("/users/:id/restore", authenticate, isAdmin, adminRestoreUser);

export default router;