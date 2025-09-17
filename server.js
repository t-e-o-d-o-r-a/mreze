import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import cors from "cors";

import authRoutes from "./routes/auth.route.js"
import productRoutes from "./routes/product.route.js"
import categoryRoutes from "./routes/category.route.js"
import cartRoutes from "./routes/cart.route.js"
import couponRoutes from "./routes/coupon.route.js"
import orderRoutes from "./routes/order.route.js"
import { connectDB } from "./lib/db.js";
import { rateLimiter } from "./lib/rateLimit.js";

dotenv.config(); // da mozemo da citamo zadrzaj .env fajla

const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.json()); // da moze da se parsira body od request-a
app.use(cookieParser()); //da moze da se pristupi cookijima
app.use(helmet());
app.use(rateLimiter);
app.use(cors({
  origin: "http://localhost:3000", // samo frontend sa ovog domena moze da pristupa ovom API-ju
  credentials: true, // za cookies
}));

app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/coupons", couponRoutes);
app.use("/api/orders", orderRoutes);

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);

    connectDB();
});