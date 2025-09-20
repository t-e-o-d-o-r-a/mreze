import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
    {
		user: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
		products: [
			{
				product: {
					type: mongoose.Schema.Types.ObjectId,
					ref: "Product",
					required: true,
				},
				quantity: {
					type: Number,
					required: true,
					min: 1,
				},
			},
		],
		totalAmount: {
			type: Number,
			required: true,
			min: 0,
		},
		coupon: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Coupon",
			default: null,
		},
		status: {
			type: String,
			enum: ["pending", "completed", "canceled"],
            default: "pending",
		},
	},
	{ timestamps: true }
);

const Order = mongoose.model("Order", orderSchema);

export default Order;