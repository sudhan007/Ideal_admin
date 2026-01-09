import Elysia from "elysia";
import { createQuestion } from "./question.service";
import { createQuestionDto } from "./question.model";

export const QuestionController = new Elysia({
    prefix: '/question',
    detail: {
        tags: ["Quiz Questions"],
    }
})

    .post("/", createQuestion, createQuestionDto)
