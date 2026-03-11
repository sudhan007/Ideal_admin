import { Context } from "elysia";
import { AddQuestionToExamSchema, ExamCreateSchema, ExamGetSchema, ExamQuestionUpdate, GetAllExamQuestions, GetExamQuizQuestionsSchema, GetQuestionsById, GetSubmissionsSchema, submitExamQuizAnswersSchema } from "./exam.model";
import { getCollection } from "@lib/config/db.config";
import { CHAPTERS_COLLECTION, COURSE_COLLECTION, COURSE_ENROLLMENT_COLLECTION, EXAM_COLLECTION, EXAM_QUIZ_COLLECTION, EXAM_SUBMISSION_COLLECTION, LESSONS_COLLECTION, STUDENT_COLLECTION } from "@lib/Db_collections";
import { ObjectId } from "mongodb";
import { passPercentage, QuestionType, SolutionType, StoreType } from "@types";
import { uploadFileToS3 } from "@lib/utils/s3";

const validateQuestionByType = (body: AddQuestionToExamSchema) => {
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
};

export const createExam = async (ctx: Context<{ body: ExamCreateSchema }>) => {
    const { body, set } = ctx;
    const {
        courseId,
        chapterId,
        lessonId,
        examName,
        dueDateTime,
    } = body;
    try {
        const examCollection = await getCollection(EXAM_COLLECTION)

        const examDocument = {
            courseId: new ObjectId(courseId),
            chapterId: new ObjectId(chapterId),
            lessonId: new ObjectId(lessonId),
            examName,
            dueDateTime: new Date(dueDateTime),
            isActive: true,
            isDeleted: false,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        const result = await examCollection.insertOne(examDocument);

        set.status = 201;
        return {
            message: "Exam created successfully",
            ok: true
        };

    } catch (error) {
        console.error("Error creating Exam:", error);
        set.status = 500;
        return { error: "Failed to create Exam" };
    }
}
export const updateExam = async (ctx: Context<{ body: ExamCreateSchema; params: { id: string } }>) => {
    const { body, set, params } = ctx;
    const examId = params.id;

    const {
        courseId,
        chapterId,
        lessonId,
        examName,
        dueDateTime,
    } = body;

    try {
        const examCollection = await getCollection(EXAM_COLLECTION)


        const existingExam = await examCollection.findOne({ _id: new ObjectId(examId) });
        if (!existingExam) {
            set.status = 404;
            return { error: "Exam not found" };
        }


        const updateDocument = {
            courseId: new ObjectId(courseId),
            chapterId: new ObjectId(chapterId),
            lessonId: new ObjectId(lessonId),
            examName,
            dueDateTime: new Date(dueDateTime),
            updatedAt: new Date(),
        };

        const result = await examCollection.updateOne(
            { _id: new ObjectId(examId) },
            { $set: updateDocument }
        );

        if (result.matchedCount === 0) {
            set.status = 404;
            return { error: "exam not found" };
        }

        set.status = 200;
        return {
            message: "Exam updated successfully",
            ok: true
        };

    } catch (error) {
        console.error("Error updating exam:", error);
        set.status = 500;
        return { error: "Failed to update exam" };
    }
};
export const getExams = async (ctx: Context<{ query: ExamGetSchema }>) => {
    const { query, set, store } = ctx;
    const { id, role } = store as StoreType;
    const { courseId, chapterId, lessonId, search, page = "1", limit = "10" } = query;
    console.log(store, query)
    try {
        const examCollection = await getCollection(EXAM_COLLECTION);
        const enrollmentCollection = await getCollection(COURSE_ENROLLMENT_COLLECTION);

        // Build base match query
        let matchQuery: any = {
            isActive: true,
            isDeleted: false,
        };

        // For STUDENT role - stricter checks + expired tasks filter
        if (role === "STUDENT") {
            if (!courseId || !ObjectId.isValid(courseId)) {
                set.status = 400;
                return { error: "courseId is required for students" };
            }

            const enrollment = await enrollmentCollection.findOne({
                studentId: new ObjectId(id),
                courseId: new ObjectId(courseId),
                // status: "active",
            });

            if (!enrollment) {
                set.status = 403;
                return {
                    error: "Access denied. You must be enrolled in this course to view tasks.",
                    enrolled: false,
                };
            }

            const currentDate = new Date();
            matchQuery.dueDateTime = { $gte: currentDate };
        }

        if (role === "ADMIN" && courseId && ObjectId.isValid(courseId)) {
            matchQuery.courseId = new ObjectId(courseId);
        }
        if (role === "STUDENT" && courseId && ObjectId.isValid(courseId)) {
            matchQuery.courseId = new ObjectId(courseId);
        }

        if (chapterId && ObjectId.isValid(chapterId)) {
            matchQuery.chapterId = new ObjectId(chapterId);
        }
        if (lessonId && ObjectId.isValid(lessonId)) {
            matchQuery.lessonId = new ObjectId(lessonId);
        }


        // Search
        if (search && search.trim()) {
            matchQuery.$or = [
                { examName: { $regex: search, $options: "i" } },
            ];
        }


        // Pagination
        const pageNum = parseInt(page, 10);
        const limitNum = parseInt(limit, 10);
        const skip = (pageNum - 1) * limitNum;

        // Main aggregation pipeline
        const pipeline = [
            { $match: matchQuery },

            // === For STUDENTS: Join latest submission ===
            ...(role === "STUDENT"
                ? [
                    {
                        $lookup: {
                            from: EXAM_SUBMISSION_COLLECTION,
                            let: { examId: "$_id", studentId: new ObjectId(id) },
                            pipeline: [
                                {
                                    $match: {
                                        $expr: {
                                            $and: [
                                                { $eq: ["$examId", "$$examId"] },
                                                { $eq: ["$studentId", "$$studentId"] },
                                            ],
                                        },
                                    },
                                },
                                { $sort: { createdAt: -1 } },
                                { $limit: 1 },
                            ],
                            as: "latestSubmission",
                        },
                    },
                    // FILTER OUT tasks that have submissions
                    {
                        $match: {
                            latestSubmission: { $size: 0 }
                        }
                    },
                ]
                : []),

            // Populate course/chapter/lesson
            {
                $lookup: {
                    from: COURSE_COLLECTION,
                    localField: "courseId",
                    foreignField: "_id",
                    as: "course",
                },
            },
            {
                $lookup: {
                    from: CHAPTERS_COLLECTION,
                    localField: "chapterId",
                    foreignField: "_id",
                    as: "chapter",
                },
            },
            {
                $lookup: {
                    from: LESSONS_COLLECTION,
                    localField: "lessonId",
                    foreignField: "_id",
                    as: "lesson",
                },
            },
            { $unwind: { path: "$course", preserveNullAndEmptyArrays: true } },
            { $unwind: { path: "$chapter", preserveNullAndEmptyArrays: true } },
            { $unwind: { path: "$lesson", preserveNullAndEmptyArrays: true } },

            // Final projection
            {
                $project: {
                    _id: 1,
                    courseId: 1,
                    chapterId: 1,
                    lessonId: 1,
                    examName: 1,
                    dueDateTime: 1,
                    createdAt: 1,
                    courseName: "$course.courseName",
                    chapterName: "$chapter.chapterName",
                    lessonName: "$lesson.lessonName",
                },
            },

            { $sort: { createdAt: -1 } },
            { $skip: skip },
            { $limit: limitNum },
        ];


        const exams = await examCollection.aggregate(pipeline).toArray();


        // Get total count with the same filter
        const countPipeline = [
            { $match: matchQuery },
            ...(role === "STUDENT"
                ? [
                    {
                        $lookup: {
                            from: EXAM_SUBMISSION_COLLECTION,
                            let: { examId: "$_id", studentId: new ObjectId(id) },
                            pipeline: [
                                {
                                    $match: {
                                        $expr: {
                                            $and: [
                                                { $eq: ["$examId", "$$examId"] },
                                                { $eq: ["$studentId", "$$studentId"] },
                                            ],
                                        },
                                    },
                                },
                            ],
                            as: "latestSubmission",
                        },
                    },
                    {
                        $match: {
                            latestSubmission: { $size: 0 }
                        }
                    },
                ]
                : []),
            { $count: "total" }
        ];


        const countResult = await examCollection.aggregate(countPipeline).toArray();
        const totalExams = countResult.length > 0 ? countResult[0].total : 0;

        // Pagination metadata
        const totalPages = Math.ceil(totalExams / limitNum);

        set.status = 200;
        return {
            ok: true,
            data: exams,
            pagination: {
                currentPage: pageNum,
                totalPages,
                totalExams,
                limit: limitNum,
                hasNextPage: pageNum < totalPages,
                hasPrevPage: pageNum > 1,
            },
        };
    } catch (error) {
        console.error("Error getting Exams:", error);
        set.status = 500;
        return {
            error: "Failed to get Exams",
            details: error instanceof Error ? error.message : "Unknown error",
        };
    }
};
export const getExamsByCourse = async (ctx: Context<{ query: any }>) => {
    const { query, set, store } = ctx;
    const { courseId, chapterId, lessonId, search } = query;
    console.log(store, query)
    try {
        const examCollection = await getCollection(EXAM_COLLECTION);

        let matchQuery: any = {
            isActive: true,
            isDeleted: false,
        };



        if (courseId && ObjectId.isValid(courseId)) {
            matchQuery.courseId = new ObjectId(courseId);
        }

        if (chapterId && ObjectId.isValid(chapterId)) {
            matchQuery.chapterId = new ObjectId(chapterId);
        }
        if (lessonId && ObjectId.isValid(lessonId)) {
            matchQuery.lessonId = new ObjectId(lessonId);
        }

        if (search && search.trim()) {
            matchQuery.$or = [
                { examName: { $regex: search, $options: "i" } },
            ];
        }


        const pipeline = [
            { $match: matchQuery },
            {
                $project: {
                    _id: 1,
                    examName: 1,
                },
            },
            { $sort: { createdAt: -1 } },
        ];

        const exams = await examCollection.aggregate(pipeline).toArray();

        const countPipeline = [
            { $match: matchQuery },
            { $count: "total" }
        ];


        const countResult = await examCollection.aggregate(countPipeline).toArray();
        const totalExams = countResult.length > 0 ? countResult[0].total : 0;

        set.status = 200;
        return {
            ok: true,
            data: exams,
        };
    } catch (error) {
        console.error("Error getting Exams:", error);
        set.status = 500;
        return {
            error: "Failed to get Exams",
            details: error instanceof Error ? error.message : "Unknown error",
        };
    }
};
// export const addQuestionToExam = async (ctx: Context<{ body: AddQuestionToExamSchema; params: { id: string } }>) => {
//     const { body, set } = ctx;
//     try {
//         validateQuestionByType(body);
//         const questionsCollection = await getCollection(EXAM_QUIZ_COLLECTION);

//         let solution = body.solution;

//         if (body.solutionType === SolutionType.IMAGE && body.solution) {
//             const image = body.solution;
//             const { fullUrl } = await uploadFileToS3(image, "solution_images");
//             solution = fullUrl;
//         }

//         const questionData = {
//             ...body,
//             solution,
//             examId: new ObjectId(body.examId),
//             isActive: true,
//             createdAt: new Date(),
//             updatedAt: new Date()
//         };

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

export const addQuestionToExam = async (ctx: Context<{ body: AddQuestionToExamSchema }>) => {
    const { body, set } = ctx;
    console.log(body, "fff");

    try {
        // ✅ Parse JSON-stringified fields that come through FormData
        body.question = parseIfString(body.question);
        body.options = parseIfString(body.options);

        if (body.questionImage instanceof File) {
            const { fullUrl } = await uploadFileToS3(body.questionImage, "question_images");
            body.question = {
                ...body.question,
                image: fullUrl
            };
        }
        else if (
            body.question &&
            typeof body.question === "object" &&
            body.question.image instanceof File
        ) {
            const { fullUrl } = await uploadFileToS3(body.question.image, "question_images");
            body.question = {
                ...body.question,
                image: fullUrl
            };
        }


        validateQuestionByType(body);

        const questionsCollection = await getCollection(EXAM_QUIZ_COLLECTION);

        let solution = body.solution as string;

        // ✅ If solution is a File (Blob), upload it to S3
        if (body.solutionType === SolutionType.IMAGE && body.solution instanceof File) {
            const { fullUrl } = await uploadFileToS3(body.solution, "solution_images");
            solution = fullUrl;
        }

        const questionData = {
            ...body,
            solution,
            question: body.question,   // already parsed above
            options: body.options,
            examId: new ObjectId(body.examId),
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        delete (questionData as any).questionImage;


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
};

export const updateExamQuestion = async (
    ctx: Context<{
        body: ExamQuestionUpdate;
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
        if (body.question) body.question = parseIfString(body.question);
        if (body.options) body.options = parseIfString(body.options);



        if (body.questionImage instanceof File) {
            const { fullUrl } = await uploadFileToS3(body.questionImage, "question_images");
            body.question = {
                ...body.question,
                image: fullUrl
            };
        }
        // ✅ Legacy: also handle inline File on question.image
        else if (
            body.question &&
            typeof body.question === "object" &&
            body.question.image instanceof File
        ) {
            const { fullUrl } = await uploadFileToS3(body.question.image, "question_images");
            body.question = {
                ...body.question,
                image: fullUrl
            };
        }


        const questionsCollection = await getCollection(EXAM_QUIZ_COLLECTION);

        const existing = await questionsCollection.findOne({
            _id: new ObjectId(questionId)
        });

        if (!existing) {
            set.status = 404;
            return { success: false, message: "Question not found" };
        }

        let solution = body.solution;
        if (body.solutionType === SolutionType.IMAGE && body.solution instanceof File) {
            const { fullUrl } = await uploadFileToS3(body.solution, "solution_images");
            solution = fullUrl;
        }

        const updatedData: any = {
            ...existing,
            ...body,
            solution,               // use resolved URL (or original string for TEXT/VIDEO)
            updatedAt: new Date()
        };


        delete updatedData.questionImage;

        if (body.examId) updatedData.examId = new ObjectId(body.examId);

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

export const getExamQuizQuestions = async (ctx: Context<{ query: GetExamQuizQuestionsSchema }>) => {
    const { query, set } = ctx;
    const { difficulty, type, examId } = query;

    try {

        const filter: any = {
            examId: new ObjectId(examId),
            isActive: true,
            isDeleted: { $ne: true }
        };

        if (difficulty) filter.difficulty = difficulty;
        if (type) filter.type = type;

        const questionsCollection = await getCollection(EXAM_QUIZ_COLLECTION);

        const questions = await questionsCollection.find(filter).toArray();

        const shuffledQuestions = shuffleArray(questions);
        const limitedQuestions = shuffledQuestions

        const processedQuestions = limitedQuestions.map(question => {
            const baseQuestion: any = {
                id: question._id,
                courseId: question.courseId,
                chapterId: question.chapterId,
                lessonId: question.lessonId,
                type: question.type,
                difficulty: question.difficulty,
                question: question.question,
                questionModel: question.questionModel
            };

            if (question.type === "MCQ" && question.options) {
                baseQuestion.options = shuffleArray(question.options);
            }

            return baseQuestion;
        });

        set.status = 200;
        return {
            success: true,
            message: "Quiz questions fetched successfully",
            data: {
                questions: processedQuestions,
                total: processedQuestions.length,
            }
        };

    } catch (error: any) {
        console.error("Get Quiz Questions Error:", error);
        set.status = 500;
        return {
            success: false,
            message: error.message || "Failed to fetch quiz questions"
        };
    }
};
export const submitExamQuizAnswers = async (
    ctx: Context<{ body: submitExamQuizAnswersSchema }>
) => {
    const { body, set, store } = ctx;
    const { id } = store as StoreType;
    const { examId, answers, } = body;

    try {
        const questionsCollection = await getCollection(EXAM_QUIZ_COLLECTION);
        const examSubmissionCollection = await getCollection(EXAM_SUBMISSION_COLLECTION);

        let correctCount = 0;
        let answeredCount = 0;
        let unansweredCount = 0;
        let skippedCount = 0;
        let markedForReviewCount = 0;

        const processedResults: any[] = [];

        for (const ans of answers) {
            const question = await questionsCollection.findOne({
                _id: new ObjectId(ans.questionId),
                examId: new ObjectId(examId),
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

        await examSubmissionCollection.insertOne({
            studentId: new ObjectId(id),
            examId: new ObjectId(examId),
            submittedAt: new Date(),
            correctCount,
            wrongCount,
            answeredCount,
            unansweredCount,
            skippedCount,
            markedForReviewCount,
            totalQuestions: answers.length,
            scorePercentage: Math.round(percentage * 100) / 100,
            isPassed,
            status: "completed",
            createdAt: new Date(),
            updatedAt: new Date(),
        });


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
}
export const getQuestionById = async (ctx: Context<{ query: GetQuestionsById }>) => {
    const { params, set } = ctx;
    const { questionId } = params;
    try {

        const questionsCollection = await getCollection(EXAM_QUIZ_COLLECTION);
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
export const getAllQuestions = async (ctx: Context<{ query: GetAllExamQuestions }>) => {
    const { query, set } = ctx;
    console.log(query, "que")
    const examId = query.examId;
    const difficulty = query.difficulty;
    const type = query.type;
    const search = query.search?.trim();
    const limit = Math.max(1, Math.min(50, Number(query.limit) || 10));
    const page = Math.max(1, Number(query.page) || 1);
    const skip = (page - 1) * limit;

    if (!examId) {
        set.status = 400;
        return { success: false, message: "examId is required" };
    }

    try {
        const questionsCollection = await getCollection(EXAM_QUIZ_COLLECTION);

        const filter: any = {
            examId: new ObjectId(examId),
            isActive: true,
            isDeleted: { $ne: true },
        };

        if (difficulty) filter.difficulty = difficulty;
        if (type) filter.type = type;

        if (search) {
            filter.$or = [
                { "question.text": { $regex: search, $options: "i" } },
                { "question.latex": { $regex: search, $options: "i" } },
            ];
        }

        const pipeline = [
            { $match: filter },
            { $sort: { createdAt: 1 } },
            { $skip: skip },
            { $limit: limit },
            {
                $project: {
                    _id: 1,
                    examId: 1,
                    type: 1,
                    difficulty: 1,
                    question: 1,
                    options: 1,
                    correctAnswer: 1,
                    createdAt: 1,
                    updatedAt: 1,
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
export const GetSubmissions = async (ctx: Context<{ query: GetSubmissionsSchema }>) => {
    const { query, set, store } = ctx;
    const { id, role } = store as StoreType;
    const { examId, studentId, page = "1", limit = "10" } = query;

    try {
        const examSubmissionCollection = await getCollection(EXAM_SUBMISSION_COLLECTION);

        let matchQuery: any = {};

        if (role === "STUDENT") {
            matchQuery.studentId = new ObjectId(id);
        }

        if (role === "ADMIN") {
            if (studentId && ObjectId.isValid(studentId)) {
                matchQuery.studentId = new ObjectId(studentId);
            }
        }

        if (examId && ObjectId.isValid(examId)) {
            matchQuery.examId = new ObjectId(examId);
        }


        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;

        const totalSubmissions = await examSubmissionCollection.countDocuments(matchQuery);

        const submissions = await examSubmissionCollection.aggregate([
            { $match: matchQuery },
            {
                $lookup: {
                    from: EXAM_COLLECTION,
                    localField: "examId",
                    foreignField: "_id",
                    as: "exam"
                }
            },
            { $unwind: { path: "$exam", preserveNullAndEmptyArrays: true } },

            ...(role === "ADMIN" ? [{
                $lookup: {
                    from: STUDENT_COLLECTION,
                    localField: "studentId",
                    foreignField: "_id",
                    as: "student"
                }
            }, { $unwind: { path: "$student", preserveNullAndEmptyArrays: true } }] : []),

            {
                $lookup: {
                    from: CHAPTERS_COLLECTION,
                    localField: "exam.chapterId",
                    foreignField: "_id",
                    as: "chapter"
                }
            },
            { $unwind: { path: "$chapter", preserveNullAndEmptyArrays: true } },

            {
                $lookup: {
                    from: LESSONS_COLLECTION,
                    localField: "exam.lessonId",
                    foreignField: "_id",
                    as: "lesson"
                }
            },
            { $unwind: { path: "$lesson", preserveNullAndEmptyArrays: true } },
            {
                $project: {
                    _id: 1,
                    examId: 1,
                    studentId: 1,
                    correctCount: 1,
                    wrongCount: 1,
                    totalQuestions: 1,
                    scorePercentage: 1,
                    submittedAt: "$createdAt",
                    examName: "$exam.examName",
                    examDueDate: "$exam.dueDateTime",
                    examCreatedAt: "$exam.createdAt",
                    chapterName: "$chapter.chapterName",
                    lessonName: "$lesson.lessonName",
                    ...(role === "ADMIN" && {
                        studentName: "$student.studentName",
                        studentPhoneNumber: "$student.studentPhoneNumber",
                        studentEmail: "$student.email",
                    }),
                }
            },

            { $sort: { updatedAt: -1 } },
            { $skip: skip },
            { $limit: limitNum }
        ]).toArray();

        const totalPages = Math.ceil(totalSubmissions / limitNum);

        set.status = 200;
        return {
            ok: true,
            data: submissions,
            pagination: {
                currentPage: pageNum,
                totalPages,
                totalSubmissions,
                limit: limitNum,
                hasNextPage: pageNum < totalPages,
                hasPrevPage: pageNum > 1
            }
        };

    } catch (error) {
        console.error("Error getting submissions:", error);
        set.status = 500;
        return {
            error: "Failed to get submissions",
            details: error instanceof Error ? error.message : "Unknown error"
        };
    }
};
