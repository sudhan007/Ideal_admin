import { Context } from "elysia";
import { CreateQuestionSchema, DeleteQuestionSchema, GetQuestionsById, GetQuizQuestionsSchema, SubmitQuizSchema, UpdateQuizSchema } from "./question.model";
import { passPercentage, QuestionModel, QuestionType, SolutionType, StoreType } from "@types";
import { getCollection } from "@lib/config/db.config";
import { ObjectId } from "mongodb";
import { updateQuizProgressFN } from "@lib/utils/course-tracking";
import { quizAttemptsLogger } from "@lib/utils/quiz-logger";
import { CHAPTERS_COLLECTION, COURSE_COLLECTION, LESSON_PROGRESS_COLLECTION, LESSONS_COLLECTION, MATHPIX_PDF_COLLECTION, POST_QUIZ_ATTEMPTS_COLLECTION, QUESTIONS_COLLECTION } from "@lib/Db_collections";
import { uploadFileToS3 } from "@lib/utils/s3";
import { runBulkUploadPipeline } from "@lib/utils/bulkupload";

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

function parseIfString<T>(value: T | string): T {
    if (typeof value === "string") {
        try {
            return JSON.parse(value) as T;
        } catch {
            return value as unknown as T;
        }
    }
    return value;
}
function shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

export const getNextPostQuizSet = async (
    studentId: string,
    courseId: string,
    chapterId: string,
    lessonId: string,
    remainingAttempts: number          // ← pass this in from getQuizQuestions
): Promise<{ questionSetId: string | null; message: string }> => {
    try {
        // 1. All available sets for this lesson
        const questionsCollection = await getCollection(QUESTIONS_COLLECTION);
        const availableSets: string[] = await questionsCollection.distinct("questionSet", {
            lessonId: new ObjectId(lessonId),
            questionModel: QuestionModel.POST,
            isActive: true,
            isDeleted: { $ne: true },
        });

        if (!availableSets.length) {
            return { questionSetId: null, message: "No question sets available for this lesson" };
        }

        // 2. Practice mode (remainingAttempts = 0) → just pick randomly, done
        if (remainingAttempts <= 0) {
            const randomIndex = Math.floor(Math.random() * availableSets.length);
            return { questionSetId: availableSets[randomIndex], message: "Set selected successfully" };
        }

        // 3. Counted attempt → prefer unattempted sets
        const postAttemptsCollection = await getCollection(POST_QUIZ_ATTEMPTS_COLLECTION);
        const attemptedDocs = await postAttemptsCollection
            .find({
                studentId: new ObjectId(studentId),
                courseId: new ObjectId(courseId),
                chapterId: new ObjectId(chapterId),
                lessonId: new ObjectId(lessonId),
            })
            .project({ questionSetId: 1 })
            .toArray();

        const attemptedSets = new Set(attemptedDocs.map((d) => d.questionSetId));
        const unattemptedSets = availableSets.filter((s) => !attemptedSets.has(s));

        // If all sets already used, fall back to full pool
        const candidateSets = unattemptedSets.length > 0 ? unattemptedSets : availableSets;

        const randomIndex = Math.floor(Math.random() * candidateSets.length);
        return { questionSetId: candidateSets[randomIndex], message: "Set selected successfully" };

    } catch (error: any) {
        console.error("Error selecting post-quiz set:", error);
        return { questionSetId: null, message: error?.message || "Failed to select question set" };
    }
};
// export const createQuestion = async (ctx: Context<{ body: CreateQuestionSchema }>) => {
//     const { body, set } = ctx;

//     try {
//         body.question = parseIfString(body.question);
//         body.options = parseIfString(body.options);

//         if (body.questionImage instanceof File) {
//             const { fullUrl } = await uploadFileToS3(body.questionImage, "question_images");
//             body.question = {
//                 ...body.question,
//                 image: fullUrl
//             };
//         }
//         else if (
//             body.question &&
//             typeof body.question === "object" &&
//             body.question.image instanceof File
//         ) {
//             const { fullUrl } = await uploadFileToS3(body.question.image, "question_images");
//             body.question = {
//                 ...body.question,
//                 image: fullUrl
//             };
//         }

//         validateQuestionByType(body);

//         const questionsCollection = await getCollection(QUESTIONS_COLLECTION);

//         let solution = body.solution as string;

//         // ✅ If solution is a File (Blob), upload it to S3
//         if (body.solutionType === SolutionType.IMAGE && body.solution instanceof File) {
//             const { fullUrl } = await uploadFileToS3(body.solution, "solution_images");
//             solution = fullUrl;
//         }

