import { Context } from "elysia";
import { CreateQuestionSchema, QUESTIONS_COLLECTION } from "./question.model";
import { QuestionType } from "@types";
import { getCollection } from "@lib/config/db.config";
import { ObjectId } from "mongodb";

const validateQuestionByType = (body: CreateQuestionSchema) => {
    const { type, options, correctAnswer }: any = body;

    switch (type) {
        case QuestionType.MCQ:
            if (!options || options.length < 2) {
                throw new Error("MCQ must have at least 2 options");
            }
            const optionIds = options.map((opt: any) => opt.id);
            if (!optionIds.includes(correctAnswer)) {
                throw new Error("Correct answer must be one of the option IDs");
            }
            break;

        case QuestionType.FILL_BLANK:
            if (!correctAnswer || typeof correctAnswer !== 'string') {
                throw new Error("Fill in the blanks must have a text answer");
            }
            break;

        case QuestionType.MATH_INPUT:
            if (!correctAnswer) {
                throw new Error("Math question must have a correct answer");
            }
            break;

        default:
            throw new Error("Invalid question type");
    }
};
export const createQuestion = async (ctx: Context<{ body: CreateQuestionSchema }>) => {
    const { body, set } = ctx;

    try {
        validateQuestionByType(body);
        const questionsCollection = await getCollection(QUESTIONS_COLLECTION);
        const questionData = {
            ...body,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        const result = await questionsCollection.insertOne(questionData);

        set.status = 201;
        return {
            success: true,
            message: "Question created successfully",
            data: {
                id: result.insertedId,
                ...questionData
            }
        };
    } catch (error: any) {
        console.log("Create Question Error", error);
        set.status = error.message.includes("must have") ? 400 : 500;
        return {
            success: false,
            message: error.message || "Failed to create question"
        };
    }
}
export const updateQuestion = async (ctx: Context<{
    params: { id: string },
    body: Partial<CreateQuestionSchema>
}>) => {
    const { params, body, set } = ctx;
    const { id } = params;

    try {
        if (!ObjectId.isValid(id)) {
            set.status = 400;
            return {
                success: false,
                message: "Invalid question ID"
            };
        }

        const updateData = {
            ...body,
            updatedAt: new Date()
        };

        const questionsCollection = await getCollection(QUESTIONS_COLLECTION);

        const result = await questionsCollection.findOneAndUpdate(
            { _id: new ObjectId(id) },
            { $set: updateData },
            { returnDocument: 'after' }
        );

        if (!result) {
            set.status = 404;
            return {
                success: false,
                message: "Question not found"
            };
        }

        set.status = 200;
        return {
            success: true,
            message: "Question updated successfully",
            data: result
        };
    } catch (error: any) {
        console.log("Update Question Error", error);
        set.status = 500;
        return {
            success: false,
            message: error.message || "Failed to update question"
        };
    }
};