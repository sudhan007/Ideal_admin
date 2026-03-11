import { Elysia } from "elysia";
import { getAppVersion, upsertAppVersion } from "./appversion.service";
import { appVersionCreateDto, appVersionGetDto } from "./appversion.model";
import { adminAndStudent, adminOnly } from "@lib/utils/roles-guard";

export const appVersionController = new Elysia({
    prefix: '/app-version',
    detail: {
        tags: ["App Version"]
    }
})
    .post('/', upsertAppVersion, { ...appVersionCreateDto, beforeHandle: adminOnly })
    .get('/', getAppVersion, { ...appVersionGetDto })
