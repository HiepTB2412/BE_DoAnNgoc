import { UploadApiResponse, v2 as cloudinary } from "cloudinary";
import mongoose from "mongoose";
import { Redis } from "ioredis";
import { redis } from "../app.js";
import { InvalidateCacheProps } from "../types/types.js";

const getBase64 = (file: Express.Multer.File) =>
    `data:${file.mimetype};base64,${file.buffer.toString("base64")}`;

export const uploadToCloudinary = async (files: Express.Multer.File[]) => {
    const promises = files.map(async (file) => {
        return new Promise<UploadApiResponse>((resolve, reject) => {
            cloudinary.uploader.upload(getBase64(file), (error, result) => {
                if (error) return reject(error);
                resolve(result!);
            });
        });
    });

    const result = await Promise.all(promises);

    return result.map((i) => ({
        public_id: i.public_id,
        url: i.secure_url,
    }));
};

export const deleteFromCloudinary = async (publicIds: string[]) => {
    const promises = publicIds.map((id) => {
        return new Promise<void>((resolve, reject) => {
            cloudinary.uploader.destroy(id, (error, result) => {
                if (error) return reject(error);
                resolve();
            });
        });
    });

    await Promise.all(promises);
};

export const connectDB = (uri: string) => {
    mongoose
        .connect(uri, {
            dbName: "DoAn",
        })
        .then((c) => console.log(`DB Connected to ${c.connection.host}`))
        .catch((e) => console.log(e));
};

export const invalidateCache = async ({
    product,
    order,
    admin,
    review,
    userId,
    orderId,
    productId,
}: InvalidateCacheProps) => {
    if (review) {
        await redis.del([`reviews-${productId}`]);
    }

    if (product) {
        const productKeys: string[] = [
            "latest-products",
            "categories",
            "all-products",
        ];

        if (typeof productId === "string") productKeys.push(`product-${productId}`);

        if (typeof productId === "object")
            productId.forEach((i) => productKeys.push(`product-${i}`));

        await redis.del(productKeys);
    }
    if (order) {
        const ordersKeys: string[] = [
            "all-orders",
            `my-orders-${userId}`,
            `order-${orderId}`,
        ];

        await redis.del(ordersKeys);
    }
    if (admin) {
        await redis.del([
            "admin-stats",
            "admin-pie-charts",
            "admin-bar-charts",
            "admin-line-charts",
        ]);
    }
};