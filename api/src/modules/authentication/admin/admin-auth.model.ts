import { t } from "elysia";
import { baseFields } from "@lib/models/base-model.config";

export const ADMIN_COLLECTION = "admins";


const adminModel = t.Object({
    email: t.String({ format: "email" }),
    password: t.String(),
    role: t.Optional(t.String({ default: "admin" })),
    isActive: t.Optional(t.Boolean({ default: true })),
    ...baseFields.properties
})

export const createAdminDto = {
    body: adminModel,
    detail: {
        description: "Create a new Admin",
        summary: "Create Admin"
    }
}
export const loginAdminDto = {
    body: t.Object({
        email: t.String({ format: "email" }),
        password: t.String(),
    }),
    detail: {
        description: "Login Admin",
        summary: "Login Admin"
    }
}
export const logoutDto = {
    detail: {
        description: "Logout Admin",
        summary: "Logout Admin"
    }
}
export const sessionDto = {
    detail: {
        description: "Session Admin",
        summary: "Session Admin"
    }
}

export type CreateAdminSchema = typeof createAdminDto.body.static
export type LoginAdminSchema = typeof loginAdminDto.body.static
export type LogOutAdminSchema = typeof logoutDto.detail
export type AdminSessionSchema = typeof sessionDto.detail

