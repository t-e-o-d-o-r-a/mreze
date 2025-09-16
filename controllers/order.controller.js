import Coupon from "../models/coupon.model.js";
import Order from "../models/order.model.js";
import User from "../models/user.model.js";

export const createOrder = async (req, res) => {
    try {
        const { couponCode } = req.body;
        const user = await User.findById(req.user._id).populate("cartItems.product");

        if (!user.cartItems.length) {
            return res.status(400).json({ error: "Cart is empty" });
        }

        // ukupan iznos
        let totalAmount = user.cartItems.reduce((sum, item) => {
            return sum + item.product.price * item.quantity;
        }, 0);

        // kupon
        let coupon = null;
        if (couponCode) {
            coupon = await Coupon.findOne({ code: couponCode, isActive: true });
            if (!coupon) {
                return res.status(404).json({ message: "Coupon not found or inactive" });
            }
            // ako je istekao, a stoji i dalje da je aktivan
            if (coupon.expirationDate < new Date()) {
                coupon.isActive = false;
                await coupon.save();
                return res.status(410).json({ message: "Coupon expired" });
            }
            
            if (coupon) {
                totalAmount -= (totalAmount * coupon.discountPercentage) / 100;
            }
        }

        // nova porudzbina
        const newOrder = new Order({
            user: req.user._id,
            products: user.cartItems.map(item => ({
                product: item.product._id,
                quantity: item.quantity,
                price: item.product.price,
            })),
            totalAmount,
            status: "pending",
        });
        await newOrder.save();

        // prazni se korpa
        user.cartItems = [];
        await user.save();

        res.status(201).json({ 
            success: true,
            message: "Order created successfully",
            order: newOrder,
        });

    } catch (error) {
        console.log("Error in createOrder controller", error.message);
        res.status(500).json({ error: error.message });
    }
}

export const getUserOrders = async (req, res) => {
    try {
        const orders = await Order.find({ user: req.user._id }).populate("products.product").sort({ createdAt: -1 });
        res.status(200).json({ orders });

    } catch (error) {
        console.log("Error in getUserOrders controller", error.message);
        res.status(500).json({ error: error.message });
    }
}

export const getAllOrders = async (req, res) => {
    try {
        const orders = await Order.find({}).populate("user", "name email").populate("products.product").sort({ createdAt: -1 });
        res.status(200).json({ orders });
        
    } catch (error) {
        console.log("Error in getAllOrders controller", error.message);
        res.status(500).json({ error: error.message });
    }
}

export const updateOrderStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!["pending", "completed", "canceled"].includes(status)) {
            return res.status(400).json({ error: 'Invalid status.' });
        }

        const order = await Order.findById(id);
        if (!order) {
            return res.status(404).json({ error: "Order not found" });
        }

        order.status = status;
        await order.save();

        res.json({ message: "Order status updated", order });

    } catch (error) {
        console.log("Error in updateOrderStatus controller", error.message);
        res.status(500).json({ error: error.message });
    }
};
