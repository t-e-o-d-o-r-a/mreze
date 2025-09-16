import express from "express";
import { protectRoute, adminRoute } from "../middleware/auth.middleware.js";
import { createOrder, getUserOrders, getAllOrders, updateOrderStatus } from "../controllers/order.controller.js";

const router = express.Router();

router.get("/", protectRoute, adminRoute, getAllOrders);
router.patch("/:id/status", protectRoute, adminRoute, updateOrderStatus);
router.post("/", protectRoute, createOrder);
router.get("/my", protectRoute, getUserOrders);

export default router;