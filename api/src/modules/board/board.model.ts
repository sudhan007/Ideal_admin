import { baseFields } from "@lib/models/base-model.config";
import { t } from "elysia";

export const BOARD_COLLECTION = "boards";

const boardBase = t.Object({
    boardName: t.Union([t.Literal("CBSE"), t.Literal("TN State Board")]),
    isActive: t.Boolean({ default: true }),
    ...baseFields.properties,
});

export const boardCreateDto = {
    body: t.Object({
        ...boardBase.properties,
    }),
    detail: {
        description: "Create a new Board",
        summary: "Create Board"
    }
}

export const boardUpdateDto = {
    body: t.Partial(boardBase),
    params: t.Object({
        boardId: t.String(),
    }),
    detail: {
        description: "Update an existing Board",
        summary: "Update Board"
    }
}


export const getBoardDto = {
    query: t.Object({
        search: t.Optional(t.String({ minLength: 1 })),
        page: t.Optional(t.Number({ minimum: 1, default: 1 })),
        limit: t.Optional(t.Number({ minimum: 1, maximum: 100, default: 20 })),
    }),
    detail: {
        description: "Get a Board",
        summary: "Get Board"
    }
}


export type CreateBoardSchema = typeof boardCreateDto.body.static
export type UpdateBoardSchema = typeof boardUpdateDto.body.static
export type GetBoardSchema = typeof getBoardDto.query.static