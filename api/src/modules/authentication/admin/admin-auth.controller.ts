import { Elysia } from "elysia";
import { adminSession, createAdmin, loginAdmin, logoutAdmin } from "./admin-auth.service";
import { createAdminDto, loginAdminDto, logoutDto, sessionDto } from "./admin-auth.model";

export const adminAuthController = new Elysia({
    prefix: '/admin-auth',
    detail: {
        tags: ["Admin Authentication"]
    }
})
    .post("/create", createAdmin, createAdminDto)
    .post("/login", loginAdmin, loginAdminDto)
    .post("/logout", logoutAdmin, logoutDto)
    .get("/session", adminSession, sessionDto)
