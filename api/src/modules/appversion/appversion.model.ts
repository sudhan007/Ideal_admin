import { t } from "elysia";

export const appVersionCreateDto = {
    body: t.Object({
        android: t.Optional(t.String()),
        ios: t.Optional(t.String()),
    }),
    detail: {
        description: "Create or update the App Version document (upserts a single shared document)",
        summary: "Upsert App Version"
    }
}

export const appVersionGetDto = {
    detail: {
        description: "Get the current App Version",
        summary: "Get App Version"
    }
}

export type AppVersionsCreateSchema = typeof appVersionCreateDto.body.static