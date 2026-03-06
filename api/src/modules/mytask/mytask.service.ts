import { Context } from "elysia";
import { GetSubmissionHistorySchema, GetSubmissionsSchema, TaskCreateSchema, TaskGetSchema, TaskReviewSchema, TaskSubmitSchema } from "./mytask.model";
import { getCollection } from "@lib/config/db.config";
import { CHAPTERS_COLLECTION, LESSONS_COLLECTION, COURSE_COLLECTION, COURSE_ENROLLMENT_COLLECTION, STUDENT_COLLECTION, TASK_COLLECTION, TASK_SUBMISSION_COLLECTION, TASK_SUBMISSION_HISTORY_COLLECTION, TASK_TIMELINE_COLLECTION } from "@lib/Db_collections";
import { deleteFileFromS3, uploadFileToS3 } from "@lib/utils/s3";
import { ObjectId } from "mongodb";
import { StoreType, TaskStatus } from "@types";
import { sendNotification } from "@lib/utils/notification";

export const createTask = async (ctx: Context<{ body: TaskCreateSchema }>) => {
    const { body, set } = ctx;
    const {
        courseId,
        chapterId,
        lessonId,
        taskName,
        taskDescription,
        dueDateTime,
        fileType,
        taskImage,
        taskPdf
    } = body;
    try {
        const tasksCollection = await getCollection(TASK_COLLECTION)

        let fileUrls: string[] = [];
        let uploadedFileType: string;

        if (fileType === "PDF") {
            if (!taskPdf) {
                set.status = 400;
                return { error: "PDF file is required when fileType is PDF" };
            }

            const { fullUrl } = await uploadFileToS3(taskPdf, "tasks/pdfs");
            fileUrls.push(fullUrl);
            uploadedFileType = "PDF";

        } else if (fileType === "IMAGE") {
            if (!taskImage || (Array.isArray(taskImage) && taskImage.length === 0)) {
                set.status = 400;
                return { error: "At least one image is required when fileType is IMAGE" };
            }

            const images = Array.isArray(taskImage) ? taskImage : [taskImage];

            for (const image of images) {
                const { fullUrl } = await uploadFileToS3(image, "tasks/images");
                fileUrls.push(fullUrl);
            }
            uploadedFileType = "IMAGE";
        } else {
            set.status = 400;
            return { error: "Invalid fileType. Must be either PDF or IMAGE" };
        }

        const taskDocument = {
            courseId: new ObjectId(courseId),
            chapterId: new ObjectId(chapterId),
            lessonId: new ObjectId(lessonId),
            taskName,
            taskDescription,
            dueDateTime: new Date(dueDateTime),
            fileType: uploadedFileType,
            fileUrls,
            isActive: true,
            isDeleted: false,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        const result = await tasksCollection.insertOne(taskDocument);

        set.status = 201;
        return {
            message: "Task created successfully",
            ok: true
        };

    } catch (error) {
        console.error("Error creating task:", error);
        set.status = 500;
        return { error: "Failed to create task" };
    }
};
export const updateTask = async (ctx: Context<{ body: TaskCreateSchema; params: { id: string } }>) => {
    const { body, set, params } = ctx;
    const taskId = params.id;

    const {
        courseId,
        chapterId,
        lessonId,
        taskName,
        taskDescription,
        dueDateTime,
        fileType,
        taskImage,
        taskPdf
    } = body;

    try {
        const tasksCollection = await getCollection(TASK_COLLECTION);

        // Verify task exists
        const existingTask = await tasksCollection.findOne({ _id: new ObjectId(taskId) });
        if (!existingTask) {
            set.status = 404;
            return { error: "Task not found" };
        }

        let fileUrls: string[] = existingTask.fileUrls || [];
        let uploadedFileType: string = existingTask.fileType;

        // Handle file updates if provided
        if (fileType === "PDF" && taskPdf) {
            // Delete old files from S3
            await deleteFileFromS3(existingTask.fileUrls);

            const { fullUrl } = await uploadFileToS3(taskPdf, "tasks/pdfs");
            fileUrls = [fullUrl];
            uploadedFileType = "PDF";

        } else if (fileType === "IMAGE" && taskImage) {


            const images = Array.isArray(taskImage) ? taskImage : [taskImage];
            fileUrls = [];

            for (const image of images) {
                const { fullUrl } = await uploadFileToS3(image, "tasks/images");
                fileUrls.push(fullUrl);
            }
            uploadedFileType = "IMAGE";
        } else if (fileType !== existingTask.fileType) {
            set.status = 400;
            return { error: `File is required when changing fileType to ${fileType}` };
        }

        const updateDocument = {
            courseId: new ObjectId(courseId),
            chapterId: new ObjectId(chapterId),
            lessonId: new ObjectId(lessonId),
            taskName,
            taskDescription,
            dueDateTime: new Date(dueDateTime),
            fileType: uploadedFileType,
            fileUrls,
            updatedAt: new Date(),
        };

        const result = await tasksCollection.updateOne(
            { _id: new ObjectId(taskId) },
            { $set: updateDocument }
        );

        if (result.matchedCount === 0) {
            set.status = 404;
            return { error: "Task not found" };
        }

        set.status = 200;
        return {
            message: "Task updated successfully",
            ok: true
        };

    } catch (error) {
        console.error("Error updating task:", error);
        set.status = 500;
        return { error: "Failed to update task" };
    }
};
// export const getTasks = async (ctx: Context<{ query: TaskGetSchema }>) => {
//     const { query, set, store } = ctx;
//     const { id, role } = store as StoreType;
//     const { courseId, chapterId, lessonId, search, page = "1", limit = "10" } = query;

//     try {
//         const tasksCollection = await getCollection(TASK_COLLECTION);
//         const enrollmentCollection = await getCollection(COURSE_ENROLLMENT_COLLECTION);


//         // Build base match query
//         let matchQuery: any = {
//             isActive: true,
//             isDeleted: false,
//         };

//         // For STUDENT role - stricter checks + expired tasks filter
//         if (role === "STUDENT") {
//             if (!courseId || !ObjectId.isValid(courseId)) {
//                 set.status = 400;
//                 return { error: "courseId is required for students" };
//             }

//             const enrollment = await enrollmentCollection.findOne({
//                 studentId: new ObjectId(id),
//                 courseId: new ObjectId(courseId),
//                 status: "active",
//             });

//             if (!enrollment) {
//                 set.status = 403;
//                 return {
//                     error: "Access denied. You must be enrolled in this course to view tasks.",
//                     enrolled: false,
//                 };
//             }

//             // Only show non-expired tasks for students
//             const currentDate = new Date();
//             matchQuery.dueDateTime = { $gte: currentDate };
//         }

//         // Admin can filter by course optionally
//         if (role === "ADMIN" && courseId && ObjectId.isValid(courseId)) {
//             matchQuery.courseId = new ObjectId(courseId);
//         }
//         if (role === "STUDENT" && courseId && ObjectId.isValid(courseId)) {
//             matchQuery.courseId = new ObjectId(courseId);
//         }

//         // Optional filters
//         if (chapterId && ObjectId.isValid(chapterId)) {
//             matchQuery.chapterId = new ObjectId(chapterId);
//         }
//         if (lessonId && ObjectId.isValid(lessonId)) {
//             matchQuery.lessonId = new ObjectId(lessonId);
//         }

//         // Search
//         if (search && search.trim()) {
//             matchQuery.$or = [
//                 { taskName: { $regex: search, $options: "i" } },
//                 { taskDescription: { $regex: search, $options: "i" } },
//             ];
//         }

//         // Pagination
//         const pageNum = parseInt(page, 10);
//         const limitNum = parseInt(limit, 10);
//         const skip = (pageNum - 1) * limitNum;

//         // Get total count (before population)
//         const totalTasks = await tasksCollection.countDocuments(matchQuery);

//         // Main aggregation pipeline
//         const pipeline = [
//             { $match: matchQuery },

//             // === For STUDENTS: Join latest submission ===
//             ...(role === "STUDENT"
//                 ? [
//                     {
//                         $lookup: {
//                             from: TASK_SUBMISSION_COLLECTION,
//                             let: { taskId: "$_id", studentId: new ObjectId(id) },
//                             pipeline: [
//                                 {
//                                     $match: {
//                                         $expr: {
//                                             $and: [
//                                                 { $eq: ["$taskId", "$$taskId"] },
//                                                 { $eq: ["$studentId", "$$studentId"] },
//                                             ],
//                                         },
//                                     },
//                                 },
//                                 { $sort: { createdAt: -1 } }, // latest first
//                                 { $limit: 1 }, // only the most recent submission
//                             ],
//                             as: "latestSubmission",
//                         },
//                     },
//                     {
//                         $addFields: {
//                             submissionStatus: {
//                                 $cond: {
//                                     if: { $gt: [{ $size: "$latestSubmission" }, 0] },
//                                     then: { $arrayElemAt: ["$latestSubmission.currentStatus", 0] },
//                                     else: "NOT_STARTED",
//                                 },
//                             },
//                             latestSubmission: {
//                                 $cond: {
//                                     if: { $gt: [{ $size: "$latestSubmission" }, 0] },
//                                     then: { $arrayElemAt: ["$latestSubmission", 0] },
//                                     else: null,
//                                 },
//                             },
//                         },
//                     },
//                 ]
//                 : []),

//             // Populate course/chapter/lesson
//             {
//                 $lookup: {
//                     from: COURSE_COLLECTION,
//                     localField: "courseId",
//                     foreignField: "_id",
//                     as: "course",
//                 },
//             },
//             {
//                 $lookup: {
//                     from: CHAPTERS_COLLECTION,
//                     localField: "chapterId",
//                     foreignField: "_id",
//                     as: "chapter",
//                 },
//             },
//             {
//                 $lookup: {
//                     from: LESSONS_COLLECTION,
//                     localField: "lessonId",
//                     foreignField: "_id",
//                     as: "lesson",
//                 },
//             },
//             { $unwind: { path: "$course", preserveNullAndEmptyArrays: true } },
//             { $unwind: { path: "$chapter", preserveNullAndEmptyArrays: true } },
//             { $unwind: { path: "$lesson", preserveNullAndEmptyArrays: true } },

//             // Final projection
//             {
//                 $project: {
//                     _id: 1,
//                     courseId: 1,
//                     chapterId: 1,
//                     lessonId: 1,
//                     taskName: 1,
//                     taskDescription: 1,
//                     dueDateTime: 1,
//                     fileType: 1,
//                     fileUrls: 1,
//                     createdAt: 1,
//                     courseName: "$course.courseName",
//                     chapterName: "$chapter.chapterName",
//                     lessonName: "$lesson.lessonName",

//                     // Student-only fields
//                     ...(role === "STUDENT" && {
//                         submissionStatus: 1,
//                     }),
//                 },
//             },

//             { $sort: { createdAt: -1 } },
//             { $skip: skip },
//             { $limit: limitNum },
//         ];

//         const tasks = await tasksCollection.aggregate(pipeline).toArray();

//         // Pagination metadata
//         const totalPages = Math.ceil(totalTasks / limitNum);

//         set.status = 200;
//         return {
//             ok: true,
//             data: tasks,
//             pagination: {
//                 currentPage: pageNum,
//                 totalPages,
//                 totalTasks,
//                 limit: limitNum,
//                 hasNextPage: pageNum < totalPages,
//                 hasPrevPage: pageNum > 1,
//             },
//         };
//     } catch (error) {
//         console.error("Error getting tasks:", error);
//         set.status = 500;
//         return {
//             error: "Failed to get tasks",
//             details: error instanceof Error ? error.message : "Unknown error",
//         };
//     }
// };
export const getTasks = async (ctx: Context<{ query: TaskGetSchema }>) => {
    const { query, set, store } = ctx;
    const { id, role } = store as StoreType;
    const { courseId, chapterId, lessonId, search, page = "1", limit = "10" } = query;
    console.log(store, query)
    try {
        const tasksCollection = await getCollection(TASK_COLLECTION);
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

            // Only show non-expired tasks for students
            const currentDate = new Date();
            matchQuery.dueDateTime = { $gte: currentDate };
        }

        // Admin can filter by course optionally
        if (role === "ADMIN" && courseId && ObjectId.isValid(courseId)) {
            matchQuery.courseId = new ObjectId(courseId);
        }
        if (role === "STUDENT" && courseId && ObjectId.isValid(courseId)) {
            matchQuery.courseId = new ObjectId(courseId);
        }

        // Optional filters
        if (chapterId && ObjectId.isValid(chapterId)) {
            matchQuery.chapterId = new ObjectId(chapterId);
        }
        if (lessonId && ObjectId.isValid(lessonId)) {
            matchQuery.lessonId = new ObjectId(lessonId);
        }


        // Search
        if (search && search.trim()) {
            matchQuery.$or = [
                { taskName: { $regex: search, $options: "i" } },
                { taskDescription: { $regex: search, $options: "i" } },
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
                            from: TASK_SUBMISSION_COLLECTION,
                            let: { taskId: "$_id", studentId: new ObjectId(id) },
                            pipeline: [
                                {
                                    $match: {
                                        $expr: {
                                            $and: [
                                                { $eq: ["$taskId", "$$taskId"] },
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
                    taskName: 1,
                    taskDescription: 1,
                    dueDateTime: 1,
                    fileType: 1,
                    fileUrls: 1,
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


        const tasks = await tasksCollection.aggregate(pipeline).toArray();


        // Get total count with the same filter
        const countPipeline = [
            { $match: matchQuery },
            ...(role === "STUDENT"
                ? [
                    {
                        $lookup: {
                            from: TASK_SUBMISSION_COLLECTION,
                            let: { taskId: "$_id", studentId: new ObjectId(id) },
                            pipeline: [
                                {
                                    $match: {
                                        $expr: {
                                            $and: [
                                                { $eq: ["$taskId", "$$taskId"] },
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


        const countResult = await tasksCollection.aggregate(countPipeline).toArray();
        const totalTasks = countResult.length > 0 ? countResult[0].total : 0;

        // Pagination metadata
        const totalPages = Math.ceil(totalTasks / limitNum);

        set.status = 200;
        return {
            ok: true,
            data: tasks,
            pagination: {
                currentPage: pageNum,
                totalPages,
                totalTasks,
                limit: limitNum,
                hasNextPage: pageNum < totalPages,
                hasPrevPage: pageNum > 1,
            },
        };
    } catch (error) {
        console.error("Error getting tasks:", error);
        set.status = 500;
        return {
            error: "Failed to get tasks",
            details: error instanceof Error ? error.message : "Unknown error",
        };
    }
};
export const SubmitTasks = async (ctx: Context<{ body: TaskSubmitSchema }>) => {
    const { body, set, store } = ctx;
    const { id: studentId } = store as StoreType;
    const { taskId, submissionType, images, pdf, googleDriveLink, notes } = body;

    try {
        const tasksCollection = await getCollection(TASK_COLLECTION);
        const taskSubmissionCollection = await getCollection(TASK_SUBMISSION_COLLECTION);
        const submissionHistoryCollection = await getCollection(TASK_SUBMISSION_HISTORY_COLLECTION);
        const timelineCollection = await getCollection(TASK_TIMELINE_COLLECTION);
        const enrollmentCollection = await getCollection(COURSE_ENROLLMENT_COLLECTION);

        // Validate taskId
        if (!ObjectId.isValid(taskId)) {
            set.status = 400;
            return { error: "Invalid task ID" };
        }

        const task = await tasksCollection.findOne({
            _id: new ObjectId(taskId),
            isActive: true,
            isDeleted: false
        });
        console.log(task, "task")
        if (!task) {
            set.status = 404;
            return { error: "Task not found or inactive" };
        }

        // Check enrollment
        const enrollment = await enrollmentCollection.findOne({
            studentId: new ObjectId(studentId),
            courseId: new ObjectId(task.courseId),
            // status: "active"
        });
        console.log(studentId, task.courseId, "task")

        console.log(enrollment, "sss")
        if (!enrollment) {
            set.status = 403;
            return { error: "You must be enrolled in this course to submit tasks" };
        }

        // Check due date
        if (new Date() > new Date(task.dueDateTime)) {
            set.status = 400;
            return { error: "Task submission deadline has passed" };
        }

        let submissionUrls: string[] = [];
        let submissionData: any = {};

        // Handle file uploads
        if (submissionType === "IMAGES") {
            if (!images) {
                set.status = 400;
                return { error: "Images are required for IMAGES submission type" };
            }

            const imageFiles = Array.isArray(images) ? images : [images];
            for (const image of imageFiles) {
                const { fullUrl } = await uploadFileToS3(image, "task-submissions/images");
                submissionUrls.push(fullUrl);
            }

            submissionData = {
                type: "IMAGES",
                urls: submissionUrls
            };

        } else if (submissionType === "PDF") {
            if (!pdf) {
                set.status = 400;
                return { error: "PDF file is required for PDF submission type" };
            }
            const pdfFiles = Array.isArray(pdf) ? pdf : [pdf];
            for (const pdf of pdfFiles) {
                const { fullUrl } = await uploadFileToS3(pdf, "task-submissions/pdfs");
                submissionUrls.push(fullUrl);
            }
            submissionData = {
                type: "PDF",
                urls: submissionUrls
            };

        } else if (submissionType === "GOOGLE_DRIVE_LINK") {
            if (!googleDriveLink || !googleDriveLink.includes("drive.google.com")) {
                set.status = 400;
                return { error: "Valid Google Drive link is required" };
            }

            submissionData = {
                type: "GOOGLE_DRIVE_LINK",
                link: googleDriveLink
            };
        }

        const currentTime = new Date();

        // Get or create main submission record
        let mainSubmission = await taskSubmissionCollection.findOne({
            taskId: new ObjectId(taskId),
            studentId: new ObjectId(studentId)
        });

        let submissionNumber = 1;
        let mainSubmissionId: ObjectId;

        if (mainSubmission) {
            // Increment submission count
            submissionNumber = mainSubmission.totalSubmissions + 1;
            mainSubmissionId = mainSubmission._id;

            // Update main submission record
            await taskSubmissionCollection.updateOne(
                { _id: mainSubmissionId },
                {
                    $set: {
                        currentStatus: TaskStatus.SUBMITTED,
                        latestSubmissionNumber: submissionNumber,
                        updatedAt: currentTime
                    },
                    $inc: { totalSubmissions: 1 }
                }
            );
        } else {
            // Create new main submission record
            const newSubmission = {
                taskId: new ObjectId(taskId),
                studentId: new ObjectId(studentId),
                courseId: task.courseId,
                chapterId: task.chapterId,
                lessonId: task.lessonId,
                currentStatus: TaskStatus.SUBMITTED,
                totalSubmissions: 1,
                latestSubmissionNumber: 1,
                createdAt: currentTime,
                updatedAt: currentTime
            };

            const result = await taskSubmissionCollection.insertOne(newSubmission);
            mainSubmissionId = result.insertedId;
        }

        // Create submission history entry
        const historyEntry = {
            submissionId: mainSubmissionId,
            taskId: new ObjectId(taskId),
            studentId: new ObjectId(studentId),
            submissionNumber,
            submissionType,
            submissionData,
            notes: notes || "",
            status: TaskStatus.SUBMITTED,
            submittedAt: currentTime
        };

        const historyResult = await submissionHistoryCollection.insertOne(historyEntry);

        // Create timeline entry
        const timelineEntry = {
            submissionId: mainSubmissionId,
            historyId: historyResult.insertedId,
            submissionNumber,
            status: submissionNumber > 1 ? TaskStatus.RE_SUBMITTED : TaskStatus.SUBMITTED,
            timestamp: currentTime,
            note: submissionNumber > 1 ? "Re-submitted for review" : "Submitted for review",
            actor: new ObjectId(studentId),
            actorType: "STUDENT"
        };

        await timelineCollection.insertOne(timelineEntry);

        set.status = submissionNumber === 1 ? 201 : 200;
        return {
            message: submissionNumber === 1 ? "Task submitted successfully" : "Task resubmitted successfully",
            ok: true,
            submissionId: mainSubmissionId.toString(),
            submissionNumber,
            status: TaskStatus.SUBMITTED
        };

    } catch (error) {
        console.error("Error submitting task:", error);
        set.status = 500;
        return {
            error: "Failed to submit task",
            details: error instanceof Error ? error.message : "Unknown error"
        };
    }
};
export const ReviewTask = async (ctx: Context<{ body: TaskReviewSchema }>) => {
    const { body, set, store } = ctx;
    const { id: reviewerId } = store as StoreType;
    const { submissionId, status, feedback, rejectedItems } = body;

    try {
        const taskSubmissionCollection = await getCollection(TASK_SUBMISSION_COLLECTION);
        const submissionHistoryCollection = await getCollection(TASK_SUBMISSION_HISTORY_COLLECTION);
        const timelineCollection = await getCollection(TASK_TIMELINE_COLLECTION);
        const studentCollection = await getCollection(STUDENT_COLLECTION);

        // Validate submissionId
        if (!ObjectId.isValid(submissionId)) {
            set.status = 400;
            return { error: "Invalid submission ID" };
        }

        // Get main submission
        const submission = await taskSubmissionCollection.findOne({
            _id: new ObjectId(submissionId)
        });

        if (!submission) {
            set.status = 404;
            return { error: "Submission not found" };
        }

        // Check if submission is in submitted status
        if (submission.currentStatus !== TaskStatus.SUBMITTED) {
            set.status = 400;
            return { error: "Submission is not in submitted status" };
        }

        // Validate feedback for rejection
        if (status === "REJECTED" && !feedback) {
            set.status = 400;
            return { error: "Feedback is required when rejecting a submission" };
        }

        const currentTime = new Date();

        // Get the latest submission history entry
        const latestHistory = await submissionHistoryCollection.findOne(
            {
                submissionId: new ObjectId(submissionId),
                submissionNumber: submission.latestSubmissionNumber
            }
        );

        if (!latestHistory) {
            set.status = 404;
            return { error: "Latest submission history not found" };
        }

        // Prepare update data for submission history
        const historyUpdate: any = {
            status: status as TaskStatus,
            reviewedAt: currentTime,
            reviewedBy: new ObjectId(reviewerId),
            feedback: feedback || "",
        };

        // Add rejectedItems if provided and status is REJECTED
        if (status === "REJECTED" && rejectedItems && rejectedItems.length > 0) {
            historyUpdate.rejectedItems = rejectedItems;
        }

        // Update submission history with review
        await submissionHistoryCollection.updateOne(
            { _id: latestHistory._id },
            { $set: historyUpdate }
        );

        // Update main submission record
        await taskSubmissionCollection.updateOne(
            { _id: new ObjectId(submissionId) },
            {
                $set: {
                    currentStatus: status as TaskStatus,
                    updatedAt: currentTime
                }
            }
        );

        // Create timeline entry
        const timelineEntry = {
            submissionId: new ObjectId(submissionId),
            historyId: latestHistory._id,
            submissionNumber: submission.latestSubmissionNumber,
            status: status as TaskStatus,
            timestamp: currentTime,
            note: status === "COMPLETED" ? "Assignment marked as done" : "Re-submission requested",
            actor: new ObjectId(reviewerId),
            actorType: "ADMIN",
            feedback: feedback || "",
            ...(rejectedItems && rejectedItems.length > 0 && { rejectedItems })
        };

        await timelineCollection.insertOne(timelineEntry);

        const student = await studentCollection.findOne({
            _id: new ObjectId(submission.studentId)
        });

        if (student && student.fcmToken) {
            let notificationTitle = "";
            let notificationBody = "";

            if (status === "COMPLETED") {
                notificationTitle = "Task Completed! 🎉";
                notificationBody = "Congratulations! Your task submission has been approved.";
            } else if (status === "REJECTED") {
                notificationTitle = "Task Needs Revision 📝";
                notificationBody = feedback
                    ? `Your task was rejected. Feedback: ${feedback.substring(0, 100)}${feedback.length > 100 ? '...' : ''}`
                    : "Your task needs revision. Please check the feedback and resubmit.";
            }

            // Send notification (non-blocking)
            sendNotification(student.fcmToken, notificationTitle, notificationBody)
                .then((result) => {
                    if (result.ok) {
                        console.log(`Notification sent to student ${student._id}:`, result.messageId);
                    } else {
                        console.error(`Failed to send notification to student ${student._id}:`, result.error);
                    }
                })
                .catch((error) => {
                    console.error("Error sending notification:", error);
                });
        } else {
            console.log(`No FCM token found for student ${submission.studentId}`);
        }

        set.status = 200;
        return {
            message: status === "COMPLETED"
                ? "Task marked as completed"
                : "Task rejected, feedback sent to student",
            ok: true,
            status,
            submissionNumber: submission.latestSubmissionNumber
        };

    } catch (error) {
        console.error("Error reviewing task:", error);
        set.status = 500;
        return {
            error: "Failed to review task",
            details: error instanceof Error ? error.message : "Unknown error"
        };
    }
};
// Get Submissions - Optimized (returns only main records)
// export const GetSubmissions = async (ctx: Context<{ query: GetSubmissionsSchema }>) => {
//     const { query, set, store } = ctx;
//     const { id, role } = store as StoreType;
//     const { taskId, studentId, status, page = "1", limit = "10" } = query;

//     try {
//         const taskSubmissionCollection = await getCollection(TASK_SUBMISSION_COLLECTION);

//         let matchQuery: any = {};

//         if (role === "STUDENT") {
//             matchQuery.studentId = new ObjectId(id);
//         }

//         if (role === "ADMIN") {
//             if (studentId && ObjectId.isValid(studentId)) {
//                 matchQuery.studentId = new ObjectId(studentId);
//             }
//         }

//         if (taskId && ObjectId.isValid(taskId)) {
//             matchQuery.taskId = new ObjectId(taskId);
//         }

//         if (status) {
//             matchQuery.currentStatus = status;
//         }

//         const pageNum = parseInt(page);
//         const limitNum = parseInt(limit);
//         const skip = (pageNum - 1) * limitNum;

//         const totalSubmissions = await taskSubmissionCollection.countDocuments(matchQuery);

//         // Only fetch main submission records (lightweight)
//         const submissions = await taskSubmissionCollection.aggregate([
//             { $match: matchQuery },
//             {
//                 $lookup: {
//                     from: TASK_COLLECTION,
//                     localField: "taskId",
//                     foreignField: "_id",
//                     as: "task"
//                 }
//             },
//             {
//                 $lookup: {
//                     from: STUDENT_COLLECTION,
//                     localField: "studentId",
//                     foreignField: "_id",
//                     as: "student"
//                 }
//             },
//             {
//                 $lookup: {
//                     from: CHAPTER_COLLECTION,
//                     localField: "task.chapterId",
//                     foreignField: "_id",
//                     as: "chapter",
//                 },
//             },
//             {
//                 $lookup: {
//                     from: LESSON_COLLECTION,
//                     localField: "task.lessonId",
//                     foreignField: "_id",
//                     as: "lesson",
//                 },
//             },
//             { $unwind: { path: "$chapter", preserveNullAndEmptyArrays: true } },

//             { $unwind: { path: "$lesson", preserveNullAndEmptyArrays: true } },

//             {
//                 $unwind: { path: "$task", preserveNullAndEmptyArrays: true }
//             },
//             {
//                 $unwind: { path: "$student", preserveNullAndEmptyArrays: true }
//             },
//             {
//                 $project: {
//                     _id: 1,
//                     taskId: 1,
//                     studentId: 1,
//                     currentStatus: 1,
//                     totalSubmissions: 1,
//                     latestSubmissionNumber: 1,
//                     submittedAt: "$createdAt",
//                     taskName: "$task.taskName",
//                     taskDescription: "$task.taskDescription",
//                     taskDueDate: "$task.dueDateTime",
//                     taskCreatedAt: "$task.createdAt",
//                     chapterName: "$chapter.chapterName",
//                     lessonName: "$lesson.lessonName",
//                     ...(role === "ADMIN" && {
//                         studentName: "$student.studentName",
//                         studentPhoneNumber: "$student.studentPhoneNumber",
//                         studentEmail: "$student.email",
//                     }),
//                 }
//             },
//             { $sort: { updatedAt: -1 } },
//             { $skip: skip },
//             { $limit: limitNum }
//         ]).toArray();

//         const totalPages = Math.ceil(totalSubmissions / limitNum);

//         set.status = 200;
//         return {
//             ok: true,
//             data: submissions,
//             pagination: {
//                 currentPage: pageNum,
//                 totalPages,
//                 totalSubmissions,
//                 limit: limitNum,
//                 hasNextPage: pageNum < totalPages,
//                 hasPrevPage: pageNum > 1
//             }
//         };

//     } catch (error) {
//         console.error("Error getting submissions:", error);
//         set.status = 500;
//         return {
//             error: "Failed to get submissions",
//             details: error instanceof Error ? error.message : "Unknown error"
//         };
//     }
// };
export const GetSubmissions = async (ctx: Context<{ query: GetSubmissionsSchema }>) => {
    const { query, set, store } = ctx;
    const { id, role } = store as StoreType;
    const { taskId, studentId, status, page = "1", limit = "10" } = query;

    try {
        const taskSubmissionCollection = await getCollection(TASK_SUBMISSION_COLLECTION);

        let matchQuery: any = {};

        if (role === "STUDENT") {
            matchQuery.studentId = new ObjectId(id);
        }

        if (role === "ADMIN") {
            if (studentId && ObjectId.isValid(studentId)) {
                matchQuery.studentId = new ObjectId(studentId);
            }
        }

        if (taskId && ObjectId.isValid(taskId)) {
            matchQuery.taskId = new ObjectId(taskId);
        }

        if (status) {
            matchQuery.currentStatus = status;
        }

        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;

        const totalSubmissions = await taskSubmissionCollection.countDocuments(matchQuery);

        const submissions = await taskSubmissionCollection.aggregate([
            { $match: matchQuery },

            // Lookup main task info
            {
                $lookup: {
                    from: TASK_COLLECTION,
                    localField: "taskId",
                    foreignField: "_id",
                    as: "task"
                }
            },
            { $unwind: { path: "$task", preserveNullAndEmptyArrays: true } },

            // Lookup student (only needed for ADMIN)
            ...(role === "ADMIN" ? [{
                $lookup: {
                    from: STUDENT_COLLECTION,
                    localField: "studentId",
                    foreignField: "_id",
                    as: "student"
                }
            }, { $unwind: { path: "$student", preserveNullAndEmptyArrays: true } }] : []),

            // Lookup chapter & lesson
            {
                $lookup: {
                    from: CHAPTERS_COLLECTION,
                    localField: "task.chapterId",
                    foreignField: "_id",
                    as: "chapter"
                }
            },
            { $unwind: { path: "$chapter", preserveNullAndEmptyArrays: true } },

            {
                $lookup: {
                    from: LESSONS_COLLECTION,
                    localField: "task.lessonId",
                    foreignField: "_id",
                    as: "lesson"
                }
            },
            { $unwind: { path: "$lesson", preserveNullAndEmptyArrays: true } },

            // ───────────────────────────────────────────────
            // NEW: Lookup the LATEST submission history entry
            // ───────────────────────────────────────────────
            {
                $lookup: {
                    from: TASK_SUBMISSION_HISTORY_COLLECTION,
                    let: { submissionId: "$_id" },
                    pipeline: [
                        { $match: { $expr: { $eq: ["$submissionId", "$$submissionId"] } } },
                        { $sort: { submittedAt: -1 } },           // newest first
                        { $limit: 1 },                            // only keep latest
                        {
                            $project: {
                                submissionNumber: 1,
                                submissionType: 1,
                                submissionData: 1,
                                notes: 1,
                                status: 1,
                                feedback: 1,
                                reviewedAt: 1,
                                reviewedBy: 1,
                                submittedAt: 1
                            }
                        }
                    ],
                    as: "latestHistory"
                }
            },
            {
                $addFields: {
                    latestHistory: { $arrayElemAt: ["$latestHistory", 0] }   // unwrap array → object or null
                }
            },

            // Final projection
            {
                $project: {
                    _id: 1,
                    taskId: 1,
                    studentId: 1,
                    currentStatus: 1,
                    totalSubmissions: 1,
                    latestSubmissionNumber: 1,
                    submittedAt: "$createdAt",           // main submission createdAt
                    taskName: "$task.taskName",
                    taskDescription: "$task.taskDescription",
                    taskDueDate: "$task.dueDateTime",
                    taskCreatedAt: "$task.createdAt",
                    chapterName: "$chapter.chapterName",
                    lessonName: "$lesson.lessonName",
                    latestSubmissionType: "$latestHistory.submissionType",
                    latestSubmissionData: "$latestHistory.submissionData",
                    latestNotes: "$latestHistory.notes",
                    latestStatus: "$latestHistory.status",
                    latestFeedback: "$latestHistory.feedback",
                    // Student info (ADMIN only)
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
// Get Submission History - New endpoint to fetch all attempts
export const GetSubmissionHistory = async (ctx: Context<{ query: GetSubmissionHistorySchema }>) => {
    const { query, set, store } = ctx;
    const { id, role } = store as StoreType;
    const { submissionId, page = "1", limit = "10" } = query;

    try {
        const taskSubmissionCollection = await getCollection(TASK_SUBMISSION_COLLECTION);
        const submissionHistoryCollection = await getCollection(TASK_SUBMISSION_HISTORY_COLLECTION);

        if (!ObjectId.isValid(submissionId)) {
            set.status = 400;
            return { error: "Invalid submission ID" };
        }

        // Verify access
        const mainSubmission = await taskSubmissionCollection.findOne({
            _id: new ObjectId(submissionId),
            ...(role === "STUDENT" && { studentId: new ObjectId(id) })
        });

        if (!mainSubmission) {
            set.status = 404;
            return { error: "Submission not found or access denied" };
        }

        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;

        const totalHistory = await submissionHistoryCollection.countDocuments({
            submissionId: new ObjectId(submissionId)
        });

        // Fetch submission history with reviewer details
        const history = await submissionHistoryCollection.aggregate([
            { $match: { submissionId: new ObjectId(submissionId) } },
            {
                $lookup: {
                    from: "users",
                    localField: "reviewedBy",
                    foreignField: "_id",
                    as: "reviewer"
                }
            },
            {
                $unwind: { path: "$reviewer", preserveNullAndEmptyArrays: true }
            },
            {
                $project: {
                    _id: 1,
                    submissionNumber: 1,
                    submissionType: 1,
                    submissionData: 1,
                    notes: 1,
                    status: 1,
                    submittedAt: 1,
                    reviewedAt: 1,
                    feedback: 1,
                    rejectedItems: 1,
                    reviewerName: "$reviewer.name",
                    reviewerEmail: "$reviewer.email"
                }
            },
            { $sort: { submissionNumber: -1 } },
            { $skip: skip },
            { $limit: limitNum }
        ]).toArray();

        const totalPages = Math.ceil(totalHistory / limitNum);

        set.status = 200;
        return {
            ok: true,
            data: history,
            mainSubmission: {
                currentStatus: mainSubmission.currentStatus,
                totalSubmissions: mainSubmission.totalSubmissions,
                latestSubmissionNumber: mainSubmission.latestSubmissionNumber
            },
            pagination: {
                currentPage: pageNum,
                totalPages,
                totalHistory,
                limit: limitNum,
                hasNextPage: pageNum < totalPages,
                hasPrevPage: pageNum > 1
            }
        };

    } catch (error) {
        console.error("Error getting submission history:", error);
        set.status = 500;
        return {
            error: "Failed to get submission history",
            details: error instanceof Error ? error.message : "Unknown error"
        };
    }
};
// Get Timeline - New endpoint to fetch timeline events
export const GetTimeline = async (ctx: Context<{ params: { submissionId: string } }>) => {
    const { params, set, store } = ctx;
    const { id, role } = store as StoreType;
    const { submissionId } = params;

    try {
        const taskSubmissionCollection = await getCollection(TASK_SUBMISSION_COLLECTION);
        const timelineCollection = await getCollection(TASK_TIMELINE_COLLECTION);

        if (!ObjectId.isValid(submissionId)) {
            set.status = 400;
            return { error: "Invalid submission ID" };
        }

        // Verify access
        const mainSubmission = await taskSubmissionCollection.findOne({
            _id: new ObjectId(submissionId),
            ...(role === "STUDENT" && { studentId: new ObjectId(id) })
        });

        if (!mainSubmission) {
            set.status = 404;
            return { error: "Submission not found or access denied" };
        }

        // Fetch timeline with actor details
        const timeline = await timelineCollection.aggregate([
            { $match: { submissionId: new ObjectId(submissionId) } },
            {
                $lookup: {
                    from: "users",
                    localField: "actor",
                    foreignField: "_id",
                    as: "actorDetails"
                }
            },
            {
                $unwind: { path: "$actorDetails", preserveNullAndEmptyArrays: true }
            },
            {
                $project: {
                    _id: 1,
                    submissionNumber: 1,
                    status: 1,
                    timestamp: 1,
                    note: 1,
                    actorType: 1,
                    feedback: 1,
                    actorName: "$actorDetails.name",
                    actorEmail: "$actorDetails.email"
                }
            },
            { $sort: { timestamp: 1 } }
        ]).toArray();

        set.status = 200;
        return {
            ok: true,
            data: timeline
        };

    } catch (error) {
        console.error("Error getting timeline:", error);
        set.status = 500;
        return {
            error: "Failed to get timeline",
            details: error instanceof Error ? error.message : "Unknown error"
        };
    }
};
// Get Submission Details (Complete view with latest submission)
export const GetSubmissionDetails = async (ctx: Context<{ params: { id: string } }>) => {
    const { params, set, store } = ctx;
    const { id: userId, role } = store as StoreType;
    const { id: submissionId } = params;

    try {
        const taskSubmissionCollection = await getCollection(TASK_SUBMISSION_COLLECTION);
        const submissionHistoryCollection = await getCollection(TASK_SUBMISSION_HISTORY_COLLECTION);

        if (!ObjectId.isValid(submissionId)) {
            set.status = 400;
            return { error: "Invalid submission ID" };
        }

        // Get main submission with task and student details
        const submission = await taskSubmissionCollection.aggregate([
            {
                $match: {
                    _id: new ObjectId(submissionId),
                    ...(role === "STUDENT" && { studentId: new ObjectId(userId) })
                }
            },
            {
                $lookup: {
                    from: TASK_COLLECTION,
                    localField: "taskId",
                    foreignField: "_id",
                    as: "task"
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "studentId",
                    foreignField: "_id",
                    as: "student"
                }
            },
            {
                $unwind: { path: "$task", preserveNullAndEmptyArrays: true }
            },
            {
                $unwind: { path: "$student", preserveNullAndEmptyArrays: true }
            },
            {
                $project: {
                    _id: 1,
                    taskId: 1,
                    studentId: 1,
                    currentStatus: 1,
                    totalSubmissions: 1,
                    latestSubmissionNumber: 1,
                    createdAt: 1,
                    updatedAt: 1,
                    task: {
                        _id: "$task._id",
                        taskName: "$task.taskName",
                        taskDescription: "$task.taskDescription",
                        dueDateTime: "$task.dueDateTime",
                        fileType: "$task.fileType",
                        fileUrls: "$task.fileUrls"
                    },
                    student: {
                        _id: "$student._id",
                        name: "$student.name",
                        email: "$student.email"
                    }
                }
            }
        ]).toArray();

        if (!submission || submission.length === 0) {
            set.status = 404;
            return { error: "Submission not found" };
        }

        const mainSubmission = submission[0];

        // Get only the latest submission history
        const latestHistory = await submissionHistoryCollection.aggregate([
            {
                $match: {
                    submissionId: new ObjectId(submissionId),
                    submissionNumber: mainSubmission.latestSubmissionNumber
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "reviewedBy",
                    foreignField: "_id",
                    as: "reviewer"
                }
            },
            {
                $unwind: { path: "$reviewer", preserveNullAndEmptyArrays: true }
            },
            {
                $project: {
                    _id: 1,
                    submissionNumber: 1,
                    submissionType: 1,
                    submissionData: 1,
                    notes: 1,
                    status: 1,
                    submittedAt: 1,
                    reviewedAt: 1,
                    feedback: 1,
                    rejectedItems: 1,
                    reviewerName: "$reviewer.name",
                    reviewerEmail: "$reviewer.email"
                }
            }
        ]).toArray();

        set.status = 200;
        return {
            ok: true,
            data: {
                ...mainSubmission,
                latestSubmission: latestHistory[0] || null
            }
        };

    } catch (error) {
        console.error("Error getting submission details:", error);
        set.status = 500;
        return {
            error: "Failed to get submission details",
            details: error instanceof Error ? error.message : "Unknown error"
        };
    }
};
