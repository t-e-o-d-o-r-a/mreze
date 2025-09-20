import Product from "../models/product.model.js";
import Category from "../models/category.model.js";
import { redis } from "../lib/redis.js";
import cloudinary from "../lib/cloudinary.js"; 
import User from "../models/user.model.js";

export const getAllProducts = async (req, res) => {
    try {
        const products = await Product.find({}).populate("category", "name description"); // da nadje sve, bez ikakvih filtera
        res.json({ products });

    } catch (error) {
        console.log("Error in getAllProducts controller", error.message);
        res.status(500).json({ error: error.message });
    }
}

// posto im svi cesto pristupaju, cuvace se i u redis-u
export const getFeaturedProducts = async (req, res) => {
    try {
        let featuredProducts = await redis.get("featured_products");
        if (featuredProducts) {
            return res.json(JSON.parse(featuredProducts));
        }

        // ako nisu u redis-u, onda se ucitaju iz mongodb-a
        featuredProducts = await Product.find({ isFeatured: true }).populate("category", "name description").lean(); // lean vraca obicne JS objekte umesto mongodb dokumenta

        if (!featuredProducts) {
            return res.status(404).json({ message: "No featured products found" });
        }

        await redis.set("featured_products", JSON.stringify(featuredProducts));
        res.json(featuredProducts);

    } catch (error) {
        console.log("Error in getFeaturedProducts controller", error.message);
        res.status(500).json({ error: error.message });
    }
}

export const createProduct = async (req, res) => {
    try {
        const { name, description, price, category } = req.body;

        if (!req.file) {
            return res.status(400).json({ error: "Product image is required" });
        }

        // upload slike na Cloudinary
        const cloudinaryResponse = await cloudinary.uploader.upload_stream(
        { folder: "products" },
        async (error, result) => {
            if (error) {
                return res.status(500).json({ error: "Image upload failed" });
            }

            const existingCategory = await Category.findById(category);
            if (!existingCategory) {
                return res.status(400).json({ error: "Invalid category" });
            }

            let product = await Product.create({
                name,
                description,
                price,
                image: result.secure_url,
                category,
            });

            product = await product.populate("category", "name description");

            return res.status(201).json(product);
        }
        );

        // stream-ovanje fajla u Cloudinary
        cloudinaryResponse.end(req.file.buffer);

    } catch (error) {
        console.log("Error in createProduct controller", error.message);
        res.status(500).json({ error: error.message });
    }
}

export const deleteProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }

        // brisanje slike proizvoda
        if (product.image) {
            const publicId = product.image.split("/").pop().split(".")[0];
            try {
                await cloudinary.uploader.destroy(`products/${publicId}`);
                console.log("deleted image");
            } catch (error) {
                console.log("error deleting image");
            }
        }

        await Product.findByIdAndDelete(req.params.id);

        // ako postoji u necijoj korpi, obrisace se i odatle
        await User.updateMany(
            { "cartItems.product": req.params.id },
            { $pull: { cartItems: { product: req.params.id } } }
        );

        res.json({ message: "Product deleted successfully" });
        
    } catch (error) {
        console.log("Error in deleteProduct controller", error.message);
        res.status(500).json({ error: error.message });
    }
}

export const getRecommendedProducts = async (req, res) => {
    try {
        const products = await Product.aggregate([
            {
                $sample: { size: 3 },
            },
            {
                $project: {
                    _id: 1,
                    name: 1,
                    description: 1,
                    image: 1,
                    price: 1,
                }
            },
        ]);

        const populatedProducts = await Product.populate(products, { path: "category", select: "name description" });

        res.json(populatedProducts);

    } catch (error) {
        console.log("Error in getRecommendedProducts controller", error.message);
        res.status(500).json({ error: error.message });
    }
}

export const getProductsByCategory = async (req, res) => {
    try {
        const { category } = req.params;
        const products = await Product.find({ category }).populate("category", "name description");

        res.json(products);

    } catch (error) {
        console.log("Error in getProductsByCategory controller", error.message);
        res.status(500).json({ error: error.message });
    }
}

// update i mongodb i redis
export const toggleFeaturedProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);

        if (product) {
            product.isFeatured = !product.isFeatured;
            const updatedProduct = await product.save();

            // redis
            await updateFeaturedProductsCache();
            res.json(updatedProduct);
        } else {
            return res.status(404).json({ message: "Product not found" });
        }

    } catch (error) {
        console.log("Error in toggleFeaturedProduct controller", error.message);
        res.status(500).json({ error: error.message });
    }
}

async function  updateFeaturedProductsCache() {
    try {
        const featuredProducts = await Product.find({ isFeatured: true }).lean();
        await redis.set("featured_products", JSON.stringify(featuredProducts));

    } catch (error) {
        console.log("Error while updating cached featured products");
    }
}