import { Elysia } from "elysia";
import { adminDashboardDto } from "./dashboard.model";
import { getTotalCounts } from "./dashboard.service";

export const adminDashBoardController = new Elysia({
    prefix: '/admin-dashboard',
    detail: {
        tags: ["Admin-Dashboard"]
    }
})
    .get('/', getTotalCounts, adminDashboardDto)