import { NextFunction, Request, Response } from "express";
import { TryCatch } from "../middlewares/error.js";
import { User } from "../models/user.js";
import ErrorHandler from "../utils/utility-class.js";
import { NewUserRequestBody } from "../types/types.js";
import bcrypt from 'bcrypt'
import { genneralAccessToken, genneralRefreshToken } from "../middlewares/jwtService.js";

export const newUser = TryCatch(
    async (
        req: Request<{}, {}, NewUserRequestBody>,
        res: Response,
        next: NextFunction
    ) => {
        const { name, email, password, confirmPassword, phone } = req.body;
        const reg = /^(([^<>()[\]\.,;:\s@\"]+(\.[^<>()[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i;
        const isCheckEmail = reg.test(email)

        if (!name || !email || !password || !confirmPassword || !phone)
            return next(new ErrorHandler("Please add all fields", 400));

        if (!isCheckEmail)
            return next(new ErrorHandler("Invalid Email", 400));

        if (password !== confirmPassword)
            return next(new ErrorHandler("Password not is equal ConfirmPassword", 400));

        const checkUser = await User.findOne({
            email: email
        })

        if (checkUser !== null) {
            return next(new ErrorHandler("email already exists", 400));
        }

        const user = await User.create({
            name,
            email,
            password: bcrypt.hashSync(password, 10),
            confirmPassword: bcrypt.hashSync(confirmPassword, 10),
            phone
        })

        return res.status(201).json({
            success: true,
            message: `User Created Successfully`,
            data: user
        });
    }
);

export const loginUser = TryCatch(
    async (
        req: Request<{}, {}, NewUserRequestBody>,
        res: Response,
        next: NextFunction
    ) => {
        const { name, email, password, confirmPassword, phone } = req.body;
        const reg = /^(([^<>()[\]\.,;:\s@\"]+(\.[^<>()[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i;
        const isCheckEmail = reg.test(email)

        if (!name || !email || !password || !confirmPassword || !phone)
            return next(new ErrorHandler("Please add all fields", 400));

        if (!isCheckEmail)
            return next(new ErrorHandler("Invalid Email", 400));

        if (password !== confirmPassword)
            return next(new ErrorHandler("Password not is equal ConfirmPassword", 400));

        const checkUser = await User.findOne({
            email: email
        })

        if (checkUser === null) {
            return next(new ErrorHandler("User not defined", 400));
        }

        const comparePassword = bcrypt.compareSync(password, checkUser.password)
        if (!comparePassword)
            return next(new ErrorHandler("Password is incorrect", 400));

        const access_token = await genneralAccessToken({
            idUser: checkUser.id,
            isAdmin: checkUser.isAdmin
        })

        const refresh_token = await genneralRefreshToken({
            idUser: checkUser.id,
            isAdmin: checkUser.isAdmin
        })

        return res.status(201).json({
            success: true,
            message: `Welcome, ${checkUser.name}`,
            checkUser,
            access_token,
            refresh_token
        });
    }
);

export const updateUser = TryCatch(async (req, res, next) => {

    const userId = req.params.id;
    const { name, email, password, phone, isAdmin } = req.body

    const user = await User.findById(userId);
    if (!user) return next(new ErrorHandler("User Not Found", 404));

    if (name) user.name = name;
    if (email) user.email = email;
    if (password) user.password = password;
    if (phone) user.phone = phone;
    if (isAdmin) user.isAdmin = isAdmin;

    await user.save();

    return res.status(201).json({
        success: true,
        message: "User Updated Successfully",
    });
});

export const deleteUSer = TryCatch(async (req, res, next) => {

    const userId = req.params.id;
    const user = await User.findById(userId);
    if (!user) return next(new ErrorHandler("User Not Found", 404));

    await user.deleteOne();

    return res.status(201).json({
        success: true,
        message: "User Deleted Successfully",
    });
});

export const getAllUser = TryCatch(async (req, res, next) => {

    const allUser = await User.find({});

    return res.status(201).json({
        success: true,
        allUser
    });
});

export const getDetailUser = TryCatch(async (req, res, next) => {

    const userId = req.params.id;
    const user = await User.findById(userId);
    if (!user) return next(new ErrorHandler("User Not Found", 404));

    return res.status(201).json({
        success: true,
        user
    });
});