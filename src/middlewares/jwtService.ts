import jwt, { JwtPayload } from 'jsonwebtoken'
import { TryCatch } from './error.js'
import { config } from "dotenv";
import ErrorHandler from '../utils/utility-class.js';

config({
    path: "../../env",
});

export interface Payload {
    idUser: string,
    isAdmin: boolean
}

export const genneralAccessToken = async (payload: Payload) => {
    const secret = process.env.ACCESS_TOKEN;
    if (!secret) {
        throw new Error("ACCESS_TOKEN is not defined in the environment variables.");
    }

    const access_token = jwt.sign(payload, secret, { expiresIn: '1h' });
    return access_token;
}

export const genneralRefreshToken = async (payload: Payload) => {
    const secret = process.env.REFRESH_TOKEN;
    if (!secret) {
        throw new Error("GenneralREFRESH_TOKEN is not defined in the environment variables.");
    }

    const refresh_token = jwt.sign(payload, secret, { expiresIn: '365d' });
    return refresh_token;
}

export const refreshToken = TryCatch(async (req, res, next) => {

    const tokenHeader = req.headers.token;

    let token: string;

    if (Array.isArray(tokenHeader)) {
        token = tokenHeader[0]; // Nếu là mảng, lấy phần tử đầu tiên
    } else {
        token = tokenHeader as string; // Nếu là chuỗi, sử dụng trực tiếp
    }

    if (!token) {
        return next(new ErrorHandler("No token provided", 401));
    }

    jwt.verify(token, process.env.REFRESH_TOKEN as string, async (err, user) => {
        if (err) {
            return next(new ErrorHandler("The authentication failed", 404));
        }

        // Kiểm tra nếu 'user' là JwtPayload
        if (typeof user !== 'string' && user !== null) {
            const { id, isAdmin } = user as jwt.JwtPayload;
            const access_token = await genneralAccessToken({
                idUser: id,
                isAdmin: isAdmin
            });
            return res.status(200).json({
                success: true,
                message: "SUCCESS",
                access_token
            });
        } else {
            return next(new ErrorHandler("Invalid token format", 401));
        }
    });
});



export const authMiddleWare = TryCatch(async (req, res, next) => {
    const tokenHeader = req.headers.token;

    let token: string;

    if (Array.isArray(tokenHeader)) {
        token = tokenHeader[0]; // Nếu là mảng, lấy phần tử đầu tiên
    } else {
        token = tokenHeader as string; // Nếu là chuỗi, sử dụng trực tiếp
    }

    if (!token) {
        return next(new ErrorHandler("No token provided", 401));
    }

    jwt.verify(token, process.env.ACCESS_TOKEN as string, (err, user) => {
        if (err) {
            return next(new ErrorHandler("The authentication failed", 404));
        }
        // Kiểm tra nếu user là đối tượng và có thuộc tính isAdmin
        if (typeof user === 'object' && user.isAdmin !== undefined) {
            if (user?.isAdmin) {
                next(); // Nếu isAdmin là true, tiếp tục
            } else {
                return next(new ErrorHandler("Access denied. Admins only.", 403));
            }
        } else {
            return next(new ErrorHandler("The authentication failed", 404));
        }
    });
});

export const authUserMiddleWare = TryCatch(async (req, res, next) => {
    const tokenHeader = req.headers.token;
    const userId = req.params.id

    let token: string;

    if (Array.isArray(tokenHeader)) {
        token = tokenHeader[0]; // Nếu là mảng, lấy phần tử đầu tiên
    } else {
        token = tokenHeader as string; // Nếu là chuỗi, sử dụng trực tiếp
    }

    if (!token) {
        return next(new ErrorHandler("No token provided", 401));
    }

    jwt.verify(token, process.env.ACCESS_TOKEN as string, (err, user) => {
        if (err) {
            return next(new ErrorHandler("The authentication failed", 404));
        }
        // Kiểm tra nếu user là đối tượng và có thuộc tính isAdmin
        if (typeof user === 'object' && user.isAdmin !== undefined) {
            if (user?.isAdmin || user?.id === userId) {
                next(); // Nếu isAdmin là true, tiếp tục
            } else {
                return next(new ErrorHandler("Access denied. Admins only.", 403));
            }
        } else {
            return next(new ErrorHandler("The authentication failed", 404));
        }
    });
});