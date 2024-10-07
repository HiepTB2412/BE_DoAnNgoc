import { Request } from "express";
import { TryCatch } from "../middlewares/error.js";
import ErrorHandler from "../utils/utility-class.js";
import { Product } from "../models/product.js";
import { BaseQuery, NewProductRequestBody, SearchRequestQuery } from "../types/types.js";
import { deleteFromCloudinary, invalidateCache, uploadToCloudinary } from "../utils/features.js";
import { redis, redisTTL } from "../app.js";

export const newProduct = TryCatch(
    async (req: Request<{}, {}, NewProductRequestBody>, res, next) => {
        const { name, price, stock, category, description } = req.body;
        const photos = req.files as Express.Multer.File[] | undefined;

        if (!photos) return next(new ErrorHandler("Please add Photo", 400));

        if (photos.length < 1)
            return next(new ErrorHandler("Please add atleast one Photo", 400));

        if (photos.length > 5)
            return next(new ErrorHandler("You can only upload 5 Photos", 400));

        if (!name || !price || !stock || !category || !description)
            return next(new ErrorHandler("Please enter All Fields", 400));

        // Upload Here

        const checkProduct = await Product.findOne({
            name: name
        })

        if (checkProduct !== null)
            return next(new ErrorHandler("name already exists", 400));

        const photosURL = await uploadToCloudinary(photos);

        await Product.create({
            name,
            price,
            description,
            stock,
            category: category,
            photos: photosURL,
        });

        await invalidateCache({ product: true, admin: true });

        return res.status(201).json({
            success: true,
            message: "Product Created Successfully",
        });
    }
);

// Revalidate on New,Update,Delete Product & on New Order
export const getlatestProducts = TryCatch(async (req, res, next) => {
    let products;

    products = await redis.get("latest-products");

    if (products) products = JSON.parse(products);
    else {
        products = await Product.find({}).sort({ createdAt: -1 }).limit(5);
        await redis.setex("latest-products", redisTTL, JSON.stringify(products));
    }

    return res.status(200).json({
        success: true,
        products,
    });
});

// Revalidate on New,Update,Delete Product & on New Order
export const getAllCategories = TryCatch(async (req, res, next) => {
    let categories;

    categories = await redis.get("categories");

    if (categories) categories = JSON.parse(categories);
    else {
        categories = await Product.distinct("category");
        await redis.setex("categories", redisTTL, JSON.stringify(categories));
    }

    return res.status(200).json({
        success: true,
        categories,
    });
});

// Revalidate on New,Update,Delete Product & on New Order
export const getAllProducts = TryCatch(
    async (req: Request<{}, {}, {}, SearchRequestQuery>, res, next) => {
        const { search, sort, category, price } = req.query;

        const page = Number(req.query.page) || 1;

        const key = `products-${search}-${sort}-${category}-${price}-${page}`;

        let products;
        let totalPage;

        const cachedData = await redis.get(key);
        if (cachedData) {
            const data = JSON.parse(cachedData);
            totalPage = data.totalPage;
            products = data.products;
        } else {
            const limit = Number(process.env.PRODUCT_PER_PAGE) || 8;
            const skip = (page - 1) * limit;

            const baseQuery: BaseQuery = {};

            if (search)
                baseQuery.name = {
                    $regex: search,
                    $options: "i",
                };

            if (price)
                baseQuery.price = {
                    $lte: Number(price),
                };

            if (category) baseQuery.category = category;

            const productsPromise = Product.find(baseQuery)
                .sort(sort && { price: sort === "asc" ? 1 : -1 })
                .limit(limit)
                .skip(skip);

            const [productsFetched, filteredOnlyProduct] = await Promise.all([
                productsPromise,
                Product.find(baseQuery),
            ]);

            products = productsFetched;
            totalPage = Math.ceil(filteredOnlyProduct.length / limit);

            await redis.setex(key, 30, JSON.stringify({ products, totalPage }));
        }

        return res.status(200).json({
            success: true,
            products,
            totalPage,
        });
    }
);

export const getSingleProduct = TryCatch(async (req, res, next) => {
    let product;
    const id = req.params.id;
    const key = `product-${id}`;

    product = await redis.get(key);
    if (product) product = JSON.parse(product);
    else {
        product = await Product.findById(id);
        if (!product) return next(new ErrorHandler("Product Not Found", 404));

        await redis.setex(key, redisTTL, JSON.stringify(product));
    }

    return res.status(200).json({
        success: true,
        product,
    });
});

export const updateProduct = TryCatch(async (req, res, next) => {
    const { id } = req.params;
    const { name, price, stock, category, description } = req.body;
    const photos = req.files as Express.Multer.File[] | undefined;

    const product = await Product.findById(id);

    if (!product) return next(new ErrorHandler("Product Not Found", 404));

    if (photos && photos.length > 0) {
        // Upload new photos to Cloudinary
        const photosURL = await uploadToCloudinary(photos);

        // Get the public_id of existing photos for deletion from Cloudinary
        const ids = product.photos.map((photo) => photo.public_id);
        await deleteFromCloudinary(ids);

        // Remove old photos from product.photos
        product.photos.splice(0, product.photos.length); // Clear the DocumentArray

        // Add new photos to the DocumentArray
        photosURL.forEach(photo => {
            product.photos.push({ public_id: photo.public_id, url: photo.url });
        });
    }

    // Update other fields if they are present
    if (name) product.name = name;
    if (price) product.price = price;
    if (stock) product.stock = stock;
    if (category) product.category = category;
    if (description) product.description = description;

    // Save the updated product
    await product.save();

    // Invalidate the cache for the updated product
    await invalidateCache({
        product: true,
        productId: String(product._id),
        admin: true,
    });

    return res.status(200).json({
        success: true,
        message: "Product Updated Successfully",
    });
});

export const deleteProduct = TryCatch(async (req, res, next) => {
    const product = await Product.findById(req.params.id);
    if (!product) return next(new ErrorHandler("Product Not Found", 404));

    const ids = product.photos.map((photo) => photo.public_id);

    await deleteFromCloudinary(ids);

    await product.deleteOne();

    await invalidateCache({
        product: true,
        productId: String(product._id),
        admin: true,
    });

    return res.status(200).json({
        success: true,
        message: "Product Deleted Successfully",
    });
});
