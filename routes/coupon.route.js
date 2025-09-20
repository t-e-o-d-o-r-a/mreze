import express from "express";
import { adminRoute, protectRoute } from "../middleware/auth.middleware.js";
import { validateCoupon, createCoupon } from "../controllers/coupon.controller.js";

const router = express.Router();

router.post("/", protectRoute, adminRoute, createCoupon); // samo admin kreira kupon
router.get("/validate/:code", protectRoute, validateCoupon);

export default router;