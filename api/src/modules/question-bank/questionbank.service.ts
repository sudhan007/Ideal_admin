
import { getCollection } from "@lib/config/db.config";
import { Context } from "elysia";
import { EXAM_COLLECTION, EXAM_QUIZ_COLLECTION, QUESTIONS_COLLECTION } from "@lib/Db_collections";
import { moveQuestionToExamsSchema } from "./questionbank.model";
import { ObjectId } from "mongodb";

export const MoveQuestionToExams = async (ctx: Context<{ body: moveQuestionToExamsSchema }>) => {
    const { body, set } = ctx;
    const { examIds, questionIds } = body;

    try {
        const questionsCollection = await getCollection(QUESTIONS_COLLECTION);
        const examQuizCollection = await getCollection(EXAM_QUIZ_COLLECTION);
        const examCollection = await getCollection(EXAM_COLLECTION);

        const exams = await examCollection.find({
            _id: { $in: examIds.map(id => new ObjectId(id)) },
            isDeleted: false,
        }).toArray();

        if (exams.length !== examIds.length) {
            set.status = 404;
            return { error: "One or more exams not found" };
        }

        const questions = await questionsCollection.find({
            _id: { $in: questionIds.map(id => new ObjectId(id)) },
            isDeleted: false,
        }).toArray();

        if (questions.length === 0) {
            set.status = 404;
            return { error: "No valid questions found" };
        }

        const now = new Date();
        const examQuizDocs = [];

        for (const examId of examIds) {
            for (const question of questions) {
                const {
                    _id,
                    courseId,
                    chapterId,
                    lessonId,
                    questionModel,
                    questionSet,
                    ...rest
                } = question;

                examQuizDocs.push({
                    ...rest,
                    examId: new ObjectId(examId),
                    isActive: true,
                    isDeleted: false,
                    createdAt: now,
                    updatedAt: now,
                });
            }
        }

        const result = await examQuizCollection.insertMany(examQuizDocs);

        set.status = 201;
        return {
            message: `${result.insertedCount} question(s) copied to ${exams.length} exam(s) successfully`,
            ok: true,
            insertedCount: result.insertedCount,
        };

    } catch (error) {
        console.error("Error moving questions to exams:", error);
        set.status = 500;
        return { error: "Failed to move questions to exams" };
    }
};