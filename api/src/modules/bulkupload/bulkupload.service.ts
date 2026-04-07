import { getCollection } from "@lib/config/db.config";
import { EXAM_QUIZ_COLLECTION, MATHPIX_PDF_COLLECTION, QUESTIONS_COLLECTION } from "@lib/Db_collections";
import { runBulkUploadPipeline } from "@lib/utils/bulkupload";
import { uploadFileToS3 } from "@lib/utils/s3";
import { QuestionType, SolutionType } from "@types";
import { Context } from "elysia";
import { ObjectId } from "mongodb";
import { AddQuestionToExamSchema, CreateQuestionSchema } from "./bulkupload.model";
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
export const uploadPdf = async (ctx: Context<{ body: any }>) => {
    const { body, set } = ctx;

    try {
        const file = body?.file;

        if (!file) {
            set.status = 400;
            return {
                success: false,
                message: "File is required",
            };
        }
        const formData = new FormData();
        formData.append("file", file);

        formData.append(
            "options_json",
            JSON.stringify({
                formats: ["latex_styled", "text"],
                include_line_data: true,
            })
        );

        const response = await fetch("https://api.mathpix.com/v3/pdf", {
            method: "POST",
            headers: {
                app_id: process.env.MATHPIX_APP_ID!,
                app_key: process.env.MATHPIX_APP_KEY!,
            },
            body: formData,
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data?.error || "Mathpix upload failed");
        }

        const { pdf_id } = data;

        console.log("PDF ID:", pdf_id);

        set.status = 200;
        return {
            success: true,
            message: "PDF uploaded successfully",
            pdf_id,
        };
    } catch (error: any) {
        console.error("Upload Pdf error:", error);
        set.status = 500;
        return {
            success: false,
            message: error.message || "Failed to upload pdf",
        };
    }
};
export const getPdfStatus = async (
    ctx: Context<{ params: { pdf_id: string } }>
) => {
    const { params, set } = ctx;

    try {
        const { pdf_id } = params;

        const response = await fetch(
            `https://api.mathpix.com/v3/pdf/${pdf_id}`,
            {
                method: "GET",
                headers: {
                    app_id: process.env.MATHPIX_APP_ID!,
                    app_key: process.env.MATHPIX_APP_KEY!,
                },
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data?.error || "Failed to fetch result");
        }

        // ⏳ Still processing
        if (data.status !== "completed") {
            return {
                success: false,
                message: "PDF still processing",
                status: data.status,
            };
        }

        // ✅ Save only once using UPSERT
        const pdfCollection = await getCollection(MATHPIX_PDF_COLLECTION);

        const result = await pdfCollection.updateOne(
            { pdf_id },
            {
                $setOnInsert: {
                    pdf_id,
                    status: data.status,
                    fileName: data.input_file,
                    numPages: data.num_pages,
                    numPagesCompleted: data.num_pages_completed,
                    percentDone: data.percent_done,
                    createdAt: new Date(),
                },
            },
            { upsert: true }
        );


        set.status = 200;
        return {
            success: true,
            raw: data,
        };
    } catch (error: any) {
        console.error("Get PDF result error:", error);
        set.status = 500;

        return {
            success: false,
            message: error.message,
        };
    }
};
export const downloadPdfTex = async (ctx: Context<{ params: { pdf_id: string } }>) => {
    const { params, set } = ctx;

    try {
        const { pdf_id } = params;

        const response = await fetch(
            `https://api.mathpix.com/v3/pdf/${pdf_id}.tex.zip`,
            {
                method: "GET",
                headers: {
                    app_id: process.env.MATHPIX_APP_ID!,
                    app_key: process.env.MATHPIX_APP_KEY!,
                },
            }
        );

        if (!response.ok) {
            throw new Error("Failed to download TEX");
        }

        const buffer = await response.arrayBuffer();

        set.headers["Content-Type"] = "application/zip";
        set.headers["Content-Disposition"] = `attachment; filename=${pdf_id}.zip`;

        return buffer;
    } catch (error: any) {
        console.error("Download TEX error:", error);
        set.status = 500;

        return {
            success: false,
            message: error.message,
        };
    }
};
export const deleteMathpixPdf = async (
    ctx: Context<{ params: { pdf_id: string } }>
) => {
    const { params, set } = ctx;

    try {
        const { pdf_id } = params;

        if (!pdf_id) {
            set.status = 400;
            return {
                success: false,
                message: "pdf_id is required",
            };
        }

        const response = await fetch(
            `https://api.mathpix.com/v3/pdf/${pdf_id}`,
            {
                method: "DELETE",
                headers: {
                    app_id: process.env.MATHPIX_APP_ID!,
                    app_key: process.env.MATHPIX_APP_KEY!,
                },
            }
        );

        if (!response.ok) {
            const err = await response.text();
            throw new Error(err || "Failed to delete Mathpix PDF");
        }

        set.status = 200;
        return {
            success: true,
            message: "Mathpix PDF deleted successfully",
        };
    } catch (error: any) {
        console.error("Mathpix Delete Error:", error);
        set.status = 500;

        return {
            success: false,
            message: error.message,
        };
    }
};
export const processBulkQuestions = async (
    ctx: Context<{
        body: {
            pdf_id: string;
            lessonId?: string | null;
            examId?: string | null;
        };
    }>
) => {
    const { body, set } = ctx;

    try {
        const { pdf_id, lessonId, examId } = body;

        if (!pdf_id) {
            set.status = 400;
            return { success: false, message: "pdf_id is required" };
        }

        if (!lessonId && !examId) {
            set.status = 400;
            return {
                success: false,
                message: "Either lessonId or examId is required",
            };
        }


        let questions: any = [];

        if (lessonId) {
            questions = await runBulkUploadPipeline(pdf_id, lessonId, null);
        } else if (examId) {
            questions = await runBulkUploadPipeline(pdf_id, null, examId);
        }

        set.status = 200;
        return {
            success: true,
            message: `Parsed ${questions?.length || 0} questions`,
            questions,
        };

    } catch (error: any) {
        console.error("Bulk process error:", error);

        set.status = 500;
        return {
            success: false,
            message: error?.message || "Internal Server Error",
        };
    }
};
export const getUploadedPdfsByLesson = async (
    ctx: Context<{ params: { lessonId: string } }>
) => {
    const { params, set } = ctx;
    const { lessonId } = params;

    try {
        const pdfCollection = await getCollection(MATHPIX_PDF_COLLECTION);

        const pdfs = await pdfCollection
            .find({ lessonId: new ObjectId(lessonId) })
            .sort({ createdAt: -1 })
            .toArray();

        const mapped = pdfs.map((doc) => ({
            id: doc._id.toString(),
            pdf_id: doc.pdf_id,
            fileName: doc.fileName,
            status: doc.status,
            numPages: doc.numPages ?? null,
            numPagesCompleted: doc.numPagesCompleted ?? null,
            percentDone: doc.percentDone ?? null,
            createdAt: doc.createdAt,
        }));

        return { success: true, pdfs: mapped };
    } catch (error: any) {
        console.error("Get Pdfs:", error);
        set.status = 500;
        return { success: false, message: error.message };
    }
};
export const getUploadedPdfsByExam = async (
    ctx: Context<{ params: { examId: string } }>
) => {
    const { params, set } = ctx;
    const { examId } = params;

    try {
        const pdfCollection = await getCollection(MATHPIX_PDF_COLLECTION);

        const pdfs = await pdfCollection
            .find({ examId: new ObjectId(examId) })
            .sort({ createdAt: -1 })
            .toArray();

        const mapped = pdfs.map((doc) => ({
            id: doc._id.toString(),
            pdf_id: doc.pdf_id,
            fileName: doc.fileName,
            status: doc.status,
            numPages: doc.numPages ?? null,
            numPagesCompleted: doc.numPagesCompleted ?? null,
            percentDone: doc.percentDone ?? null,
            createdAt: doc.createdAt,
        }));

        return { success: true, pdfs: mapped };
    } catch (error: any) {
        console.error("Get Pdfs:", error);
        set.status = 500;
        return { success: false, message: error.message };
    }
};
export const bulkUploadLessonQuestions = async (
    ctx: Context<{ body: any }>
) => {
    const { body, set } = ctx;

    // body will be FormData parsed by your framework (Elysia + multer-like or elysia-formdata)
    // Expect:
    // - questions: JSON stringified array of question metadata
    // - For each question that has image: questionImage_0, questionImage_1, ...
    // - For each question that has solution image: solutionImage_0, solutionImage_1, ...

    try {
        if (!body.questions || typeof body.questions !== 'string') {
            throw new Error('questions array (JSON) is required');
        }

        let parsedQuestions = JSON.parse(body.questions) as CreateQuestionSchema[];

        if (!Array.isArray(parsedQuestions) || parsedQuestions.length === 0) {
            throw new Error('At least one question is required');
        }

        const createdQuestions = [];

        for (let i = 0; i < parsedQuestions.length; i++) {
            const q = parsedQuestions[i];
            let questionImageUrl: string | undefined = undefined;
            let solutionUrl: string | undefined = undefined;

            // Handle question image (if any)
            const qImageKey = `questionImage_${i}`;
            if (body[qImageKey] instanceof File) {
                const { fullUrl } = await uploadFileToS3(body[qImageKey], 'question_images');
                questionImageUrl = fullUrl;
            }

            // Handle solution image (only if solutionType === IMAGE)
            if (q.solutionType === SolutionType.IMAGE) {
                const solImageKey = `solutionImage_${i}`;
                if (body[solImageKey] instanceof File) {
                    const { fullUrl } = await uploadFileToS3(body[solImageKey], 'solution_images');
                    solutionUrl = fullUrl;
                } else if (typeof q.solution === 'string') {
                    solutionUrl = q.solution; // already a URL (rare in bulk)
                }
            } else {
                solutionUrl = q.solution as string;
            }


            const questionData: any = {
                ...q,
                courseId: new ObjectId(q.courseId),
                chapterId: new ObjectId(q.chapterId),
                lessonId: new ObjectId(q.lessonId),
                question: {
                    ...(typeof q.question === 'string' ? parseIfString(q.question) : q.question),
                    image: questionImageUrl,
                },
                options: q.type === 'MCQ' ? parseIfString(q.options) : [],
                solution: solutionUrl,
                isActive: true,
                isDeleted: false,
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            validateQuestionByType(questionData);

            const questionsCollection = await getCollection(QUESTIONS_COLLECTION);
            const result = await questionsCollection.insertOne(questionData);

            createdQuestions.push({
                id: result.insertedId,
                ...questionData,
            });
        }

        set.status = 201;
        return {
            success: true,
            message: `${createdQuestions.length} questions created successfully`,
            data: createdQuestions,
        };
    } catch (error: any) {
        console.error('Bulk create error:', error);
        set.status = error.message?.includes('must have') ? 400 : 500;
        return {
            success: false,
            message: error.message || 'Bulk question creation failed',
        };
    }
};
export const bulkUploadExamQuestions = async (
    ctx: Context<{ body: any }>
) => {
    const { body, set } = ctx;

    // body will be FormData parsed by your framework (Elysia + multer-like or elysia-formdata)
    // Expect:
    // - questions: JSON stringified array of question metadata
    // - For each question that has image: questionImage_0, questionImage_1, ...
    // - For each question that has solution image: solutionImage_0, solutionImage_1, ...

    try {
        if (!body.questions || typeof body.questions !== 'string') {
            throw new Error('questions array (JSON) is required');
        }

        let parsedQuestions = JSON.parse(body.questions) as AddQuestionToExamSchema[];

        if (!Array.isArray(parsedQuestions) || parsedQuestions.length === 0) {
            throw new Error('At least one question is required');
        }

        const createdQuestions = [];

        for (let i = 0; i < parsedQuestions.length; i++) {
            const q = parsedQuestions[i];
            let questionImageUrl: string | undefined = undefined;
            let solutionUrl: string | undefined = undefined;

            // Handle question image (if any)
            const qImageKey = `questionImage_${i}`;
            if (body[qImageKey] instanceof File) {
                const { fullUrl } = await uploadFileToS3(body[qImageKey], 'question_images');
                questionImageUrl = fullUrl;
            }

            // Handle solution image (only if solutionType === IMAGE)
            if (q.solutionType === SolutionType.IMAGE) {
                const solImageKey = `solutionImage_${i}`;
                if (body[solImageKey] instanceof File) {
                    const { fullUrl } = await uploadFileToS3(body[solImageKey], 'solution_images');
                    solutionUrl = fullUrl;
                } else if (typeof q.solution === 'string') {
                    solutionUrl = q.solution; // already a URL (rare in bulk)
                }
            } else {
                solutionUrl = q.solution as string;
            }


            const questionData: any = {
                ...q,
                examId: new ObjectId(q.examId),
                question: {
                    ...(typeof q.question === 'string' ? parseIfString(q.question) : q.question),
                    image: questionImageUrl,
                },
                options: q.type === 'MCQ' ? parseIfString(q.options) : [],
                solution: solutionUrl,
                isActive: true,
                isDeleted: false,
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            validateQuestionByType(questionData);

            const questionsCollection = await getCollection(EXAM_QUIZ_COLLECTION);
            const result = await questionsCollection.insertOne(questionData);

            createdQuestions.push({
                id: result.insertedId,
                ...questionData,
            });
        }

        set.status = 201;
        return {
            success: true,
            message: `${createdQuestions.length} questions created successfully`,
            data: createdQuestions,
        };
    } catch (error: any) {
        console.error('Bulk create error:', error);
        set.status = error.message?.includes('must have') ? 400 : 500;
        return {
            success: false,
            message: error.message || 'Bulk question creation failed',
        };
    }
};
