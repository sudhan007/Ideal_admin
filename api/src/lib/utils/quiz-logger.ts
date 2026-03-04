import { getCollection } from "@lib/config/db.config";
import { QUIZ_ATTEMPTS_COLLECTION } from "@lib/Db_collections";
import { ObjectId } from "mongodb";

export interface QuizAttemptModel {
    _id?: ObjectId;
    studentId: ObjectId;
    courseId: ObjectId;
    chapterId: ObjectId;
    lessonId: ObjectId;
    attemptsCount: number;
    createdAt: Date;
    updatedAt: Date;
}

export const quizAttemptsLogger = async (
    studentId: string,
    courseId: string,
    chapterId: string,
    lessonId: string,
): Promise<{ success: boolean; attemptsCount?: number; message: string }> => {
    try {
        const collection = await getCollection(QUIZ_ATTEMPTS_COLLECTION);

        const filter = {
            studentId: new ObjectId(studentId),
            courseId: new ObjectId(courseId),
            chapterId: new ObjectId(chapterId),
            lessonId: new ObjectId(lessonId),
        };

        const updateResult: any = await collection.findOneAndUpdate(
            filter,
            {
                $inc: { attemptsCount: 1 },
                $set: {
                    updatedAt: new Date(),
                },
                $setOnInsert: {
                    createdAt: new Date(),
                },
            },
            {
                upsert: true,
                returnDocument: "after",
            }
        );

        return {
            success: true,
            attemptsCount: updateResult.value?.attemptsCount || 1,
            message: "Quiz attempt logged",
        };
    } catch (error: any) {
        console.error("Error update Quiz Logger:", error);
        return {
            success: false,
            message: error?.message || "Failed to update Quiz Loggers",
        };
    }
};
