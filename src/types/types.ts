import { NextFunction, Request, Response } from "express";

export type ControllerType = (
    req: Request,
    res: Response,
    next: NextFunction
) => Promise<void | Response<any, Record<string, any>>>;

export interface NewProductRequestBody {
    name: string;
    category: string;
    price: number;
    stock: number;
    description: string;
}

export type InvalidateCacheProps = {
    product?: boolean;
    order?: boolean;
    admin?: boolean;
    review?: boolean;
    userId?: string;
    orderId?: string;
    productId?: string | string[];
};

export interface NewUserRequestBody {
    name: string,
    email: string,
    password: string,
    confirmPassword: string,
    phone: Number
}

export interface BaseQuery {
    name?: {
        $regex: string;
        $options: string;
    };
    price?: { $lte: number };
    category?: string;
}

export type SearchRequestQuery = {
    search?: string;
    price?: string;
    category?: string;
    sort?: string;
    page?: string;
};