import { baseFields } from "@lib/models/base-model.config";
import { t } from "elysia";


const boardBase = t.Object({
    boardName: t.String(),
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
        search: t.Optional(t.String()),
        page: t.Optional(t.String()),
        limit: t.Optional(t.String()),
    }),
    detail: {
        description: "Get a Board",
        summary: "Get Board"
    }
}


export type CreateBoardSchema = typeof boardCreateDto.body.static
export type UpdateBoardSchema = typeof boardUpdateDto.body.static
export type GetBoardSchema = typeof getBoardDto.query.static