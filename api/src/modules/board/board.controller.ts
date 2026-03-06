import { Elysia } from "elysia";
import { createBoard, getAllBoards, updateBoard } from "./board.service";
import { boardCreateDto, boardUpdateDto, getBoardDto } from "./board.model";
import { adminAndStudent, adminOnly } from "@lib/utils/roles-guard";

export const boardController = new Elysia({
    prefix: '/boards',
    detail: {
        tags: ["Board Of Education"]
    }
})
    .post('/', createBoard, { ...boardCreateDto, beforeHandle: adminOnly })
    .put('/:boardId', updateBoard, { ...boardUpdateDto, beforeHandle: adminOnly })
    .get('/', getAllBoards, { ...getBoardDto, beforeHandle: adminAndStudent })