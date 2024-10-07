import mongoose from "mongoose";

const schema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true
        },
        email: {
            type: String,
            required: true,
            unique: true
        },
        password: {
            type: String,
            required: true
        },
        isAdmin: {
            type: Boolean,
            default: false,
            required: true
        },
        phone: {
            type: Number,
            required: true
        },
        access_token: {
            type: String,
            // required: true
        },
        refresh_token: {
            type: String,
            // required: true
        },
    },
    {
        timestamps: true,
    }
);

export const User = mongoose.model("User", schema);