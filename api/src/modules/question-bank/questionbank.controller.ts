import Elysia from "elysia";
import { MoveQuestionToExams } from "./questionbank.service";
import { moveQuestionToExamsDto } from "./questionbank.model";

export const QuestionBankController = new Elysia({
    prefix: '/question-bank',
    detail: {
        tags: ["Question Bank"],
    }
})
    .post("/send-to-exams", MoveQuestionToExams, moveQuestionToExamsDto)