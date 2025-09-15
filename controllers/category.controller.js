import Category from "../models/category.model.js";

export const getAllCategories = async (req, res) => {
    try {
        const categories = await Category.find({});
        res.status(200).json({ categories });

    } catch (error) {
        console.log("Error in getAllCategories controller", error.message);
        res.status(500).json({ error: error.message });
    }
}

export const createCategory = async (req, res) => {
    try {
        const { name, description } = req.body;

        const existing = await Category.findOne({ name });
        if (existing) {
            return res.status(400).json({ error: "Category already exists" });
        }

        const category = await Category.create({ name, description });
        res.status(201).json(category);

    } catch (error) {
        console.log("Error in createCategory controller", error.message);
        res.status(500).json({ error: error.message });
    }
}

export const deleteCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const category = await Category.findById(id);

        if (!category) {
            return res.status(404).json({ error: "Category not found" });
        }

        await Category.findByIdAndDelete(id);
        res.json({ message: "Category deleted successfully" });

    } catch (error) {
        console.log("Error in deleteCategory controller", error.message);
        res.status(500).json({ error: error.message });
    }
}