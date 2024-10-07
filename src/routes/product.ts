import express from "express";
import { deleteProduct, getAllProducts, getAllCategories, getlatestProducts, getSingleProduct, newProduct, updateProduct } from "../controllers/product.js";
import { mutliUpload } from "../middlewares/multer.js";
import { authMiddleWare } from "../middlewares/jwtService.js";

const app = express.Router();

//To Create New Product  - /api/v1/product/new
app.post("/new", authMiddleWare, mutliUpload, newProduct);

//To get last 10 Products  - /api/v1/product/latest
app.get("/latest", getlatestProducts);

//To get all unique Categories  - /api/v1/product/categories
app.get("/categories", getAllCategories);

//To get all Products   - /api/v1/product/admin-products
app.get("/all-products", getAllProducts);

// To get, update, delete Product
app
    .route("/:id")
    .get(getSingleProduct)
    .put(authMiddleWare, mutliUpload, updateProduct)
    .delete(authMiddleWare, deleteProduct);

export default app;