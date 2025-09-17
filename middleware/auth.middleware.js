import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import { redis } from "../lib/redis.js";

// proverava da li je user autentifikovan (pomocu access tokena)
export const protectRoute = async (req, res, next) => {
    try {
        const accessToken = req.cookies.accessToken;

        if (!accessToken) {
            return res.status(401).json({ message: "Unauthorized: no access token provided" });
        }

        // da li je token na blacklisti
        const isBlacklisted = await redis.get(`blacklist:${accessToken}`);
        if (isBlacklisted) {
            return res.status(401).json({ message: "Unauthorized: token is blacklisted" });
        }

        // da li je token ispravan (verifikacija)
        try {
            const decoded = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);
            const user = await User.findById(decoded.userId).select("-password");

            if (!user) {
                return res.status(401).json({ message: "User not found" });
            }

            req.user = user;
            next();

        } catch (error) {
            if (error.name === "TokenExpiredError") {
                return res.status(401).json({ message: "Unauthorized: access token expired" });
            }
            throw error;
        }
        
    } catch (error) {
        console.log("Error in protectRoute middleware", error.message);
        return res.status(401).json({ message: "Unauthorized: no access token" });
    }
}

export const adminRoute = (req, res, next) => {
    if (req.user && req.user.role === "admin") {
        next();
    } else {
        return res.status(403).json({ message: "Access denied: admin only" });
    }
}