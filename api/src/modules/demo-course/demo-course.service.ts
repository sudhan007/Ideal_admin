import { Context } from "elysia";
import { AddQuestionToDemoCourseSchema, CreateDemoCourseSchema, DemoDeleteQuestionSchema, DemoGetQuerySchema, DemoQuestionUpdate, GetDemoQuestionsById, GetDemoQuizQuestionsSchema, SubmitDemoQuizAnswersSchema, UpdateDemoCourseSchema } from "./demo-course.model";
import { ObjectId } from "mongodb";
import { getCollection } from "@lib/config/db.config";
import { COURSE_COLLECTION, DEMO_COURSE_COLLECTION, DEMO_QUIZ_COLLECTION, } from "@lib/Db_collections";
import { passPercentage, QuestionType, SolutionType, StoreType } from "@types";
import { uploadFileToS3 } from "@lib/utils/s3";


const validateQuestionByType = (body: AddQuestionToDemoCourseSchema) => {
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
function shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}
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
export const createDemoCourse = async (ctx: Context<{ body: CreateDemoCourseSchema }>) => {
    const { body, set } = ctx;
    const { courseId, videoUrl } = body
    try {
        const demoCourseCollection = await getCollection(DEMO_COURSE_COLLECTION);

        const democourseData = {
            courseId: courseId ? new ObjectId(courseId) : null,
            preQuestionLimit: 5,
            postQuestionLimit: 5,
            videoUrl,
            createdAt: new Date(),
        };
        const result = await demoCourseCollection.insertOne(democourseData);
        console.log(result)
        set.status = 201;
        return {
            message: "Demo Course created successfully",
            courseId: result,
        }
    } catch (error) {
        console.log("Demo Course Created Error", error)
        set.status = 500;
        return { error: "Failed to create Demo course" };
    }
}
export const updateDemoCourse = async (ctx: Context<{ body: UpdateDemoCourseSchema; params: { id: string } }>) => {
    const { body, set, params } = ctx;
    const demoCourseId = params.id;

    try {
        const demoCollection = await getCollection(DEMO_COURSE_COLLECTION);

        const existingDemo = await demoCollection.findOne({
            _id: new ObjectId(demoCourseId),
            isDeleted: false,
        });

        if (!existingDemo) {
            set.status = 404;
            return { ok: false, error: "Demo not found" };
        }


        const updateData: any = {
            updatedAt: new Date(),
        };

        if (body.videoUrl !== undefined) updateData.videoUrl = body.videoUrl;
        if (body.courseId !== undefined) updateData.courseId = new ObjectId(body.courseId);

        if (Object.keys(updateData).length > 1) {
            await demoCollection.updateOne(
                { _id: new ObjectId(demoCourseId) },
                { $set: updateData }
            );
        }

        set.status = 200;
        return {
            ok: true,
            message: "Demo updated successfully",
        };
    } catch (error) {
        console.error("Error updating Demo:", error);
        set.status = 500;
        return { ok: false, error: "Failed to update Demo" };
    }
};
export const getCourseDemo = async (ctx: Context<{ query: DemoGetQuerySchema }>) => {
    const { set, query } = ctx;

    try {
        const page = parseInt(query.page || "1", 10);
        const limit = parseInt(query.limit || "10", 10);
        const skip = (page - 1) * limit;

        const demoColletions = await getCollection(DEMO_COURSE_COLLECTION);

        const filter: any = {
        };


        const pipeline = [
            { $match: filter },
            {
                $facet: {
                    metadata: [{ $count: "total" }],
                    data: [
                        { $sort: { createdAt: -1 } },
                        { $skip: skip },
                        { $limit: limit },
                        {
                            $lookup: {
                                from: COURSE_COLLECTION,
                                localField: "courseId",
                                foreignField: "_id",
                                as: "course"
                            }
                        },
                        { $unwind: { path: "$course", preserveNullAndEmptyArrays: true } },
                        {
                            $project: {
                                _id: 1,
                                videoUrl: 1,
                                courseId: 1,
                                createdAt: 1,
                                "course.courseName": 1
                            }
                        }
                    ],
                },
            },
        ];

        const [result] = await demoColletions.aggregate(pipeline).toArray();

        const total = result.metadata[0]?.total ?? 0;
        const demos = result.data;

        set.status = 200;
        return {
            ok: true,
            data: demos,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
                hasNext: page * limit < total,
                hasPrev: page > 1,
            },
        };
    } catch (error) {
        console.error("Error fetching demos:", error);
        set.status = 500;
        return { ok: false, error: "Failed to fetch demos" };
    }
};
// export const addQuestionToDemoCourse = async (ctx: Context<{ body: AddQuestionToDemoCourseSchema }>) => {
//     const { body, set } = ctx;
//     console.log(body, "fff");

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

