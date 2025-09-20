import Coupon from "../models/coupon.model.js";

export const createCoupon = async (req, res) => {
    try {
        const { code, discountPercentage, expirationDate } = req.body;
        if (!code || !discountPercentage || !expirationDate) {
            return res.status(400).json({ message: "Code, discountPercentage, and expirationDate are required" });
        }

        const existing = await Coupon.findOne({ code });
        if (existing) {
            return res.status(400).json({ message: "Coupon code already exists" });
        }

        const coupon = await Coupon.create({
            code,
            discountPercentage,
            expirationDate,
            isActive: true,
        });

        res.status(201).json(coupon);

    } catch (error) {
        console.log("Error in createCoupon controller", error.message);
        res.status(500).json({ error: error.message });
    }
}

export const validateCoupon = async (req, res) => {
    try {
        const { code } = req.params;

        const coupon = await Coupon.findOne({ code: code, isActive: true });

        if (!coupon) {
            return res.status(404).json({ valid: false, message: "Coupon not found" });
        }

        if (coupon.expirationDate < new Date()) {
            coupon.isActive = false;
            await coupon.save();
            return res.status(404).json({ valid: false, message: "Coupon expired" });
        }
        
        res.json({
            valid: true,
            message: "Coupon is valid",
            code: coupon.code,
            discountPercentage: coupon.discountPercentage,
        });

    } catch (error) {
        console.log("Error in validateCoupon controller", error.message);
        res.status(500).json({ error: error.message });
    }
}