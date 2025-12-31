import { t } from "elysia";

export const baseFields = t.Optional(
    t.Object({
        createdAt: t.Optional(t.String({ format: "date-time", description: "Timestamp when the record was created" })),
        updatedAt: t.Optional(t.String({ format: "date-time", description: "Timestamp when the record was last updated" })),
        deletedAt: t.Optional(t.String({ format: "date-time", description: "Timestamp when the record was deleted" })),
        isDeleted: t.Boolean({ default: false, description: "Indicates if the record is deleted" }),
    })
);