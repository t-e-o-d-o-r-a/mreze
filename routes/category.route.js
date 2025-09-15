import express from "express";
import { protectRoute, adminRoute } from "../middleware/auth.middleware.js";
import { createCategory, deleteCategory, getAllCategories } from "../controllers/category.controller.js";

const router = express.Router();

router.get("/", getAllCategories);
router.post("/", protectRoute, adminRoute, createCategory);
router.delete("/:id", protectRoute, adminRoute, deleteCategory);

export default router;