import express from "express";
import {
    deleteUSer,
    getAllUser,
    getDetailUser,
    loginUser,
    newUser,
    updateUser,
} from "../controllers/user.js";
import { authMiddleWare, authUserMiddleWare, refreshToken } from "../middlewares/jwtService.js";

const app = express.Router();

// route - /api/v1/user/new
app.post("/new", newUser);
// route - /api/v1/user/login
app.post("/login", loginUser)
// route - /api/v1/user/

app.get("/all", authMiddleWare, getAllUser)
// route - /api/v1/user/

app
    .route("/:id")
    .get(authUserMiddleWare, getDetailUser)
    .post(refreshToken)
    .put(authMiddleWare, updateUser)
    .delete(authMiddleWare, deleteUSer)


export default app;