import { Context } from "elysia";
import { ADMIN_COLLECTION, CreateAdminSchema, LoginAdminSchema } from "./admin-auth.model";
import { getCollection } from "@lib/config/db.config";
import { DecodePaseto, EncodePaseto } from "@lib/utils/paseto";
import { ObjectId } from "mongodb";

export const createAdmin = async (ctx: Context<{ body: CreateAdminSchema }>) => {
    const { body, set } = ctx;
    const { email, password } = body
    try {

        const adminCollection = await getCollection(ADMIN_COLLECTION);

        const existing = await adminCollection.findOne({ email: email });

        if (existing) {
            set.status = 400;
            return {
                message: "Email already exists",
            };
        }
        const hashedPassword = await Bun.password.hash(password);
        await adminCollection.insertOne({
            email,
            password: hashedPassword,
            role: "admin",
        });

        set.status = 201;

        return {
            message: "Admin created successfully",
        }

    } catch (error: any) {
        console.log("Create Admin Error", error)
        set.status = 500
        return { error: "Failed to create admin", status: false };
    }
}
export const loginAdmin = async (ctx: Context<{ body: LoginAdminSchema }>) => {
    const { body, set } = ctx;
    const { email, password } = body
    try {

        const adminCollection = await getCollection(ADMIN_COLLECTION);

        const admin = await adminCollection.findOne({ email: email });

        if (!admin) {
            set.status = 400;
            return { message: "Invalid email or password" };
        }

        if (await Bun.password.verify(password, admin.password)) {
            let token = await EncodePaseto({
                id: admin._id.toString(),
                email: admin.email,
                role: admin.role,
            })
            set.status = 200;
            set.cookie = {
                ideal_access_token_admin: {
                    value: token,
                    httpOnly: true,
                    secure: true,
                    sameSite: "none",
                    path: "/",
                    maxAge: 1000 * 60 * 60 * 24,
                    expires: new Date(Date.now() + 1000 * 60 * 60 * 24),
                },
            };
            return {
                message: "Login Successful",
                data: {
                    email: admin.email,
                    token,
                },
                ok: true,
            };
        }
        set.status = 401;
        return {
            message: "Invalid email or password",
        };

    } catch (error: any) {
        console.log("Login Admin Error", error)
        set.status = 500
        return { error: "Failed to Login admin", status: false };
    }
}
export const logoutAdmin = async (ctx: Context) => {
    const { set } = ctx;
    set.status = 200;
    set.cookie = {
        ideal_access_token_admin: {
            value: "",
            httpOnly: true,
            secure: true,
            sameSite: "lax",
            path: "/",
            maxAge: 0,
            expires: new Date(0),
        },
    };
    return {
        message: "Logout Successful",
        ok: true,
    };
}
export const adminSession = async (ctx: Context) => {
    const { set, cookie } = ctx;
    try {
        let pasetoToken: any = cookie.ideal_access_token_admin!.value ?? "";
        const adminCollection = await getCollection(ADMIN_COLLECTION);
        console.log(pasetoToken)
        if (!pasetoToken) {
            set.status = 401;
            return {
                message: "Unauthorized",
            };
        }
        const payload: any = await DecodePaseto(pasetoToken);
        console.log(payload)
        if (!payload) {
            set.status = 401;
            return {
                message: "Unauthorized",
            };
        }

        console.log("password")
        const { password, ...admin }: any = await adminCollection.findOne(new ObjectId(payload.id));
        if (!admin) {
            set.status = 401;
            return {
                message: "Unauthorized",
            };
        }
        set.status = 200;
        return {
            message: "Session retrieved successfully",
            data: admin,
            status: true
        };
    } catch (error: any) {
        console.log("Admin Session Error", error)
        set.status = 401;
        return {
            message: "Unauthorized",
            status: false
        }
    }
}