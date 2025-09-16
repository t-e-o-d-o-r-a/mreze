import express from "express";
import { addToCart, emptyCart, removeFromCart, getCartProducts } from "../controllers/cart.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/", protectRoute, getCartProducts);
router.put("/add/:id", protectRoute, addToCart);
router.delete("/remove/:id", protectRoute, removeFromCart);
router.delete("/", protectRoute, emptyCart);

export default router;