//         const questionData = {
//             ...body,
//             solution,
//             question: body.question,
//             options: body.options,
//             courseId: new ObjectId(body.courseId),
//             lessonId: new ObjectId(body.lessonId),
//             chapterId: new ObjectId(body.chapterId),
//             isActive: true,
//             createdAt: new Date(),
//             updatedAt: new Date()
//         };

//         // Remove the raw questionImage field — it's already merged into question.image
//         delete (questionData as any).questionImage;

//         const result = await questionsCollection.insertOne(questionData);

//         set.status = 201;
//         return {
//             success: true,
//             message: "Question created successfully",
//             data: {
//                 id: result.insertedId,
//                 ...questionData
//             }
//         };
//     } catch (error: any) {
//         console.log("Create Question Error", error);
//         set.status = error.message.includes("must have") ? 400 : 500;
//         return {
//             success: false,
//             message: error.message || "Failed to create question"
//         };
//     }
// };

export const createQuestion = async (ctx: Context<{ body: CreateQuestionSchema }>) => {
    const { body, set } = ctx;

    try {
        body.question = parseIfString(body.question);
        body.options = parseIfString(body.options);

        // ── Question image ─────────────────────────────────────────────────────
        if (body.questionImage instanceof File) {
            const { fullUrl } = await uploadFileToS3(body.questionImage, 'question_images');
            body.question = { ...body.question, image: fullUrl };
        } else if (body.question?.image instanceof File) {
            const { fullUrl } = await uploadFileToS3(body.question.image, 'question_images');
            body.question = { ...body.question, image: fullUrl };
        }

        // ── Option images ──────────────────────────────────────────────────────
        if (Array.isArray(body.options)) {
            const uploadPromises = body.options.map(async (opt: any, i: number) => {
                if (opt.type === 'IMAGE') {
                    // Try both body[`optionImage_${i}`] and body.options[i] direct file
                    const file =
                        (body as any)[`optionImage_${i}`] ??
                        (opt.answer instanceof File ? opt.answer : null);

                    console.log(`Option ${i} file:`, file, typeof file); // 👈 Add this to debug

                    if (file instanceof File) {
                        const { fullUrl } = await uploadFileToS3(file, 'option_images');
                        return { ...opt, answer: fullUrl };
                    }

                    // If answer is already a valid S3/http URL (edit mode), keep it
                    if (
                        typeof opt.answer === 'string' &&
                        opt.answer.startsWith('http')
                    ) {
                        return opt;
                    }

                    // At this point it's a raw filename string — upload failed to resolve
                    // Return as-is and log warning
                    console.warn(`Option ${i} has IMAGE type but no File was found. Raw answer: ${opt.answer}`);
                }
                return opt;
            });

            body.options = await Promise.all(uploadPromises);
        }

        // Clean up raw optionImage_N fields before saving
        for (let i = 0; i < 10; i++) {
            delete (body as any)[`optionImage_${i}`];
        }

        validateQuestionByType(body);

        const questionsCollection = await getCollection(QUESTIONS_COLLECTION);

        // ── Solution image ─────────────────────────────────────────────────────
        let solution = body.solution as string;
        if (body.solutionType === SolutionType.IMAGE && body.solution instanceof File) {
            const { fullUrl } = await uploadFileToS3(body.solution, 'solution_images');
            solution = fullUrl;
        }

        const questionData = {
            ...body,
            solution,
            question: body.question,
            options: body.options,
            courseId: new ObjectId(body.courseId),
            lessonId: new ObjectId(body.lessonId),
            chapterId: new ObjectId(body.chapterId),
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        delete (questionData as any).questionImage;

        const result = await questionsCollection.insertOne(questionData);

        set.status = 201;
        return {
            success: true,
            message: 'Question created successfully',
            data: { id: result.insertedId, ...questionData },
        };
    } catch (error: any) {
        console.log('Create Question Error', error);
        set.status = error.message.includes('must have') ? 400 : 500;
        return { success: false, message: error.message || 'Failed to create question' };
    }
};

export const updateQuestion = async (
    ctx: Context<{
        body: UpdateQuizSchema;
        params: { questionId: string };
    }>
) => {
    const { body, params, set } = ctx;
    const questionId = params.questionId;

    try {
        if (!ObjectId.isValid(questionId)) {
            set.status = 400;
            return { success: false, message: "Invalid question ID format" };
        }

        // ✅ Parse JSON-stringified fields from FormData
        if (body.question) body.question = parseIfString(body.question);
        if (body.options) body.options = parseIfString(body.options);

        // ✅ Handle question image upload
        if (body.questionImage instanceof File) {
            const { fullUrl } = await uploadFileToS3(body.questionImage, "question_images");
            body.question = { ...body.question, image: fullUrl };
        } else if (
            body.question &&
            typeof body.question === "object" &&
            body.question.image instanceof File
        ) {
            const { fullUrl } = await uploadFileToS3(body.question.image, "question_images");
            body.question = { ...body.question, image: fullUrl };
        }

        // ✅ Handle option images — upload new Files, keep existing S3 URLs as-is
        if (Array.isArray(body.options)) {
            const uploadPromises = body.options.map(async (opt: any, i: number) => {
                if (opt.type === 'IMAGE') {
                    const file = (body as any)[`optionImage_${i}`];

                    if (file instanceof File) {
                        // New file uploaded — push to S3
                        const { fullUrl } = await uploadFileToS3(file, "option_images");
                        return { ...opt, answer: fullUrl };
                    }

                    // No new file — keep existing S3 URL unchanged
                    if (typeof opt.answer === 'string' && opt.answer.startsWith('http')) {
                        return opt;
                    }

                    console.warn(`Option ${i} has IMAGE type but no File or URL:`, opt.answer);
                }
                return opt;
            });

            body.options = await Promise.all(uploadPromises);
        }

        // ✅ Clean up raw optionImage_N fields before saving to DB
        for (let i = 0; i < 4; i++) {
            delete (body as any)[`optionImage_${i}`];
        }

        const questionsCollection = await getCollection(QUESTIONS_COLLECTION);

        const existing = await questionsCollection.findOne({
            _id: new ObjectId(questionId)
        });

        if (!existing) {
            set.status = 404;
            return { success: false, message: "Question not found" };
        }

        // ✅ Handle solution image upload
        let solution = body.solution;
        if (body.solutionType === SolutionType.IMAGE && body.solution instanceof File) {
            const { fullUrl } = await uploadFileToS3(body.solution, "solution_images");
            solution = fullUrl;
        }

        const updatedData: any = {
            ...existing,
            ...body,
            solution,
            updatedAt: new Date()
        };

        // Remove raw questionImage field — already merged into question.image
        delete updatedData.questionImage;

        if (body.courseId) updatedData.courseId = new ObjectId(body.courseId);
        if (body.chapterId) updatedData.chapterId = new ObjectId(body.chapterId);
        if (body.lessonId) updatedData.lessonId = new ObjectId(body.lessonId);

        validateQuestionByType(updatedData);

        const result = await questionsCollection.updateOne(
            { _id: new ObjectId(questionId) },
            { $set: { ...updatedData, updatedAt: new Date() } }
        );

        if (result.matchedCount === 0) {
            set.status = 404;
            return { success: false, message: "Question not found" };
        }

        set.status = 200;
        return {
            success: true,
            message: "Question updated successfully",
            data: { id: questionId, ...updatedData }
        };
    } catch (error: any) {
        console.error("Update Question Error:", error);
        set.status = error.message?.includes("must have") ? 400 : 500;
        return {
            success: false,
            message: error.message || "Failed to update question"
        };
    }
};
// export const updateQuestion = async (
//     ctx: Context<{
//         body: UpdateQuizSchema;
//         params: { questionId: string };
//     }>
// ) => {
//     const { body, params, set } = ctx;
//     const questionId = params.questionId;

//     try {
//         if (!ObjectId.isValid(questionId)) {
//             set.status = 400;
//             return { success: false, message: "Invalid question ID format" };
//         }

//         // ✅ Parse JSON-stringified fields that come through FormData
//         if (body.question) body.question = parseIfString(body.question);
//         if (body.options) body.options = parseIfString(body.options);

//         // ✅ Handle question image — sent as a separate "questionImage" field in FormData
//         if (body.questionImage instanceof File) {
//             const { fullUrl } = await uploadFileToS3(body.questionImage, "question_images");
//             body.question = {
//                 ...body.question,
//                 image: fullUrl
//             };
//         }
//         // ✅ Legacy: also handle inline File on question.image
//         else if (
//             body.question &&
//             typeof body.question === "object" &&
//             body.question.image instanceof File
//         ) {
//             const { fullUrl } = await uploadFileToS3(body.question.image, "question_images");
//             body.question = {
//                 ...body.question,
//                 image: fullUrl
//             };
//         }

//         const questionsCollection = await getCollection(QUESTIONS_COLLECTION);

//         const existing = await questionsCollection.findOne({
//             _id: new ObjectId(questionId)
//         });

//         if (!existing) {
//             set.status = 404;
//             return { success: false, message: "Question not found" };
//         }

//         // ✅ If a new solution image File was uploaded, push it to S3 and get the URL
//         let solution = body.solution;
//         if (body.solutionType === SolutionType.IMAGE && body.solution instanceof File) {
//             const { fullUrl } = await uploadFileToS3(body.solution, "solution_images");
//             solution = fullUrl;
//         }

//         const updatedData: any = {
//             ...existing,
//             ...body,
//             solution,
//             updatedAt: new Date()
//         };

//         // Remove the raw questionImage field — already merged into question.image
//         delete updatedData.questionImage;

//         if (body.courseId) updatedData.courseId = new ObjectId(body.courseId);
//         if (body.chapterId) updatedData.chapterId = new ObjectId(body.chapterId);
//         if (body.lessonId) updatedData.lessonId = new ObjectId(body.lessonId);

//         validateQuestionByType(updatedData);

//         const result = await questionsCollection.updateOne(
//             { _id: new ObjectId(questionId) },
//             { $set: { ...updatedData, updatedAt: new Date() } }
//         );

//         if (result.matchedCount === 0) {
//             set.status = 404;
//             return { success: false, message: "Question not found" };
//         }

//         set.status = 200;
//         return {
//             success: true,
//             message: "Question updated successfully",
//             data: { id: questionId, ...updatedData }
//         };
//     } catch (error: any) {
//         console.error("Update Question Error:", error);
//         set.status = error.message?.includes("must have") ? 400 : 500;
//         return {
//             success: false,
//             message: error.message || "Failed to update question"
//         };
//     }
// };
export const getQuizQuestions = async (ctx: Context<{ query: GetQuizQuestionsSchema }>) => {
    const { query, set, store } = ctx;
    const { id: studentId, role } = store as StoreType;
    const { courseId, chapterId, lessonId, difficulty, type, limit = 10, questionModel } = query;

    try {
        const progressCollection = await getCollection(LESSON_PROGRESS_COLLECTION);

        const progress = await progressCollection.findOne({
            studentId: new ObjectId(studentId),
            courseId: new ObjectId(courseId),
            chapterId: new ObjectId(chapterId),
            lessonId: new ObjectId(lessonId),
        });

        const isPreQuizAttempted = progress?.isPreQuizAttempted ?? false;

        // ── POST quiz ────────────────────────────────────────
        if (questionModel === QuestionModel.POST) {
            if (!progress) {
                set.status = 404;
                return { success: false, message: "Lesson progress not found" };
            }

            // ✅ No 403 gate here — questions are ALWAYS accessible
            // remaining is only informational in the response
            const remaining = progress.remaingPostQuizAttempts ?? 0;

            // Pick a set (unattempted first, reuses full pool if all done)
            const { questionSetId, message } = await getNextPostQuizSet(
                studentId,
                courseId,
                chapterId,
                lessonId,
                remaining
            );

            if (!questionSetId) {
                set.status = 500;
                return { success: false, message };
            }

            const questionsCollection = await getCollection(QUESTIONS_COLLECTION);
            const filter: any = {
                courseId: new ObjectId(courseId),
                chapterId: new ObjectId(chapterId),
                lessonId: new ObjectId(lessonId),
                questionModel: QuestionModel.POST,
                questionSet: questionSetId,
                isActive: true,
                isDeleted: { $ne: true },
            };
            if (difficulty) filter.difficulty = difficulty;
            if (type) filter.type = type;

            const questions = await questionsCollection.find(filter).toArray();
            const processedQuestions = questions.map((question) => {
                const base: any = {
                    id: question._id,
                    courseId: question.courseId,
                    chapterId: question.chapterId,
                    lessonId: question.lessonId,
                    type: question.type,
                    difficulty: question.difficulty,
                    question: question.question,
                    questionModel: question.questionModel,
                    questionSet: question.questionSet,
                };
                if (question.type === "MCQ" && question.options) {
                    base.options = shuffleArray(question.options);
                }
                return base;
            });

            set.status = 200;
            return {
                success: true,
                message: "Post-quiz questions fetched successfully",
                data: {
                    questions: processedQuestions,
                    total: processedQuestions.length,
                    questionSetId,        // frontend must echo this back on submit
                    remainingAttempts: remaining,
                    isPreQuizAttempted,
                },
            };
        }

        // ── PRE quiz (unchanged) ─────────────────────────────
        const filter: any = {
            courseId: new ObjectId(courseId),
            isActive: true,
            isDeleted: { $ne: true },
        };
        if (chapterId) filter.chapterId = new ObjectId(chapterId);
        if (lessonId) filter.lessonId = new ObjectId(lessonId);
        if (difficulty) filter.difficulty = difficulty;
        if (type) filter.type = type;
        if (questionModel) filter.questionModel = questionModel;

        const questionsCollection = await getCollection(QUESTIONS_COLLECTION);
        const questions = await questionsCollection.find(filter).toArray();
        const shuffled = shuffleArray(questions).slice(0, limit);

        const processedQuestions = shuffled.map((question) => {
            const base: any = {
                id: question._id,
                courseId: question.courseId,
                chapterId: question.chapterId,
                lessonId: question.lessonId,
                type: question.type,
                difficulty: question.difficulty,
                question: question.question,
                questionModel: question.questionModel,
            };
            if (question.type === "MCQ" && question.options) {
                base.options = shuffleArray(question.options);
            }
            return base;
        });

        set.status = 200;
        return {
            success: true,
            message: "Quiz questions fetched successfully",
            data: {
                questions: processedQuestions,
                total: processedQuestions.length,
                isPreQuizAttempted,
            },
        };
    } catch (error: any) {
        console.error("Get Quiz Questions Error:", error);
        set.status = 500;
        return { success: false, message: error.message || "Failed to fetch quiz questions" };
    }
};
export const getAllQuestions = async (ctx: Context<{ query: GetQuizQuestionsSchema }>) => {
    const { query, set } = ctx;
    console.log(query, "que")
    const courseId = query.courseId;
    const chapterId = query.chapterId;
    const lessonId = query.lessonId;
    const difficulty = query.difficulty;
    const type = query.type;
    const quetionModel = query.questionModel;
    const search = query.search?.trim();
    const limit = Math.max(1, Math.min(50, Number(query.limit) || 10));
    const page = Math.max(1, Number(query.page) || 1);
    const skip = (page - 1) * limit;

    if (!courseId) {
        set.status = 400;
        return { success: false, message: "courseId is required" };
    }

    try {
        const questionsCollection = await getCollection(QUESTIONS_COLLECTION);

        const filter: any = {
            courseId: new ObjectId(courseId),
            isActive: true,
            isDeleted: { $ne: true },
        };

        if (chapterId) filter.chapterId = new ObjectId(chapterId);
        if (lessonId) filter.lessonId = new ObjectId(lessonId);
        if (difficulty) filter.difficulty = difficulty;
        if (type) filter.type = type;
        if (quetionModel) filter.questionModel = quetionModel;
        console.log(quetionModel, "quetionModel")

        if (search) {
            filter.$or = [
                { "question.text": { $regex: search, $options: "i" } },
                { "question.latex": { $regex: search, $options: "i" } },
            ];
        }

        const pipeline = [
            { $match: filter },

            {
                $lookup: {
                    from: COURSE_COLLECTION,
                    localField: "courseId",
                    foreignField: "_id",
                    as: "courseData",
                    pipeline: [
                        { $project: { courseName: 1 } }
                    ]
                }
            },
            { $unwind: { path: "$courseData", preserveNullAndEmptyArrays: true } },

            {
                $lookup: {
                    from: CHAPTERS_COLLECTION,
                    localField: "chapterId",
                    foreignField: "_id",
                    as: "chapterData",
                    pipeline: [
                        { $project: { chapterName: 1 } }
                    ]
                }
            },
            { $unwind: { path: "$chapterData", preserveNullAndEmptyArrays: true } },

            {
                $lookup: {
                    from: LESSONS_COLLECTION,
                    localField: "lessonId",
                    foreignField: "_id",
                    as: "lessonData",
                    pipeline: [
                        { $project: { lessonName: 1 } }
                    ]
                }
            },
            { $unwind: { path: "$lessonData", preserveNullAndEmptyArrays: true } },
            { $sort: { createdAt: 1 } },
            { $skip: skip },
            { $limit: limit },
            {
                $project: {
                    _id: 1,
                    courseId: 1,
                    chapterId: 1,
                    lessonId: 1,
                    type: 1,
                    questionModel: 1,
                    difficulty: 1,
                    marks: 1,
                    question: 1,
                    options: 1,
                    correctAnswer: 1,
                    createdAt: 1,
                    updatedAt: 1,
                    courseName: { $ifNull: ["$courseData.courseName", "Unknown"] },
                    chapterName: { $ifNull: ["$chapterData.chapterName", "Unknown"] },
                    lessonName: { $ifNull: ["$lessonData.lessonName", "Unknown"] },
                }
            }
        ];

        const questions = await questionsCollection.aggregate(pipeline).toArray();

        const total = await questionsCollection.countDocuments(filter);

        let lessonStats: any = null;

        if (lessonId) {
            const lessonObjectId = new ObjectId(lessonId);

            const lessonsCollection = await getCollection(LESSONS_COLLECTION);
            const lessonDoc = await lessonsCollection.findOne(
                { _id: lessonObjectId },
                { projection: { lessonName: 1 } }
            );

            const lessonName = lessonDoc?.lessonName;

            // Get stats by question type (MCQ, FILL_BLANK)
            const typeStats = await questionsCollection.aggregate([
                {
                    $match: {
                        lessonId: lessonObjectId,
                        isActive: true,
                        isDeleted: { $ne: true }
                    }
                },
                {
                    $group: {
                        _id: "$type",
                        count: { $sum: 1 }
                    }
                }
            ]).toArray();

            // Get stats by question model (PRE, POST)
            const modelStats = await questionsCollection.aggregate([
                {
                    $match: {
                        lessonId: lessonObjectId,
                        isActive: true,
                        isDeleted: { $ne: true }
                    }
                },
                {
                    $group: {
                        _id: "$questionModel",
                        count: { $sum: 1 }
                    }
                }
            ]).toArray();

            lessonStats = {
                lessonId,
                lessonName,
                mcqCount: 0,
                fillInBlankCount: 0,
                preCount: 0,
                postCount: 0,
            };

            // Process type stats
            typeStats.forEach(group => {
                if (group._id === "MCQ") lessonStats.mcqCount = group.count;
                if (group._id === "FILL_BLANK") lessonStats.fillInBlankCount = group.count;
            });

            // Process model stats
            modelStats.forEach(group => {
                if (group._id === "PRE") lessonStats.preCount = group.count;
                if (group._id === "POST") lessonStats.postCount = group.count;
            });
        }

        set.status = 200;
        return {
            success: true,
            message: "Quiz questions fetched successfully",
            data: {
                questions,
                lessonStats,
                pagination: {
                    total,
                    page,
                    limit,
                    totalPages: Math.ceil(total / limit),
                    hasNextPage: page * limit < total,
                    hasPrevPage: page > 1,
                },
            },
        };

    } catch (error: any) {
        console.error("Get Quiz Questions Error:", error);
        set.status = 500;
        return {
            success: false,
            message: "Failed to fetch quiz questions",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined,
        };
    }
};
export const checkPreQuizAttempts = async (
    enrollmentId: string,
    lessonId: string
): Promise<{ canAttempt: boolean; remainingAttempts: number; message: string }> => {
    try {
        const lessonProgressCollection = await getCollection(LESSON_PROGRESS_COLLECTION);

        const progress = await lessonProgressCollection.findOne({
            enrollmentId: new ObjectId(enrollmentId),
            lessonId: new ObjectId(lessonId)
        });

        if (!progress) {
            return {
                canAttempt: false,
                remainingAttempts: 0,
                message: "Lesson progress not found"
            };
        }

        const remaining = progress.remaingPreQuizAttempts || 0;

        return {
            canAttempt: remaining > 0,
            remainingAttempts: remaining,
            message: remaining > 0
                ? `You have ${remaining} attempt(s) remaining`
                : "No attempts remaining for this pre-quiz"
        };
    } catch (error: any) {
        console.error("Error checking pre-quiz attempts:", error);
        return {
            canAttempt: false,
            remainingAttempts: 0,
            message: error?.message || "Failed to check attempts"
        };
    }
};
export const checkPostQuizAttempts = async (
    enrollmentId: string,
    lessonId: string
): Promise<{ canAttempt: boolean; remainingAttempts: number; message: string }> => {
    try {
        const lessonProgressCollection = await getCollection(LESSON_PROGRESS_COLLECTION);

        const progress = await lessonProgressCollection.findOne({
            enrollmentId: new ObjectId(enrollmentId),
            lessonId: new ObjectId(lessonId),
        });

        if (!progress) {
            return { canAttempt: false, remainingAttempts: 0, message: "Lesson progress not found" };
        }

        const remaining = progress.remaingPostQuizAttempts ?? 0;

        return {
            canAttempt: remaining > 0,
            remainingAttempts: remaining,
            message: remaining > 0
                ? `You have ${remaining} attempt(s) remaining`
                : "No attempts remaining for this post-quiz",
        };
    } catch (error: any) {
        console.error("Error checking post-quiz attempts:", error);
        return { canAttempt: false, remainingAttempts: 0, message: error?.message || "Failed to check attempts" };
    }
};
export const submitQuizAnswers = async (
    ctx: Context<{ body: SubmitQuizSchema }>
) => {
    const { body, set, store } = ctx;
    const { id } = store as StoreType;
    const { enrollmentId, lessonId, answers, quizType, questionSetId } = body as any;

    try {
        const lessonsCollection = await getCollection(LESSONS_COLLECTION);
        const lesson = await lessonsCollection.findOne({ _id: new ObjectId(lessonId) });
        if (!lesson) throw new Error("Lesson not found");

        const courseId = lesson.courseId.toString();
        const chapterId = lesson.chapterId.toString();

        // ── PRE quiz gate (unchanged) ─────────────────────────
        if (quizType === QuestionModel.PRE) {
            const attemptCheck = await checkPreQuizAttempts(enrollmentId, lessonId);
            if (!attemptCheck.canAttempt) {
                set.status = 403;
                return {
                    success: false,
                    message: attemptCheck.message,
                    data: { remainingAttempts: attemptCheck.remainingAttempts },
                };
            }
        }

        // ── POST quiz: no gate — just validate questionSetId ──
        if (quizType === QuestionModel.POST) {
            if (!questionSetId) {
                set.status = 400;
                return { success: false, message: "questionSetId is required for POST quiz submission" };
            }
        }

        // ── Score answers ────────────────────────────────────
        const questionsCollection = await getCollection(QUESTIONS_COLLECTION);
        let correctCount = 0;
        let answeredCount = 0;
        let unansweredCount = 0;
        let skippedCount = 0;
        let markedForReviewCount = 0;

        const processedResults: any[] = [];

        for (const ans of answers) {
            const question = await questionsCollection.findOne({
                _id: new ObjectId(ans.questionId),
                lessonId: new ObjectId(lessonId),
                isActive: true,
                isDeleted: { $ne: true },
            });

            if (!question) throw new Error(`Invalid question ID: ${ans.questionId}`);

            const isAnswered = ans.answer !== "" && ans.answer !== null;
            const isMarkedForReview = !!ans.isMarkedForReview;
            let isCorrect = false;

            if (isAnswered) {
                answeredCount++;
                if (question.type === "MCQ" && question.correctAnswer === ans.answer) {
                    isCorrect = true;
                    correctCount++;
                } else if (question.type === "FILL_BLANK" && question.correctAnswer === ans.answer.trim()) {
                    isCorrect = true;
                    correctCount++;
                }
            } else {
                unansweredCount++;
                if (isMarkedForReview) skippedCount++;
            }

            if (isMarkedForReview) markedForReviewCount++;

            const resultItem: any = {
                id: question._id.toString(),
                question: question.question,
                type: question.type,
                solution: question.solution,
                solutionType: question.solutionType,
                difficulty: question.difficulty,
                userAnswer: ans.answer || null,
                correctAnswer: question.correctAnswer,
                isCorrect,
                status: isAnswered
                    ? (isCorrect ? "correct" : "incorrect")
                    : (isMarkedForReview ? "review" : "skipped"),
                isMarkedForReview,
            };
            if (question.type === "MCQ" && question.options) resultItem.options = question.options;
            processedResults.push(resultItem);


        }

        const wrongCount = answeredCount - correctCount;
        const percentage = answeredCount > 0 ? (correctCount / answeredCount) * 100 : 0;
        const isPassed = percentage >= passPercentage;

        // ── POST quiz persistence ────────────────────────────
        const lessonProgressCollection = await getCollection(LESSON_PROGRESS_COLLECTION);

        if (quizType === QuestionModel.POST) {
            const progressDoc = await lessonProgressCollection.findOne({
                enrollmentId: new ObjectId(enrollmentId),
                lessonId: new ObjectId(lessonId),
            });
            if (!progressDoc) throw new Error("Lesson progress not found");

            const remainingBeforeSubmit = progressDoc.remaingPostQuizAttempts ?? 0;

            if (remainingBeforeSubmit > 0) {
                // ✅ Attempts remaining — store record + decrement
                const postAttemptsCollection = await getCollection(POST_QUIZ_ATTEMPTS_COLLECTION);

                const prevAttemptCount = await postAttemptsCollection.countDocuments({
                    studentId: progressDoc.studentId,
                    lessonId: new ObjectId(lessonId),
                });

                await postAttemptsCollection.insertOne({
                    courseId: new ObjectId(courseId),
                    chapterId: new ObjectId(chapterId),
                    lessonId: new ObjectId(lessonId),
                    enrollmentId: new ObjectId(enrollmentId),
                    studentId: progressDoc.studentId,
                    questionSetId,
                    attemptNumber: prevAttemptCount + 1,
                    score: correctCount,
                    totalQuestions: answers.length,
                    scorePercentage: Math.round(percentage * 100) / 100,
                    passed: isPassed,
                    submittedAt: new Date(),
                });

                await lessonProgressCollection.updateOne(
                    {
                        enrollmentId: new ObjectId(enrollmentId),
                        lessonId: new ObjectId(lessonId),
                    },
                    {
                        $inc: { remaingPostQuizAttempts: -1 },
                        $set: { updatedAt: new Date() },
                    }
                );

                // Update quiz progress + lesson completion only when attempts are counted

            }

            const progressResult = await updateQuizProgressFN(
                enrollmentId,
                lessonId,
                correctCount,
                answers.length
            );
            if (!progressResult.success) throw new Error(progressResult.message);

            // ⛔ remainingAttempts = 0 — skip storage, skip decrement, skip progress update
            // Just return the scored result to the student
        }

        // ── PRE quiz (unchanged) ─────────────────────────────
        if (quizType === QuestionModel.PRE) {
            await lessonProgressCollection.updateOne(
                {
                    enrollmentId: new ObjectId(enrollmentId),
                    lessonId: new ObjectId(lessonId),
                },
                {
                    $inc: { remaingPreQuizAttempts: -1 },
                    $set: { isPreQuizAttempted: true, updatedAt: new Date() },
                }
            );
        }

        // ── Log quiz attempt (existing logger) ───────────────
        const logResult = await quizAttemptsLogger(id, courseId, chapterId, lessonId);
        if (!logResult.success) throw new Error(logResult.message);

        // ── Fetch updated remaining attempts for response ─────
        let remainingPreQuizAttempts: number | null = null;
        let remainingPostQuizAttempts: number | null = null;

        if (quizType === QuestionModel.PRE) {
            const updated = await checkPreQuizAttempts(enrollmentId, lessonId);
            remainingPreQuizAttempts = updated.remainingAttempts;
        }
        if (quizType === QuestionModel.POST) {
            const updated = await checkPostQuizAttempts(enrollmentId, lessonId);
            remainingPostQuizAttempts = updated.remainingAttempts;
        }

        const resultMessage = isPassed
            ? {
                title: "Yeah! You done",
                description: "Congratulations 🎉 You've successfully completed the quiz! Great effort—keep learning and improving",
            }
            : {
                title: "Great Effort",
                description: "Don't worry about mistakes — review and try again to improve your score.",
            };

        set.status = 200;
        return {
            success: true,
            message: "Quiz submitted successfully",
            data: {
                summary: {
                    totalQuestions: answers.length,
                    passPercentage,
                    answered: answeredCount,
                    unanswered: unansweredCount,
                    correct: correctCount,
                    wrong: wrongCount,
                    skipped: skippedCount,
                    markedForReview: markedForReviewCount,
                    scorePercentage: Math.round(percentage * 100) / 100,
                    attempts: logResult.attemptsCount,
                    remainingPreQuizAttempts,
                    remainingPostQuizAttempts,
                },
                questions: processedResults,
                resultMessage,
            },
        };
    } catch (error: any) {
        console.error("Submit quiz error:", error);
        set.status = 400;
        return { success: false, message: error.message || "Failed to submit and evaluate quiz" };
    }
};
export const getQuestionById = async (ctx: Context<{ query: GetQuestionsById }>) => {
    const { params, set } = ctx;
    const { questionId } = params;
    try {

        const questionsCollection = await getCollection(QUESTIONS_COLLECTION);
        const question = await questionsCollection.findOne({
            _id: new ObjectId(questionId),
            isActive: true,
            isDeleted: false
        });

        set.status = 200;
        return {
            success: true,
            message: "Quiz questions fetched successfully",
            question
        };

    } catch (error: any) {
        console.error("Get Quiz Questions Error:", error);
        set.status = 400;
        return {
            success: false,
            message: error.message || "Failed to fetch quiz questions"
        };
    }
}
export const deleteQuestion = async (ctx: Context<{ query: DeleteQuestionSchema }>) => {
    const { query, set } = ctx;
    const { questionId } = query;
    try {

        const questionsCollection = await getCollection(QUESTIONS_COLLECTION);
        const question = await questionsCollection.findOneAndDelete({
            _id: new ObjectId(questionId),
        });

        if (!question) {
            set.status = 404;
            return {
                success: false,
                message: "Question not found"
            };
        }

        set.status = 200;
        return {
            success: true,
            message: "Question deleted successfully"
        };

    } catch (error: any) {
        console.error("Delete question error:", error);
        set.status = 400;
        return {
            success: false,
            message: error.message || "Failed to delete question"
        };
    }
}


