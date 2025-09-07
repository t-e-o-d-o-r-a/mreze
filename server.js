import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";

import authRoutes from "./routes/auth.route.js"
import productRoutes from "./routes/product.route.js"
import cartRoutes from "./routes/cart.route.js"
import couponRoutes from "./routes/coupon.route.js"
import { connectDB } from "./lib/db.js";

dotenv.config(); // da mozemo da citamo zadrzaj .env fajla

const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.json()); // da moze da se parsira body od request-a
app.use(cookieParser()); //da moze da se pristupi cookijima

app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/coupons", couponRoutes);

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);

    connectDB();
});