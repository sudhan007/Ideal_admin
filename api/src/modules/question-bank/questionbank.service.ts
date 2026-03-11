
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

        // Only fetch docs where BOTH examId + questionId match together
        const existingDocs = await examQuizCollection.find({
            $or: examIds.flatMap(examId =>
                questionIds.map(questionId => ({
                    examId: new ObjectId(examId),
                    questionId: new ObjectId(questionId),
                }))
            ),
            isDeleted: false,
        }).project({ examId: 1, questionId: 1 }).toArray();

        // Build a Set of "examId::questionId" strings for O(1) lookup
        const existingPairs = new Set(
            existingDocs.map(doc => `${doc.examId.toString()}::${doc.questionId.toString()}`)
        );

        const now = new Date();
        const examQuizDocs = [];
        let skippedCount = 0;

        for (const examId of examIds) {
            for (const question of questions) {
                const pairKey = `${examId}::${question._id.toString()}`;

                // Skip only if this exact question already exists in this exact exam
                if (existingPairs.has(pairKey)) {
                    skippedCount++;
                    continue;
                }

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
                    questionId: new ObjectId(question._id),
                    examId: new ObjectId(examId),
                    isActive: true,
                    isDeleted: false,
                    createdAt: now,
                    updatedAt: now,
                });
            }
        }

        if (examQuizDocs.length === 0) {
            set.status = 200;
            return {
                message: "All questions already exist in the selected exam(s), nothing inserted",
                ok: true,
                insertedCount: 0,
                skippedCount,
            };
        }

        const result = await examQuizCollection.insertMany(examQuizDocs);

        set.status = 201;
        return {
            message: `${result.insertedCount} question(s) copied to ${exams.length} exam(s) successfully`,
            ok: true,
            insertedCount: result.insertedCount,
            skippedCount,
        };

    } catch (error) {
        console.error("Error moving questions to exams:", error);
        set.status = 500;
        return { error: "Failed to move questions to exams" };
    }
};