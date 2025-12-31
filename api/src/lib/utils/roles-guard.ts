import type { Context } from "elysia";
import { RoleType } from "@types";
import { DecodePaseto } from "./paseto";

export const adminOnly = (ctx: Context) => roleGuard(ctx, [RoleType.ADMIN])
export const studentOnly = (ctx: Context) => roleGuard(ctx, [RoleType.STUDENT])
export const adminAndStudent = (ctx: Context) => roleGuard(ctx, [RoleType.STUDENT, RoleType.ADMIN])

export const roleGuard = async (
  ctx: Context,
  allowedRoles: RoleType[]
) => {
  const { cookie, set, store, request } = ctx as any;

  let token: string | undefined;
  if (allowedRoles.includes(RoleType.ADMIN)) {
    token = cookie.realestateadmin?.value;
  }

  if (!token && allowedRoles.includes(RoleType.STUDENT)) {
    const authHeader = request.headers.get("authorization");

    if (!authHeader) {
      set.status = 401;
      return { error: "Authorization header missing" };
    }

    if (!authHeader.startsWith("Bearer ")) {
      set.status = 401;
      return { error: "Invalid authorization format" };
    }
    token = authHeader.replace("Bearer ", "").trim();
  }

  if (!token) {
    set.status = 401;
    return { error: "Token missing" };
  }

  try {
    const payload: any = await DecodePaseto(token);

    if (!payload) {
      set.status = 401;
      return { error: "Invalid or expired token" };
    }

    if (!allowedRoles.includes(payload.role)) {
      set.status = 403;
      return { error: "Forbidden: Insufficient role" };
    }

    store.id = payload.id;
    store.role = payload.role;

  } catch (error) {
    console.error("Auth error:", error);
    set.status = 401;
    return { error: "Unauthorized" };
  }
};

