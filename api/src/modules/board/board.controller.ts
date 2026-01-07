import { Elysia } from "elysia";
import { createBoard, getAllBoards, updateBoard } from "./board.service";
import { boardCreateDto, boardUpdateDto, getBoardDto } from "./board.model";

export const boardController = new Elysia({
    prefix: '/boards',
    detail: {
        tags: ["Board Of Education"]
    }
})
    .post('/', createBoard, boardCreateDto)
    .put('/:boardId', updateBoard, boardUpdateDto)
    .get('/', getAllBoards, getBoardDto)