import Elysia from "elysia";
import { createQuestion, getAllQuestions, getQuestionById, getQuizQuestions, submitQuizAnswers, updateQuestion } from "./question.service";
import { createQuestionDto, getAllQuizQuestionsDto, getQuestionsByIdDto, getQuizQuestionsDto, submitQuizAnswersDto, updateQuestionDto } from "./question.model";
import { studentOnly } from "@lib/utils/roles-guard";

export const questionController = new Elysia({
    prefix: '/question',
    detail: {
        tags: ["Quiz Questions"],
    }
})

    .post("/", createQuestion, createQuestionDto)
    .get("/", getQuizQuestions, { ...getQuizQuestionsDto, beforeHandle: studentOnly })
    .patch("/:questionId", updateQuestion, updateQuestionDto)
    .get("/all", getAllQuestions, getAllQuizQuestionsDto)
    .get("/:questionId", getQuestionById, getQuestionsByIdDto)
    .post("/submit", submitQuizAnswers, submitQuizAnswersDto)


