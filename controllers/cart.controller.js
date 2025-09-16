import Product from "../models/product.model.js";

export const getCartProducts = async (req, res) => {
    try {
        const productIds = req.user.cartItems.map(item => item.product);
        const products = await Product.find({ _id: { $in: productIds } });

        const cartItems = products.map((product) => {
            const item = req.user.cartItems.find(cartItem => cartItem.product.toString() === product.id.toString());
            return {
                ...product.toJSON(),
                quantity: item.quantity,
            }
        });

        res.json({ cartItems });

    } catch (error) {
        console.log("Error in getCartProducts controller", error.message);
        res.status(500).json({ error: error.message });
    }
}

export const addToCart = async (req, res) => {
    try {
        const { id: productId } = req.params;
        const user = req.user;

        const existingItem = user.cartItems.find(item => item.product.toString() === productId);
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            user.cartItems.push({ product: productId, quantity: 1 });
        }

        await user.save();
        res.json({ message: "Added to cart", cartItems: user.cartItems })

    } catch (error) {
        console.log("Error in addToCart controller", error.message);
        res.status(500).json({ error: error.message });
    }
}

export const emptyCart = async (req, res) => {
    try {
        const user = req.user;

        user.cartItems = [];

        await user.save();
        res.json({ message: "Cart emptied" });

    } catch (error) {
        console.log("Error in emptyCart controller", error.message);
        res.status(500).json({ error: error.message });
    }
}

export const removeFromCart = async (req, res) => {
    try {
        const { id: productId } = req.params;
        if (!productId) {
            return res.status(400).json({ message: "Product ID is required" });
        }

        const user = req.user;

        const existingItem = user.cartItems.find(
            (item) => item.product.toString() === productId
        );

        if (!existingItem) {
            return res.status(404).json({ message: "Product not found in cart" });
        }

        existingItem.quantity -= 1;

        // Ako quantity padne na 0, ukloni proizvod skroz
        if (existingItem.quantity <= 0) {
            user.cartItems = user.cartItems.filter(
                (item) => item.product.toString() !== productId
            );
        }

        await user.save();
        res.json({ cartItems: user.cartItems });

    } catch (error) {
        console.log("Error in removeFromCart controller", error.message);
        res.status(500).json({ error: error.message });
    }
}