//         const questionsCollection = await getCollection(DEMO_QUIZ_COLLECTION);

//         let solution = body.solution as string;

//         // ✅ If solution is a File (Blob), upload it to S3
//         if (body.solutionType === SolutionType.IMAGE && body.solution instanceof File) {
//             const { fullUrl } = await uploadFileToS3(body.solution, "solution_images");
//             solution = fullUrl;
//         }

//         const questionData = {
//             ...body,
//             solution,
//             question: body.question,   // already parsed above
//             options: body.options,
//             demoCourseId: new ObjectId(body.demoCourseId),
//             isActive: true,
//             createdAt: new Date(),
//             updatedAt: new Date()
//         };

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

export const addQuestionToDemoCourse = async (ctx: Context<{ body: AddQuestionToDemoCourseSchema }>) => {
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

        const questionsCollection = await getCollection(DEMO_QUIZ_COLLECTION);

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
            demoCourseId: new ObjectId(body.demoCourseId),
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

// export const updateExamQuestion = async (
//     ctx: Context<{
//         body: DemoQuestionUpdate;
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

//         if (body.question) body.question = parseIfString(body.question);
//         if (body.options) body.options = parseIfString(body.options);


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

//         const questionsCollection = await getCollection(DEMO_QUIZ_COLLECTION);

//         const existing = await questionsCollection.findOne({
//             _id: new ObjectId(questionId)
//         });

//         if (!existing) {
//             set.status = 404;
//             return { success: false, message: "Question not found" };
//         }

//         // ✅ If a new image File was uploaded, push it to S3 and get the URL
//         let solution = body.solution;
//         if (body.solutionType === SolutionType.IMAGE && body.solution instanceof File) {
//             const { fullUrl } = await uploadFileToS3(body.solution, "solution_images");
//             solution = fullUrl;
//         }

//         const updatedData: any = {
//             ...existing,

//             ...body,
//             solution,               // use resolved URL (or original string for TEXT/VIDEO)
//             updatedAt: new Date()
//         };

//         delete updatedData.questionImage;
//         if (body.demoCourseId) updatedData.demoCourseId = new ObjectId(body.demoCourseId);


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

export const updateExamQuestion = async (
    ctx: Context<{
        body: DemoQuestionUpdate;
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

        const questionsCollection = await getCollection(DEMO_QUIZ_COLLECTION);

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

        if (body.demoCourseId) updatedData.demoCourseId = new ObjectId(body.demoCourseId);

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

export const getQuizQuestions = async (ctx: Context<{ query: GetDemoQuizQuestionsSchema }>) => {
    const { query, set, } = ctx;
    const { demoCourseId, difficulty, type, limit = 10, questionModel } = query;

    try {

        const filter: any = {
            demoCourseId: new ObjectId(demoCourseId),
            isActive: true,
            isDeleted: { $ne: true },
        };


        if (difficulty) filter.difficulty = difficulty;
        if (type) filter.type = type;
        if (questionModel) filter.questionModel = questionModel;

        const questionsCollection = await getCollection(DEMO_QUIZ_COLLECTION);
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
            },
        };
    } catch (error: any) {
        console.error("Get Quiz Questions Error:", error);
        set.status = 500;
        return { success: false, message: error.message || "Failed to fetch quiz questions" };
    }
};
export const getAllQuestions = async (ctx: Context<{ query: GetDemoQuizQuestionsSchema }>) => {
    const { query, set } = ctx;
    console.log(query, "que")
    const demoCourseId = query.demoCourseId;
    const difficulty = query.difficulty;
    const type = query.type;
    const quetionModel = query.questionModel;
    const search = query.search?.trim();
    const limit = Math.max(1, Math.min(50, Number(query.limit) || 10));
    const page = Math.max(1, Number(query.page) || 1);
    const skip = (page - 1) * limit;

    if (!demoCourseId) {
        set.status = 400;
        return { success: false, message: "demoCourseId is required" };
    }

    try {
        const questionsCollection = await getCollection(DEMO_QUIZ_COLLECTION);

        const filter: any = {
            demoCourseId: new ObjectId(demoCourseId),
            isActive: true,
            isDeleted: { $ne: true },
        };


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
            { $sort: { createdAt: 1 } },
            { $skip: skip },
            { $limit: limit },
            {
                $project: {
                    _id: 1,
                    courseId: 1,
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
                }
            }
        ];

        const questions = await questionsCollection.aggregate(pipeline).toArray();

        const total = await questionsCollection.countDocuments(filter);



        set.status = 200;
        return {
            success: true,
            message: "Quiz questions fetched successfully",
            data: {
                questions,
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
export const submitQuizAnswers = async (
    ctx: Context<{ body: SubmitDemoQuizAnswersSchema }>
) => {
    const { body, set, } = ctx;
    const { demoCourseId, answers } = body;

    try {


        const questionsCollection = await getCollection(DEMO_QUIZ_COLLECTION);

        let correctCount = 0;
        let answeredCount = 0;
        let unansweredCount = 0;
        let skippedCount = 0;
        let markedForReviewCount = 0;

        const processedResults: any[] = [];

        for (const ans of answers) {
            const question = await questionsCollection.findOne({
                _id: new ObjectId(ans.questionId),
                demoCourseId: new ObjectId(demoCourseId),
                isActive: true,
                isDeleted: { $ne: true }
            });

            if (!question) {
                throw new Error(`Invalid question ID: ${ans.questionId}`);
            }

            const isAnswered = ans.answer !== "" && ans.answer !== null;
            const isSkipped = !isAnswered;
            const isMarkedForReview = !!ans.isMarkedForReview;

            let isCorrect = false;

            if (isAnswered) {
                answeredCount++;
                if (question.type === "MCQ") {
                    if (question.correctAnswer === ans.answer) {
                        isCorrect = true;
                        correctCount++;
                    }
                } else if (question.type === "FILL_BLANK") {
                    if (question.correctAnswer === ans.answer.trim()) {
                        isCorrect = true;
                        correctCount++;
                    }
                }
            } else {
                unansweredCount++;
                if (isMarkedForReview) {
                    skippedCount++;
                }
            }

            if (isMarkedForReview) {
                markedForReviewCount++;
            }

            const resultItem: any = {
                id: question._id.toString(),
                question: question.question,
                solution: question.solution,
                solutionType: question.solutionType,
                type: question.type,
                difficulty: question.difficulty,
                userAnswer: ans.answer || null,
                correctAnswer: question.correctAnswer,
                isCorrect,
                status: isAnswered
                    ? (isCorrect ? "correct" : "incorrect")
                    : (isMarkedForReview ? "review" : "skipped"),
                isMarkedForReview: isMarkedForReview
            };

            if (question.type === "MCQ" && question.options) {
                resultItem.options = question.options;
            }

            processedResults.push(resultItem);
        }

        const wrongCount = answeredCount - correctCount;
        const percentage = answeredCount > 0 ? (correctCount / answeredCount) * 100 : 0;
        const isPassed = percentage >= passPercentage;

        const resultMessage = isPassed
            ? {
                title: "Yeah! You done",
                description: "Congratulations 🎉 You've successfully completed the quiz! Great effort—keep learning and improving"
            }
            : {
                title: "Great Effort",
                description: "Don't worry about mistakes — review and try again to improve your score."
            };


        set.status = 200;
        return {
            success: true,
            message: "Quiz submitted successfully",
            data: {
                summary: {
                    totalQuestions: answers.length,
                    passPercentage: passPercentage,
                    answered: answeredCount,
                    unanswered: unansweredCount,
                    correct: correctCount,
                    wrong: wrongCount,
                    skipped: skippedCount,
                    markedForReview: markedForReviewCount,
                    scorePercentage: Math.round(percentage * 100) / 100,
                },
                questions: processedResults,
                resultMessage
            }
        };

    } catch (error: any) {
        console.error("Submit quiz error:", error);
        set.status = 400;
        return {
            success: false,
            message: error.message || "Failed to submit and evaluate quiz"
        };
    }
};
export const getQuestionById = async (ctx: Context<{ query: GetDemoQuestionsById }>) => {
    const { params, set } = ctx;
    const { questionId } = params;
    try {

        const questionsCollection = await getCollection(DEMO_QUIZ_COLLECTION);
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
export const demoDeleteQuestion = async (ctx: Context<{ query: DemoDeleteQuestionSchema }>) => {
    const { query, set } = ctx;
    const { questionId } = query;
    try {

        const questionsCollection = await getCollection(DEMO_QUIZ_COLLECTION);
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
